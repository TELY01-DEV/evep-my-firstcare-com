#!/usr/bin/env python3
"""
Add Remaining User Roles Script for EVEP Medical Portal
This script adds the missing user roles using CRUD endpoints.
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

class RemainingRolesPopulator:
    def __init__(self):
        self.session = None
        self.token = None
        self.created_ids = {
            'optometrists': [],
            'exclusive_hospital': [],
            'general_users': []
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

    async def create_optometrists(self):
        """Create optometrists using medical staff management endpoint"""
        print("\n👁️ Creating optometrists...")
        
        optometrists_data = [
            {
                "email": "optometrist1@hospital.com",
                "password": "password123",
                "first_name": "สมพร",
                "last_name": "ทัศนมาตรดี",
                "role": "optometrist",
                "department": "จักษุวิทยา",
                "specialization": "ทัศนมาตร",
                "phone": "092-222-2222",
                "license_number": "OPT001",
                "qualifications": ["ทัศนมาตรศาสตร์บัณฑิต"],
                "is_active": True
            },
            {
                "email": "optometrist2@hospital.com",
                "password": "password123",
                "first_name": "วิชัย",
                "last_name": "ทัศนมาตรเก่ง",
                "role": "optometrist",
                "department": "จักษุวิทยา",
                "specialization": "ทัศนมาตร",
                "phone": "092-333-3333",
                "license_number": "OPT002",
                "qualifications": ["ทัศนมาตรศาสตร์บัณฑิต", "วุฒิบัตรทัศนมาตร"],
                "is_active": True
            }
        ]

        for optometrist_data in optometrists_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/medical-staff-management/",
                json=optometrist_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    optometrist_id = result.get('id')
                    self.created_ids['optometrists'].append(optometrist_id)
                    print(f"✅ Created optometrist: {optometrist_data['first_name']} {optometrist_data['last_name']} (ID: {optometrist_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create optometrist {optometrist_data['first_name']}: {response.status} - {error_text}")

    async def create_exclusive_hospital_users(self):
        """Create exclusive hospital users using admin endpoint"""
        print("\n🏥 Creating exclusive hospital users...")
        
        exclusive_hospital_data = [
            {
                "email": "exclusive.hospital1@hospital.com",
                "password": "password123",
                "first_name": "สมชาย",
                "last_name": "โรงพยาบาลเฉพาะ",
                "role": "exclusive_hospital",
                "portal_access": ["medical"],
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "department": "จักษุวิทยา",
                "specialization": "การจัดการโรงพยาบาลเฉพาะ",
                "phone": "098-888-8888",
                "license_number": "EXCL001",
                "qualifications": ["บริหารธุรกิจมหาบัณฑิต", "การจัดการโรงพยาบาล"],
                "is_active": True,
                "is_verified": True
            },
            {
                "email": "exclusive.hospital2@hospital.com",
                "password": "password123",
                "first_name": "สมหญิง",
                "last_name": "โรงพยาบาลเฉพาะ",
                "role": "exclusive_hospital",
                "portal_access": ["medical"],
                "organization": "โรงพยาบาลจักษุกรุงเทพ",
                "department": "บริหารงาน",
                "specialization": "การบริหารโรงพยาบาลเฉพาะ",
                "phone": "098-999-9999",
                "license_number": "EXCL002",
                "qualifications": ["บริหารธุรกิจมหาบัณฑิต", "การจัดการสาธารณสุข"],
                "is_active": True,
                "is_verified": True
            }
        ]

        for exclusive_data in exclusive_hospital_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=exclusive_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    exclusive_id = result.get('user_id')
                    self.created_ids['exclusive_hospital'].append(exclusive_id)
                    print(f"✅ Created exclusive hospital user: {exclusive_data['first_name']} {exclusive_data['last_name']} (ID: {exclusive_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create exclusive hospital user {exclusive_data['first_name']}: {response.status} - {error_text}")

    async def create_general_users(self):
        """Create general users using admin endpoint"""
        print("\n👤 Creating general users...")
        
        general_users_data = [
            {
                "email": "general.user1@email.com",
                "password": "password123",
                "first_name": "สมชาย",
                "last_name": "ผู้ใช้ทั่วไป",
                "role": "general_user",
                "portal_access": ["school"],
                "organization": "โรงเรียนอนุบาลกรุงเทพ",
                "department": "ทั่วไป",
                "specialization": "ผู้ใช้ทั่วไป",
                "phone": "099-111-1111",
                "license_number": "GEN001",
                "qualifications": [],
                "is_active": True,
                "is_verified": True
            },
            {
                "email": "general.user2@email.com",
                "password": "password123",
                "first_name": "สมหญิง",
                "last_name": "ผู้ใช้ทั่วไป",
                "role": "general_user",
                "portal_access": ["school"],
                "organization": "โรงเรียนประถมศึกษาสาธิต",
                "department": "ทั่วไป",
                "specialization": "ผู้ใช้ทั่วไป",
                "phone": "099-222-2222",
                "license_number": "GEN002",
                "qualifications": [],
                "is_active": True,
                "is_verified": True
            },
            {
                "email": "general.user3@email.com",
                "password": "password123",
                "first_name": "มาลี",
                "last_name": "ผู้ใช้ทั่วไป",
                "role": "general_user",
                "portal_access": ["school"],
                "organization": "โรงเรียนมัธยมศึกษานานาชาติ",
                "department": "ทั่วไป",
                "specialization": "ผู้ใช้ทั่วไป",
                "phone": "099-333-3333",
                "license_number": "GEN003",
                "qualifications": [],
                "is_active": True,
                "is_verified": True
            }
        ]

        for general_data in general_users_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/admin/users",
                json=general_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    general_id = result.get('user_id')
                    self.created_ids['general_users'].append(general_id)
                    print(f"✅ Created general user: {general_data['first_name']} {general_data['last_name']} (ID: {general_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create general user {general_data['first_name']}: {response.status} - {error_text}")

    async def run(self):
        """Run the remaining roles population process"""
        print("🚀 Starting EVEP Medical Portal Remaining User Roles Population...")
        
        # Login first
        if not await self.login():
            print("❌ Cannot proceed without authentication")
            return

        try:
            # Create remaining user roles
            await self.create_optometrists()
            await self.create_exclusive_hospital_users()
            await self.create_general_users()

            print("\n🎉 Remaining user roles population completed!")
            print("\n📊 Summary of created data:")
            for entity_type, ids in self.created_ids.items():
                if ids:
                    print(f"  {entity_type}: {len(ids)} records")
            
        except Exception as e:
            print(f"❌ Error during remaining roles population: {str(e)}")

async def main():
    async with RemainingRolesPopulator() as populator:
        await populator.run()

if __name__ == "__main__":
    asyncio.run(main())
