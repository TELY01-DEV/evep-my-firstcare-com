"""
Admin User Management API endpoints for System Admin Panel
Allows system administrators to manage all users across the entire platform
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

# Pydantic models for admin user management
class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str  # system_admin, medical_admin, doctor, nurse, optometrist, technician, coordinator, assistant, teacher, parent, student
    portal_access: List[str] = []  # ["medical", "admin", "school"]
    organization: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    is_active: bool = True
    is_verified: bool = False
    permissions: Optional[List[str]] = None

class AdminUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    portal_access: Optional[List[str]] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    permissions: Optional[List[str]] = None

class AdminUserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    portal_access: List[str]
    organization: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    qualifications: Optional[List[str]] = None
    is_active: bool
    is_verified: bool
    permissions: Optional[List[str]] = None
    last_login: Optional[str] = None
    created_at: str
    updated_at: str

class AdminUserListResponse(BaseModel):
    users: List[AdminUserResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class AdminUserStatistics(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    unverified_users: int
    recent_users: int
    role_distribution: Dict[str, int]
    portal_distribution: Dict[str, int]
    login_activity: Dict[str, int]

# Valid roles for admin management
ADMIN_ROLES = [
    "system_admin",
    "medical_admin",
    "doctor", 
    "nurse",
    "optometrist",
    "technician",
    "coordinator",
    "assistant",
    "teacher",
    "parent",
    "student"
]

# Portal access options
PORTAL_ACCESS = ["medical", "admin", "school"]

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

def log_admin_audit_event(action: str, admin_user_id: str, target_user_id: str, details: Dict[str, Any]):
    """Log audit event for admin user management actions"""
    audit_logs_collection = get_audit_logs_collection()
    
    audit_event = {
        "action": f"admin_{action}",
        "admin_user_id": admin_user_id,
        "target_user_id": target_user_id,
        "details": details,
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "system",
        "user_agent": "admin_user_management_api",
        "audit_hash": generate_blockchain_hash(f"admin_{action}:{target_user_id}")
    }
    
    audit_logs_collection.insert_one(audit_event)

@router.get("/", response_model=AdminUserListResponse)
@check_permission("admin_manage_users")
async def admin_get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    portal: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get paginated list of all users with advanced filtering"""
    try:
        users_collection = get_users_collection()
        
        # Build filter query
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"license_number": {"$regex": search, "$options": "i"}},
                {"organization": {"$regex": search, "$options": "i"}}
            ]
        
        if role:
            filter_query["role"] = role
            
        if portal:
            filter_query["portal_access"] = portal
            
        if department:
            filter_query["department"] = department
            
        if is_active is not None:
            filter_query["is_active"] = is_active
            
        if is_verified is not None:
            filter_query["is_verified"] = is_verified
        
        # Get total count
        total = await users_collection.count_documents(filter_query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        # Get users
        cursor = users_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        users = []
        
        async for user in cursor:
            users.append(AdminUserResponse(
                id=str(user["_id"]),
                email=user["email"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                role=user["role"],
                portal_access=user.get("portal_access", []),
                organization=user.get("organization"),
                department=user.get("department"),
                specialization=user.get("specialization"),
                phone=user.get("phone"),
                license_number=user.get("license_number"),
                qualifications=user.get("qualifications", []),
                is_active=user.get("is_active", True),
                is_verified=user.get("is_verified", False),
                permissions=user.get("permissions", []),
                last_login=user.get("last_login"),
                created_at=user["created_at"],
                updated_at=user.get("updated_at", user["created_at"])
            ))
        
        return AdminUserListResponse(
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

@router.get("/{user_id}", response_model=AdminUserResponse)
@check_permission("admin_manage_users")
async def admin_get_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific user details for admin"""
    try:
        users_collection = get_users_collection()
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return AdminUserResponse(
            id=str(user["_id"]),
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            role=user["role"],
            portal_access=user.get("portal_access", []),
            organization=user.get("organization"),
            department=user.get("department"),
            specialization=user.get("specialization"),
            phone=user.get("phone"),
            license_number=user.get("license_number"),
            qualifications=user.get("qualifications", []),
            is_active=user.get("is_active", True),
            is_verified=user.get("is_verified", False),
            permissions=user.get("permissions", []),
            last_login=user.get("last_login"),
            created_at=user["created_at"],
            updated_at=user.get("updated_at", user["created_at"])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )

@router.post("/", response_model=AdminUserResponse)
@check_permission("admin_manage_users")
async def admin_create_user(
    user_data: AdminUserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new user with admin privileges"""
    try:
        users_collection = get_users_collection()
        
        # Validate role
        if user_data.role not in ADMIN_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(ADMIN_ROLES)}"
            )
        
        # Validate portal access
        for portal in user_data.portal_access:
            if portal not in PORTAL_ACCESS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid portal access: {portal}. Must be one of: {', '.join(PORTAL_ACCESS)}"
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
            "portal_access": user_data.portal_access,
            "organization": user_data.organization,
            "department": user_data.department,
            "specialization": user_data.specialization,
            "phone": user_data.phone,
            "license_number": user_data.license_number,
            "qualifications": user_data.qualifications or [],
            "is_active": user_data.is_active,
            "is_verified": user_data.is_verified,
            "permissions": user_data.permissions or [],
            "created_at": now,
            "updated_at": now,
            "last_login": None,
            "login_attempts": 0,
            "locked_until": None,
            "audit_hash": generate_blockchain_hash(f"admin_user_creation:{user_data.email}")
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Log audit event
        log_admin_audit_event(
            "user_created",
            current_user["user_id"],
            str(result.inserted_id),
            {"email": user_data.email, "role": user_data.role, "portal_access": user_data.portal_access}
        )
        
        return AdminUserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            first_name=user_doc["first_name"],
            last_name=user_doc["last_name"],
            role=user_doc["role"],
            portal_access=user_doc["portal_access"],
            organization=user_doc["organization"],
            department=user_doc["department"],
            specialization=user_doc["specialization"],
            phone=user_doc["phone"],
            license_number=user_doc["license_number"],
            qualifications=user_doc["qualifications"],
            is_active=user_doc["is_active"],
            is_verified=user_doc["is_verified"],
            permissions=user_doc["permissions"],
            last_login=user_doc["last_login"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/{user_id}", response_model=AdminUserResponse)
@check_permission("admin_manage_users")
async def admin_update_user(
    user_id: str,
    user_data: AdminUserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user information with admin privileges"""
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
        if user_data.role and user_data.role not in ADMIN_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(ADMIN_ROLES)}"
            )
        
        # Validate portal access if provided
        if user_data.portal_access:
            for portal in user_data.portal_access:
                if portal not in PORTAL_ACCESS:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid portal access: {portal}. Must be one of: {', '.join(PORTAL_ACCESS)}"
                    )
        
        # Build update data
        update_data = {"updated_at": settings.get_current_timestamp()}
        
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name
        if user_data.role is not None:
            update_data["role"] = user_data.role
        if user_data.portal_access is not None:
            update_data["portal_access"] = user_data.portal_access
        if user_data.organization is not None:
            update_data["organization"] = user_data.organization
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
        if user_data.is_verified is not None:
            update_data["is_verified"] = user_data.is_verified
        if user_data.permissions is not None:
            update_data["permissions"] = user_data.permissions
        
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
        log_admin_audit_event(
            "user_updated",
            current_user["user_id"],
            user_id,
            update_data
        )
        
        # Get updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        return AdminUserResponse(
            id=str(updated_user["_id"]),
            email=updated_user["email"],
            first_name=updated_user["first_name"],
            last_name=updated_user["last_name"],
            role=updated_user["role"],
            portal_access=updated_user.get("portal_access", []),
            organization=updated_user.get("organization"),
            department=updated_user.get("department"),
            specialization=updated_user.get("specialization"),
            phone=updated_user.get("phone"),
            license_number=updated_user.get("license_number"),
            qualifications=updated_user.get("qualifications", []),
            is_active=updated_user.get("is_active", True),
            is_verified=updated_user.get("is_verified", False),
            permissions=updated_user.get("permissions", []),
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
@check_permission("admin_manage_users")
async def admin_delete_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a user (soft delete) with admin privileges"""
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
        log_admin_audit_event(
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
@check_permission("admin_manage_users")
async def admin_activate_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Activate a deactivated user with admin privileges"""
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
        log_admin_audit_event(
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

@router.post("/{user_id}/verify")
@check_permission("admin_manage_users")
async def admin_verify_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Verify a user with admin privileges"""
    try:
        users_collection = get_users_collection()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify user
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_verified": True,
                    "updated_at": settings.get_current_timestamp()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to verify user"
            )
        
        # Log audit event
        log_admin_audit_event(
            "user_verified",
            current_user["user_id"],
            user_id,
            {"email": existing_user["email"]}
        )
        
        return {
            "success": True,
            "message": "User verified successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify user: {str(e)}"
        )

@router.get("/roles/list")
async def admin_get_roles(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get list of available roles and portal access options"""
    return {
        "roles": ADMIN_ROLES,
        "portal_access": PORTAL_ACCESS,
        "departments": MEDICAL_DEPARTMENTS,
        "specializations": MEDICAL_SPECIALIZATIONS
    }

@router.get("/statistics/overview")
@check_permission("admin_manage_users")
async def admin_get_user_statistics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get comprehensive user management statistics for admin"""
    try:
        users_collection = get_users_collection()
        
        # Get basic counts
        total_users = await users_collection.count_documents({})
        active_users = await users_collection.count_documents({"is_active": True})
        inactive_users = await users_collection.count_documents({"is_active": False})
        verified_users = await users_collection.count_documents({"is_verified": True})
        unverified_users = await users_collection.count_documents({"is_verified": False})
        
        # Get recent activity (users created in last 30 days)
        thirty_days_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_users = await users_collection.count_documents({
            "created_at": {"$gte": thirty_days_ago.isoformat()}
        })
        
        # Get users by role
        role_stats = {}
        for role in ADMIN_ROLES:
            count = await users_collection.count_documents({"role": role, "is_active": True})
            role_stats[role] = count
        
        # Get users by portal access
        portal_stats = {}
        for portal in PORTAL_ACCESS:
            count = await users_collection.count_documents({"portal_access": portal, "is_active": True})
            portal_stats[portal] = count
        
        # Get login activity (users who logged in last 7 days)
        seven_days_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        login_activity = await users_collection.count_documents({
            "last_login": {"$gte": seven_days_ago.isoformat()}
        })
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "verified_users": verified_users,
            "unverified_users": unverified_users,
            "recent_users": recent_users,
            "role_distribution": role_stats,
            "portal_distribution": portal_stats,
            "login_activity": login_activity
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.post("/{user_id}/reset-password")
@check_permission("admin_manage_users")
async def admin_reset_user_password(
    user_id: str,
    new_password: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Reset user password with admin privileges"""
    try:
        users_collection = get_users_collection()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update password
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password_hash": hashed_password,
                    "updated_at": settings.get_current_timestamp()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reset password"
            )
        
        # Log audit event
        log_admin_audit_event(
            "password_reset",
            current_user["user_id"],
            user_id,
            {"email": existing_user["email"]}
        )
        
        return {
            "success": True,
            "message": "Password reset successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}"
        )
