#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_student_fields():
    """Fix student field names to match API expectations"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all students
        students = await db.students.find({}).to_list(length=None)
        
        for student in students:
            # Split name into first_name and last_name
            full_name = student.get("name", "")
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            # Update student with correct field names
            update_data = {
                "first_name": first_name,
                "last_name": last_name,
                "student_code": student.get("student_id", ""),
                "grade_level": student.get("grade", ""),
                "school_name": student.get("school", ""),
                "birth_date": "",  # We don't have this in our demo data
                "gender": student.get("gender", ""),
                "parent_id": "",  # We don't have parent_id in our demo data
                "status": "active"
            }
            
            # Update the student
            await db.students.update_one(
                {"_id": student["_id"]},
                {"$set": update_data}
            )
        
        print(f"✅ Updated {len(students)} students with correct field names")
        
        # Show sample updated student
        sample_student = await db.students.find_one({})
        if sample_student:
            print(f"\n📋 Sample Updated Student:")
            print(f"   ID: {sample_student['_id']}")
            print(f"   First Name: {sample_student.get('first_name', 'N/A')}")
            print(f"   Last Name: {sample_student.get('last_name', 'N/A')}")
            print(f"   Student Code: {sample_student.get('student_code', 'N/A')}")
            print(f"   Grade Level: {sample_student.get('grade_level', 'N/A')}")
            print(f"   School: {sample_student.get('school_name', 'N/A')}")
            print(f"   Gender: {sample_student.get('gender', 'N/A')}")
            print(f"   Status: {sample_student.get('status', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Error fixing student fields: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_student_fields())

