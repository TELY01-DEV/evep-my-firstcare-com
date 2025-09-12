from typing import Optional, Dict, Any
from pydantic import Field
from enum import Enum
from datetime import datetime
from .base import BaseEntityModel

class ScreeningType(str, Enum):
    """Screening type enumeration"""
    COMPREHENSIVE = "comprehensive"
    BASIC = "basic"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"

class ScreeningStatus(str, Enum):
    """Screening status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Screening(BaseEntityModel):
    """Screening model"""
    screening_id: str = Field(..., description="Unique screening identifier")
    patient_id: str = Field(..., description="Patient ID")
    conducted_by: str = Field(..., description="User who conducted the screening")
    screening_date: datetime = Field(..., description="Screening date and time")
    screening_type: ScreeningType = Field(..., description="Type of screening")
    results: Dict[str, Any] = Field(default_factory=dict, description="Screening results")
    recommendations: Optional[str] = Field(None, description="Medical recommendations")
    status: ScreeningStatus = Field(default=ScreeningStatus.PENDING, description="Screening status")
    notes: Optional[str] = Field(None, description="Additional notes")
    equipment_used: Optional[str] = Field(None, description="Equipment used for screening")
    duration_minutes: Optional[int] = Field(None, description="Screening duration in minutes")

class ScreeningCreate(BaseEntityModel):
    """Screening creation model"""
    screening_id: Optional[str] = Field(None, description="Unique screening identifier (auto-generated if not provided)")
    patient_id: str = Field(..., description="Patient ID")
    screening_type: ScreeningType = Field(..., description="Type of screening")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    conducted_by: Optional[str] = Field(None, description="User who conducted the screening")
    status: Optional[ScreeningStatus] = Field(None, description="Screening status")
    results: Optional[Dict[str, Any]] = Field(None, description="Screening results")
    notes: Optional[str] = Field(None, description="Additional notes")
    equipment_used: Optional[str] = Field(None, description="Equipment used for screening")

class ScreeningUpdate(BaseEntityModel):
    """Screening update model"""
    screening_id: Optional[str] = Field(None, description="Unique screening identifier")
    patient_id: Optional[str] = Field(None, description="Patient ID")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    screening_type: Optional[ScreeningType] = Field(None, description="Type of screening")
    results: Optional[Dict[str, Any]] = Field(None, description="Screening results")
    recommendations: Optional[str] = Field(None, description="Medical recommendations")
    status: Optional[ScreeningStatus] = Field(None, description="Screening status")
    notes: Optional[str] = Field(None, description="Additional notes")
    equipment_used: Optional[str] = Field(None, description="Equipment used for screening")
    duration_minutes: Optional[int] = Field(None, description="Screening duration in minutes")



