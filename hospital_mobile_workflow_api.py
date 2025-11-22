"""
Hospital Mobile Unit Multi-User Workflow API

This module provides comprehensive API endpoints for managing multi-user, multi-station
screening workflows where multiple staff/doctors work on the same patient through 
different screening steps with proper activity tracking and approval management.
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

# Import the workflow models (these would be in a separate file)
from hospital_mobile_workflow_models import (
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

async def log_activity(
    db, session_id: str, patient_id: str, step: ScreeningStep, 
    action: ActionType, user_id: str, user_name: str, user_role: UserRole,
    previous_data: Optional[Dict] = None, new_data: Optional[Dict] = None,
    comments: Optional[str] = None, ip_address: Optional[str] = None
):
    """Log user activity with comprehensive tracking"""
    
    # Calculate changes if both previous and new data provided
    changes = []
    if previous_data and new_data:
        for key, new_value in new_data.items():
            old_value = previous_data.get(key)
            if old_value != new_value:
                changes.append({
                    "field": key,
                    "old_value": old_value,
                    "new_value": new_value,
                    "changed_at": datetime.utcnow().isoformat()
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
        previous_data=previous_data,
        new_data=new_data,
        changes=changes,
        comments=comments,
        ip_address=ip_address
    )
    
    # Store in database
    await db.hospital_mobile_activity_logs.insert_one(activity_log.dict())
    
    # Also update the session with this log
    await db.hospital_mobile_sessions.update_one(
        {"session_id": session_id},
        {"$push": {"activity_logs": activity_log.dict()}}
    )

async def check_user_permissions(user_id: str, session_id: str, step: ScreeningStep, action: str) -> bool:
    """Check if user has permissions for specific action on specific step"""
    
    # Define role-based permissions for each step
    step_permissions = {
        ScreeningStep.REGISTRATION: [UserRole.REGISTRATION_STAFF, UserRole.SUPERVISOR],
        ScreeningStep.INITIAL_ASSESSMENT: [UserRole.VISION_TECHNICIAN, UserRole.CLINICAL_ASSISTANT, UserRole.SUPERVISOR],
        ScreeningStep.VISION_TESTING: [UserRole.VISION_TECHNICIAN, UserRole.SUPERVISOR],
        ScreeningStep.AUTO_REFRACTION: [UserRole.REFRACTION_TECHNICIAN, UserRole.SUPERVISOR],
        ScreeningStep.CLINICAL_EVALUATION: [UserRole.CLINICAL_ASSISTANT, UserRole.DOCTOR, UserRole.SUPERVISOR],
        ScreeningStep.DOCTOR_DIAGNOSIS: [UserRole.DOCTOR, UserRole.SUPERVISOR],
        ScreeningStep.PRESCRIPTION: [UserRole.DOCTOR, UserRole.SUPERVISOR],
        ScreeningStep.QUALITY_CHECK: [UserRole.QUALITY_CHECKER, UserRole.SUPERVISOR],
        ScreeningStep.FINAL_APPROVAL: [UserRole.DOCTOR, UserRole.SUPERVISOR]
    }
    
    # Get user role and permissions from database
    user_permissions = await get_user_permissions_from_db(user_id)
    
    # Check if user has required role for this step
    required_roles = step_permissions.get(step, [])
    user_role = user_permissions.get("role")
    
    return user_role in [role.value for role in required_roles]

@router.post("/sessions", response_model=MultiUserSessionResponse)
async def create_multi_user_session(
    session_data: MultiUserSessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new multi-user screening session"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Check permissions
        if not await has_permission_db(user_id, "screening_sessions_create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create screening sessions"
            )
        
        # Generate session ID
        session_id = generate_id("HMS")
        
        # Initialize workflow steps
        workflow_steps = []
        for step in ScreeningStep:
            if step == ScreeningStep.COMPLETED:
                continue
                
            step_data = WorkflowStepData(
                step=step,
                status=WorkflowStatus.PENDING if step != session_data.initial_step else WorkflowStatus.IN_PROGRESS,
                requires_approval=step in [ScreeningStep.DOCTOR_DIAGNOSIS, ScreeningStep.PRESCRIPTION, ScreeningStep.FINAL_APPROVAL]
            )
            
            if step == session_data.initial_step:
                step_data.started_at = datetime.utcnow()
                step_data.assigned_user_id = user_id
                step_data.assigned_user_name = user_name
            
            workflow_steps.append(step_data)
        
        # Create session
        session = MultiUserScreeningSession(
            session_id=session_id,
            patient_id=session_data.patient_id,
            patient_name=f"Patient-{session_data.patient_id}",  # This should come from patient lookup
            current_step=session_data.initial_step,
            workflow_steps=workflow_steps,
            created_by=user_id,
            created_by_name=user_name,
            active_users=[user_id],
            all_participants=[user_id],
            current_user=user_id,
            metadata=session_data.metadata or {}
        )
        
        # Store in database
        session_dict = session.dict()
        session_dict["_id"] = ObjectId()
        await db.hospital_mobile_sessions.insert_one(session_dict)
        
        # Log activity
        await log_activity(
            db, session_id, session_data.patient_id, session_data.initial_step,
            ActionType.CREATE, user_id, user_name, UserRole.SUPERVISOR,  # Assuming creator has supervisor role
            comments=f"Created multi-user screening session"
        )
        
        return MultiUserSessionResponse(
            success=True,
            session=session,
            message=f"Multi-user screening session {session_id} created successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=MultiUserSessionResponse)
async def get_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific screening session with all details"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        
        # Get session from database
        session_doc = await db.hospital_mobile_sessions.find_one({"session_id": session_id})
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        # Convert to model
        session_doc.pop("_id", None)  # Remove MongoDB ObjectId
        session = MultiUserScreeningSession(**session_doc)
        
        # Log view activity
        await log_activity(
            db, session_id, session.patient_id, session.current_step,
            ActionType.VIEW, user_id, current_user.get("name", "Unknown User"), 
            UserRole.SUPERVISOR,  # This should be determined from user role
            comments="Viewed session details"
        )
        
        return MultiUserSessionResponse(
            success=True,
            session=session,
            message=f"Session {session_id} retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve session: {str(e)}"
        )

@router.put("/sessions/{session_id}/steps/{step}", response_model=MultiUserSessionResponse)
async def update_step(
    session_id: str,
    step: ScreeningStep,
    update_request: StepUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a specific step in the workflow"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Get current session
        session_doc = await db.hospital_mobile_sessions.find_one({"session_id": session_id})
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        session = MultiUserScreeningSession(**{k: v for k, v in session_doc.items() if k != "_id"})
        
        # Check if session is locked
        if session.is_locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Session is locked: {session.lock_reason}"
            )
        
        # Check user permissions for this step
        if not await check_user_permissions(user_id, session_id, step, "update"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions to update step {step.value}"
            )
        
        # Find the workflow step to update
        step_index = None
        for i, workflow_step in enumerate(session.workflow_steps):
            if workflow_step.step == step:
                step_index = i
                break
        
        if step_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step.value} not found in workflow"
            )
        
        # Store previous data for audit trail
        previous_step_data = session.workflow_steps[step_index].dict()
        
        # Update step data
        workflow_step = session.workflow_steps[step_index]
        workflow_step.data.update(update_request.data)
        workflow_step.status = WorkflowStatus.IN_PROGRESS
        workflow_step.assigned_user_id = user_id
        workflow_step.assigned_user_name = user_name
        
        if workflow_step.started_at is None:
            workflow_step.started_at = datetime.utcnow()
        
        # Handle step completion
        if update_request.complete_step:
            workflow_step.status = WorkflowStatus.COMPLETED
            workflow_step.completed_at = datetime.utcnow()
            workflow_step.completed_by = user_id
            workflow_step.completed_by_name = user_name
            
            # Calculate duration
            if workflow_step.started_at:
                workflow_step.actual_duration = calculate_step_duration(
                    workflow_step.started_at, workflow_step.completed_at
                )
            
            # Check if approval is required
            if workflow_step.requires_approval or update_request.request_approval:
                workflow_step.status = WorkflowStatus.REQUIRES_APPROVAL
        
        # Update session
        session.updated_at = datetime.utcnow()
        session.current_user = user_id
        
        # Add user to active users if not already there
        if user_id not in session.active_users:
            session.active_users.append(user_id)
        if user_id not in session.all_participants:
            session.all_participants.append(user_id)
        
        # Update current step if this step is completed and not requiring approval
        if update_request.complete_step and workflow_step.status == WorkflowStatus.COMPLETED:
            # Find next step
            current_step_index = list(ScreeningStep).index(step)
            if current_step_index < len(ScreeningStep) - 1:
                next_step = list(ScreeningStep)[current_step_index + 1]
                if next_step != ScreeningStep.COMPLETED:
                    session.current_step = next_step
                    # Initialize next step
                    for next_workflow_step in session.workflow_steps:
                        if next_workflow_step.step == next_step:
                            next_workflow_step.status = WorkflowStatus.PENDING
                            break
        
        # Save to database
        session_update = session.dict()
        await db.hospital_mobile_sessions.update_one(
            {"session_id": session_id},
            {"$set": session_update}
        )
        
        # Log activity
        await log_activity(
            db, session_id, session.patient_id, step,
            ActionType.COMPLETE if update_request.complete_step else ActionType.UPDATE,
            user_id, user_name, UserRole.SUPERVISOR,  # This should be determined from user role
            previous_data=previous_step_data,
            new_data=workflow_step.dict(),
            comments=update_request.comments
        )
        
        return MultiUserSessionResponse(
            success=True,
            session=session,
            message=f"Step {step.value} updated successfully" + 
                   (" and completed" if update_request.complete_step else "")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update step: {str(e)}"
        )

@router.get("/sessions/{session_id}/activity-logs", response_model=ActivityLogResponse)
async def get_activity_logs(
    session_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    step: Optional[ScreeningStep] = Query(None),
    action: Optional[ActionType] = Query(None),
    user_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get activity logs for a screening session with filtering"""
    
    try:
        db = get_database()
        
        # Build filter
        filter_criteria = {"session_id": session_id}
        if step:
            filter_criteria["step"] = step.value
        if action:
            filter_criteria["action"] = action.value
        if user_id:
            filter_criteria["user_id"] = user_id
        
        # Get logs from database
        logs_cursor = db.hospital_mobile_activity_logs.find(filter_criteria).sort("timestamp", -1)
        logs_list = await logs_cursor.skip(skip).limit(limit).to_list(length=limit)
        
        # Convert to ActivityLog models
        logs = []
        for log_doc in logs_list:
            log_doc.pop("_id", None)  # Remove MongoDB ObjectId
            logs.append(ActivityLog(**log_doc))
        
        # Get total count
        total_count = await db.hospital_mobile_activity_logs.count_documents(filter_criteria)
        
        return ActivityLogResponse(
            success=True,
            logs=logs,
            total_count=total_count,
            message=f"Retrieved {len(logs)} activity logs"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve activity logs: {str(e)}"
        )

