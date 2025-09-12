#!/usr/bin/env python3
"""
Summarize User Roles Script for EVEP Medical Portal
This script provides a comprehensive summary of all user roles created in the system.
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

class UserRolesSummarizer:
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

    async def get_all_users(self):
        """Get all users from the system"""
        print("\n📊 Fetching all users from the system...")
        
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/admin/users",
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                users = result.get('users', [])
                print(f"✅ Retrieved {len(users)} users from the system")
                return users
            else:
                error_text = await response.text()
                print(f"❌ Failed to get users: {response.status} - {error_text}")
                return []

    async def get_dashboard_stats(self):
        """Get dashboard statistics"""
        print("\n📈 Fetching dashboard statistics...")
        
        async with self.session.get(
            f"{API_BASE_URL}/api/v1/dashboard/stats",
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                print("✅ Retrieved dashboard statistics")
                return result
            else:
                error_text = await response.text()
                print(f"❌ Failed to get dashboard stats: {response.status} - {error_text}")
                return {}

    def analyze_user_roles(self, users):
        """Analyze and categorize users by role"""
        role_counts = {}
        role_details = {}
        
        for user in users:
            role = user.get('role', 'unknown')
            if role not in role_counts:
                role_counts[role] = 0
                role_details[role] = []
            
            role_counts[role] += 1
            role_details[role].append({
                'id': user.get('user_id', 'N/A'),
                'name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                'email': user.get('email', 'N/A'),
                'organization': user.get('organization', 'N/A'),
                'is_active': user.get('is_active', False)
            })
        
        return role_counts, role_details

    def print_summary(self, role_counts, role_details, dashboard_stats):
        """Print comprehensive summary"""
        print("\n" + "="*80)
        print("🎯 EVEP MEDICAL PORTAL - COMPREHENSIVE USER ROLES SUMMARY")
        print("="*80)
        
        print(f"\n📊 DASHBOARD STATISTICS:")
        print(f"  • Total Students: {dashboard_stats.get('totalStudents', 0)}")
        print(f"  • Total Teachers: {dashboard_stats.get('totalTeachers', 0)}")
        print(f"  • Total Schools: {dashboard_stats.get('totalSchools', 0)}")
        print(f"  • Total Patients: {dashboard_stats.get('totalPatients', 0)}")
        print(f"  • Total Screenings: {dashboard_stats.get('totalScreenings', 0)}")
        
        print(f"\n👥 USER ROLES BREAKDOWN:")
        print(f"  Total Users: {sum(role_counts.values())}")
        print(f"  Total Roles: {len(role_counts)}")
        
        # Sort roles by count (descending)
        sorted_roles = sorted(role_counts.items(), key=lambda x: x[1], reverse=True)
        
        for role, count in sorted_roles:
            print(f"\n  🔹 {role.upper()}: {count} users")
            
            # Show first 3 users of each role
            for i, user in enumerate(role_details[role][:3]):
                status = "✅ Active" if user['is_active'] else "❌ Inactive"
                print(f"    {i+1}. {user['name']} ({user['email']}) - {status}")
            
            if len(role_details[role]) > 3:
                print(f"    ... and {len(role_details[role]) - 3} more")
        
        print(f"\n📋 ROLE CATEGORIES:")
        
        # Categorize roles
        admin_roles = [role for role in role_counts.keys() if 'admin' in role.lower() or role in ['super_admin', 'executive']]
        medical_roles = [role for role in role_counts.keys() if role in ['doctor', 'nurse', 'optometrist', 'medical_staff', 'technician']]
        school_roles = [role for role in role_counts.keys() if role in ['teacher', 'parent', 'student']]
        hospital_roles = [role for role in role_counts.keys() if 'hospital' in role.lower() or role in ['coordinator', 'assistant']]
        general_roles = [role for role in role_counts.keys() if role in ['general_user']]
        
        if admin_roles:
            admin_total = sum(role_counts[role] for role in admin_roles)
            print(f"  🛡️  ADMINISTRATIVE ROLES: {admin_total} users")
            for role in admin_roles:
                print(f"    • {role}: {role_counts[role]} users")
        
        if medical_roles:
            medical_total = sum(role_counts[role] for role in medical_roles)
            print(f"  🏥 MEDICAL ROLES: {medical_total} users")
            for role in medical_roles:
                print(f"    • {role}: {role_counts[role]} users")
        
        if school_roles:
            school_total = sum(role_counts[role] for role in school_roles)
            print(f"  🎓 SCHOOL ROLES: {school_total} users")
            for role in school_roles:
                print(f"    • {role}: {role_counts[role]} users")
        
        if hospital_roles:
            hospital_total = sum(role_counts[role] for role in hospital_roles)
            print(f"  🏥 HOSPITAL ROLES: {hospital_total} users")
            for role in hospital_roles:
                print(f"    • {role}: {role_counts[role]} users")
        
        if general_roles:
            general_total = sum(role_counts[role] for role in general_roles)
            print(f"  👤 GENERAL ROLES: {general_total} users")
            for role in general_roles:
                print(f"    • {role}: {role_counts[role]} users")
        
        print(f"\n✅ SUMMARY COMPLETE!")
        print("="*80)

    async def run(self):
        """Run the user roles summarization process"""
        print("🚀 Starting EVEP Medical Portal User Roles Summary...")
        
        # Login first
        if not await self.login():
            print("❌ Cannot proceed without authentication")
            return

        try:
            # Get all data
            users = await self.get_all_users()
            dashboard_stats = await self.get_dashboard_stats()
            
            if users:
                # Analyze user roles
                role_counts, role_details = self.analyze_user_roles(users)
                
                # Print comprehensive summary
                self.print_summary(role_counts, role_details, dashboard_stats)
            else:
                print("❌ No users found in the system")
            
        except Exception as e:
            print(f"❌ Error during user roles summarization: {str(e)}")

async def main():
    async with UserRolesSummarizer() as summarizer:
        await summarizer.run()

if __name__ == "__main__":
    asyncio.run(main())
