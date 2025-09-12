#!/usr/bin/env python3
"""
Add Comprehensive User Roles Script for EVEP Medical Portal
This script adds comprehensive user roles including optometrists and other missing roles.
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
LOGIN_EMAIL = "admin@evep.com"
LOGIN_PASSWORD = "admin123"

class ComprehensiveRolesPopulator:
    def __init__(self):
        self.session = None
        self.token = None
        self.created_ids = {
            'optometrists': [],
            'technicians': [],
            'coordinators': [],
            'assistants': [],
            'hospital_exclusive': []
        }

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

    async def create_optometrists_via_admin(self):
        """Create optometrists using admin endpoint instead of medical staff management"""
        print("\n👁️ Creating optometrists via admin endpoint...")
        
        optometrists_data = [
            {
                "email": "optometrist1@hospital.com",
                "password": "password123",
                "first_name": "สมพร",
                "last_name": "ทัศนมาตรดี",
                "role": "optometrist",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            },
            {
                "email": "optometrist2@hospital.com",
                "password": "password123",
                "first_name": "วิชัย",
                "last_name": "ทัศนมาตรเก่ง",
                "role": "optometrist",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            }
        ]

        for optometrist_data in optometrists_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=optometrist_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    optometrist_id = result.get('user_id')
                    self.created_ids['optometrists'].append(optometrist_id)
                    print(f"✅ Created optometrist: {optometrist_data['first_name']} {optometrist_data['last_name']} (ID: {optometrist_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create optometrist {optometrist_data['first_name']}: {response.status} - {error_text}")

    async def create_technicians(self):
        """Create technicians using admin endpoint"""
        print("\n🔧 Creating technicians...")
        
        technicians_data = [
            {
                "email": "technician1@hospital.com",
                "password": "password123",
                "first_name": "สมชาย",
                "last_name": "ช่างเทคนิค",
                "role": "technician",
                "organization": "โรงพยาบาลกรุงเทพ",
                "is_active": True
            },
            {
                "email": "technician2@hospital.com",
                "password": "password123",
                "first_name": "สมหญิง",
                "last_name": "ช่างเทคนิค",
                "role": "technician",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            }
        ]

        for technician_data in technicians_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=technician_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    technician_id = result.get('user_id')
                    self.created_ids['technicians'].append(technician_id)
                    print(f"✅ Created technician: {technician_data['first_name']} {technician_data['last_name']} (ID: {technician_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create technician {technician_data['first_name']}: {response.status} - {error_text}")

    async def create_coordinators(self):
        """Create coordinators using admin endpoint"""
        print("\n📋 Creating coordinators...")
        
        coordinators_data = [
            {
                "email": "coordinator1@hospital.com",
                "password": "password123",
                "first_name": "มาลี",
                "last_name": "ผู้ประสานงาน",
                "role": "coordinator",
                "organization": "โรงพยาบาลกรุงเทพ",
                "is_active": True
            },
            {
                "email": "coordinator2@school.ac.th",
                "password": "password123",
                "first_name": "วิชัย",
                "last_name": "ผู้ประสานงาน",
                "role": "coordinator",
                "organization": "โรงเรียนอนุบาลกรุงเทพ",
                "is_active": True
            }
        ]

        for coordinator_data in coordinators_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=coordinator_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    coordinator_id = result.get('user_id')
                    self.created_ids['coordinators'].append(coordinator_id)
                    print(f"✅ Created coordinator: {coordinator_data['first_name']} {coordinator_data['last_name']} (ID: {coordinator_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create coordinator {coordinator_data['first_name']}: {response.status} - {error_text}")

    async def create_assistants(self):
        """Create assistants using admin endpoint"""
        print("\n🤝 Creating assistants...")
        
        assistants_data = [
            {
                "email": "assistant1@hospital.com",
                "password": "password123",
                "first_name": "สมศักดิ์",
                "last_name": "ผู้ช่วย",
                "role": "assistant",
                "organization": "โรงพยาบาลกรุงเทพ",
                "is_active": True
            },
            {
                "email": "assistant2@hospital.com",
                "password": "password123",
                "first_name": "สมพร",
                "last_name": "ผู้ช่วย",
                "role": "assistant",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            }
        ]

        for assistant_data in assistants_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=assistant_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    assistant_id = result.get('user_id')
                    self.created_ids['assistants'].append(assistant_id)
                    print(f"✅ Created assistant: {assistant_data['first_name']} {assistant_data['last_name']} (ID: {assistant_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create assistant {assistant_data['first_name']}: {response.status} - {error_text}")

    async def create_hospital_exclusive_users(self):
        """Create hospital exclusive users using admin endpoint"""
        print("\n🏥 Creating hospital exclusive users...")
        
        hospital_exclusive_data = [
            {
                "email": "hospital.exclusive1@hospital.com",
                "password": "password123",
                "first_name": "สมชาย",
                "last_name": "โรงพยาบาลเฉพาะ",
                "role": "exclusive_hospital",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            },
            {
                "email": "hospital.exclusive2@hospital.com",
                "password": "password123",
                "first_name": "สมหญิง",
                "last_name": "โรงพยาบาลเฉพาะ",
                "role": "exclusive_hospital",
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "is_active": True
            }
        ]

        for exclusive_data in hospital_exclusive_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=exclusive_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    exclusive_id = result.get('user_id')
                    self.created_ids['hospital_exclusive'].append(exclusive_id)
                    print(f"✅ Created hospital exclusive user: {exclusive_data['first_name']} {exclusive_data['last_name']} (ID: {exclusive_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create hospital exclusive user {exclusive_data['first_name']}: {response.status} - {error_text}")

    async def run(self):
        """Run the comprehensive roles population process"""
        print("🚀 Starting EVEP Medical Portal Comprehensive User Roles Population...")
        
        # Login first
        if not await self.login():
            print("❌ Cannot proceed without authentication")
            return

        try:
            # Create comprehensive user roles
            await self.create_optometrists_via_admin()
            await self.create_technicians()
            await self.create_coordinators()
            await self.create_assistants()
            await self.create_hospital_exclusive_users()

            print("\n🎉 Comprehensive user roles population completed!")
            print("\n📊 Summary of created data:")
            for entity_type, ids in self.created_ids.items():
                if ids:
                    print(f"  {entity_type}: {len(ids)} records")
            
        except Exception as e:
            print(f"❌ Error during comprehensive roles population: {str(e)}")

async def main():
    async with ComprehensiveRolesPopulator() as populator:
        await populator.run()

if __name__ == "__main__":
    asyncio.run(main())
