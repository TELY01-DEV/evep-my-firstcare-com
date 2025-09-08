from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List, Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.core.database import get_users_collection
from bson import ObjectId

router = APIRouter()
security = HTTPBearer()

# Pydantic models for RBAC
class Permission(BaseModel):
    id: str
    name: str
    description: str
    category: str
    resource: str
    action: str

class Role(BaseModel):
    id: str
    name: str
    description: str
    permissions: List[str]
    is_system: bool = False
    created_at: str
    updated_at: str

class UserRole(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    role_id: str
    role_name: str
    assigned_at: str

class RoleCreate(BaseModel):
    name: str
    description: str
    permissions: List[str]

class RoleUpdate(BaseModel):
    name: str
    description: str
    permissions: List[str]

class UserRoleAssignment(BaseModel):
    user_id: str
    role_id: str

class PermissionSeed(BaseModel):
    permissions: List[Dict[str, Any]]

# File paths for storing RBAC data (use persistent rbac_data directory)
ROLES_FILE = "./rbac_data/rbac_roles.json"
PERMISSIONS_FILE = "./rbac_data/rbac_permissions.json"
USER_ROLES_FILE = "./rbac_data/rbac_user_roles.json"

def load_roles() -> List[Role]:
    """Load roles from file"""
    try:
        if os.path.exists(ROLES_FILE):
            with open(ROLES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Role(**role) for role in data.get("roles", [])]
        else:
            # Return default system roles
            return get_default_roles()
    except Exception as e:
        print(f"Error loading roles: {e}")
        return get_default_roles()

def save_roles(roles: List[Role]) -> bool:
    """Save roles to file"""
    try:
        with open(ROLES_FILE, 'w', encoding='utf-8') as f:
            json.dump({"roles": [role.dict() for role in roles]}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving roles: {e}")
        return False

def load_permissions() -> List[Permission]:
    """Load permissions from file"""
    try:
        if os.path.exists(PERMISSIONS_FILE):
            with open(PERMISSIONS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Permission(**perm) for perm in data.get("permissions", [])]
        else:
            # Return default permissions
            return get_default_permissions()
    except Exception as e:
        print(f"Error loading permissions: {e}")
        return get_default_permissions()

def save_permissions(permissions: List[Permission]) -> bool:
    """Save permissions to file"""
    try:
        with open(PERMISSIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump({"permissions": [perm.dict() for perm in permissions]}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving permissions: {e}")
        return False

def load_user_roles() -> List[UserRole]:
    """Load user roles from file"""
    try:
        if os.path.exists(USER_ROLES_FILE):
            with open(USER_ROLES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [UserRole(**user_role) for user_role in data.get("user_roles", [])]
        else:
            return []
    except Exception as e:
        print(f"Error loading user roles: {e}")
        return []

def save_user_roles(user_roles: List[UserRole]) -> bool:
    """Save user roles to file"""
    try:
        with open(USER_ROLES_FILE, 'w', encoding='utf-8') as f:
            json.dump({"user_roles": [user_role.dict() for user_role in user_roles]}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving user roles: {e}")
        return False

def get_default_roles() -> List[Role]:
    """Get default system roles"""
    now = datetime.now().isoformat()
    return [
        Role(
            id="super_admin",
            name="Super Administrator",
            description="Ultimate system access with full control over all operations",
            permissions=["*"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="system_admin",
            name="System Administrator",
            description="Full system access and control",
            permissions=["*"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="medical_admin",
            name="Medical Administrator",
            description="Medical panel administration and management",
            permissions=[
                "view_panel_settings", "manage_panel_settings",
                "view_patients", "manage_patients",
                "view_screenings", "manage_screenings",
                "view_reports", "manage_reports",
                "view_medical_staff", "manage_medical_staff",
                "view_school_data", "manage_school_data"
            ],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="doctor",
            name="Doctor",
            description="Medical professional with patient care permissions",
            permissions=[
                "view_patients", "manage_patients",
                "view_screenings", "manage_screenings",
                "view_reports"
            ],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="nurse",
            name="Nurse",
            description="Nursing staff with limited patient care permissions",
            permissions=[
                "view_patients",
                "view_screenings", "manage_screenings"
            ],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="teacher",
            name="Teacher",
            description="School teacher with student data access",
            permissions=[
                "view_school_data"
            ],
            is_system=True,
            created_at=now,
            updated_at=now
        )
    ]

def get_default_permissions() -> List[Permission]:
    """Get default permissions"""
    return [
        # Panel Settings
        Permission(
            id="view_panel_settings",
            name="View Panel Settings",
            description="View panel configuration and settings",
            category="system",
            resource="panel_settings",
            action="view"
        ),
        Permission(
            id="manage_panel_settings",
            name="Manage Panel Settings",
            description="Modify panel configuration and settings",
            category="system",
            resource="panel_settings",
            action="manage"
        ),
        
        # Patient Management
        Permission(
            id="view_patients",
            name="View Patients",
            description="View patient information and records",
            category="patient",
            resource="patients",
            action="view"
        ),
        Permission(
            id="manage_patients",
            name="Manage Patients",
            description="Create, edit, and delete patient records",
            category="patient",
            resource="patients",
            action="manage"
        ),
        
        # Screening Management
        Permission(
            id="view_screenings",
            name="View Screenings",
            description="View screening sessions and results",
            category="screening",
            resource="screenings",
            action="view"
        ),
        Permission(
            id="manage_screenings",
            name="Manage Screenings",
            description="Create and manage screening sessions",
            category="screening",
            resource="screenings",
            action="manage"
        ),
        
        # Reports
        Permission(
            id="view_reports",
            name="View Reports",
            description="View medical reports and analytics",
            category="reporting",
            resource="reports",
            action="view"
        ),
        Permission(
            id="manage_reports",
            name="Manage Reports",
            description="Generate and manage medical reports",
            category="reporting",
            resource="reports",
            action="manage"
        ),
        
        # Medical Staff
        Permission(
            id="view_medical_staff",
            name="View Medical Staff",
            description="View medical staff information",
            category="medical",
            resource="medical_staff",
            action="view"
        ),
        Permission(
            id="manage_medical_staff",
            name="Manage Medical Staff",
            description="Manage medical staff assignments",
            category="medical",
            resource="medical_staff",
            action="manage"
        ),
        
        # School Data
        Permission(
            id="view_school_data",
            name="View School Data",
            description="View school and student information",
            category="school",
            resource="school_data",
            action="view"
        ),
        Permission(
            id="manage_school_data",
            name="Manage School Data",
            description="Manage school and student data",
            category="school",
            resource="school_data",
            action="manage"
        ),
        
        # Inventory
        Permission(
            id="view_inventory",
            name="View Inventory",
            description="View glasses inventory",
            category="inventory",
            resource="inventory",
            action="view"
        ),
        Permission(
            id="manage_inventory",
            name="Manage Inventory",
            description="Manage glasses inventory",
            category="inventory",
            resource="inventory",
            action="manage"
        )
    ]

# Roles endpoints
@router.get("/roles/")
async def get_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all roles"""
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view roles"
        )
    try:
        roles = load_roles()
        return {
            "success": True,
            "roles": [role.dict() for role in roles]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load roles: {str(e)}"
        )

@router.post("/roles/")
async def create_role(
    role_data: RoleCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create roles"
        )
    """Create a new role"""
    try:
        roles = load_roles()
        
        # Check if role already exists
        if any(role.name == role_data.name for role in roles):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists"
            )
        
        # Create new role
        now = datetime.now().isoformat()
        new_role = Role(
            id=f"role_{len(roles) + 1}",
            name=role_data.name,
            description=role_data.description,
            permissions=role_data.permissions,
            is_system=False,
            created_at=now,
            updated_at=now
        )
        
        roles.append(new_role)
        
        if save_roles(roles):
            return {
                "success": True,
                "message": "Role created successfully",
                "role": new_role.dict()
            }
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

@router.put("/roles/{role_id}")
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update roles"
        )
    """Update an existing role"""
    try:
        roles = load_roles()
        
        # Find role
        role_index = next((i for i, role in enumerate(roles) if role.id == role_id), None)
        if role_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        role = roles[role_index]
        
        # Check if it's a system role
        if role.is_system:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify system roles"
            )
        
        # Update role
        role.name = role_data.name
        role.description = role_data.description
        role.permissions = role_data.permissions
        role.updated_at = datetime.now().isoformat()
        
        if save_roles(roles):
            return {
                "success": True,
                "message": "Role updated successfully",
                "role": role.dict()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save role"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update role: {str(e)}"
        )

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete roles"
        )
    """Delete a role"""
    try:
        roles = load_roles()
        
        # Find role
        role_index = next((i for i, role in enumerate(roles) if role.id == role_id), None)
        if role_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        role = roles[role_index]
        
        # Check if it's a system role
        if role.is_system:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system roles"
            )
        
        # Remove role
        roles.pop(role_index)
        
        if save_roles(roles):
            return {
                "success": True,
                "message": "Role deleted successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save roles"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete role: {str(e)}"
        )

# Permissions endpoints
@router.get("/permissions/")
async def get_permissions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view permissions"
        )
    """Get all permissions"""
    try:
        permissions = load_permissions()
        return {
            "success": True,
            "permissions": [perm.dict() for perm in permissions]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load permissions: {str(e)}"
        )

@router.post("/permissions/seed")
async def seed_permissions(
    seed_data: PermissionSeed,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Seed comprehensive permission master data"""
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to seed permissions"
        )
    
    try:
        # Convert dict permissions to Permission objects
        permissions = []
        for perm_data in seed_data.permissions:
            permission = Permission(
                id=perm_data["id"],
                name=perm_data["name"],
                description=perm_data["description"],
                category=perm_data["category"],
                resource=perm_data["resource"],
                action=perm_data["action"]
            )
            permissions.append(permission)
        
        # Save to file
        if save_permissions(permissions):
            return {
                "success": True,
                "message": f"Successfully seeded {len(permissions)} permissions",
                "count": len(permissions)
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save seeded permissions"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed permissions: {str(e)}"
        )

# User roles endpoints
@router.get("/user-roles/")
async def get_user_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view user roles"
        )
    """Get all user role assignments"""
    try:
        user_roles = load_user_roles()
        return {
            "success": True,
            "user_roles": [user_role.dict() for user_role in user_roles]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load user roles: {str(e)}"
        )

async def get_real_user_info(user_id: str):
    """Get real user information from users collection"""
    try:
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user:
            first_name = user.get('first_name', '')
            last_name = user.get('last_name', '')
            full_name = f"{first_name} {last_name}".strip()
            if not full_name:
                full_name = f"User {user_id[:8]}"
                
            email = user.get('email', f'user{user_id[:8]}@evep.com')
            return full_name, email
        else:
            return f"User {user_id[:8]}", f"user{user_id[:8]}@evep.com"
            
    except Exception as e:
        print(f"Error getting user info: {e}")
        return f"User {user_id[:8]}", f"user{user_id[:8]}@evep.com"

@router.post("/user-roles/")
async def assign_user_role(
    assignment: UserRoleAssignment,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to assign user roles"
        )
    """Assign a role to a user"""
    try:
        user_roles = load_user_roles()
        roles = load_roles()
        
        # Check if role exists
        role = next((r for r in roles if r.id == assignment.role_id), None)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if assignment already exists
        existing_assignment = next(
            (ur for ur in user_roles if ur.user_id == assignment.user_id and ur.role_id == assignment.role_id),
            None
        )
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has this role"
            )
        
        # Create new assignment
        now = datetime.now().isoformat()
        
        # Get real user information from database
        user_name, user_email = await get_real_user_info(assignment.user_id)
        
        new_user_role = UserRole(
            user_id=assignment.user_id,
            user_name=user_name,
            user_email=user_email,
            role_id=assignment.role_id,
            role_name=role.name,
            assigned_at=now
        )
        
        user_roles.append(new_user_role)
        
        if save_user_roles(user_roles):
            return {
                "success": True,
                "message": "Role assigned successfully",
                "user_role": new_user_role.dict()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user role assignment"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign role: {str(e)}"
        )

@router.delete("/user-roles/{user_id}/{role_id}")
async def remove_user_role(
    user_id: str,
    role_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to remove user roles"
        )
    """Remove a role from a user"""
    try:
        user_roles = load_user_roles()
        
        # Find assignment
        assignment_index = next(
            (i for i, ur in enumerate(user_roles) if ur.user_id == user_id and ur.role_id == role_id),
            None
        )
        if assignment_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User role assignment not found"
            )
        
        # Remove assignment
        user_roles.pop(assignment_index)
        
        if save_user_roles(user_roles):
            return {
                "success": True,
                "message": "Role removed successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user roles"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove role: {str(e)}"
        )
