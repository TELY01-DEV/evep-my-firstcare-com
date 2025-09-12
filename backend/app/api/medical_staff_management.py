from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from datetime import datetime
import bcrypt

from app.core.database import get_users_collection, get_audit_logs_collection
from app.api.auth import get_current_user

router = APIRouter()

# Pydantic models
class MedicalStaffCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = True

class MedicalStaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None

class MedicalStaffResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    avatar: Optional[str] = None
    is_active: bool
    last_login: Optional[str] = None
    created_at: str
    updated_at: str

class MedicalStaffListResponse(BaseModel):
    staff: List[MedicalStaffResponse]
    total: int
    page: int
    limit: int

# Medical and school staff roles (excluding super admin)
MEDICAL_SCHOOL_ROLES = [
    "doctor", "nurse", "medical_staff", "exclusive_hospital",
    "teacher", "school_admin", "school_staff"
]

async def log_audit_event(action: str, user_id: str, target_staff_id: str, details: dict):
    """Log audit event for medical staff management"""
    try:
        audit_logs_collection = get_audit_logs_collection()
        audit_event = {
            "action": action,
            "user_id": user_id,
            "target_id": target_staff_id,
            "target_type": "medical_staff",
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "ip_address": "system",
            "user_agent": "medical_staff_api"
        }
        await audit_logs_collection.insert_one(audit_event)
    except Exception as e:
        print(f"Warning: Failed to log audit event: {e}")

