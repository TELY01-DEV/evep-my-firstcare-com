#!/usr/bin/env python3

"""
Enhanced Hospital Mobile Workflow API with FIFO Field-Level Change Management
Fixed version without FastAPI dependencies for integration testing
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

# Simplified models for initial deployment
class FIFOStepUpdateRequest:
    def __init__(self, session_id: str, step_number: int, data: Dict[str, Any], 
                 user_id: str, user_name: str, force_immediate_save: bool = False,
                 conflict_resolution_strategy: str = "fifo_wins"):
        self.session_id = session_id
        self.step_number = step_number
        self.data = data
        self.user_id = user_id
        self.user_name = user_name
        self.force_immediate_save = force_immediate_save
        self.conflict_resolution_strategy = conflict_resolution_strategy

# Test function to verify FIFO manager integration
async def test_fifo_integration():
    """Test FIFO integration without FastAPI dependencies"""
    try:
        # Import FIFO manager
        from fifo_change_manager import FIFOChangeManager, FieldChange
        
        print("🧪 Testing FIFO Integration...")
        
        # Initialize FIFO manager with production MongoDB URL
        mongodb_url = "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
        manager = FIFOChangeManager(mongodb_url=mongodb_url, db_name="evep")
        
        # Test session
        session_id = f"test_integration_{int(datetime.now().timestamp())}"
        step_number = 1
        
        print(f"📋 Test Session: {session_id}")
        
        # Create test field change
        change = FieldChange(
            session_id=session_id,
            step_number=step_number,
            field_path="patient_info.test_field",
            old_value="old_test",
            new_value="new_test",
            user_id="test_user",
            user_name="Integration Test User",
            timestamp=datetime.now(timezone.utc),
            change_id=str(uuid.uuid4())
        )
        
        # Queue the change
        success = await manager.queue_field_change(change)
        if success:
            print("✅ Field change queued successfully")
            
            # Process FIFO changes
            final_values = await manager.process_fifo_changes(session_id, step_number)
            print(f"✅ FIFO processing complete: {final_values}")
            
            # Get stats
            stats = manager.get_processing_stats(session_id)
            print(f"📊 Processing stats: {stats}")
            
        else:
            print("❌ Failed to queue field change")
        
        manager.close()
        return True
        
    except Exception as e:
        print(f"❌ FIFO integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

# Placeholder API endpoints (will be replaced with FastAPI when integrated)
async def update_step_with_fifo_placeholder(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Placeholder for FIFO step update endpoint"""
    try:
        from fifo_change_manager import FIFOChangeManager, FieldChange
        
        # Extract request data
        session_id = request_data.get('session_id')
        step_number = request_data.get('step_number')
        data = request_data.get('data', {})
        user_id = request_data.get('user_id')
        user_name = request_data.get('user_name')
        
        # Initialize FIFO manager
        mongodb_url = "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
        fifo_mgr = FIFOChangeManager(mongodb_url=mongodb_url, db_name="evep")
        
        # Queue field changes
        change_ids = []
        for field_path, new_value in data.items():
            change = FieldChange(
                session_id=session_id,
                step_number=step_number,
                field_path=field_path,
                old_value=None,
                new_value=new_value,
                user_id=user_id,
                user_name=user_name,
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            )
            
            success = await fifo_mgr.queue_field_change(change)
            if success:
                change_ids.append(change.change_id)
        
        # Process changes
        final_values = await fifo_mgr.process_fifo_changes(session_id, step_number)
        
        fifo_mgr.close()
        
        return {
            "status": "success",
            "message": "FIFO processing completed",
            "changes_queued": len(change_ids),
            "final_values": final_values
        }
        
    except Exception as e:
        logger.error(f"FIFO update failed: {e}")
        return {
            "status": "error",
            "message": f"FIFO update failed: {str(e)}"
        }

