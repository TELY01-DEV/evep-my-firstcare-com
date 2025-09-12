#!/usr/bin/env python3
"""
Script to check student data and test the school screening API
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import requests
import json

async def check_student_data():
    """Check if student exists in database"""
    # MongoDB connection
    client = AsyncIOMotorClient('mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin')
    db = client.evep
    
    student_id = '68be9b7219d48ff5ee0bed2e'
    print(f"Checking student ID: {student_id}")
    
    try:
        # Check in students collection
        student = await db.students.find_one({"_id": ObjectId(student_id)})
        print(f"Student in students collection: {student is not None}")
        if student:
            print(f"Student name: {student.get('first_name', '')} {student.get('last_name', '')}")
            print(f"Student school: {student.get('school_name', '')}")
        
        # Check in patients collection
        patient = await db.patients.find_one({"_id": ObjectId(student_id)})
        print(f"Student in patients collection: {patient is not None}")
        if patient:
            print(f"Patient name: {patient.get('first_name', '')} {patient.get('last_name', '')}")
        
        # Count documents
        student_count = await db.students.count_documents({})
        patient_count = await db.patients.count_documents({})
        print(f"Total students: {student_count}")
        print(f"Total patients: {patient_count}")
        
        # List some students
        print("\nSample students:")
        students = await db.students.find({}).limit(3).to_list(3)
        for s in students:
            print(f"  - {s['_id']}: {s.get('first_name', '')} {s.get('last_name', '')}")
            
    except Exception as e:
        print(f"Error checking database: {e}")
    finally:
        client.close()

def test_api():
    """Test the school screening API"""
    print("\n" + "="*50)
    print("Testing School Screening API")
    print("="*50)
    
    # Get auth token first
    auth_url = "https://stardust.evep.my-firstcare.com/api/v1/auth/login"
    auth_data = {
        "email": "admin@evep.com",
        "password": "admin123"
    }
    
    try:
        # Login to get token
        auth_response = requests.post(auth_url, json=auth_data)
        if auth_response.status_code == 200:
            token = auth_response.json().get("access_token")
            print(f"Auth token obtained: {token[:20]}...")
            
            # Test school screening creation
            screening_url = "https://stardust.evep.my-firstcare.com/api/v1/evep/school-screenings"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            screening_data = {
                "student_id": "68be9b7219d48ff5ee0bed2e",
                "teacher_id": "68bfc3c537fc1d904d08069e",
                "school_name": "โรงเรียนอนุบาลกรุงเทพ",
                "screening_type": "basic_school",
                "screening_date": "2025-09-10T10:56:55.682Z",
                "notes": "Test screening"
            }
            
            print(f"Sending screening data: {json.dumps(screening_data, indent=2)}")
            
            response = requests.post(screening_url, json=screening_data, headers=headers)
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
        else:
            print(f"Auth failed: {auth_response.status_code} - {auth_response.text}")
            
    except Exception as e:
        print(f"API test error: {e}")

if __name__ == "__main__":
    print("Checking student data...")
    asyncio.run(check_student_data())
    test_api()
