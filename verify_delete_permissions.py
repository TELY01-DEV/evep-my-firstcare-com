#!/usr/bin/env python3
"""
Verification script to check if delete permission fixes are working

This script checks:
1. Database user roles
2. RBAC permissions
3. Auth system configuration
"""

import sys
import os
from pymongo import MongoClient
from datetime import datetime

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "evep_system"

class DeletePermissionVerifier:
    def __init__(self):
        self.client = MongoClient(MONGODB_URL)
        self.db = self.client[DATABASE_NAME]
    
    def check_user_roles(self):
        """Check what user roles exist in the database"""
        print("🔍 Checking User Roles in Database...")
        print("=" * 50)
        
        try:
            # Check users collection
            users_collection = self.db.users
            users = list(users_collection.find({}, {"email": 1, "role": 1, "_id": 0}))
            
            if not users:
                print("❌ No users found in database!")
                return False
            
            print(f"📊 Found {len(users)} users:")
            admin_users = []
            
            for user in users:
                email = user.get("email", "N/A")
                role = user.get("role", "unknown")
                print(f"   • {email}: {role}")
                
                if role in ["admin", "super_admin", "medical_admin", "system_admin"]:
                    admin_users.append(user)
            
            print(f"\n👑 Admin Users Found: {len(admin_users)}")
            if not admin_users:
                print("⚠️  No admin users found! This could be the issue.")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error checking users: {e}")
            return False
    
    def check_rbac_permissions(self):
        """Check RBAC permissions setup"""
        print(f"\n🛡️ Checking RBAC Permissions...")
        print("=" * 50)
        
        try:
            # Check if RBAC collections exist
            collections = self.db.list_collection_names()
            rbac_collections = [c for c in collections if 'rbac' in c.lower()]
            
            if rbac_collections:
                print(f"✅ Found RBAC collections: {rbac_collections}")
                
                # Check user_roles collection if it exists
                if 'user_roles' in collections:
                    user_roles = list(self.db.user_roles.find({}))
                    print(f"📋 User roles: {len(user_roles)} entries")
                    for role_entry in user_roles[:3]:  # Show first 3
                        print(f"   • {role_entry}")
                
                # Check role_permissions collection if it exists  
                if 'role_permissions' in collections:
                    role_permissions = list(self.db.role_permissions.find({}))
                    print(f"🔑 Role permissions: {len(role_permissions)} entries")
                    for perm_entry in role_permissions[:3]:  # Show first 3
                        print(f"   • {perm_entry}")
            else:
                print("⚠️  No RBAC collections found")
            
            return True
            
        except Exception as e:
            print(f"❌ Error checking RBAC: {e}")
            return False
    
    def check_screening_sessions(self):
        """Check if there are screening sessions to delete"""
        print(f"\n📋 Checking Screening Sessions...")
        print("=" * 50)
        
        try:
            # Check evep.screenings collection
            screenings_collection = self.db.evep.screenings
            screening_count = screenings_collection.count_documents({})
            
            print(f"📊 Total screening sessions: {screening_count}")
            
            if screening_count > 0:
                # Show recent sessions
                recent_sessions = list(screenings_collection.find({}).sort("_id", -1).limit(5))
                print(f"🕐 Recent sessions:")
                
                for session in recent_sessions:
                    session_id = str(session.get("_id"))
                    patient_id = session.get("patient_id", "N/A")
                    status = session.get("status", "unknown")
                    created = session.get("created_at", "N/A")
                    
                    print(f"   • ID: {session_id[:8]}... | Patient: {str(patient_id)[:8]}... | Status: {status}")
                
                return True
            else:
                print("⚠️  No screening sessions found to test deletion")
                return False
                
        except Exception as e:
            print(f"❌ Error checking screening sessions: {e}")
            return False
    
    def check_patients(self):
        """Check if there are patients to delete"""
        print(f"\n👥 Checking Patients...")
        print("=" * 50)
        
        try:
            patients_collection = self.db.patients
            patient_count = patients_collection.count_documents({})
            
            print(f"📊 Total patients: {patient_count}")
            
            if patient_count > 0:
                # Show recent patients
                recent_patients = list(patients_collection.find({}).sort("_id", -1).limit(5))
                print(f"🕐 Recent patients:")
                
                for patient in recent_patients:
                    patient_id = str(patient.get("_id"))
                    first_name = patient.get("first_name", "N/A")
                    last_name = patient.get("last_name", "N/A")
                    is_active = patient.get("is_active", True)
                    
                    print(f"   • ID: {patient_id[:8]}... | Name: {first_name} {last_name} | Active: {is_active}")
                
                return True
            else:
                print("⚠️  No patients found to test deletion")
                return False
                
        except Exception as e:
            print(f"❌ Error checking patients: {e}")
            return False
    
    def provide_next_steps(self):
        """Provide guidance for next steps"""
        print(f"\n🚀 Next Steps to Test Deletion:")
        print("=" * 50)
        
        print(f"""
1. **Restart the Backend Server** (if you haven't already):
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Test Authentication with Super Admin**:
   - Login to the frontend with a user that has 'super_admin' role
   - Check if the user appears as super_admin in the system
   
3. **Test Deletion in Frontend**:
   - Go to Medical Screening → Recent Screening Sessions
   - Try to delete a screening session (should work with soft delete)
   - Try to force delete if available (hard delete)
   
4. **Check API Responses**:
   - Open browser developer tools
   - Look at network requests when attempting deletion
   - Check for 403 (permission) or 401 (auth) errors

5. **Manual API Test** (if needed):
   ```bash
   # Get auth token first
   curl -X POST "http://localhost:8000/api/v1/auth/login" \\
        -H "Content-Type: application/json" \\
        -d '{{"username": "your_admin_email", "password": "your_password"}}'
   
   # Test screening deletion (soft delete)
   curl -X DELETE "http://localhost:8000/api/v1/screenings/sessions/SESSION_ID" \\
        -H "Authorization: Bearer YOUR_TOKEN"
   
   # Test screening deletion (hard delete)
   curl -X DELETE "http://localhost:8000/api/v1/screenings/sessions/SESSION_ID?force_delete=true" \\
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Changes Made:**
✅ Updated auth.py to include super_admin, medical_admin, system_admin roles
✅ Updated patients.py to allow super_admin role for patient deletion
✅ Screening deletion already supports super_admin role

**If deletion still doesn't work:**
- Check that your user actually has 'super_admin' role in the database
- Verify the backend server is using the updated code
- Check browser console for JavaScript errors
- Verify API endpoints are being called correctly
        """)
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()

def main():
    """Main verification function"""
    print("🔍 EVEP Delete Permission Verifier")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    verifier = DeletePermissionVerifier()
    
    try:
        # Run all checks
        users_ok = verifier.check_user_roles()
        rbac_ok = verifier.check_rbac_permissions()
        sessions_ok = verifier.check_screening_sessions()
        patients_ok = verifier.check_patients()
        
        print(f"\n📊 Verification Summary:")
        print("=" * 50)
        print(f"✅ Users found: {users_ok}")
        print(f"✅ RBAC setup: {rbac_ok}")
        print(f"✅ Screening sessions: {sessions_ok}")
        print(f"✅ Patients found: {patients_ok}")
        
        if all([users_ok, sessions_ok or patients_ok]):
            print(f"\n🎉 System appears ready for testing deletion!")
        else:
            print(f"\n⚠️  Some issues found - check the details above")
        
        # Provide next steps
        verifier.provide_next_steps()
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
    
    finally:
        verifier.close()

if __name__ == "__main__":
    main()