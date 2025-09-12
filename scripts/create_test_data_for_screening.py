#!/usr/bin/env python3
"""
Create Test Data for Screening Tests
Creates patients, students, teachers, and schools using CRUD endpoints
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone
from bson import ObjectId
import sys
import os

API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class TestDataCreator:
    def __init__(self):
        self.session = None
        self.token = None
        self.created_data = {
            "patient_id": None,
            "student_id": None,
            "teacher_id": None,
            "school_id": None
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate and get access token"""
        print("🔐 Authenticating...")
        try:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("access_token")
                    print(f"✅ Authentication successful")
                    return True
                else:
                    print(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    async def make_request(self, method, endpoint, data=None, params=None):
        """Make authenticated API request"""
        headers = {"Authorization": f"Bearer {self.token}"}
        if data:
            headers["Content-Type"] = "application/json"
            
        try:
            async with self.session.request(
                method, f"{API_BASE_URL}{endpoint}", 
                json=data, params=params, headers=headers
            ) as response:
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                return {
                    "status": response.status,
                    "data": response_data,
                    "success": response.status < 400
                }
        except Exception as e:
            return {
                "status": 0,
                "data": str(e),
                "success": False
            }
    
    async def create_patient(self):
        """Create a test patient"""
        print("\n👤 Creating test patient...")
        
        patient_data = {
            "first_name": "Test",
            "last_name": "Patient",
            "date_of_birth": "2010-01-01",
            "gender": "male",
            "phone": "0812345678",
            "email": "test.patient@example.com",
            "address": "123 Test Street, Bangkok",
            "emergency_contact": {
                "name": "Emergency Contact",
                "phone": "0812345679",
                "relationship": "parent"
            },
            "medical_history": [],
            "allergies": [],
            "medications": []
        }
        
        result = await self.make_request("POST", "/api/v1/patients/", patient_data)
        
        if result["success"]:
            patient_id = result["data"].get("_id") or result["data"].get("id")
            self.created_data["patient_id"] = patient_id
            print(f"    ✅ Patient created: {patient_id}")
            return patient_id
        else:
            print(f"    ❌ Failed to create patient: {result['status']} - {result['data']}")
            return None
    
    async def create_school(self):
        """Create a test school"""
        print("\n🏫 Creating test school...")
        
        school_data = {
            "name": "Test School",
            "type": "elementary",
            "address": "456 School Street, Bangkok",
            "phone": "0212345678",
            "email": "info@testschool.ac.th",
            "principal_name": "Test Principal",
            "established_year": 2020,
            "student_count": 500,
            "teacher_count": 25,
            "facilities": ["library", "computer_lab", "playground"],
            "contact_person": {
                "name": "Test Contact",
                "position": "Administrator",
                "phone": "0212345679",
                "email": "contact@testschool.ac.th"
            }
        }
        
        result = await self.make_request("POST", "/api/v1/evep/schools", school_data)
        
        if result["success"]:
            school_id = result["data"].get("_id") or result["data"].get("id")
            self.created_data["school_id"] = school_id
            print(f"    ✅ School created: {school_id}")
            return school_id
        else:
            print(f"    ❌ Failed to create school: {result['status']} - {result['data']}")
            return None
    
    async def create_teacher(self):
        """Create a test teacher"""
        print("\n👨‍🏫 Creating test teacher...")
        
        teacher_data = {
            "first_name": "Test",
            "last_name": "Teacher",
            "email": "test.teacher@testschool.ac.th",
            "phone": "0812345680",
            "position": "Class Teacher",
            "subject": "General",
            "school_id": self.created_data["school_id"],
            "experience_years": 5,
            "qualifications": ["Bachelor of Education"],
            "certifications": ["Teaching License"],
            "address": "789 Teacher Street, Bangkok",
            "emergency_contact": {
                "name": "Teacher Emergency",
                "phone": "0812345681",
                "relationship": "spouse"
            }
        }
        
        result = await self.make_request("POST", "/api/v1/evep/teachers", teacher_data)
        
        if result["success"]:
            teacher_id = result["data"].get("_id") or result["data"].get("id")
            self.created_data["teacher_id"] = teacher_id
            print(f"    ✅ Teacher created: {teacher_id}")
            return teacher_id
        else:
            print(f"    ❌ Failed to create teacher: {result['status']} - {result['data']}")
            return None
    
    async def create_student(self):
        """Create a test student"""
        print("\n👦 Creating test student...")
        
        student_data = {
            "first_name": "Test",
            "last_name": "Student",
            "student_id": "TS001",
            "date_of_birth": "2015-05-15",
            "gender": "male",
            "grade_level": "Grade 1",
            "class_name": "1A",
            "school_id": self.created_data["school_id"],
            "teacher_id": self.created_data["teacher_id"],
            "parent_contact": {
                "father_name": "Test Father",
                "father_phone": "0812345682",
                "mother_name": "Test Mother",
                "mother_phone": "0812345683",
                "emergency_contact": "0812345684"
            },
            "address": "321 Student Street, Bangkok",
            "medical_info": {
                "blood_type": "O+",
                "allergies": [],
                "medications": [],
                "medical_conditions": []
            },
            "enrollment_date": "2024-01-01",
            "status": "active"
        }
        
        result = await self.make_request("POST", "/api/v1/evep/students", student_data)
        
        if result["success"]:
            student_id = result["data"].get("_id") or result["data"].get("id")
            self.created_data["student_id"] = student_id
            print(f"    ✅ Student created: {student_id}")
            return student_id
        else:
            print(f"    ❌ Failed to create student: {result['status']} - {result['data']}")
            return None
    
    async def create_all_test_data(self):
        """Create all test data in the correct order"""
        print("🚀 Creating Test Data for Screening Tests")
        print("=" * 50)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Create data in dependency order
        await self.create_school()
        await self.create_teacher()
        await self.create_student()
        await self.create_patient()
        
        print("\n📋 Created Test Data Summary:")
        for key, value in self.created_data.items():
            if value:
                print(f"   {key}: {value}")
            else:
                print(f"   {key}: ❌ Not created")
        
        return True

async def main():
    """Main function to create test data"""
    async with TestDataCreator() as creator:
        await creator.create_all_test_data()

if __name__ == "__main__":
    asyncio.run(main())
