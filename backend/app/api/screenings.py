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
    patient = await db.patients.find_one({"_id": ObjectId(session_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Create screening session
    session_doc = {
        "patient_id": ObjectId(session_data.patient_id),
        "examiner_id": ObjectId(session_data.examiner_id),
        "screening_type": session_data.screening_type,
        "equipment_used": session_data.equipment_used,
        "notes": session_data.notes,
        "status": "in_progress",
        "created_at": settings.get_current_timestamp(),
        "updated_at": settings.get_current_timestamp(),
        "audit_hash": generate_blockchain_hash(f"screening_session_created:{session_data.patient_id}")
    }
    
    result = await db.screenings.insert_one(session_doc)
    session_doc["_id"] = result.inserted_id
    
    # Log audit
    await db.audit_logs.insert_one({
        "action": "screening_session_created",
        "user_id": current_user["user_id"],
        "session_id": str(result.inserted_id),
        "patient_id": session_data.patient_id,
        "timestamp": settings.get_current_timestamp(),
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
    
    session = await db.screenings.find_one({"_id": ObjectId(session_id)})
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
    session = await db.screenings.find_one({"_id": ObjectId(session_id)})
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
        "updated_at": settings.get_current_timestamp(),
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
        update_doc["completed_at"] = settings.get_current_timestamp()
    
    # Update session
    await db.screenings.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_doc}
    )
    
    # Log audit
    await db.audit_logs.insert_one({
        "action": "screening_session_updated",
        "user_id": current_user["user_id"],
        "session_id": session_id,
        "patient_id": str(session["patient_id"]),
        "timestamp": settings.get_current_timestamp(),
        "audit_hash": update_doc["audit_hash"],
        "details": {
            "status": update_data.status,
            "examiner_role": current_user["role"]
        }
    })
    
    # Get updated session
    updated_session = await db.screenings.find_one({"_id": ObjectId(session_id)})
    
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
    
    # Apply role-based filtering
    if current_user["role"] not in ["admin", "doctor"]:
        # Teachers and parents can only see their own screenings
        filter_query["examiner_id"] = ObjectId(current_user["user_id"])
    
    # Get sessions
    cursor = db.screenings.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    return [
        ScreeningSessionResponse(
            session_id=str(session["_id"]),
            patient_id=str(session["patient_id"]),
            examiner_id=str(session["examiner_id"]),
            screening_type=session["screening_type"],
            status=session["status"],
            created_at=session["created_at"],
            completed_at=session.get("completed_at"),
            results=session.get("results"),
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
    
    session = await db.screenings.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening session not found"
        )
    
    # Soft delete by marking as cancelled
    audit_hash = generate_blockchain_hash(f"screening_session_deleted:{session_id}")
    
    await db.screenings.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "cancelled",
                "deleted_at": settings.get_current_timestamp(),
                "deleted_by": current_user["user_id"],
                "audit_hash": audit_hash
            }
        }
    )
    
    # Log audit
    await db.audit_logs.insert_one({
        "action": "screening_session_deleted",
        "user_id": current_user["user_id"],
        "session_id": session_id,
        "patient_id": str(session["patient_id"]),
        "timestamp": settings.get_current_timestamp(),
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
    
    # Check permissions
    if current_user["role"] not in ["admin", "doctor", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient analytics"
        )
    
    # Get patient's screening history
    sessions = await db.screenings.find({
        "patient_id": ObjectId(patient_id),
        "status": {"$ne": "cancelled"}
    }).sort("created_at", -1).to_list(length=None)
    
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
