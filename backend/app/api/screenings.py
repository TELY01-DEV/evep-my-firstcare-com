"""
Screening API endpoints for EVEP Platform
Handles vision screening sessions, results, and analysis
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from bson import ObjectId

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash
from app.core.database import get_database
from app.utils.timezone import get_current_thailand_time, format_datetime_for_frontend

router = APIRouter(prefix="/screenings", tags=["Screenings"])

# Security
security = HTTPBearer()

# Models
class ScreeningSessionCreate(BaseModel):
    patient_id: str
    examiner_id: str
    screening_type: str = Field(..., description="Type of screening (e.g., 'distance', 'near', 'color')")
    screening_category: str = Field(..., description="Category: 'school_screening' for teachers, 'medical_screening' for doctors")
    equipment_used: Optional[str] = None
    notes: Optional[str] = None

class ScreeningResult(BaseModel):
    eye: str = Field(..., description="Left or Right eye")
    distance_acuity: Optional[str] = None
    near_acuity: Optional[str] = None
    color_vision: Optional[str] = None
    depth_perception: Optional[str] = None
    contrast_sensitivity: Optional[str] = None
    additional_tests: Optional[dict] = None

class ScreeningOutcome(BaseModel):
    overall_result: str = Field(..., description="Overall screening result: 'normal', 'abnormal', 'borderline'")
    risk_level: str = Field(..., description="Risk level: 'low', 'medium', 'high'")
    specific_findings: List[str] = Field(default_factory=list, description="Specific findings from screening")
    academic_impact: Optional[str] = None
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for follow-up")
    follow_up_required: bool = Field(default=False, description="Whether follow-up is required")
    follow_up_type: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None

class ScreeningOutcomeCreate(BaseModel):
    outcome: ScreeningOutcome
    examiner_notes: Optional[str] = None
    parent_notification_sent: bool = Field(default=False)
    school_notification_sent: bool = Field(default=False)

class ScreeningOutcomeResponse(BaseModel):
    outcome_id: str
    session_id: str
    outcome: ScreeningOutcome
    examiner_notes: Optional[str] = None
    parent_notification_sent: bool
    school_notification_sent: bool
    created_at: str
    updated_at: str

class ScreeningSessionUpdate(BaseModel):
    results: List[ScreeningResult]
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    follow_up_date: Optional[str] = None
    status: str = Field(..., description="Status: 'in_progress', 'completed', 'cancelled'")

class ScreeningSessionResponse(BaseModel):
    session_id: str
    patient_id: str
    examiner_id: str
    screening_type: str
    screening_category: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    results: Optional[List[ScreeningResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    follow_up_date: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

@router.post("/sessions", response_model=ScreeningSessionResponse)
async def create_screening_session(
    session_data: ScreeningSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new screening session"""
    
    # Check if user has permission to create screenings
    if current_user["role"] not in ["doctor", "teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create screening sessions"
        )
    
    db = get_database()
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(session_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate screening category based on user role
    if current_user["role"] == "teacher" and session_data.screening_category != "school_screening":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teachers can only create school screening sessions"
        )
    
    if current_user["role"] == "doctor" and session_data.screening_category != "medical_screening":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctors can only create medical screening sessions"
        )
    
    # Create screening session
    session_doc = {
        "patient_id": ObjectId(session_data.patient_id),
        "examiner_id": ObjectId(session_data.examiner_id),
        "screening_type": session_data.screening_type,
        "screening_category": session_data.screening_category,
        "equipment_used": session_data.equipment_used,
        "notes": session_data.notes,
        "status": "in_progress",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "audit_hash": generate_blockchain_hash(f"screening_session_created:{session_data.patient_id}")
    }
    
    result = await db.evep.screenings.insert_one(session_doc)
    session_doc["_id"] = result.inserted_id
    
    # Log audit
    await db.evep.audit_logs.insert_one({
        "action": "screening_session_created",
        "user_id": current_user["user_id"],
        "session_id": str(result.inserted_id),
        "patient_id": session_data.patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": session_doc["audit_hash"],
        "details": {
            "screening_type": session_data.screening_type,
            "examiner_role": current_user["role"]
        }
    })
    
    return ScreeningSessionResponse(
        session_id=str(result.inserted_id),
        patient_id=session_data.patient_id,
        examiner_id=session_data.examiner_id,
        screening_type=session_data.screening_type,
        screening_category=session_data.screening_category,
        status="in_progress",
        created_at=session_doc["created_at"]
    )

