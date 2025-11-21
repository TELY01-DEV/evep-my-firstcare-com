"""
Patient Management API endpoints for EVEP Platform
Handles patient registration, search, and medical history management
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import base64

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash
from app.core.database import get_database, get_patients_collection, get_audit_logs_collection
from app.api.auth import get_current_user
from app.core.db_rbac import has_permission_db, has_role_db, get_user_roles_from_db

router = APIRouter(prefix="/patients", tags=["Patient Management"])

# Security
security = HTTPBearer()

# Models
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    cid: str  # Citizen ID as primary key
    date_of_birth: str
    gender: str  # male, female, other
    parent_email: EmailStr
    parent_phone: str
    emergency_contact: str
    emergency_phone: str
    address: str
    school: Optional[str] = None
    grade: Optional[str] = None
    medical_history: Optional[dict] = None
    family_vision_history: Optional[dict] = None
    insurance_info: Optional[dict] = None
    consent_forms: Optional[dict] = None
    registration_type: Optional[str] = "direct"  # direct, from_student, walk_in
    source_student_id: Optional[str] = None  # Original student ID if from_student

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    cid: Optional[str] = None  # Citizen ID as primary key
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    medical_history: Optional[dict] = None
    family_vision_history: Optional[dict] = None
    insurance_info: Optional[dict] = None
    consent_forms: Optional[dict] = None
    is_active: Optional[bool] = None

class PatientResponse(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    cid: Optional[str] = None  # Citizen ID as primary key (optional for backward compatibility)
    date_of_birth: str
    gender: str
    parent_email: str
    parent_phone: str
    emergency_contact: str
    emergency_phone: str
    address: str
    school: Optional[str] = None
    grade: Optional[str] = None
    medical_history: Optional[dict] = None
    family_vision_history: Optional[dict] = None
    insurance_info: Optional[dict] = None
    consent_forms: Optional[dict] = None
    is_active: bool
    created_at: str
    updated_at: str
    created_by: str
    audit_hash: str
    registration_type: Optional[str] = "direct"  # direct, from_student, walk_in
    source_student_id: Optional[str] = None  # Original student ID if from_student

class PatientSearch(BaseModel):
    query: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    is_active: Optional[bool] = None
    limit: int = 20
    skip: int = 0

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new patient with comprehensive duplicate prevention"""
    
    # Check if user has permission to create patients
    if current_user["role"] not in ["doctor", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create patients"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Enhanced duplicate checking with multiple criteria
    duplicate_filters = []
    
    # Check by CID (primary check)
    if patient_data.cid and patient_data.cid != "0000000000000":
        duplicate_filters.append({"cid": patient_data.cid})
    
    # Check by name + date of birth combination (secondary check)
    if patient_data.first_name and patient_data.last_name and patient_data.date_of_birth:
        duplicate_filters.append({
            "first_name": patient_data.first_name,
            "last_name": patient_data.last_name,
            "date_of_birth": patient_data.date_of_birth
        })
    
    # Check for duplicates using any of the criteria
    if duplicate_filters:
        existing_patient = await patients_collection.find_one({
            "$or": duplicate_filters
        })
        
        if existing_patient:
            # Determine which criteria matched
            if existing_patient.get("cid") == patient_data.cid and patient_data.cid != "0000000000000":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Patient with Citizen ID '{patient_data.cid}' already exists"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Patient with name '{patient_data.first_name} {patient_data.last_name}' and birth date '{patient_data.date_of_birth}' already exists"
                )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_creation:{patient_data.cid}:{patient_data.first_name}:{patient_data.last_name}"
    )
    
    # Create patient document
    patient_doc = {
        "first_name": patient_data.first_name,
        "last_name": patient_data.last_name,
        "cid": patient_data.cid,  # Citizen ID as primary key
        "date_of_birth": patient_data.date_of_birth,
        "gender": patient_data.gender,
        "parent_email": patient_data.parent_email,
        "parent_phone": patient_data.parent_phone,
        "emergency_contact": patient_data.emergency_contact,
        "emergency_phone": patient_data.emergency_phone,
        "address": patient_data.address,
        "school": patient_data.school,
        "grade": patient_data.grade,
        "medical_history": patient_data.medical_history or {},
        "family_vision_history": patient_data.family_vision_history or {},
        "insurance_info": patient_data.insurance_info or {},
        "consent_forms": patient_data.consent_forms or {},
        "registration_type": patient_data.registration_type or "direct",
        "source_student_id": patient_data.source_student_id,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "created_by": current_user["user_id"],
        "audit_hash": audit_hash,
        "screening_history": [],
        "documents": []
    }
    
    # Insert patient into database
    result = await patients_collection.insert_one(patient_doc)
    patient_doc["_id"] = result.inserted_id
    
    # Log patient creation
    await audit_logs_collection.insert_one({
        "action": "patient_created",
        "user_id": current_user["user_id"],
        "patient_id": str(result.inserted_id),
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "patient_name": f"{patient_data.first_name} {patient_data.last_name}",
            "parent_email": patient_data.parent_email
        }
    })
    
    return PatientResponse(
        patient_id=str(result.inserted_id),
        **{k: v for k, v in patient_doc.items() if k != "_id"}
    )

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search patients by name, CID, email, or school"),
    current_user: dict = Depends(get_current_user)
):
    """Get all patients with pagination and optional search"""
    
    # Extract user ID and role
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    
    # Check if user has permission to view patients using database RBAC
    if user_role != "super_admin" and not await has_permission_db(user_id, "view_patients"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patients"
        )
    
    patients_collection = get_patients_collection()
    
    # Build query based on user role and search
    query = {}
    
    # Add search functionality if search term provided
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"cid": {"$regex": search, "$options": "i"}},
            {"citizen_id": {"$regex": search, "$options": "i"}},
            {"parent_email": {"$regex": search, "$options": "i"}},
            {"school": {"$regex": search, "$options": "i"}}
        ]
    
    if user_id and (await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients")):
        # Parents can only see their own children
        if "parent_email" in query:
            # If already filtering by parent_email in search, combine with user's email
            query["$and"] = [
                {"$or": query["$or"]},
                {"parent_email": current_user["email"]}
            ]
            del query["$or"]
        else:
            query["parent_email"] = current_user["email"]
    
    # Get patients with pagination
    cursor = patients_collection.find(query).skip(skip).limit(limit)
    patients = await cursor.to_list(length=limit)
    
    # Convert to response format
    return [
        PatientResponse(
            patient_id=str(patient["_id"]),
            **{k: v for k, v in patient.items() if k != "_id"}
        )
        for patient in patients
    ]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get patient by ID"""
    
    # Check if user has permission to view patients
    if current_user["role"] not in ["doctor", "parent", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patients"
        )
    
    patients_collection = get_patients_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if parent is viewing their own child
    if await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients"):
        if patient["parent_email"] != current_user["email"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own children's records"
            )
    
    return PatientResponse(
        patient_id=str(patient["_id"]),
        **{k: v for k, v in patient.items() if k != "_id"}
    )

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update patient information"""
    
    # Check if user has permission to update patients
    if current_user["role"] not in ["doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update patients"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    existing_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not existing_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in patient_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_update:{patient_id}:{current_user['user_id']}"
    )
    update_data["audit_hash"] = audit_hash
    
    # Update patient
    result = await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes were made"
        )
    
    # Log patient update
    await audit_logs_collection.insert_one({
        "action": "patient_updated",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "updated_fields": list(update_data.keys()),
            "patient_name": f"{existing_patient['first_name']} {existing_patient['last_name']}"
        }
    })
    
    # Return updated patient
    updated_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    return PatientResponse(
        patient_id=str(updated_patient["_id"]),
        **{k: v for k, v in updated_patient.items() if k != "_id"}
    )

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete patient (mark as inactive)"""
    
    # Check if user has permission to delete patients
    if current_user["role"] not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete patients"
        )
    
    db = get_database()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Check if patient exists
    existing_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not existing_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_deletion:{patient_id}:{current_user['user_id']}"
    )
    
    # Soft delete patient
    result = await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$set": {
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat(),
                "audit_hash": audit_hash
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete patient"
        )
    
    # Log patient deletion
    await audit_logs_collection.insert_one({
        "action": "patient_deleted",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "patient_name": f"{existing_patient['first_name']} {existing_patient['last_name']}",
            "deletion_type": "soft_delete"
        }
    })
    
    return {"message": "Patient deleted successfully"}

@router.post("/search")
async def search_patients(
    search_data: PatientSearch,
    current_user: dict = Depends(get_current_user)
):
    """Search patients with filters"""
    
    # Check if user has permission to search patients
    if current_user["role"] not in ["doctor", "parent", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to search patients"
        )
    
    db = get_database()
    
    # Build search query
    query = {}
    
    # Text search
    if search_data.query:
        query["$or"] = [
            {"first_name": {"$regex": search_data.query, "$options": "i"}},
            {"last_name": {"$regex": search_data.query, "$options": "i"}},
            {"cid": {"$regex": search_data.query, "$options": "i"}},  # Search by CID
            {"parent_email": {"$regex": search_data.query, "$options": "i"}},
            {"school": {"$regex": search_data.query, "$options": "i"}}
        ]
    
    # Filter by school
    if search_data.school:
        query["school"] = search_data.school
    
    # Filter by grade
    if search_data.grade:
        query["grade"] = search_data.grade
    
    # Filter by active status
    if search_data.is_active is not None:
        query["is_active"] = search_data.is_active
    
    # Get user_id for RBAC checks
    user_id = current_user.get("user_id")
    
    # Filter by parent email for parent role
    if user_id and (await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients")):
        query["parent_email"] = current_user["email"]
    
    # Execute search
    patients_collection = get_patients_collection()
    patients = await patients_collection.find(query).skip(search_data.skip).limit(search_data.limit).to_list(length=None)
    
    # Convert to response format
    patient_list = []
    for patient in patients:
        patient_list.append({
            "patient_id": str(patient["_id"]),
            **{k: v for k, v in patient.items() if k != "_id"}
        })
    
    # Get total count
    total_count = await patients_collection.count_documents(query)
    
    return {
        "patients": patient_list,
        "total_count": total_count,
        "limit": search_data.limit,
        "skip": search_data.skip
    }

@router.post("/{patient_id}/documents")
async def upload_patient_document(
    patient_id: str,
    file: UploadFile = File(...),
    document_type: str = "medical_record",
    current_user: dict = Depends(get_current_user)
):
    """Upload document for patient"""
    
    # Check if user has permission to upload documents
    if current_user["role"] not in ["doctor", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload documents"
        )
    
    db = get_database()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate file type
    allowed_types = ["medical_record", "consent_form", "insurance", "screening_result", "other"]
    if document_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {', '.join(allowed_types)}"
        )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"document_upload:{patient_id}:{file.filename}:{current_user['user_id']}"
    )
    
    # Create document record
    document_doc = {
        "patient_id": ObjectId(patient_id),
        "filename": file.filename,
        "document_type": document_type,
        "uploaded_by": current_user["user_id"],
        "uploaded_at": datetime.utcnow().isoformat(),
        "file_size": len(await file.read()),
        "audit_hash": audit_hash,
        "status": "uploaded"
    }
    
    # Reset file pointer
    await file.seek(0)
    
    # Store document metadata
    result = await db.documents.insert_one(document_doc)
    
    # Log document upload
    await audit_logs_collection.insert_one({
        "action": "document_uploaded",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "document_id": str(result.inserted_id),
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "filename": file.filename,
            "document_type": document_type,
            "file_size": document_doc["file_size"]
        }
    })
    
    return {
        "document_id": str(result.inserted_id),
        "filename": file.filename,
        "document_type": document_type,
        "uploaded_at": document_doc["uploaded_at"],
        "audit_hash": audit_hash
    }

@router.get("/{patient_id}/documents")
async def get_patient_documents(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all documents for a patient"""
    
    # Check if user has permission to view documents
    if current_user["role"] not in ["doctor", "parent", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view documents"
        )
    
    db = get_database()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patients_collection = get_patients_collection()
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if parent is viewing their own child's documents
    if await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients"):
        if patient["parent_email"] != current_user["email"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own children's documents"
            )
    
    # Get documents
    documents = await db.documents.find({"patient_id": ObjectId(patient_id)}).to_list(length=None)
    
    # Convert to response format
    document_list = []
    for doc in documents:
        document_list.append({
            "document_id": str(doc["_id"]),
            "filename": doc["filename"],
            "document_type": doc["document_type"],
            "uploaded_at": doc["uploaded_at"],
            "file_size": doc["file_size"],
            "status": doc["status"]
        })
    
    return {"documents": document_list}

