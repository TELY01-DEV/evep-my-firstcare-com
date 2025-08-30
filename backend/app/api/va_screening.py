from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import log_security_event
from app.api.auth import get_current_user
from app.utils.timezone import get_current_thailand_time

router = APIRouter()

# Models
class VAScreeningCreate(BaseModel):
    patient_id: str
    appointment_id: str
    screening_type: str = Field(..., description="Type: 'distance', 'near', 'color', 'depth', 'comprehensive'")
    equipment_used: Optional[str] = None
    examiner_notes: Optional[str] = None

class VAScreeningResult(BaseModel):
    eye: str = Field(..., description="Left or Right eye")
    distance_acuity_uncorrected: Optional[str] = None
    distance_acuity_corrected: Optional[str] = None
    near_acuity_uncorrected: Optional[str] = None
    near_acuity_corrected: Optional[str] = None
    color_vision: Optional[str] = None
    depth_perception: Optional[str] = None
    contrast_sensitivity: Optional[str] = None
    additional_tests: Optional[dict] = None

class VAScreeningUpdate(BaseModel):
    results: List[VAScreeningResult]
    overall_assessment: str = Field(..., description="Overall assessment: 'normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment'")
    recommendations: List[str] = Field(default_factory=list)
    follow_up_required: bool = Field(default=False)
    follow_up_date: Optional[str] = None
    examiner_notes: Optional[str] = None
    status: str = Field(..., description="Status: 'in_progress', 'completed', 'cancelled'")

class DiagnosisCreate(BaseModel):
    va_screening_id: str
    diagnosis_type: str = Field(..., description="Type: 'myopia', 'hyperopia', 'astigmatism', 'amblyopia', 'other'")
    severity: str = Field(..., description="Severity: 'mild', 'moderate', 'severe'")
    diagnosis_details: str
    treatment_recommendations: List[str] = Field(default_factory=list)
    glasses_prescription: Optional[dict] = None
    follow_up_plan: Optional[str] = None
    notes: Optional[str] = None

class TreatmentPlanCreate(BaseModel):
    diagnosis_id: str
    treatment_type: str = Field(..., description="Type: 'glasses', 'surgery', 'therapy', 'monitoring'")
    treatment_details: str
    start_date: Optional[str] = None
    duration: Optional[str] = None
    cost_estimate: Optional[float] = None
    insurance_coverage: Optional[str] = None
    notes: Optional[str] = None

class VAScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    appointment_id: str
    screening_type: str
    equipment_used: Optional[str] = None
    results: Optional[List[VAScreeningResult]] = None
    overall_assessment: Optional[str] = None
    recommendations: Optional[List[str]] = None
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    examiner_notes: Optional[str] = None
    status: str
    examiner_id: str
    examiner_name: str
    created_at: str
    updated_at: str

class DiagnosisResponse(BaseModel):
    diagnosis_id: str
    va_screening_id: str
    diagnosis_type: str
    severity: str
    diagnosis_details: str
    treatment_recommendations: List[str]
    glasses_prescription: Optional[dict] = None
    follow_up_plan: Optional[str] = None
    notes: Optional[str] = None
    diagnosed_by: str
    diagnosed_by_name: str
    created_at: str
    updated_at: str

class TreatmentPlanResponse(BaseModel):
    plan_id: str
    diagnosis_id: str
    treatment_type: str
    treatment_details: str
    start_date: Optional[str] = None
    duration: Optional[str] = None
    cost_estimate: Optional[float] = None
    insurance_coverage: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_by: str
    created_by_name: str
    created_at: str
    updated_at: str

