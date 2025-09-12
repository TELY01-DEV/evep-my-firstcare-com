#!/usr/bin/env python3
"""
Debug evep.students collection
"""

import asyncio
import motor.motor_asyncio

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def debug_evep_students():
    """Debug evep.students collection"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Debugging evep.students collection...")
    
    # Get all students
    all_students = await db.evep.students.find().to_list(length=None)
    print(f"📊 Total students in evep.students: {len(all_students)}")
    
    # Get students with status active
    active_students = await db.evep.students.find({"status": "active"}).to_list(length=None)
    print(f"📊 Students with status 'active': {len(active_students)}")
    
    # Check all status values
    status_values = set()
    for student in all_students:
        status_values.add(student.get('status'))
    print(f"🔍 Status values found: {status_values}")
    
    # Show first 10 students with their status
    print("\n👤 First 10 students:")
    for i, student in enumerate(all_students[:10]):
        print(f"   {i+1}. {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')} - Status: '{student.get('status', 'MISSING')}'")
    
    # Check if there are any students without status
    students_without_status = await db.evep.students.find({"status": {"$exists": False}}).to_list(length=None)
    print(f"\n📊 Students without status field: {len(students_without_status)}")
    
    # Check if there are any students with null status
    students_with_null_status = await db.evep.students.find({"status": None}).to_list(length=None)
    print(f"📊 Students with null status: {len(students_with_null_status)}")

if __name__ == "__main__":
    asyncio.run(debug_evep_students())
