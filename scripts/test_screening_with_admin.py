#!/usr/bin/env python3
"""
Test Screening with Admin User
This script tests creating a screening session using the admin user as the examiner.
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

class AdminScreeningTester:
    def __init__(self):
        self.session = None
        self.access_token = None
        self.admin_user_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self) -> bool:
        """Login to get access token and admin user ID"""
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
                    self.admin_user_id = result.get("user_id")  # Get admin user ID from login response
                    print(f"✅ Login successful")
                    print(f"Admin user ID: {self.admin_user_id}")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    async def test_screening_with_admin(self):
        """Test creating a screening session with admin as examiner"""
        if not await self.login():
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Get first patient
        async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
            if response.status == 200:
                patients = await response.json()
                if not patients:
                    print("❌ No patients found")
                    return
                
                patient = patients[0]
                patient_id = patient.get("patient_id")
                
                print(f"Using patient: {patient.get('first_name')} {patient.get('last_name')} (ID: {patient_id})")
                print(f"Using admin as examiner: {self.admin_user_id}")
                
                # Create screening session with admin as examiner
                session_data = {
                    "patient_id": patient_id,
                    "examiner_id": self.admin_user_id,  # Use admin user ID
                    "screening_type": "distance",
                    "screening_category": "school_screening",
                    "equipment_used": "Snellen Chart",
                    "notes": "Test screening session with admin as examiner"
                }
                
                print(f"\n🧪 Creating screening session with data:")
                print(json.dumps(session_data, indent=2))
                
                async with self.session.post(
                    f"{API_BASE_URL}/api/v1/screenings/sessions",
                    json=session_data,
                    headers=headers
                ) as response2:
                    print(f"\nResponse status: {response2.status}")
                    response_text = await response2.text()
                    print(f"Response body: {response_text}")
                    
                    if response2.status in [200, 201]:
                        print("✅ Screening session created successfully!")
                        result = await response2.json()
                        print(f"Session ID: {result.get('session_id', 'N/A')}")
                        
                        # Test dashboard stats
                        print(f"\n🧪 Testing dashboard statistics...")
                        await self.test_dashboard_stats()
                    else:
                        print("❌ Screening session creation failed")
            else:
                print(f"❌ Failed to get patients: {response.status}")
    
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
    print("🧪 EVEP Medical Portal - Test Screening with Admin")
    print("=" * 50)
    
    async with AdminScreeningTester() as tester:
        await tester.test_screening_with_admin()

if __name__ == "__main__":
    asyncio.run(main())
