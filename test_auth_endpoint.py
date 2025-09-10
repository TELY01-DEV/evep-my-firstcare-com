#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append('/app')

from app.core.database import get_database
from app.core.jwt_service import create_jwt_token
from bson import ObjectId
from datetime import timedelta

async def test_auth_endpoint():
    """Test the authentication endpoint logic"""
    
    # Create a test token
    token_data = {
        'user_id': '68be56ba02436c003c0a3df7',
        'username': 'super_admin',
        'role': 'super_admin',
        'permissions': ['all']
    }
    
    token = create_jwt_token(token_data, timedelta(hours=1))
    print(f'Created token: {token[:50]}...')
    
    # Test the endpoint logic directly
    db = get_database()
    
    # Get students who have completed school screening
    completed_screenings = await db.evep["school_screenings"].find({
        "status": "completed"
    }).to_list(length=None)
    
    print(f'Completed screenings: {len(completed_screenings)}')
    
    if not completed_screenings:
        print('No completed screenings found')
        return
    
    # Extract student IDs from completed screenings
    student_ids = [ObjectId(screening["student_id"]) for screening in completed_screenings]
    print(f'Student IDs: {student_ids}')
    
    # Check which students are already registered as patients
    existing_patients = await db.evep["student_patient_mapping"].find({
        "student_id": {"$in": student_ids},
        "status": "active"
    }).to_list(length=None)
    
    print(f'Existing patients: {len(existing_patients)}')
    
    # Get student IDs that are already registered as patients
    already_registered_ids = [mapping["student_id"] for mapping in existing_patients]
    
    # Filter out students who are already registered as patients
    available_student_ids = [sid for sid in student_ids if sid not in already_registered_ids]
    print(f'Available student IDs: {available_student_ids}')
    
    if not available_student_ids:
        print('No available students')
        return
    
    # Get student details for available students
    students = await db.evep["evep.students"].find({
        "_id": {"$in": available_student_ids},
        "status": "active"
    }).to_list(length=None)
    
    print(f'Found students: {len(students)}')
    for student in students:
        first_name = student.get('first_name', 'Unknown')
        last_name = student.get('last_name', 'Student')
        print(f'- {first_name} {last_name} (ID: {student["_id"]})')

if __name__ == "__main__":
    asyncio.run(test_auth_endpoint())
