#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_students_status():
    """Update existing students with status field"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Update all students to have status "active"
        result = await db.students.update_many(
            {"status": {"$exists": False}},
            {"$set": {"status": "active"}}
        )
        
        print(f"✅ Updated {result.modified_count} students with status 'active'")
        
        # Check total students
        total_students = await db.students.count_documents({})
        active_students = await db.students.count_documents({"status": "active"})
        
        print(f"\n📊 Student Status Summary:")
        print(f"   Total Students: {total_students}")
        print(f"   Active Students: {active_students}")
        
        # Show sample students
        students = await db.students.find({"status": "active"}, {"name": 1, "gender": 1, "consent_status": 1, "status": 1}).limit(5).to_list(length=5)
        print(f"\n📋 Sample Active Students:")
        for student in students:
            print(f"   - {student.get('name', 'Unknown')} ({student.get('gender', 'Unknown')}) - Status: {student.get('status', 'Unknown')}")
        
    except Exception as e:
        print(f"❌ Error updating students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(update_students_status())

