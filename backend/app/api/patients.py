"""
Patient Management API endpoints for EVEP Platform
Handles patient registration, search, and medical history management
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash
from app.core.database import get_database, get_patients_collection, get_audit_logs_collection
from app.api.auth import get_current_user

router = APIRouter(prefix="/patients", tags=["Patient Management"])

# Security
security = HTTPBearer()

# Models
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
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

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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
    """Create a new patient"""
    
    # Check if user has permission to create patients
    if current_user["role"] not in ["doctor", "teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create patients"
        )
    
    patients_collection = get_patients_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Check if patient already exists (by parent email and child name)
    existing_patient = await patients_collection.find_one({
        "parent_email": patient_data.parent_email,
        "first_name": patient_data.first_name,
        "last_name": patient_data.last_name
    })
    
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this information already exists"
        )
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(
        f"patient_creation:{patient_data.parent_email}:{patient_data.first_name}:{patient_data.last_name}"
    )
    
    # Create patient document
    patient_doc = {
        "first_name": patient_data.first_name,
        "last_name": patient_data.last_name,
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
        "is_active": True,
        "created_at": settings.get_current_timestamp(),
        "updated_at": settings.get_current_timestamp(),
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
        "timestamp": settings.get_current_timestamp(),
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

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get patient by ID"""
    
    # Check if user has permission to view patients
    if current_user["role"] not in ["doctor", "teacher", "parent", "admin"]:
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
    if current_user["role"] == "parent":
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
    if current_user["role"] not in ["doctor", "admin"]:
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
    update_data["updated_at"] = settings.get_current_timestamp()
    
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
        "timestamp": settings.get_current_timestamp(),
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
                "updated_at": settings.get_current_timestamp(),
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
        "timestamp": settings.get_current_timestamp(),
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
    if current_user["role"] not in ["doctor", "teacher", "parent", "admin"]:
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
    
    # Filter by parent email for parent role
    if current_user["role"] == "parent":
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
    if current_user["role"] not in ["doctor", "admin"]:
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
        "uploaded_at": settings.get_current_timestamp(),
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
        "timestamp": settings.get_current_timestamp(),
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
    if current_user["role"] not in ["doctor", "teacher", "parent", "admin"]:
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
    if current_user["role"] == "parent":
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
