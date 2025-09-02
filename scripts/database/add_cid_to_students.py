#!/usr/bin/env python3
import asyncio
import aiohttp
import random
from motor.motor_asyncio import AsyncIOMotorClient

def generate_thai_cid():
    """Generate a realistic Thai Citizen ID number (13 digits)"""
    # Thai CID format: 1-2345-67890-12-3
    # First digit: 1-8 (1=born 1900-1999, 2=born 2000-2099, etc.)
    # Next 4 digits: province code
    # Next 5 digits: sequential number
    # Next 2 digits: check digit
    # Last digit: verification digit
    
    # Generate first digit (1-8)
    first_digit = random.randint(1, 8)
    
    # Generate province code (4 digits)
    province_code = random.randint(1000, 9999)
    
    # Generate sequential number (5 digits)
    sequential = random.randint(10000, 99999)
    
    # Generate check digits (2 digits)
    check_digits = random.randint(10, 99)
    
    # Generate verification digit (1 digit)
    verification = random.randint(0, 9)
    
    # Combine all parts
    cid = f"{first_digit}{province_code:04d}{sequential:05d}{check_digits:02d}{verification}"
    
    return cid

async def add_cid_to_students():
    """Add CID numbers to all existing students using the API endpoint"""
    
    # Connect to MongoDB to get all students
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://localhost:8014/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in")
        
        # Get all students
        students = await db.students.find({}).to_list(length=None)
        print(f"📊 Found {len(students)} students to update")
        
        # Update each student with CID
        updated_count = 0
        failed_count = 0
        
        for student in students:
            try:
                # Generate CID
                cid = generate_thai_cid()
                
                # Prepare update data
                update_data = {
                    "title": "เด็ก",  # Default title for students
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "cid": cid,
                    "birth_date": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "student_code": student.get("student_code", ""),
                    "school_name": student.get("school_name", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": None,
                    "address": {
                        "street": "",
                        "sub_district": "",
                        "district": "",
                        "province": "",
                        "postal_code": ""
                    },
                    "disease": student.get("medical_history", ""),
                    "parent_id": student.get("parent_id", ""),
                    "consent_document": student.get("consent_status") == "granted",
                    "profile_photo": None,
                    "extra_photos": [],
                    "photo_metadata": None,
                    "status": "active"
                }
                
                # Update student via API
                student_id = str(student["_id"])
                update_response = await session.put(
                    f"http://localhost:8014/api/v1/evep/students/{student_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if update_response.status == 200:
                    updated_count += 1
                    name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                    print(f"✅ Updated {name} with CID: {cid}")
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
        students_with_cid = await db.students.count_documents({"cid": {"$exists": True, "$ne": ""}})
        print(f"   Students with CID after update: {students_with_cid}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_cid_to_students())

