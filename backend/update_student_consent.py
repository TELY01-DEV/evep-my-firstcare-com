#!/usr/bin/env python3
"""
Update student consent values
"""

import asyncio
import motor.motor_asyncio
import random
from datetime import datetime

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def update_student_consent():
    """Update student consent values"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔧 Updating student consent values...")
    
    # Get all students
    students = await db.students.find().to_list(length=None)
    
    print(f"📊 Found {len(students)} students")
    
    if len(students) == 0:
        print("❌ No students found in database")
        return
    
    updated_count = 0
    
    for student in students:
        # Randomly assign consent (70% with consent, 30% without)
        has_consent = random.choice([True, True, True, False, False, False, False])
        
        # Update student with consent value
        result = await db.students.update_one(
            {"_id": student["_id"]},
            {
                "$set": {
                    "consent_document": has_consent,
                    "updated_at": datetime.now().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Updated student: {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')} - Consent: {has_consent}")
    
    print(f"\n📈 Update Summary:")
    print(f"   Students updated: {updated_count}")
    
    # Verify the update
    students_after = await db.students.find().to_list(length=None)
    with_consent = len([s for s in students_after if s.get('consent_document') == True])
    without_consent = len([s for s in students_after if s.get('consent_document') == False])
    
    print(f"   Students with consent: {with_consent}")
    print(f"   Students without consent: {without_consent}")

if __name__ == "__main__":
    asyncio.run(update_student_consent())
