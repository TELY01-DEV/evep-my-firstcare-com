#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_student_teacher_school():
    """Check current student data and what teacher/school fields are missing"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all students
        all_students = await db.students.find({}).to_list(length=None)
        total_students = len(all_students)
        
        print(f"📊 Total Students: {total_students}")
        
        if total_students == 0:
            print("❌ No students found in database")
            return
        
        # Check each field status
        students_with_teacher = []
        students_without_teacher = []
        students_with_school = []
        students_without_school = []
        
        for student in all_students:
            # Check teacher_id
            teacher_id = student.get('teacher_id', '')
            if teacher_id and teacher_id.strip():
                students_with_teacher.append(student)
            else:
                students_without_teacher.append(student)
            
            # Check school_name
            school_name = student.get('school_name', '')
            if school_name and school_name.strip():
                students_with_school.append(student)
            else:
                students_without_school.append(student)
        
        print(f"\n📋 Field Status Summary:")
        print(f"   Students with teacher_id: {len(students_with_teacher)}")
        print(f"   Students without teacher_id: {len(students_without_teacher)}")
        print(f"   Students with school_name: {len(students_with_school)}")
        print(f"   Students without school_name: {len(students_without_school)}")
        
        # Show sample students
        print(f"\n📋 Sample Students:")
        for i, student in enumerate(all_students[:5]):
            name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            teacher_id = student.get('teacher_id', 'N/A')
            school_name = student.get('school_name', 'N/A')
            grade_level = student.get('grade_level', 'N/A')
            
            print(f"   {i+1}. {name}")
            print(f"      Teacher ID: {teacher_id}")
            print(f"      School Name: {school_name}")
            print(f"      Grade Level: {grade_level}")
            print()
        
        # Show complete field structure of first student
        if all_students:
            print(f"📋 Complete Field Structure (First Student):")
            first_student = all_students[0]
            for field, value in first_student.items():
                print(f"   {field}: {value}")
        
        # Check available teachers
        all_teachers = await db.teachers.find({}).to_list(length=None)
        print(f"\n📊 Available Teachers: {len(all_teachers)}")
        
        # Show sample teachers
        print(f"📋 Sample Teachers:")
        for i, teacher in enumerate(all_teachers[:5]):
            name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
            teacher_id = str(teacher.get('_id', ''))
            school = teacher.get('school', 'N/A')
            subject = teacher.get('position', 'N/A')
            
            print(f"   {i+1}. {name} (ID: {teacher_id[:8]}...)")
            print(f"      School: {school}")
            print(f"      Subject: {subject}")
            print()
        
    except Exception as e:
        print(f"❌ Error checking student data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_student_teacher_school())