@router.post("/from-student/{student_id}", response_model=PatientResponse)
async def register_student_as_patient(
    student_id: str,
    patient_data: PatientCreate,
    current_user: dict = Depends(get_current_user)
):
    """Register a student as a patient"""
    
    # Check if user has permission to create patients
    if current_user["role"] not in ["doctor", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create patients"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Get student data from EVEP system
    db = get_database()
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(student_id)})
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get parent data
    parent = None
    if student.get("parent_id"):
        parent = await db.evep["evep.parents"].find_one({"_id": ObjectId(student["parent_id"])})
    
    # Check if patient already exists for this student
    existing_patient = await patients_collection.find_one({
        "student_id": student_id
    })
    
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient already exists for this student"
        )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"student_to_patient:{student_id}:{current_user['user_id']}"
    )
    
    # Create patient document from student data
    patient_doc = {
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "cid": student.get("cid", ""),  # Get CID from student if available
        "date_of_birth": student["birth_date"].isoformat() if isinstance(student["birth_date"], datetime) else student["birth_date"],
        "gender": student["gender"],
        "parent_email": parent["email"] if parent else patient_data.parent_email,
        "parent_phone": parent["phone"] if parent else patient_data.parent_phone,
        "emergency_contact": patient_data.emergency_contact,
        "emergency_phone": patient_data.emergency_phone,
        "address": student["address"]["house_no"] + " " + student["address"]["road"] + ", " + student["address"]["subdistrict"] + ", " + student["address"]["district"] + ", " + student["address"]["province"],
        "school": student["school_name"],
        "grade": student["grade_level"],
        "medical_history": patient_data.medical_history or {},
        "family_vision_history": patient_data.family_vision_history or {},
        "insurance_info": patient_data.insurance_info or {},
        "consent_forms": patient_data.consent_forms or {},
        "registration_type": "from_student",  # Mark as created from student
        "source_student_id": student_id,  # Link to original student record
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "created_by": current_user["user_id"],
        "audit_hash": audit_hash,
        "screening_history": [],
        "documents": [],
        "student_id": student_id,  # Legacy field for backward compatibility
        "source": "student_registration"  # Legacy field for backward compatibility
    }
    
    # Insert patient into database
    result = await patients_collection.insert_one(patient_doc)
    patient_doc["_id"] = result.inserted_id
    
    # Log patient creation from student
    await audit_logs_collection.insert_one({
        "action": "student_registered_as_patient",
        "user_id": current_user["user_id"],
        "patient_id": str(result.inserted_id),
        "student_id": student_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "patient_name": f"{student['first_name']} {student['last_name']}",
            "parent_email": parent["email"] if parent else patient_data.parent_email,
            "school": student["school_name"],
            "grade": student["grade_level"]
        }
    })
    
    return PatientResponse(
        patient_id=str(result.inserted_id),
        **{k: v for k, v in patient_doc.items() if k != "_id"}
    )

