#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_student_photos():
    """Check which students are missing profile photos"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all students
        all_students = await db.students.find({}).to_list(length=None)
        total_students = len(all_students)
        
        print(f"📊 Total Students: {total_students}")
        
        # Check profile photo status
        students_with_photo = []
        students_without_photo = []
        
        for student in all_students:
            profile_photo = student.get('profile_photo', '')
            if profile_photo and profile_photo.strip():
                students_with_photo.append(student)
            else:
                students_without_photo.append(student)
        
        print(f"\n📸 Profile Photo Status:")
        print(f"   Students with profile photo: {len(students_with_photo)}")
        print(f"   Students without profile photo: {len(students_without_photo)}")
        
        # Show sample students with photos
        if students_with_photo:
            print(f"\n✅ Sample Students with Profile Photos:")
            for i, student in enumerate(students_with_photo[:5]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                photo = student.get('profile_photo', '')
                print(f"   {i+1}. {name} - Photo: {photo[:50]}...")
        
        # Show sample students without photos
        if students_without_photo:
            print(f"\n❌ Sample Students without Profile Photos:")
            for i, student in enumerate(students_without_photo[:10]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        # Check extra photos status
        students_with_extra_photos = []
        students_without_extra_photos = []
        
        for student in all_students:
            extra_photos = student.get('extra_photos', [])
            if extra_photos and len(extra_photos) > 0:
                students_with_extra_photos.append(student)
            else:
                students_without_extra_photos.append(student)
        
        print(f"\n📸 Extra Photos Status:")
        print(f"   Students with extra photos: {len(students_with_extra_photos)}")
        print(f"   Students without extra photos: {len(students_without_extra_photos)}")
        
        # Show complete field structure of first student
        if all_students:
            print(f"\n📋 Complete Photo Fields (First Student):")
            first_student = all_students[0]
            photo_fields = ['profile_photo', 'extra_photos', 'photo_metadata']
            for field in photo_fields:
                value = first_student.get(field, 'N/A')
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking student photos: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_student_photos())
