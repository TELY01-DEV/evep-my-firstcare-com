"""
MongoDB-based RBAC Management API
Replaces file-based storage with persistent MongoDB storage
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel
from bson import ObjectId
import asyncio
import logging
import traceback

from app.api.auth import get_current_user
from app.core.database import get_database
from app.utils.comprehensivePermissions import COMPREHENSIVE_PERMISSIONS

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Pydantic models
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
    is_system: bool
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

# MongoDB Collections
async def get_roles_collection():
    db = get_database()
    return db.evep.rbac_roles

async def get_permissions_collection():
    db = get_database()
    return db.evep.rbac_permissions

async def get_user_roles_collection():
    db = get_database()
    return db.evep.rbac_user_roles

def get_users_collection():
    """Get users collection from MongoDB"""
    db = get_database()
    return db.evep.users

# MongoDB RBAC Operations
async def load_roles_from_mongodb() -> List[Role]:
    """Load roles from MongoDB"""
    try:
        collection = await get_roles_collection()
        roles_data = await collection.find({}).to_list(length=None)
        
        roles = []
        for role_doc in roles_data:
            role_doc['id'] = str(role_doc.get('_id', role_doc.get('id', '')))
            if '_id' in role_doc:
                del role_doc['_id']
            roles.append(Role(**role_doc))
        
        # If no roles in MongoDB, create default roles
        if not roles:
            roles = await create_default_roles()
        
        return roles
    except Exception as e:
        print(f"Error loading roles from MongoDB: {e}")
        return await create_default_roles()

async def save_role_to_mongodb(role: Role) -> bool:
    """Save role to MongoDB"""
    try:
        collection = await get_roles_collection()
        role_dict = role.dict()
        
        # Use role.id as _id if it's not a MongoDB ObjectId
        if role.id and not ObjectId.is_valid(role.id):
            role_dict['_id'] = role.id
        
        await collection.replace_one(
            {'_id': role_dict.get('_id', role.id)},
            role_dict,
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error saving role to MongoDB: {e}")
        return False

async def load_permissions_from_mongodb() -> List[Permission]:
    """Load permissions from MongoDB"""
    try:
        collection = await get_permissions_collection()
        perms_data = await collection.find({}).to_list(length=None)
        
        permissions = []
        for perm_doc in perms_data:
            perm_doc['id'] = str(perm_doc.get('_id', perm_doc.get('id', '')))
            if '_id' in perm_doc:
                del perm_doc['_id']
            permissions.append(Permission(**perm_doc))
        
        # If no permissions in MongoDB, seed comprehensive permissions
        if not permissions:
            permissions = await seed_comprehensive_permissions()
        
        return permissions
    except Exception as e:
        print(f"Error loading permissions from MongoDB: {e}")
        return await seed_comprehensive_permissions()

async def save_permissions_to_mongodb(permissions: List[Permission]) -> bool:
    """Save permissions to MongoDB"""
    try:
        collection = await get_permissions_collection()
        
        # Clear existing permissions
        await collection.delete_many({})
        
        # Insert new permissions
        permissions_data = []
        for perm in permissions:
            perm_dict = perm.dict()
            perm_dict['_id'] = perm.id
            permissions_data.append(perm_dict)
        
        if permissions_data:
            await collection.insert_many(permissions_data)
        
        return True
    except Exception as e:
        print(f"Error saving permissions to MongoDB: {e}")
        return False

async def load_user_roles_from_mongodb() -> List[UserRole]:
    """Load user roles from MongoDB"""
    try:
        collection = await get_user_roles_collection()
        user_roles_data = await collection.find({}).to_list(length=None)
        
        user_roles = []
        for ur_doc in user_roles_data:
            if '_id' in ur_doc:
                del ur_doc['_id']
            user_roles.append(UserRole(**ur_doc))
        
        return user_roles
    except Exception as e:
        print(f"Error loading user roles from MongoDB: {e}")
        return []

async def save_user_role_to_mongodb(user_role: UserRole) -> bool:
    """Save user role to MongoDB"""
    try:
        collection = await get_user_roles_collection()
        user_role_dict = user_role.dict()
        
        logger.info(f"Saving user role: user_id={user_role.user_id}, role_id={user_role.role_id}")
        
        result = await collection.replace_one(
            {'user_id': user_role.user_id, 'role_id': user_role.role_id},
            user_role_dict,
            upsert=True
        )
        
        logger.info(f"User role saved successfully: matched={result.matched_count}, modified={result.modified_count}, upserted={result.upserted_id}")
        return True
    except Exception as e:
        logger.error(f"Error saving user role to MongoDB: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

async def create_default_roles() -> List[Role]:
    """Create default system roles"""
    now = datetime.now().isoformat()
    default_roles = [
        Role(
            id="super_admin",
            name="Super Administrator",
            description="Ultimate system access with full control",
            permissions=["*"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="admin",
            name="Administrator",
            description="Administrative access to system",
            permissions=["users_view", "users_create", "users_edit", "patients_view", "screenings_view"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="medical_admin",
            name="Medical Administrator",
            description="Medical staff with administrative privileges",
            permissions=["patients_view", "patients_create", "patients_edit", "screenings_view", "screenings_create", "screenings_manage"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="doctor",
            name="Doctor",
            description="Medical doctor with full patient access",
            permissions=["patients_view", "patients_create", "patients_edit", "screenings_view", "screenings_create", "screening_form_diagnosis"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="nurse",
            name="Nurse",
            description="Nursing staff with patient care access",
            permissions=["patients_view", "patients_create", "screenings_view", "screenings_create", "screening_form_standard", "screening_form_mobile"],
            is_system=True,
            created_at=now,
            updated_at=now
        ),
        Role(
            id="teacher",
            name="Teacher",
            description="School teacher with basic screening access",
            permissions=["patients_view", "screenings_view", "screening_form_mobile", "submenu_students"],
            is_system=True,
            created_at=now,
            updated_at=now
        )
    ]
    
    # Save to MongoDB
    for role in default_roles:
        await save_role_to_mongodb(role)
    
    return default_roles

async def seed_comprehensive_permissions() -> List[Permission]:
    """Seed comprehensive permissions from master data"""
    try:
        permissions = []
        for perm_data in COMPREHENSIVE_PERMISSIONS:
            permission = Permission(**perm_data)
            permissions.append(permission)
        
        # Save to MongoDB
        await save_permissions_to_mongodb(permissions)
        
        return permissions
    except Exception as e:
        print(f"Error seeding comprehensive permissions: {e}")
        return []

# API Endpoints
@router.get("/roles/")
async def get_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all roles from MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view roles"
        )
    
    try:
        roles = await load_roles_from_mongodb()
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
    """Create a new role in MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create roles"
        )
    
    try:
        roles = await load_roles_from_mongodb()
        
        # Check if role already exists
        if any(role.name == role_data.name for role in roles):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists"
            )
        
        # Create new role
        now = datetime.now().isoformat()
        new_role = Role(
            id=f"role_{len(roles) + 1}_{int(datetime.now().timestamp())}",
            name=role_data.name,
            description=role_data.description,
            permissions=role_data.permissions,
            is_system=False,
            created_at=now,
            updated_at=now
        )
        
        # Save to MongoDB
        if await save_role_to_mongodb(new_role):
            return {
                "success": True,
                "message": "Role created successfully",
                "role": new_role.dict()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save role to MongoDB"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create role: {str(e)}"
        )

