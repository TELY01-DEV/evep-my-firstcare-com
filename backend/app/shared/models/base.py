from pydantic import BaseModel as PydanticBaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class BaseModel(PydanticBaseModel):
    """Base model for all EVEP Platform models"""
    
    class Config:
        # Allow population by field name
        populate_by_name = True
        # Use enum values
        use_enum_values = True
        # Allow extra fields
        extra = "allow"
        # JSON encoders
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v)
        }

class TimestampedModel(BaseModel):
    """Base model with timestamp fields"""
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class IDModel(BaseModel):
    """Base model with ID field"""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class BaseEntityModel(TimestampedModel, IDModel):
    """Base model for all entities with ID and timestamps"""
    pass



