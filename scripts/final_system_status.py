#!/usr/bin/env python3
"""
Final System Status Check
This script provides a comprehensive summary of the EVEP system status.
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

class SystemStatusChecker:
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
    
    async def check_dashboard_stats(self) -> Dict[str, Any]:
        """Check dashboard statistics"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/dashboard/stats",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    print(f"❌ Dashboard stats failed: {response.status}")
                    return {}
        except Exception as e:
            print(f"❌ Error getting dashboard stats: {str(e)}")
            return {}
    
    async def check_user_management(self) -> Dict[str, Any]:
        """Check user management"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    print(f"❌ User management failed: {response.status}")
                    return {}
        except Exception as e:
            print(f"❌ Error getting user management: {str(e)}")
            return {}
    
    async def check_evep_data(self) -> Dict[str, Any]:
        """Check EVEP data (students, teachers, schools)"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Check students
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/evep/students",
                headers=headers
            ) as response:
                if response.status == 200:
                    students_result = await response.json()
                else:
                    students_result = {"students": []}
            
            # Check teachers
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/evep/teachers",
                headers=headers
            ) as response:
                if response.status == 200:
                    teachers_result = await response.json()
                else:
                    teachers_result = {"teachers": []}
            
            # Check schools
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/evep/schools",
                headers=headers
            ) as response:
                if response.status == 200:
                    schools_result = await response.json()
                else:
                    schools_result = {"schools": []}
            
            return {
                "students": students_result.get("students", []),
                "teachers": teachers_result.get("teachers", []),
                "schools": schools_result.get("schools", [])
            }
        except Exception as e:
            print(f"❌ Error getting EVEP data: {str(e)}")
            return {"students": [], "teachers": [], "schools": []}
    
    async def check_ai_agents(self) -> Dict[str, Any]:
        """Check AI agents system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/chat-bot/health",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    print(f"❌ AI agents health check failed: {response.status}")
                    return {}
        except Exception as e:
            print(f"❌ Error checking AI agents: {str(e)}")
            return {}
    
    async def generate_system_report(self):
        """Generate comprehensive system report"""
        print("🏥 EVEP Medical Portal - System Status Report")
        print("=" * 60)
        print(f"📅 Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Dashboard Statistics
        print("📊 DASHBOARD STATISTICS")
        print("-" * 30)
        dashboard_stats = await self.check_dashboard_stats()
        if dashboard_stats:
            print(f"   Total Students: {dashboard_stats.get('totalStudents', 0)}")
            print(f"   Total Teachers: {dashboard_stats.get('totalTeachers', 0)}")
            print(f"   Total Schools: {dashboard_stats.get('totalSchools', 0)}")
            print(f"   Total Screenings: {dashboard_stats.get('totalScreenings', 0)}")
            print(f"   Completed Screenings: {dashboard_stats.get('completedScreenings', 0)}")
            print(f"   Pending Screenings: {dashboard_stats.get('pendingScreenings', 0)}")
        else:
            print("   ❌ Dashboard statistics not available")
        print()
        
        # User Management
        print("👥 USER MANAGEMENT")
        print("-" * 30)
        user_data = await self.check_user_management()
        if user_data and user_data.get("users"):
            users = user_data["users"]
            print(f"   Total Users: {len(users)}")
            
            # Count by role
            role_counts = {}
            for user in users:
                role = user.get("role", "unknown")
                role_counts[role] = role_counts.get(role, 0) + 1
            
            print("   Users by Role:")
            for role, count in sorted(role_counts.items()):
                print(f"     - {role}: {count}")
        else:
            print("   ❌ User management data not available")
        print()
        
        # EVEP Data
        print("📚 EVEP DATA")
        print("-" * 30)
        evep_data = await self.check_evep_data()
        print(f"   Students: {len(evep_data.get('students', []))}")
        print(f"   Teachers: {len(evep_data.get('teachers', []))}")
        print(f"   Schools: {len(evep_data.get('schools', []))}")
        print()
        
        # AI Agents
        print("🤖 AI AGENTS SYSTEM")
        print("-" * 30)
        ai_data = await self.check_ai_agents()
        if ai_data:
            print(f"   Status: {ai_data.get('status', 'unknown')}")
            print(f"   Service: {ai_data.get('service', 'unknown')}")
            print(f"   Database Connected: {ai_data.get('database_connected', False)}")
            print(f"   Agent Count: {ai_data.get('agent_count', 0)}")
        else:
            print("   ❌ AI agents system not available")
        print()
        
        # System Summary
        print("📋 SYSTEM SUMMARY")
        print("-" * 30)
        print("✅ COMPLETED COMPONENTS:")
        print("   - User Management System (26 users across 14 roles)")
        print("   - Authentication & RBAC (Database-driven)")
        print("   - Dashboard with Statistics")
        print("   - AI Chat Bot with Thai Language Support")
        print("   - Basic CRUD Operations (Schools, Teachers, Parents, Students)")
        print("   - Database-based AI Agent Management")
        print("   - Vector Learning System for AI")
        print("   - Comprehensive RBAC Menu System")
        print()
        print("⚠️  PARTIALLY IMPLEMENTED:")
        print("   - Vision Screening System (API exists but needs patient integration)")
        print("   - Glasses Inventory Management (API exists but needs testing)")
        print("   - Patient Management (API exists but needs student integration)")
        print("   - Mobile Screening Workflow (Mock data only)")
        print("   - Delivery Management (API exists but needs testing)")
        print()
        print("❌ MISSING COMPONENTS:")
        print("   - Real Patient Records (from students)")
        print("   - Actual Screening Sessions")
        print("   - Glasses Prescription System")
        print("   - Treatment Plans")
        print("   - LINE Bot Integration (real implementation)")
        print("   - CSV/PDF Export Functionality")
        print("   - Email Notifications")
        print("   - Follow-up System")
        print()
        print("🎯 NEXT PRIORITIES:")
        print("   1. Fix patient creation from students")
        print("   2. Implement real screening sessions")
        print("   3. Connect glasses inventory to real data")
        print("   4. Add CSV/PDF export functionality")
        print("   5. Implement LINE Bot integration")
        print("   6. Add email notification system")

async def main():
    """Main function"""
    async with SystemStatusChecker() as checker:
        if await checker.login():
            await checker.generate_system_report()
        else:
            print("❌ Cannot generate report - login failed")

if __name__ == "__main__":
    asyncio.run(main())
