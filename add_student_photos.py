#!/usr/bin/env python3
import asyncio
import aiohttp
import random

def generate_profile_photo_url(student_name, gender):
    """Generate a realistic profile photo URL based on student name and gender"""
    # Use a placeholder image service that generates avatars
    # This creates realistic-looking profile photos for demonstration
    
    # Clean the name for URL
    clean_name = student_name.replace(' ', '').replace('์', '').replace('่', '').replace('้', '').replace('๊', '').replace('๋', '')
    
    # Generate a random seed for consistent photos
    seed = hash(clean_name) % 10000
    
    # Use DiceBear API for avatar generation
    if gender.lower() in ['male', 'm', 'ชาย']:
        style = 'avataaars'  # More cartoon-like for children
    else:
        style = 'avataaars'  # Same style for consistency
    
    # Generate avatar URL
    photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
    
    return photo_url

def generate_extra_photos(student_name, count=2):
    """Generate extra photo URLs for students"""
    extra_photos = []
    
    # Generate 1-3 extra photos
    for i in range(count):
        # Use different styles for variety
        styles = ['bottts', 'pixel-art', 'identicon']
        style = random.choice(styles)
        
        # Generate different seed for each photo
        seed = hash(f"{student_name}{i}") % 10000
        
        photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
        extra_photos.append(photo_url)
    
    return extra_photos

def generate_photo_metadata(student_name, photo_type="profile"):
    """Generate photo metadata"""
    metadata = {
        "upload_date": "2025-08-31T16:00:00Z",
        "file_size": random.randint(50000, 200000),  # 50KB to 200KB
        "dimensions": {
            "width": 400,
            "height": 400
        },
        "format": "svg",
        "description": f"{photo_type.title()} photo for {student_name}",
        "tags": ["student", "profile", "avatar"],
        "uploaded_by": "system",
        "is_public": True
    }
    
    return metadata

async def add_student_photos():
    """Add profile photos to students using the API"""
    
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
        
        # Update each student with profile photo
        updated_count = 0
        failed_count = 0
        
        for student in students:
            try:
                # Generate profile photo and metadata
                student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                gender = student.get('gender', '')
                
                profile_photo = generate_profile_photo_url(student_name, gender)
                extra_photos = generate_extra_photos(student_name, random.randint(1, 3))
                photo_metadata = generate_photo_metadata(student_name, "profile")
                
                # Prepare update data
                update_data = {
                    "title": student.get("title", "เด็ก"),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "cid": student.get("cid", ""),
                    "birth_date": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "student_code": student.get("student_code", ""),
                    "school_name": student.get("school_name", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": student.get("grade_number"),
                    "address": student.get("address", {
                        "house_no": "",
                        "village_no": "",
                        "soi": "",
                        "road": "",
                        "sub_district": "",
                        "district": "",
                        "province": "",
                        "postal_code": ""
                    }),
                    "disease": student.get("disease"),
                    "parent_id": student.get("parent_id", ""),
                    "consent_document": student.get("consent_document", True),
                    "profile_photo": profile_photo,
                    "extra_photos": extra_photos,
                    "photo_metadata": photo_metadata,
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
                    print(f"✅ Updated {student_name} with profile photo: {profile_photo[:50]}...")
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
        students_with_photo = await db.students.count_documents({"profile_photo": {"$exists": True, "$ne": ""}})
        students_with_extra_photos = await db.students.count_documents({"extra_photos": {"$exists": True, "$ne": []}})
        print(f"   Students with profile photo after update: {students_with_photo}")
        print(f"   Students with extra photos after update: {students_with_extra_photos}")
        
        # Show sample updated students
        sample_students = await db.students.find({"profile_photo": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Students with Profile Photos:")
        for student in sample_students:
            name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            profile_photo = student.get('profile_photo', '')
            extra_photos_count = len(student.get('extra_photos', []))
            print(f"   {name} - Profile: {profile_photo[:50]}..., Extra: {extra_photos_count} photos")
        
        client.close()

if __name__ == "__main__":
    asyncio.run(add_student_photos())

