#!/usr/bin/env python3
"""
EVEP Medical Portal - Check RBAC Collections
Check which collections are being used for RBAC in the database
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class RBACCollectionsChecker:
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
    
    async def check_collections(self):
        """Check which collections are being used for RBAC"""
        print("\n🔍 CHECKING RBAC COLLECTIONS")
        print("=" * 50)
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Check different data sources
        collections_info = {}
        
        # 1. Check admin_users collection (primary user data)
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users/",
                headers=headers
            ) as response:
                if response.status == 200:
                    users = await response.json()
                    collections_info["admin_users"] = {
                        "count": len(users),
                        "source": "MongoDB Collection: db.evep.admin_users",
                        "purpose": "Primary user data with role field",
                        "sample_roles": [user.get("role", "N/A") for user in users[:3]]
                    }
                else:
                    collections_info["admin_users"] = {"error": f"Status {response.status}"}
        except Exception as e:
            collections_info["admin_users"] = {"error": str(e)}
        
        # 2. Check file-based RBAC data
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/rbac/roles/",
                headers=headers
            ) as response:
                if response.status == 200:
                    roles_data = await response.json()
                    collections_info["rbac_roles_file"] = {
                        "count": len(roles_data.get("roles", [])),
                        "source": "File: ./rbac_data/rbac_roles.json",
                        "purpose": "Role definitions and permissions",
                        "sample_roles": [role.get("name", "N/A") for role in roles_data.get("roles", [])[:3]]
                    }
                else:
                    collections_info["rbac_roles_file"] = {"error": f"Status {response.status}"}
        except Exception as e:
            collections_info["rbac_roles_file"] = {"error": str(e)}
        
        try:
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/rbac/permissions/",
                headers=headers
            ) as response:
                if response.status == 200:
                    permissions_data = await response.json()
                    collections_info["rbac_permissions_file"] = {
                        "count": len(permissions_data.get("permissions", [])),
                        "source": "File: ./rbac_data/rbac_permissions.json",
                        "purpose": "Permission definitions",
                        "sample_permissions": [perm.get("name", "N/A") for perm in permissions_data.get("permissions", [])[:3]]
                    }
                else:
                    collections_info["rbac_permissions_file"] = {"error": f"Status {response.status}"}
        except Exception as e:
            collections_info["rbac_permissions_file"] = {"error": str(e)}
        
        # 3. Check MongoDB RBAC collections (if they exist)
        mongodb_collections = [
            "rbac_roles",
            "rbac_permissions", 
            "rbac_user_roles"
        ]
        
        for collection_name in mongodb_collections:
            try:
                # Try to access via MongoDB RBAC endpoints
                endpoint = f"/api/v1/rbac-mongodb/{collection_name.replace('rbac_', '')}/"
                async with self.session.get(
                    f"{API_BASE_URL}{endpoint}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        collections_info[f"mongodb_{collection_name}"] = {
                            "count": len(data) if isinstance(data, list) else 1,
                            "source": f"MongoDB Collection: db.{collection_name}",
                            "purpose": f"MongoDB-based {collection_name}",
                            "status": "Available"
                        }
                    else:
                        collections_info[f"mongodb_{collection_name}"] = {
                            "count": 0,
                            "source": f"MongoDB Collection: db.{collection_name}",
                            "purpose": f"MongoDB-based {collection_name}",
                            "status": f"Not accessible (Status: {response.status})"
                        }
            except Exception as e:
                collections_info[f"mongodb_{collection_name}"] = {
                    "count": 0,
                    "source": f"MongoDB Collection: db.{collection_name}",
                    "purpose": f"MongoDB-based {collection_name}",
                    "status": f"Error: {str(e)}"
                }
        
        return collections_info
    
    async def run_collections_check(self):
        """Run comprehensive RBAC collections check"""
        print("🗄️ EVEP Medical Portal - RBAC Collections Check")
        print("=" * 60)
        
        # Login
        if not await self.login():
            return False
        
        # Check collections
        collections_info = await self.check_collections()
        
        # Display results
        print("\n📊 RBAC COLLECTIONS SUMMARY")
        print("=" * 60)
        
        for collection_name, info in collections_info.items():
            print(f"\n📁 {collection_name.upper()}:")
            if "error" in info:
                print(f"   ❌ Error: {info['error']}")
            else:
                print(f"   📊 Count: {info['count']}")
                print(f"   📍 Source: {info['source']}")
                print(f"   🎯 Purpose: {info['purpose']}")
                if "status" in info:
                    print(f"   🔄 Status: {info['status']}")
                if "sample_roles" in info:
                    print(f"   👥 Sample Roles: {', '.join(info['sample_roles'])}")
                elif "sample_permissions" in info:
                    print(f"   🔐 Sample Permissions: {', '.join(info['sample_permissions'])}")
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 RBAC COLLECTIONS SUMMARY")
        print("=" * 60)
        
        active_collections = []
        for name, info in collections_info.items():
            if "error" not in info and info.get("count", 0) > 0:
                active_collections.append(name)
        
        print(f"✅ Active Collections: {len(active_collections)}")
        for collection in active_collections:
            print(f"   - {collection}")
        
        print(f"\n🎯 PRIMARY RBAC DATA SOURCES:")
        print(f"   1. User Roles: admin_users collection (MongoDB)")
        print(f"   2. Role Definitions: rbac_roles.json (File)")
        print(f"   3. Permission Definitions: rbac_permissions.json (File)")
        print(f"   4. User-Role Mappings: rbac_user_roles.json (File)")
        
        print(f"\n🔧 RBAC SYSTEM ARCHITECTURE:")
        print(f"   - Primary: File-based RBAC (JSON files)")
        print(f"   - Fallback: MongoDB collections (when available)")
        print(f"   - User Data: MongoDB admin_users collection")
        print(f"   - Access Control: Database-based functions with file fallback")
        
        return True

async def main():
    async with RBACCollectionsChecker() as checker:
        await checker.run_collections_check()

if __name__ == "__main__":
    asyncio.run(main())
