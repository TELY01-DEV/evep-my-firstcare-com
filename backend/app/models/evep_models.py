from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, Literal, List, Any
from datetime import date, datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: Any, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class Address(BaseModel):
    house_no: Optional[str] = None
    village_no: Optional[str] = None
    soi: Optional[str] = None
    road: Optional[str] = None
    subdistrict: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str


class Parent(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: str  # Changed from date to str to handle frontend string dates
    gender: str
    phone: str
    email: Optional[str] = None
    relation: str
    occupation: Optional[str] = None
    income_level: Optional[Literal["low", "middle", "high"]] = None
    address: Address
    emergency_contact: EmergencyContact
    status: Optional[str] = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class Student(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: str  # Changed from date to str to handle frontend string dates
    gender: str
    student_code: Optional[str] = None
    school_name: str
    grade_level: str
    grade_number: Optional[str] = None
    address: Address
    disease: Optional[str] = None
    parent_id: str  # Reference to parent document
    teacher_id: Optional[str] = None  # Reference to teacher document
    consent_document: bool = False
    # Photo fields
    profile_photo: Optional[str] = None  # Base64 encoded or file path
    extra_photos: Optional[List[str]] = []  # List of additional photo paths/URLs
    photo_metadata: Optional[dict] = None  # Metadata about photos (capture date, description, etc.)
    status: Optional[str] = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class Teacher(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: str  # Changed from date to str to handle frontend string dates
    gender: str
    phone: str
    email: str
    school: str
    position: Optional[str] = None
    school_year: Optional[str] = None
    work_address: Address
    status: Optional[str] = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class School(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    school_code: str
    name: str
    type: str
    address: Address
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


# Response models for API endpoints
class ParentResponse(BaseModel):
    id: Optional[str] = None
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: datetime
    gender: str
    phone: str
    email: Optional[str]
    relation: str
    occupation: Optional[str]
    income_level: Optional[str]
    address: Address
    emergency_contact: EmergencyContact
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class StudentResponse(BaseModel):
    id: Optional[str] = None
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: datetime
    gender: str
    student_code: Optional[str]
    school_name: str
    grade_level: str
    grade_number: Optional[str]
    address: Address
    disease: Optional[str]
    parent_id: str
    parent_info: Optional[ParentResponse] = None  # Include parent info in response
    consent_document: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class TeacherResponse(BaseModel):
    id: Optional[str] = None
    title: str
    first_name: str
    last_name: str
    cid: str
    birth_date: datetime
    gender: str
    phone: str
    email: str
    school: str
    position: Optional[str]
    school_year: Optional[str]
    work_address: Address
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class SchoolResponse(BaseModel):
    id: Optional[str] = None
    school_code: str
    name: str
    type: str
    address: Address
    phone: Optional[str]
    email: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