@router.get("/sessions/{session_id}", response_model=ScreeningSessionResponse)
async def get_screening_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific screening session"""
    
    db = get_database()
    
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Check permissions (examiner, patient's doctor, or admin)
    if (str(session["examiner_id"]) != current_user["user_id"] and 
        current_user["role"] not in ["admin", "doctor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view this screening session"
        )
    
    return ScreeningSessionResponse(
        session_id=str(session["_id"]),
        patient_id=str(session["patient_id"]),
        examiner_id=str(session["examiner_id"]),
        screening_type=session["screening_type"],
        screening_category=session.get("screening_category", "medical_screening"),  # Default for backward compatibility
        status=session["status"],
        created_at=session["created_at"],
        completed_at=session.get("completed_at"),
        results=session.get("results"),
        conclusion=session.get("conclusion"),
        recommendations=session.get("recommendations"),
        follow_up_date=session.get("follow_up_date")
    )

@router.put("/sessions/{session_id}", response_model=ScreeningSessionResponse)
async def update_screening_session(
    session_id: str,
    update_data: ScreeningSessionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a screening session with results"""
    
    db = get_database()
    
    # Get existing session
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Check permissions
    if (str(session["examiner_id"]) != current_user["user_id"] and 
        current_user["role"] not in ["admin", "doctor"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update this screening session"
        )
    
    # Prepare update data
    update_doc = {
        "status": update_data.status,
        "updated_at": datetime.utcnow().isoformat(),
        "audit_hash": generate_blockchain_hash(f"screening_session_updated:{session_id}")
    }
    
    if update_data.results:
        update_doc["results"] = [result.dict() for result in update_data.results]
    
    if update_data.conclusion:
        update_doc["conclusion"] = update_data.conclusion
    
    if update_data.recommendations:
        update_doc["recommendations"] = update_data.recommendations
    
    if update_data.follow_up_date:
        update_doc["follow_up_date"] = update_data.follow_up_date
    
    # Mark as completed if status is completed
    if update_data.status == "completed":
        update_doc["completed_at"] = datetime.utcnow().isoformat()
    
    # Update session
    await db.evep.screenings.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_doc}
    )
    
    # Log audit
    await db.evep.audit_logs.insert_one({
        "action": "screening_session_updated",
        "user_id": current_user["user_id"],
        "session_id": session_id,
        "patient_id": str(session["patient_id"]),
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": update_doc["audit_hash"],
        "details": {
            "status": update_data.status,
            "examiner_role": current_user["role"]
        }
    })
    
    # Get updated session
    updated_session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    
    return ScreeningSessionResponse(
        session_id=str(updated_session["_id"]),
        patient_id=str(updated_session["patient_id"]),
        examiner_id=str(updated_session["examiner_id"]),
        screening_type=updated_session["screening_type"],
        status=updated_session["status"],
        created_at=updated_session["created_at"],
        completed_at=updated_session.get("completed_at"),
        results=updated_session.get("results"),
        conclusion=updated_session.get("conclusion"),
        recommendations=updated_session.get("recommendations"),
        follow_up_date=updated_session.get("follow_up_date")
    )

@router.get("/sessions", response_model=List[ScreeningSessionResponse])
async def list_screening_sessions(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    examiner_id: Optional[str] = Query(None, description="Filter by examiner ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    screening_type: Optional[str] = Query(None, description="Filter by screening type"),
    screening_category: Optional[str] = Query(None, description="Filter by screening category"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: dict = Depends(get_current_user)
):
    """List screening sessions with optional filtering"""
    
    db = get_database()
    
    # Build filter
    filter_query = {}
    
    if patient_id:
        filter_query["patient_id"] = ObjectId(patient_id)
    
    if examiner_id:
        filter_query["examiner_id"] = ObjectId(examiner_id)
    
    if status:
        filter_query["status"] = status
    
    if screening_type:
        filter_query["screening_type"] = screening_type
    
    if screening_category:
        filter_query["screening_category"] = screening_category
    
    # Apply role-based filtering
    if current_user["role"] == "teacher":
        # Teachers can only see school screenings
        filter_query["screening_category"] = "school_screening"
    elif current_user["role"] == "doctor":
        # Doctors can only see medical screenings
        filter_query["screening_category"] = "medical_screening"
    elif current_user["role"] not in ["admin"]:
        # Other roles have limited access
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view screening sessions"
        )
    
    # Get sessions
    cursor = db.evep.screenings.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    return [
        ScreeningSessionResponse(
            session_id=str(session["_id"]),
            patient_id=str(session["patient_id"]),
            examiner_id=str(session.get("examiner_id", "")),
            screening_type=session["screening_type"],
            screening_category=session.get("screening_category", "medical_screening"),
            status=session["status"],
            created_at=session["created_at"].isoformat() if isinstance(session["created_at"], datetime) else session["created_at"],
            completed_at=session.get("completed_at").isoformat() if session.get("completed_at") and isinstance(session["completed_at"], datetime) else session.get("completed_at"),
            results=None,  # Skip results for now to avoid validation issues
            conclusion=session.get("conclusion"),
            recommendations=session.get("recommendations"),
            follow_up_date=session.get("follow_up_date")
        )
        for session in sessions
    ]

@router.delete("/sessions/{session_id}")
async def delete_screening_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a screening session (soft delete)"""
    
    # Only admins can delete sessions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete screening sessions"
        )
    
    db = get_database()
    
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Soft delete by marking as cancelled
    audit_hash = generate_blockchain_hash(f"screening_session_deleted:{session_id}")
    
    await db.evep.screenings.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "cancelled",
                "deleted_at": datetime.utcnow().isoformat(),
                "deleted_by": current_user["user_id"],
                "audit_hash": audit_hash
            }
        }
    )
    
    # Log audit
    await db.evep.audit_logs.insert_one({
        "action": "screening_session_deleted",
        "user_id": current_user["user_id"],
        "session_id": session_id,
        "patient_id": str(session["patient_id"]),
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "deleted_by_role": current_user["role"]
        }
    })
    
    return {"message": "Screening session deleted successfully"}



@router.get("/analytics/patient/{patient_id}")
async def get_patient_screening_analytics(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get screening analytics for a specific patient"""
    
    db = get_database()
    
    # Check permissions and filter by screening category
    if current_user["role"] == "teacher":
        # Teachers can only see school screening analytics
        screening_category_filter = "school_screening"
    elif current_user["role"] == "doctor":
        # Doctors can only see medical screening analytics
        screening_category_filter = "medical_screening"
    elif current_user["role"] == "admin":
        # Admins can see all analytics
        screening_category_filter = None
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient analytics"
        )
    
    # Build query for patient's screening history
    query = {
        "patient_id": ObjectId(patient_id),
        "status": {"$ne": "cancelled"}
    }
    
    # Add screening category filter if specified
    if screening_category_filter:
        query["screening_category"] = screening_category_filter
    
    # Get patient's screening history
    sessions = await db.evep.screenings.find(query).sort("created_at", -1).to_list(length=None)
    
    if not sessions:
        return {
            "patient_id": patient_id,
            "total_screenings": 0,
            "screening_history": [],
            "trends": {},
            "recommendations": []
        }
    
    # Calculate analytics
    total_screenings = len(sessions)
    completed_screenings = len([s for s in sessions if s["status"] == "completed"])
    
    # Group by screening type
    screening_types = {}
    for session in sessions:
        screening_type = session["screening_type"]
        if screening_type not in screening_types:
            screening_types[screening_type] = 0
        screening_types[screening_type] += 1
    
    # Get latest results for trends
    latest_results = []
    for session in sessions[:5]:  # Last 5 screenings
        if session.get("results"):
            latest_results.append({
                "session_id": str(session["_id"]),
                "date": session["created_at"],
                "results": session["results"],
                "conclusion": session.get("conclusion")
            })
    
    return {
        "patient_id": patient_id,
        "total_screenings": total_screenings,
        "completed_screenings": completed_screenings,
        "completion_rate": (completed_screenings / total_screenings * 100) if total_screenings > 0 else 0,
        "screening_types": screening_types,
        "latest_results": latest_results,
        "trends": {
            "screening_frequency": "monthly",  # Placeholder
            "improvement_rate": "stable"  # Placeholder
        },
        "recommendations": [
            "Continue regular screenings",
            "Monitor for any changes in vision"
        ]
    }

