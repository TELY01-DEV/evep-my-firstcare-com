#!/usr/bin/env python3
"""
Create Patient Records from Existing Students
This script converts existing students into patient records for the medical system.
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class PatientCreator:
    def __init__(self):
        self.session = None
        self.access_token = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self) -> bool:
        """Login to get access token"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json=login_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result.get("access_token")
                    print(f"✅ Login successful")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    async def get_students(self) -> List[Dict[str, Any]]:
        """Get all students from the system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/evep/students",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    students = result.get("students", [])
                    print(f"📚 Found {len(students)} students")
                    return students
                else:
                    print(f"❌ Failed to get students: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting students: {str(e)}")
            return []
    
    async def create_patient(self, student: Dict[str, Any]) -> bool:
        """Create a patient record from a student"""
        try:
            # Convert student data to patient format (matching the patient registration API schema)
            patient_data = {
                "student_id": student.get("id"),
                "first_name": student.get("first_name", ""),
                "last_name": student.get("last_name", ""),
                "date_of_birth": student.get("birth_date", ""),
                "gender": student.get("gender", ""),
                "address": str(student.get("address", {})),
                "school": student.get("school_name", ""),
                "grade": student.get("grade_level", ""),
                "medical_history": {
                    "allergies": [],
                    "medications": [],
                    "conditions": []
                },
                "family_vision_history": {
                    "parent_vision_issues": False,
                    "sibling_vision_issues": False,
                    "family_glasses_use": False
                },
                "insurance_info": {
                    "provider": "",
                    "policy_number": "",
                    "group_number": ""
                },
                "consent_forms": {
                    "medical_treatment": False,
                    "data_sharing": False,
                    "photo_consent": student.get("consent_document", False)
                }
            }
            
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/patient-registration/register-student",
                json=patient_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    result = await response.json()
                    print(f"✅ Created patient for student {student.get('first_name')} {student.get('last_name')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create patient for {student.get('first_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating patient for {student.get('first_name')}: {str(e)}")
            return False
    
    async def create_all_patients(self):
        """Create patient records for all students"""
        if not await self.login():
            return
        
        students = await self.get_students()
        if not students:
            print("❌ No students found")
            return
        
        print(f"\n🔄 Creating patient records for {len(students)} students...")
        
        success_count = 0
        for student in students:
            if await self.create_patient(student):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Total students: {len(students)}")
        print(f"   Patients created: {success_count}")
        print(f"   Failed: {len(students) - success_count}")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Patient Creation from Students")
    print("=" * 60)
    
    async with PatientCreator() as creator:
        await creator.create_all_patients()

if __name__ == "__main__":
    asyncio.run(main())
