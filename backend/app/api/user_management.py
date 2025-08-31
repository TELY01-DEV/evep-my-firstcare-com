"""
User Management API endpoints for Medical Portal Panel
Handles user creation, management, and administration for medical staff
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.core.config import settings
from app.core.security import hash_password, verify_password, generate_blockchain_hash
from app.core.database import get_users_collection, get_audit_logs_collection
from app.api.auth import get_current_user
from app.core.rbac import check_permission

router = APIRouter()
security = HTTPBearer()

# Pydantic models for user management
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str  # medical_admin, doctor, nurse, optometrist, technician, coordinator
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    is_active: bool = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
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
    is_active: bool
    last_login: Optional[str] = None
    created_at: str
    updated_at: str

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int

# Valid medical roles
MEDICAL_ROLES = [
    "medical_admin",
    "doctor", 
    "nurse",
    "optometrist",
    "technician",
    "coordinator",
    "assistant"
]

# Medical departments
MEDICAL_DEPARTMENTS = [
    "Ophthalmology",
    "Optometry", 
    "Pediatrics",
    "General Medicine",
    "Emergency",
    "Administration",
    "Laboratory",
    "Imaging",
    "Rehabilitation"
]

# Medical specializations
MEDICAL_SPECIALIZATIONS = [
    "Pediatric Ophthalmology",
    "Retina Specialist",
    "Cornea Specialist",
    "Glaucoma Specialist",
    "Neuro-Ophthalmology",
    "Oculoplastic Surgery",
    "General Ophthalmology",
    "Optometry",
    "Orthoptics",
    "Contact Lens Specialist",
    "Low Vision Specialist"
]

def log_audit_event(action: str, user_id: str, target_user_id: str, details: Dict[str, Any]):
    """Log audit event for user management actions"""
    audit_logs_collection = get_audit_logs_collection()
    
    audit_event = {
        "action": action,
        "user_id": user_id,
        "target_user_id": target_user_id,
        "details": details,
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "system",
        "user_agent": "user_management_api",
        "audit_hash": generate_blockchain_hash(f"{action}:{target_user_id}")
    }
    
    audit_logs_collection.insert_one(audit_event)

@router.get("/", response_model=UserListResponse)
@check_permission("view_user_management")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get paginated list of users with filtering"""
    try:
        users_collection = get_users_collection()
        
        # Build filter query
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"license_number": {"$regex": search, "$options": "i"}}
            ]
        
        if role:
            filter_query["role"] = role
            
        if department:
            filter_query["department"] = department
            
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        # Get total count
        total = await users_collection.count_documents(filter_query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        # Get users
        cursor = users_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        users = []
        
        async for user in cursor:
            users.append(UserResponse(
                id=str(user["_id"]),
                email=user["email"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                role=user["role"],
                department=user.get("department"),
                specialization=user.get("specialization"),
                phone=user.get("phone"),
                license_number=user.get("license_number"),
                qualifications=user.get("qualifications", []),
                is_active=user.get("is_active", True),
                last_login=user.get("last_login"),
                created_at=user["created_at"],
                updated_at=user.get("updated_at", user["created_at"])
            ))
        
        return UserListResponse(
            users=users,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
@check_permission("view_user_management")
async def get_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific user details"""
    try:
        users_collection = get_users_collection()
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            role=user["role"],
            department=user.get("department"),
            specialization=user.get("specialization"),
            phone=user.get("phone"),
            license_number=user.get("license_number"),
            qualifications=user.get("qualifications", []),
            is_active=user.get("is_active", True),
            last_login=user.get("last_login"),
            created_at=user["created_at"],
            updated_at=user.get("updated_at", user["created_at"])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )

@router.post("/", response_model=UserResponse)
@check_permission("manage_user_management")
async def create_user(
    user_data: UserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new user"""
    try:
        users_collection = get_users_collection()
        
        # Validate role
        if user_data.role not in MEDICAL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(MEDICAL_ROLES)}"
            )
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        now = settings.get_current_timestamp()
        user_doc = {
            "email": user_data.email,
            "password_hash": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role,
            "department": user_data.department,
            "specialization": user_data.specialization,
            "phone": user_data.phone,
            "license_number": user_data.license_number,
            "qualifications": user_data.qualifications or [],
            "is_active": user_data.is_active,
            "created_at": now,
            "updated_at": now,
            "last_login": None,
            "login_attempts": 0,
            "locked_until": None,
            "audit_hash": generate_blockchain_hash(f"user_creation:{user_data.email}")
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Log audit event
        log_audit_event(
            "user_created",
            current_user["user_id"],
            str(result.inserted_id),
            {"email": user_data.email, "role": user_data.role}
        )
        
        return UserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            first_name=user_doc["first_name"],
            last_name=user_doc["last_name"],
            role=user_doc["role"],
            department=user_doc["department"],
            specialization=user_doc["specialization"],
            phone=user_doc["phone"],
            license_number=user_doc["license_number"],
            qualifications=user_doc["qualifications"],
            is_active=user_doc["is_active"],
            last_login=user_doc["last_login"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse)
@check_permission("manage_user_management")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user information"""
    try:
        users_collection = get_users_collection()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate role if provided
        if user_data.role and user_data.role not in MEDICAL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(MEDICAL_ROLES)}"
            )
        
        # Build update data
        update_data = {"updated_at": settings.get_current_timestamp()}
        
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name
        if user_data.role is not None:
            update_data["role"] = user_data.role
        if user_data.department is not None:
            update_data["department"] = user_data.department
        if user_data.specialization is not None:
            update_data["specialization"] = user_data.specialization
        if user_data.phone is not None:
            update_data["phone"] = user_data.phone
        if user_data.license_number is not None:
            update_data["license_number"] = user_data.license_number
        if user_data.qualifications is not None:
            update_data["qualifications"] = user_data.qualifications
        if user_data.is_active is not None:
            update_data["is_active"] = user_data.is_active
        
        # Update user
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to user"
            )
        
        # Log audit event
        log_audit_event(
            "user_updated",
            current_user["user_id"],
            user_id,
            update_data
        )
        
        # Get updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        return UserResponse(
            id=str(updated_user["_id"]),
            email=updated_user["email"],
            first_name=updated_user["first_name"],
            last_name=updated_user["last_name"],
            role=updated_user["role"],
            department=updated_user.get("department"),
            specialization=updated_user.get("specialization"),
            phone=updated_user.get("phone"),
            license_number=updated_user.get("license_number"),
            qualifications=updated_user.get("qualifications", []),
            is_active=updated_user.get("is_active", True),
            last_login=updated_user.get("last_login"),
            created_at=updated_user["created_at"],
            updated_at=updated_user["updated_at"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/{user_id}")
@check_permission("manage_user_management")
async def delete_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a user (soft delete)"""
    try:
        users_collection = get_users_collection()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deletion of system admin
        if existing_user["role"] == "system_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system administrator"
            )
        
        # Soft delete by setting is_active to False
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": settings.get_current_timestamp(),
                    "deleted_at": settings.get_current_timestamp()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete user"
            )
        
        # Log audit event
        log_audit_event(
            "user_deleted",
            current_user["user_id"],
            user_id,
            {"email": existing_user["email"], "role": existing_user["role"]}
        )
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