# ==================== ENHANCED SCREENING OUTCOME MANAGEMENT ====================

@router.post("/sessions/{session_id}/outcome", response_model=ScreeningOutcomeResponse)
async def create_screening_outcome(
    session_id: str,
    outcome_data: ScreeningOutcomeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a detailed screening outcome for a session"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create screening outcomes"
        )
    
    # Validate session exists
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Check if outcome already exists
    existing_outcome = await db.evep.screening_outcomes.find_one({
        "session_id": ObjectId(session_id)
    })
    
    if existing_outcome:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Screening outcome already exists for this session"
        )
    
    # Create outcome document
    outcome_doc = {
        "session_id": ObjectId(session_id),
        "patient_id": session["patient_id"],
        "examiner_id": session["examiner_id"],
        "outcome": outcome_data.outcome.dict(),
        "examiner_notes": outcome_data.examiner_notes,
        "parent_notification_sent": outcome_data.parent_notification_sent,
        "school_notification_sent": outcome_data.school_notification_sent,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.screening_outcomes.insert_one(outcome_doc)
    
    # Update session status to completed if outcome indicates completion
    if outcome_data.outcome.overall_result in ["normal", "abnormal"]:
        await db.evep.screenings.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": get_current_thailand_time(),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_screening_outcome",
        details=f"Created screening outcome for session {session_id}",
        ip_address="system"
    )
    
    return ScreeningOutcomeResponse(
        outcome_id=str(result.inserted_id),
        session_id=session_id,
        outcome=outcome_data.outcome,
        examiner_notes=outcome_data.examiner_notes,
        parent_notification_sent=outcome_data.parent_notification_sent,
        school_notification_sent=outcome_data.school_notification_sent,
        created_at=outcome_doc["created_at"].isoformat(),
        updated_at=outcome_doc["updated_at"].isoformat()
    )


@router.get("/sessions/{session_id}/outcome", response_model=ScreeningOutcomeResponse)
async def get_screening_outcome(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the screening outcome for a specific session"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "teacher", "admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view screening outcomes"
        )
    
    # Get outcome
    outcome = await db.evep.screening_outcomes.find_one({
        "session_id": ObjectId(session_id)
    })
    
    if not outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening outcome not found"
        )
    
    # Check if user has access to this outcome
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Role-based access control
    if current_user["role"] == "teacher" and session.get("screening_category") != "school_screening":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers can only view school screening outcomes"
        )
    
    if current_user["role"] == "doctor" and session.get("screening_category") != "medical_screening":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctors can only view medical screening outcomes"
        )
    
    return ScreeningOutcomeResponse(
        outcome_id=str(outcome["_id"]),
        session_id=session_id,
        outcome=ScreeningOutcome(**outcome["outcome"]),
        examiner_notes=outcome.get("examiner_notes"),
        parent_notification_sent=outcome.get("parent_notification_sent", False),
        school_notification_sent=outcome.get("school_notification_sent", False),
        created_at=outcome["created_at"].isoformat(),
        updated_at=outcome["updated_at"].isoformat()
    )


