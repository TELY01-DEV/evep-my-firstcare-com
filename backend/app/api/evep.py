from fastapi import APIRouter, HTTPException, Depends, Request, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, date

from app.models.evep_models import (
    Parent, ParentResponse, Student, StudentResponse, 
    Teacher, TeacherResponse, School, SchoolResponse
)
from app.core.database import get_database
from app.core.security import log_security_event
from app.utils.timezone import get_current_thailand_time
from app.api.auth import get_current_user

router = APIRouter()

# ==================== PARENTS CRUD ENDPOINTS ====================

@router.get("/parents")
async def get_parents(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all parents with pagination"""
    db = get_database()
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view parents")
    parents = await db.evep.parents.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
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
    total_count = await db.evep.parents.count_documents({"status": "active"})
    return {"parents": result, "total_count": total_count}

@router.get("/parents/{parent_id}")
async def get_parent(
    parent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific parent by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view parent details")
    parent = await db.evep.parents.find_one({"_id": ObjectId(parent_id)})
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create parent")
    
    # Prepare parent data
    parent_dict = parent_data.model_dump()
    parent_dict["created_at"] = get_current_thailand_time()
    parent_dict["updated_at"] = get_current_thailand_time()
    parent_dict["status"] = "active"
    
    # Insert parent
    result = await db.evep.parents.insert_one(parent_dict)
    
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update parent")
    
    # Check if parent exists
    existing_parent = await db.evep.parents.find_one({"_id": ObjectId(parent_id)})
    if not existing_parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    # Update parent data
    update_data = parent_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.parents.update_one(
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view students")
    students = await db.evep.students.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    result = []
    for student in students:
        result.append({
            "id": str(student["_id"]),
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "school_name": student.get("school_name", ""),
            "birth_date": student.get("birth_date", ""),
            "gender": student.get("gender", ""),
            "parent_id": str(student.get("parent_id", "")),
            "status": student.get("status", "")
        })
    total_count = await db.evep.students.count_documents({"status": "active"})
    return {"students": result, "total_count": total_count}

@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific student by ID"""
    db = get_database()
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to view student details")
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return {
        "id": str(student["_id"]),
        "first_name": student.get("first_name", ""),
        "last_name": student.get("last_name", ""),
        "student_code": student.get("student_code", ""),
        "grade_level": student.get("grade_level", ""),
        "school_name": student.get("school_name", ""),
        "birth_date": student.get("birth_date", ""),
        "gender": student.get("gender", ""),
        "parent_id": str(student.get("parent_id", "")),
        "status": student.get("status", "")
    }

@router.post("/students")
async def create_student(
    student_data: Student,
    current_user: dict = Depends(get_current_user)
):
    """Create a new student"""
    db = get_database()
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to create student")
    
    # Prepare student data
    student_dict = student_data.model_dump()
    student_dict["created_at"] = get_current_thailand_time()
    student_dict["updated_at"] = get_current_thailand_time()
    student_dict["status"] = "active"
    
    # Insert student
    result = await db.evep.students.insert_one(student_dict)
    
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to update student")
    
    # Check if student exists
    existing_student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not existing_student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Update student data
    update_data = student_data.model_dump()
    update_data["updated_at"] = get_current_thailand_time()
    
    result = await db.evep.students.update_one(
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions to delete student")
    
    # Check if student exists
    existing_student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not existing_student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Soft delete by setting status to inactive
    result = await db.evep.students.update_one(
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "system_admin", "medical_admin", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view teacher-student relationships"
        )
    
    # Teachers can only view their own students
    if current_user["role"] == "teacher" and current_user["user_id"] != teacher_id:
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
    if current_user["role"] not in ["admin", "teacher"]:
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
    if current_user["role"] not in ["admin", "teacher"]:
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
    if current_user["role"] not in ["admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "parent", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view parent-student relationships"
        )
    
    # Parents can only view their own children
    if current_user["role"] == "parent" and current_user["user_id"] != parent_id:
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


# ==================== BASIC CRUD ENDPOINTS ====================

# Students CRUD
@router.get("/students")
async def get_students(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all students with pagination"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view students"
        )
    
    # Get students with pagination
    students = await db.evep.students.find({"status": "active"}).skip(skip).limit(limit).to_list(length=None)
    
    result = []
    for student in students:
        result.append({
            "id": str(student["_id"]),
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "student_code": student.get("student_code", ""),
            "grade_level": student.get("grade_level", ""),
            "school_name": student.get("school_name", ""),
            "birth_date": student.get("birth_date", ""),
            "gender": student.get("gender", ""),
            "parent_id": str(student.get("parent_id", "")),
            "status": student.get("status", "")
        })
    
    total_count = await db.evep.students.count_documents({"status": "active"})
    
    return {"students": result, "total_count": total_count}


@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific student by ID"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "teacher", "medical_staff", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view student details"
        )
    
    student = await db.evep.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return {
        "id": str(student["_id"]),
        "first_name": student.get("first_name", ""),
        "last_name": student.get("last_name", ""),
        "student_code": student.get("student_code", ""),
        "grade_level": student.get("grade_level", ""),
        "school_name": student.get("school_name", ""),
        "birth_date": student.get("birth_date", ""),
        "gender": student.get("gender", ""),
        "parent_id": str(student.get("parent_id", "")),
        "status": student.get("status", "")
    }


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
    if current_user["role"] not in ["admin", "teacher", "medical_staff", "doctor"]:
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
    if current_user["role"] not in ["admin", "teacher", "medical_staff", "doctor"]:
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