@router.post("/{user_id}/activate")
@check_permission("manage_user_management")
async def activate_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Activate a deactivated user"""
    try:
        users_collection = get_users_collection()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Activate user
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": True,
                    "updated_at": settings.get_current_timestamp()
                },
                "$unset": {"deleted_at": ""}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to activate user"
            )
        
        # Log audit event
        log_audit_event(
            "user_activated",
            current_user["user_id"],
            user_id,
            {"email": existing_user["email"]}
        )
        
        return {
            "success": True,
            "message": "User activated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate user: {str(e)}"
        )

@router.get("/roles/list")
async def get_medical_roles(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get list of available medical roles"""
    return {
        "roles": MEDICAL_ROLES,
        "departments": MEDICAL_DEPARTMENTS,
        "specializations": MEDICAL_SPECIALIZATIONS
    }

@router.get("/statistics/overview")
@check_permission("view_user_management")
async def get_user_statistics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user management statistics"""
    try:
        users_collection = get_users_collection()
        
        # Get total users
        total_users = await users_collection.count_documents({})
        active_users = await users_collection.count_documents({"is_active": True})
        inactive_users = await users_collection.count_documents({"is_active": False})
        
        # Get users by role
        role_stats = {}
        for role in MEDICAL_ROLES:
            count = await users_collection.count_documents({"role": role, "is_active": True})
            role_stats[role] = count
        
        # Get recent activity (users created in last 30 days)
        thirty_days_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_users = await users_collection.count_documents({
            "created_at": {"$gte": thirty_days_ago.isoformat()}
        })
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "recent_users": recent_users,
            "role_distribution": role_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )
