#!/usr/bin/env python3
"""
Debug script to test screening session creation and identify 422 errors

This script will:
1. Check what patients exist
2. Test screening session creation with different payloads
3. Identify validation errors causing 422 responses
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from pymongo import MongoClient

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "evep_system"
API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class ScreeningCreationDebugger:
    def __init__(self):
        self.admin_token = None
        
    async def authenticate_admin(self):
        """Authenticate as super admin user"""
        # You'll need to replace these with actual admin credentials
        auth_data = {
            "username": "admin@admin.com",  # Replace with your super admin email
            "password": "your_password_here"  # Replace with your super admin password
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{API_BASE_URL}/api/v1/auth/login",
                    json=auth_data,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.admin_token = result.get("access_token")
                        user_info = result.get("user", {})
                        print(f"✅ Authentication successful")
                        print(f"   • Role: {user_info.get('role', 'N/A')}")
                        print(f"   • Email: {user_info.get('email', 'N/A')}")
                        return True
                    else:
                        error_text = await response.text()
                        print(f"❌ Authentication failed: {response.status}")
                        print(f"   Error: {error_text}")
                        return False
            except Exception as e:
                print(f"❌ Authentication error: {e}")
                return False
    
    async def get_patients(self):
        """Get existing patients to use for testing"""
        if not self.admin_token:
            print("❌ No admin token available")
            return []
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/patients?limit=5",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        patients = result.get('patients', []) if isinstance(result, dict) else result
                        print(f"✅ Found {len(patients)} patients")
                        
                        for i, patient in enumerate(patients[:3], 1):
                            patient_id = patient.get('_id') or patient.get('id')
                            name = f"{patient.get('first_name', 'N/A')} {patient.get('last_name', 'N/A')}"
                            print(f"   {i}. ID: {patient_id} | Name: {name}")
                        
                        return patients
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get patients: {response.status}")
                        print(f"   Error: {error_text}")
                        return []
            except Exception as e:
                print(f"❌ Error getting patients: {e}")
                return []
    
    async def get_users(self):
        """Get users to use as examiners"""
        if not self.admin_token:
            print("❌ No admin token available")
            return []
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/users?limit=5",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        users = result.get('users', []) if isinstance(result, dict) else result
                        print(f"✅ Found {len(users)} users")
                        
                        for i, user in enumerate(users[:3], 1):
                            user_id = user.get('_id') or user.get('id')
                            email = user.get('email', 'N/A')
                            role = user.get('role', 'N/A')
                            print(f"   {i}. ID: {user_id} | Email: {email} | Role: {role}")
                        
                        return users
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get users: {response.status}")
                        print(f"   Error: {error_text}")
                        return []
            except Exception as e:
                print(f"❌ Error getting users: {e}")
                return []
    
    async def test_screening_creation(self, patients, users):
        """Test creating screening sessions with different payloads"""
        if not self.admin_token or not patients or not users:
            print("❌ Missing required data for testing")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        patient = patients[0]
        examiner = users[0]
        
        patient_id = patient.get('_id') or patient.get('id')
        examiner_id = examiner.get('_id') or examiner.get('id')
        
        print(f"\\n🧪 Testing Screening Session Creation")
        print("=" * 50)
        print(f"Patient ID: {patient_id}")
        print(f"Examiner ID: {examiner_id}")
        
        # Test different payload variations
        test_payloads = [
            {
                "name": "Minimal Required Fields",
                "data": {
                    "patient_id": patient_id,
                    "examiner_id": examiner_id,
                    "screening_type": "distance",
                    "screening_category": "medical_screening"
                }
            },
            {
                "name": "Complete Workflow Data",
                "data": {
                    "patient_id": patient_id,
                    "examiner_id": examiner_id,
                    "screening_type": "comprehensive",
                    "screening_category": "medical_screening",
                    "equipment_used": "Spot Vision Screener",
                    "notes": "Initial screening",
                    "current_step": 5,
                    "current_step_name": "Doctor Diagnosis",
                    "workflow_data": {
                        "step": 5,
                        "step_name": "Doctor Diagnosis",
                        "completed_steps": ["registration", "consent", "va_screening", "examination"],
                        "visual_acuity": {"right_eye": "20/20", "left_eye": "20/25"},
                        "doctor_diagnosis": {
                            "vision_status": "needs_correction",
                            "recommendations": ["glasses_prescription"],
                            "notes": "Myopia detected in left eye"
                        }
                    },
                    "status": "in_progress"
                }
            },
            {
                "name": "School Screening Category",
                "data": {
                    "patient_id": patient_id,
                    "examiner_id": examiner_id,
                    "screening_type": "school_vision",
                    "screening_category": "school_screening"
                }
            }
        ]
        
        async with aiohttp.ClientSession() as session:
            for test in test_payloads:
                print(f"\\n🔬 Testing: {test['name']}")
                print(f"   Payload: {json.dumps(test['data'], indent=2)}")
                
                try:
                    async with session.post(
                        f"{API_BASE_URL}/api/v1/screenings/sessions",
                        json=test['data'],
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=15)
                    ) as response:
                        response_text = await response.text()
                        
                        if response.status == 200 or response.status == 201:
                            result = await response.json() if response_text else {}
                            session_id = result.get('_id') or result.get('id', 'N/A')
                            print(f"   ✅ SUCCESS: Session created with ID: {session_id}")
                        else:
                            print(f"   ❌ FAILED: Status {response.status}")
                            print(f"   Response: {response_text}")
                            
                            if response.status == 422:
                                try:
                                    error_detail = json.loads(response_text)
                                    print(f"   Validation Error Details: {json.dumps(error_detail, indent=2)}")
                                except:
                                    print(f"   Raw Error: {response_text}")
                
                except Exception as e:
                    print(f"   ❌ Exception: {e}")
    
    async def check_existing_sessions(self, patients):
        """Check for existing sessions that might conflict"""
        if not self.admin_token or not patients:
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        patient = patients[0]
        patient_id = patient.get('_id') or patient.get('id')
        
        print(f"\\n🔍 Checking Existing Sessions for Patient: {patient_id}")
        print("=" * 50)
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/screenings/sessions?patient_id={patient_id}",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        sessions = await response.json()
                        print(f"✅ Found {len(sessions)} existing sessions for this patient")
                        
                        for i, sess in enumerate(sessions, 1):
                            sess_id = sess.get('_id') or sess.get('id')
                            status = sess.get('status', 'N/A')
                            created = sess.get('created_at', 'N/A')
                            print(f"   {i}. ID: {sess_id} | Status: {status} | Created: {created}")
                            
                        if sessions:
                            print("\\n⚠️  Existing sessions found - this might cause conflicts")
                    else:
                        print(f"❌ Failed to check sessions: {response.status}")
                        print(f"   Response: {await response.text()}")
            except Exception as e:
                print(f"❌ Error checking sessions: {e}")

async def main():
    """Main debugging function"""
    print("🔍 EVEP Screening Creation Debugger")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    debugger = ScreeningCreationDebugger()
    
    # Authenticate
    if not await debugger.authenticate_admin():
        print("❌ Authentication failed - please update credentials in the script")
        return
    
    # Get patients and users
    patients = await debugger.get_patients()
    users = await debugger.get_users()
    
    if not patients:
        print("❌ No patients found - cannot test screening creation")
        return
    
    if not users:
        print("❌ No users found - cannot test screening creation")
        return
    
    # Check existing sessions
    await debugger.check_existing_sessions(patients)
    
    # Test screening creation
    await debugger.test_screening_creation(patients, users)
    
    print(f"\\n📝 DEBUGGING COMPLETE")
    print("=" * 60)
    print("If 422 errors persist, check:")
    print("1. Required field validation in the API")
    print("2. Data type mismatches (string vs ObjectId)")
    print("3. Existing active sessions for the patient")
    print("4. Role-based restrictions")
    print("5. Custom validation rules in the backend")

if __name__ == "__main__":
    print("\\n⚠️  SETUP REQUIRED:")
    print("=" * 50)
    print("Before running this script, please:")
    print("1. Update the auth_data credentials in authenticate_admin()")
    print("2. Make sure the backend API is running")
    print("3. Ensure you have admin/super_admin access")
    print("\\nPress Enter to continue or Ctrl+C to exit...")
    input()
    
    asyncio.run(main())