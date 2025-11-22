"""
Hospital Mobile Unit Multi-User Workflow API with Real-Time Updates

This module provides comprehensive API endpoints for managing multi-user, multi-station
screening workflows where multiple staff/doctors work on the same patient through 
different screening steps with proper activity tracking, approval management, and 
REAL-TIME data synchronization across all connected users.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
import json
from bson import ObjectId

from app.api.auth import get_current_user
from app.core.db_rbac import has_permission_db, has_any_role_db, get_user_permissions_from_db
from app.core.database import get_database
from app.utils.blockchain import generate_blockchain_hash

# Import Socket.IO service for real-time updates
from app.socketio_service import socketio_service

# Import the workflow models
from app.models.hospital_mobile.hospital_mobile_workflow_models import (
    ScreeningStep, WorkflowStatus, UserRole, ActionType,
    MultiUserScreeningSession, WorkflowStepData, ActivityLog,
    ApprovalRequest, UserAccess, SessionLock,
    MultiUserSessionCreate, StepUpdateRequest, ApprovalAction, SessionLockRequest,
    MultiUserSessionResponse, ActivityLogResponse, ApprovalRequestResponse, SessionStatusResponse
)

router = APIRouter(prefix="/hospital-mobile-workflow", tags=["Hospital Mobile Unit Workflow"])

def generate_id(prefix: str = "HMS") -> str:
    """Generate a unique ID with prefix"""
    return f"{prefix}{str(uuid.uuid4())[:8].upper()}"

def calculate_step_duration(started_at: datetime, completed_at: datetime) -> int:
    """Calculate duration between two timestamps in minutes"""
    if not started_at or not completed_at:
        return 0
    return int((completed_at - started_at).total_seconds() / 60)

async def broadcast_session_update(session_id: str, update_type: str, session_data: Dict[str, Any], user_info: Dict[str, Any]):
    """Broadcast real-time session updates to all connected users working on this session"""
    try:
        # Create the room name for this session
        session_room = f"hospital_mobile_session_{session_id}"
        
        # Prepare the update data
        update_data = {
            'session_id': session_id,
            'update_type': update_type,
            'session_data': session_data,
            'updated_by': {
                'user_id': user_info.get('user_id'),
                'user_name': user_info.get('name', 'Unknown User'),
                'role': user_info.get('role')
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Broadcast to all users in this session room
        await socketio_service.sio.emit(
            'hospital_mobile_session_update',
            update_data,
            room=session_room
        )
        
        # Also send specific update types
        if update_type == 'step_completed':
            await socketio_service.sio.emit(
                'session_step_completed',
                {
                    'session_id': session_id,
                    'completed_step': session_data.get('current_step'),
                    'next_step': session_data.get('next_step'),
                    'completed_by': update_data['updated_by'],
                    'timestamp': update_data['timestamp']
                },
                room=session_room
            )
        elif update_type == 'user_joined':
            await socketio_service.sio.emit(
                'session_user_joined',
                {
                    'session_id': session_id,
                    'user_info': update_data['updated_by'],
                    'active_users': session_data.get('active_users', []),
                    'timestamp': update_data['timestamp']
                },
                room=session_room
            )
        elif update_type == 'approval_requested':
            await socketio_service.sio.emit(
                'session_approval_requested',
                {
                    'session_id': session_id,
                    'approval_data': session_data.get('approval_request', {}),
                    'requested_by': update_data['updated_by'],
                    'timestamp': update_data['timestamp']
                },
                room=session_room
            )
            
    except Exception as e:
        print(f"Error broadcasting session update: {e}")

async def log_activity(
    db, session_id: str, patient_id: str, step: ScreeningStep, 
    action: ActionType, user_id: str, user_name: str, user_role: UserRole,
    previous_data: Optional[Dict] = None, new_data: Optional[Dict] = None,
    comments: Optional[str] = None, ip_address: Optional[str] = None
):
    """Log user activity with comprehensive tracking and real-time broadcast"""
    
    # Calculate changes if both previous and new data provided
    changes = []
    if previous_data and new_data:
        for key in set(list(previous_data.keys()) + list(new_data.keys())):
            if previous_data.get(key) != new_data.get(key):
                changes.append({
                    'field': key,
                    'old_value': previous_data.get(key),
                    'new_value': new_data.get(key)
                })
    
    activity_log = ActivityLog(
        log_id=generate_id("LOG"),
        session_id=session_id,
        patient_id=patient_id,
        step=step,
        action=action,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        timestamp=datetime.utcnow(),
        previous_data=previous_data,
        new_data=new_data,
        changes=changes,
        comments=comments,
        ip_address=ip_address
    )
    
    # Store in database
    await db.evep.workflow_activity_logs.insert_one(activity_log.dict())
    
    # Broadcast activity log in real-time
    session_room = f"hospital_mobile_session_{session_id}"
    await socketio_service.sio.emit(
        'session_activity_logged',
        {
            'session_id': session_id,
            'activity': activity_log.dict(),
            'timestamp': datetime.utcnow().isoformat()
        },
        room=session_room
    )

async def join_user_to_session_room(session_id: str, user_id: str):
    """Add user to the real-time session room"""
    try:
        # Find the user's Socket.IO session
        user_sid = socketio_service.find_user_session(user_id)
        if user_sid:
            session_room = f"hospital_mobile_session_{session_id}"
            await socketio_service.sio.enter_room(user_sid, session_room)
            
            # Notify that user joined the session room
            await socketio_service.sio.emit('joined_session_room', {
                'session_id': session_id,
                'room': session_room,
                'message': f'Connected to session {session_id} real-time updates'
            }, room=user_sid)
            
    except Exception as e:
        print(f"Error joining user to session room: {e}")

@router.post("/sessions", response_model=MultiUserSessionResponse)
async def create_multi_user_session(
    session_data: MultiUserSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new multi-user screening session with real-time capabilities"""
    
    db = get_database()
    
    # Extract user information
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    user_name = current_user.get("name", "Unknown User")
    
    # Check permissions
    if not has_any_role_db(user_id, ["registration_staff", "doctor", "supervisor", "admin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create screening sessions"
        )
    
    # Get patient information
    patient_doc = await db.evep.patients.find_one({"_id": ObjectId(session_data.patient_id)})
    if not patient_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    patient_name = f"{patient_doc.get('first_name', 'Unknown')} {patient_doc.get('last_name', 'Patient')}"
    
    # Initialize workflow steps
    workflow_steps = []
    for step in ScreeningStep:
        step_data = WorkflowStepData(
            step=step,
            status=WorkflowStatus.COMPLETED if step == session_data.initial_step else WorkflowStatus.PENDING,
            started_at=datetime.utcnow() if step == session_data.initial_step else None
        )
        workflow_steps.append(step_data)
    
    # Create session
    session_id = generate_id("HMS")
    session = MultiUserScreeningSession(
        session_id=session_id,
        patient_id=session_data.patient_id,
        patient_name=patient_name,
        screening_type=session_data.screening_type,
        current_step=session_data.initial_step,
        workflow_steps=workflow_steps,
        created_by=user_id,
        created_by_name=user_name,
        active_users=[user_id],
        all_participants=[user_id],
        metadata=session_data.metadata or {}
    )
    
    # Store in database
    session_doc = session.dict()
    session_doc['_id'] = session_id
    await db.evep.hospital_mobile_sessions.insert_one(session_doc)
    
    # Log activity
    await log_activity(
        db, session_id, session_data.patient_id, session_data.initial_step,
        ActionType.CREATE, user_id, user_name, UserRole(user_role),
        comments="Multi-user screening session created"
    )
    
    # Add user to real-time session room
    await join_user_to_session_room(session_id, user_id)
    
    # Broadcast session creation
    await broadcast_session_update(
        session_id, 
        'session_created', 
        session.dict(), 
        current_user
    )
    
    return MultiUserSessionResponse(
        success=True,
        session=session,
        message=f"Multi-user screening session created successfully: {session_id}"
    )

@router.get("/sessions/{session_id}", response_model=MultiUserSessionResponse)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get session details with real-time connection setup"""
    
    db = get_database()
    user_id = current_user.get("user_id")
    
    # Find session
    session_doc = await db.evep.hospital_mobile_sessions.find_one({"_id": session_id})
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Convert to session object
    session = MultiUserScreeningSession(**session_doc)
    
    # Add user to active users if not already there
    if user_id not in session.active_users:
        session.active_users.append(user_id)
    
    if user_id not in session.all_participants:
        session.all_participants.append(user_id)
    
    # Update session in database
    await db.evep.hospital_mobile_sessions.update_one(
        {"_id": session_id},
        {
            "$set": {
                "active_users": session.active_users,
                "all_participants": session.all_participants,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log activity
    await log_activity(
        db, session_id, session.patient_id, session.current_step,
        ActionType.VIEW, user_id, current_user.get("name", "Unknown User"),
        UserRole(current_user.get("role")),
        comments="Session viewed"
    )
    
    # Add user to real-time session room
    await join_user_to_session_room(session_id, user_id)
    
    # Broadcast user joined
    await broadcast_session_update(
        session_id, 
        'user_joined', 
        session.dict(), 
        current_user
    )
    
    return MultiUserSessionResponse(
        success=True,
        session=session,
        message="Session retrieved successfully"
    )

@router.put("/sessions/{session_id}/steps/{step}", response_model=MultiUserSessionResponse)
async def update_workflow_step(
    session_id: str,
    step: ScreeningStep,
    update_data: StepUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update workflow step with real-time broadcasting"""
    
    db = get_database()
    user_id = current_user.get("user_id")
    user_name = current_user.get("name", "Unknown User")
    user_role = current_user.get("role")
    
    # Find session
    session_doc = await db.evep.hospital_mobile_sessions.find_one({"_id": session_id})
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session = MultiUserScreeningSession(**session_doc)
    
    # Check if session is locked
    if session.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Session is locked: {session.lock_reason}"
        )
    
    # Find the step to update
    step_index = next((i for i, s in enumerate(session.workflow_steps) if s.step == step), None)
    if step_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found in workflow"
        )
    
    current_step = session.workflow_steps[step_index]
    
    # Check if step is locked
    if current_step.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Step is locked: {current_step.lock_reason}"
        )
    
    # Store previous data for activity logging
    previous_data = current_step.data.copy()
    
    # Update step data
    current_step.data.update(update_data.data)
    
    # If completing the step
    if update_data.complete_step:
        current_step.status = WorkflowStatus.COMPLETED
        current_step.completed_at = datetime.utcnow()
        current_step.completed_by = user_id
        current_step.completed_by_name = user_name
        
        # Calculate duration
        if current_step.started_at:
            current_step.actual_duration = calculate_step_duration(
                current_step.started_at, current_step.completed_at
            )
        
        # Update session current step to next step
        step_list = list(ScreeningStep)
        current_step_index = step_list.index(step)
        if current_step_index < len(step_list) - 1:
            next_step = step_list[current_step_index + 1]
            session.current_step = next_step
            
            # Start the next step
            next_step_index = next((i for i, s in enumerate(session.workflow_steps) if s.step == next_step), None)
            if next_step_index is not None:
                session.workflow_steps[next_step_index].status = WorkflowStatus.IN_PROGRESS
                session.workflow_steps[next_step_index].started_at = datetime.utcnow()
        else:
            # All steps completed
            session.overall_status = WorkflowStatus.REQUIRES_APPROVAL if session.requires_final_approval else WorkflowStatus.COMPLETED
    
    # Update session
    session.workflow_steps[step_index] = current_step
    session.updated_at = datetime.utcnow()
    session.current_user = user_id
    
    # Add user to participants
    if user_id not in session.active_users:
        session.active_users.append(user_id)
    if user_id not in session.all_participants:
        session.all_participants.append(user_id)
    
    # Save to database
    await db.evep.hospital_mobile_sessions.replace_one(
        {"_id": session_id},
        session.dict()
    )
    
    # Log activity
    action = ActionType.COMPLETE if update_data.complete_step else ActionType.UPDATE
    await log_activity(
        db, session_id, session.patient_id, step,
        action, user_id, user_name, UserRole(user_role),
        previous_data, current_step.data,
        update_data.comments
    )
    
    # Broadcast real-time update
    update_type = 'step_completed' if update_data.complete_step else 'step_updated'
    session_data = session.dict()
    session_data['updated_step'] = current_step.dict()
    
    await broadcast_session_update(
        session_id, 
        update_type,
        session_data,
        current_user
    )
    
    return MultiUserSessionResponse(
        success=True,
        session=session,
        message=f"Step {step} {'completed' if update_data.complete_step else 'updated'} successfully"
    )

