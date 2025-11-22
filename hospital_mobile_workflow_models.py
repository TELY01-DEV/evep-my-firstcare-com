"""
Hospital Mobile Unit Multi-User Screening Workflow Models

This module provides comprehensive models for managing multi-user, multi-station
screening workflows where multiple staff/doctors work on the same patient
through different screening steps.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
from bson import ObjectId

# Workflow Step Enums
class ScreeningStep(str, Enum):
    REGISTRATION = "registration"
    INITIAL_ASSESSMENT = "initial_assessment" 
    VISION_TESTING = "vision_testing"
    AUTO_REFRACTION = "auto_refraction"
    CLINICAL_EVALUATION = "clinical_evaluation"
    DOCTOR_DIAGNOSIS = "doctor_diagnosis"
    PRESCRIPTION = "prescription"
    QUALITY_CHECK = "quality_check"
    FINAL_APPROVAL = "final_approval"
    COMPLETED = "completed"

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    APPROVED = "approved"
    REQUIRES_APPROVAL = "requires_approval"
    REJECTED = "rejected"
    LOCKED = "locked"

class UserRole(str, Enum):
    REGISTRATION_STAFF = "registration_staff"
    VISION_TECHNICIAN = "vision_technician"
    REFRACTION_TECHNICIAN = "refraction_technician"
    CLINICAL_ASSISTANT = "clinical_assistant"
    DOCTOR = "doctor"
    SUPERVISOR = "supervisor"
    QUALITY_CHECKER = "quality_checker"

class ActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    COMPLETE = "complete"
    APPROVE = "approve"
    REJECT = "reject"
    LOCK = "lock"
    UNLOCK = "unlock"
    VIEW = "view"
    EDIT = "edit"

# Activity Log Models
class ActivityLog(BaseModel):
    log_id: str = Field(..., description="Unique log ID")
    session_id: str = Field(..., description="Screening session ID")
    patient_id: str = Field(..., description="Patient ID")
    step: ScreeningStep = Field(..., description="Workflow step")
    action: ActionType = Field(..., description="Action performed")
    user_id: str = Field(..., description="User who performed the action")
    user_name: str = Field(..., description="User display name")
    user_role: UserRole = Field(..., description="User role")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    previous_data: Optional[Dict[str, Any]] = Field(None, description="Previous data state")
    new_data: Optional[Dict[str, Any]] = Field(None, description="New data state")
    changes: List[Dict[str, Any]] = Field(default_factory=list, description="Specific changes made")
    comments: Optional[str] = Field(None, description="Additional comments")
    ip_address: Optional[str] = Field(None, description="User IP address")
    device_info: Optional[str] = Field(None, description="Device information")

# Workflow Step Models
class WorkflowStepData(BaseModel):
    step: ScreeningStep = Field(..., description="Workflow step")
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    assigned_user_id: Optional[str] = Field(None, description="User assigned to this step")
    assigned_user_name: Optional[str] = Field(None, description="Assigned user name")
    assigned_role: Optional[UserRole] = Field(None, description="Required role for this step")
    started_at: Optional[datetime] = Field(None, description="Step start time")
    completed_at: Optional[datetime] = Field(None, description="Step completion time")
    completed_by: Optional[str] = Field(None, description="User who completed the step")
    completed_by_name: Optional[str] = Field(None, description="Name of user who completed")
    approved_at: Optional[datetime] = Field(None, description="Step approval time")
    approved_by: Optional[str] = Field(None, description="User who approved the step")
    approved_by_name: Optional[str] = Field(None, description="Name of user who approved")
    data: Dict[str, Any] = Field(default_factory=dict, description="Step-specific data")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors")
    requires_approval: bool = Field(default=False, description="Whether step requires approval")
    is_locked: bool = Field(default=False, description="Whether step is locked from editing")
    lock_reason: Optional[str] = Field(None, description="Reason for locking")
    estimated_duration: Optional[int] = Field(None, description="Estimated duration in minutes")
    actual_duration: Optional[int] = Field(None, description="Actual duration in minutes")

# Multi-User Screening Session
class MultiUserScreeningSession(BaseModel):
    session_id: str = Field(..., description="Unique session ID")
    patient_id: str = Field(..., description="Patient ID")
    patient_name: str = Field(..., description="Patient name for display")
    screening_type: str = Field(default="hospital_mobile_unit", description="Type of screening")
    
    # Workflow Management
    current_step: ScreeningStep = Field(default=ScreeningStep.REGISTRATION)
    overall_status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    workflow_steps: List[WorkflowStepData] = Field(default_factory=list)
    
    # Session Management
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="User who created the session")
    created_by_name: str = Field(..., description="Name of user who created session")
    
    # Multi-User Tracking
    active_users: List[str] = Field(default_factory=list, description="Currently active users")
    all_participants: List[str] = Field(default_factory=list, description="All users who participated")
    current_user: Optional[str] = Field(None, description="Currently working user")
    
    # Approval Management
    requires_final_approval: bool = Field(default=True, description="Requires final approval")
    final_approved_by: Optional[str] = Field(None, description="Final approver user ID")
    final_approved_by_name: Optional[str] = Field(None, description="Final approver name")
    final_approved_at: Optional[datetime] = Field(None, description="Final approval time")
    is_locked: bool = Field(default=False, description="Session locked from editing")
    lock_reason: Optional[str] = Field(None, description="Reason for locking")
    
    # Quality Management
    quality_checked: bool = Field(default=False, description="Quality check completed")
    quality_checked_by: Optional[str] = Field(None, description="Quality checker user ID")
    quality_checked_at: Optional[datetime] = Field(None, description="Quality check time")
    quality_score: Optional[float] = Field(None, description="Quality score (0-100)")
    quality_notes: Optional[str] = Field(None, description="Quality check notes")
    
    # Activity Tracking
    activity_logs: List[ActivityLog] = Field(default_factory=list, description="All activity logs")
    total_duration: Optional[int] = Field(None, description="Total session duration in minutes")
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

# Approval System Models
class ApprovalRequest(BaseModel):
    request_id: str = Field(..., description="Unique request ID")
    session_id: str = Field(..., description="Screening session ID")
    step: ScreeningStep = Field(..., description="Step requesting approval")
    requested_by: str = Field(..., description="User requesting approval")
    requested_by_name: str = Field(..., description="Requester name")
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    
    approval_type: str = Field(..., description="Type of approval needed")
    reason: str = Field(..., description="Reason for approval request")
    data_to_approve: Dict[str, Any] = Field(..., description="Data requiring approval")
    
    # Approval Status
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    approved_by: Optional[str] = Field(None, description="Approver user ID")
    approved_by_name: Optional[str] = Field(None, description="Approver name")
    approved_at: Optional[datetime] = Field(None, description="Approval time")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection")
    
    # Priority and Urgency
    priority: str = Field(default="normal", description="Request priority")
    urgency: str = Field(default="normal", description="Request urgency")
    expires_at: Optional[datetime] = Field(None, description="Request expiration time")

# User Permission and Access Models
class UserAccess(BaseModel):
    user_id: str = Field(..., description="User ID")
    session_id: str = Field(..., description="Session ID")
    role: UserRole = Field(..., description="User role in this session")
    allowed_steps: List[ScreeningStep] = Field(..., description="Steps user can access")
    permissions: List[str] = Field(..., description="Specific permissions")
    access_granted_at: datetime = Field(default_factory=datetime.utcnow)
    access_expires_at: Optional[datetime] = Field(None, description="Access expiration")
    is_active: bool = Field(default=True, description="Whether access is active")

# Session Lock Models
class SessionLock(BaseModel):
    lock_id: str = Field(..., description="Unique lock ID")
    session_id: str = Field(..., description="Screening session ID")
    step: Optional[ScreeningStep] = Field(None, description="Specific step locked")
    locked_by: str = Field(..., description="User who locked the session")
    locked_by_name: str = Field(..., description="Name of user who locked")
    locked_at: datetime = Field(default_factory=datetime.utcnow)
    lock_type: str = Field(..., description="Type of lock (editing, approval, etc.)")
    reason: str = Field(..., description="Reason for locking")
    expires_at: Optional[datetime] = Field(None, description="Lock expiration time")
    is_active: bool = Field(default=True, description="Whether lock is active")

# API Request/Response Models
class MultiUserSessionCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID")
    screening_type: str = Field(default="hospital_mobile_unit")
    initial_step: ScreeningStep = Field(default=ScreeningStep.REGISTRATION)
    assigned_users: Optional[List[str]] = Field(None, description="Initially assigned users")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class StepUpdateRequest(BaseModel):
    step: ScreeningStep = Field(..., description="Step to update")
    data: Dict[str, Any] = Field(..., description="Step data")
    complete_step: bool = Field(default=False, description="Mark step as complete")
    request_approval: bool = Field(default=False, description="Request approval for step")
    comments: Optional[str] = Field(None, description="Comments about the update")

class ApprovalAction(BaseModel):
    action: str = Field(..., description="approve or reject")
    reason: Optional[str] = Field(None, description="Reason for approval/rejection")
    comments: Optional[str] = Field(None, description="Additional comments")

class SessionLockRequest(BaseModel):
    step: Optional[ScreeningStep] = Field(None, description="Specific step to lock")
    lock_type: str = Field(..., description="Type of lock")
    reason: str = Field(..., description="Reason for locking")
    duration_hours: Optional[int] = Field(None, description="Lock duration in hours")

# Response Models
class MultiUserSessionResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    session: MultiUserScreeningSession = Field(..., description="Screening session")
    message: str = Field(..., description="Response message")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")

class ActivityLogResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    logs: List[ActivityLog] = Field(..., description="Activity logs")
    total_count: int = Field(..., description="Total log count")
    message: str = Field(..., description="Response message")

class ApprovalRequestResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    request: ApprovalRequest = Field(..., description="Approval request")
    message: str = Field(..., description="Response message")

class SessionStatusResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    session_id: str = Field(..., description="Session ID")
    current_step: ScreeningStep = Field(..., description="Current step")
    overall_status: WorkflowStatus = Field(..., description="Overall status")
    is_locked: bool = Field(..., description="Whether session is locked")
    active_users: List[str] = Field(..., description="Currently active users")
    next_steps: List[ScreeningStep] = Field(..., description="Available next steps")
    message: str = Field(..., description="Response message")