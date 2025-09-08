#!/usr/bin/env python3
"""
Create Patients in Correct Collection
This script creates patient records in the db.evep.patients collection that the screening API expects.
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

class PatientCollectionCreator:
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
    
    async def create_patient_via_direct_api(self, student: Dict[str, Any]) -> bool:
        """Create a patient using a direct API call that bypasses the collection issue"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create patient data that matches the expected format for the patients collection
            patient_data = {
                "first_name": student.get("first_name", ""),
                "last_name": student.get("last_name", ""),
                "cid": student.get("cid", f"STU{student.get('id', '')}"),
                "date_of_birth": student.get("birth_date", ""),
                "gender": student.get("gender", ""),
                "parent_email": "",  # Will be filled from parent data if available
                "parent_phone": "",  # Will be filled from parent data if available
                "emergency_contact": "Parent/Guardian",
                "emergency_phone": "",
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
                },
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "student_info": {
                    "student_id": student.get("id"),
                    "student_code": student.get("student_code", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": student.get("grade_number", ""),
                    "school_name": student.get("school_name", ""),
                    "teacher_id": student.get("teacher_id", ""),
                    "parent_id": student.get("parent_id", "")
                }
            }
            
            # Try to create via the patients API endpoint
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/patients",
                json=patient_data,
                headers=headers
            ) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    print(f"✅ Created patient record for student {student.get('first_name')} {student.get('last_name')} (ID: {result.get('patient_id', 'N/A')})")
                    return True
                elif response.status == 400:
                    error_text = await response.text()
                    if "already exists" in error_text:
                        print(f"⚠️ Patient already exists for {student.get('first_name')} {student.get('last_name')}")
                        return True  # Count as success since patient exists
                    else:
                        print(f"❌ Failed to create patient for {student.get('first_name')}: {response.status} - {error_text}")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create patient for {student.get('first_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating patient for {student.get('first_name')}: {str(e)}")
            return False
    
    async def create_patients_in_correct_collection(self):
        """Create patient records in the correct collection"""
        if not await self.login():
            return
        
        students = await self.get_students()
        if not students:
            print("❌ No students found")
            return
        
        print(f"\n🔄 Creating patient records in the correct collection for {len(students)} students...")
        
        success_count = 0
        for student in students:
            if await self.create_patient_via_direct_api(student):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Total students: {len(students)}")
        print(f"   Patients created: {success_count}")
        print(f"   Failed: {len(students) - success_count}")
        
        if success_count > 0:
            print(f"\n🎉 Successfully created {success_count} patient records in the correct collection!")
            print(f"   These should now work with the screening API endpoints.")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Create Patients in Correct Collection")
    print("=" * 65)
    
    async with PatientCollectionCreator() as creator:
        await creator.create_patients_in_correct_collection()

if __name__ == "__main__":
    asyncio.run(main())
