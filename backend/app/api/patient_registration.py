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
class StudentToPatientRegistration(BaseModel):
    student_id: str
    appointment_id: str
    registration_reason: str = Field(..., description="Reason for registration (e.g., 'screening_referral', 'follow_up', 'emergency')")
    medical_notes: Optional[str] = None
    urgency_level: str = Field(..., description="Urgency: 'routine', 'urgent', 'emergency'")
    referring_teacher_id: Optional[str] = None
    school_screening_outcome: Optional[str] = None

class PatientRegistrationResponse(BaseModel):
    registration_id: str
    student_id: str
    patient_id: str
    appointment_id: str
    registration_reason: str
    medical_notes: Optional[str] = None
    urgency_level: str
    referring_teacher_id: Optional[str] = None
    school_screening_outcome: Optional[str] = None
    registration_date: str
    status: str
    created_at: str
    updated_at: str

class StudentPatientMapping(BaseModel):
    mapping_id: str
    student_id: str
    patient_id: str
    school_id: str
    registration_date: str
    status: str
    created_at: str
    updated_at: str

# Patient Registration Endpoints
@router.post("/patients/register-from-student", response_model=PatientRegistrationResponse)
async def register_student_as_patient(
    registration_data: StudentToPatientRegistration,
    current_user: dict = Depends(get_current_user)
):
    """Register a student as a patient for medical screening"""
    db = get_database()
    
    # Check permissions - only medical staff can register students as patients
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to register students as patients"
        )
    
    # Validate student exists
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(registration_data.student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate appointment exists (only if appointment_id is provided and not empty)
    appointment = None
    if registration_data.appointment_id and registration_data.appointment_id.strip():
        appointment = await db.evep.appointments.find_one({"_id": ObjectId(registration_data.appointment_id)})
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
    
    # Check if student is already registered as a patient
    existing_mapping = await db.evep.student_patient_mapping.find_one({
        "student_id": ObjectId(registration_data.student_id),
        "status": "active"
    })
    
    if existing_mapping:
        # Update existing patient record instead of creating new one
        patient_id = existing_mapping["patient_id"]
        
        # Update patient information
        await db.evep.patients.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$set": {
                    "updated_at": get_current_thailand_time(),
                    "last_visit": get_current_thailand_time()
                }
            }
        )
    else:
        # Create new patient record
        patient_doc = {
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "date_of_birth": student.get("birth_date"),
            "gender": student.get("gender", ""),
            "phone": student.get("phone", ""),
            "email": student.get("email", ""),
            "address": student.get("address", ""),
            "emergency_contact": student.get("emergency_contact", ""),
            "medical_history": [],
            "allergies": [],
            "current_medications": [],
            "insurance_info": {},
            "registration_date": get_current_thailand_time(),
            "last_visit": get_current_thailand_time(),
            "status": "active",
            "created_at": get_current_thailand_time(),
            "updated_at": get_current_thailand_time()
        }
        
        patient_result = await db.evep.patients.insert_one(patient_doc)
        patient_id = patient_result.inserted_id
        
        # Create student-patient mapping
        mapping_doc = {
            "student_id": ObjectId(registration_data.student_id),
            "patient_id": patient_id,
            "school_id": student.get("school_id"),
            "registration_date": get_current_thailand_time(),
            "status": "active",
            "created_at": get_current_thailand_time(),
            "updated_at": get_current_thailand_time()
        }
        
        await db.evep.student_patient_mapping.insert_one(mapping_doc)
    
    # Create registration record
    registration_doc = {
        "student_id": ObjectId(registration_data.student_id),
        "patient_id": ObjectId(patient_id),
        "appointment_id": ObjectId(registration_data.appointment_id) if registration_data.appointment_id and registration_data.appointment_id.strip() else None,
        "registration_reason": registration_data.registration_reason,
        "medical_notes": registration_data.medical_notes,
        "urgency_level": registration_data.urgency_level,
        "referring_teacher_id": ObjectId(registration_data.referring_teacher_id) if registration_data.referring_teacher_id else None,
        "school_screening_outcome": registration_data.school_screening_outcome,
        "registration_date": get_current_thailand_time(),
        "status": "registered",
        "registered_by": current_user["user_id"],
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    registration_result = await db.evep.patient_registrations.insert_one(registration_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="register_student_as_patient",
        details=f"Registered student {registration_data.student_id} as patient {patient_id}",
        ip_address="system"
    )
    
    return PatientRegistrationResponse(
        registration_id=str(registration_result.inserted_id),
        student_id=registration_data.student_id,
        patient_id=str(patient_id),
        appointment_id=registration_data.appointment_id,
        registration_reason=registration_data.registration_reason,
        medical_notes=registration_data.medical_notes,
        urgency_level=registration_data.urgency_level,
        referring_teacher_id=registration_data.referring_teacher_id,
        school_screening_outcome=registration_data.school_screening_outcome,
        registration_date=registration_doc["registration_date"].isoformat(),
        status="registered",
        created_at=registration_doc["created_at"].isoformat(),
        updated_at=registration_doc["updated_at"].isoformat()
    )


@router.get("/patients/student/{student_id}")
async def get_patient_by_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get patient information for a specific student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "teacher", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient information"
        )
    
    # Get student-patient mapping
    mapping = await db.evep.student_patient_mapping.find_one({
        "student_id": ObjectId(student_id),
        "status": "active"
    })
    
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient found for this student"
        )
    
    # Get patient information
    patient = await db.evep.patients.find_one({"_id": mapping["patient_id"]})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Get student information
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    
    return {
        "mapping_id": str(mapping["_id"]),
        "student_id": student_id,
        "patient_id": str(patient["_id"]),
        "patient_info": {
            "first_name": patient.get("first_name", ""),
            "last_name": patient.get("last_name", ""),
            "date_of_birth": patient.get("date_of_birth"),
            "gender": patient.get("gender", ""),
            "phone": patient.get("phone", ""),
            "email": patient.get("email", ""),
            "address": patient.get("address", ""),
            "emergency_contact": patient.get("emergency_contact", ""),
            "medical_history": patient.get("medical_history", []),
            "allergies": patient.get("allergies", []),
            "current_medications": patient.get("current_medications", []),
            "registration_date": patient.get("registration_date").isoformat() if patient.get("registration_date") else None,
            "last_visit": patient.get("last_visit").isoformat() if patient.get("last_visit") else None,
            "status": patient.get("status", "")
        },
        "student_info": {
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "school_name": student.get("school_name", "")
        },
        "mapping_info": {
            "registration_date": mapping["registration_date"].isoformat(),
            "status": mapping["status"]
        }
    }


