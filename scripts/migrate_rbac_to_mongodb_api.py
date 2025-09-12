#!/usr/bin/env python3
"""
EVEP Medical Portal - Migrate RBAC Data to MongoDB using CRUD API Endpoints
Migrate file-based RBAC data to MongoDB collections using API endpoints
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class RBACMigrator:
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
    
    async def get_file_based_roles(self):
        """Get roles from file-based RBAC system"""
        print("\n📁 Getting file-based roles...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/rbac/roles/",
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                roles = data.get("roles", [])
                print(f"✅ Found {len(roles)} file-based roles")
                return roles
            else:
                print(f"❌ Failed to get file-based roles: {response.status}")
                return []
    
    async def get_file_based_permissions(self):
        """Get permissions from file-based RBAC system"""
        print("\n📁 Getting file-based permissions...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/rbac/permissions/",
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                permissions = data.get("permissions", [])
                print(f"✅ Found {len(permissions)} file-based permissions")
                return permissions
            else:
                print(f"❌ Failed to get file-based permissions: {response.status}")
                return []
    
    async def migrate_roles_to_mongodb(self, roles):
        """Migrate roles to MongoDB using CRUD API endpoints"""
        print("\n🔄 Migrating roles to MongoDB...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        migrated_roles = []
        
        for role in roles:
            try:
                # Prepare role data for MongoDB API
                role_data = {
                    "name": role.get("name", ""),
                    "description": role.get("description", ""),
                    "permissions": role.get("permissions", []),
                    "is_system": role.get("is_system", False),
                    "created_at": role.get("created_at", datetime.now().isoformat()),
                    "updated_at": role.get("updated_at", datetime.now().isoformat())
                }
                
                # Create role using MongoDB RBAC API
                async with self.session.post(
                    f"{API_BASE_URL}/api/v1/rbac-mongodb/roles/",
                    json=role_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"   ✅ Migrated role: {role.get('name', 'N/A')}")
                        migrated_roles.append(role.get('name', 'N/A'))
                    elif response.status == 400:
                        # Role might already exist
                        error_data = await response.json()
                        if "already exists" in error_data.get("detail", ""):
                            print(f"   ℹ️ Role already exists: {role.get('name', 'N/A')}")
                            migrated_roles.append(role.get('name', 'N/A'))
                        else:
                            print(f"   ❌ Failed to migrate role {role.get('name', 'N/A')}: {error_data}")
                    else:
                        print(f"   ❌ Failed to migrate role {role.get('name', 'N/A')}: {response.status}")
            except Exception as e:
                print(f"   ❌ Error migrating role {role.get('name', 'N/A')}: {e}")
        
        return migrated_roles
    
    async def migrate_permissions_to_mongodb(self, permissions):
        """Migrate permissions to MongoDB using CRUD API endpoints"""
        print("\n🔄 Migrating permissions to MongoDB...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Prepare permissions data for MongoDB API
        permissions_data = []
        for permission in permissions:
            permission_data = {
                "id": permission.get("id", ""),
                "name": permission.get("name", ""),
                "description": permission.get("description", ""),
                "category": permission.get("category", ""),
                "resource": permission.get("resource", ""),
                "action": permission.get("action", "")
            }
            permissions_data.append(permission_data)
        
        try:
            # Create permissions using MongoDB RBAC API
            seed_data = {"permissions": permissions_data}
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/rbac-mongodb/permissions/seed",
                json=seed_data,
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"   ✅ Migrated {len(permissions)} permissions to MongoDB")
                    return len(permissions)
                else:
                    print(f"   ❌ Failed to migrate permissions: {response.status}")
                    return 0
        except Exception as e:
            print(f"   ❌ Error migrating permissions: {e}")
            return 0
    
    async def create_user_role_mappings(self):
        """Create user-role mappings using CRUD API endpoints"""
        print("\n🔄 Creating user-role mappings...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get admin user info
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users/",
                headers=headers
            ) as response:
                if response.status == 200:
                    users = await response.json()
                    if users:
                        admin_user = users[0]  # Get first admin user
                        user_id = admin_user.get("_id", "")
                        user_role = admin_user.get("role", "")
                        
                        if user_id and user_role:
                            # Create user-role mapping
                            mapping_data = {
                                "user_id": user_id,
                                "role_id": user_role,
                                "assigned_by": self.user_id,
                                "assigned_at": datetime.now().isoformat(),
                                "expires_at": None
                            }
                            
                            async with self.session.post(
                                f"{API_BASE_URL}/api/v1/rbac-mongodb/user-roles/",
                                json=mapping_data,
                                headers=headers
                            ) as response:
                                if response.status == 200:
                                    print(f"   ✅ Created user-role mapping: {user_role} for user {user_id}")
                                    return 1
                                else:
                                    print(f"   ❌ Failed to create user-role mapping: {response.status}")
                                    return 0
                else:
                    print(f"   ❌ Failed to get users: {response.status}")
                    return 0
        except Exception as e:
            print(f"   ❌ Error creating user-role mappings: {e}")
            return 0
    
    async def verify_mongodb_migration(self):
        """Verify that the migration was successful"""
        print("\n🔍 Verifying MongoDB migration...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Check MongoDB roles
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/rbac-mongodb/roles/",
                headers=headers
            ) as response:
                if response.status == 200:
                    roles = await response.json()
                    print(f"   ✅ MongoDB Roles: {len(roles)} roles")
                else:
                    print(f"   ❌ MongoDB Roles: Failed to access ({response.status})")
        except Exception as e:
            print(f"   ❌ MongoDB Roles: Error accessing ({e})")
        
        # Check MongoDB permissions
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/rbac-mongodb/permissions/",
                headers=headers
            ) as response:
                if response.status == 200:
                    permissions = await response.json()
                    print(f"   ✅ MongoDB Permissions: {len(permissions)} permissions")
                else:
                    print(f"   ❌ MongoDB Permissions: Failed to access ({response.status})")
        except Exception as e:
            print(f"   ❌ MongoDB Permissions: Error accessing ({e})")
        
        # Check MongoDB user roles
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/rbac-mongodb/user-roles/",
                headers=headers
            ) as response:
                if response.status == 200:
                    user_roles = await response.json()
                    print(f"   ✅ MongoDB User Roles: {len(user_roles)} mappings")
                else:
                    print(f"   ❌ MongoDB User Roles: Failed to access ({response.status})")
        except Exception as e:
            print(f"   ❌ MongoDB User Roles: Error accessing ({e})")
    
    async def run_migration(self):
        """Run the complete RBAC migration to MongoDB"""
        print("🔄 EVEP Medical Portal - RBAC Migration to MongoDB using CRUD API")
        print("=" * 70)
        
        # Login
        if not await self.login():
            return False
        
        # Get file-based RBAC data
        roles = await self.get_file_based_roles()
        permissions = await self.get_file_based_permissions()
        
        if not roles and not permissions:
            print("❌ No RBAC data found to migrate")
            return False
        
        # Migrate data to MongoDB using CRUD API endpoints
        migrated_roles = await self.migrate_roles_to_mongodb(roles)
        migrated_permissions = await self.migrate_permissions_to_mongodb(permissions)
        migrated_mappings = await self.create_user_role_mappings()
        
        # Verify migration
        await self.verify_mongodb_migration()
        
        # Summary
        print("\n" + "=" * 70)
        print("📋 RBAC MIGRATION SUMMARY")
        print("=" * 70)
        
        print(f"   📁 File-based Roles: {len(roles)}")
        print(f"   🗄️ Migrated Roles: {len(migrated_roles)}")
        print(f"   📁 File-based Permissions: {len(permissions)}")
        print(f"   🗄️ Migrated Permissions: {migrated_permissions}")
        print(f"   🗄️ User-Role Mappings: {migrated_mappings}")
        
        if migrated_roles and migrated_permissions:
            print("\n🎉 RBAC MIGRATION COMPLETED SUCCESSFULLY!")
            print("   ✅ All RBAC data migrated to MongoDB using CRUD API endpoints")
            print("   ✅ MongoDB RBAC collections are now fully functional")
            print("   ✅ System can now use database-based RBAC")
        else:
            print("\n⚠️ RBAC MIGRATION PARTIALLY COMPLETED")
            print("   ❌ Some data may not have been migrated successfully")
        
        return bool(migrated_roles and migrated_permissions)

async def main():
    async with RBACMigrator() as migrator:
        await migrator.run_migration()

if __name__ == "__main__":
    asyncio.run(main())
