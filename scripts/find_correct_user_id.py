#!/usr/bin/env python3
"""
Find Correct User ID
This script helps find the correct way to get the current user's ID for screening sessions.
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

class UserIDFinder:
    def __init__(self):
        self.session = None
        self.access_token = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login_and_inspect(self):
        """Login and inspect the response to find user ID"""
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
                    
                    print("🔍 LOGIN RESPONSE INSPECTION:")
                    print("-" * 40)
                    print("Full login response:")
                    print(json.dumps(result, indent=2, default=str))
                    
                    # Try to decode the JWT token to get user info
                    if self.access_token:
                        print(f"\n🔍 JWT TOKEN INSPECTION:")
                        print("-" * 40)
                        # JWT tokens have 3 parts separated by dots
                        parts = self.access_token.split('.')
                        if len(parts) == 3:
                            import base64
                            
                            # Decode the payload (second part)
                            payload = parts[1]
                            # Add padding if needed
                            payload += '=' * (4 - len(payload) % 4)
                            decoded = base64.b64decode(payload)
                            payload_data = json.loads(decoded)
                            
                            print("JWT Payload:")
                            print(json.dumps(payload_data, indent=2, default=str))
                            
                            user_id = payload_data.get("user_id")
                            print(f"\nUser ID from JWT: {user_id}")
                            
                            return user_id
                    
                    return None
                else:
                    print(f"❌ Login failed: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return None
    
    async def test_screening_with_jwt_user_id(self, user_id):
        """Test creating a screening session with the user ID from JWT"""
        if not user_id:
            print("❌ No user ID found")
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
                
                print(f"\n🧪 TESTING SCREENING WITH JWT USER ID:")
                print("-" * 40)
                print(f"Using patient: {patient.get('first_name')} {patient.get('last_name')} (ID: {patient_id})")
                print(f"Using JWT user ID as examiner: {user_id}")
                
                # Create screening session
                session_data = {
                    "patient_id": patient_id,
                    "examiner_id": user_id,
                    "screening_type": "distance",
                    "screening_category": "school_screening",
                    "equipment_used": "Snellen Chart",
                    "notes": "Test screening session with JWT user ID as examiner"
                }
                
                print(f"\nSending data:")
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
                        return True
                    else:
                        print("❌ Screening session creation failed")
                        return False
            else:
                print(f"❌ Failed to get patients: {response.status}")
                return False

async def main():
    """Main function"""
    print("🔍 EVEP Medical Portal - Find Correct User ID")
    print("=" * 50)
    
    async with UserIDFinder() as finder:
        user_id = await finder.login_and_inspect()
        if user_id:
            await finder.test_screening_with_jwt_user_id(user_id)

if __name__ == "__main__":
    asyncio.run(main())