# Test database collections creation
async def create_fifo_collections():
    """Create FIFO collections if they don't exist"""
    try:
        from pymongo import MongoClient
        
        mongodb_url = "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=5000)
        
        db = client.evep
        existing_collections = db.list_collection_names()
        
        fifo_collections = [
            'field_change_queue',
            'field_conflicts', 
            'field_versions',
            'fifo_processing_logs',
            'hospital_mobile_workflow_sessions'  # Add this for workflow sessions
        ]
        
        created_collections = []
        for collection_name in fifo_collections:
            if collection_name not in existing_collections:
                # Create collection by inserting a test document then removing it
                collection = db[collection_name]
                test_doc = {"_test": True, "created_at": datetime.now(timezone.utc)}
                result = collection.insert_one(test_doc)
                collection.delete_one({"_id": result.inserted_id})
                created_collections.append(collection_name)
                print(f"✅ Created collection: {collection_name}")
            else:
                print(f"✅ Collection exists: {collection_name}")
        
        if created_collections:
            print(f"📁 Created {len(created_collections)} new FIFO collections")
        
        # Create indexes for better performance
        await create_fifo_indexes(db)
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to create FIFO collections: {e}")
        return False

async def create_fifo_indexes(db):
    """Create indexes for FIFO collections"""
    try:
        # Indexes for field_change_queue
        db.field_change_queue.create_index([
            ("session_id", 1),
            ("step_number", 1),
            ("timestamp", 1)
        ])
        
        db.field_change_queue.create_index([
            ("session_id", 1),
            ("field_path", 1),
            ("is_processed", 1)
        ])
        
        # Indexes for field_conflicts
        db.field_conflicts.create_index([
            ("session_id", 1),
            ("step_number", 1),
            ("field_path", 1)
        ])
        
        # Indexes for hospital_mobile_workflow_sessions
        db.hospital_mobile_workflow_sessions.create_index([
            ("session_id", 1)
        ])
        
        db.hospital_mobile_workflow_sessions.create_index([
            ("created_by", 1),
            ("created_at", 1)
        ])
        
        print("✅ FIFO indexes created successfully")
        
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")

# Test function for comprehensive FIFO system validation
async def comprehensive_fifo_test():
    """Comprehensive test of FIFO system"""
    print("🚀 === COMPREHENSIVE FIFO SYSTEM TEST ===")
    print(f"Test started: {datetime.now()}")
    print()
    
    # Test 1: Database connection
    print("🔍 Test 1: Database Connection...")
    try:
        from pymongo import MongoClient
        mongodb_url = "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ Database connection successful")
        client.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # Test 2: FIFO collections creation
    print("\n📁 Test 2: FIFO Collections Creation...")
    collections_created = await create_fifo_collections()
    if not collections_created:
        print("❌ Collections creation failed")
        return False
    
    # Test 3: FIFO manager integration
    print("\n🔄 Test 3: FIFO Manager Integration...")
    fifo_test = await test_fifo_integration()
    if not fifo_test:
        print("❌ FIFO integration failed")
        return False
    
    # Test 4: Placeholder API endpoint
    print("\n🌐 Test 4: API Endpoint Simulation...")
    test_request = {
        "session_id": f"comprehensive_test_{int(datetime.now().timestamp())}",
        "step_number": 1,
        "data": {
            "patient_info.name": "Test Patient",
            "medical_history.conditions": "Test condition"
        },
        "user_id": "test_user_1",
        "user_name": "Test User 1"
    }
    
    api_result = await update_step_with_fifo_placeholder(test_request)
    if api_result.get('status') == 'success':
        print("✅ API endpoint simulation successful")
        print(f"📊 Result: {api_result}")
    else:
        print(f"❌ API endpoint simulation failed: {api_result}")
        return False
    
    print("\n🎉 === ALL TESTS PASSED ===")
    print("✅ FIFO system is ready for production integration!")
    print(f"Test completed: {datetime.now()}")
    
    return True

if __name__ == "__main__":
    import asyncio
    
    print("🧪 Enhanced Workflow API Integration Test")
    print("=" * 50)
    
    # Run comprehensive test
    asyncio.run(comprehensive_fifo_test())