#!/usr/bin/env python3
"""
Test frontend authentication and patient data
"""

import asyncio
import aiohttp
import json

# API Configuration
API_BASE_URL = "http://backend:8000/api/v1"
FRONTEND_URL = "http://localhost:3013"

async def test_frontend_auth():
    """Test frontend authentication and patient data"""
    async with aiohttp.ClientSession() as session:
        print("🔐 Testing authentication...")
        
        # Login
        login_data = {
            "email": "admin@evep.com",
            "password": "admin123"
        }
        
        async with session.post(f"{API_BASE_URL}/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                token = data.get("access_token")
                print(f"✅ Login successful - Token: {token[:50]}...")
                
                # Test patients API with token
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                async with session.get(f"{API_BASE_URL}/patients/", headers=headers) as patients_response:
                    if patients_response.status == 200:
                        patients_data = await patients_response.json()
                        print(f"✅ Patients API working - Found {len(patients_data)} patients")
                        
                        # Show first few patients
                        for i, patient in enumerate(patients_data[:3]):
                            print(f"   {i+1}. {patient.get('first_name', 'N/A')} {patient.get('last_name', 'N/A')} - CID: {patient.get('cid', 'N/A')}")
                    else:
                        print(f"❌ Patients API failed: {patients_response.status}")
                        error_text = await patients_response.text()
                        print(f"   Error: {error_text}")
            else:
                print(f"❌ Login failed: {response.status}")
                error_text = await response.text()
                print(f"   Error: {error_text}")

if __name__ == "__main__":
    asyncio.run(test_frontend_auth())
