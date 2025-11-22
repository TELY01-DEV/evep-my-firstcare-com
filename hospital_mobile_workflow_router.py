#!/usr/bin/env python3

"""
Hospital Mobile Workflow API Router - FIFO Enhanced
Production-ready FastAPI router with FIFO field-level change management
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging
from pydantic import BaseModel

# Import authentication
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

# Request/Response Models
class FIFOWorkflowSessionCreate(BaseModel):
    session_name: str
    workflow_type: str = "hospital_mobile_screening"
    participants: List[str]  # User IDs
    metadata: Dict[str, Any] = {}

class FIFOWorkflowSessionResponse(BaseModel):
    session_id: str
    session_name: str
    workflow_type: str
    participants: List[str]
    current_step: int
    total_steps: int
    created_at: datetime
    created_by: str
    status: str

class FIFOStepUpdateRequest(BaseModel):
    session_id: str
    step_number: int
    field_updates: Dict[str, Any]
    force_save: bool = False
    conflict_resolution: str = "fifo_wins"

class FIFOStepUpdateResponse(BaseModel):
    status: str
    message: str
    session_id: str
    step_number: int
    changes_queued: int
    conflicts_detected: int
    final_values: Dict[str, Any] = {}

class ConflictInfo(BaseModel):
    field_path: str
    conflicting_changes: List[str]
    detected_at: datetime
    resolution_strategy: str
    resolved: bool = False

class FIFOHealthResponse(BaseModel):
    status: str
    fifo_manager: str
    database: str
    collections_ready: bool
    timestamp: datetime

# Create router
router = APIRouter(
    prefix="/api/v2/hospital_mobile/workflow",
    tags=["Hospital Mobile Workflow (FIFO-Enhanced)"]
)

# Global FIFO manager (will be initialized)
_fifo_manager = None

def get_fifo_manager():
    """Get or initialize FIFO manager"""
    global _fifo_manager
    if _fifo_manager is None:
        try:
            import os
            from fifo_change_manager import FIFOChangeManager
            
            # Use environment MongoDB URL if available, fallback to default
            mongodb_url = os.getenv(
                "MONGODB_URL", 
                "mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin"
            )
            
            _fifo_manager = FIFOChangeManager(mongodb_url=mongodb_url, db_name="evep")
            logger.info("FIFO Change Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize FIFO manager: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"FIFO manager initialization failed: {str(e)}"
            )
    
    return _fifo_manager

# Health check endpoint
@router.get("/health", response_model=FIFOHealthResponse)
async def fifo_health_check():
    """Health check for FIFO-enhanced workflow system"""
    try:
        fifo_mgr = get_fifo_manager()
        
        # Test database connection
        collections_ready = False
        if hasattr(fifo_mgr, 'client') and fifo_mgr.client:
            try:
                fifo_mgr.client.admin.command('ping')
                
                # Check if FIFO collections exist
                db = fifo_mgr.client.evep
                collections = db.list_collection_names()
                required_collections = ['field_change_queue', 'field_conflicts', 'field_versions']
                collections_ready = all(col in collections for col in required_collections)
                
            except Exception:
                pass
        
        return FIFOHealthResponse(
            status="healthy" if collections_ready else "initializing",
            fifo_manager="operational",
            database="connected",
            collections_ready=collections_ready,
            timestamp=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"FIFO health check failed: {e}")
        return FIFOHealthResponse(
            status="unhealthy",
            fifo_manager="error",
            database="error", 
            collections_ready=False,
            timestamp=datetime.now(timezone.utc)
        )

# Create new workflow session
@router.post("/session/create", response_model=FIFOWorkflowSessionResponse)
async def create_workflow_session(
    request: FIFOWorkflowSessionCreate,
    current_user: dict = Depends(get_current_user),
    fifo_mgr = Depends(get_fifo_manager)
):
    """Create a new hospital mobile workflow session with FIFO support"""
    try:
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        user_id = current_user.get("user_id", "unknown")
        
        # Create workflow session document
        session_doc = {
            "session_id": session_id,
            "session_name": request.session_name,
            "workflow_type": request.workflow_type,
            "participants": request.participants,
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc),
            "current_step": 1,
            "total_steps": 9,  # Hospital mobile workflow has 9 steps
            "status": "active",
            "metadata": request.metadata,
            "steps": [
                {"step_number": i, "data": {}, "completed": False, "last_modified": None}
                for i in range(1, 10)
            ]
        }
        
        # Store in database
        if hasattr(fifo_mgr, 'db') and fifo_mgr.db:
            fifo_mgr.db.hospital_mobile_workflow_sessions.insert_one(session_doc)
            
        logger.info(f"Created workflow session {session_id} by user {user_id}")
        
        return FIFOWorkflowSessionResponse(
            session_id=session_id,
            session_name=request.session_name,
            workflow_type=request.workflow_type,
            participants=request.participants,
            current_step=1,
            total_steps=9,
            created_at=session_doc["created_at"],
            created_by=user_id,
            status="active"
        )
        
    except Exception as e:
        logger.error(f"Failed to create workflow session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create workflow session: {str(e)}"
        )

# Update workflow step with FIFO processing
@router.post("/step/update", response_model=FIFOStepUpdateResponse)
async def update_workflow_step_fifo(
    request: FIFOStepUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    fifo_mgr = Depends(get_fifo_manager)
):
    """Update workflow step using FIFO field-level change management"""
    try:
        from fifo_change_manager import FieldChange
        
        user_id = current_user.get("user_id", "unknown")
        user_name = current_user.get("username", f"User_{user_id}")
        
        logger.info(f"FIFO step update: session {request.session_id}, step {request.step_number} by {user_name}")
        
        # Queue field changes in FIFO order
        change_ids = []
        for field_path, new_value in request.field_updates.items():
            
            change = FieldChange(
                session_id=request.session_id,
                step_number=request.step_number,
                field_path=field_path,
                old_value=None,  # Will be populated from current data
                new_value=new_value,
                user_id=user_id,
                user_name=user_name,
                timestamp=datetime.now(timezone.utc),
                change_id=str(uuid.uuid4())
            )
            
            success = await fifo_mgr.queue_field_change(change)
            if success:
                change_ids.append(change.change_id)
        
        # Process changes if force_save is True
        final_values = {}
        conflicts_detected = 0
        
        if request.force_save:
            final_values = await fifo_mgr.process_fifo_changes(
                request.session_id, 
                request.step_number
            )
            
            # Update the workflow session document
            if hasattr(fifo_mgr, 'db') and fifo_mgr.db:
                update_result = fifo_mgr.db.hospital_mobile_workflow_sessions.update_one(
                    {
                        "session_id": request.session_id,
                        "steps.step_number": request.step_number
                    },
                    {
                        "$set": {
                            "steps.$.data": final_values,
                            "steps.$.last_modified": datetime.now(timezone.utc),
                            "steps.$.modified_by": user_name
                        }
                    }
                )
                
                if update_result.modified_count == 0:
                    logger.warning(f"No workflow session found for update: {request.session_id}")
        else:
            # Schedule background processing
            background_tasks.add_task(
                _process_fifo_background,
                request.session_id,
                request.step_number,
                user_name
            )
        
        return FIFOStepUpdateResponse(
            status="success",
            message="Field changes queued for FIFO processing" if not request.force_save else "Changes processed immediately",
            session_id=request.session_id,
            step_number=request.step_number,
            changes_queued=len(change_ids),
            conflicts_detected=conflicts_detected,
            final_values=final_values if request.force_save else {}
        )
        
    except Exception as e:
        logger.error(f"FIFO step update failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Step update failed: {str(e)}"
        )

# Get workflow session conflicts
@router.get("/session/{session_id}/conflicts")
async def get_session_conflicts(
    session_id: str,
    step_number: Optional[int] = None,
    fifo_mgr = Depends(get_fifo_manager)
):
    """Get conflicts for a workflow session or specific step"""
    try:
        if not hasattr(fifo_mgr, 'db') or not fifo_mgr.db:
            raise HTTPException(status_code=500, detail="Database not available")
        
        query = {"session_id": session_id, "resolved_at": None}
        if step_number:
            query["step_number"] = step_number
        
        conflicts = list(fifo_mgr.db.field_conflicts.find(query))
        
        # Convert ObjectIds to strings for JSON serialization
        for conflict in conflicts:
            conflict["_id"] = str(conflict["_id"])
        
        return {
            "status": "success",
            "session_id": session_id,
            "step_number": step_number,
            "conflicts": conflicts,
            "total_conflicts": len(conflicts)
        }
        
    except Exception as e:
        logger.error(f"Failed to get conflicts: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conflicts: {str(e)}"
        )

# Get workflow session
@router.get("/session/{session_id}")
async def get_workflow_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    fifo_mgr = Depends(get_fifo_manager)
):
    """Get workflow session details"""
    try:
        if not hasattr(fifo_mgr, 'db') or not fifo_mgr.db:
            raise HTTPException(status_code=500, detail="Database not available")
        
        session = fifo_mgr.db.hospital_mobile_workflow_sessions.find_one({
            "session_id": session_id
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Convert ObjectId to string
        session["_id"] = str(session["_id"])
        
        return {
            "status": "success",
            "session": session
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session: {str(e)}"
        )

# Get FIFO processing stats
@router.get("/session/{session_id}/stats")
async def get_session_fifo_stats(
    session_id: str,
    fifo_mgr = Depends(get_fifo_manager)
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )

# Background task for FIFO processing
async def _process_fifo_background(session_id: str, step_number: int, user_name: str):
    """Background task to process FIFO changes"""
    try:
        fifo_mgr = get_fifo_manager()
        final_values = await fifo_mgr.process_fifo_changes(session_id, step_number)
        
        if final_values and hasattr(fifo_mgr, 'db') and fifo_mgr.db:
            # Update the workflow session
            fifo_mgr.db.hospital_mobile_workflow_sessions.update_one(
                {
                    "session_id": session_id,
                    "steps.step_number": step_number
                },
                {
                    "$set": {
                        "steps.$.data": final_values,
                        "steps.$.last_modified": datetime.now(timezone.utc),
                        "steps.$.modified_by": user_name
                    }
                }
            )
            
            logger.info(f"Background FIFO processing completed for {session_id}/step-{step_number}")
        
    except Exception as e:
        logger.error(f"Background FIFO processing failed: {e}")

# Export router
__all__ = ["router"]