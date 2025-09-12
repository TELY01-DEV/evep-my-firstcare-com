"""
Specialized Screening API endpoints for EVEP Platform
Handles Color Vision, Depth Perception, and Comprehensive screenings
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from bson import ObjectId

from app.core.config import settings
from app.core.security import verify_token, generate_blockchain_hash
from app.core.database import get_database
from app.core.db_rbac import has_permission_db, has_role_db, has_any_role_db, get_user_permissions_from_db
from app.utils.timezone import get_current_thailand_time, format_datetime_for_frontend

router = APIRouter(prefix="/specialized-screenings", tags=["Specialized Screenings"])

# Security
security = HTTPBearer()

# Models
class ColorVisionScreeningCreate(BaseModel):
    patient_id: str
    examiner_id: str
    test_method: str = Field(..., description="Test method (e.g., 'ishihara', 'farnsworth')")
    equipment_used: Optional[str] = None
    notes: Optional[str] = None

class ColorVisionResult(BaseModel):
    test_type: str
    result: str = Field(..., description="Result: 'normal', 'deficient', 'failed'")
    score: Optional[int] = None
    notes: Optional[str] = None

class ColorVisionScreeningUpdate(BaseModel):
    results: Optional[List[ColorVisionResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str = Field(..., description="Status: 'in_progress', 'completed', 'cancelled'")
    notes: Optional[str] = None

class ColorVisionScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    examiner_id: str
    test_method: str
    equipment_used: Optional[str] = None
    results: Optional[List[ColorVisionResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class DepthPerceptionScreeningCreate(BaseModel):
    patient_id: str
    examiner_id: str
    test_method: str = Field(..., description="Test method (e.g., 'stereo_test', 'randot')")
    equipment_used: Optional[str] = None
    notes: Optional[str] = None

class DepthPerceptionResult(BaseModel):
    test_type: str
    result: str = Field(..., description="Result: 'normal', 'impaired', 'failed'")
    score: Optional[float] = None
    notes: Optional[str] = None

class DepthPerceptionScreeningUpdate(BaseModel):
    results: Optional[List[DepthPerceptionResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str = Field(..., description="Status: 'in_progress', 'completed', 'cancelled'")
    notes: Optional[str] = None

class DepthPerceptionScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    examiner_id: str
    test_method: str
    equipment_used: Optional[str] = None
    results: Optional[List[DepthPerceptionResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class ComprehensiveScreeningCreate(BaseModel):
    patient_id: str
    examiner_id: str
    screening_type: str = Field(..., description="Type: 'comprehensive', 'full_exam'")
    equipment_used: Optional[str] = None
    notes: Optional[str] = None

class ComprehensiveResult(BaseModel):
    test_type: str
    result: str
    score: Optional[str] = None
    notes: Optional[str] = None

class ComprehensiveScreeningUpdate(BaseModel):
    results: Optional[List[ComprehensiveResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str = Field(..., description="Status: 'in_progress', 'completed', 'cancelled'")
    notes: Optional[str] = None

class ComprehensiveScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    examiner_id: str
    screening_type: str
    equipment_used: Optional[str] = None
    results: Optional[List[ComprehensiveResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

# Import the same authentication function used by other endpoints
from app.api.auth import get_current_user

# Color Vision Screening Endpoints
@router.get("/color-vision", response_model=List[ColorVisionScreeningResponse])
async def get_color_vision_screenings(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    examiner_id: Optional[str] = Query(None, description="Filter by examiner ID"),
    test_method: Optional[str] = Query(None, description="Filter by test method"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get color vision screening sessions with optional filtering"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read color vision screenings"
        )
    
    # Build filter query
    filter_query = {}
    if patient_id:
        filter_query["patient_id"] = ObjectId(patient_id)
    if examiner_id:
        filter_query["examiner_id"] = ObjectId(examiner_id)
    if test_method:
        filter_query["test_method"] = test_method
    
    # Get screenings from database
    cursor = db.evep.color_vision_screenings.find(filter_query).skip(skip).limit(limit)
    screenings = await cursor.to_list(length=limit)
    
    # Convert to response format
    result = []
    for screening in screenings:
        screening["screening_id"] = str(screening["_id"])
        screening["patient_id"] = str(screening["patient_id"])
        screening["examiner_id"] = str(screening["examiner_id"])
        screening["created_at"] = screening.get("created_at", "").isoformat() if screening.get("created_at") else ""
        screening["updated_at"] = screening.get("updated_at", "").isoformat() if screening.get("updated_at") else ""
        result.append(ColorVisionScreeningResponse(**screening))
    
    return result

@router.post("/color-vision", response_model=ColorVisionScreeningResponse)
async def create_color_vision_screening(
    screening_data: ColorVisionScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new color vision screening session"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create color vision screenings"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(screening_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Create color vision screening document
    screening_doc = {
        "patient_id": ObjectId(screening_data.patient_id),
        "examiner_id": ObjectId(screening_data.examiner_id),
        "test_method": screening_data.test_method,
        "equipment_used": screening_data.equipment_used,
        "notes": screening_data.notes,
        "status": "in_progress",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.color_vision_screenings.insert_one(screening_doc)
    
    return ColorVisionScreeningResponse(
        screening_id=str(result.inserted_id),
        patient_id=screening_data.patient_id,
        examiner_id=screening_data.examiner_id,
        test_method=screening_data.test_method,
        equipment_used=screening_data.equipment_used,
        notes=screening_data.notes,
        status="in_progress",
        created_at=screening_doc["created_at"].isoformat(),
        updated_at=screening_doc["updated_at"].isoformat()
    )

@router.put("/color-vision/{screening_id}", response_model=ColorVisionScreeningResponse)
async def update_color_vision_screening(
    screening_id: str,
    update_data: ColorVisionScreeningUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a color vision screening with results"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update color vision screenings"
        )
    
    # Find and update screening
    update_doc = update_data.dict(exclude_unset=True)
    update_doc["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.color_vision_screenings.update_one(
        {"_id": ObjectId(screening_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Color vision screening not found"
        )
    
    # Get updated screening
    screening = await db.evep.color_vision_screenings.find_one({"_id": ObjectId(screening_id)})
    
    return ColorVisionScreeningResponse(
        screening_id=str(screening["_id"]),
        patient_id=str(screening["patient_id"]),
        examiner_id=str(screening["examiner_id"]),
        test_method=screening["test_method"],
        equipment_used=screening.get("equipment_used"),
        results=screening.get("results"),
        conclusion=screening.get("conclusion"),
        recommendations=screening.get("recommendations"),
        status=screening["status"],
        notes=screening.get("notes"),
        created_at=screening["created_at"].isoformat(),
        updated_at=screening["updated_at"].isoformat()
    )

@router.delete("/color-vision/{screening_id}")
async def delete_color_vision_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a color vision screening"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete color vision screenings"
        )
    
    # Delete screening
    result = await db.evep.color_vision_screenings.delete_one({"_id": ObjectId(screening_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Color vision screening not found"
        )
    
    return {"message": "Color vision screening deleted successfully"}

# Depth Perception Screening Endpoints
@router.get("/depth-perception", response_model=List[DepthPerceptionScreeningResponse])
async def get_depth_perception_screenings(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    examiner_id: Optional[str] = Query(None, description="Filter by examiner ID"),
    test_method: Optional[str] = Query(None, description="Filter by test method"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get depth perception screening sessions with optional filtering"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read depth perception screenings"
        )
    
    # Build filter query
    filter_query = {}
    if patient_id:
        filter_query["patient_id"] = ObjectId(patient_id)
    if examiner_id:
        filter_query["examiner_id"] = ObjectId(examiner_id)
    if test_method:
        filter_query["test_method"] = test_method
    
    # Get screenings from database
    cursor = db.evep.depth_perception_screenings.find(filter_query).skip(skip).limit(limit)
    screenings = await cursor.to_list(length=limit)
    
    # Convert to response format
    result = []
    for screening in screenings:
        screening["screening_id"] = str(screening["_id"])
        screening["patient_id"] = str(screening["patient_id"])
        screening["examiner_id"] = str(screening["examiner_id"])
        screening["created_at"] = screening.get("created_at", "").isoformat() if screening.get("created_at") else ""
        screening["updated_at"] = screening.get("updated_at", "").isoformat() if screening.get("updated_at") else ""
        result.append(DepthPerceptionScreeningResponse(**screening))
    
    return result

@router.post("/depth-perception", response_model=DepthPerceptionScreeningResponse)
async def create_depth_perception_screening(
    screening_data: DepthPerceptionScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new depth perception screening session"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create depth perception screenings"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(screening_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Create depth perception screening document
    screening_doc = {
        "patient_id": ObjectId(screening_data.patient_id),
        "examiner_id": ObjectId(screening_data.examiner_id),
        "test_method": screening_data.test_method,
        "equipment_used": screening_data.equipment_used,
        "notes": screening_data.notes,
        "status": "in_progress",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.depth_perception_screenings.insert_one(screening_doc)
    
    return DepthPerceptionScreeningResponse(
        screening_id=str(result.inserted_id),
        patient_id=screening_data.patient_id,
        examiner_id=screening_data.examiner_id,
        test_method=screening_data.test_method,
        equipment_used=screening_data.equipment_used,
        notes=screening_data.notes,
        status="in_progress",
        created_at=screening_doc["created_at"].isoformat(),
        updated_at=screening_doc["updated_at"].isoformat()
    )

@router.put("/depth-perception/{screening_id}", response_model=DepthPerceptionScreeningResponse)
async def update_depth_perception_screening(
    screening_id: str,
    update_data: DepthPerceptionScreeningUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a depth perception screening with results"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update depth perception screenings"
        )
    
    # Find and update screening
    update_doc = update_data.dict(exclude_unset=True)
    update_doc["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.depth_perception_screenings.update_one(
        {"_id": ObjectId(screening_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Depth perception screening not found"
        )
    
    # Get updated screening
    screening = await db.evep.depth_perception_screenings.find_one({"_id": ObjectId(screening_id)})
    
    return DepthPerceptionScreeningResponse(
        screening_id=str(screening["_id"]),
        patient_id=str(screening["patient_id"]),
        examiner_id=str(screening["examiner_id"]),
        test_method=screening["test_method"],
        equipment_used=screening.get("equipment_used"),
        results=screening.get("results"),
        conclusion=screening.get("conclusion"),
        recommendations=screening.get("recommendations"),
        status=screening["status"],
        notes=screening.get("notes"),
        created_at=screening["created_at"].isoformat(),
        updated_at=screening["updated_at"].isoformat()
    )

@router.delete("/depth-perception/{screening_id}")
async def delete_depth_perception_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a depth perception screening"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete depth perception screenings"
        )
    
    # Delete screening
    result = await db.evep.depth_perception_screenings.delete_one({"_id": ObjectId(screening_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Depth perception screening not found"
        )
    
    return {"message": "Depth perception screening deleted successfully"}

# Comprehensive Screening Endpoints
@router.get("/comprehensive", response_model=List[ComprehensiveScreeningResponse])
async def get_comprehensive_screenings(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    examiner_id: Optional[str] = Query(None, description="Filter by examiner ID"),
    screening_type: Optional[str] = Query(None, description="Filter by screening type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive screening sessions with optional filtering"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read comprehensive screenings"
        )
    
    # Build filter query
    filter_query = {}
    if patient_id:
        filter_query["patient_id"] = ObjectId(patient_id)
    if examiner_id:
        filter_query["examiner_id"] = ObjectId(examiner_id)
    if screening_type:
        filter_query["screening_type"] = screening_type
    
    # Get screenings from database
    cursor = db.evep.comprehensive_screenings.find(filter_query).skip(skip).limit(limit)
    screenings = await cursor.to_list(length=limit)
    
    # Convert to response format
    result = []
    for screening in screenings:
        screening["screening_id"] = str(screening["_id"])
        screening["patient_id"] = str(screening["patient_id"])
        screening["examiner_id"] = str(screening["examiner_id"])
        screening["created_at"] = screening.get("created_at", "").isoformat() if screening.get("created_at") else ""
        screening["updated_at"] = screening.get("updated_at", "").isoformat() if screening.get("updated_at") else ""
        result.append(ComprehensiveScreeningResponse(**screening))
    
    return result

@router.post("/comprehensive", response_model=ComprehensiveScreeningResponse)
async def create_comprehensive_screening(
    screening_data: ComprehensiveScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new comprehensive screening session"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database
    if not await has_permission_db(user_id, "screenings_create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create comprehensive screenings"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(screening_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Create comprehensive screening document
    screening_doc = {
        "patient_id": ObjectId(screening_data.patient_id),
        "examiner_id": ObjectId(screening_data.examiner_id),
        "screening_type": screening_data.screening_type,
        "equipment_used": screening_data.equipment_used,
        "notes": screening_data.notes,
        "status": "in_progress",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.comprehensive_screenings.insert_one(screening_doc)
    
    return ComprehensiveScreeningResponse(
        screening_id=str(result.inserted_id),
        patient_id=screening_data.patient_id,
        examiner_id=screening_data.examiner_id,
        screening_type=screening_data.screening_type,
        equipment_used=screening_data.equipment_used,
        notes=screening_data.notes,
        status="in_progress",
        created_at=screening_doc["created_at"].isoformat(),
        updated_at=screening_doc["updated_at"].isoformat()
    )

@router.put("/comprehensive/{screening_id}", response_model=ComprehensiveScreeningResponse)
async def update_comprehensive_screening(
    screening_id: str,
    update_data: ComprehensiveScreeningUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a comprehensive screening with results"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update comprehensive screenings"
        )
    
    # Find and update screening
    update_doc = update_data.dict(exclude_unset=True)
    update_doc["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.comprehensive_screenings.update_one(
        {"_id": ObjectId(screening_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprehensive screening not found"
        )
    
    # Get updated screening
    screening = await db.evep.comprehensive_screenings.find_one({"_id": ObjectId(screening_id)})
    
    return ComprehensiveScreeningResponse(
        screening_id=str(screening["_id"]),
        patient_id=str(screening["patient_id"]),
        examiner_id=str(screening["examiner_id"]),
        screening_type=screening["screening_type"],
        equipment_used=screening.get("equipment_used"),
        results=screening.get("results"),
        conclusion=screening.get("conclusion"),
        recommendations=screening.get("recommendations"),
        status=screening["status"],
        notes=screening.get("notes"),
        created_at=screening["created_at"].isoformat(),
        updated_at=screening["updated_at"].isoformat()
    )

@router.delete("/comprehensive/{screening_id}")
async def delete_comprehensive_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comprehensive screening"""
    db = get_database()
    
    # Check permissions
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    if not await has_permission_db(user_id, "screenings_delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete comprehensive screenings"
        )
    
    # Delete screening
    result = await db.evep.comprehensive_screenings.delete_one({"_id": ObjectId(screening_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprehensive screening not found"
        )
    
    return {"message": "Comprehensive screening deleted successfully"}
