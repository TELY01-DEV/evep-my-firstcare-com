"""
Authentication API endpoints for EVEP Platform
Handles user registration, login, and token management
"""

from datetime import timedelta, datetime
from typing import Optional
import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import verify_token, hash_password, verify_password, generate_blockchain_hash
from app.modules.auth.services.auth_service import AuthService
from app.core.database import get_users_collection, get_admin_users_collection, get_audit_logs_collection
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security
security = HTTPBearer()

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "user"  # user, doctor, teacher, parent, admin
    organization: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class UserProfile(BaseModel):
    user_id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    organization: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Validate role
    valid_roles = ["user", "doctor", "teacher", "parent", "admin"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Generate blockchain hash for audit
    audit_hash = generate_blockchain_hash(f"user_registration:{user_data.email}")
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "organization": user_data.organization,
        "phone": user_data.phone,
        "is_active": True,
        "created_at": settings.get_current_timestamp(),
        "last_login": None,
        "audit_hash": audit_hash,
        "login_attempts": 0,
        "locked_until": None
    }
    
    # Insert user into database
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Create access token using auth service
    auth_service = AuthService()
    access_token = auth_service.create_jwt_token({
        "id": str(result.inserted_id),
        "email": user_data.email,
        "role": user_data.role
    })
    
    # Log successful registration
    await audit_logs_collection.insert_one({
        "action": "user_registration",
        "user_id": str(result.inserted_id),
        "email": user_data.email,
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": audit_hash,
        "details": {
            "role": user_data.role,
            "organization": user_data.organization
        }
    })
    
    return TokenResponse(
        access_token=access_token,
        expires_in=int(os.getenv("JWT_EXPIRATION_HOURS", "24")) * 3600,
        user={
            "user_id": str(result.inserted_id),
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role,
            "organization": user_data.organization
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """Login user and return access token"""
    
    users_collection = get_users_collection()
    admin_users_collection = get_admin_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Find user by email in both collections
    user = await users_collection.find_one({"email": login_data.email})
    user_collection = "users"
    
    if not user:
        # Check admin users collection
        user = await admin_users_collection.find_one({"email": login_data.email})
        user_collection = "admin_users"
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    
    # Check if account is locked
    if user.get("locked_until") and settings.get_utc_timestamp() < user["locked_until"]:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked due to too many failed login attempts"
        )
    
    # Verify password (handle both password_hash and password fields)
    password_field = "password_hash" if "password_hash" in user else "password"
    if not verify_password(login_data.password, user[password_field]):
        # Increment failed login attempts
        collection = users_collection if user_collection == "users" else admin_users_collection
        await collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"login_attempts": 1}}
        )
        
        # Lock account if too many failed attempts
        if user.get("login_attempts", 0) >= 4:  # 5th failed attempt
            lock_until = settings.get_utc_timestamp() + timedelta(minutes=30)
            collection = users_collection if user_collection == "users" else admin_users_collection
            await collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"locked_until": lock_until}}
            )
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account locked due to too many failed login attempts. Try again in 30 minutes."
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Reset login attempts on successful login
    collection = users_collection if user_collection == "users" else admin_users_collection
    await collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "last_login": settings.get_utc_timestamp(),
                "login_attempts": 0,
                "locked_until": None
            }
        }
    )
    
    # Create access token using auth service
    auth_service = AuthService()
    access_token = auth_service.create_jwt_token(user)
    
    # Generate audit hash
    audit_hash = generate_blockchain_hash(f"user_login:{user['email']}")
    
    # Log successful login
    await audit_logs_collection.insert_one({
        "action": "user_login",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": audit_hash,
        "details": {
            "role": user["role"],
            "login_method": "email_password"
        }
    })
    
    return TokenResponse(
        access_token=access_token,
        expires_in=int(os.getenv("JWT_EXPIRATION_HOURS", "24")) * 3600,
        user={
            "user_id": str(user["_id"]),
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
            "organization": user.get("organization")
        }
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": current_user["user_id"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfile(
        user_id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        organization=user.get("organization"),
        phone=user.get("phone"),
        is_active=user["is_active"],
        created_at=user["created_at"],
        last_login=user.get("last_login")
    )

