"""
Admin RBAC Management API endpoints for System Admin Panel
Allows system administrators to manage roles, permissions, and user role assignments
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from bson import ObjectId

from app.core.config import settings
from app.core.security import generate_blockchain_hash
from app.core.database import get_users_collection, get_audit_logs_collection
from app.api.auth import get_current_user
from app.core.rbac import check_permission

router = APIRouter()
security = HTTPBearer()

# Pydantic models for admin RBAC management
class AdminRoleCreate(BaseModel):
    name: str
    description: str
    permissions: List[str]
    portal_access: List[str] = []
    is_system: bool = False
    priority: int = 0

class AdminRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    portal_access: Optional[List[str]] = None
    priority: Optional[int] = None

class AdminRoleResponse(BaseModel):
    id: str
    name: str
    description: str
    permissions: List[str]
    portal_access: List[str]
    is_system: bool
    priority: int
    created_at: str
    updated_at: str

class AdminPermissionCreate(BaseModel):
    name: str
    description: str
    category: str
    resource: str
    action: str
    portal: str

class AdminPermissionResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    resource: str
    action: str
    portal: str
    created_at: str

class AdminUserRoleAssignment(BaseModel):
    user_id: str
    role_id: str
    assigned_by: str
    expires_at: Optional[str] = None

class AdminUserRoleResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    role_id: str
    role_name: str
    assigned_by: str
    assigned_at: str
    expires_at: Optional[str] = None

# Default system roles
DEFAULT_SYSTEM_ROLES = [
    {
        "name": "system_admin",
        "description": "System Administrator with full access",
        "permissions": ["full_access"],
        "portal_access": ["medical", "admin", "school"],
        "is_system": True,
        "priority": 100
    },
    {
        "name": "medical_admin",
        "description": "Medical Portal Administrator",
        "permissions": [
            "view_patients",
            "manage_screenings", 
            "view_reports",
            "manage_glasses_inventory",
            "view_medical_staff",
            "access_medical_portal",
            "view_analytics",
            "manage_appointments",
            "manage_school_data",
            "view_user_management",
            "manage_user_management"
        ],
        "portal_access": ["medical"],
        "is_system": True,
        "priority": 90
    },
    {
        "name": "doctor",
        "description": "Medical Doctor",
        "permissions": [
            "view_patients",
            "manage_screenings",
            "view_reports",
            "access_medical_portal"
        ],
        "portal_access": ["medical"],
        "is_system": True,
        "priority": 80
    }
]

# Default permissions
DEFAULT_PERMISSIONS = [
    {"name": "full_access", "description": "Full system access", "category": "system", "resource": "all", "action": "all", "portal": "admin"},
    {"name": "view_user_management", "description": "View user management", "category": "user", "resource": "users", "action": "view", "portal": "medical"},
    {"name": "manage_user_management", "description": "Manage user management", "category": "user", "resource": "users", "action": "manage", "portal": "medical"},
    {"name": "admin_manage_users", "description": "Admin user management", "category": "user", "resource": "users", "action": "admin", "portal": "admin"},
    {"name": "admin_manage_rbac", "description": "Admin RBAC management", "category": "rbac", "resource": "rbac", "action": "admin", "portal": "admin"}
]

def log_admin_rbac_event(action: str, admin_user_id: str, target_id: str, details: Dict[str, Any]):
    """Log audit event for admin RBAC actions"""
    audit_logs_collection = get_audit_logs_collection()
    
    audit_event = {
        "action": f"admin_rbac_{action}",
        "admin_user_id": admin_user_id,
        "target_id": target_id,
        "details": details,
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "system",
        "user_agent": "admin_rbac_api",
        "audit_hash": generate_blockchain_hash(f"admin_rbac_{action}:{target_id}")
    }
    
    audit_logs_collection.insert_one(audit_event)

# File paths for storing RBAC data
ADMIN_ROLES_FILE = "admin_rbac_roles.json"
ADMIN_PERMISSIONS_FILE = "admin_rbac_permissions.json"
ADMIN_USER_ROLES_FILE = "admin_rbac_user_roles.json"

def load_admin_roles() -> List[Dict[str, Any]]:
    """Load admin roles from file"""
    try:
        import json
        import os
        
        if os.path.exists(ADMIN_ROLES_FILE):
            with open(ADMIN_ROLES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("roles", [])
        else:
            return DEFAULT_SYSTEM_ROLES
    except Exception as e:
        print(f"Error loading admin roles: {e}")
        return DEFAULT_SYSTEM_ROLES

def save_admin_roles(roles: List[Dict[str, Any]]) -> bool:
    """Save admin roles to file"""
    try:
        import json
        
        with open(ADMIN_ROLES_FILE, 'w', encoding='utf-8') as f:
            json.dump({"roles": roles}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving admin roles: {e}")
        return False

def load_admin_permissions() -> List[Dict[str, Any]]:
    """Load admin permissions from file"""
    try:
        import json
        import os
        
        if os.path.exists(ADMIN_PERMISSIONS_FILE):
            with open(ADMIN_PERMISSIONS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("permissions", [])
        else:
            return DEFAULT_PERMISSIONS
    except Exception as e:
        print(f"Error loading admin permissions: {e}")
        return DEFAULT_PERMISSIONS

def save_admin_permissions(permissions: List[Dict[str, Any]]) -> bool:
    """Save admin permissions to file"""
    try:
        import json
        
        with open(ADMIN_PERMISSIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump({"permissions": permissions}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving admin permissions: {e}")
        return False

@router.get("/roles/", response_model=List[AdminRoleResponse])
@check_permission("admin_manage_rbac")
async def admin_get_roles(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all roles for admin management"""
    try:
        roles = load_admin_roles()
        
        role_responses = []
        for role in roles:
            role_responses.append(AdminRoleResponse(
                id=role.get("id", f"role_{role['name']}"),
                name=role["name"],
                description=role["description"],
                permissions=role["permissions"],
                portal_access=role.get("portal_access", []),
                is_system=role.get("is_system", False),
                priority=role.get("priority", 0),
                created_at=role.get("created_at", settings.get_current_timestamp()),
                updated_at=role.get("updated_at", settings.get_current_timestamp())
            ))
        
        return role_responses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch roles: {str(e)}"
        )

