from typing import Optional, List
from pydantic import Field
from enum import Enum
from datetime import date
from .base import BaseEntityModel

class Gender(str, Enum):
    """Gender enumeration"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class PatientStatus(str, Enum):
    """Patient status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class Patient(BaseEntityModel):
    """Patient model"""
    patient_id: str = Field(..., description="Unique patient identifier")
    name: str = Field(..., description="Patient full name")
    date_of_birth: date = Field(..., description="Patient date of birth")
    gender: Gender = Field(..., description="Patient gender")
    contact_info: dict = Field(default_factory=dict, description="Contact information")
    medical_history: dict = Field(default_factory=dict, description="Medical history")
    status: PatientStatus = Field(default=PatientStatus.ACTIVE, description="Patient status")
    created_by: Optional[str] = Field(None, description="User who created the patient")
    assigned_doctor: Optional[str] = Field(None, description="Assigned doctor ID")
    notes: Optional[str] = Field(None, description="Additional notes")

class PatientCreate(BaseEntityModel):
    """Patient creation model"""
    patient_id: Optional[str] = Field(None, description="Unique patient identifier (auto-generated if not provided)")
    name: str = Field(..., description="Patient full name")
    date_of_birth: date = Field(..., description="Patient date of birth")
    gender: Gender = Field(..., description="Patient gender")
    contact_info: Optional[dict] = Field(default_factory=dict, description="Contact information")
    medical_history: Optional[dict] = Field(default_factory=dict, description="Medical history")
    assigned_doctor: Optional[str] = Field(None, description="Assigned doctor ID")
    notes: Optional[str] = Field(None, description="Additional notes")

class PatientUpdate(BaseEntityModel):
    """Patient update model"""
    patient_id: Optional[str] = Field(None, description="Unique patient identifier")
    name: Optional[str] = Field(None, description="Patient full name")
    date_of_birth: Optional[date] = Field(None, description="Patient date of birth")
    gender: Optional[Gender] = Field(None, description="Patient gender")
    contact_info: Optional[dict] = Field(None, description="Contact information")
    medical_history: Optional[dict] = Field(None, description="Medical history")
    status: Optional[PatientStatus] = Field(None, description="Patient status")
    assigned_doctor: Optional[str] = Field(None, description="Assigned doctor ID")
    notes: Optional[str] = Field(None, description="Additional notes")