# VA Screening Endpoints
@router.post("/screenings/va", response_model=VAScreeningResponse)
async def create_va_screening(
    screening_data: VAScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new VA screening session"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create VA screenings"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(screening_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate appointment exists
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(screening_data.appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Create VA screening document
    screening_doc = {
        "patient_id": ObjectId(screening_data.patient_id),
        "appointment_id": ObjectId(screening_data.appointment_id),
        "screening_type": screening_data.screening_type,
        "equipment_used": screening_data.equipment_used,
        "examiner_notes": screening_data.examiner_notes,
        "status": "in_progress",
        "examiner_id": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.va_screenings.insert_one(screening_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_va_screening",
        details=f"Created VA screening for patient {screening_data.patient_id}",
        ip_address="system"
    )
    
    # Get examiner name
    examiner = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    examiner_name = f"{examiner.get('first_name', '')} {examiner.get('last_name', '')}" if examiner else "Unknown"
    
    return VAScreeningResponse(
        screening_id=str(result.inserted_id),
        patient_id=screening_data.patient_id,
        appointment_id=screening_data.appointment_id,
        screening_type=screening_data.screening_type,
        equipment_used=screening_data.equipment_used,
        examiner_notes=screening_data.examiner_notes,
        status="in_progress",
        examiner_id=current_user["user_id"],
        examiner_name=examiner_name,
        created_at=screening_doc["created_at"].isoformat(),
        updated_at=screening_doc["updated_at"].isoformat()
    )


@router.get("/screenings/va/{screening_id}", response_model=VAScreeningResponse)
async def get_va_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific VA screening by ID"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view VA screenings"
        )
    
    # Get VA screening
    screening = await db.evep.va_screenings.find_one({"_id": ObjectId(screening_id)})
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VA screening not found"
        )
    
    # Get examiner name
    examiner = await db.evep.users.find_one({"_id": screening["examiner_id"]})
    examiner_name = f"{examiner.get('first_name', '')} {examiner.get('last_name', '')}" if examiner else "Unknown"
    
    return VAScreeningResponse(
        screening_id=str(screening["_id"]),
        patient_id=str(screening["patient_id"]),
        appointment_id=str(screening["appointment_id"]),
        screening_type=screening["screening_type"],
        equipment_used=screening.get("equipment_used"),
        results=screening.get("results"),
        overall_assessment=screening.get("overall_assessment"),
        recommendations=screening.get("recommendations", []),
        follow_up_required=screening.get("follow_up_required", False),
        follow_up_date=screening.get("follow_up_date"),
        examiner_notes=screening.get("examiner_notes"),
        status=screening["status"],
        examiner_id=str(screening["examiner_id"]),
        examiner_name=examiner_name,
        created_at=screening["created_at"].isoformat(),
        updated_at=screening["updated_at"].isoformat()
    )


@router.put("/screenings/va/{screening_id}", response_model=VAScreeningResponse)
async def update_va_screening(
    screening_id: str,
    update_data: VAScreeningUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a VA screening with results"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update VA screenings"
        )
    
    # Get existing screening
    screening = await db.evep.va_screenings.find_one({"_id": ObjectId(screening_id)})
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VA screening not found"
        )
    
    # Build update document
    update_doc = {
        "results": [result.dict() for result in update_data.results],
        "overall_assessment": update_data.overall_assessment,
        "recommendations": update_data.recommendations,
        "follow_up_required": update_data.follow_up_required,
        "follow_up_date": update_data.follow_up_date,
        "examiner_notes": update_data.examiner_notes,
        "status": update_data.status,
        "updated_at": get_current_thailand_time()
    }
    
    # Update screening
    result = await db.evep.va_screenings.update_one(
        {"_id": ObjectId(screening_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VA screening not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_va_screening",
        details=f"Updated VA screening {screening_id}",
        ip_address="system"
    )
    
    # Return updated screening
    return await get_va_screening(screening_id, current_user)


@router.post("/diagnoses", response_model=DiagnosisResponse)
async def create_diagnosis(
    diagnosis_data: DiagnosisCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a diagnosis based on VA screening"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create diagnoses"
        )
    
    # Validate VA screening exists
    screening = await db.evep.va_screenings.find_one({"_id": ObjectId(diagnosis_data.va_screening_id)})
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VA screening not found"
        )
    
    # Create diagnosis document
    diagnosis_doc = {
        "va_screening_id": ObjectId(diagnosis_data.va_screening_id),
        "patient_id": screening["patient_id"],
        "diagnosis_type": diagnosis_data.diagnosis_type,
        "severity": diagnosis_data.severity,
        "diagnosis_details": diagnosis_data.diagnosis_details,
        "treatment_recommendations": diagnosis_data.treatment_recommendations,
        "glasses_prescription": diagnosis_data.glasses_prescription,
        "follow_up_plan": diagnosis_data.follow_up_plan,
        "notes": diagnosis_data.notes,
        "diagnosed_by": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.diagnoses.insert_one(diagnosis_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_diagnosis",
        details=f"Created diagnosis for VA screening {diagnosis_data.va_screening_id}",
        ip_address="system"
    )
    
    # Get doctor name
    doctor = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    doctor_name = f"{doctor.get('first_name', '')} {doctor.get('last_name', '')}" if doctor else "Unknown"
    
    return DiagnosisResponse(
        diagnosis_id=str(result.inserted_id),
        va_screening_id=diagnosis_data.va_screening_id,
        diagnosis_type=diagnosis_data.diagnosis_type,
        severity=diagnosis_data.severity,
        diagnosis_details=diagnosis_data.diagnosis_details,
        treatment_recommendations=diagnosis_data.treatment_recommendations,
        glasses_prescription=diagnosis_data.glasses_prescription,
        follow_up_plan=diagnosis_data.follow_up_plan,
        notes=diagnosis_data.notes,
        diagnosed_by=current_user["user_id"],
        diagnosed_by_name=doctor_name,
        created_at=diagnosis_doc["created_at"].isoformat(),
        updated_at=diagnosis_doc["updated_at"].isoformat()
    )


@router.get("/diagnoses/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnoses(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all diagnoses for a specific patient"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view diagnoses"
        )
    
    # Get diagnoses
    diagnoses = await db.evep.diagnoses.find({
        "patient_id": ObjectId(patient_id)
    }).sort("created_at", -1).to_list(None)
    
    result = []
    for diagnosis in diagnoses:
        # Get doctor name
        doctor = await db.evep.users.find_one({"_id": diagnosis["diagnosed_by"]})
        doctor_name = f"{doctor.get('first_name', '')} {doctor.get('last_name', '')}" if doctor else "Unknown"
        
        result.append(DiagnosisResponse(
            diagnosis_id=str(diagnosis["_id"]),
            va_screening_id=str(diagnosis["va_screening_id"]),
            diagnosis_type=diagnosis["diagnosis_type"],
            severity=diagnosis["severity"],
            diagnosis_details=diagnosis["diagnosis_details"],
            treatment_recommendations=diagnosis.get("treatment_recommendations", []),
            glasses_prescription=diagnosis.get("glasses_prescription"),
            follow_up_plan=diagnosis.get("follow_up_plan"),
            notes=diagnosis.get("notes"),
            diagnosed_by=str(diagnosis["diagnosed_by"]),
            diagnosed_by_name=doctor_name,
            created_at=diagnosis["created_at"].isoformat(),
            updated_at=diagnosis["updated_at"].isoformat()
        ))
    
    return result


@router.post("/treatments/plans", response_model=TreatmentPlanResponse)
async def create_treatment_plan(
    plan_data: TreatmentPlanCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a treatment plan based on diagnosis"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create treatment plans"
        )
    
    # Validate diagnosis exists
    diagnosis = await db.evep.diagnoses.find_one({"_id": ObjectId(plan_data.diagnosis_id)})
    if not diagnosis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found"
        )
    
    # Create treatment plan document
    plan_doc = {
        "diagnosis_id": ObjectId(plan_data.diagnosis_id),
        "patient_id": diagnosis["patient_id"],
        "treatment_type": plan_data.treatment_type,
        "treatment_details": plan_data.treatment_details,
        "start_date": plan_data.start_date,
        "duration": plan_data.duration,
        "cost_estimate": plan_data.cost_estimate,
        "insurance_coverage": plan_data.insurance_coverage,
        "notes": plan_data.notes,
        "status": "active",
        "created_by": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.treatment_plans.insert_one(plan_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_treatment_plan",
        details=f"Created treatment plan for diagnosis {plan_data.diagnosis_id}",
        ip_address="system"
    )
    
    # Get doctor name
    doctor = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    doctor_name = f"{doctor.get('first_name', '')} {doctor.get('last_name', '')}" if doctor else "Unknown"
    
    return TreatmentPlanResponse(
        plan_id=str(result.inserted_id),
        diagnosis_id=plan_data.diagnosis_id,
        treatment_type=plan_data.treatment_type,
        treatment_details=plan_data.treatment_details,
        start_date=plan_data.start_date,
        duration=plan_data.duration,
        cost_estimate=plan_data.cost_estimate,
        insurance_coverage=plan_data.insurance_coverage,
        notes=plan_data.notes,
        status="active",
        created_by=current_user["user_id"],
        created_by_name=doctor_name,
        created_at=plan_doc["created_at"].isoformat(),
        updated_at=plan_doc["updated_at"].isoformat()
    )


@router.get("/screenings/va/patient/{patient_id}", response_model=List[VAScreeningResponse])
async def get_patient_va_screenings(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all VA screenings for a specific patient"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view VA screenings"
        )
    
    # Get VA screenings
    screenings = await db.evep.va_screenings.find({
        "patient_id": ObjectId(patient_id)
    }).sort("created_at", -1).to_list(None)
    
    result = []
    for screening in screenings:
        # Get examiner name
        examiner = await db.evep.users.find_one({"_id": screening["examiner_id"]})
        examiner_name = f"{examiner.get('first_name', '')} {examiner.get('last_name', '')}" if examiner else "Unknown"
        
        result.append(VAScreeningResponse(
            screening_id=str(screening["_id"]),
            patient_id=str(screening["patient_id"]),
            appointment_id=str(screening["appointment_id"]),
            screening_type=screening["screening_type"],
            equipment_used=screening.get("equipment_used"),
            results=screening.get("results"),
            overall_assessment=screening.get("overall_assessment"),
            recommendations=screening.get("recommendations", []),
            follow_up_required=screening.get("follow_up_required", False),
            follow_up_date=screening.get("follow_up_date"),
            examiner_notes=screening.get("examiner_notes"),
            status=screening["status"],
            examiner_id=str(screening["examiner_id"]),
            examiner_name=examiner_name,
            created_at=screening["created_at"].isoformat(),
            updated_at=screening["updated_at"].isoformat()
        ))
    
    return result


@router.get("/screenings/va/stats")
async def get_va_screening_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get VA screening statistics"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view VA screening statistics"
        )
    
    # Get total screenings
    total_screenings = await db.evep.va_screenings.count_documents({})
    
    # Get screenings by type
    type_stats = await db.evep.va_screenings.aggregate([
        {
            "$group": {
                "_id": "$screening_type",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get screenings by assessment
    assessment_stats = await db.evep.va_screenings.aggregate([
        {
            "$match": {
                "overall_assessment": {"$exists": True}
            }
        },
        {
            "$group": {
                "_id": "$overall_assessment",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get recent screenings (last 30 days)
    thirty_days_ago = datetime.now() - datetime.timedelta(days=30)
    recent_screenings = await db.evep.va_screenings.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Get completed screenings
    completed_screenings = await db.evep.va_screenings.count_documents({
        "status": "completed"
    })
    
    return {
        "total_screenings": total_screenings,
        "recent_screenings": recent_screenings,
        "completed_screenings": completed_screenings,
        "screening_types": {stat["_id"]: stat["count"] for stat in type_stats},
        "assessments": {stat["_id"]: stat["count"] for stat in assessment_stats}
    }