# ==================== PHOTO UPLOAD ENDPOINTS ====================

@router.post("/{patient_id}/upload-profile-photo")
async def upload_patient_profile_photo(
    patient_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile photo for a patient"""
    
    # Check if user has permission to upload photos
    if current_user["role"] not in ["doctor", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload patient photos"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file content and encode as base64
    file_content = await file.read()
    photo_base64 = base64.b64encode(file_content).decode('utf-8')
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_photo_upload:{patient_id}:{current_user['user_id']}"
    )
    
    # Update patient with profile photo
    result = await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$set": {
                "profile_photo": photo_base64,
                "updated_at": datetime.utcnow().isoformat(),
                "audit_hash": audit_hash
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update patient profile photo"
        )
    
    # Log photo upload
    await audit_logs_collection.insert_one({
        "action": "patient_photo_uploaded",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "photo_type": "profile_photo",
            "file_size": len(file_content),
            "content_type": file.content_type
        }
    })
    
    return {"message": "Profile photo uploaded successfully", "patient_id": patient_id}


@router.post("/{patient_id}/upload-extra-photo")
async def upload_patient_extra_photo(
    patient_id: str,
    file: UploadFile = File(...),
    description: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Upload extra photo for a patient"""
    
    # Check if user has permission to upload photos
    if current_user["role"] not in ["doctor", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload patient photos"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file content and encode as base64
    file_content = await file.read()
    photo_base64 = base64.b64encode(file_content).decode('utf-8')
    
    # Create photo metadata
    photo_metadata = {
        "description": description,
        "uploaded_by": current_user.get("email", "unknown"),
        "uploaded_at": datetime.utcnow().isoformat(),
        "file_size": len(file_content),
        "content_type": file.content_type
    }
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_extra_photo_upload:{patient_id}:{current_user['user_id']}"
    )
    
    # Add photo to extra_photos array
    result = await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$push": {
                "extra_photos": photo_base64
            },
            "$set": {
                "updated_at": datetime.utcnow().isoformat(),
                "audit_hash": audit_hash
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to upload extra photo"
        )
    
    # Log photo upload
    await audit_logs_collection.insert_one({
        "action": "patient_extra_photo_uploaded",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "photo_type": "extra_photo",
            "description": description,
            "file_size": len(file_content),
            "content_type": file.content_type
        }
    })
    
    return {"message": "Extra photo uploaded successfully", "patient_id": patient_id}


