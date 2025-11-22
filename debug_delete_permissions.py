#!/usr/bin/env python3
"""
Debug script to check and fix deletion permissions for super admin role

This script will:
1. Check current user roles and permissions
2. Test deletion API endpoints
3. Identify permission issues
4. Provide fixes for super_admin deletion problems
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from pymongo import MongoClient

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "evep_system"
API_BASE_URL = "http://localhost:8000"  # Adjust if different

class DeletePermissionDebugger:
    def __init__(self):
        self.client = MongoClient(MONGODB_URL)
        self.db = self.client[DATABASE_NAME]
        self.admin_token = None
        
    def check_database_roles(self):
        """Check what roles exist in the database"""
        print("🔍 Checking Database Roles and Permissions...")
        print("=" * 60)
        
        try:
            # Check users collection for roles
            users_collection = self.db.users
            users = list(users_collection.find({}, {"email": 1, "role": 1, "_id": 0}))
            
            print(f"📊 Found {len(users)} users in database:")
            role_counts = {}
            
            for user in users:
                role = user.get("role", "unknown")
                role_counts[role] = role_counts.get(role, 0) + 1
                print(f"   • {user.get('email', 'N/A')}: {role}")
            
            print(f"\n📈 Role Distribution:")
            for role, count in role_counts.items():
                print(f"   • {role}: {count} users")
            
            # Check RBAC collections
            print(f"\n🗄️ Available Collections:")
            collections = self.db.list_collection_names()
            rbac_collections = [c for c in collections if 'rbac' in c.lower() or 'role' in c.lower() or 'permission' in c.lower()]
            
            for collection in collections:
                if any(keyword in collection.lower() for keyword in ['rbac', 'role', 'permission', 'user']):
                    count = self.db[collection].count_documents({})
                    print(f"   • {collection}: {count} documents")
                    
                    # Show sample document if exists
                    if count > 0:
                        sample = self.db[collection].find_one({})
                        if sample:
                            sample_keys = list(sample.keys())
                            print(f"     Sample keys: {sample_keys[:5]}...")
            
        except Exception as e:
            print(f"❌ Database Error: {e}")
    
    async def test_auth_endpoints(self):
        """Test authentication with different credentials"""
        print(f"\n🔐 Testing Authentication Endpoints...")
        print("=" * 60)
        
        # Test credentials (you may need to adjust these)
        test_credentials = [
            {"username": "admin", "password": "admin123"},
            {"username": "admin@admin.com", "password": "admin123"},
            {"username": "superadmin", "password": "admin123"},
            {"username": "super_admin", "password": "admin123"},
        ]
        
        async with aiohttp.ClientSession() as session:
            for creds in test_credentials:
                try:
                    async with session.post(
                        f"{API_BASE_URL}/api/v1/auth/login",
                        json=creds,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            token = result.get("access_token")
                            user_info = result.get("user", {})
                            
                            print(f"✅ Login successful for {creds['username']}")
                            print(f"   • Role: {user_info.get('role', 'N/A')}")
                            print(f"   • Email: {user_info.get('email', 'N/A')}")
                            print(f"   • Token: {token[:20]}..." if token else "   • No token returned")
                            
                            # Store admin token for further testing
                            if not self.admin_token and user_info.get('role') in ['admin', 'super_admin']:
                                self.admin_token = token
                            
                        else:
                            error_text = await response.text()
                            print(f"❌ Login failed for {creds['username']}: {response.status}")
                            print(f"   Error: {error_text}")
                            
                except Exception as e:
                    print(f"❌ Connection error for {creds['username']}: {e}")
    
    async def test_delete_endpoints(self):
        """Test deletion endpoints with admin token"""
        if not self.admin_token:
            print(f"\n⚠️  No admin token available - skipping delete tests")
            return
            
        print(f"\n🗑️ Testing Delete Endpoints...")
        print("=" * 60)
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        async with aiohttp.ClientSession() as session:
            # Test get recent screening sessions first
            try:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/screenings/sessions",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        sessions = await response.json()
                        print(f"✅ Found {len(sessions)} screening sessions")
                        
                        if sessions:
                            # Try to delete first session (soft delete)
                            session_id = sessions[0].get('_id') or sessions[0].get('id')
                            if session_id:
                                print(f"🧪 Testing soft delete on session: {session_id}")
                                
                                async with session.delete(
                                    f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}",
                                    headers=headers
                                ) as delete_response:
                                    result = await delete_response.text()
                                    print(f"   Soft delete result: {delete_response.status} - {result}")
                                
                                # Test hard delete
                                print(f"🧪 Testing hard delete on session: {session_id}")
                                async with session.delete(
                                    f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}?force_delete=true",
                                    headers=headers
                                ) as delete_response:
                                    result = await delete_response.text()
                                    print(f"   Hard delete result: {delete_response.status} - {result}")
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get screening sessions: {response.status} - {error_text}")
                        
            except Exception as e:
                print(f"❌ Error testing screening deletion: {e}")
            
            # Test patient deletion if we have patients
            try:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/patients",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        patients = result.get('patients', []) if isinstance(result, dict) else result
                        print(f"✅ Found {len(patients)} patients")
                        
                        if patients:
                            # Try to delete first patient
                            patient_id = patients[0].get('_id') or patients[0].get('id')
                            if patient_id:
                                print(f"🧪 Testing patient deletion: {patient_id}")
                                
                                async with session.delete(
                                    f"{API_BASE_URL}/api/v1/patients/{patient_id}",
                                    headers=headers
                                ) as delete_response:
                                    result = await delete_response.text()
                                    print(f"   Patient delete result: {delete_response.status} - {result}")
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to get patients: {response.status} - {error_text}")
                        
            except Exception as e:
                print(f"❌ Error testing patient deletion: {e}")
    
    def check_auth_configuration(self):
        """Check authentication configuration issues"""
        print(f"\n⚙️ Checking Authentication Configuration...")
        print("=" * 60)
        
        print(f"🔍 Known Issues Found:")
        print(f"   1. ❌ auth.py valid_roles only includes: ['user', 'doctor', 'teacher', 'parent', 'admin']")
        print(f"   2. ❌ Missing 'super_admin', 'medical_admin', 'system_admin' in auth validation")
        print(f"   3. ❌ Permission system expects roles not allowed by auth system")
        
        print(f"\n💡 Recommended Fixes:")
        print(f"   1. ✅ Update valid_roles in auth.py to include all admin roles")
        print(f"   2. ✅ Ensure RBAC database has proper super_admin permissions")
        print(f"   3. ✅ Test deletion endpoints with proper super_admin role")
    
    def suggest_fixes(self):
        """Suggest specific fixes for the deletion issues"""
        print(f"\n🔧 Suggested Fixes:")
        print("=" * 60)
        
        print(f"""
