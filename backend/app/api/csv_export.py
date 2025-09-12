"""
CSV Export API endpoints for EVEP Platform
This module provides CSV export functionality for various data types.
"""

import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.api.auth import get_current_user
from app.core.database import get_database
from app.core.db_rbac import has_permission_db

router = APIRouter(prefix="/csv-export", tags=["CSV Export"])

class ExportRequest(BaseModel):
    """Request model for CSV export"""
    data_type: str = Field(..., description="Type of data to export: 'students', 'teachers', 'schools', 'screenings', 'users'")
    filters: Optional[Dict[str, Any]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@router.get("/students")
async def export_students_csv(
    current_user: dict = Depends(get_current_user),
    school_name: Optional[str] = Query(None, description="Filter by school name"),
    grade_level: Optional[str] = Query(None, description="Filter by grade level"),
    status: Optional[str] = Query("active", description="Filter by status")
):
    """Export students data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Build query
    query = {"status": status}
    if school_name:
        query["school_name"] = school_name
    if grade_level:
        query["grade_level"] = grade_level
    
    # Get students
    students = await db.evep["evep.students"].find(query).to_list(length=None)
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Student ID", "Student Code", "Title", "First Name", "Last Name", 
        "CID", "Grade Level", "Grade Number", "School Name", "Birth Date", 
        "Gender", "Parent ID", "Teacher ID", "Consent Document", "Status"
    ])
    
    # Write data
    for student in students:
        writer.writerow([
            str(student.get("_id", "")),
            student.get("student_code", ""),
            student.get("title", ""),
            student.get("first_name", ""),
            student.get("last_name", ""),
            student.get("cid", ""),
            student.get("grade_level", ""),
            student.get("grade_number", ""),
            student.get("school_name", ""),
            student.get("birth_date", ""),
            student.get("gender", ""),
            str(student.get("parent_id", "")),
            str(student.get("teacher_id", "")),
            student.get("consent_document", False),
            student.get("status", "")
        ])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=students_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/teachers")
async def export_teachers_csv(
    current_user: dict = Depends(get_current_user),
    school_name: Optional[str] = Query(None, description="Filter by school name"),
    status: Optional[str] = Query("active", description="Filter by status")
):
    """Export teachers data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Build query
    query = {"status": status}
    if school_name:
        query["school_name"] = school_name
    
    # Get teachers
    teachers = await db.evep.teachers.find(query).to_list(length=None)
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Teacher ID", "Teacher Code", "Title", "First Name", "Last Name", 
        "CID", "School Name", "Subject", "Phone", "Email", "Status"
    ])
    
    # Write data
    for teacher in teachers:
        writer.writerow([
            str(teacher.get("_id", "")),
            teacher.get("teacher_code", ""),
            teacher.get("title", ""),
            teacher.get("first_name", ""),
            teacher.get("last_name", ""),
            teacher.get("cid", ""),
            teacher.get("school_name", ""),
            teacher.get("subject", ""),
            teacher.get("phone", ""),
            teacher.get("email", ""),
            teacher.get("status", "")
        ])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=teachers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/schools")
async def export_schools_csv(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query("active", description="Filter by status")
):
    """Export schools data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Get schools
    schools = await db.evep.schools.find({"status": status}).to_list(length=None)
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "School ID", "School Code", "School Name", "School Type", 
        "Address", "Phone", "Email", "Principal Name", "Status"
    ])
    
    # Write data
    for school in schools:
        writer.writerow([
            str(school.get("_id", "")),
            school.get("school_code", ""),
            school.get("school_name", ""),
            school.get("school_type", ""),
            str(school.get("address", {})),
            school.get("phone", ""),
            school.get("email", ""),
            school.get("principal_name", ""),
            school.get("status", "")
        ])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=schools_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/users")
async def export_users_csv(
    current_user: dict = Depends(get_current_user),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query("active", description="Filter by status")
):
    """Export users data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Build query
    query = {"is_active": status == "active"}
    if role:
        query["role"] = role
    
    # Get users
    users = await db.evep.users.find(query).to_list(length=None)
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "User ID", "Email", "First Name", "Last Name", "Role", 
        "Organization", "Phone", "Status", "Created At", "Updated At"
    ])
    
    # Write data
    for user in users:
        writer.writerow([
            str(user.get("_id", "")),
            user.get("email", ""),
            user.get("first_name", ""),
            user.get("last_name", ""),
            user.get("role", ""),
            user.get("organization", ""),
            user.get("phone", ""),
            "active" if user.get("is_active", False) else "inactive",
            user.get("created_at", ""),
            user.get("updated_at", "")
        ])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/screenings")
async def export_screenings_csv(
    current_user: dict = Depends(get_current_user),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    screening_type: Optional[str] = Query(None, description="Filter by screening type"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Export screenings data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Build query
    query = {}
    if date_from:
        query["created_at"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = datetime.fromisoformat(date_to)
    if screening_type:
        query["screening_type"] = screening_type
    if status:
        query["status"] = status
    
    # Get screenings
    try:
        screenings = await db.evep["screenings"].find(query).to_list(length=None)
    except:
        screenings = []
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Session ID", "Patient ID", "Examiner ID", "Screening Type", 
        "Screening Category", "Equipment Used", "Status", "Created At", 
        "Completed At", "Notes"
    ])
    
    # Write data
    for screening in screenings:
        writer.writerow([
            str(screening.get("_id", "")),
            str(screening.get("patient_id", "")),
            str(screening.get("examiner_id", "")),
            screening.get("screening_type", ""),
            screening.get("screening_category", ""),
            screening.get("equipment_used", ""),
            screening.get("status", ""),
            screening.get("created_at", ""),
            screening.get("completed_at", ""),
            screening.get("notes", "")
        ])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=screenings_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/dashboard-summary")
async def export_dashboard_summary_csv(
    current_user: dict = Depends(get_current_user)
):
    """Export dashboard summary data to CSV"""
    
    # Check permissions
    user_id = current_user.get("id")
    user_role = current_user.get("role")
    
    # Allow super_admin and admin roles to export data
    if user_role not in ["super_admin", "admin"]:
        if not await has_permission_db(user_id, "export_data"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to export data"
            )
    
    db = get_database()
    
    # Get summary data
    total_students = await db.evep["evep.students"].count_documents({"status": "active"})
    total_teachers = await db.evep.teachers.count_documents({"status": "active"})
    total_schools = await db.evep.schools.count_documents({"status": "active"})
    total_users = await db.evep.users.count_documents({"is_active": True})
    
    # Try to get screenings count, handle if collection doesn't exist
    try:
        total_screenings = await db.evep["screenings"].count_documents({})
    except:
        total_screenings = 0
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Metric", "Count", "Export Date"])
    
    # Write data
    writer.writerow(["Total Students", total_students, datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(["Total Teachers", total_teachers, datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(["Total Schools", total_schools, datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(["Total Users", total_users, datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(["Total Screenings", total_screenings, datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    
    output.seek(0)
    
    # Return CSV file
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dashboard_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )
