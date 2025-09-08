#!/usr/bin/env python3
"""
Create Corrected Test Data for Screening Tests
Creates patients, students, teachers, and schools using correct data models
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

class CorrectedTestDataCreator:
    def __init__(self):
        self.session = None
        self.token = None
        self.created_data = {
            "patient_id": None,
            "student_id": None,
            "teacher_id": None,
            "school_id": None,
            "parent_id": None
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
        """Create a test patient with correct model"""
        print("\n👤 Creating test patient...")
        
        patient_data = {
            "patient_id": f"PAT{str(ObjectId())[:8].upper()}",
            "name": "Test Patient",
            "date_of_birth": "2010-01-01",
            "gender": "male",
            "contact_info": {
                "phone": "0812345678",
                "email": "test.patient@example.com",
                "address": "123 Test Street, Bangkok"
            },
            "medical_history": {
                "allergies": [],
                "medications": [],
                "conditions": []
            },
            "assigned_doctor": None,
            "notes": "Test patient for screening tests"
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
        """Create a test school with correct model"""
        print("\n🏫 Creating test school...")
        
        school_data = {
            "school_code": f"SCH{str(ObjectId())[:8].upper()}",
            "name": "Test School",
            "type": "elementary",
            "address": {
                "house_no": "123",
                "village_no": "1",
                "soi": "Test Soi",
                "road": "Test Road",
                "subdistrict": "Test Subdistrict",
                "district": "Test District",
                "province": "Bangkok",
                "postal_code": "10110"
            },
            "phone": "0212345678",
            "email": "info@testschool.ac.th"
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
    
    async def create_parent(self):
        """Create a test parent with correct model"""
        print("\n👨‍👩‍👧‍👦 Creating test parent...")
        
        parent_data = {
            "title": "Mr.",
            "first_name": "Test",
            "last_name": "Parent",
            "cid": f"123456789012{str(ObjectId())[:2]}",
            "birth_date": "1985-01-01",
            "gender": "male",
            "phone": "0812345680",
            "email": "test.parent@example.com",
            "relation": "father",
            "occupation": "Engineer",
            "income_level": "middle",
            "address": {
                "house_no": "456",
                "village_no": "2",
                "soi": "Parent Soi",
                "road": "Parent Road",
                "subdistrict": "Parent Subdistrict",
                "district": "Parent District",
                "province": "Bangkok",
                "postal_code": "10120"
            },
            "emergency_contact": {
                "name": "Emergency Contact",
                "phone": "0812345681",
                "relation": "spouse"
            }
        }
        
        result = await self.make_request("POST", "/api/v1/evep/parents", parent_data)
        
        if result["success"]:
            parent_id = result["data"].get("_id") or result["data"].get("id")
            self.created_data["parent_id"] = parent_id
            print(f"    ✅ Parent created: {parent_id}")
            return parent_id
        else:
            print(f"    ❌ Failed to create parent: {result['status']} - {result['data']}")
            return None
    
    async def create_teacher(self):
        """Create a test teacher with correct model"""
        print("\n👨‍🏫 Creating test teacher...")
        
        teacher_data = {
            "title": "Mr.",
            "first_name": "Test",
            "last_name": "Teacher",
            "cid": f"987654321098{str(ObjectId())[:2]}",
            "birth_date": "1980-01-01",
            "gender": "male",
            "phone": "0812345682",
            "email": "test.teacher@testschool.ac.th",
            "school": "Test School",
            "position": "Class Teacher",
            "school_year": "2024",
            "work_address": {
                "house_no": "789",
                "village_no": "3",
                "soi": "Teacher Soi",
                "road": "Teacher Road",
                "subdistrict": "Teacher Subdistrict",
                "district": "Teacher District",
                "province": "Bangkok",
                "postal_code": "10130"
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
        """Create a test student with correct model"""
        print("\n👦 Creating test student...")
        
        student_data = {
            "title": "Master",
            "first_name": "Test",
            "last_name": "Student",
            "cid": f"111222333444{str(ObjectId())[:2]}",
            "birth_date": "2015-05-15",
            "gender": "male",
            "student_code": f"STU{str(ObjectId())[:8].upper()}",
            "school_name": "Test School",
            "grade_level": "Grade 1",
            "grade_number": "1",
            "address": {
                "house_no": "321",
                "village_no": "4",
                "soi": "Student Soi",
                "road": "Student Road",
                "subdistrict": "Student Subdistrict",
                "district": "Student District",
                "province": "Bangkok",
                "postal_code": "10140"
            },
            "disease": None,
            "parent_id": self.created_data["parent_id"],
            "teacher_id": self.created_data["teacher_id"],
            "consent_document": True
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
        print("🚀 Creating Corrected Test Data for Screening Tests")
        print("=" * 60)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Create data in dependency order
        await self.create_school()
        await self.create_parent()
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
    async with CorrectedTestDataCreator() as creator:
        await creator.create_all_test_data()

if __name__ == "__main__":
    asyncio.run(main())