@router.get("/", response_model=MedicalStaffListResponse)
async def get_medical_staff(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get medical and school staff with filtering"""
    try:
        users_collection = get_users_collection()
        
        # Build filter query - only include medical and school staff roles
        filter_query = {"role": {"$in": MEDICAL_SCHOOL_ROLES}}
        
        # Add additional filters
        if search:
            filter_query["$or"] = [
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"department": {"$regex": search, "$options": "i"}},
                {"specialization": {"$regex": search, "$options": "i"}}
            ]
        
        if role and role in MEDICAL_SCHOOL_ROLES:
            filter_query["role"] = role
            
        if department:
            filter_query["department"] = {"$regex": department, "$options": "i"}
            
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        # Get total count
        total = await users_collection.count_documents(filter_query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get staff
        cursor = users_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        staff = []
        
        async for user in cursor:
            staff.append(MedicalStaffResponse(
                id=str(user["_id"]),
                email=user["email"],
                first_name=user.get("first_name", ""),
                last_name=user.get("last_name", ""),
                role=user["role"],
                department=user.get("department"),
                specialization=user.get("specialization"),
                phone=user.get("phone"),
                license_number=user.get("license_number"),
                qualifications=user.get("qualifications", []),
                avatar=user.get("avatar"),
                is_active=user.get("is_active", True),
                last_login=user.get("last_login").isoformat() if user.get("last_login") else None,
                created_at=user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else str(user["created_at"]),
                updated_at=(user.get("updated_at", user["created_at"]).isoformat() if isinstance(user.get("updated_at", user["created_at"]), datetime) else str(user.get("updated_at", user["created_at"])))
            ))
        
        return MedicalStaffListResponse(
            staff=staff,
            total=total,
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch medical staff: {str(e)}"
        )

@router.get("/{staff_id}", response_model=MedicalStaffResponse)
async def get_medical_staff_by_id(
    staff_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get medical staff by ID"""
    try:
        users_collection = get_users_collection()
        
        user = await users_collection.find_one({
            "_id": ObjectId(staff_id),
            "role": {"$in": MEDICAL_SCHOOL_ROLES}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        return MedicalStaffResponse(
            id=str(user["_id"]),
            email=user["email"],
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            role=user["role"],
            department=user.get("department"),
            specialization=user.get("specialization"),
            phone=user.get("phone"),
            license_number=user.get("license_number"),
            qualifications=user.get("qualifications", []),
            avatar=user.get("avatar"),
            is_active=user.get("is_active", True),
            last_login=user.get("last_login").isoformat() if user.get("last_login") else None,
            created_at=user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else str(user["created_at"]),
            updated_at=(user.get("updated_at", user["created_at"]).isoformat() if isinstance(user.get("updated_at", user["created_at"]), datetime) else str(user.get("updated_at", user["created_at"])))
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch medical staff: {str(e)}"
        )

@router.post("/", response_model=MedicalStaffResponse)
async def create_medical_staff(
    staff_data: MedicalStaffCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new medical staff"""
    try:
        users_collection = get_users_collection()
        
        # Validate role is medical or school staff
        if staff_data.role not in MEDICAL_SCHOOL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(MEDICAL_SCHOOL_ROLES)}"
            )
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": staff_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = bcrypt.hashpw(staff_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # Create staff document
        now = datetime.now().isoformat()
        staff_doc = {
            "email": staff_data.email,
            "password_hash": hashed_password.decode('utf-8'),
            "first_name": staff_data.first_name,
            "last_name": staff_data.last_name,
            "role": staff_data.role,
            "department": staff_data.department,
            "specialization": staff_data.specialization,
            "phone": staff_data.phone,
            "license_number": staff_data.license_number,
            "qualifications": staff_data.qualifications or [],
            "avatar": staff_data.avatar,
            "is_active": staff_data.is_active,
            "created_at": now,
            "updated_at": now,
            "last_login": None
        }
        
        # Insert staff into database
        result = await users_collection.insert_one(staff_doc)
        staff_doc["_id"] = result.inserted_id
        
        # Log audit event
        await log_audit_event(
            "create_medical_staff",
            current_user["user_id"],
            str(result.inserted_id),
            {"email": staff_data.email, "role": staff_data.role}
        )
        
        return MedicalStaffResponse(
            id=str(staff_doc["_id"]),
            email=staff_doc["email"],
            first_name=staff_doc["first_name"],
            last_name=staff_doc["last_name"],
            role=staff_doc["role"],
            department=staff_doc["department"],
            specialization=staff_doc["specialization"],
            phone=staff_doc["phone"],
            license_number=staff_doc["license_number"],
            qualifications=staff_doc["qualifications"],
            avatar=staff_doc.get("avatar"),
            is_active=staff_doc["is_active"],
            last_login=staff_doc["last_login"],
            created_at=staff_doc["created_at"].isoformat() if isinstance(staff_doc["created_at"], datetime) else str(staff_doc["created_at"]),
            updated_at=staff_doc["updated_at"].isoformat() if isinstance(staff_doc["updated_at"], datetime) else str(staff_doc["updated_at"])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create medical staff: {str(e)}"
        )

@router.put("/{staff_id}", response_model=MedicalStaffResponse)
async def update_medical_staff(
    staff_id: str,
    staff_data: MedicalStaffUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update medical staff"""
    try:
        users_collection = get_users_collection()
        
        # Check if staff exists and is medical/school staff
        existing_staff = await users_collection.find_one({
            "_id": ObjectId(staff_id),
            "role": {"$in": MEDICAL_SCHOOL_ROLES}
        })
        
        if not existing_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        # Validate role if being updated
        if staff_data.role and staff_data.role not in MEDICAL_SCHOOL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(MEDICAL_SCHOOL_ROLES)}"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in staff_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Update staff
        await users_collection.update_one(
            {"_id": ObjectId(staff_id)},
            {"$set": update_data}
        )
        
        # Log audit event
        await log_audit_event(
            "update_medical_staff",
            current_user["user_id"],
            staff_id,
            update_data
        )
        
        # Get updated staff
        updated_staff = await users_collection.find_one({"_id": ObjectId(staff_id)})
        
        return MedicalStaffResponse(
            id=str(updated_staff["_id"]),
            email=updated_staff["email"],
            first_name=updated_staff["first_name"],
            last_name=updated_staff["last_name"],
            role=updated_staff["role"],
            department=updated_staff.get("department"),
            specialization=updated_staff.get("specialization"),
            phone=updated_staff.get("phone"),
            license_number=updated_staff.get("license_number"),
            qualifications=updated_staff.get("qualifications", []),
            avatar=updated_staff.get("avatar"),
            is_active=updated_staff.get("is_active", True),
            last_login=updated_staff.get("last_login").isoformat() if updated_staff.get("last_login") else None,
            created_at=updated_staff["created_at"].isoformat() if isinstance(updated_staff["created_at"], datetime) else str(updated_staff["created_at"]),
            updated_at=updated_staff["updated_at"].isoformat() if isinstance(updated_staff["updated_at"], datetime) else str(updated_staff["updated_at"])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update medical staff: {str(e)}"
        )

@router.delete("/{staff_id}")
async def deactivate_medical_staff(
    staff_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate medical staff (soft delete)"""
    try:
        users_collection = get_users_collection()
        
        # Check if staff exists and is medical/school staff
        existing_staff = await users_collection.find_one({
            "_id": ObjectId(staff_id),
            "role": {"$in": MEDICAL_SCHOOL_ROLES}
        })
        
        if not existing_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        # Deactivate staff
        await users_collection.update_one(
            {"_id": ObjectId(staff_id)},
            {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
        )
        
        # Log audit event
        await log_audit_event(
            "deactivate_medical_staff",
            current_user["user_id"],
            staff_id,
            {"action": "deactivated"}
        )
        
        return {"success": True, "message": "Medical staff deactivated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate medical staff: {str(e)}"
        )

@router.post("/{staff_id}/activate")
async def activate_medical_staff(
    staff_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activate medical staff"""
    try:
        users_collection = get_users_collection()
        
        # Check if staff exists and is medical/school staff
        existing_staff = await users_collection.find_one({
            "_id": ObjectId(staff_id),
            "role": {"$in": MEDICAL_SCHOOL_ROLES}
        })
        
        if not existing_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        # Activate staff
        await users_collection.update_one(
            {"_id": ObjectId(staff_id)},
            {"$set": {"is_active": True, "updated_at": datetime.now().isoformat()}}
        )
        
        # Log audit event
        await log_audit_event(
            "activate_medical_staff",
            current_user["user_id"],
            staff_id,
            {"action": "activated"}
        )
        
        return {"success": True, "message": "Medical staff activated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate medical staff: {str(e)}"
        )