@router.put("/sessions/{session_id}/outcome", response_model=ScreeningOutcomeResponse)
async def update_screening_outcome(
    session_id: str,
    outcome_data: ScreeningOutcomeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update the screening outcome for a session"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update screening outcomes"
        )
    
    # Validate session exists
    session = await db.evep.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Find existing outcome
    existing_outcome = await db.evep.screening_outcomes.find_one({
        "session_id": ObjectId(session_id)
    })
    
    if not existing_outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening outcome not found"
        )
    
    # Update outcome
    update_doc = {
        "outcome": outcome_data.outcome.dict(),
        "examiner_notes": outcome_data.examiner_notes,
        "parent_notification_sent": outcome_data.parent_notification_sent,
        "school_notification_sent": outcome_data.school_notification_sent,
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.screening_outcomes.update_one(
        {"session_id": ObjectId(session_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening outcome not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_screening_outcome",
        details=f"Updated screening outcome for session {session_id}",
        ip_address="system"
    )
    
    return ScreeningOutcomeResponse(
        outcome_id=str(existing_outcome["_id"]),
        session_id=session_id,
        outcome=outcome_data.outcome,
        examiner_notes=outcome_data.examiner_notes,
        parent_notification_sent=outcome_data.parent_notification_sent,
        school_notification_sent=outcome_data.school_notification_sent,
        created_at=existing_outcome["created_at"].isoformat(),
        updated_at=update_doc["updated_at"].isoformat()
    )


@router.get("/outcomes/patient/{patient_id}")
async def get_patient_screening_outcomes(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all screening outcomes for a specific patient"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "teacher", "admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient screening outcomes"
        )
    
    # Get outcomes
    outcomes = await db.evep.screening_outcomes.find({
        "patient_id": ObjectId(patient_id)
    }).sort("created_at", -1).to_list(length=None)
    
    result = []
    for outcome in outcomes:
        result.append({
            "outcome_id": str(outcome["_id"]),
            "session_id": str(outcome["session_id"]),
            "outcome": outcome["outcome"],
            "examiner_notes": outcome.get("examiner_notes"),
            "parent_notification_sent": outcome.get("parent_notification_sent", False),
            "school_notification_sent": outcome.get("school_notification_sent", False),
            "created_at": outcome["created_at"].isoformat(),
            "updated_at": outcome["updated_at"].isoformat()
        })
    
    return {"outcomes": result, "total_count": len(result)}


@router.get("/outcomes/summary")
async def get_screening_outcomes_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get summary statistics of screening outcomes"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view screening outcomes summary"
        )
    
    # Build aggregation pipeline
    pipeline = []
    
    # Add role-based filtering
    if current_user["role"] == "teacher":
        pipeline.append({
            "$lookup": {
                "from": "screenings",
                "localField": "session_id",
                "foreignField": "_id",
                "as": "session"
            }
        })
        pipeline.append({
            "$match": {
                "session.screening_category": "school_screening"
            }
        })
    elif current_user["role"] == "doctor":
        pipeline.append({
            "$lookup": {
                "from": "screenings",
                "localField": "session_id",
                "foreignField": "_id",
                "as": "session"
            }
        })
        pipeline.append({
            "$match": {
                "session.screening_category": "medical_screening"
            }
        })
    
    # Add summary statistics
    pipeline.extend([
        {
            "$group": {
                "_id": "$outcome.overall_result",
                "count": {"$sum": 1}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_outcomes": {"$sum": "$count"},
                "results": {
                    "$push": {
                        "result": "$_id",
                        "count": "$count"
                    }
                }
            }
        }
    ])
    
    results = await db.evep.screening_outcomes.aggregate(pipeline).to_list(None)
    
    if not results:
        return {
            "total_outcomes": 0,
            "results": [],
            "risk_levels": [],
            "follow_up_required": 0
        }
    
    result = results[0]
    
    # Get risk level distribution
    risk_pipeline = [
        {
            "$group": {
                "_id": "$outcome.risk_level",
                "count": {"$sum": 1}
            }
        }
    ]
    
    risk_results = await db.evep.screening_outcomes.aggregate(risk_pipeline).to_list(None)
    
    # Get follow-up required count
    follow_up_count = await db.evep.screening_outcomes.count_documents({
        "outcome.follow_up_required": True
    })
    
    return {
        "total_outcomes": result["total_outcomes"],
        "results": result["results"],
        "risk_levels": risk_results,
        "follow_up_required": follow_up_count
    }
