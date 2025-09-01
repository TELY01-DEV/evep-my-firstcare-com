#!/usr/bin/env python3
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

# This script will add school screening endpoints to the EVEP API

# School Screening Models
class SchoolScreeningCreate(BaseModel):
    student_id: str = Field(..., description="Student ID")
    teacher_id: str = Field(..., description="Teacher conducting the screening")
    school_id: str = Field(..., description="School ID")
    screening_type: str = Field(..., description="Type of screening: basic_school, vision_test, color_blindness, depth_perception")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    notes: Optional[str] = Field(None, description="Additional notes")

class SchoolScreeningResult(BaseModel):
    eye: str = Field(..., description="Left or Right eye")
    distance_acuity: Optional[str] = None
    near_acuity: Optional[str] = None
    color_vision: Optional[str] = None
    depth_perception: Optional[str] = None
    additional_tests: Optional[Dict[str, Any]] = None

class SchoolScreeningUpdate(BaseModel):
    results: List[SchoolScreeningResult]
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    referral_needed: bool = Field(default=False)
    referral_notes: Optional[str] = None
    status: str = Field(..., description="Status: pending, in_progress, completed, pending_review, reviewed, cancelled, failed")
    notes: Optional[str] = None

class SchoolScreeningResponse(BaseModel):
    screening_id: str
    student_id: str
    student_name: str
    teacher_id: str
    teacher_name: str
    school_id: str
    school_name: str
    grade_level: str
    screening_type: str
    screening_date: str
    status: str
    results: Optional[List[SchoolScreeningResult]] = None
    conclusion: Optional[str] = None
    recommendations: Optional[str] = None
    referral_needed: bool
    referral_notes: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

# School Screening Statistics
class SchoolScreeningStats(BaseModel):
    total_screenings: int
    completed_screenings: int
    pending_screenings: int
    referrals_needed: int
    screenings_by_type: Dict[str, int]
    screenings_by_status: Dict[str, int]

