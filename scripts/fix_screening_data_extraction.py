#!/usr/bin/env python3
"""
Fix Screening Data Extraction
This script fixes the data extraction issue by properly getting IDs from API responses.
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

class ScreeningDataFixer:
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
    
    async def inspect_api_responses(self):
        """Inspect the actual API responses to see what fields are available"""
        if not await self.login():
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Inspect patients response
        print("🔍 INSPECTING PATIENTS API RESPONSE:")
        print("-" * 40)
        async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
            if response.status == 200:
                patients = await response.json()
                if patients:
                    print("Sample patient object keys:")
                    print(json.dumps(list(patients[0].keys()), indent=2))
                    print("\nSample patient object:")
                    print(json.dumps(patients[0], indent=2, default=str))
                else:
                    print("No patients found")
            else:
                print(f"❌ Failed to get patients: {response.status}")
        
        print("\n" + "="*50 + "\n")
        
        # Inspect users response
        print("🔍 INSPECTING USERS API RESPONSE:")
        print("-" * 40)
        async with self.session.get(f"{API_BASE_URL}/api/v1/admin/users", headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                users = result.get("users", [])
                if users:
                    print("Sample user object keys:")
                    print(json.dumps(list(users[0].keys()), indent=2))
                    print("\nSample user object:")
                    print(json.dumps(users[0], indent=2, default=str))
                else:
                    print("No users found")
            else:
                print(f"❌ Failed to get users: {response.status}")
    
    async def create_screening_with_correct_ids(self):
        """Create screening session using the correct ID fields"""
        if not await self.login():
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Get patients and extract correct ID
        async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
            if response.status == 200:
                patients = await response.json()
                if not patients:
                    print("❌ No patients found")
                    return
                
                patient = patients[0]
                # Try different possible ID fields
                patient_id = (patient.get("_id") or 
                             patient.get("id") or 
                             patient.get("patient_id") or
                             str(patient.get("_id", "")))
                
                print(f"Patient: {patient.get('first_name')} {patient.get('last_name')}")
                print(f"Patient ID (trying different fields): {patient_id}")
                
                # Get medical staff and extract correct ID
                async with self.session.get(f"{API_BASE_URL}/api/v1/admin/users", headers=headers) as response2:
                    if response2.status == 200:
                        result = await response2.json()
                        users = result.get("users", [])
                        
                        medical_staff = [
                            user for user in users 
                            if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]
                        ]
                        
                        if not medical_staff:
                            print("❌ No medical staff found")
                            return
                        
                        examiner = medical_staff[0]
                        # Try different possible ID fields
                        examiner_id = (examiner.get("id") or 
                                      examiner.get("_id") or 
                                      examiner.get("user_id") or
                                      str(examiner.get("id", "")))
                        
                        print(f"Examiner: {examiner.get('first_name')} {examiner.get('last_name')}")
                        print(f"Examiner ID (trying different fields): {examiner_id}")
                        
                        # Try to create screening session with the extracted IDs
                        session_data = {
                            "patient_id": patient_id,
                            "examiner_id": examiner_id,
                            "screening_type": "distance",
                            "screening_category": "school_screening",
                            "equipment_used": "Snellen Chart",
                            "notes": "Test screening session with corrected IDs"
                        }
                        
                        print(f"\n🧪 Creating screening session with data:")
                        print(json.dumps(session_data, indent=2))
                        
                        async with self.session.post(
                            f"{API_BASE_URL}/api/v1/screenings/sessions",
                            json=session_data,
                            headers=headers
                        ) as response3:
                            print(f"\nResponse status: {response3.status}")
                            response_text = await response3.text()
                            print(f"Response body: {response_text}")
                            
                            if response3.status in [200, 201]:
                                print("✅ Screening session created successfully!")
                                result = await response3.json()
                                print(f"Session ID: {result.get('session_id', 'N/A')}")
                            else:
                                print("❌ Screening session creation failed")
                    else:
                        print(f"❌ Failed to get users: {response2.status}")
            else:
                print(f"❌ Failed to get patients: {response.status}")

async def main():
    """Main function"""
    print("🔧 EVEP Medical Portal - Fix Screening Data Extraction")
    print("=" * 60)
    
    async with ScreeningDataFixer() as fixer:
        await fixer.inspect_api_responses()
        print("\n" + "="*60 + "\n")
        await fixer.create_screening_with_correct_ids()

if __name__ == "__main__":
    asyncio.run(main())