@router.post("/sessions/{session_id}/approval-requests", response_model=ApprovalRequestResponse)
async def create_approval_request(
    session_id: str,
    step: ScreeningStep,
    reason: str,
    data_to_approve: Dict[str, Any],
    priority: str = "normal",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create an approval request for a specific step"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Create approval request
        request_id = generate_id("APR")
        approval_request = ApprovalRequest(
            request_id=request_id,
            session_id=session_id,
            step=step,
            requested_by=user_id,
            requested_by_name=user_name,
            approval_type="step_approval",
            reason=reason,
            data_to_approve=data_to_approve,
            priority=priority,
            expires_at=datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
        )
        
        # Store in database
        request_dict = approval_request.dict()
        request_dict["_id"] = ObjectId()
        await db.hospital_mobile_approval_requests.insert_one(request_dict)
        
        # Log activity
        await log_activity(
            db, session_id, "", step,  # Patient ID would be retrieved from session
            ActionType.CREATE, user_id, user_name, UserRole.SUPERVISOR,
            comments=f"Created approval request: {reason}"
        )
        
        return ApprovalRequestResponse(
            success=True,
            request=approval_request,
            message=f"Approval request {request_id} created successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create approval request: {str(e)}"
        )

@router.put("/approval-requests/{request_id}", response_model=ApprovalRequestResponse)
async def handle_approval_request(
    request_id: str,
    approval_action: ApprovalAction,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Approve or reject an approval request"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Get approval request
        request_doc = await db.hospital_mobile_approval_requests.find_one({"request_id": request_id})
        if not request_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval request {request_id} not found"
            )
        
        # Check if user has approval permissions
        if not await has_permission_db(user_id, "approve_screenings"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to approve/reject requests"
            )
        
        # Update approval request
        update_data = {
            "status": WorkflowStatus.APPROVED if approval_action.action == "approve" else WorkflowStatus.REJECTED,
            "approved_by": user_id,
            "approved_by_name": user_name,
            "approved_at": datetime.utcnow()
        }
        
        if approval_action.action == "reject":
            update_data["rejection_reason"] = approval_action.reason or "Rejected by approver"
        
        await db.hospital_mobile_approval_requests.update_one(
            {"request_id": request_id},
            {"$set": update_data}
        )
        
        # If approved, update the session step
        if approval_action.action == "approve":
            await db.hospital_mobile_sessions.update_one(
                {"session_id": request_doc["session_id"]},
                {
                    "$set": {
                        f"workflow_steps.$[elem].status": WorkflowStatus.APPROVED,
                        f"workflow_steps.$[elem].approved_by": user_id,
                        f"workflow_steps.$[elem].approved_by_name": user_name,
                        f"workflow_steps.$[elem].approved_at": datetime.utcnow()
                    }
                },
                array_filters=[{"elem.step": request_doc["step"]}]
            )
        
        # Get updated request
        updated_request_doc = await db.hospital_mobile_approval_requests.find_one({"request_id": request_id})
        updated_request_doc.pop("_id", None)
        updated_request = ApprovalRequest(**updated_request_doc)
        
        # Log activity
        await log_activity(
            db, request_doc["session_id"], "", request_doc["step"],
            ActionType.APPROVE if approval_action.action == "approve" else ActionType.REJECT,
            user_id, user_name, UserRole.SUPERVISOR,
            comments=f"{approval_action.action.title()}ed request: {approval_action.reason or 'No reason provided'}"
        )
        
        return ApprovalRequestResponse(
            success=True,
            request=updated_request,
            message=f"Approval request {approval_action.action}d successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to handle approval request: {str(e)}"
        )

@router.post("/sessions/{session_id}/lock", response_model=SessionStatusResponse)
async def lock_session(
    session_id: str,
    lock_request: SessionLockRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lock a session or specific step from editing"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Check permissions
        if not await has_permission_db(user_id, "lock_sessions"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to lock sessions"
            )
        
        # Create session lock
        lock_id = generate_id("LOCK")
        session_lock = SessionLock(
            lock_id=lock_id,
            session_id=session_id,
            step=lock_request.step,
            locked_by=user_id,
            locked_by_name=user_name,
            lock_type=lock_request.lock_type,
            reason=lock_request.reason,
            expires_at=datetime.utcnow() + timedelta(hours=lock_request.duration_hours or 24)
        )
        
        # Store lock
        lock_dict = session_lock.dict()
        lock_dict["_id"] = ObjectId()
        await db.hospital_mobile_session_locks.insert_one(lock_dict)
        
        # Update session lock status
        update_data = {
            "is_locked": True,
            "lock_reason": lock_request.reason,
            "updated_at": datetime.utcnow()
        }
        
        await db.hospital_mobile_sessions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # Get session status
        session_doc = await db.hospital_mobile_sessions.find_one({"session_id": session_id})
        session = MultiUserScreeningSession(**{k: v for k, v in session_doc.items() if k != "_id"})
        
        # Log activity
        await log_activity(
            db, session_id, session.patient_id, lock_request.step or session.current_step,
            ActionType.LOCK, user_id, user_name, UserRole.SUPERVISOR,
            comments=f"Locked session: {lock_request.reason}"
        )
        
        return SessionStatusResponse(
            success=True,
            session_id=session_id,
            current_step=session.current_step,
            overall_status=session.overall_status,
            is_locked=True,
            active_users=session.active_users,
            next_steps=[],  # No next steps when locked
            message=f"Session locked successfully: {lock_request.reason}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to lock session: {str(e)}"
        )

@router.delete("/sessions/{session_id}/lock", response_model=SessionStatusResponse)
async def unlock_session(
    session_id: str,
    reason: str = Query(..., description="Reason for unlocking"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Unlock a session"""
    
    try:
        db = get_database()
        user_id = current_user.get("user_id") or current_user.get("id")
        user_name = current_user.get("name", "Unknown User")
        
        # Check permissions
        if not await has_permission_db(user_id, "lock_sessions"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to unlock sessions"
            )
        
        # Deactivate all locks for this session
        await db.hospital_mobile_session_locks.update_many(
            {"session_id": session_id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        
        # Update session lock status
        update_data = {
            "is_locked": False,
            "lock_reason": None,
            "updated_at": datetime.utcnow()
        }
        
        await db.hospital_mobile_sessions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # Get session status
        session_doc = await db.hospital_mobile_sessions.find_one({"session_id": session_id})
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        session = MultiUserScreeningSession(**{k: v for k, v in session_doc.items() if k != "_id"})
        
        # Determine next steps
        next_steps = []
        current_step_index = list(ScreeningStep).index(session.current_step)
        if current_step_index < len(ScreeningStep) - 1:
            next_steps = list(ScreeningStep)[current_step_index + 1:current_step_index + 3]
        
        # Log activity
        await log_activity(
            db, session_id, session.patient_id, session.current_step,
            ActionType.UNLOCK, user_id, user_name, UserRole.SUPERVISOR,
            comments=f"Unlocked session: {reason}"
        )
        
        return SessionStatusResponse(
            success=True,
            session_id=session_id,
            current_step=session.current_step,
            overall_status=session.overall_status,
            is_locked=False,
            active_users=session.active_users,
            next_steps=next_steps,
            message=f"Session unlocked successfully: {reason}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlock session: {str(e)}"
        )