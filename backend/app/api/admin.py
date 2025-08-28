"""
Admin API endpoints for EVEP Platform
Handles system administration, user management, and system statistics
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash, hash_password
from app.core.database import get_users_collection, get_patients_collection, get_screenings_collection, get_audit_logs_collection
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Management"])

# Models
class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str  # admin, doctor, nurse, teacher, parent
    organization: str
    password: str
    is_active: bool = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    organization: Optional[str] = None
    is_active: Optional[bool] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class SystemStats(BaseModel):
    totalUsers: int
    totalPatients: int
    totalScreenings: int
    activeUsers: int
    systemHealth: str
    storageUsage: int
    lastBackup: str

@router.get("/stats", response_model=SystemStats)
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    """Get system statistics"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        patients_collection = get_patients_collection()
        screenings_collection = get_screenings_collection()
        
        # Get counts
        total_users = await users_collection.count_documents({})
        total_patients = await patients_collection.count_documents({})
        total_screenings = await screenings_collection.count_documents({})
        
        # Get active users (logged in within last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_users = await users_collection.count_documents({
            "last_login": {"$gte": yesterday.isoformat()}
        })
        
        # Mock system health and storage data
        system_health = "healthy"  # In real implementation, check actual system metrics
        storage_usage = 65  # Mock percentage
        last_backup = "2025-08-28T10:00:00Z"  # Mock timestamp
        
        return SystemStats(
            totalUsers=total_users,
            totalPatients=total_patients,
            totalScreenings=total_screenings,
            activeUsers=active_users,
            systemHealth=system_health,
            storageUsage=storage_usage,
            lastBackup=last_backup
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system statistics: {str(e)}"
        )

