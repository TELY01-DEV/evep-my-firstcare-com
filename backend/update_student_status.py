#!/usr/bin/env python3
"""
Update student status field
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def update_student_status():
    """Add status field to students"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔧 Updating student status field...")
    
    # Get students without status field
    students_without_status = await db.students.find({"status": {"$exists": False}}).to_list(length=None)
    
    print(f"📊 Found {len(students_without_status)} students without status field")
    
    if len(students_without_status) == 0:
        print("✅ All students already have status field")
        return
    
    updated_count = 0
    
    for student in students_without_status:
        # Update student with status field
        result = await db.students.update_one(
            {"_id": student["_id"]},
            {
                "$set": {
                    "status": "active",
                    "updated_at": datetime.now().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Updated student: {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')} - Status: active")
    
    print(f"\n📈 Update Summary:")
    print(f"   Students updated: {updated_count}")
    
    # Verify the update
    students_after = await db.students.find().to_list(length=None)
    active_students = len([s for s in students_after if s.get('status') == 'active'])
    
    print(f"   Students with active status: {active_students}")
    print(f"   Total students: {len(students_after)}")

if __name__ == "__main__":
    asyncio.run(update_student_status())
