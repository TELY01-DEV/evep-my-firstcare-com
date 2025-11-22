#!/usr/bin/env python3

"""
FIFO Change Manager Service
Core service for managing field-level changes in FIFO order
Eliminates data loss from concurrent edits
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from pymongo.database import Database
import logging
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConflictResolutionStrategy(Enum):
    """Strategies for resolving field conflicts"""
    FIFO_WINS = "fifo_wins"  # First change wins
    LATEST_WINS = "latest_wins"  # Last change wins  
    MERGE_VALUES = "merge_values"  # Attempt to merge
    MANUAL_RESOLUTION = "manual_resolution"  # Require human decision

@dataclass
class FieldChange:
    """Represents a single field change in FIFO queue"""
    session_id: str
    step_number: int
    field_path: str  # e.g., "patient_info.first_name" 
    old_value: Any
    new_value: Any
    user_id: str
    user_name: str
    timestamp: datetime
    change_id: str
    is_processed: bool = False
    conflict_detected: bool = False
    resolution_strategy: Optional[str] = None

@dataclass
class FieldConflict:
    """Represents a conflict between field changes"""
    session_id: str
    step_number: int
    field_path: str
    conflicting_changes: List[str]  # change_ids
    detected_at: datetime
    resolution_strategy: str
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    final_value: Optional[Any] = None

class FIFOChangeManager:
    """
    Core FIFO Change Manager Service
    Manages field-level changes to prevent data loss
    """
    
    def __init__(self, mongodb_url: str = "mongodb://localhost:27017", db_name: str = "evep_system"):
        self.mongodb_url = mongodb_url
        self.db_name = db_name
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize database connection and collections"""
        try:
            self.client = MongoClient(self.mongodb_url)
            self.db = self.client[self.db_name]
            
            # Create collections with proper indexing
            self._create_collections()
            logger.info("FIFO Change Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    def _create_collections(self):
        """Create and index FIFO management collections"""
        collections = {
            'field_change_queue': [
                ('session_id', 1),
                ('step_number', 1), 
                ('field_path', 1),
                ('timestamp', 1),
                ('is_processed', 1)
            ],
            'field_conflicts': [
                ('session_id', 1),
                ('step_number', 1),
                ('field_path', 1),
                ('detected_at', 1)
            ],
            'field_versions': [
                ('session_id', 1),
                ('step_number', 1),
                ('field_path', 1),
                ('version', 1)
            ],
            'fifo_processing_logs': [
                ('session_id', 1),
                ('timestamp', 1),
                ('event_type', 1)
            ]
        }
        
        for collection_name, indexes in collections.items():
            collection = self.db[collection_name]
            for index_fields in indexes:
                try:
                    collection.create_index([index_fields])
                except Exception as e:
                    logger.warning(f"Index creation warning for {collection_name}: {e}")
    
    async def queue_field_change(self, change: FieldChange) -> bool:
        """
        Queue a field change in FIFO order
        
        Args:
            change: FieldChange object with all change details
            
        Returns:
            bool: True if change queued successfully
        """
        try:
            # Convert change to document
            change_doc = asdict(change)
            change_doc['timestamp'] = change.timestamp or datetime.now(timezone.utc)
            
            # Insert into change queue
            result = self.db.field_change_queue.insert_one(change_doc)
            
            if result.inserted_id:
                logger.info(f"Field change queued: {change.session_id}/{change.field_path}")
                
                # Check for conflicts
                await self._detect_conflicts(change)
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to queue field change: {e}")
            return False
    
    async def _detect_conflicts(self, change: FieldChange):
        """Detect conflicts with existing queued changes"""
        try:
            # Find other unprocessed changes for the same field
            existing_changes = list(self.db.field_change_queue.find({
                'session_id': change.session_id,
                'step_number': change.step_number,
                'field_path': change.field_path,
                'is_processed': False,
                'change_id': {'$ne': change.change_id}
            }))
            
            if existing_changes:
                # Conflict detected!
                conflict_change_ids = [ch['change_id'] for ch in existing_changes] + [change.change_id]
                
                conflict = FieldConflict(
                    session_id=change.session_id,
                    step_number=change.step_number,
                    field_path=change.field_path,
                    conflicting_changes=conflict_change_ids,
                    detected_at=datetime.now(timezone.utc),
                    resolution_strategy=ConflictResolutionStrategy.FIFO_WINS.value
                )
                
                # Store conflict
                self.db.field_conflicts.insert_one(asdict(conflict))
                
                # Mark changes as having conflicts
                self.db.field_change_queue.update_many(
                    {'change_id': {'$in': conflict_change_ids}},
                    {'$set': {'conflict_detected': True}}
                )
                
                logger.warning(f"Conflict detected for field {change.field_path} in session {change.session_id}")
                
        except Exception as e:
            logger.error(f"Failed to detect conflicts: {e}")
    
    async def process_fifo_changes(self, session_id: str, step_number: int) -> Dict[str, Any]:
        """
        Process all queued changes for a session step in FIFO order
        
        Args:
            session_id: Workflow session ID
            step_number: Step number to process
            
        Returns:
            Dict with final field values after FIFO processing
        """
        try:
            # Get all unprocessed changes for this session/step, ordered by timestamp (FIFO)
            changes_cursor = self.db.field_change_queue.find({
                'session_id': session_id,
                'step_number': step_number,
                'is_processed': False
            }).sort('timestamp', 1)  # FIFO order
            
            changes = list(changes_cursor)
            final_values = {}
            processing_log = []
            
            logger.info(f"Processing {len(changes)} FIFO changes for {session_id}/step-{step_number}")
            
            for change_doc in changes:
                field_path = change_doc['field_path']
                new_value = change_doc['new_value']
                user_name = change_doc['user_name']
                timestamp = change_doc['timestamp']
                
                # Apply FIFO logic based on conflict resolution strategy
                if change_doc.get('conflict_detected'):
                    resolution = await self._resolve_conflict(change_doc)
                    if resolution['apply_change']:
                        final_values[field_path] = new_value
                        processing_log.append(f"FIFO: Applied {field_path}={new_value} by {user_name} (conflict resolved)")
                    else:
                        processing_log.append(f"FIFO: Skipped {field_path}={new_value} by {user_name} (conflict resolution)")
                else:
                    # No conflict - apply change
                    final_values[field_path] = new_value
                    processing_log.append(f"FIFO: Applied {field_path}={new_value} by {user_name}")
                
                # Mark change as processed
                self.db.field_change_queue.update_one(
                    {'change_id': change_doc['change_id']},
                    {'$set': {'is_processed': True, 'processed_at': datetime.now(timezone.utc)}}
                )
            
            # Log processing results
            self.db.fifo_processing_logs.insert_one({
                'session_id': session_id,
                'step_number': step_number,
                'timestamp': datetime.now(timezone.utc),
                'event_type': 'fifo_processing_complete',
                'changes_processed': len(changes),
                'final_field_count': len(final_values),
                'processing_log': processing_log
            })
            
            logger.info(f"FIFO processing complete: {len(final_values)} final fields")
            return final_values
            
        except Exception as e:
            logger.error(f"Failed to process FIFO changes: {e}")
            return {}
    
    async def _resolve_conflict(self, change_doc: Dict) -> Dict[str, Any]:
        """
        Resolve field conflict based on strategy
        
        Args:
            change_doc: Change document from queue
            
        Returns:
            Dict with resolution decision
        """
        try:
            # Get conflict record
            conflict = self.db.field_conflicts.find_one({
                'session_id': change_doc['session_id'],
                'step_number': change_doc['step_number'],
                'field_path': change_doc['field_path'],
                'resolved_at': None
            })
            
            if not conflict:
                return {'apply_change': True, 'reason': 'no_conflict'}
            
            strategy = conflict.get('resolution_strategy', ConflictResolutionStrategy.FIFO_WINS.value)
            
            if strategy == ConflictResolutionStrategy.FIFO_WINS.value:
                # FIFO wins - first change in chronological order wins
                conflicting_changes = conflict['conflicting_changes']
                earliest_change = self.db.field_change_queue.find_one({
                    'change_id': {'$in': conflicting_changes}
                }, sort=[('timestamp', 1)])
                
                if earliest_change and earliest_change['change_id'] == change_doc['change_id']:
                    # This is the earliest change - apply it
                    self._mark_conflict_resolved(conflict, change_doc['change_id'], change_doc['new_value'])
                    return {'apply_change': True, 'reason': 'fifo_winner'}
                else:
                    return {'apply_change': False, 'reason': 'fifo_loser'}
                    
            elif strategy == ConflictResolutionStrategy.LATEST_WINS.value:
                # Latest wins - last change chronologically wins
                conflicting_changes = conflict['conflicting_changes'] 
                latest_change = self.db.field_change_queue.find_one({
                    'change_id': {'$in': conflicting_changes}
                }, sort=[('timestamp', -1)])
                
                if latest_change and latest_change['change_id'] == change_doc['change_id']:
                    self._mark_conflict_resolved(conflict, change_doc['change_id'], change_doc['new_value'])
                    return {'apply_change': True, 'reason': 'latest_winner'}
                else:
                    return {'apply_change': False, 'reason': 'latest_loser'}
            
            # Default to FIFO wins
            return {'apply_change': True, 'reason': 'default_fifo'}
            
        except Exception as e:
            logger.error(f"Failed to resolve conflict: {e}")
            return {'apply_change': True, 'reason': 'error_fallback'}
    
    def _mark_conflict_resolved(self, conflict: Dict, winning_change_id: str, final_value: Any):
        """Mark conflict as resolved with winning change"""
        try:
            self.db.field_conflicts.update_one(
                {'_id': conflict['_id']},
                {'$set': {
                    'resolved_at': datetime.now(timezone.utc),
                    'resolved_by': winning_change_id,
                    'final_value': final_value
                }}
            )
        except Exception as e:
            logger.error(f"Failed to mark conflict resolved: {e}")
    
    def get_field_history(self, session_id: str, field_path: str) -> List[Dict]:
        """Get complete history of changes for a field"""
        try:
            changes = list(self.db.field_change_queue.find({
                'session_id': session_id,
                'field_path': field_path
            }).sort('timestamp', 1))
            
            return changes
            
        except Exception as e:
            logger.error(f"Failed to get field history: {e}")
            return []
    
    def get_processing_stats(self, session_id: str) -> Dict[str, Any]:
        """Get FIFO processing statistics for a session"""
        try:
            stats = {
                'total_changes': self.db.field_change_queue.count_documents({'session_id': session_id}),
                'processed_changes': self.db.field_change_queue.count_documents({
                    'session_id': session_id, 
                    'is_processed': True
                }),
                'pending_changes': self.db.field_change_queue.count_documents({
                    'session_id': session_id,
                    'is_processed': False
                }),
                'total_conflicts': self.db.field_conflicts.count_documents({'session_id': session_id}),
                'resolved_conflicts': self.db.field_conflicts.count_documents({
                    'session_id': session_id,
                    'resolved_at': {'$ne': None}
                })
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get processing stats: {e}")
            return {}
    
    def cleanup_old_changes(self, days_old: int = 30):
        """Clean up old processed changes and logs"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            # Clean old processed changes
            result1 = self.db.field_change_queue.delete_many({
                'is_processed': True,
                'processed_at': {'$lt': cutoff_date}
            })
            
            # Clean old processing logs
            result2 = self.db.fifo_processing_logs.delete_many({
                'timestamp': {'$lt': cutoff_date}
            })
            
            logger.info(f"Cleanup: Removed {result1.deleted_count} old changes, {result2.deleted_count} old logs")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old changes: {e}")
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()

# Example usage and testing
if __name__ == "__main__":
    import asyncio
    from datetime import timedelta
    import uuid
    
    async def test_fifo_manager():
        """Test the FIFO Change Manager"""
        print("🧪 Testing FIFO Change Manager...")
        
        manager = FIFOChangeManager()
        
        # Test session
        session_id = "test_session_001"
        step_number = 1
        
        # Simulate concurrent field changes
        changes = [
            FieldChange(
                session_id=session_id,
                step_number=step_number,
                field_path="patient_info.first_name",
                old_value="John",
                new_value="Jonathan",
                user_id="user1",
                user_name="Dr. Smith",
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            ),
            FieldChange(
                session_id=session_id,
                step_number=step_number, 
                field_path="patient_info.first_name",  # Same field - conflict!
                old_value="John",
                new_value="Johnny", 
                user_id="user2",
                user_name="Nurse Johnson",
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=2),
                change_id=str(uuid.uuid4())
            ),
            FieldChange(
                session_id=session_id,
                step_number=step_number,
                field_path="patient_info.last_name",
                old_value="Doe",
                new_value="Smith",
                user_id="user1", 
                user_name="Dr. Smith",
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=1),
                change_id=str(uuid.uuid4())
            )
        ]
        
        # Queue all changes
        for change in changes:
            success = await manager.queue_field_change(change)
            print(f"✅ Queued change: {change.field_path} = {change.new_value} by {change.user_name}")
        
        # Process FIFO changes
        final_values = await manager.process_fifo_changes(session_id, step_number)
        print(f"\n🎯 Final FIFO Values: {final_values}")
        
        # Get stats
        stats = manager.get_processing_stats(session_id)
        print(f"\n📊 Processing Stats: {stats}")
        
        # Get field history
        history = manager.get_field_history(session_id, "patient_info.first_name")
        print(f"\n📋 Field History: {len(history)} changes")
        
        manager.close()
        print("✅ FIFO Manager test complete!")
    
    # Run test
    asyncio.run(test_fifo_manager())