@router.get("/patients/registrations", response_model=List[PatientRegistrationResponse])
async def get_patient_registrations(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    appointment_id: Optional[str] = Query(None, description="Filter by appointment ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Get patient registration records with optional filtering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient registrations"
        )
    
    # Build query
    query = {}
    
    if student_id:
        query["student_id"] = ObjectId(student_id)
    
    if appointment_id:
        query["appointment_id"] = ObjectId(appointment_id)
    
    if status:
        query["status"] = status
    
    # Get registrations
    registrations = await db.evep.patient_registrations.find(query).sort("created_at", -1).to_list(None)
    
    result = []
    for registration in registrations:
        result.append(PatientRegistrationResponse(
            registration_id=str(registration["_id"]),
            student_id=str(registration["student_id"]),
            patient_id=str(registration["patient_id"]),
            appointment_id=str(registration["appointment_id"]),
            registration_reason=registration["registration_reason"],
            medical_notes=registration.get("medical_notes"),
            urgency_level=registration["urgency_level"],
            referring_teacher_id=str(registration["referring_teacher_id"]) if registration.get("referring_teacher_id") else None,
            school_screening_outcome=registration.get("school_screening_outcome"),
            registration_date=registration["registration_date"].isoformat(),
            status=registration["status"],
            created_at=registration["created_at"].isoformat(),
            updated_at=registration["updated_at"].isoformat()
        ))
    
    return result


@router.get("/patients/mappings", response_model=List[StudentPatientMapping])
async def get_student_patient_mappings(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Get student-patient mappings with optional filtering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "teacher", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view student-patient mappings"
        )
    
    # Build query
    query = {}
    
    if student_id:
        query["student_id"] = ObjectId(student_id)
    
    if patient_id:
        query["patient_id"] = ObjectId(patient_id)
    
    if status:
        query["status"] = status
    
    # Get mappings
    mappings = await db.evep.student_patient_mapping.find(query).sort("created_at", -1).to_list(None)
    
    result = []
    for mapping in mappings:
        result.append(StudentPatientMapping(
            mapping_id=str(mapping["_id"]),
            student_id=str(mapping["student_id"]),
            patient_id=str(mapping["patient_id"]),
            school_id=str(mapping["school_id"]),
            registration_date=mapping["registration_date"].isoformat(),
            status=mapping["status"],
            created_at=mapping["created_at"].isoformat(),
            updated_at=mapping["updated_at"].isoformat()
        ))
    
    return result


@router.put("/patients/{patient_id}/student-link")
async def update_patient_student_link(
    patient_id: str,
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Update or create student-patient link"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update patient-student links"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if mapping already exists
    existing_mapping = await db.evep.student_patient_mapping.find_one({
        "patient_id": ObjectId(patient_id),
        "status": "active"
    })
    
    if existing_mapping:
        # Update existing mapping
        result = await db.evep.student_patient_mapping.update_one(
            {"_id": existing_mapping["_id"]},
            {
                "$set": {
                    "student_id": ObjectId(student_id),
                    "school_id": student.get("school_id"),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student-patient mapping not found"
            )
    else:
        # Create new mapping
        mapping_doc = {
            "student_id": ObjectId(student_id),
            "patient_id": ObjectId(patient_id),
            "school_id": student.get("school_id"),
            "registration_date": get_current_thailand_time(),
            "status": "active",
            "created_at": get_current_thailand_time(),
            "updated_at": get_current_thailand_time()
        }
        
        await db.evep.student_patient_mapping.insert_one(mapping_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_patient_student_link",
        details=f"Updated patient {patient_id} link to student {student_id}",
        ip_address="system"
    )
    
    return {"message": "Patient-student link updated successfully"}


@router.get("/patients/registration-stats")
async def get_registration_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get patient registration statistics"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view registration statistics"
        )
    
    # Get total registrations
    total_registrations = await db.evep.patient_registrations.count_documents({})
    
    # Get registrations by urgency level
    urgency_stats = await db.evep.patient_registrations.aggregate([
        {
            "$group": {
                "_id": "$urgency_level",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get registrations by reason
    reason_stats = await db.evep.patient_registrations.aggregate([
        {
            "$group": {
                "_id": "$registration_reason",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get recent registrations (last 30 days)
    thirty_days_ago = datetime.now() - datetime.timedelta(days=30)
    recent_registrations = await db.evep.patient_registrations.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Get active student-patient mappings
    active_mappings = await db.evep.student_patient_mapping.count_documents({
        "status": "active"
    })
    
    return {
        "total_registrations": total_registrations,
        "recent_registrations": recent_registrations,
        "active_mappings": active_mappings,
        "urgency_levels": {stat["_id"]: stat["count"] for stat in urgency_stats},
        "registration_reasons": {stat["_id"]: stat["count"] for stat in reason_stats}
    }
