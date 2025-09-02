#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def migrate_students():
    """Migrate students from evep_db to evep database with correct field structure"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    source_db = client.evep_db
    target_db = client.evep
    
    try:
        # Get all students from evep_db
        source_students = await source_db.students.find({}).to_list(length=None)
        print(f"📊 Found {len(source_students)} students in evep_db")
        
        # Migrate each student
        migrated_count = 0
        for student in source_students:
            # Create student with correct field structure
            migrated_student = {
                "first_name": student.get("first_name", ""),
                "last_name": student.get("last_name", ""),
                "student_code": student.get("student_code", ""),
                "grade_level": student.get("grade_level", ""),
                "school_name": student.get("school_name", ""),
                "birth_date": student.get("birth_date", ""),
                "gender": student.get("gender", ""),
                "parent_id": student.get("parent_id", ""),
                "status": "active",  # Set status to active
                "consent_status": "granted",  # Set default consent status
                "consent_date": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Insert into target database
            await target_db.students.insert_one(migrated_student)
            migrated_count += 1
            
            if migrated_count % 10 == 0:
                print(f"   Migrated {migrated_count} students...")
        
        print(f"✅ Successfully migrated {migrated_count} students to evep database")
        
        # Check final count
        final_count = await target_db.students.count_documents({})
        print(f"📊 Total students in evep database: {final_count}")
        
        # Show sample migrated students
        sample_students = await target_db.students.find({}, {"first_name": 1, "last_name": 1, "gender": 1, "status": 1}).limit(5).to_list(length=5)
        print(f"\n📋 Sample Migrated Students:")
        for student in sample_students:
            name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            print(f"   - {name} ({student.get('gender', 'unknown')}) - Status: {student.get('status', 'unknown')}")
        
    except Exception as e:
        print(f"❌ Error migrating students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_students())

