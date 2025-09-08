#!/usr/bin/env python3
"""
Create Screening Sessions - Fixed Version
This script creates screening sessions using the correct ID field names from API responses.
"""

import asyncio
import aiohttp
import json
import random
from datetime import datetime
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class FixedScreeningSessionCreator:
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
    
    async def get_patients(self) -> List[Dict[str, Any]]:
        """Get all patients from the system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/patients/",
                headers=headers
            ) as response:
                if response.status == 200:
                    patients = await response.json()
                    print(f"🏥 Found {len(patients)} patients")
                    return patients
                else:
                    print(f"❌ Failed to get patients: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting patients: {str(e)}")
            return []
    
    async def get_medical_staff(self) -> List[Dict[str, Any]]:
        """Get medical staff (doctors, nurses) for screening sessions"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    users = result.get("users", [])
                    
                    # Filter for medical staff
                    medical_staff = [
                        user for user in users 
                        if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]
                    ]
                    print(f"👩‍⚕️ Found {len(medical_staff)} medical staff members")
                    return medical_staff
                else:
                    print(f"❌ Failed to get users: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting medical staff: {str(e)}")
            return []
    
    async def create_screening_session(self, patient: Dict[str, Any], examiner: Dict[str, Any]) -> bool:
        """Create a screening session for a patient"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Use the correct ID field names from API responses
            patient_id = patient.get("patient_id")  # Not _id
            examiner_id = examiner.get("user_id")    # Not id
            
            print(f"Creating session for patient {patient.get('first_name')} (ID: {patient_id}) with examiner {examiner.get('first_name')} (ID: {examiner_id})")
            
            # Create screening session data
            session_data = {
                "patient_id": patient_id,
                "examiner_id": examiner_id,
                "screening_type": random.choice(["distance", "near", "comprehensive"]),
                "screening_category": random.choice(["school_screening", "medical_screening"]),
                "equipment_used": random.choice(["Snellen Chart", "Tumbling E Chart", "Lea Symbols", "Auto Refractor"]),
                "notes": f"Screening performed by {examiner.get('first_name', '')} {examiner.get('last_name', '')} for {patient.get('first_name', '')} {patient.get('last_name', '')}"
            }
            
            # Create screening session
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/screenings/sessions",
                json=session_data,
                headers=headers
            ) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    print(f"✅ Created screening session for {patient.get('first_name')} {patient.get('last_name')} (Session ID: {result.get('session_id', 'N/A')})")
                    return True
                elif response.status == 422:
                    error_text = await response.text()
                    print(f"⚠️ Validation error for {patient.get('first_name')}: {error_text}")
                    return False
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create screening session for {patient.get('first_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating screening session for {patient.get('first_name')}: {str(e)}")
            return False
    
    async def create_screening_sessions(self):
        """Create screening sessions for all patients"""
        if not await self.login():
            return
        
        patients = await self.get_patients()
        if not patients:
            print("❌ No patients found")
            return
        
        medical_staff = await self.get_medical_staff()
        if not medical_staff:
            print("❌ No medical staff found")
            return
        
        print(f"\n🔄 Creating screening sessions for {len(patients)} patients...")
        
        success_count = 0
        for patient in patients:
            # Select a random medical staff member as examiner
            examiner = random.choice(medical_staff)
            
            if await self.create_screening_session(patient, examiner):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Total patients: {len(patients)}")
        print(f"   Screening sessions created: {success_count}")
        print(f"   Failed: {len(patients) - success_count}")
        
        if success_count > 0:
            print(f"\n🎉 Successfully created {success_count} screening sessions!")
            print(f"   These should now appear in the dashboard statistics.")
            
            # Test the dashboard to see updated statistics
            print(f"\n🧪 Testing dashboard statistics...")
            await self.test_dashboard_stats()
    
    async def test_dashboard_stats(self):
        """Test the dashboard to see updated screening statistics"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/dashboard/stats",
                headers=headers
            ) as response:
                if response.status == 200:
                    stats = await response.json()
                    print(f"✅ Dashboard stats updated!")
                    print(f"   Total Screenings: {stats.get('totalScreenings', 0)}")
                    print(f"   Pending Screenings: {stats.get('pendingScreenings', 0)}")
                    print(f"   Completed Screenings: {stats.get('completedScreenings', 0)}")
                    return True
                else:
                    print(f"❌ Dashboard stats failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Error testing dashboard stats: {str(e)}")
            return False

async def main():
    """Main function"""
    print("🔬 EVEP Medical Portal - Create Real Screening Sessions (Fixed)")
    print("=" * 70)
    
    async with FixedScreeningSessionCreator() as creator:
        await creator.create_screening_sessions()

if __name__ == "__main__":
    asyncio.run(main())
