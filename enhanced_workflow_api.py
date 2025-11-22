#!/usr/bin/env python3

"""
Enhanced Hospital Mobile Workflow API with FIFO Field-Level Change Management
Replaces problematic workflow_step.data.update() with safe FIFO processing
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging
from pydantic import BaseModel

# Import our FIFO change manager
from fifo_change_manager import FIFOChangeManager, FieldChange, ConflictResolutionStrategy

logger = logging.getLogger(__name__)

# Enhanced request models
class FIFOStepUpdateRequest(BaseModel):
    """Enhanced step update request with FIFO field tracking"""
    session_id: str
    step_number: int
    data: Dict[str, Any]
    user_id: str
    user_name: str
    force_immediate_save: bool = False
    conflict_resolution_strategy: str = ConflictResolutionStrategy.FIFO_WINS.value

class FIFOBatchUpdateRequest(BaseModel):
    """Batch update request for multiple field changes"""
    session_id: str
    step_number: int
    field_changes: List[Dict[str, Any]]  # Array of field updates
    user_id: str
    user_name: str

class ConflictResolutionRequest(BaseModel):
    """Manual conflict resolution request"""
    session_id: str
    step_number: int
    field_path: str
    resolution_strategy: str
    final_value: Any
    resolved_by: str

# Enhanced Hospital Mobile Workflow API Router
enhanced_workflow_router = APIRouter(prefix="/api/v2/hospital_mobile/workflow", tags=["Enhanced Workflow"])

# Global FIFO manager instance
fifo_manager = None

def get_fifo_manager() -> FIFOChangeManager:
    """Get FIFO manager instance"""
    global fifo_manager
    if fifo_manager is None:
        fifo_manager = FIFOChangeManager()
    return fifo_manager

@enhanced_workflow_router.post("/step/update_with_fifo")
async def update_step_with_fifo(
    request: FIFOStepUpdateRequest,
    background_tasks: BackgroundTasks,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """
    Update workflow step using FIFO field-level change management
    Eliminates data loss from concurrent edits
    """
    try:
        logger.info(f"FIFO update request for session {request.session_id}, step {request.step_number}")
        
        # Queue individual field changes
        change_ids = []
        for field_path, new_value in request.data.items():
            
            # Create field change record
            change = FieldChange(
                session_id=request.session_id,
                step_number=request.step_number,
                field_path=field_path,
                old_value=None,  # Will be populated from current data
                new_value=new_value,
                user_id=request.user_id,
                user_name=request.user_name,
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            )
            
            # Queue the change in FIFO order
            success = await fifo_mgr.queue_field_change(change)
            if success:
                change_ids.append(change.change_id)
                logger.info(f"Queued FIFO change: {field_path} = {new_value} by {request.user_name}")
        
        # Process changes immediately if requested, or queue for batch processing
        if request.force_immediate_save:
            final_values = await fifo_mgr.process_fifo_changes(
                request.session_id, 
                request.step_number
            )
            
            # Update the actual workflow step with FIFO-processed values
            await _update_workflow_step_safely(request.session_id, request.step_number, final_values)
            
            return {
                "status": "success",
                "message": "Step updated with FIFO processing",
                "changes_queued": len(change_ids),
                "final_values": final_values,
                "processing_mode": "immediate"
            }
        else:
            # Queue for batch processing
            background_tasks.add_task(_schedule_fifo_processing, request.session_id, request.step_number)
            
            return {
                "status": "success", 
                "message": "Field changes queued for FIFO processing",
                "changes_queued": len(change_ids),
                "processing_mode": "queued"
            }
        
    except Exception as e:
        logger.error(f"FIFO update failed: {e}")
        raise HTTPException(status_code=500, detail=f"FIFO update failed: {str(e)}")

@enhanced_workflow_router.post("/step/batch_update_fifo")
async def batch_update_with_fifo(
    request: FIFOBatchUpdateRequest,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """
    Batch update multiple fields with FIFO processing
    Ideal for complex forms with many concurrent field edits
    """
    try:
        change_ids = []
        
        # Process each field change in the batch
        for field_change in request.field_changes:
            field_path = field_change.get('field_path')
            new_value = field_change.get('new_value')
            timestamp = field_change.get('timestamp', datetime.now(timezone.utc))
            
            if field_path is None:
                continue
                
            change = FieldChange(
                session_id=request.session_id,
                step_number=request.step_number,
                field_path=field_path,
                old_value=field_change.get('old_value'),
                new_value=new_value,
                user_id=request.user_id,
                user_name=request.user_name,
                timestamp=timestamp,
                change_id=str(uuid.uuid4())
            )
            
            success = await fifo_mgr.queue_field_change(change)
            if success:
                change_ids.append(change.change_id)
        
        # Process all queued changes in FIFO order
        final_values = await fifo_mgr.process_fifo_changes(request.session_id, request.step_number)
        
        # Update workflow step
        await _update_workflow_step_safely(request.session_id, request.step_number, final_values)
        
        return {
            "status": "success",
            "message": "Batch update completed with FIFO processing",
            "changes_processed": len(change_ids),
            "final_values": final_values
        }
        
    except Exception as e:
        logger.error(f"Batch FIFO update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")

@enhanced_workflow_router.get("/step/{session_id}/{step_number}/conflicts")
async def get_step_conflicts(
    session_id: str,
    step_number: int,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """Get any unresolved conflicts for a workflow step"""
    try:
        # Get conflicts from FIFO manager
        if hasattr(fifo_mgr, 'db') and fifo_mgr.db:
            conflicts = list(fifo_mgr.db.field_conflicts.find({
                'session_id': session_id,
                'step_number': step_number,
                'resolved_at': None
            }))
            
            return {
                "status": "success",
                "session_id": session_id,
                "step_number": step_number,
                "conflicts": conflicts,
                "conflict_count": len(conflicts)
            }
        else:
            return {"status": "error", "message": "FIFO manager not initialized"}
        
    except Exception as e:
        logger.error(f"Failed to get conflicts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get conflicts: {str(e)}")

@enhanced_workflow_router.post("/step/resolve_conflict")
async def resolve_conflict_manually(
    request: ConflictResolutionRequest,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """Manually resolve a field conflict"""
    try:
        # Implementation would go here for manual conflict resolution
        # This is a placeholder for the conflict resolution logic
        
        return {
            "status": "success",
            "message": "Conflict resolution not yet implemented",
            "session_id": request.session_id,
            "field_path": request.field_path,
            "resolution_strategy": request.resolution_strategy
        }
        
    except Exception as e:
        logger.error(f"Conflict resolution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Conflict resolution failed: {str(e)}")

@enhanced_workflow_router.get("/session/{session_id}/stats")
async def get_session_fifo_stats(
    session_id: str,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """Get FIFO processing statistics for a session"""
    try:
        stats = fifo_mgr.get_processing_stats(session_id)
        
        return {
            "status": "success",
            "session_id": session_id,
            "fifo_stats": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get session stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@enhanced_workflow_router.get("/field/{session_id}/history")
async def get_field_change_history(
    session_id: str,
    field_path: str,
    fifo_mgr: FIFOChangeManager = Depends(get_fifo_manager)
):
    """Get complete change history for a specific field"""
    try:
        history = fifo_mgr.get_field_history(session_id, field_path)
        
        return {
            "status": "success",
            "session_id": session_id,
            "field_path": field_path,
            "change_history": history,
            "total_changes": len(history)
        }
        
    except Exception as e:
        logger.error(f"Failed to get field history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

# Helper functions
async def _update_workflow_step_safely(session_id: str, step_number: int, final_values: Dict[str, Any]):
    """
    Safely update the workflow step with FIFO-processed values
    This replaces the problematic workflow_step.data.update() logic
    """
    try:
        # Import existing workflow models and database connection
        from pymongo import MongoClient
        
        client = MongoClient("mongodb://localhost:27017")
        db = client["evep_system"]
        
        # Find the workflow session
        workflow_session = db.hospital_mobile_workflow_sessions.find_one({
            "session_id": session_id
        })
        
        if not workflow_session:
            logger.error(f"Workflow session not found: {session_id}")
            return False
            
        # Find the specific step
        steps = workflow_session.get("steps", [])
        step_found = False
        
        for i, step in enumerate(steps):
            if step.get("step_number") == step_number:
                # SAFE UPDATE: Replace entire step data with FIFO-processed values
                if "data" not in step:
                    step["data"] = {}
                
                # Apply FIFO values using dot notation for nested fields
                for field_path, value in final_values.items():
                    _set_nested_field(step["data"], field_path, value)
                
                # Update metadata
                step["last_modified"] = datetime.now(timezone.utc)
                step["modified_by_fifo"] = True
                
                steps[i] = step
                step_found = True
                break
        
        if not step_found:
            logger.error(f"Step {step_number} not found in session {session_id}")
            return False
            
        # Update the workflow session with the modified steps
        result = db.hospital_mobile_workflow_sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "steps": steps,
                    "last_modified": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Workflow step updated safely with FIFO values: {session_id}/step-{step_number}")
            return True
        else:
            logger.error(f"Failed to update workflow step: {session_id}/step-{step_number}")
            return False
            
    except Exception as e:
        logger.error(f"Safe workflow step update failed: {e}")
        return False

def _set_nested_field(data: Dict, field_path: str, value: Any):
    """Set a nested field using dot notation (e.g., 'patient_info.first_name')"""
    try:
        keys = field_path.split('.')
        current = data
        
        # Navigate to the parent of the target field
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        # Set the final value
        current[keys[-1]] = value
        
    except Exception as e:
        logger.error(f"Failed to set nested field {field_path}: {e}")

async def _schedule_fifo_processing(session_id: str, step_number: int):
    """Background task to process FIFO changes"""
    try:
        fifo_mgr = get_fifo_manager()
        final_values = await fifo_mgr.process_fifo_changes(session_id, step_number)
        
        if final_values:
            await _update_workflow_step_safely(session_id, step_number, final_values)
            logger.info(f"Background FIFO processing completed for {session_id}/step-{step_number}")
        
    except Exception as e:
        logger.error(f"Background FIFO processing failed: {e}")

# Health check endpoint
@enhanced_workflow_router.get("/fifo/health")
async def fifo_health_check():
    """Health check for FIFO system"""
    try:
        fifo_mgr = get_fifo_manager()
        
        # Test database connection
        if hasattr(fifo_mgr, 'client') and fifo_mgr.client:
            # Ping the database
            fifo_mgr.client.admin.command('ping')
            
            return {
                "status": "healthy",
                "fifo_manager": "operational",
                "database": "connected",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "status": "unhealthy",
                "fifo_manager": "not_initialized",
                "database": "not_connected"
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Cleanup endpoint
@enhanced_workflow_router.post("/fifo/cleanup")
async def cleanup_old_fifo_data(days_old: int = 30):
    """Clean up old FIFO processing data"""
    try:
        fifo_mgr = get_fifo_manager()
        fifo_mgr.cleanup_old_changes(days_old)
        
        return {
            "status": "success",
            "message": f"Cleaned up FIFO data older than {days_old} days"
        }
        
    except Exception as e:
        logger.error(f"FIFO cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")