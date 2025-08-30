"""
Admin API endpoints for EVEP Platform
Handles system administration, user management, and system statistics
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash, hash_password
from app.core.database import get_users_collection, get_patients_collection, get_screenings_collection, get_audit_logs_collection
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Management"])

def get_client_ip(request: Request) -> str:
    """Get the real client IP address"""
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection IP
    return request.client.host if request.client else "unknown"

async def log_security_event(
    request: Request,
    current_user: dict,
    event_type: str,
    action: str,
    resource: str,
    status: str = "success",
    details: str = "",
    severity: str = "low"
):
    """Log a security event to the audit database"""
    try:
        audit_logs_collection = get_audit_logs_collection()
        
        # Get client information
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "Unknown")
        
        # Create security event
        security_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "portal": "admin",  # Distinguish from medical portal
            "user_id": current_user.get("id", "unknown"),
            "user_email": current_user.get("email", "unknown@example.com"),
            "user_role": current_user.get("role", "unknown"),
            "ip_address": client_ip,
            "user_agent": user_agent,
            "resource": resource,
            "action": action,
            "status": status,
            "details": details,
            "severity": severity,
            "audit_hash": f"admin_{event_type}_{current_user.get('id', 'unknown')}_{client_ip}_{int(datetime.utcnow().timestamp())}"
        }
        
        # Save to database - REAL IMPLEMENTATION
        await audit_logs_collection.insert_one(security_event)
        
        # Log to console for debugging
        print(f"🔒 SECURITY EVENT: {event_type} - {action} from {client_ip} by {current_user.get('email', 'unknown')}")
        
        return security_event
        
    except Exception as e:
        print(f"Error logging security event: {str(e)}")
        return None

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
async def get_system_stats(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get system statistics"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this system stats access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="System stats accessed",
            resource="/api/v1/admin/stats",
            details="Admin accessed system statistics"
        )
        
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

@router.get("/system-monitoring")
async def get_system_monitoring(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get system monitoring metrics for the monitoring dashboard"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this system monitoring access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="System monitoring accessed",
            resource="/api/v1/admin/system-monitoring",
            details="Admin accessed system monitoring metrics"
        )
        
        # Mock system monitoring data
        # In a real implementation, these would be actual system metrics
        system_metrics = {
            "cpu_usage": 42,
            "memory_usage": 68,
            "disk_usage": 45,
            "network_usage": 25,
            "active_connections": 15,
            "uptime": 86400,  # 24 hours in seconds
            "last_backup": "2025-08-28T10:00:00Z",
            "system_health": "healthy"
        }
        
        return system_metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system monitoring data: {str(e)}"
        )

@router.get("/users")
async def get_users(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get all users"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this users access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Users list accessed",
            resource="/api/v1/admin/users",
            details="Admin accessed user management"
        )
        
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

@router.get("/settings/list")
async def get_system_settings_list(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get system settings as a list for the admin panel"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this settings access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="System settings list accessed",
            resource="/api/v1/admin/settings/list",
            details="Admin accessed system settings list"
        )
        
        # Convert the settings structure to a list format expected by the frontend
        settings_list = [
            # General Settings
            {
                "key": "siteName",
                "value": "EVEP Platform",
                "category": "general",
                "type": "string",
                "description": "Platform name displayed throughout the application",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "siteDescription",
                "value": "EYE Vision Evaluation Platform",
                "category": "general",
                "type": "string",
                "description": "Platform description",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "timezone",
                "value": "Asia/Bangkok",
                "category": "general",
                "type": "string",
                "description": "Default timezone for the application",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "language",
                "value": "en",
                "category": "general",
                "type": "string",
                "description": "Default language for the application",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "maintenanceMode",
                "value": False,
                "category": "general",
                "type": "boolean",
                "description": "Enable maintenance mode",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            
            # Email Settings
            {
                "key": "smtpHost",
                "value": "smtp.gmail.com",
                "category": "email",
                "type": "string",
                "description": "SMTP server hostname",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "smtpPort",
                "value": 587,
                "category": "email",
                "type": "number",
                "description": "SMTP server port",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "smtpUsername",
                "value": "",
                "category": "email",
                "type": "string",
                "description": "SMTP username",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "smtpPassword",
                "value": "",
                "category": "email",
                "type": "string",
                "description": "SMTP password",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "fromEmail",
                "value": "noreply@evep.com",
                "category": "email",
                "type": "string",
                "description": "Default sender email address",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "fromName",
                "value": "EVEP System",
                "category": "email",
                "type": "string",
                "description": "Default sender name",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "enableEmailNotifications",
                "value": True,
                "category": "email",
                "type": "boolean",
                "description": "Enable email notifications",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            
            # Security Settings
            {
                "key": "sessionTimeout",
                "value": 30,
                "category": "security",
                "type": "number",
                "description": "Session timeout in minutes",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "maxLoginAttempts",
                "value": 5,
                "category": "security",
                "type": "number",
                "description": "Maximum login attempts before lockout",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "passwordMinLength",
                "value": 8,
                "category": "security",
                "type": "number",
                "description": "Minimum password length",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "requireTwoFactor",
                "value": False,
                "category": "security",
                "type": "boolean",
                "description": "Require two-factor authentication",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "enableAuditLogging",
                "value": True,
                "category": "security",
                "type": "boolean",
                "description": "Enable audit logging",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "ipWhitelist",
                "value": [],
                "category": "security",
                "type": "json",
                "description": "IP addresses whitelist",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            
            # Storage Settings
            {
                "key": "maxFileSize",
                "value": 10,
                "category": "storage",
                "type": "number",
                "description": "Maximum file size in MB",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "allowedFileTypes",
                "value": ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
                "category": "storage",
                "type": "json",
                "description": "Allowed file types for upload",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "enableCompression",
                "value": True,
                "category": "storage",
                "type": "boolean",
                "description": "Enable file compression",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "backupFrequency",
                "value": "daily",
                "category": "storage",
                "type": "string",
                "description": "Backup frequency",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "retentionDays",
                "value": 30,
                "category": "storage",
                "type": "number",
                "description": "Data retention period in days",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            
            # Notification Settings
            {
                "key": "enableEmailAlerts",
                "value": True,
                "category": "notification",
                "type": "boolean",
                "description": "Enable email alerts",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "enableSMSAlerts",
                "value": False,
                "category": "notification",
                "type": "boolean",
                "description": "Enable SMS alerts",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "enablePushNotifications",
                "value": True,
                "category": "notification",
                "type": "boolean",
                "description": "Enable push notifications",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            {
                "key": "alertLevels",
                "value": ["critical", "warning", "info"],
                "category": "notification",
                "type": "json",
                "description": "Alert levels for notifications",
                "is_editable": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        ]
        
        return settings_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system settings list: {str(e)}"
        )

@router.put("/settings/{key}")
async def update_system_setting(
    key: str,
    request: Request,
    setting_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific system setting"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this settings update
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="update",
            action=f"System setting updated: {key}",
            resource=f"/api/v1/admin/settings/{key}",
            details=f"Admin updated system setting: {key} = {setting_data.get('value')}"
        )
        
        # In a real implementation, this would update the database
        # For now, just return success
        return {
            "message": f"Setting {key} updated successfully",
            "key": key,
            "value": setting_data.get("value"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update system setting: {str(e)}"
        )

@router.post("/settings")
async def create_system_setting(
    request: Request,
    setting_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new system setting"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this settings creation
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="create",
            action=f"System setting created: {setting_data.get('key')}",
            resource="/api/v1/admin/settings",
            details=f"Admin created system setting: {setting_data.get('key')} = {setting_data.get('value')}"
        )
        
        # In a real implementation, this would save to database
        # For now, just return success
        return {
            "message": f"Setting {setting_data.get('key')} created successfully",
            "key": setting_data.get("key"),
            "value": setting_data.get("value"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create system setting: {str(e)}"
        )

@router.delete("/settings/{key}")
async def delete_system_setting(
    key: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete a system setting"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this settings deletion
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="delete",
            action=f"System setting deleted: {key}",
            resource=f"/api/v1/admin/settings/{key}",
            details=f"Admin deleted system setting: {key}"
        )
        
        # In a real implementation, this would delete from database
        # For now, just return success
        return {
            "message": f"Setting {key} deleted successfully",
            "key": key
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete system setting: {str(e)}"
        )

@router.post("/settings/initialize")
async def initialize_system_settings(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Initialize system settings with default values"""
    
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Log this settings initialization
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="initialize",
            action="System settings initialized",
            resource="/api/v1/admin/settings/initialize",
            details="Admin initialized system settings with default values"
        )
        
        # In a real implementation, this would initialize database with default settings
        # For now, just return success
        return {
            "message": "System settings initialized successfully",
            "initialized_at": datetime.utcnow().isoformat(),
            "settings_count": 25  # Number of default settings
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize system settings: {str(e)}"
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

# Security & Audit Endpoints
@router.get("/security/events")
async def get_security_events(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get security events"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this security events access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Security events accessed",
            resource="/api/v1/admin/security/events",
            details="Admin accessed security audit logs"
        )
        
        # Get real security events from database
        audit_logs_collection = get_audit_logs_collection()
        
        # Fetch real events from database (admin portal only, last 50 events)
        cursor = audit_logs_collection.find({"portal": "admin"}).sort("timestamp", -1).limit(50)
        db_events = await cursor.to_list(length=50)
        
        # Convert database events to response format
        events = []
        for i, event in enumerate(db_events):
            events.append({
                "id": str(event.get("_id", i + 1)),
                "timestamp": event.get("timestamp", ""),
                "event_type": event.get("event_type", ""),
                "portal": event.get("portal", "admin"),  # Include portal field
                "user_id": event.get("user_id", ""),
                "user_email": event.get("user_email", ""),
                "user_role": event.get("user_role", ""),
                "ip_address": event.get("ip_address", ""),
                "user_agent": event.get("user_agent", ""),
                "resource": event.get("resource", ""),
                "action": event.get("action", ""),
                "status": event.get("status", ""),
                "details": event.get("details", ""),
                "severity": event.get("severity", "low")
            })
        
        # If no events in database, create a default login event for current user
        if not events:
            current_ip = get_client_ip(request)
            current_user_agent = request.headers.get("User-Agent", "Unknown")
            events.append({
                "id": "1",
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": "login",
                "user_id": current_user.get("id", "unknown"),
                "user_email": current_user.get("email", "unknown@example.com"),
                "user_role": current_user.get("role", "unknown"),
                "ip_address": current_ip,
                "user_agent": current_user_agent,
                "resource": "/api/v1/auth/login",
                "action": "User login",
                "status": "success",
                "details": f"Successful login from {current_ip}",
                "severity": "low"
            })
        
        return {"events": events}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get security events: {str(e)}")

@router.get("/security/stats")
async def get_security_stats(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get security statistics"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this security stats access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Security stats accessed",
            resource="/api/v1/admin/security/stats",
            details="Admin accessed security statistics"
        )
        
        # Get current client IP
        current_ip = get_client_ip(request)
        
        # Get real security stats from database
        audit_logs_collection = get_audit_logs_collection()
        
        # Calculate real statistics from database
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Admin portal specific queries
        admin_query = {"portal": "admin"}
        
        # Total events
        total_events = await audit_logs_collection.count_documents(admin_query)
        
        # Failed logins
        failed_logins = await audit_logs_collection.count_documents({
            **admin_query,
            "event_type": "login",
            "status": "failed"
        })
        
        # Suspicious activities (access_denied events)
        suspicious_activities = await audit_logs_collection.count_documents({
            **admin_query,
            "event_type": "access_denied"
        })
        
        # Security alerts
        security_alerts = await audit_logs_collection.count_documents({
            **admin_query,
            "event_type": "security_alert"
        })
        
        # Last 24h events
        last_24h_events = await audit_logs_collection.count_documents({
            **admin_query,
            "timestamp": {"$gte": yesterday.isoformat()}
        })
        
        # Last 7 days events
        last_7d_events = await audit_logs_collection.count_documents({
            **admin_query,
            "timestamp": {"$gte": week_ago.isoformat()}
        })
        
        # Last 30 days events
        last_30d_events = await audit_logs_collection.count_documents({
            **admin_query,
            "timestamp": {"$gte": month_ago.isoformat()}
        })
        
        # Get unique IPs that had access denied
        blocked_ips_cursor = audit_logs_collection.aggregate([
            {"$match": {**admin_query, "event_type": "access_denied"}},
            {"$group": {"_id": "$ip_address"}},
            {"$count": "count"}
        ])
        blocked_ips_result = await blocked_ips_cursor.to_list(length=1)
        blocked_ips = blocked_ips_result[0]["count"] if blocked_ips_result else 0
        
        # Real security stats
        stats = {
            "total_events": total_events,
            "failed_logins": failed_logins,
            "suspicious_activities": suspicious_activities,
            "blocked_ips": blocked_ips,
            "security_alerts": security_alerts,
            "last_24h_events": last_24h_events,
            "last_7d_events": last_7d_events,
            "last_30d_events": last_30d_events,
            "current_client_ip": current_ip,
            "current_user_agent": request.headers.get("User-Agent", "Unknown"),
            "last_activity": datetime.utcnow().isoformat()
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get security stats: {str(e)}")

@router.get("/database/stats")
async def get_database_stats(request: Request, current_user: dict = Depends(get_current_user)):
    """Get database statistics"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this database stats access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Database stats accessed",
            resource="/api/v1/admin/database/stats",
            details="Admin accessed database statistics"
        )
        
        # Get collections
        users_collection = get_users_collection()
        patients_collection = get_patients_collection()
        screenings_collection = get_screenings_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Calculate real statistics
        total_users = await users_collection.count_documents({})
        total_patients = await patients_collection.count_documents({})
        total_screenings = await screenings_collection.count_documents({})
        
        # Get recent activity count (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_activity = await audit_logs_collection.count_documents({
            "timestamp": {"$gte": yesterday.isoformat()}
        })
        
        # Get system status
        system_status = "Healthy"
        pending_updates = 0  # This would be calculated based on actual system updates
        
        # Get last backup time (mock for now)
        last_backup = "2 hours ago"  # This would come from actual backup system
        
        # Calculate user distribution
        admin_users = await users_collection.count_documents({"role": {"$in": ["admin", "super_admin"]}})
        medical_users = await users_collection.count_documents({"role": {"$in": ["doctor", "nurse", "teacher", "parent", "medical_staff"]}})
        
        # Get recent security events
        recent_security_events = await audit_logs_collection.count_documents({
            "timestamp": {"$gte": yesterday.isoformat()},
            "portal": "admin"
        })
        
        # Mock database size calculation (in real implementation, would use actual database stats)
        total_size = 2.5 * 1024 * 1024 * 1024  # 2.5 GB mock
        
        # Database stats
        stats = {
            "name": "evep_database",
            "size": total_size,
            "collections": 4,  # We have 4 main collections
            "indexes": 24,  # Mock value
            "status": "online",
            "connections": 15,  # Mock value
            "operations_per_sec": 1250,  # Mock value
            "memory_usage": 68,  # Mock value
            "disk_usage": 45,  # Mock value
            "data_size": total_size * 0.8,  # Mock calculation
            "index_size": total_size * 0.1,  # Mock calculation
            "storage_size": total_size * 0.9,  # Mock calculation
            "objects": total_users + total_patients + total_screenings + recent_activity
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database stats: {str(e)}")

@router.get("/database/collections")
async def get_database_collections(request: Request, current_user: dict = Depends(get_current_user)):
    """Get database collections information"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this database collections access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Database collections accessed",
            resource="/api/v1/admin/database/collections",
            details="Admin accessed database collections information"
        )
        
        # Get collections for real data
        users_collection = get_users_collection()
        patients_collection = get_patients_collection()
        screenings_collection = get_screenings_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Get real counts
        users_count = await users_collection.count_documents({})
        patients_count = await patients_collection.count_documents({})
        screenings_count = await screenings_collection.count_documents({})
        audit_logs_count = await audit_logs_collection.count_documents({})
        
        collections_info = [
            {
                "name": "users",
                "count": users_count,
                "size": users_count * 3200,  # Estimated 3.2KB per user
                "avg_obj_size": 3200,
                "indexes": 3,
                "last_updated": datetime.utcnow().isoformat(),
                "storage_size": users_count * 3500,  # Mock calculation
                "index_size": users_count * 200  # Mock calculation
            },
            {
                "name": "patients",
                "count": patients_count,
                "size": patients_count * 2400,  # Estimated 2.4KB per patient
                "avg_obj_size": 2400,
                "indexes": 5,
                "last_updated": datetime.utcnow().isoformat(),
                "storage_size": patients_count * 2600,  # Mock calculation
                "index_size": patients_count * 300  # Mock calculation
            },
            {
                "name": "screenings",
                "count": screenings_count,
                "size": screenings_count * 1500,  # Estimated 1.5KB per screening
                "avg_obj_size": 1500,
                "indexes": 4,
                "last_updated": datetime.utcnow().isoformat(),
                "storage_size": screenings_count * 1700,  # Mock calculation
                "index_size": screenings_count * 250  # Mock calculation
            },
            {
                "name": "audit_logs",
                "count": audit_logs_count,
                "size": audit_logs_count * 1000,  # Estimated 1KB per log
                "avg_obj_size": 1000,
                "indexes": 2,
                "last_updated": datetime.utcnow().isoformat(),
                "storage_size": audit_logs_count * 1100,  # Mock calculation
                "index_size": audit_logs_count * 100  # Mock calculation
            }
        ]
        
        return {"collections": collections_info}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database collections: {str(e)}")

@router.get("/database/performance")
async def get_database_performance(request: Request, current_user: dict = Depends(get_current_user)):
    """Get database performance metrics"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this database performance access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Database performance accessed",
            resource="/api/v1/admin/database/performance",
            details="Admin accessed database performance metrics"
        )
        
        # Mock performance metrics (in real implementation, this would come from database monitoring)
        performance_metrics = [
            {
                "metric": "Query Response Time",
                "value": 45,
                "unit": "ms",
                "trend": "stable",
                "threshold": 100,
                "status": "good"
            },
            {
                "metric": "Write Operations",
                "value": 1250,
                "unit": "ops/sec",
                "trend": "up",
                "threshold": 2000,
                "status": "good"
            },
            {
                "metric": "Read Operations",
                "value": 890,
                "unit": "ops/sec",
                "trend": "stable",
                "threshold": 1500,
                "status": "good"
            },
            {
                "metric": "Connection Pool",
                "value": 15,
                "unit": "connections",
                "trend": "stable",
                "threshold": 50,
                "status": "good"
            }
        ]
        
        return {"performance": performance_metrics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database performance: {str(e)}")

@router.get("/database/backups")
async def get_database_backups(request: Request, current_user: dict = Depends(get_current_user)):
    """Get database backups"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this database backups access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Database backups accessed",
            resource="/api/v1/admin/database/backups",
            details="Admin accessed database backups"
        )
        
        # Mock backup data (in real implementation, this would come from backup system)
        backups = [
            {
                "id": "1",
                "name": "backup_2024_01_15_full",
                "size": 2.3 * 1024 * 1024 * 1024,  # 2.3 GB
                "created_at": "2024-01-15T02:00:00Z",
                "status": "completed",
                "type": "full"
            },
            {
                "id": "2",
                "name": "backup_2024_01_16_incremental",
                "size": 125 * 1024 * 1024,  # 125 MB
                "created_at": "2024-01-16T02:00:00Z",
                "status": "completed",
                "type": "incremental"
            }
        ]
        
        return {"backups": backups}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database backups: {str(e)}")

