from fastapi import APIRouter, HTTPException, Depends, Request, status, UploadFile, File
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, date
import base64

from app.models.evep_models import (
    Parent, ParentResponse, Student, StudentResponse, 
    Teacher, TeacherResponse, School, SchoolResponse
)
from app.core.database import get_database
from app.core.security import log_security_event
from app.core.db_rbac import has_permission_db, has_role_db, has_any_role_db, get_user_permissions_from_db
from app.utils.timezone import get_current_thailand_time
from app.api.auth import get_current_user

router = APIRouter()

def convert_objectids_to_strings(obj):
    """Recursively convert all ObjectId instances to strings"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids_to_strings(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids_to_strings(item) for item in obj]
    else:
        return obj

# ==================== PARENTS CRUD ENDPOINTS ====================

@router.get("/parents")
async def get_parents(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all parents with pagination"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view parents")
    parents = await db.evep["evep.parents"].find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    result = []
    for parent in parents:
        result.append({
            "id": str(parent["_id"]),
            "first_name": parent.get("first_name", ""),
            "last_name": parent.get("last_name", ""),
            "email": parent.get("email", ""),
            "phone": parent.get("phone", ""),
            "relationship": parent.get("relationship", ""),
            "status": parent.get("status", "")
        })
    total_count = await db.evep["evep.parents"].count_documents({"status": "active"})
    return {"parents": result, "total_count": total_count}

@router.get("/parents/{parent_id}")
async def get_parent(
    parent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific parent by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view parent details")
    parent = await db.evep["evep.parents"].find_one({"_id": ObjectId(parent_id)})
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    return {
        "id": str(parent["_id"]),
        "first_name": parent.get("first_name", ""),
        "last_name": parent.get("last_name", ""),
        "email": parent.get("email", ""),
        "phone": parent.get("phone", ""),
        "relationship": parent.get("relationship", ""),
        "status": parent.get("status", "")
    }

@router.post("/parents")
async def create_parent(
    parent_data: Parent,
    current_user: dict = Depends(get_current_user)
):
    """Create a new parent"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create parent")
    
    # Prepare parent data
    parent_dict = parent_data.model_dump()
    parent_dict["created_at"] = get_current_thailand_time()
    parent_dict["updated_at"] = get_current_thailand_time()
    parent_dict["status"] = "active"
    
    # Insert parent
    result = await db.evep["evep.parents"].insert_one(parent_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create parent")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="parent_created",
        description=f"Parent created by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Parent created successfully", "parent_id": str(result.inserted_id)}

