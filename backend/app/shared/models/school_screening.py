from typing import Optional, Dict, Any
from pydantic import Field
from enum import Enum
from datetime import datetime
from .base import BaseEntityModel

class SchoolScreeningType(str, Enum):
    """School screening type enumeration"""
    BASIC_SCHOOL = "basic_school"
    VISION_TEST = "vision_test"
    COLOR_BLINDNESS = "color_blindness"
    DEPTH_PERCEPTION = "depth_perception"

class SchoolScreeningStatus(str, Enum):
    """School screening status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class SchoolScreening(BaseEntityModel):
    """School screening model"""
    screening_id: str = Field(..., description="Unique screening identifier")
    patient_id: str = Field(..., description="Patient ID")
    conducted_by: str = Field(..., description="Teacher who conducted the screening")
    school: str = Field(..., description="School name")
    grade: str = Field(..., description="Student grade")
    screening_date: datetime = Field(..., description="Screening date and time")
    screening_type: SchoolScreeningType = Field(..., description="Type of screening")
    results: Dict[str, Any] = Field(default_factory=dict, description="Screening results")
    referral_needed: bool = Field(default=False, description="Whether referral is needed")
    referral_notes: Optional[str] = Field(None, description="Referral notes")
    status: SchoolScreeningStatus = Field(default=SchoolScreeningStatus.PENDING, description="Screening status")
    reviewed_by: Optional[str] = Field(None, description="Medical staff who reviewed")
    review_date: Optional[datetime] = Field(None, description="Review date")
    notes: Optional[str] = Field(None, description="Additional notes")

class SchoolScreeningCreate(BaseEntityModel):
    """School screening creation model"""
    screening_id: str = Field(..., description="Unique screening identifier")
    patient_id: str = Field(..., description="Patient ID")
    school: str = Field(..., description="School name")
    grade: str = Field(..., description="Student grade")
    screening_type: SchoolScreeningType = Field(..., description="Type of screening")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    notes: Optional[str] = Field(None, description="Additional notes")

class SchoolScreeningUpdate(BaseEntityModel):
    """School screening update model"""
    screening_id: Optional[str] = Field(None, description="Unique screening identifier")
    patient_id: Optional[str] = Field(None, description="Patient ID")
    school: Optional[str] = Field(None, description="School name")
    grade: Optional[str] = Field(None, description="Student grade")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    screening_type: Optional[SchoolScreeningType] = Field(None, description="Type of screening")
    results: Optional[Dict[str, Any]] = Field(None, description="Screening results")
    referral_needed: Optional[bool] = Field(None, description="Whether referral is needed")
    referral_notes: Optional[str] = Field(None, description="Referral notes")
    status: Optional[SchoolScreeningStatus] = Field(None, description="Screening status")
    reviewed_by: Optional[str] = Field(None, description="Medical staff who reviewed")
    review_date: Optional[datetime] = Field(None, description="Review date")
    notes: Optional[str] = Field(None, description="Additional notes")



