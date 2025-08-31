"""
Role-Based Access Control (RBAC) for EVEP Platform
Manages permissions for different user roles and portals
"""

from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from functools import wraps

# Define role permissions
ROLE_PERMISSIONS = {
    "medical_admin": {
        "portal_access": ["medical"],
        "permissions": [
            "view_patients",
            "manage_screenings", 
            "view_reports",
            "manage_glasses_inventory",
            "view_medical_staff",
            "access_medical_portal",
            "view_analytics",
            "manage_appointments",
            "manage_school_data"
        ],
        "restricted_endpoints": [
            "/api/v1/admin/",
            "/api/v1/security/",
            "/api/v1/settings/"
        ]
    },
    "system_admin": {
        "portal_access": ["medical", "admin"],
        "permissions": [
            "full_access",
            "manage_users",
            "manage_system_settings",
            "view_all_data",
            "manage_security",
            "access_admin_panel",
            "access_medical_portal",
            "view_audit_logs",
            "manage_backups"
        ],
        "restricted_endpoints": []
    },
    "medical_staff": {
        "portal_access": ["medical"],
        "permissions": [
            "view_patients",
            "manage_screenings",
            "view_reports",
            "access_medical_portal",
            "view_school_data"
        ],
        "restricted_endpoints": [
            "/api/v1/admin/",
            "/api/v1/security/",
            "/api/v1/settings/",
            "/api/v1/glasses-management/"
        ]
    }
}

def check_permission(required_permission: str):
    """Decorator to check if user has required permission"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user from request context
            request = kwargs.get('request')
            if not request:
                for arg in args:
                    if hasattr(arg, 'headers'):
                        request = arg
                        break
            
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request context not found"
                )
            
            # Get user from request state
            user = getattr(request.state, 'user', None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not authenticated"
                )
            
            # Check permission
            if not has_permission(user, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {required_permission}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def check_portal_access(required_portal: str):
    """Decorator to check if user has access to specific portal"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user from request context
            request = kwargs.get('request')
            if not request:
                for arg in args:
                    if hasattr(arg, 'headers'):
                        request = arg
                        break
            
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request context not found"
                )
            
            # Get user from request state
            user = getattr(request.state, 'user', None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not authenticated"
                )
            
            # Check portal access
            if not has_portal_access(user, required_portal):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied to {required_portal} portal"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def has_permission(user: Dict[str, Any], permission: str) -> bool:
    """Check if user has specific permission"""
    user_role = user.get('role', '')
    role_config = ROLE_PERMISSIONS.get(user_role, {})
    permissions = role_config.get('permissions', [])
    
    # System admin has all permissions
    if 'full_access' in permissions:
        return True
    
    return permission in permissions

def has_portal_access(user: Dict[str, Any], portal: str) -> bool:
    """Check if user has access to specific portal"""
    user_role = user.get('role', '')
    role_config = ROLE_PERMISSIONS.get(user_role, {})
    portal_access = role_config.get('portal_access', [])
    
    return portal in portal_access

def get_user_permissions(user: Dict[str, Any]) -> List[str]:
    """Get all permissions for a user"""
    user_role = user.get('role', '')
    role_config = ROLE_PERMISSIONS.get(user_role, {})
    return role_config.get('permissions', [])

def get_user_portal_access(user: Dict[str, Any]) -> List[str]:
    """Get all portal access for a user"""
    user_role = user.get('role', '')
    role_config = ROLE_PERMISSIONS.get(user_role, {})
    return role_config.get('portal_access', [])

def is_endpoint_restricted(user: Dict[str, Any], endpoint: str) -> bool:
    """Check if endpoint is restricted for user"""
    user_role = user.get('role', '')
    role_config = ROLE_PERMISSIONS.get(user_role, {})
    restricted_endpoints = role_config.get('restricted_endpoints', [])
    
    for restricted in restricted_endpoints:
        if endpoint.startswith(restricted):
            return True
    
    return False

def validate_user_access(user: Dict[str, Any], endpoint: str, portal: str) -> bool:
    """Validate user access for endpoint and portal"""
    # Check portal access
    if not has_portal_access(user, portal):
        return False
    
    # Check if endpoint is restricted
    if is_endpoint_restricted(user, endpoint):
        return False
    
    return True

# Middleware to add user permissions to request
async def add_user_permissions_middleware(request, call_next):
    """Middleware to add user permissions to request state"""
    # Get user from token if available
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        from app.core.security import verify_token
        user_data = verify_token(token)
        if user_data:
            # Add permissions to request state
            request.state.user = user_data
            request.state.permissions = get_user_permissions(user_data)
            request.state.portal_access = get_user_portal_access(user_data)
    
    response = await call_next(request)
    return response