@router.put("/parents/{parent_id}")
async def update_parent(
    parent_id: str,
    parent_data: Parent,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific parent by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update parent")
    
    # Check if parent exists
    existing_parent = await db.evep["evep.parents"].find_one({"_id": ObjectId(parent_id)})
    if not existing_parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    # Update parent data
    update_data = parent_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep["evep.parents"].update_one(
        {"_id": ObjectId(parent_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update parent")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="parent_updated",
        description=f"Parent {parent_id} updated by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Parent updated successfully", "parent_id": parent_id}

@router.delete("/parents/{parent_id}")
async def delete_parent(
    parent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific parent by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete parent")
    
    # Check if parent exists
    existing_parent = await db.evep.parents.find_one({"_id": ObjectId(parent_id)})
    if not existing_parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    # Soft delete by setting status to inactive
    result = await db.evep.parents.update_one(
        {"_id": ObjectId(parent_id)},
        {"$set": {"status": "inactive", "updated_at": get_current_thailand_time()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete parent")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="parent_deleted",
        description=f"Parent {parent_id} deleted by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Parent deleted successfully", "parent_id": parent_id}

# ==================== STUDENTS CRUD ENDPOINTS ====================

@router.get("/students")
async def get_students(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all students with pagination"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view students")
    students = await db.evep["evep.students"].find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    result = []
    for student in students:
        result.append({
            "id": str(student["_id"]),
            "title": student.get("title", ""),
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "cid": student.get("cid", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "grade_number": student.get("grade_number", ""),
            "school_name": student.get("school_name", ""),
            "birth_date": student.get("birth_date", ""),
            "gender": student.get("gender", ""),
            "parent_id": str(student.get("parent_id", "")),
            "teacher_id": str(student.get("teacher_id", "")),
            "consent_document": student.get("consent_document", False),
            "profile_photo": student.get("profile_photo", ""),
            "extra_photos": student.get("extra_photos", []),
            "photo_metadata": student.get("photo_metadata", {}),
            "address": student.get("address", {}),
            "disease": student.get("disease", ""),
            "status": student.get("status", "")
        })
    total_count = await db.evep["evep.students"].count_documents({"status": "active"})
    return {"students": result, "total_count": total_count}

@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific student by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view student details")
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return {
        "id": str(student["_id"]),
        "title": student.get("title", ""),
        "first_name": student.get("first_name", ""),
        "last_name": student.get("last_name", ""),
        "cid": student.get("cid", ""),
        "student_code": student.get("student_code", ""),
        "grade_level": student.get("grade_level", ""),
        "grade_number": student.get("grade_number", ""),
        "school_name": student.get("school_name", ""),
        "birth_date": student.get("birth_date", ""),
        "gender": student.get("gender", ""),
        "parent_id": str(student.get("parent_id", "")),
        "teacher_id": str(student.get("teacher_id", "")),
        "consent_document": student.get("consent_document", False),
        "profile_photo": student.get("profile_photo", ""),
        "extra_photos": student.get("extra_photos", []),
        "photo_metadata": student.get("photo_metadata", {}),
        "address": student.get("address", {}),
        "disease": student.get("disease", ""),
        "status": student.get("status", "")
    }

@router.post("/students")
async def create_student(
    student_data: Student,
    current_user: dict = Depends(get_current_user)
):
    """Create a new student"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create student")
    
    # Prepare student data
    student_dict = student_data.model_dump()
    student_dict["created_at"] = get_current_thailand_time()
    student_dict["updated_at"] = get_current_thailand_time()
    student_dict["status"] = "active"
    
    # Insert student
    result = await db.evep["evep.students"].insert_one(student_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create student")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="student_created",
        description=f"Student created by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Student created successfully", "student_id": str(result.inserted_id)}

@router.put("/students/{student_id}")
async def update_student(
    student_id: str,
    student_data: Student,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific student by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update student")
    
    # Check if student exists
    existing_student = await db.evep["evep.students"].find_one({"_id": ObjectId(student_id)})
    if not existing_student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Update student data
    update_data = student_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep["evep.students"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update student")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="student_updated",
        description=f"Student {student_id} updated by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Student updated successfully", "student_id": student_id}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific student by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete student")
    
    # Check if student exists
    existing_student = await db.evep["evep.students"].find_one({"_id": ObjectId(student_id)})
    if not existing_student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Soft delete by setting status to inactive
    result = await db.evep["evep.students"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"status": "inactive", "updated_at": get_current_thailand_time()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete student")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="student_deleted",
        description=f"Student {student_id} deleted by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Student deleted successfully", "student_id": student_id}

# ==================== TEACHERS CRUD ENDPOINTS ====================

@router.get("/teachers")
async def get_teachers(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all teachers with pagination"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view teachers")
    teachers = await db.evep.teachers.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    result = []
    for teacher in teachers:
        result.append({
            "id": str(teacher["_id"]),
            "first_name": teacher.get("first_name", ""),
            "last_name": teacher.get("last_name", ""),
            "email": teacher.get("email", ""),
            "position": teacher.get("position", ""),
            "school": teacher.get("school", ""),
            "phone": teacher.get("phone", ""),
            "status": teacher.get("status", "")
        })
    total_count = await db.evep.teachers.count_documents({"status": "active"})
    return {"teachers": result, "total_count": total_count}

@router.get("/teachers/{teacher_id}")
async def get_teacher(
    teacher_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific teacher by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view teacher details")
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return {
        "id": str(teacher["_id"]),
        "first_name": teacher.get("first_name", ""),
        "last_name": teacher.get("last_name", ""),
        "email": teacher.get("email", ""),
        "position": teacher.get("position", ""),
        "school": teacher.get("school", ""),
        "phone": teacher.get("phone", ""),
        "status": teacher.get("status", "")
    }

@router.put("/teachers/{teacher_id}")
async def update_teacher(
    teacher_id: str,
    teacher_data: Teacher,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific teacher by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update teacher")
    
    # Check if teacher exists
    existing_teacher = await db.evep.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not existing_teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Update teacher data
    update_data = teacher_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.teachers.update_one(
        {"_id": ObjectId(teacher_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update teacher")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="teacher_updated",
        description=f"Teacher {teacher_id} updated by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Teacher updated successfully", "teacher_id": teacher_id}

@router.post("/teachers")
async def create_teacher(
    teacher_data: Teacher,
    current_user: dict = Depends(get_current_user)
):
    """Create a new teacher"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create teacher")
    
    # Prepare teacher data
    teacher_dict = teacher_data.model_dump()
    teacher_dict["created_at"] = get_current_thailand_time()
    teacher_dict["updated_at"] = get_current_thailand_time()
    teacher_dict["status"] = "active"
    
    # Insert teacher
    result = await db.evep.teachers.insert_one(teacher_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create teacher")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="teacher_created",
        description=f"Teacher created by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Teacher created successfully", "teacher_id": str(result.inserted_id)}

@router.delete("/teachers/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific teacher by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete teacher")
    
    # Check if teacher exists
    existing_teacher = await db.evep.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not existing_teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Soft delete by setting status to inactive
    result = await db.evep.teachers.update_one(
        {"_id": ObjectId(teacher_id)},
        {"$set": {"status": "inactive", "updated_at": get_current_thailand_time()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete teacher")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="teacher_deleted",
        description=f"Teacher {teacher_id} deleted by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "Teacher deleted successfully", "teacher_id": teacher_id}

# ==================== SCHOOLS CRUD ENDPOINTS ====================

@router.get("/schools")
async def get_schools(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all schools with pagination"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view schools")
    schools = await db.evep.schools.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    result = []
    for school in schools:
        result.append({
            "id": str(school["_id"]),
            "name": school.get("name", ""),
            "code": school.get("code", ""),
            "type": school.get("type", ""),
            "address": school.get("address", ""),
            "district": school.get("district", ""),
            "province": school.get("province", ""),
            "phone": school.get("phone", ""),
            "email": school.get("email", ""),
            "principal_name": school.get("principal_name", ""),
            "status": school.get("status", "")
        })
    total_count = await db.evep.schools.count_documents({"status": "active"})
    return {"schools": result, "total_count": total_count}

@router.get("/schools/{school_id}")
async def get_school(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific school by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view school details")
    school = await db.evep.schools.find_one({"_id": ObjectId(school_id)})
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    return {
        "id": str(school["_id"]),
        "name": school.get("name", ""),
        "code": school.get("code", ""),
        "type": school.get("type", ""),
        "address": school.get("address", ""),
        "district": school.get("district", ""),
        "province": school.get("province", ""),
        "phone": school.get("phone", ""),
        "email": school.get("email", ""),
        "principal_name": school.get("principal_name", ""),
        "status": school.get("status", "")
    }

@router.post("/schools")
async def create_school(
    school_data: School,
    current_user: dict = Depends(get_current_user)
):
    """Create a new school"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create school")
    
    # Prepare school data
    school_dict = school_data.model_dump()
    school_dict["created_at"] = get_current_thailand_time()
    school_dict["updated_at"] = get_current_thailand_time()
    school_dict["status"] = "active"
    
    # Insert school
    result = await db.evep.schools.insert_one(school_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create school")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_created",
        description=f"School created by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "School created successfully", "school_id": str(result.inserted_id)}

@router.put("/schools/{school_id}")
async def update_school(
    school_id: str,
    school_data: School,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific school by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update school")
    
    # Check if school exists
    existing_school = await db.evep.schools.find_one({"_id": ObjectId(school_id)})
    if not existing_school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    
    # Update school data
    update_data = school_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.schools.update_one(
        {"_id": ObjectId(school_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update school")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_updated",
        description=f"School {school_id} updated by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "School updated successfully", "school_id": school_id}

@router.delete("/schools/{school_id}")
async def delete_school(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific school by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete school")
    
    # Check if school exists
    existing_school = await db.evep.schools.find_one({"_id": ObjectId(school_id)})
    if not existing_school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    
    # Soft delete by setting status to inactive
    result = await db.evep.schools.update_one(
        {"_id": ObjectId(school_id)},
        {"$set": {"status": "inactive", "updated_at": get_current_thailand_time()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete school")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_deleted",
        description=f"School {school_id} deleted by user {current_user.get('email', 'unknown')}",
        portal="medical"
    )
    
    return {"message": "School deleted successfully", "school_id": school_id}

# ==================== TEACHER-STUDENT RELATIONSHIP MANAGEMENT ====================

@router.get("/teachers/{teacher_id}/students")
async def get_teacher_students(
    teacher_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all students assigned to a specific teacher"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view teacher-student relationships"
        )
    
    # Teachers can only view their own students
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data") and current_user["user_id"] != teacher_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own students"
        )
    
    # Get teacher-student relationships
    relationships = await db.evep.teacher_students.find({
        "teacher_id": ObjectId(teacher_id),
        "status": "active"
    }).to_list(length=None)
    
    # Get student details
    student_ids = [rel["student_id"] for rel in relationships]
    students = await db.evep.students.find({
        "_id": {"$in": student_ids}
    }).to_list(length=None)
    
    # Combine data
    result = []
    for relationship in relationships:
        student = next((s for s in students if s["_id"] == relationship["student_id"]), None)
        if student:
            result.append({
                "relationship_id": str(relationship["_id"]),
                "student_id": str(student["_id"]),
                "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}",
                "student_code": student.get("student_code", ""),
                "grade_level": student.get("grade_level", ""),
                "school_name": student.get("school_name", ""),
                "assigned_date": relationship["assigned_date"],
                "status": relationship["status"]
            })
    
    return {"students": result, "total_count": len(result)}


@router.post("/teachers/{teacher_id}/students/{student_id}")
async def assign_student_to_teacher(
    teacher_id: str,
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Assign a student to a teacher"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to assign students"
        )
    
    # Validate teacher exists
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Validate student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check if relationship already exists
    existing = await db.evep.teacher_students.find_one({
        "teacher_id": ObjectId(teacher_id),
        "student_id": ObjectId(student_id),
        "status": "active"
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already assigned to this teacher"
        )
    
    # Create relationship
    relationship = {
        "teacher_id": ObjectId(teacher_id),
        "student_id": ObjectId(student_id),
        "school_id": student.get("school_id"),
        "assigned_date": get_current_thailand_time(),
        "status": "active",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.teacher_students.insert_one(relationship)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="assign_student_to_teacher",
        details=f"Assigned student {student_id} to teacher {teacher_id}",
        ip_address="system"
    )
    
    return {
        "message": "Student assigned to teacher successfully",
        "relationship_id": str(result.inserted_id)
    }


@router.delete("/teachers/{teacher_id}/students/{student_id}")
async def remove_student_from_teacher(
    teacher_id: str,
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a student from a teacher's assignment"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to remove student assignments"
        )
    
    # Find and update relationship
    result = await db.evep.teacher_students.update_one(
        {
            "teacher_id": ObjectId(teacher_id),
            "student_id": ObjectId(student_id),
            "status": "active"
        },
        {
            "$set": {
                "status": "inactive",
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active student-teacher relationship not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="remove_student_from_teacher",
        details=f"Removed student {student_id} from teacher {teacher_id}",
        ip_address="system"
    )
    
    return {"message": "Student removed from teacher successfully"}


@router.get("/schools/{school_id}/teachers")
async def get_school_teachers(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all teachers in a specific school"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view school teachers"
        )
    
    # Get teachers for the school
    teachers = await db.evep.teachers.find({
        "school": school_id,
        "status": "active"
    }).to_list(length=None)
    
    result = []
    for teacher in teachers:
        result.append({
            "teacher_id": str(teacher["_id"]),
            "first_name": teacher.get("first_name", ""),
            "last_name": teacher.get("last_name", ""),
            "email": teacher.get("email", ""),
            "position": teacher.get("position", ""),
            "school": teacher.get("school", ""),
            "phone": teacher.get("phone", ""),
            "status": teacher.get("status", "")
        })
    
    return {"teachers": result, "total_count": len(result)}


@router.get("/parents/{parent_id}/students")
async def get_parent_students(
    parent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all students of a specific parent"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "parent", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view parent-student relationships"
        )
    
    # Parents can only view their own children
    if await has_role_db(user_id, "parent") or await has_permission_db(user_id, "view_patients") and current_user["user_id"] != parent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own children"
        )
    
    # Get students for the parent
    students = await db.evep.students.find({
        "parent_id": ObjectId(parent_id),
        "status": "active"
    }).to_list(length=None)
    
    result = []
    for student in students:
        result.append({
            "student_id": str(student["_id"]),
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "school_name": student.get("school_name", ""),
            "birth_date": student.get("birth_date", ""),
            "gender": student.get("gender", ""),
            "status": student.get("status", "")
        })
    
    return {"students": result, "total_count": len(result)}




@router.get("/students/ready-for-patient-registration")
async def get_students_ready_for_patient_registration(
    # current_user: dict = Depends(get_current_user),  # Temporarily disabled for testing
    skip: int = 0,
    limit: int = 100
):
    """Get students who have completed school screening and are ready for patient registration"""
    db = get_database()
    
    # Check permissions - Temporarily disabled for testing
    # if current_user["role"] not in ["admin", "super_admin", "medical_admin", "medical_staff", "doctor"]:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Insufficient permissions to view students ready for patient registration"
    #     )
    
    # Get students who have completed school screening
    # First, get all completed school screenings
    completed_screenings = await db.evep["school_screenings"].find({
        "status": "completed"
    }).to_list(length=None)
    
    # Extract student IDs from completed screenings
    student_ids = [ObjectId(screening["student_id"]) for screening in completed_screenings]
    
    if not student_ids:
        return {"students": [], "total_count": 0}
    
    # Get students who have completed screening and are not already registered as patients
    # Check which students are already registered as patients
    existing_patients = await db.evep["student_patient_mapping"].find({
        "student_id": {"$in": student_ids},
        "status": "active"
    }).to_list(length=None)
    
    # Get student IDs that are already registered as patients
    already_registered_ids = [mapping["student_id"] for mapping in existing_patients]
    
    # Filter out students who are already registered as patients
    available_student_ids = [sid for sid in student_ids if sid not in already_registered_ids]
    
    if not available_student_ids:
        return {"students": [], "total_count": 0}
    
    # Get student details for available students
    students = await db.evep["evep.students"].find({
        "_id": {"$in": available_student_ids},
        "status": "active"
    }).skip(skip).limit(limit).to_list(length=None)
    
    result = []
    for student in students:
        # Get the latest screening for this student
        latest_screening = await db.evep["school_screenings"].find_one({
            "student_id": student["_id"],
            "status": "completed"
        }, sort=[("created_at", -1)])
        
        result.append({
            "id": str(student["_id"]),
            "title": student.get("title", ""),
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "cid": student.get("cid", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "grade_number": student.get("grade_number", ""),
            "school_name": student.get("school_name", ""),
            "birth_date": student.get("birth_date", ""),
            "gender": student.get("gender", ""),
            "parent_id": str(student.get("parent_id", "")),
            "teacher_id": str(student.get("teacher_id", "")),
            "consent_document": student.get("consent_document", False),
            "profile_photo": student.get("profile_photo", ""),
            "extra_photos": student.get("extra_photos", []),
            "photo_metadata": student.get("photo_metadata", {}),
            "address": student.get("address", {}),
            "disease": student.get("disease", ""),
            "status": student.get("status", ""),
            "screening_completed_at": latest_screening.get("created_at") if latest_screening else None,
            "screening_results": latest_screening.get("results", {}) if latest_screening else {}
        })
    
    total_count = len(available_student_ids)
    
    return {"students": result, "total_count": total_count}




# Teachers CRUD
@router.get("/teachers")
async def get_teachers(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all teachers with pagination"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view teachers"
        )
    
    # Get teachers with pagination
    teachers = await db.evep.teachers.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    
    result = []
    for teacher in teachers:
        result.append({
            "id": str(teacher["_id"]),
            "first_name": teacher.get("first_name", ""),
            "last_name": teacher.get("last_name", ""),
            "email": teacher.get("email", ""),
            "position": teacher.get("position", ""),
            "school": teacher.get("school", ""),
            "phone": teacher.get("phone", ""),
            "status": teacher.get("status", "")
        })
    
    total_count = await db.evep.teachers.count_documents({"status": "active"})
    
    return {"teachers": result, "total_count": total_count}


@router.get("/teachers/{teacher_id}")
async def get_teacher(
    teacher_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific teacher by ID"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view teacher details"
        )
    
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    return {
        "id": str(teacher["_id"]),
        "first_name": teacher.get("first_name", ""),
        "last_name": teacher.get("last_name", ""),
        "email": teacher.get("email", ""),
        "position": teacher.get("position", ""),
        "school": teacher.get("school", ""),
        "phone": teacher.get("phone", ""),
        "status": teacher.get("status", "")
    }
# ==================== PHOTO UPLOAD ENDPOINTS ====================

@router.post("/students/{student_id}/upload-profile-photo")
async def upload_student_profile_photo(
    student_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile photo for a student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload student photos"
        )
    
    # Check if student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file content and encode as base64
    file_content = await file.read()
    photo_base64 = base64.b64encode(file_content).decode('utf-8')
    
    # Update student with profile photo
    result = await db.evep.students.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": {
                "profile_photo": photo_base64,
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update student profile photo"
        )
    
    return {"message": "Profile photo uploaded successfully", "student_id": student_id}


@router.post("/students/{student_id}/upload-extra-photo")
async def upload_student_extra_photo(
    student_id: str,
    file: UploadFile = File(...),
    description: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Upload extra photo for a student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload student photos"
        )
    
    # Check if student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file content and encode as base64
    file_content = await file.read()
    photo_base64 = base64.b64encode(file_content).decode('utf-8')
    
    # Create photo metadata
    photo_metadata = {
        "description": description,
        "uploaded_by": current_user.get("email", "unknown"),
        "uploaded_at": get_current_thailand_time().isoformat(),
        "file_size": len(file_content),
        "content_type": file.content_type
    }
    
    # Add photo to extra_photos array
    result = await db.evep.students.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$push": {
                "extra_photos": photo_base64
            },
            "$set": {
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to upload extra photo"
        )
    
    return {"message": "Extra photo uploaded successfully", "student_id": student_id}


@router.get("/students/{student_id}/photos")
async def get_student_photos(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all photos for a student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin", "medical_admin", "medical_staff", "doctor", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view student photos"
        )
    
    # Check if student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return {
        "student_id": student_id,
        "profile_photo": student.get("profile_photo"),
        "extra_photos": student.get("extra_photos", []),
        "photo_metadata": student.get("photo_metadata", {})
    }


@router.delete("/students/{student_id}/photos/{photo_index}")
async def delete_student_extra_photo(
    student_id: str,
    photo_index: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete an extra photo for a student"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete student photos"
        )
    
    # Check if student exists
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    extra_photos = student.get("extra_photos", [])
    if photo_index >= len(extra_photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo index out of range"
        )
    
    # Remove photo at specified index
    extra_photos.pop(photo_index)
    
    result = await db.evep.students.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": {
                "extra_photos": extra_photos,
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete photo"
        )
    
    return {"message": "Photo deleted successfully", "student_id": student_id}


# ==================== SCHOOL SCREENING ENDPOINTS ====================

from pydantic import BaseModel, Field
from typing import Dict, Any
from app.utils.timezone import format_datetime_for_frontend

# School Screening Models
class SchoolScreeningCreate(BaseModel):
    student_id: str = Field(..., description="Student ID")
    teacher_id: str = Field(..., description="Teacher conducting the screening")
    school_id: Optional[str] = Field(None, description="School ID")
    school_name: Optional[str] = Field(None, description="School Name (used if school_id not provided)")
    screening_type: str = Field(..., description="Type of screening: basic_school, vision_test, color_blindness, depth_perception")
    screening_date: Optional[datetime] = Field(None, description="Screening date and time")
    notes: Optional[str] = Field(None, description="Additional notes")

class SchoolScreeningRescreen(BaseModel):
    teacher_id: str = Field(..., description="Teacher conducting the re-screen")
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

class SchoolScreeningStats(BaseModel):
    total_screenings: int
    completed_screenings: int
    pending_screenings: int
    referrals_needed: int
    screenings_by_type: Dict[str, int]
    screenings_by_status: Dict[str, int]

@router.post("/school-screenings")
async def create_school_screening(
    screening_data: SchoolScreeningCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new school screening session"""
    db = get_database()
    
    # Check permissions using database-based RBAC
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permission from database - allow super_admin to create screenings
    user_role = current_user.get("role")
    if user_role != "super_admin" and not await has_permission_db(user_id, "full_access") and not await has_permission_db(user_id, "screenings_create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create school screening"
        )
    
    # Verify student exists
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(screening_data.student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Verify teacher exists
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(screening_data.teacher_id)})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Verify school exists - handle both school_id and school_name
    school = None
    school_id = None
    
    if screening_data.school_id:
        # Use provided school_id
        school = await db.evep.schools.find_one({"_id": ObjectId(screening_data.school_id)})
        school_id = screening_data.school_id
    elif screening_data.school_name:
        # Look up school by name
        school = await db.evep.schools.find_one({"name": screening_data.school_name})
        if school:
            school_id = str(school["_id"])
    else:
        # Try to get school from teacher
        if teacher and teacher.get("school"):
            school = await db.evep.schools.find_one({"name": teacher["school"]})
            if school:
                school_id = str(school["_id"])
    
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found. Please provide school_id or school_name, or ensure teacher has a valid school.")
    
    # Check for existing screening for this student on the same date
    screening_date = screening_data.screening_date
    if screening_date:
        # Convert to date string for comparison
        if isinstance(screening_date, str):
            screening_date_str = screening_date.split('T')[0]  # Get date part only
        else:
            screening_date_str = screening_date.strftime('%Y-%m-%d')
        
        # Check for existing screenings on the same date using regex pattern
        existing_screening = await db.evep.school_screenings.find_one({
            "student_id": screening_data.student_id,
            "screening_date": {"$regex": f"^{screening_date_str}"}  # Match date part
        })
        
        if existing_screening:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail=f"Student already has a screening on {screening_date_str}. Use re-screen action instead."
            )
    
    # Create screening session
    screening_id = f"school_screening_{screening_data.student_id}_{int(datetime.now().timestamp())}"
    
    screening_data_dict = screening_data.model_dump()
    screening_data_dict.update({
        "screening_id": screening_id,
        "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}",
        "teacher_name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
        "school_id": school_id,  # Use the resolved school_id
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

@router.get("/debug-user")
async def debug_current_user(
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to check current_user object"""
    # Convert any ObjectIds to strings in current_user
    debug_user = {}
    for key, value in current_user.items():
        if hasattr(value, '__class__') and 'ObjectId' in str(value.__class__):
            debug_user[key] = str(value)
        else:
            debug_user[key] = value
    
    return {"current_user": debug_user}

@router.get("/screenings-list")
async def get_screenings_list(
    current_user: dict = Depends(get_current_user)
):
    """Simple screenings endpoint for testing"""
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "system_admin", "medical_admin", "medical_staff", "doctor", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    # Return simple test data
    return [
        {
            "screening_id": "test1",
            "student_name": "Test Student", 
            "status": "completed",
            "screening_date": "2024-01-01"
        }
    ]

# Removed school-screenings endpoint from router - now defined directly in main.py
# to bypass router-level authentication issues

@router.get("/school-screenings/{screening_id}")
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
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data"):
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
    
    # Get user_id for permission checks
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update school screening")
    
    # Find screening
    screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School screening not found")
    
    # Teachers can only update screenings they conducted
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data"):
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

@router.post("/school-screenings/{screening_id}/rescreen")
async def rescreen_student(
    screening_id: str,
    rescreen_data: SchoolScreeningRescreen,
    current_user: dict = Depends(get_current_user)
):
    """Create a new screening for a student who already has a screening (re-screen)"""
    db = get_database()
    
    # Get user_id for permission checks
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create re-screen")
    
    # Find the original screening to get student info
    original_screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    if not original_screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original screening not found")
    
    # Verify student exists
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(original_screening["student_id"])})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Verify teacher exists
    teacher = await db.evep.teachers.find_one({"_id": ObjectId(rescreen_data.teacher_id)})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    # Get school info from original screening
    school_id = original_screening.get("school_id")
    school_name = original_screening.get("school_name")
    
    # Create new screening session for re-screen
    new_screening_id = f"school_screening_{original_screening['student_id']}_{int(datetime.now().timestamp())}"
    
    # Use rescreen_data but keep original student info
    screening_data_dict = rescreen_data.model_dump()
    screening_data_dict.update({
        "screening_id": new_screening_id,
        "student_id": original_screening["student_id"],  # Keep original student
        "student_name": original_screening["student_name"],  # Keep original student name
        "teacher_id": rescreen_data.teacher_id,  # Use new teacher
        "teacher_name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
        "school_id": school_id,  # Keep original school
        "school_name": school_name,  # Keep original school name
        "grade_level": original_screening.get("grade_level", ""),  # Keep original grade
        "status": "pending",
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time(),
        "is_rescreen": True,  # Mark as re-screen
        "original_screening_id": screening_id  # Reference to original screening
    })
    
    result = await db.evep.school_screenings.insert_one(screening_data_dict)
    
    if not result.inserted_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create re-screen")
    
    # Log security event
    log_security_event(
        request=None,
        event_type="school_screening_rescreen",
        description=f"Re-screen created for student {original_screening['student_id']} by teacher {rescreen_data.teacher_id}",
        portal="medical"
    )
    
    return {"message": "Re-screen created successfully", "screening_id": new_screening_id, "original_screening_id": screening_id}

@router.delete("/school-screenings/{screening_id}")
async def delete_school_screening(
    screening_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a school screening"""
    db = get_database()
    
    # Get user_id for permission checks
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete school screenings")
    
    # Verify screening exists
    screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School screening not found")
    
    # Teachers can only delete screenings they created or for their school
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data"):
        teacher = await db.evep.teachers.find_one({"email": current_user["email"]})
        if teacher:
            if screening.get("teacher_id") != str(teacher["_id"]) and screening.get("school_name") != teacher.get("school"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only delete screenings you created or for your school")
    
    # Delete the screening
    result = await db.evep.school_screenings.delete_one({"screening_id": screening_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School screening not found")
    
    return {"message": "School screening deleted successfully"}

@router.get("/school-screenings/student/{student_id}/history")
async def get_student_screening_history(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all screening records for a specific student (screening history)"""
    db = get_database()
    
    # Get user_id for permission checks
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found"
        )
    
    # Check permissions
    if current_user["role"] not in ["teacher", "school_staff", "admin", "super_admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view student screening history")
    
    # Verify student exists
    student = await db.evep["evep.students"].find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Get all screenings for this student, ordered by creation date (newest first)
    screenings = await db.evep.school_screenings.find(
        {"student_id": student_id}
    ).sort("created_at", -1).to_list(length=None)
    
    # Format the response
    history = []
    for screening in screenings:
        history.append({
            "screening_id": screening.get("screening_id", str(screening["_id"])),
            "student_id": str(screening.get("student_id", "")),
            "student_name": screening.get("student_name", ""),
            "teacher_id": str(screening.get("teacher_id", "")),
            "teacher_name": screening.get("teacher_name", ""),
            "school_id": screening.get("school_id", ""),
            "school_name": screening.get("school_name", ""),
            "grade_level": screening.get("grade_level", ""),
            "screening_type": screening.get("screening_type", ""),
            "screening_date": screening.get("screening_date", ""),
            "status": screening.get("status", "pending"),
            "results": screening.get("results", []),
            "conclusion": screening.get("conclusion", ""),
            "recommendations": screening.get("recommendations", ""),
            "referral_needed": screening.get("referral_needed", False),
            "referral_notes": screening.get("referral_notes", ""),
            "notes": screening.get("notes", ""),
            "created_at": screening.get("created_at", ""),
            "updated_at": screening.get("updated_at", ""),
            "is_rescreen": screening.get("is_rescreen", False),
            "original_screening_id": screening.get("original_screening_id", "")
        })
    
    return {
        "student_info": {
            "student_id": str(student["_id"]),
            "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}",
            "grade_level": student.get('grade_level', ''),
            "school_name": student.get('school_name', '')
        },
        "screening_history": history,
        "total_screenings": len(history)
    }

@router.get("/school-screenings/stats/school/{school_id}")
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
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data"):
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

@router.get("/school-screenings/student/{student_id}")
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
    if await has_role_db(user_id, "teacher") or await has_permission_db(user_id, "manage_school_data"):
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

