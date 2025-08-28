"""
Authentication API endpoints for EVEP Platform
Handles user registration, login, and token management
"""

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import create_access_token, verify_token, hash_password, verify_password, generate_blockchain_hash
from app.core.database import get_database

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
    
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
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
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Create access token
    token_data = {
        "user_id": str(result.inserted_id),
        "email": user_data.email,
        "role": user_data.role
    }
    access_token = create_access_token(token_data)
    
    # Log successful registration
    await db.audit_logs.insert_one({
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
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
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
    
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": login_data.email})
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
    
    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        # Increment failed login attempts
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"login_attempts": 1}}
        )
        
        # Lock account if too many failed attempts
        if user.get("login_attempts", 0) >= 4:  # 5th failed attempt
            lock_until = settings.get_utc_timestamp() + timedelta(minutes=30)
            await db.users.update_one(
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
    await db.users.update_one(
        {"_id": user["_id"]},
        {
                    "$set": {
            "last_login": settings.get_utc_timestamp(),
            "login_attempts": 0,
            "locked_until": None
        }
        }
    )
    
    # Create access token
    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(token_data)
    
    # Generate audit hash
    audit_hash = generate_blockchain_hash(f"user_login:{user['email']}")
    
    # Log successful login
    await db.audit_logs.insert_one({
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
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
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
    
    db = get_database()
    user = await db.users.find_one({"_id": current_user["user_id"]})
    
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
    
    db = get_database()
    user = await db.users.find_one({"_id": current_user["user_id"]})
    
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
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
    
    # Generate audit hash
    audit_hash = generate_blockchain_hash(f"user_logout:{current_user['email']}")
    
    # Log logout
    db = get_database()
    await db.audit_logs.insert_one({
        "action": "user_logout",
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": audit_hash,
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
    
    db = get_database()
    user = await db.users.find_one({"_id": current_user["user_id"]})
    
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
    
    # Generate audit hash
    audit_hash = generate_blockchain_hash(f"password_change:{current_user['email']}")
    
    # Update password
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Log password change
    await db.audit_logs.insert_one({
        "action": "password_change",
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "timestamp": settings.get_current_timestamp(),
        "ip_address": "127.0.0.1",  # TODO: Get from request
        "audit_hash": audit_hash,
        "details": {
            "role": current_user["role"]
        }
    })
    
    return {"message": "Password changed successfully"}