@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token"""
    
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": current_user["user_id"]})
    
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token using auth service
    auth_service = AuthService()
    access_token = auth_service.create_jwt_token(user)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=int(os.getenv("JWT_EXPIRATION_HOURS", "24")) * 3600,
        user={
            "user_id": str(user["_id"]),
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
            "organization": user.get("organization")
        }
    )

@router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    
    audit_logs_collection = get_audit_logs_collection()
    
    # Log logout
    await audit_logs_collection.insert_one({
        "action": "user_logout",
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"user_logout:{current_user['email']}"),
        "details": {
            "role": current_user["role"]
        }
    })
    
    return {"message": "Successfully logged out"}

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Get current user data
    user = await users_collection.find_one({"_id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = hash_password(new_password)
    
    # Update password
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Log password change
    await audit_logs_collection.insert_one({
        "action": "password_change",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": datetime.utcnow().isoformat(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"password_change:{user['email']}"),
        "details": {
            "role": user["role"]
        }
    })
    
    return {"message": "Password changed successfully"}

@router.post("/reset-password-request")
async def request_password_reset(email: EmailStr):
    """Request password reset (send email)"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Check if user exists
    user = await users_collection.find_one({"email": email})
    if not user:
        # Don't reveal if user exists or not
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token (implement token generation logic)
    reset_token = generate_blockchain_hash(f"password_reset:{email}")
    
    # Store reset token with expiration
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": settings.get_utc_timestamp() + timedelta(hours=1)
            }
        }
    )
    
    # Log password reset request
    await audit_logs_collection.insert_one({
        "action": "password_reset_request",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": reset_token,
        "details": {
            "role": user["role"]
        }
    })
    
    # TODO: Send email with reset link
    # For now, just return success
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(token: str, new_password: str):
    """Reset password using token"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Find user with valid reset token
    user = await users_collection.find_one({
        "reset_token": token,
        "reset_token_expires": {"$gt": settings.get_utc_timestamp()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    new_password_hash = hash_password(new_password)
    
    # Update password and clear reset token
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password_hash": new_password_hash},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    
    # Log password reset
    await audit_logs_collection.insert_one({
        "action": "password_reset",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"password_reset_complete:{user['email']}"),
        "details": {
            "role": user["role"]
        }
    })
    
    return {"message": "Password reset successfully"}



@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Get user data - check both collections
    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        # Check admin_users collection
        admin_users_collection = get_admin_users_collection()
        user = await admin_users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    # Log profile access
    await audit_logs_collection.insert_one({
        "action": "profile_accessed",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": datetime.utcnow().isoformat(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"profile_access:{user['email']}"),
        "details": {
            "role": user.get("role", "admin"),
            "portal": "admin"
        }
    })
    
    # Return profile data
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "role": user["role"],
        "avatar": user.get("avatar"),
        "preferences": user.get("preferences", {
            "theme": "light",
            "language": "en",
            "timezone": "Asia/Bangkok",
            "notifications": {
                "email": True,
                "push": True,
                "sms": False
            },
            "privacy": {
                "profile_visible": True,
                "activity_visible": False
            }
        }),
        "created_at": user.get("created_at", ""),
        "updated_at": user.get("updated_at", "")
    }

@router.put("/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Get user data - check both collections
    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        # Check admin_users collection
        admin_users_collection = get_admin_users_collection()
        user = await admin_users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    # Prepare update data
    update_data = {}
    
    if "first_name" in profile_data:
        update_data["first_name"] = profile_data["first_name"]
    
    if "last_name" in profile_data:
        update_data["last_name"] = profile_data["last_name"]
    
    if "preferences" in profile_data:
        update_data["preferences"] = profile_data["preferences"]
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    # Update user profile
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )
    
    # Log profile update
    await audit_logs_collection.insert_one({
        "action": "profile_updated",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": datetime.utcnow().isoformat(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"profile_update:{user['email']}"),
        "details": {
            "role": user["role"],
            "portal": "admin",
            "updated_fields": list(update_data.keys())
        }
    })
    
    return {"message": "Profile updated successfully"}

@router.put("/change-password")
async def change_user_password(
    password_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Change current user's password"""
    
    users_collection = get_users_collection()
    audit_logs_collection = get_audit_logs_collection()
    
    # Get user data - check both collections
    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        # Check admin_users collection
        admin_users_collection = get_admin_users_collection()
        user = await admin_users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    # Verify current password
    if not verify_password(password_data["current_password"], user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = hash_password(password_data["new_password"])
    
    # Update password
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )
    
    # Log password change
    await audit_logs_collection.insert_one({
        "action": "password_changed",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": generate_blockchain_hash(f"password_change:{user['email']}"),
        "details": {
            "role": user["role"],
            "portal": "admin"
        }
    })
    
    return {"message": "Password changed successfully"}