@router.get("/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        users = await users_collection.find({}).to_list(length=None)
        
        # Convert to response format
        user_list = []
        for user in users:
            user_list.append({
                "user_id": str(user["_id"]),
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "role": user["role"],
                "organization": user.get("organization", ""),
                "is_active": user.get("is_active", True),
                "last_login": user.get("last_login", ""),
                "created_at": user.get("created_at", ""),
                "permissions": user.get("permissions", [])
            })
        
        return {"users": user_list}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

@router.post("/users", response_model=dict)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new user"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Generate blockchain hash for audit
        audit_hash = generate_blockchain_hash(
            f"user_creation:{user_data.email}:{current_user['user_id']}"
        )
        
        # Create user document
        user_doc = {
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role,
            "organization": user_data.organization,
            "hashed_password": hash_password(user_data.password),
            "is_active": user_data.is_active,
            "created_at": settings.get_current_timestamp(),
            "updated_at": settings.get_current_timestamp(),
            "created_by": current_user["user_id"],
            "audit_hash": audit_hash,
            "last_login": None,
            "permissions": []
        }
        
        # Insert user into database
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Log user creation
        await audit_logs_collection.insert_one({
            "action": "user_created",
            "user_id": current_user["user_id"],
            "target_user_id": str(result.inserted_id),
            "timestamp": settings.get_current_timestamp(),
            "audit_hash": audit_hash,
            "details": {
                "user_email": user_data.email,
                "user_role": user_data.role,
                "created_by": current_user["email"]
            }
        })
        
        return {
            "user_id": str(result.inserted_id),
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role,
            "organization": user_data.organization,
            "is_active": user_data.is_active,
            "message": "User created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/users/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a user"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in user_data.dict().items() if v is not None}
        update_data["updated_at"] = settings.get_current_timestamp()
        
        # Generate blockchain hash for audit
        audit_hash = generate_blockchain_hash(
            f"user_update:{user_id}:{current_user['user_id']}"
        )
        update_data["audit_hash"] = audit_hash
        
        # Update user
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made"
            )
        
        # Log user update
        await audit_logs_collection.insert_one({
            "action": "user_updated",
            "user_id": current_user["user_id"],
            "target_user_id": user_id,
            "timestamp": settings.get_current_timestamp(),
            "audit_hash": audit_hash,
            "details": {
                "updated_fields": list(update_data.keys()),
                "user_email": existing_user["email"],
                "updated_by": current_user["email"]
            }
        })
        
        return {
            "user_id": user_id,
            "message": "User updated successfully",
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.patch("/users/{user_id}/status", response_model=dict)
async def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user status (activate/deactivate)"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate blockchain hash for audit
        audit_hash = generate_blockchain_hash(
            f"user_status_update:{user_id}:{current_user['user_id']}"
        )
        
        # Update user status
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": status_data.is_active,
                    "updated_at": settings.get_current_timestamp(),
                    "audit_hash": audit_hash
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user status"
            )
        
        # Log user status update
        await audit_logs_collection.insert_one({
            "action": "user_status_updated",
            "user_id": current_user["user_id"],
            "target_user_id": user_id,
            "timestamp": settings.get_current_timestamp(),
            "audit_hash": audit_hash,
            "details": {
                "new_status": "active" if status_data.is_active else "inactive",
                "user_email": existing_user["email"],
                "updated_by": current_user["email"]
            }
        })
        
        return {
            "user_id": user_id,
            "message": f"User {'activated' if status_data.is_active else 'deactivated'} successfully",
            "is_active": status_data.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a user"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent admin from deleting themselves
        if user_id == current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Generate blockchain hash for audit
        audit_hash = generate_blockchain_hash(
            f"user_deletion:{user_id}:{current_user['user_id']}"
        )
        
        # Soft delete user (mark as inactive instead of hard delete)
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": False,
                    "deleted_at": settings.get_current_timestamp(),
                    "audit_hash": audit_hash
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete user"
            )
        
        # Log user deletion
        await audit_logs_collection.insert_one({
            "action": "user_deleted",
            "user_id": current_user["user_id"],
            "target_user_id": user_id,
            "timestamp": settings.get_current_timestamp(),
            "audit_hash": audit_hash,
            "details": {
                "user_email": existing_user["email"],
                "deleted_by": current_user["email"],
                "deletion_type": "soft_delete"
            }
        })
        
        return {
            "user_id": user_id,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

# System Settings Models
class SystemSettings(BaseModel):
    general: dict
    email: dict
    security: dict
    storage: dict
    notifications: dict

class SettingsUpdate(BaseModel):
    settings: SystemSettings

@router.get("/settings")
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    """Get system settings"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # In a real implementation, this would fetch from database
        # For now, return default settings
        default_settings = {
            "general": {
                "siteName": "EVEP Platform",
                "siteDescription": "EYE Vision Evaluation Platform",
                "timezone": "Asia/Bangkok",
                "language": "en",
                "maintenanceMode": False,
            },
            "email": {
                "smtpHost": "smtp.gmail.com",
                "smtpPort": 587,
                "smtpUsername": "",
                "smtpPassword": "",
                "fromEmail": "noreply@evep.com",
                "fromName": "EVEP System",
                "enableEmailNotifications": True,
            },
            "security": {
                "sessionTimeout": 30,
                "maxLoginAttempts": 5,
                "passwordMinLength": 8,
                "requireTwoFactor": False,
                "enableAuditLogging": True,
                "ipWhitelist": [],
            },
            "storage": {
                "maxFileSize": 10,
                "allowedFileTypes": ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
                "enableCompression": True,
                "backupFrequency": "daily",
                "retentionDays": 30,
            },
            "notifications": {
                "enableEmailAlerts": True,
                "enableSMSAlerts": False,
                "enablePushNotifications": True,
                "alertLevels": ["critical", "warning", "info"],
            },
        }
        
        return {"settings": default_settings}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system settings: {str(e)}"
        )

@router.put("/settings")
async def update_system_settings(
    settings_data: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update system settings"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        audit_logs_collection = get_audit_logs_collection()
        
        # Generate blockchain hash for audit
        audit_hash = generate_blockchain_hash(
            f"settings_update:{current_user['user_id']}"
        )
        
        # In a real implementation, this would save to database
        # For now, just log the action
        
        # Log settings update
        await audit_logs_collection.insert_one({
            "action": "settings_updated",
            "user_id": current_user["user_id"],
            "timestamp": settings.get_current_timestamp(),
            "audit_hash": audit_hash,
            "details": {
                "updated_by": current_user["email"],
                "settings_sections": list(settings_data.settings.dict().keys()),
                "maintenance_mode": settings_data.settings.general.get("maintenanceMode", False),
            }
        })
        
        return {
            "message": "Settings updated successfully",
            "updated_sections": list(settings_data.settings.dict().keys()),
            "audit_hash": audit_hash
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update system settings: {str(e)}"
        )

# Security Models
class SecurityEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str
    severity: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    ip_address: str
    user_agent: str
    location: Optional[str] = None
    details: str
    status: str

class SecurityStats(BaseModel):
    totalEvents: int
    criticalEvents: int
    highPriorityEvents: int
    failedLogins: int
    suspiciousActivities: int
    blockedIPs: int
    last24Hours: int

@router.get("/security/events")
async def get_security_events(current_user: dict = Depends(get_current_user)):
    """Get security events"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # In a real implementation, this would fetch from database
        # For now, return mock data
        mock_events = [
            {
                "id": "1",
                "timestamp": "2025-08-28T10:30:00Z",
                "event_type": "failed_login",
                "severity": "high",
                "user_email": "unknown@example.com",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "location": "Bangkok, Thailand",
                "details": "Multiple failed login attempts detected",
                "status": "pending",
            },
            {
                "id": "2",
                "timestamp": "2025-08-28T10:25:00Z",
                "event_type": "suspicious_activity",
                "severity": "critical",
                "user_id": "68b0209bc6a9ef729bb33c9c",
                "user_email": "doctor@evep.com",
                "ip_address": "203.113.45.67",
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)",
                "location": "Chiang Mai, Thailand",
                "details": "Unusual access pattern detected",
                "status": "investigated",
            },
            {
                "id": "3",
                "timestamp": "2025-08-28T10:20:00Z",
                "event_type": "admin_action",
                "severity": "medium",
                "user_id": "68b0209bc6a9ef729bb33c9e",
                "user_email": "admin@evep.com",
                "ip_address": "192.168.1.50",
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "location": "Bangkok, Thailand",
                "details": "User management action performed",
                "status": "resolved",
            },
        ]
        
        return {"events": mock_events}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get security events: {str(e)}"
        )

@router.get("/security/stats")
async def get_security_stats(current_user: dict = Depends(get_current_user)):
    """Get security statistics"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # In a real implementation, this would calculate from database
        # For now, return mock data
        mock_stats = {
            "totalEvents": 156,
            "criticalEvents": 3,
            "highPriorityEvents": 12,
            "failedLogins": 8,
            "suspiciousActivities": 2,
            "blockedIPs": 1,
            "last24Hours": 45,
        }
        
        return {"stats": mock_stats}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get security stats: {str(e)}"
        )

# User Statistics Models
class UserStats(BaseModel):
    totalUsers: int
    activeUsers: int
    adminUsers: int
    medicalUsers: int
    teacherUsers: int
    parentUsers: int
    verifiedUsers: int
    newUsersThisMonth: int

@router.get("/users/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # In a real implementation, this would calculate from database
        # For now, return mock data
        mock_stats = {
            "totalUsers": 156,
            "activeUsers": 142,
            "adminUsers": 3,
            "medicalUsers": 45,
            "teacherUsers": 78,
            "parentUsers": 30,
            "verifiedUsers": 134,
            "newUsersThisMonth": 12,
        }
        
        return {"stats": mock_stats}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user stats: {str(e)}"
        )