@router.post("/database/backup")
async def create_database_backup(
    request: Request,
    backup_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a database backup"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this backup creation
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="backup",
            action="Database backup created",
            resource="/api/v1/admin/database/backup",
            details=f"Admin created database backup: {backup_data.get('name', 'unknown')}"
        )
        
        # Mock backup creation (in real implementation, this would trigger actual backup)
        backup_name = backup_data.get("name", f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}")
        backup_type = backup_data.get("type", "full")
        
        # Simulate backup creation
        backup_id = str(int(datetime.utcnow().timestamp()))
        
        return {
            "message": "Backup creation started successfully",
            "backup_id": backup_id,
            "name": backup_name,
            "type": backup_type,
            "status": "in_progress"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create database backup: {str(e)}")

@router.get("/system-stats")
async def get_system_stats(request: Request, current_user: dict = Depends(get_current_user)):
    """Get comprehensive system statistics"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this system stats access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="System stats accessed",
            resource="/api/v1/admin/system-stats",
            details="Admin accessed system statistics"
        )
        
        # Get collections
        users_collection = get_users_collection()
        patients_collection = get_patients_collection()
        screenings_collection = get_screenings_collection()
        audit_logs_collection = get_audit_logs_collection()
        
        # Calculate real statistics
        total_users = await users_collection.count_documents({})
        total_patients = await patients_collection.count_documents({})
        total_screenings = await screenings_collection.count_documents({})
        
        # Get recent activity count (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_activity = await audit_logs_collection.count_documents({
            "timestamp": {"$gte": yesterday.isoformat()}
        })
        
        # Get system status
        system_status = "Healthy"
        pending_updates = 0  # This would be calculated based on actual system updates
        
        # Get last backup time (mock for now)
        last_backup = "2 hours ago"  # This would come from actual backup system
        
        # Calculate user distribution
        admin_users = await users_collection.count_documents({"role": {"$in": ["admin", "super_admin"]}})
        medical_users = await users_collection.count_documents({"role": {"$in": ["doctor", "nurse", "teacher", "parent", "medical_staff"]}})
        
        # Get recent security events
        recent_security_events = await audit_logs_collection.count_documents({
            "timestamp": {"$gte": yesterday.isoformat()},
            "portal": "admin"
        })
        
        # System stats
        stats = {
            "total_users": total_users,
            "admin_users": admin_users,
            "medical_users": medical_users,
            "total_patients": total_patients,
            "total_screenings": total_screenings,
            "recent_activity": recent_activity,
            "recent_security_events": recent_security_events,
            "system_status": system_status,
            "pending_updates": pending_updates,
            "last_backup": last_backup,
            "database_status": "Online",
            "security_status": "Secure",
            "uptime": "99.9%",
            "memory_usage": 45.2,  # Mock data - would come from system monitoring
            "cpu_usage": 23.1,     # Mock data - would come from system monitoring
            "disk_usage": 67.8,    # Mock data - would come from system monitoring
            "active_connections": 12,  # Mock data - would come from connection pool
            "database_connections": 8   # Mock data - would come from database monitoring
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@router.get("/system/health")
async def get_system_health(request: Request, current_user: dict = Depends(get_current_user)):
    """Get system health information"""
    
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Log this health check access
        await log_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="System health accessed",
            resource="/api/v1/admin/system/health",
            details="Admin accessed system health information"
        )
        
        # Check database connectivity
        try:
            users_collection = get_users_collection()
            await users_collection.find_one({})
            database_status = "Online"
        except Exception:
            database_status = "Offline"
        
        # Mock system health data (in real implementation, this would come from system monitoring)
        health_data = {
            "status": "Healthy",
            "uptime": "99.9%",
            "memory_usage": 45.2,
            "cpu_usage": 23.1,
            "disk_usage": 67.8,
            "database_status": database_status,
            "database_connections": 8,
            "active_connections": 12,
            "last_check": datetime.utcnow().isoformat(),
            "services": {
                "api": "Online",
                "database": database_status,
                "redis": "Online",
                "socketio": "Online"
            }
        }
        
        return health_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")
