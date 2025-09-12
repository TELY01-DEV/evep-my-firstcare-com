"""
Medical Staff Management API for EVEP Platform

This module provides comprehensive API endpoints for medical staff management,
including registration, credentials, training, and role management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr

from app.api.auth import get_current_user

# Pydantic Models for Medical Staff Management
class MedicalStaffCreate(BaseModel):
    staff_id: str = Field(..., description="Unique staff identifier")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(..., description="Phone number")
    role: str = Field(..., description="Medical role (doctor, nurse, optometrist, etc.)")
    specialization: str = Field(..., description="Medical specialization")
    license_number: str = Field(..., description="Medical license number")
    hire_date: datetime = Field(..., description="Date of hire")
    department: Optional[str] = Field(None, description="Department")
    supervisor_id: Optional[str] = Field(None, description="Supervisor ID")

class MedicalStaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    department: Optional[str] = None
    supervisor_id: Optional[str] = None
    status: Optional[str] = None

class MedicalStaff(BaseModel):
    medical_staff_id: str
    staff_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str
    specialization: str
    license_number: str
    hire_date: datetime
    department: Optional[str] = None
    supervisor_id: Optional[str] = None
    status: str = "active"
    created_at: datetime
    updated_at: datetime

class StaffCredentialCreate(BaseModel):
    medical_staff_id: str = Field(..., description="Medical staff ID")
    credential_type: str = Field(..., description="Type of credential")
    credential_number: str = Field(..., description="Credential number")
    issuing_authority: str = Field(..., description="Issuing authority")
    issue_date: datetime = Field(..., description="Issue date")
    expiry_date: datetime = Field(..., description="Expiry date")
    document_url: Optional[str] = Field(None, description="Document URL")

class StaffCredential(BaseModel):
    credential_id: str
    medical_staff_id: str
    credential_type: str
    credential_number: str
    issuing_authority: str
    issue_date: datetime
    expiry_date: datetime
    status: str
    document_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class StaffTrainingCreate(BaseModel):
    medical_staff_id: str = Field(..., description="Medical staff ID")
    training_name: str = Field(..., description="Training name")
    training_type: str = Field(..., description="Training type")
    training_provider: str = Field(..., description="Training provider")
    training_date: datetime = Field(..., description="Training date")
    expiry_date: Optional[datetime] = Field(None, description="Expiry date")
    certificate_number: str = Field(..., description="Certificate number")
    notes: Optional[str] = Field(None, description="Additional notes")

class StaffTraining(BaseModel):
    training_id: str
    medical_staff_id: str
    training_name: str
    training_type: str
    training_provider: str
    training_date: datetime
    expiry_date: Optional[datetime] = None
    certificate_number: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class MedicalStaffResponse(BaseModel):
    medical_staff_id: str
    staff_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str
    specialization: str
    license_number: str
    hire_date: datetime
    department: Optional[str] = None
    supervisor_id: Optional[str] = None
    status: str
    credentials: List[StaffCredential] = []
    training: List[StaffTraining] = []
    created_at: datetime
    updated_at: datetime

router = APIRouter(prefix="/medical-staff", tags=["Medical Staff Management"])

# Mock database collections (in production, these would be MongoDB collections)
medical_staff_collection = []
staff_credentials_collection = []
staff_training_collection = []

def generate_id(prefix: str) -> str:
    """Generate a unique ID with prefix"""
    return f"{prefix}{str(uuid.uuid4())[:8].upper()}"

# Medical Staff Management Endpoints
@router.post("/", response_model=Dict[str, Any])
async def create_medical_staff(
    staff_data: MedicalStaffCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new medical staff member
    
    This endpoint allows authorized users to register new medical staff members.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create medical staff"
            )
        
        # Check if staff_id already exists
        existing_staff = next(
            (staff for staff in medical_staff_collection if staff["staff_id"] == staff_data.staff_id),
            None
        )
        if existing_staff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff ID already exists"
            )
        
        # Create medical staff record
        medical_staff_record = {
            "medical_staff_id": generate_id("MS"),
            "staff_id": staff_data.staff_id,
            "first_name": staff_data.first_name,
            "last_name": staff_data.last_name,
            "email": staff_data.email,
            "phone": staff_data.phone,
            "role": staff_data.role,
            "specialization": staff_data.specialization,
            "license_number": staff_data.license_number,
            "hire_date": staff_data.hire_date,
            "department": staff_data.department,
            "supervisor_id": staff_data.supervisor_id,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        medical_staff_collection.append(medical_staff_record)
        
        return {
            "message": "Medical staff created successfully",
            "medical_staff_id": medical_staff_record["medical_staff_id"],
            "staff_data": medical_staff_record
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating medical staff: {str(e)}"
        )

@router.get("/", response_model=List[MedicalStaffResponse])
async def get_medical_staff(
    role: Optional[str] = Query(None, description="Filter by role"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all medical staff members with optional filtering
    
    This endpoint retrieves medical staff information with filtering options.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager", "doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view medical staff"
            )
        
        # Filter medical staff
        filtered_staff = medical_staff_collection
        
        if role:
            filtered_staff = [staff for staff in filtered_staff if staff["role"] == role]
        
        if department:
            filtered_staff = [staff for staff in filtered_staff if staff["department"] == department]
        
        if status:
            filtered_staff = [staff for staff in filtered_staff if staff["status"] == status]
        
        # Add credentials and training to each staff member
        staff_with_details = []
        for staff in filtered_staff:
            staff_credentials = [
                cred for cred in staff_credentials_collection 
                if cred["medical_staff_id"] == staff["medical_staff_id"]
            ]
            staff_training = [
                train for train in staff_training_collection 
                if train["medical_staff_id"] == staff["medical_staff_id"]
            ]
            
            staff_with_details.append({
                **staff,
                "credentials": staff_credentials,
                "training": staff_training
            })
        
        return staff_with_details
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving medical staff: {str(e)}"
        )

@router.get("/{medical_staff_id}", response_model=MedicalStaffResponse)
async def get_medical_staff_by_id(
    medical_staff_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get medical staff member by ID
    
    This endpoint retrieves detailed information about a specific medical staff member.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager", "doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view medical staff"
            )
        
        # Find medical staff member
        staff_member = next(
            (staff for staff in medical_staff_collection if staff["medical_staff_id"] == medical_staff_id),
            None
        )
        
        if not staff_member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff member not found"
            )
        
        # Get credentials and training
        staff_credentials = [
            cred for cred in staff_credentials_collection 
            if cred["medical_staff_id"] == medical_staff_id
        ]
        staff_training = [
            train for train in staff_training_collection 
            if train["medical_staff_id"] == medical_staff_id
        ]
        
        return {
            **staff_member,
            "credentials": staff_credentials,
            "training": staff_training
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving medical staff: {str(e)}"
        )

@router.put("/{medical_staff_id}", response_model=Dict[str, Any])
async def update_medical_staff(
    medical_staff_id: str,
    staff_data: MedicalStaffUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update medical staff member information
    
    This endpoint allows authorized users to update medical staff information.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update medical staff"
            )
        
        # Find medical staff member
        staff_index = next(
            (i for i, staff in enumerate(medical_staff_collection) if staff["medical_staff_id"] == medical_staff_id),
            None
        )
        
        if staff_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff member not found"
            )
        
        # Update staff information
        update_data = staff_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        medical_staff_collection[staff_index].update(update_data)
        
        return {
            "message": "Medical staff updated successfully",
            "medical_staff_id": medical_staff_id,
            "updated_data": update_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating medical staff: {str(e)}"
        )

# Staff Credentials Management Endpoints
@router.post("/{medical_staff_id}/credentials", response_model=Dict[str, Any])
async def add_staff_credential(
    medical_staff_id: str,
    credential_data: StaffCredentialCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add credential to medical staff member
    
    This endpoint allows adding professional credentials to medical staff members.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to add credentials"
            )
        
        # Verify medical staff exists
        staff_exists = any(
            staff["medical_staff_id"] == medical_staff_id 
            for staff in medical_staff_collection
        )
        if not staff_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff member not found"
            )
        
        # Create credential record
        credential_record = {
            "credential_id": generate_id("CRED"),
            "medical_staff_id": medical_staff_id,
            "credential_type": credential_data.credential_type,
            "credential_number": credential_data.credential_number,
            "issuing_authority": credential_data.issuing_authority,
            "issue_date": credential_data.issue_date,
            "expiry_date": credential_data.expiry_date,
            "status": "active" if credential_data.expiry_date > datetime.utcnow() else "expired",
            "document_url": credential_data.document_url,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        staff_credentials_collection.append(credential_record)
        
        return {
            "message": "Credential added successfully",
            "credential_id": credential_record["credential_id"],
            "credential_data": credential_record
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding credential: {str(e)}"
        )

@router.get("/{medical_staff_id}/credentials", response_model=List[StaffCredential])
async def get_staff_credentials(
    medical_staff_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get credentials for a medical staff member
    
    This endpoint retrieves all credentials for a specific medical staff member.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager", "doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view credentials"
            )
        
        # Get credentials for the staff member
        credentials = [
            cred for cred in staff_credentials_collection 
            if cred["medical_staff_id"] == medical_staff_id
        ]
        
        return credentials
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving credentials: {str(e)}"
        )

# Staff Training Management Endpoints
@router.post("/{medical_staff_id}/training", response_model=Dict[str, Any])
async def add_staff_training(
    medical_staff_id: str,
    training_data: StaffTrainingCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add training record to medical staff member
    
    This endpoint allows adding training records to medical staff members.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to add training records"
            )
        
        # Verify medical staff exists
        staff_exists = any(
            staff["medical_staff_id"] == medical_staff_id 
            for staff in medical_staff_collection
        )
        if not staff_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff member not found"
            )
        
        # Create training record
        training_record = {
            "training_id": generate_id("TRAIN"),
            "medical_staff_id": medical_staff_id,
            "training_name": training_data.training_name,
            "training_type": training_data.training_type,
            "training_provider": training_data.training_provider,
            "training_date": training_data.training_date,
            "expiry_date": training_data.expiry_date,
            "certificate_number": training_data.certificate_number,
            "status": "active" if not training_data.expiry_date or training_data.expiry_date > datetime.utcnow() else "expired",
            "notes": training_data.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        staff_training_collection.append(training_record)
        
        return {
            "message": "Training record added successfully",
            "training_id": training_record["training_id"],
            "training_data": training_record
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding training record: {str(e)}"
        )

@router.get("/{medical_staff_id}/training", response_model=List[StaffTraining])
async def get_staff_training(
    medical_staff_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get training records for a medical staff member
    
    This endpoint retrieves all training records for a specific medical staff member.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager", "doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view training records"
            )
        
        # Get training records for the staff member
        training_records = [
            train for train in staff_training_collection 
            if train["medical_staff_id"] == medical_staff_id
        ]
        
        return training_records
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving training records: {str(e)}"
        )

# Analytics and Reporting Endpoints
@router.get("/analytics/overview", response_model=Dict[str, Any])
async def get_medical_staff_analytics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get medical staff analytics overview
    
    This endpoint provides analytics and statistics about medical staff.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "supervisor", "hr_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view analytics"
            )
        
        # Calculate analytics
        total_staff = len(medical_staff_collection)
        active_staff = len([staff for staff in medical_staff_collection if staff["status"] == "active"])
        
        # Role distribution
        role_distribution = {}
        for staff in medical_staff_collection:
            role = staff["role"]
            role_distribution[role] = role_distribution.get(role, 0) + 1
        
        # Department distribution
        department_distribution = {}
        for staff in medical_staff_collection:
            dept = staff.get("department", "Unassigned")
            department_distribution[dept] = department_distribution.get(dept, 0) + 1
        
        # Credential statistics
        total_credentials = len(staff_credentials_collection)
        expired_credentials = len([
            cred for cred in staff_credentials_collection 
            if cred["status"] == "expired"
        ])
        
        # Training statistics
        total_training = len(staff_training_collection)
        expired_training = len([
            train for train in staff_training_collection 
            if train["status"] == "expired"
        ])
        
        return {
            "total_staff": total_staff,
            "active_staff": active_staff,
            "inactive_staff": total_staff - active_staff,
            "role_distribution": role_distribution,
            "department_distribution": department_distribution,
            "total_credentials": total_credentials,
            "expired_credentials": expired_credentials,
            "total_training": total_training,
            "expired_training": expired_training,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )
