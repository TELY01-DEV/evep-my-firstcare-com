#!/usr/bin/env python3
"""
Check student status values
"""

import asyncio
import motor.motor_asyncio

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def check_student_status():
    """Check student status values"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Checking student status values...")
    
    # Get all students
    students = await db.students.find().to_list(length=None)
    
    print(f"📊 Found {len(students)} students")
    
    if len(students) == 0:
        print("❌ No students found in database")
        return
    
    # Check status values
    status_values = set(s.get('status') for s in students)
    print(f"🔍 Status values found: {status_values}")
    
    # Count by status
    for status in status_values:
        count = len([s for s in students if s.get('status') == status])
        print(f"   Status '{status}': {count} students")
    
    # Check first few students
    for i, student in enumerate(students[:3]):
        print(f"\n👤 Student {i+1}:")
        print(f"   Name: {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')}")
        print(f"   Status: {student.get('status', 'MISSING')}")
        print(f"   All fields: {list(student.keys())}")

if __name__ == "__main__":
    asyncio.run(check_student_status())