@router.post("/roles/", response_model=AdminRoleResponse)
@check_permission("admin_manage_rbac")
async def admin_create_role(
    role_data: AdminRoleCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new role with admin privileges"""
    try:
        roles = load_admin_roles()
        
        # Check if role already exists
        if any(role["name"] == role_data.name for role in roles):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists"
            )
        
        # Create new role
        now = settings.get_current_timestamp()
        new_role = {
            "id": f"role_{len(roles) + 1}",
            "name": role_data.name,
            "description": role_data.description,
            "permissions": role_data.permissions,
            "portal_access": role_data.portal_access,
            "is_system": role_data.is_system,
            "priority": role_data.priority,
            "created_at": now,
            "updated_at": now
        }
        
        roles.append(new_role)
        
        if save_admin_roles(roles):
            # Log audit event
            log_admin_rbac_event(
                "role_created",
                current_user["user_id"],
                new_role["id"],
                {"name": role_data.name, "permissions": role_data.permissions}
            )
            
            return AdminRoleResponse(
                id=new_role["id"],
                name=new_role["name"],
                description=new_role["description"],
                permissions=new_role["permissions"],
                portal_access=new_role["portal_access"],
                is_system=new_role["is_system"],
                priority=new_role["priority"],
                created_at=new_role["created_at"],
                updated_at=new_role["updated_at"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save role"
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create role: {str(e)}"
        )

@router.get("/permissions/", response_model=List[AdminPermissionResponse])
@check_permission("admin_manage_rbac")
async def admin_get_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all permissions for admin management"""
    try:
        permissions = load_admin_permissions()
        
        permission_responses = []
        for perm in permissions:
            permission_responses.append(AdminPermissionResponse(
                id=perm.get("id", f"perm_{perm['name']}"),
                name=perm["name"],
                description=perm["description"],
                category=perm["category"],
                resource=perm["resource"],
                action=perm["action"],
                portal=perm["portal"],
                created_at=perm.get("created_at", settings.get_current_timestamp())
            ))
        
        return permission_responses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch permissions: {str(e)}"
        )

@router.get("/statistics/overview")
@check_permission("admin_manage_rbac")
async def admin_get_rbac_statistics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get RBAC management statistics for admin"""
    try:
        roles = load_admin_roles()
        permissions = load_admin_permissions()
        
        # Calculate statistics
        total_roles = len(roles)
        total_permissions = len(permissions)
        system_roles = len([r for r in roles if r.get("is_system", False)])
        custom_roles = total_roles - system_roles
        
        # Role distribution by portal
        role_distribution = {}
        for role in roles:
            for portal in role.get("portal_access", []):
                role_distribution[portal] = role_distribution.get(portal, 0) + 1
        
        # Permission distribution by category
        permission_distribution = {}
        for perm in permissions:
            category = perm["category"]
            permission_distribution[category] = permission_distribution.get(category, 0) + 1
        
        # Portal distribution
        portal_distribution = {}
        for perm in permissions:
            portal = perm["portal"]
            portal_distribution[portal] = portal_distribution.get(portal, 0) + 1
        
        return {
            "total_roles": total_roles,
            "total_permissions": total_permissions,
            "system_roles": system_roles,
            "custom_roles": custom_roles,
            "role_distribution": role_distribution,
            "permission_distribution": permission_distribution,
            "portal_distribution": portal_distribution
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.post("/initialize")
@check_permission("admin_manage_rbac")
async def admin_initialize_rbac(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Initialize RBAC system with default roles and permissions"""
    try:
        # Initialize roles
        roles = load_admin_roles()
        if not roles:
            save_admin_roles(DEFAULT_SYSTEM_ROLES)
        
        # Initialize permissions
        permissions = load_admin_permissions()
        if not permissions:
            save_admin_permissions(DEFAULT_PERMISSIONS)
        
        # Log audit event
        log_admin_rbac_event(
            "rbac_initialized",
            current_user["user_id"],
            "system",
            {"roles_count": len(DEFAULT_SYSTEM_ROLES), "permissions_count": len(DEFAULT_PERMISSIONS)}
        )
        
        return {
            "success": True,
            "message": "RBAC system initialized successfully",
            "roles_created": len(DEFAULT_SYSTEM_ROLES),
            "permissions_created": len(DEFAULT_PERMISSIONS)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize RBAC: {str(e)}"
        )
