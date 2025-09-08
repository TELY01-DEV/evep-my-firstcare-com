#!/usr/bin/env python3
"""
Debug Screening Issue
This script helps debug the "User ID not found" issue with screening sessions.
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

class ScreeningDebugger:
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
    
    async def debug_patients_and_staff(self):
        """Debug patients and medical staff data"""
        if not await self.login():
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Get patients
        print("🔍 DEBUGGING PATIENTS:")
        print("-" * 30)
        async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
            if response.status == 200:
                patients = await response.json()
                print(f"Found {len(patients)} patients:")
                for i, patient in enumerate(patients):
                    print(f"  {i+1}. ID: {patient.get('_id')}")
                    print(f"     Name: {patient.get('first_name')} {patient.get('last_name')}")
                    print(f"     CID: {patient.get('cid')}")
                    print()
            else:
                print(f"❌ Failed to get patients: {response.status}")
        
        # Get medical staff
        print("🔍 DEBUGGING MEDICAL STAFF:")
        print("-" * 30)
        async with self.session.get(f"{API_BASE_URL}/api/v1/admin/users", headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                users = result.get("users", [])
                
                medical_staff = [
                    user for user in users 
                    if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]
                ]
                
                print(f"Found {len(medical_staff)} medical staff:")
                for i, staff in enumerate(medical_staff):
                    print(f"  {i+1}. ID: {staff.get('id')}")
                    print(f"     Name: {staff.get('first_name')} {staff.get('last_name')}")
                    print(f"     Role: {staff.get('role')}")
                    print(f"     Email: {staff.get('email')}")
                    print()
            else:
                print(f"❌ Failed to get users: {response.status}")
        
        # Test a simple screening session creation with detailed error info
        print("🧪 TESTING SCREENING SESSION CREATION:")
        print("-" * 30)
        
        # Get first patient and first medical staff
        async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
            if response.status == 200:
                patients = await response.json()
                if patients:
                    patient = patients[0]
                    print(f"Using patient: {patient.get('first_name')} {patient.get('last_name')} (ID: {patient.get('_id')})")
                    
                    # Get medical staff
                    async with self.session.get(f"{API_BASE_URL}/api/v1/admin/users", headers=headers) as response2:
                        if response2.status == 200:
                            result = await response2.json()
                            users = result.get("users", [])
                            
                            medical_staff = [
                                user for user in users 
                                if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]
                            ]
                            
                            if medical_staff:
                                examiner = medical_staff[0]
                                print(f"Using examiner: {examiner.get('first_name')} {examiner.get('last_name')} (ID: {examiner.get('id')})")
                                
                                # Try to create screening session
                                session_data = {
                                    "patient_id": str(patient.get("_id", "")),
                                    "examiner_id": str(examiner.get("id", "")),
                                    "screening_type": "distance",
                                    "screening_category": "school_screening",
                                    "equipment_used": "Snellen Chart",
                                    "notes": "Test screening session"
                                }
                                
                                print(f"Sending data: {json.dumps(session_data, indent=2)}")
                                
                                async with self.session.post(
                                    f"{API_BASE_URL}/api/v1/screenings/sessions",
                                    json=session_data,
                                    headers=headers
                                ) as response3:
                                    print(f"Response status: {response3.status}")
                                    response_text = await response3.text()
                                    print(f"Response body: {response_text}")
                                    
                                    if response3.status == 200:
                                        print("✅ Screening session created successfully!")
                                    else:
                                        print("❌ Screening session creation failed")
                            else:
                                print("❌ No medical staff found")
                        else:
                            print(f"❌ Failed to get users: {response2.status}")
                else:
                    print("❌ No patients found")

async def main():
    """Main function"""
    print("🔍 EVEP Medical Portal - Debug Screening Issue")
    print("=" * 50)
    
    async with ScreeningDebugger() as debugger:
        await debugger.debug_patients_and_staff()

if __name__ == "__main__":
    asyncio.run(main())
