#!/usr/bin/env python3
import asyncio
import aiohttp
import random
from datetime import datetime, timedelta

def generate_birth_date_from_age(age):
    """Generate a realistic birth date based on age"""
    # Calculate birth year (current year - age)
    current_year = datetime.now().year
    birth_year = current_year - age
    
    # Generate random month and day
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Using 28 to avoid month/day issues
    
    # Format as YYYY-MM-DD
    birth_date = f"{birth_year}-{month:02d}-{day:02d}"
    return birth_date

def generate_thai_birth_date(grade_level):
    """Generate birth date based on Thai grade level"""
    # Thai grade levels: ประถมศึกษาปีที่ 1-6, มัธยมศึกษาปีที่ 1-6
    # Typical ages: Prathom 1 = 6 years old, Prathom 6 = 11 years old
    # Mathayom 1 = 12 years old, Mathayom 6 = 17 years old
    
    current_year = datetime.now().year
    
    if 'ประถม' in grade_level:
        # Extract grade number
        try:
            grade_num = int(grade_level.split('ปีที่')[1].strip())
            age = 6 + grade_num - 1  # Prathom 1 = 6 years old
        except:
            age = random.randint(6, 11)  # Default Prathom age range
    elif 'มัธยม' in grade_level:
        try:
            grade_num = int(grade_level.split('ปีที่')[1].strip())
            age = 12 + grade_num - 1  # Mathayom 1 = 12 years old
        except:
            age = random.randint(12, 17)  # Default Mathayom age range
    else:
        # For international grades (1st Grade, 2nd Grade, etc.)
        try:
            grade_num = int(grade_level.split()[0])
            age = 6 + grade_num - 1  # 1st Grade = 6 years old
        except:
            age = random.randint(6, 12)  # Default age range
    
    birth_year = current_year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    
    birth_date = f"{birth_year}-{month:02d}-{day:02d}"
    return birth_date

async def add_birthdates_to_students():
    """Add birth dates to all students using the API endpoint"""
    
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
        
        # Get all students from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        students = await db.students.find({}).to_list(length=None)
        print(f"📊 Found {len(students)} students to update")
        
        # Update each student with birth date
        updated_count = 0
        failed_count = 0
        
        for student in students:
            try:
                # Generate birth date based on available information
                age = student.get('age')
                grade_level = student.get('grade_level', '')
                
                if age and isinstance(age, int):
                    # Use age if available
                    birth_date = generate_birth_date_from_age(age)
                else:
                    # Use grade level to estimate age
                    birth_date = generate_thai_birth_date(grade_level)
                
                # Prepare update data
                update_data = {
                    "title": student.get("title", "เด็ก"),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "cid": student.get("cid", ""),
                    "birth_date": birth_date,
                    "gender": student.get("gender", ""),
                    "student_code": student.get("student_code", ""),
                    "school_name": student.get("school_name", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": student.get("grade_number"),
                    "address": student.get("address", {
                        "street": "",
                        "sub_district": "",
                        "district": "",
                        "province": "",
                        "postal_code": ""
                    }),
                    "disease": student.get("disease"),
                    "parent_id": student.get("parent_id", ""),
                    "consent_document": student.get("consent_document", True),
                    "profile_photo": student.get("profile_photo"),
                    "extra_photos": student.get("extra_photos", []),
                    "photo_metadata": student.get("photo_metadata"),
                    "status": "active"
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
                    name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                    print(f"✅ Updated {name} with birth date: {birth_date}")
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
        students_with_birthdate = await db.students.count_documents({"birth_date": {"$exists": True, "$ne": ""}})
        print(f"   Students with birth date after update: {students_with_birthdate}")
        
        # Show sample updated students
        sample_students = await db.students.find({"birth_date": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Students with Birth Dates:")
        for student in sample_students:
            name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            birth_date = student.get('birth_date', '')
            age = student.get('age', 'N/A')
            grade = student.get('grade_level', 'N/A')
            print(f"   {name} - Birth Date: {birth_date}, Age: {age}, Grade: {grade}")
        
        client.close()

if __name__ == "__main__":
    asyncio.run(add_birthdates_to_students())

