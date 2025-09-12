"""
Database-Based Role-Based Access Control (RBAC) for EVEP Platform
Replaces hardcoded role checks with dynamic MongoDB queries
"""

from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from functools import wraps
from bson import ObjectId

from app.core.database import get_database
from app.utils.timezone import get_current_thailand_time

async def get_user_permissions_from_db(user_id: str) -> List[str]:
    """Get all permissions for a user from MongoDB"""
    try:
        db = get_database()
        
        # First, check if user has a default role in admin_users collection
        try:
            admin_users_collection = db.evep.admin_users
            user = await admin_users_collection.find_one({"_id": ObjectId(user_id)})
            if user and user.get("role"):
                # For super_admin, return full access
                if user["role"] == "super_admin":
                    return ["*"]
                # For other roles, return basic permissions
                return ["view_patients", "view_screenings", "access_medical_portal"]
        except:
            pass
        
        # Try to get user roles from rbac_user_roles collection (if it exists)
        try:
            user_roles_collection = db.evep["rbac_user_roles"]
            user_roles = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
            
            if user_roles:
                # Get all role IDs
                role_ids = [user_role["role_id"] for user_role in user_roles]
                
                # Get roles from rbac_roles collection
                roles_collection = db.evep["rbac_roles"]
                roles = await roles_collection.find({"id": {"$in": role_ids}}).to_list(length=None)
                
                # Collect all permissions
                all_permissions = set()
                for role in roles:
                    role_permissions = role.get("permissions", [])
                    if "*" in role_permissions:
                        # If role has wildcard permission, return all permissions
                        return ["*"]
                    all_permissions.update(role_permissions)
                
                return list(all_permissions)
        except:
            pass
        
        # Default fallback - return basic permissions
        return ["view_patients", "view_screenings", "access_medical_portal"]
        
    except Exception as e:
        print(f"Error getting user permissions from database: {e}")
        # Fallback to basic permissions
        return ["view_patients", "view_screenings", "access_medical_portal"]

async def get_user_roles_from_db(user_id: str) -> List[str]:
    """Get all role IDs for a user from MongoDB"""
    try:
        db = get_database()
        
        # First, check if user has a default role in admin_users collection
        try:
            admin_users_collection = db.evep.admin_users
            user = await admin_users_collection.find_one({"_id": ObjectId(user_id)})
            if user and user.get("role"):
                return [user["role"]]
        except:
            pass
        
        # Try to get user roles from rbac_user_roles collection (if it exists)
        try:
            user_roles_collection = db.evep["rbac_user_roles"]
            user_roles = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
            
            if user_roles:
                return [user_role["role_id"] for user_role in user_roles]
        except:
            pass
        
        # Default fallback - return empty list
        return []
        
    except Exception as e:
        print(f"Error getting user roles from database: {e}")
        return []

async def has_permission_db(user_id: str, permission: str) -> bool:
    """Check if user has specific permission from database"""
    try:
        permissions = await get_user_permissions_from_db(user_id)
        
        # Check for wildcard permission
        if "*" in permissions:
            return True
        
        # Check for specific permission
        return permission in permissions
        
    except Exception as e:
        print(f"Error checking permission from database: {e}")
        return False

async def has_role_db(user_id: str, role: str) -> bool:
    """Check if user has specific role from database"""
    try:
        roles = await get_user_roles_from_db(user_id)
        return role in roles
        
    except Exception as e:
        print(f"Error checking role from database: {e}")
        return False

async def has_any_role_db(user_id: str, roles: List[str]) -> bool:
    """Check if user has any of the specified roles from database"""
    try:
        user_roles = await get_user_roles_from_db(user_id)
        return any(role in user_roles for role in roles)
        
    except Exception as e:
        print(f"Error checking roles from database: {e}")
        return False

def check_permission_db(required_permission: str):
    """Decorator to check if user has required permission from database"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs (should be injected by Depends)
            current_user = None
            for key, value in kwargs.items():
                if key == "current_user" and isinstance(value, dict):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not authenticated"
                )
            
            user_id = current_user.get("id")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User ID not found"
                )
            
            # Check permission from database
            if not await has_permission_db(user_id, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {required_permission}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def check_role_db(required_roles: List[str]):
    """Decorator to check if user has any of the required roles from database"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs (should be injected by Depends)
            current_user = None
            for key, value in kwargs.items():
                if key == "current_user" and isinstance(value, dict):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not authenticated"
                )
            
            user_id = current_user.get("id")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User ID not found"
                )
            
            # Check roles from database
            if not await has_any_role_db(user_id, required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {', '.join(required_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

async def ensure_user_has_role_in_db(user_id: str, role_id: str) -> bool:
    """Ensure user has a specific role in the database"""
    try:
        db = get_database()
        user_roles_collection = db["rbac_user_roles"]
        
        # Check if user already has this role
        existing_role = await user_roles_collection.find_one({
            "user_id": user_id,
            "role_id": role_id
        })
        
        if existing_role:
            return True
        
        # Add role to user
        user_role = {
            "user_id": user_id,
            "role_id": role_id,
            "assigned_at": get_current_thailand_time().isoformat(),
            "assigned_by": "system",
            "is_active": True
        }
        
        result = await user_roles_collection.insert_one(user_role)
        return result.inserted_id is not None
        
    except Exception as e:
        print(f"Error ensuring user has role in database: {e}")
        return False

async def remove_user_role_from_db(user_id: str, role_id: str) -> bool:
    """Remove a specific role from user in the database"""
    try:
        db = get_database()
        user_roles_collection = db["rbac_user_roles"]
        
        result = await user_roles_collection.delete_one({
            "user_id": user_id,
            "role_id": role_id
        })
        
        return result.deleted_count > 0
        
    except Exception as e:
        print(f"Error removing user role from database: {e}")
        return False

async def get_user_permissions_summary(user_id: str) -> Dict[str, Any]:
    """Get comprehensive user permissions summary from database"""
    try:
        roles = await get_user_roles_from_db(user_id)
        permissions = await get_user_permissions_from_db(user_id)
        
        return {
            "user_id": user_id,
            "roles": roles,
            "permissions": permissions,
            "has_wildcard": "*" in permissions,
            "permission_count": len(permissions),
            "role_count": len(roles)
        }
        
    except Exception as e:
        print(f"Error getting user permissions summary: {e}")
        return {
            "user_id": user_id,
            "roles": [],
            "permissions": [],
            "has_wildcard": False,
            "permission_count": 0,
            "role_count": 0,
            "error": str(e)
        }