1. **Update Authentication System (backend/app/api/auth.py):**
   Replace line ~125:
   ```python
   valid_roles = ["user", "doctor", "teacher", "parent", "admin"]
   ```
   With:
   ```python
   valid_roles = ["user", "doctor", "teacher", "parent", "admin", "super_admin", "medical_admin", "system_admin"]
   ```

2. **Check User Role in Database:**
   Ensure your super admin user has role = "super_admin" in the database

3. **Verify RBAC Permissions:**
   Check that super_admin role has "screenings_delete" and "full_access" permissions

4. **Test with Force Delete:**
   Use the force_delete=true parameter for hard deletion of screening sessions

5. **Check Patient Delete Permissions:**
   Patient deletion currently only allows "admin" role, may need to include "super_admin"
        """)
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()

async def main():
    """Main debugging function"""
    print("🔍 EVEP System Delete Permission Debugger")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    debugger = DeletePermissionDebugger()
    
    try:
        # Check database state
        debugger.check_database_roles()
        
        # Test authentication
        await debugger.test_auth_endpoints()
        
        # Test deletion endpoints
        await debugger.test_delete_endpoints()
        
        # Check configuration issues
        debugger.check_auth_configuration()
        
        # Suggest fixes
        debugger.suggest_fixes()
        
    except Exception as e:
        print(f"❌ Error during debugging: {e}")
    
    finally:
        debugger.close()

if __name__ == "__main__":
    asyncio.run(main())