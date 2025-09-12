#!/usr/bin/env python3
"""
Check and Setup RBAC Collections Script
This script checks what collections exist and sets up RBAC data if needed.
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
LOGIN_EMAIL = "admin@evep.com"
LOGIN_PASSWORD = "admin123"

class RBACSetup:
    def __init__(self):
        self.session = None
        self.token = None

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
            "email": LOGIN_EMAIL,
            "password": LOGIN_PASSWORD
        }
        
        async with self.session.post(f"{API_BASE_URL}/api/v1/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                self.token = data.get('access_token')
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status}")
                return False

    def get_headers(self):
        """Get headers with authentication token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def check_rbac_status(self):
        """Check RBAC status and setup if needed"""
        print("\n🔍 Checking RBAC status...")
        
        # Check if roles exist
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/rbac/roles/",
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                data = await response.json()
                roles = data.get('roles', [])
                print(f"✅ Found {len(roles)} roles in database")
                
                # Check if super_admin role exists
                super_admin_role = next((role for role in roles if role['id'] == 'super_admin'), None)
                if super_admin_role:
                    print(f"✅ super_admin role exists with permissions: {super_admin_role['permissions']}")
                else:
                    print("❌ super_admin role not found")
                
                return True
            else:
                print(f"❌ Failed to get roles: {response.status}")
                return False

    async def assign_super_admin_role(self):
        """Assign super_admin role to the admin user"""
        print("\n👤 Assigning super_admin role to admin user...")
        
        # Get user info
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/auth/me",
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                user_data = await response.json()
                user_id = user_data.get('user_id')
                print(f"✅ Found user ID: {user_id}")
                
                # Try to assign super_admin role
                role_assignment = {
                    "user_id": user_id,
                    "role_id": "super_admin"
                }
                
                async with self.session.post(
                    f"{API_BASE_URL}/api/v1/rbac/assign-role",
                    json=role_assignment,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        print("✅ Successfully assigned super_admin role")
                        return True
                    else:
                        error_text = await response.text()
                        print(f"❌ Failed to assign role: {response.status} - {error_text}")
                        return False
            else:
                print(f"❌ Failed to get user info: {response.status}")
                return False

    async def test_dashboard(self):
        """Test dashboard to see if data is now showing"""
        print("\n📊 Testing dashboard...")
        
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/dashboard/stats",
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Dashboard API working")
                print(f"📊 Dashboard data: {json.dumps(data, indent=2)}")
                return True
            else:
                print(f"❌ Dashboard failed: {response.status}")
                return False

    async def run(self):
        """Run the RBAC setup process"""
        print("🚀 Starting RBAC Setup and Check...")
        
        # Login first
        if not await self.login():
            print("❌ Cannot proceed without authentication")
            return

        try:
            # Check RBAC status
            await self.check_rbac_status()
            
            # Try to assign super_admin role
            await self.assign_super_admin_role()
            
            # Test dashboard
            await self.test_dashboard()

            print("\n🎉 RBAC setup completed!")
            
        except Exception as e:
            print(f"❌ Error during RBAC setup: {str(e)}")

async def main():
    async with RBACSetup() as setup:
        await setup.run()

if __name__ == "__main__":
    asyncio.run(main())