@router.get("/permissions/")
async def get_permissions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all permissions from MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view permissions"
        )
    
    try:
        permissions = await load_permissions_from_mongodb()
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
    """Seed comprehensive permissions to MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to seed permissions"
        )
    
    try:
        permissions = []
        for perm_data in seed_data.permissions:
            permission = Permission(**perm_data)
            permissions.append(permission)
        
        # Save to MongoDB
        if await save_permissions_to_mongodb(permissions):
            return {
                "success": True,
                "message": f"Successfully seeded {len(permissions)} permissions to MongoDB",
                "count": len(permissions)
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save seeded permissions to MongoDB"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed permissions: {str(e)}"
        )

@router.get("/user-roles/")
async def get_user_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all user role assignments from MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view user roles"
        )
    
    try:
        user_roles = await load_user_roles_from_mongodb()
        return {
            "success": True,
            "user_roles": [ur.dict() for ur in user_roles]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load user roles: {str(e)}"
        )

@router.post("/user-roles/")
async def assign_user_role(
    assignment: UserRoleAssignment,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Assign a role to a user in MongoDB"""
    if current_user["role"] not in ["admin", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to assign user roles"
        )
    
    try:
        logger.info(f"Assign user role request: user_id={assignment.user_id}, role_id={assignment.role_id}")
        
        # Validate ObjectId format
        try:
            ObjectId(assignment.user_id)
        except Exception as e:
            logger.error(f"Invalid user_id format: {assignment.user_id}, error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user_id format: {str(e)}"
            )
        
        user_roles = await load_user_roles_from_mongodb()
        roles = await load_roles_from_mongodb()
        
        # Check if role exists
        role = next((r for r in roles if r.id == assignment.role_id), None)
        if not role:
            logger.warning(f"Role not found: {assignment.role_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Get real user info from users collection
        users_collection = get_users_collection()
        user_doc = await users_collection.find_one({"_id": ObjectId(assignment.user_id)})
        
        if user_doc:
            user_name = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".strip()
            user_email = user_doc.get('email', 'unknown@example.com')
        else:
            user_name = f"User {assignment.user_id}"
            user_email = f"user{assignment.user_id}@example.com"
        
        # Check if assignment already exists
        existing_assignment = next(
            (ur for ur in user_roles if ur.user_id == assignment.user_id and ur.role_id == assignment.role_id),
            None
        )
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has this role assigned"
            )
        
        # Create new user role assignment
        now = datetime.now().isoformat()
        new_user_role = UserRole(
            user_id=assignment.user_id,
            user_name=user_name,
            user_email=user_email,
            role_id=assignment.role_id,
            role_name=role.name,
            assigned_at=now
        )
        
        # Save to MongoDB
        if await save_user_role_to_mongodb(new_user_role):
            return {
                "success": True,
                "message": "User role assigned successfully",
                "user_role": new_user_role.dict()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user role to MongoDB"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign role: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign role: {str(e)}"
        )