@router.get("/{patient_id}/photos")
async def get_patient_photos(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all photos for a patient"""
    
    # Check if user has permission to view photos
    if current_user["role"] not in ["doctor", "parent", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view patient photos"
        )
    
    patients_collection = get_patients_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if parent is viewing their own child's photos
    if await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients"):
        if patient["parent_email"] != current_user["email"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own children's photos"
            )
    
    return {
        "patient_id": patient_id,
        "profile_photo": patient.get("profile_photo"),
        "extra_photos": patient.get("extra_photos", []),
        "photo_metadata": patient.get("photo_metadata", {})
    }


@router.delete("/{patient_id}/photos/{photo_index}")
async def delete_patient_extra_photo(
    patient_id: str,
    photo_index: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete an extra photo for a patient"""
    
    # Check if user has permission to delete photos
    if current_user["role"] not in ["doctor", "admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete patient photos"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Validate ObjectId
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    extra_photos = patient.get("extra_photos", [])
    if photo_index >= len(extra_photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo index out of range"
        )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_photo_deletion:{patient_id}:{photo_index}:{current_user['user_id']}"
    )
    
    # Remove photo at specified index
    extra_photos.pop(photo_index)
    
    result = await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$set": {
                "extra_photos": extra_photos,
                "updated_at": datetime.utcnow().isoformat(),
                "audit_hash": audit_hash
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete photo"
        )
    
    # Log photo deletion
    await audit_logs_collection.insert_one({
        "action": "patient_photo_deleted",
        "user_id": current_user["user_id"],
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "audit_hash": audit_hash,
        "details": {
            "photo_type": "extra_photo",
            "photo_index": photo_index
        }
    })
    
    return {"message": "Photo deleted successfully", "patient_id": patient_id}
