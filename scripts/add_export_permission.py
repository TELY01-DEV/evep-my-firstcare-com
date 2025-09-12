#!/usr/bin/env python3
"""
Add Export Permission to Admin User
This script adds the 'export_data' permission to the admin user.
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

class ExportPermissionAdder:
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
    
    async def add_export_permission(self):
        """Add export_data permission to admin user"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # First, get the admin user's current permissions
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    users = result.get("users", [])
                    
                    # Find the admin user
                    admin_user = None
                    for user in users:
                        if user.get("email") == ADMIN_EMAIL:
                            admin_user = user
                            break
                    
                    if not admin_user:
                        print("❌ Admin user not found")
                        return False
                    
                    user_id = admin_user.get("id")
                    print(f"📋 Found admin user: {admin_user.get('first_name')} {admin_user.get('last_name')} (ID: {user_id})")
                    
                    # Add export_data permission
                    permission_data = {
                        "permission": "export_data",
                        "description": "Allow user to export data to CSV"
                    }
                    
                    async with self.session.post(
                        f"{API_BASE_URL}/api/v1/admin/rbac/permissions",
                        json=permission_data,
                        headers=headers
                    ) as response:
                        if response.status in [200, 201]:
                            result = await response.json()
                            print(f"✅ Created export_data permission")
                        elif response.status == 400:
                            error_text = await response.text()
                            if "already exists" in error_text:
                                print(f"⚠️ export_data permission already exists")
                            else:
                                print(f"❌ Failed to create permission: {error_text}")
                                return False
                        else:
                            error_text = await response.text()
                            print(f"❌ Failed to create permission: {response.status} - {error_text}")
                            return False
                    
                    # Assign permission to admin user
                    assign_data = {
                        "user_id": user_id,
                        "permission": "export_data"
                    }
                    
                    async with self.session.post(
                        f"{API_BASE_URL}/api/v1/admin/rbac/assign-permission",
                        json=assign_data,
                        headers=headers
                    ) as response:
                        if response.status in [200, 201]:
                            result = await response.json()
                            print(f"✅ Assigned export_data permission to admin user")
                            return True
                        elif response.status == 400:
                            error_text = await response.text()
                            if "already has" in error_text:
                                print(f"⚠️ Admin user already has export_data permission")
                                return True
                            else:
                                print(f"❌ Failed to assign permission: {error_text}")
                                return False
                        else:
                            error_text = await response.text()
                            print(f"❌ Failed to assign permission: {response.status} - {error_text}")
                            return False
                else:
                    print(f"❌ Failed to get users: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Error adding export permission: {str(e)}")
            return False
    
    async def test_csv_export(self):
        """Test CSV export after adding permission"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/csv-export/dashboard-summary",
                headers=headers
            ) as response:
                if response.status == 200:
                    csv_content = await response.text()
                    print(f"✅ CSV export successful!")
                    print(f"📄 CSV content preview:")
                    print(csv_content[:200] + "..." if len(csv_content) > 200 else csv_content)
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ CSV export failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error testing CSV export: {str(e)}")
            return False

async def main():
    """Main function"""
    print("🔐 EVEP Medical Portal - Add Export Permission")
    print("=" * 50)
    
    async with ExportPermissionAdder() as adder:
        if await adder.login():
            if await adder.add_export_permission():
                print("\n🧪 Testing CSV export...")
                await adder.test_csv_export()
            else:
                print("❌ Failed to add export permission")
        else:
            print("❌ Cannot proceed - login failed")

if __name__ == "__main__":
    asyncio.run(main())