@router.get("/sessions/{session_id}/activity-logs", response_model=ActivityLogResponse)
async def get_session_activity_logs(
    session_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get session activity logs with real-time updates"""
    
    db = get_database()
    
    # Check if session exists
    session_exists = await db.evep.hospital_mobile_sessions.count_documents({"_id": session_id}) > 0
    if not session_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get activity logs
    cursor = db.evep.workflow_activity_logs.find(
        {"session_id": session_id}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    logs_docs = await cursor.to_list(limit)
    logs = [ActivityLog(**doc) for doc in logs_docs]
    
    total_count = await db.evep.workflow_activity_logs.count_documents({"session_id": session_id})
    
    return ActivityLogResponse(
        success=True,
        logs=logs,
        total_count=total_count,
        message=f"Retrieved {len(logs)} activity logs"
    )

@router.get("/sessions/{session_id}/realtime-status", response_model=SessionStatusResponse)
async def get_realtime_session_status(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get real-time session status and setup Socket.IO connection"""
    
    db = get_database()
    user_id = current_user.get("user_id")
    
    # Find session
    session_doc = await db.evep.hospital_mobile_sessions.find_one({"_id": session_id})
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session = MultiUserScreeningSession(**session_doc)
    
    # Add user to real-time session room
    await join_user_to_session_room(session_id, user_id)
    
    # Determine next available steps
    step_list = list(ScreeningStep)
    current_step_index = step_list.index(session.current_step)
    next_steps = []
    
    # Add current step if not completed
    current_workflow_step = next((s for s in session.workflow_steps if s.step == session.current_step), None)
    if current_workflow_step and current_workflow_step.status != WorkflowStatus.COMPLETED:
        next_steps.append(session.current_step)
    
    # Add next step if current is completed
    if current_workflow_step and current_workflow_step.status == WorkflowStatus.COMPLETED:
        if current_step_index < len(step_list) - 1:
            next_steps.append(step_list[current_step_index + 1])
    
    return SessionStatusResponse(
        success=True,
        session_id=session_id,
        current_step=session.current_step,
        overall_status=session.overall_status,
        is_locked=session.is_locked,
        active_users=session.active_users,
        next_steps=next_steps,
        message=f"Real-time status for session {session_id}. Connected to Socket.IO room: hospital_mobile_session_{session_id}"
    )

# Initialize the service
socketio_service = socketio_service