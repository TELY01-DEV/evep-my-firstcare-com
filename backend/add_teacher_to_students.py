#!/usr/bin/env python3
import asyncio
import aiohttp
import random
from bson import ObjectId

# Grade level to subject mapping
GRADE_SUBJECT_MAPPING = {
    "2nd Grade": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "3rd Grade": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "4th Grade": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "5th Grade": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "ประถมศึกษา": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "มัธยมศึกษาตอนต้น": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "มัธยมศึกษาตอนปลาย": ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"],
    "Elementary": ["Mathematics", "Science", "English", "History", "Physical Education", "Art", "Music", "Computer Science"],
    "Middle School": ["Mathematics", "Science", "English", "History", "Physical Education", "Art", "Music", "Computer Science"],
    "High School": ["Mathematics", "Science", "English", "History", "Physical Education", "Art", "Music", "Computer Science"]
}

async def add_teacher_to_students():
    """Add teacher assignments to students using the API"""
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://backend:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in")
        
        # Get all students and teachers from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        students = await db.students.find({}).to_list(length=None)
        teachers = await db.teachers.find({}).to_list(length=None)
        
        print(f"📊 Found {len(students)} students and {len(teachers)} teachers")
        
        # Group teachers by school and subject
        teachers_by_school = {}
        for teacher in teachers:
            school = teacher.get('school', 'Unknown School')
            subject = teacher.get('position', '')
            
            if school not in teachers_by_school:
                teachers_by_school[school] = {}
            
            if subject not in teachers_by_school[school]:
                teachers_by_school[school][subject] = []
            
            teachers_by_school[school][subject].append(teacher)
        
        print(f"📋 Teachers grouped by school:")
        for school, subjects in teachers_by_school.items():
            print(f"   {school}: {len(subjects)} subjects")
            for subject, teacher_list in subjects.items():
                print(f"     {subject}: {len(teacher_list)} teachers")
        
        # Update each student with teacher assignment
        updated_count = 0
        failed_count = 0
        
        for student in students:
            try:
                student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                school_name = student.get('school_name', '')
                grade_level = student.get('grade_level', '')
                
                # Find suitable teachers for this student's school and grade
                suitable_teachers = []
                
                if school_name in teachers_by_school:
                    # Get subjects for this grade level
                    subjects = GRADE_SUBJECT_MAPPING.get(grade_level, [])
                    
                    # Find teachers in this school with matching subjects
                    for subject in subjects:
                        if subject in teachers_by_school[school_name]:
                            suitable_teachers.extend(teachers_by_school[school_name][subject])
                    
                    # If no subject match, get any teacher from the school
                    if not suitable_teachers:
                        for subject_teachers in teachers_by_school[school_name].values():
                            suitable_teachers.extend(subject_teachers)
                
                # If still no teachers, get any teacher
                if not suitable_teachers:
                    suitable_teachers = teachers
                
                # Select a random teacher
                selected_teacher = random.choice(suitable_teachers)
                teacher_id = str(selected_teacher["_id"])
                teacher_name = f"{selected_teacher.get('first_name', '')} {selected_teacher.get('last_name', '')}"
                
                # Prepare update data
                update_data = {
                    "title": student.get("title", ""),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "student_code": student.get("student_code", ""),
                    "grade_level": student.get("grade_level", ""),
                    "school_name": student.get("school_name", ""),
                    "birth_date": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "parent_id": student.get("parent_id", ""),
                    "status": student.get("status", ""),
                    "cid": student.get("cid", ""),
                    "address": student.get("address", {}),
                    "profile_photo": student.get("profile_photo", ""),
                    "extra_photos": student.get("extra_photos", []),
                    "photo_metadata": student.get("photo_metadata", {}),
                    "teacher_id": teacher_id
                }
                
                # Update student via API
                student_id = str(student["_id"])
                update_response = await session.put(
                    f"http://backend:8000/api/v1/evep/students/{student_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if update_response.status == 200:
                    updated_count += 1
                    print(f"✅ Updated {student_name} (Grade: {grade_level}) with Teacher: {teacher_name}")
                else:
                    failed_count += 1
                    error_text = await update_response.text()
                    print(f"❌ Failed to update student {student_id}: {error_text}")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating student: {e}")
        
        print(f"\n📊 Update Summary:")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Failed updates: {failed_count}")
        print(f"   Total students: {len(students)}")
        
        # Verify the updates
        students_with_teacher = await db.students.count_documents({"teacher_id": {"$exists": True, "$ne": ""}})
        print(f"   Students with teacher after update: {students_with_teacher}")
        
        # Show sample updated students
        sample_students = await db.students.find({"teacher_id": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Students with Teachers:")
        for student in sample_students:
            name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            teacher_id = student.get('teacher_id', 'N/A')
            grade_level = student.get('grade_level', 'N/A')
            school_name = student.get('school_name', 'N/A')
            
            # Get teacher name
            teacher_name = "Unknown"
            if teacher_id and teacher_id != 'N/A':
                teacher = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
                if teacher:
                    teacher_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
            
            print(f"   {name} - Grade: {grade_level}, School: {school_name}, Teacher: {teacher_name}")
        
        client.close()

if __name__ == "__main__":
    asyncio.run(add_teacher_to_students())