async def add_school_screening_endpoints():
    """Add school screening endpoints to the EVEP API"""
    
    # This would be added to backend/app/api/evep.py
    
    school_screening_code = '''
# School Screening Endpoints
@router.post("/school-screenings", response_model=SchoolScreeningResponse)
async def create_school_screening(
    screening_data: SchoolScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new school screening session"""
    db = get_database()
    
    # Check permissions - teachers and school staff can create screenings
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create school screening")
    
    # Verify student exists
    student = await db.evep.students.find_one({"_id": ObjectId(screening_data.student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Verify teacher exists
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(screening_data.teacher_id)})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Verify school exists
    school = await db.evep.schools.find_one({"_id": ObjectId(screening_data.school_id)})
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    
    # Create screening session
    screening_id = f"school_screening_{screening_data.student_id}_{int(datetime.now().timestamp())}"
    
    screening_data_dict = screening_data.model_dump()
    screening_data_dict.update({
        "screening_id": screening_id,
        "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}",
        "teacher_name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
        "school_name": school.get('name', ''),
        "grade_level": student.get('grade_level', ''),
        "status": "pending",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    })
    
    result = await db.evep.school_screenings.insert_one(screening_data_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create school screening")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_screening_created",
        description=f"School screening created for student {screening_data.student_id} by teacher {screening_data.teacher_id}",
        portal="medical"
    )
    
    return {"message": "School screening created successfully", "screening_id": screening_id}

@router.get("/school-screenings", response_model=List[SchoolScreeningResponse])
async def get_school_screenings(
    current_user: dict = Depends(get_current_user),
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    teacher_id: Optional[str] = Query(None, description="Filter by teacher ID"),
    school_id: Optional[str] = Query(None, description="Filter by school ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = 0,
    limit: int = 100
):
    """Get school screenings with filters"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view school screenings")
    
    # Build filter query
    filter_query = {}
    
    # Teachers can only see screenings from their school
    if current_user["role"] == "teacher":
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher:
            filter_query["school_id"] = str(teacher.get("_id"))
    
    if student_id:
        filter_query["student_id"] = student_id
    if teacher_id:
        filter_query["teacher_id"] = teacher_id
    if school_id:
        filter_query["school_id"] = school_id
    if status:
        filter_query["status"] = status
    
    # Get screenings
    screenings = await db.evep.school_screenings.find(filter_query).skip(skip).limit(limit).to_list(length=None)
    
    result = []
    for screening in screenings:
        result.append({
            "screening_id": screening.get("screening_id", ""),
            "student_id": screening.get("student_id", ""),
            "student_name": screening.get("student_name", ""),
            "teacher_id": screening.get("teacher_id", ""),
            "teacher_name": screening.get("teacher_name", ""),
            "school_id": screening.get("school_id", ""),
            "school_name": screening.get("school_name", ""),
            "grade_level": screening.get("grade_level", ""),
            "screening_type": screening.get("screening_type", ""),
            "screening_date": format_datetime_for_frontend(screening.get("screening_date", datetime.now())),
            "status": screening.get("status", ""),
            "results": screening.get("results", []),
            "conclusion": screening.get("conclusion", ""),
            "recommendations": screening.get("recommendations", ""),
            "referral_needed": screening.get("referral_needed", False),
            "referral_notes": screening.get("referral_notes", ""),
            "notes": screening.get("notes", ""),
            "created_at": format_datetime_for_frontend(screening.get("created_at", datetime.now())),
            "updated_at": format_datetime_for_frontend(screening.get("updated_at", datetime.now()))
        })
    
    return result

@router.get("/school-screenings/{screening_id}", response_model=SchoolScreeningResponse)
async def get_school_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific school screening by ID"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view school screening")
    
    # Find screening
    screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School screening not found")
    
    # Teachers can only see screenings from their school
    if current_user["role"] == "teacher":
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher and screening.get("school_id") != str(teacher.get("_id")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this screening")
    
    return {
        "screening_id": screening.get("screening_id", ""),
        "student_id": screening.get("student_id", ""),
        "student_name": screening.get("student_name", ""),
        "teacher_id": screening.get("teacher_id", ""),
        "teacher_name": screening.get("teacher_name", ""),
        "school_id": screening.get("school_id", ""),
        "school_name": screening.get("school_name", ""),
        "grade_level": screening.get("grade_level", ""),
        "screening_type": screening.get("screening_type", ""),
        "screening_date": format_datetime_for_frontend(screening.get("screening_date", datetime.now())),
        "status": screening.get("status", ""),
        "results": screening.get("results", []),
        "conclusion": screening.get("conclusion", ""),
        "recommendations": screening.get("recommendations", ""),
        "referral_needed": screening.get("referral_needed", False),
        "referral_notes": screening.get("referral_notes", ""),
        "notes": screening.get("notes", ""),
        "created_at": format_datetime_for_frontend(screening.get("created_at", datetime.now())),
        "updated_at": format_datetime_for_frontend(screening.get("updated_at", datetime.now()))
    }

@router.put("/school-screenings/{screening_id}")
async def update_school_screening(
    screening_id: str,
    screening_data: SchoolScreeningUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a school screening session"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update school screening")
    
    # Find screening
    screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School screening not found")
    
    # Teachers can only update screenings they conducted
    if current_user["role"] == "teacher":
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher and screening.get("teacher_id") != str(teacher.get("_id")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only update screenings you conducted")
    
    # Update screening
    update_data = screening_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.school_screenings.update_one(
        {"screening_id": screening_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update school screening")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_screening_updated",
        description=f"School screening {screening_id} updated by {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "School screening updated successfully"}

@router.get("/school-screenings/stats/school/{school_id}", response_model=SchoolScreeningStats)
async def get_school_screening_stats(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get school screening statistics for a specific school"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view screening statistics")
    
    # Verify school exists
    school = await db.evep.schools.find_one({"_id": ObjectId(school_id)})
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    
    # Teachers can only see stats for their school
    if current_user["role"] == "teacher":
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher and school_id != str(teacher.get("_id")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view stats for your school")
    
    # Get screening statistics
    pipeline = [
        {"$match": {"school_id": school_id}},
        {"$group": {
            "_id": None,
            "total_screenings": {"$sum": 1},
            "completed_screenings": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "pending_screenings": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}},
            "referrals_needed": {"$sum": {"$cond": ["$referral_needed", 1, 0]}}
        }},
        {"$project": {
            "_id": 0,
            "total_screenings": 1,
            "completed_screenings": 1,
            "pending_screenings": 1,
            "referrals_needed": 1
        }}
    ]
    
    stats_result = await db.evep.school_screenings.aggregate(pipeline).to_list(length=None)
    
    if not stats_result:
        stats = {
            "total_screenings": 0,
            "completed_screenings": 0,
            "pending_screenings": 0,
            "referrals_needed": 0,
            "screenings_by_type": {},
            "screenings_by_status": {}
        }
    else:
        stats = stats_result[0]
        
        # Get screenings by type
        type_pipeline = [
            {"$match": {"school_id": school_id}},
            {"$group": {"_id": "$screening_type", "count": {"$sum": 1}}}
        ]
        type_stats = await db.evep.school_screenings.aggregate(type_pipeline).to_list(length=None)
        stats["screenings_by_type"] = {item["_id"]: item["count"] for item in type_stats}
        
        # Get screenings by status
        status_pipeline = [
            {"$match": {"school_id": school_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_stats = await db.evep.school_screenings.aggregate(status_pipeline).to_list(length=None)
        stats["screenings_by_status"] = {item["_id"]: item["count"] for item in status_stats}
    
    return stats

@router.get("/school-screenings/student/{student_id}", response_model=List[SchoolScreeningResponse])
async def get_student_screenings(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all screenings for a specific student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view student screenings")
    
    # Verify student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Teachers can only see screenings for students in their school
    if current_user["role"] == "teacher":
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher and student.get("school_name") != teacher.get("school"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view screenings for students in your school")
    
    # Get screenings for student
    screenings = await db.evep.school_screenings.find({"student_id": student_id}).to_list(length=None)
    
    result = []
    for screening in screenings:
        result.append({
            "screening_id": screening.get("screening_id", ""),
            "student_id": screening.get("student_id", ""),
            "student_name": screening.get("student_name", ""),
            "teacher_id": screening.get("teacher_id", ""),
            "teacher_name": screening.get("teacher_name", ""),
            "school_id": screening.get("school_id", ""),
            "school_name": screening.get("school_name", ""),
            "grade_level": screening.get("grade_level", ""),
            "screening_type": screening.get("screening_type", ""),
            "screening_date": format_datetime_for_frontend(screening.get("screening_date", datetime.now())),
            "status": screening.get("status", ""),
            "results": screening.get("results", []),
            "conclusion": screening.get("conclusion", ""),
            "recommendations": screening.get("recommendations", ""),
            "referral_needed": screening.get("referral_needed", False),
            "referral_notes": screening.get("referral_notes", ""),
            "notes": screening.get("notes", ""),
            "created_at": format_datetime_for_frontend(screening.get("created_at", datetime.now())),
            "updated_at": format_datetime_for_frontend(screening.get("updated_at", datetime.now()))
        })
    
    return result
'''
    
    print("✅ School screening API endpoints code generated")
    print("\n📋 Endpoints to be added:")
    print("   POST /school-screenings - Create new school screening")
    print("   GET /school-screenings - Get school screenings with filters")
    print("   GET /school-screenings/{screening_id} - Get specific screening")
    print("   PUT /school-screenings/{screening_id} - Update screening")
    print("   GET /school-screenings/stats/school/{school_id} - Get school statistics")
    print("   GET /school-screenings/student/{student_id} - Get student screenings")
    
    return school_screening_code

if __name__ == "__main__":
    asyncio.run(add_school_screening_endpoints())

