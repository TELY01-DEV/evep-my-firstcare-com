#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_screening_system():
    """Check the current screening system structure"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check for existing screening collections
        collections = await db.list_collection_names()
        print(f"📊 Available Collections: {collections}")
        
        # Check for screening-related collections
        screening_collections = [col for col in collections if 'screen' in col.lower()]
        print(f"📋 Screening Collections: {screening_collections}")
        
        # Check if screenings collection exists
        if 'screenings' in collections:
            screenings_count = await db.screenings.count_documents({})
            print(f"📊 Total Screenings: {screenings_count}")
            
            if screenings_count > 0:
                # Show sample screening
                sample_screening = await db.screenings.find_one({})
                print(f"\n📋 Sample Screening Structure:")
                for field, value in sample_screening.items():
                    print(f"   {field}: {value}")
        else:
            print("❌ No screenings collection found")
        
        # Check for screening models in the codebase
        print(f"\n🔍 Checking for screening models...")
        
        # Check students and teachers for screening capabilities
        students_count = await db.students.count_documents({})
        teachers_count = await db.teachers.count_documents({})
        
        print(f"📊 Students available for screening: {students_count}")
        print(f"📊 Teachers available to conduct screening: {teachers_count}")
        
        # Show sample student and teacher
        if students_count > 0:
            sample_student = await db.students.find_one({})
            print(f"\n📋 Sample Student for Screening:")
            print(f"   ID: {sample_student.get('_id')}")
            print(f"   Name: {sample_student.get('first_name', '')} {sample_student.get('last_name', '')}")
            print(f"   School: {sample_student.get('school_name', '')}")
            print(f"   Grade: {sample_student.get('grade_level', '')}")
            print(f"   Teacher ID: {sample_student.get('teacher_id', 'N/A')}")
        
        if teachers_count > 0:
            sample_teacher = await db.teachers.find_one({})
            print(f"\n📋 Sample Teacher for Screening:")
            print(f"   ID: {sample_teacher.get('_id')}")
            print(f"   Name: {sample_teacher.get('first_name', '')} {sample_teacher.get('last_name', '')}")
            print(f"   School: {sample_teacher.get('school', '')}")
            print(f"   Position: {sample_teacher.get('position', '')}")
        
    except Exception as e:
        print(f"❌ Error checking screening system: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_screening_system())

