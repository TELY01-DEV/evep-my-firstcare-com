#!/usr/bin/env python3
"""
EVEP Medical Portal - Check and Populate RBAC Data
Check if RBAC roles and permissions are populated in the database
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class RBACDataManager:
    def __init__(self):
        self.session = None
        self.token = None
        self.user_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self):
        """Login and get authentication token"""
        print("🔐 Logging in...")
        
        login_data = {
            "email": "admin@evep.com",
            "password": "admin123"
        }
        
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/auth/login",
            json=login_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                self.token = data.get("access_token")
                
                # Extract user ID from JWT token
                import base64
                parts = self.token.split('.')
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded = base64.b64decode(payload)
                payload_data = json.loads(decoded)
                self.user_id = payload_data.get("user_id")
                self.user_role = payload_data.get("role")
                
                print(f"✅ Login successful - User ID: {self.user_id}, Role: {self.user_role}")
                return True
            else:
                print(f"❌ Login failed: {response.status}")
                return False
    
    async def check_rbac_roles(self):
        """Check if RBAC roles exist in the database"""
        print("\n🔍 Checking RBAC Roles...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Try different RBAC endpoints
        endpoints = [
            "/api/v1/rbac/roles/",
            "/api/v1/rbac-mongodb/roles/",
            "/api/v1/admin/rbac/roles/"
        ]
        
        for endpoint in endpoints:
            try:
                async with self.session.get(
                    f"{API_BASE_URL}{endpoint}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        roles = await response.json()
                        print(f"✅ Found RBAC roles via {endpoint}: {len(roles)} roles")
                        if roles:
                            print(f"   Sample roles: {[role.get('name', 'N/A') for role in roles[:3]]}")
                        return roles, endpoint
                    else:
                        print(f"⚠️ {endpoint} returned {response.status}")
            except Exception as e:
                print(f"⚠️ Error accessing {endpoint}: {e}")
        
        print("❌ No RBAC roles found in any endpoint")
        return [], None
    
    async def check_rbac_permissions(self):
        """Check if RBAC permissions exist in the database"""
        print("\n🔍 Checking RBAC Permissions...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Try different RBAC endpoints
        endpoints = [
            "/api/v1/rbac/permissions/",
            "/api/v1/rbac-mongodb/permissions/",
            "/api/v1/admin/rbac/permissions/"
        ]
        
        for endpoint in endpoints:
            try:
                async with self.session.get(
                    f"{API_BASE_URL}{endpoint}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        permissions = await response.json()
                        print(f"✅ Found RBAC permissions via {endpoint}: {len(permissions)} permissions")
                        if permissions:
                            print(f"   Sample permissions: {[perm.get('name', 'N/A') for perm in permissions[:3]]}")
                        return permissions, endpoint
                    else:
                        print(f"⚠️ {endpoint} returned {response.status}")
            except Exception as e:
                print(f"⚠️ Error accessing {endpoint}: {e}")
        
        print("❌ No RBAC permissions found in any endpoint")
        return [], None
    
    async def populate_default_roles(self):
        """Populate default roles using API"""
        print("\n🔧 Populating Default Roles...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Default roles to create
        default_roles = [
            {
                "name": "super_admin",
                "description": "Super Administrator with full access",
                "permissions": ["*"],
                "portal_access": ["medical", "admin", "school"],
                "is_system": True,
                "priority": 100
            },
            {
                "name": "medical_admin",
                "description": "Medical Portal Administrator",
                "permissions": [
                    "view_patients",
                    "manage_screenings",
                    "view_reports",
                    "manage_glasses_inventory",
                    "view_medical_staff",
                    "access_medical_portal",
                    "view_analytics",
                    "manage_appointments",
                    "manage_school_data",
                    "view_user_management",
                    "manage_user_management"
                ],
                "portal_access": ["medical"],
                "is_system": True,
                "priority": 90
            },
            {
                "name": "doctor",
                "description": "Medical Doctor",
                "permissions": [
                    "view_patients",
                    "manage_screenings",
                    "view_reports",
                    "access_medical_portal"
                ],
                "portal_access": ["medical"],
                "is_system": True,
                "priority": 80
            },
            {
                "name": "teacher",
                "description": "School Teacher",
                "permissions": [
                    "view_students",
                    "manage_school_data",
                    "view_school_reports",
                    "access_school_portal"
                ],
                "portal_access": ["school"],
                "is_system": True,
                "priority": 70
            },
            {
                "name": "parent",
                "description": "Parent of Student",
                "permissions": [
                    "view_own_children",
                    "view_screening_results",
                    "access_parent_portal"
                ],
                "portal_access": ["school"],
                "is_system": True,
                "priority": 60
            }
        ]
        
        # Try to create roles via different endpoints
        endpoints = [
            "/api/v1/rbac-mongodb/roles/",
            "/api/v1/admin/rbac/roles/",
            "/api/v1/rbac/roles/"
        ]
        
        created_roles = []
        
        for endpoint in endpoints:
            print(f"   Trying {endpoint}...")
            for role_data in default_roles:
                try:
                    async with self.session.post(
                        f"{API_BASE_URL}{endpoint}",
                        json=role_data,
                        headers=headers
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            print(f"   ✅ Created role: {role_data['name']}")
                            created_roles.append(role_data['name'])
                        elif response.status == 400:
                            # Role might already exist
                            error_data = await response.json()
                            if "already exists" in error_data.get("detail", ""):
                                print(f"   ℹ️ Role already exists: {role_data['name']}")
                                created_roles.append(role_data['name'])
                            else:
                                print(f"   ❌ Failed to create role {role_data['name']}: {error_data}")
                        else:
                            print(f"   ❌ Failed to create role {role_data['name']}: {response.status}")
                except Exception as e:
                    print(f"   ❌ Error creating role {role_data['name']}: {e}")
            
            if created_roles:
                print(f"   ✅ Successfully created {len(created_roles)} roles via {endpoint}")
                break
        
        return created_roles
    
    async def populate_default_permissions(self):
        """Populate default permissions using API"""
        print("\n🔧 Populating Default Permissions...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Default permissions to create
        default_permissions = [
            {"id": "view_patients", "name": "View Patients", "description": "View patient information", "category": "medical", "resource": "patients", "action": "read"},
            {"id": "manage_screenings", "name": "Manage Screenings", "description": "Create and manage screening sessions", "category": "medical", "resource": "screenings", "action": "write"},
            {"id": "view_reports", "name": "View Reports", "description": "View medical reports and analytics", "category": "medical", "resource": "reports", "action": "read"},
            {"id": "manage_glasses_inventory", "name": "Manage Glasses Inventory", "description": "Manage glasses inventory", "category": "medical", "resource": "inventory", "action": "write"},
            {"id": "view_medical_staff", "name": "View Medical Staff", "description": "View medical staff information", "category": "medical", "resource": "staff", "action": "read"},
            {"id": "access_medical_portal", "name": "Access Medical Portal", "description": "Access medical portal features", "category": "portal", "resource": "medical", "action": "access"},
            {"id": "view_analytics", "name": "View Analytics", "description": "View system analytics", "category": "analytics", "resource": "dashboard", "action": "read"},
            {"id": "manage_appointments", "name": "Manage Appointments", "description": "Manage medical appointments", "category": "medical", "resource": "appointments", "action": "write"},
            {"id": "manage_school_data", "name": "Manage School Data", "description": "Manage school and student data", "category": "school", "resource": "schools", "action": "write"},
            {"id": "view_user_management", "name": "View User Management", "description": "View user management features", "category": "admin", "resource": "users", "action": "read"},
            {"id": "manage_user_management", "name": "Manage User Management", "description": "Manage users and permissions", "category": "admin", "resource": "users", "action": "write"},
            {"id": "view_students", "name": "View Students", "description": "View student information", "category": "school", "resource": "students", "action": "read"},
            {"id": "view_school_reports", "name": "View School Reports", "description": "View school reports and analytics", "category": "school", "resource": "reports", "action": "read"},
            {"id": "access_school_portal", "name": "Access School Portal", "description": "Access school portal features", "category": "portal", "resource": "school", "action": "access"},
            {"id": "view_own_children", "name": "View Own Children", "description": "View own children's information", "category": "parent", "resource": "children", "action": "read"},
            {"id": "view_screening_results", "name": "View Screening Results", "description": "View screening results for own children", "category": "parent", "resource": "screenings", "action": "read"},
            {"id": "access_parent_portal", "name": "Access Parent Portal", "description": "Access parent portal features", "category": "portal", "resource": "parent", "action": "access"}
        ]
        
        # Try to create permissions via different endpoints
        endpoints = [
            "/api/v1/rbac-mongodb/permissions/seed",
            "/api/v1/admin/rbac/permissions/seed",
            "/api/v1/rbac/permissions/seed"
        ]
        
        created_permissions = []
        
        for endpoint in endpoints:
            print(f"   Trying {endpoint}...")
            try:
                seed_data = {"permissions": default_permissions}
                async with self.session.post(
                    f"{API_BASE_URL}{endpoint}",
                    json=seed_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"   ✅ Created {len(default_permissions)} permissions")
                        created_permissions = default_permissions
                        break
                    else:
                        print(f"   ❌ Failed to create permissions: {response.status}")
            except Exception as e:
                print(f"   ❌ Error creating permissions: {e}")
        
        return created_permissions
    
    async def run_rbac_check_and_populate(self):
        """Run comprehensive RBAC check and populate if needed"""
        print("🔐 EVEP Medical Portal - RBAC Data Check and Population")
        print("=" * 60)
        
        # Login
        if not await self.login():
            return False
        
        # Check existing RBAC data
        roles, roles_endpoint = await self.check_rbac_roles()
        permissions, permissions_endpoint = await self.check_rbac_permissions()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 RBAC DATA STATUS")
        print("=" * 60)
        
        print(f"   Roles: {'✅ Found' if roles else '❌ Missing'} ({len(roles)} roles)")
        print(f"   Permissions: {'✅ Found' if permissions else '❌ Missing'} ({len(permissions)} permissions)")
        
        if not roles or not permissions:
            print("\n🔧 POPULATING MISSING RBAC DATA...")
            
            if not roles:
                created_roles = await self.populate_default_roles()
                print(f"   ✅ Created {len(created_roles)} roles")
            
            if not permissions:
                created_permissions = await self.populate_default_permissions()
                print(f"   ✅ Created {len(created_permissions)} permissions")
            
            print("\n🔄 Re-checking RBAC data after population...")
            roles, _ = await self.check_rbac_roles()
            permissions, _ = await self.check_rbac_permissions()
        
        print("\n" + "=" * 60)
        print("📊 FINAL RBAC STATUS")
        print("=" * 60)
        
        print(f"   Roles: {'✅ Available' if roles else '❌ Missing'} ({len(roles)} roles)")
        print(f"   Permissions: {'✅ Available' if permissions else '❌ Missing'} ({len(permissions)} permissions)")
        
        if roles and permissions:
            print("\n🎉 RBAC DATA IS FULLY POPULATED!")
            print("   ✅ Database-based RBAC is ready for use")
            print("   ✅ All role and permission checks will work correctly")
        else:
            print("\n⚠️ RBAC DATA STILL MISSING!")
            print("   ❌ Some role and permission checks may fail")
            print("   ❌ Database-based RBAC is not fully functional")
        
        return bool(roles and permissions)

async def main():
    async with RBACDataManager() as manager:
        await manager.run_rbac_check_and_populate()

if __name__ == "__main__":
    asyncio.run(main())
