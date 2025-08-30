from typing import Optional, List
from pydantic import Field, EmailStr
from enum import Enum
from .base import BaseEntityModel

class UserRole(str, Enum):
    """User roles enumeration"""
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    MEDICAL_STAFF = "medical_staff"
    EXCLUSIVE_HOSPITAL = "exclusive_hospital"
    TEACHER = "teacher"
    PARENT = "parent"
    GENERAL_USER = "general_user"

class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class User(BaseEntityModel):
    """User model"""
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: UserRole = Field(..., description="User role")
    status: UserStatus = Field(default=UserStatus.ACTIVE, description="User status")
    password_hash: Optional[str] = Field(None, description="Hashed password")
    last_login: Optional[str] = Field(None, description="Last login timestamp")
    profile: Optional[dict] = Field(default_factory=dict, description="User profile data")
    permissions: Optional[List[str]] = Field(default_factory=list, description="User permissions")

class UserCreate(BaseEntityModel):
    """User creation model"""
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: UserRole = Field(..., description="User role")
    password: str = Field(..., description="User password")
    profile: Optional[dict] = Field(default_factory=dict, description="User profile data")
    permissions: Optional[List[str]] = Field(default_factory=list, description="User permissions")

class UserUpdate(BaseEntityModel):
    """User update model"""
    email: Optional[EmailStr] = Field(None, description="User email address")
    name: Optional[str] = Field(None, description="User full name")
    role: Optional[UserRole] = Field(None, description="User role")
    status: Optional[UserStatus] = Field(None, description="User status")
    password: Optional[str] = Field(None, description="User password")
    profile: Optional[dict] = Field(None, description="User profile data")
    permissions: Optional[List[str]] = Field(None, description="User permissions")



