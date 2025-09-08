#!/usr/bin/env python3
"""
EVEP Medical Portal - Comprehensive System Integration Test
Test all system components working together and identify optimization opportunities
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

API_BASE_URL = "https://stardust.evep.my-firstcare.com"

class ComprehensiveSystemTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.user_id = None
        self.test_results = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self):
        """Login and get authentication token"""
        print("🔐 Logging in...")
        start_time = time.time()
        
        login_data = {
            "email": "admin@evep.com",
            "password": "admin123"
        }
        
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/auth/login",
            json=login_data
        ) as response:
            end_time = time.time()
            response_time = end_time - start_time
            
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
                
                self.test_results["login"] = {
                    "status": "success",
                    "response_time": f"{response_time:.3f}s",
                    "user_id": self.user_id,
                    "role": self.user_role
                }
                
                print(f"✅ Login successful - User ID: {self.user_id}, Role: {self.user_role} ({response_time:.3f}s)")
                return True
            else:
                self.test_results["login"] = {
                    "status": "failed",
                    "response_time": f"{response_time:.3f}s",
                    "error": f"Status {response.status}"
                }
                print(f"❌ Login failed: {response.status} ({response_time:.3f}s)")
                return False
    
    async def test_api_performance(self, endpoint_name, endpoint_url, expected_status=200):
        """Test API endpoint performance"""
        start_time = time.time()
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            async with self.session.get(endpoint_url, headers=headers) as response:
                end_time = time.time()
                response_time = end_time - start_time
                
                if response.status == expected_status:
                    try:
                        data = await response.json()
                        data_size = len(json.dumps(data))
                        self.test_results[endpoint_name] = {
                            "status": "success",
                            "response_time": f"{response_time:.3f}s",
                            "data_size": f"{data_size} bytes",
                            "status_code": response.status
                        }
                        print(f"   ✅ {endpoint_name}: {response_time:.3f}s ({data_size} bytes)")
                        return True
                    except:
                        self.test_results[endpoint_name] = {
                            "status": "success",
                            "response_time": f"{response_time:.3f}s",
                            "data_size": "unknown",
                            "status_code": response.status
                        }
                        print(f"   ✅ {endpoint_name}: {response_time:.3f}s")
                        return True
                else:
                    self.test_results[endpoint_name] = {
                        "status": "failed",
                        "response_time": f"{response_time:.3f}s",
                        "error": f"Status {response.status}",
                        "status_code": response.status
                    }
                    print(f"   ❌ {endpoint_name}: {response_time:.3f}s (Status {response.status})")
                    return False
        except Exception as e:
            end_time = time.time()
            response_time = end_time - start_time
            self.test_results[endpoint_name] = {
                "status": "error",
                "response_time": f"{response_time:.3f}s",
                "error": str(e)
            }
            print(f"   ❌ {endpoint_name}: {response_time:.3f}s (Error: {e})")
            return False
    
    async def test_core_apis(self):
        """Test core API endpoints"""
        print("\n🔧 Testing Core API Endpoints...")
        
        core_endpoints = [
            ("Dashboard Stats", f"{API_BASE_URL}/api/v1/dashboard/stats"),
            ("Students", f"{API_BASE_URL}/api/v1/evep/students"),
            ("Teachers", f"{API_BASE_URL}/api/v1/evep/teachers"),
            ("Schools", f"{API_BASE_URL}/api/v1/evep/schools"),
            ("User Management", f"{API_BASE_URL}/api/v1/user-management/"),
            ("Patients", f"{API_BASE_URL}/api/v1/patients/"),
            ("Screenings", f"{API_BASE_URL}/api/v1/screenings/sessions"),
            ("Glasses Inventory", f"{API_BASE_URL}/api/v1/inventory/glasses"),
        ]
        
        passed = 0
        for name, url in core_endpoints:
            if await self.test_api_performance(name, url):
                passed += 1
        
        return passed, len(core_endpoints)
    
    async def test_rbac_apis(self):
        """Test RBAC API endpoints"""
        print("\n🔐 Testing RBAC API Endpoints...")
        
        rbac_endpoints = [
            ("File-based Roles", f"{API_BASE_URL}/api/v1/rbac/roles/"),
            ("File-based Permissions", f"{API_BASE_URL}/api/v1/rbac/permissions/"),
            ("MongoDB Roles", f"{API_BASE_URL}/api/v1/rbac-mongodb/roles/"),
            ("MongoDB Permissions", f"{API_BASE_URL}/api/v1/rbac-mongodb/permissions/"),
        ]
        
        passed = 0
        for name, url in rbac_endpoints:
            if await self.test_api_performance(name, url):
                passed += 1
        
        return passed, len(rbac_endpoints)
    
    async def test_export_apis(self):
        """Test CSV Export API endpoints"""
        print("\n📄 Testing CSV Export API Endpoints...")
        
        export_endpoints = [
            ("Dashboard CSV Export", f"{API_BASE_URL}/api/v1/csv-export/dashboard-summary"),
            ("Students CSV Export", f"{API_BASE_URL}/api/v1/csv-export/students"),
            ("Teachers CSV Export", f"{API_BASE_URL}/api/v1/csv-export/teachers"),
            ("Schools CSV Export", f"{API_BASE_URL}/api/v1/csv-export/schools"),
        ]
        
        passed = 0
        for name, url in export_endpoints:
            if await self.test_api_performance(name, url):
                passed += 1
        
        return passed, len(export_endpoints)
    
    async def test_ai_apis(self):
        """Test AI and Chat Bot API endpoints"""
        print("\n🤖 Testing AI and Chat Bot API Endpoints...")
        
        ai_endpoints = [
            ("AI Chat Health", f"{API_BASE_URL}/api/v1/chat-bot/health"),
            ("AI Agent Configs", f"{API_BASE_URL}/api/v1/chat-bot/agent-configs"),
        ]
        
        passed = 0
        for name, url in ai_endpoints:
            if await self.test_api_performance(name, url):
                passed += 1
        
        return passed, len(ai_endpoints)
    
    async def test_data_consistency(self):
        """Test data consistency across different endpoints"""
        print("\n🔍 Testing Data Consistency...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            # Get dashboard stats
            async with self.session.get(f"{API_BASE_URL}/api/v1/dashboard/stats", headers=headers) as response:
                if response.status == 200:
                    dashboard_data = await response.json()
                    
                    # Get individual counts
                    async with self.session.get(f"{API_BASE_URL}/api/v1/evep/students", headers=headers) as response:
                        students_data = await response.json() if response.status == 200 else []
                    
                    async with self.session.get(f"{API_BASE_URL}/api/v1/evep/teachers", headers=headers) as response:
                        teachers_data = await response.json() if response.status == 200 else []
                    
                    async with self.session.get(f"{API_BASE_URL}/api/v1/patients/", headers=headers) as response:
                        patients_data = await response.json() if response.status == 200 else []
                    
                    async with self.session.get(f"{API_BASE_URL}/api/v1/screenings/sessions", headers=headers) as response:
                        screenings_data = await response.json() if response.status == 200 else []
                    
                    # Check consistency
                    dashboard_students = dashboard_data.get("totalStudents", 0)
                    api_students = len(students_data)
                    
                    dashboard_teachers = dashboard_data.get("totalTeachers", 0)
                    api_teachers = len(teachers_data)
                    
                    dashboard_patients = dashboard_data.get("totalPatients", 0)
                    api_patients = len(patients_data)
                    
                    dashboard_screenings = dashboard_data.get("totalScreenings", 0)
                    api_screenings = len(screenings_data)
                    
                    consistency_results = {
                        "students": {"dashboard": dashboard_students, "api": api_students, "consistent": dashboard_students == api_students},
                        "teachers": {"dashboard": dashboard_teachers, "api": api_teachers, "consistent": dashboard_teachers == api_teachers},
                        "patients": {"dashboard": dashboard_patients, "api": api_patients, "consistent": dashboard_patients == api_patients},
                        "screenings": {"dashboard": dashboard_screenings, "api": api_screenings, "consistent": dashboard_screenings == api_screenings}
                    }
                    
                    self.test_results["data_consistency"] = consistency_results
                    
                    print(f"   📊 Students: Dashboard {dashboard_students} vs API {api_students} {'✅' if consistency_results['students']['consistent'] else '❌'}")
                    print(f"   👨‍🏫 Teachers: Dashboard {dashboard_teachers} vs API {api_teachers} {'✅' if consistency_results['teachers']['consistent'] else '❌'}")
                    print(f"   🏥 Patients: Dashboard {dashboard_patients} vs API {api_patients} {'✅' if consistency_results['patients']['consistent'] else '❌'}")
                    print(f"   🔬 Screenings: Dashboard {dashboard_screenings} vs API {api_screenings} {'✅' if consistency_results['screenings']['consistent'] else '❌'}")
                    
                    return consistency_results
                else:
                    print(f"   ❌ Failed to get dashboard data: {response.status}")
                    return None
        except Exception as e:
            print(f"   ❌ Data consistency test failed: {e}")
            return None
    
    async def run_comprehensive_test(self):
        """Run comprehensive system test"""
        print("🚀 EVEP Medical Portal - Comprehensive System Integration Test")
        print("=" * 70)
        
        # Login
        if not await self.login():
            return False
        
        # Test all system components
        core_passed, core_total = await self.test_core_apis()
        rbac_passed, rbac_total = await self.test_rbac_apis()
        export_passed, export_total = await self.test_export_apis()
        ai_passed, ai_total = await self.test_ai_apis()
        consistency_results = await self.test_data_consistency()
        
        # Calculate overall performance
        total_passed = core_passed + rbac_passed + export_passed + ai_passed
        total_tests = core_total + rbac_total + export_total + ai_total
        
        # Summary
        print("\n" + "=" * 70)
        print("📋 COMPREHENSIVE SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        print(f"🔧 Core APIs: {core_passed}/{core_total} passed")
        print(f"🔐 RBAC APIs: {rbac_passed}/{rbac_total} passed")
        print(f"📄 Export APIs: {export_passed}/{export_total} passed")
        print(f"🤖 AI APIs: {ai_passed}/{ai_total} passed")
        print(f"📊 Overall: {total_passed}/{total_tests} tests passed")
        
        if consistency_results:
            consistent_count = sum(1 for result in consistency_results.values() if result["consistent"])
            print(f"🔍 Data Consistency: {consistent_count}/4 checks consistent")
        
        # Performance analysis
        print("\n⚡ PERFORMANCE ANALYSIS:")
        avg_response_time = 0
        response_times = []
        
        for test_name, result in self.test_results.items():
            if "response_time" in result:
                time_str = result["response_time"].replace("s", "")
                try:
                    response_times.append(float(time_str))
                except:
                    pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            print(f"   📈 Average Response Time: {avg_response_time:.3f}s")
            print(f"   🐌 Slowest Response: {max_response_time:.3f}s")
            print(f"   ⚡ Fastest Response: {min_response_time:.3f}s")
        
        # Recommendations
        print("\n💡 OPTIMIZATION RECOMMENDATIONS:")
        
        if avg_response_time > 1.0:
            print("   ⚠️ Consider optimizing slow endpoints (>1s response time)")
        
        if total_passed < total_tests * 0.9:
            print("   ⚠️ Some API endpoints need attention")
        
        if consistency_results:
            inconsistent_count = sum(1 for result in consistency_results.values() if not result["consistent"])
            if inconsistent_count > 0:
                print("   ⚠️ Data consistency issues detected")
        
        # Final assessment
        if total_passed == total_tests and (not consistency_results or all(result["consistent"] for result in consistency_results.values())):
            print("\n🎉 SYSTEM STATUS: EXCELLENT")
            print("   ✅ All components working perfectly")
            print("   ✅ Data consistency maintained")
            print("   ✅ System ready for production")
        elif total_passed >= total_tests * 0.8:
            print("\n✅ SYSTEM STATUS: GOOD")
            print("   ✅ Most components working well")
            print("   ⚠️ Minor issues to address")
        else:
            print("\n⚠️ SYSTEM STATUS: NEEDS ATTENTION")
            print("   ❌ Several components need fixes")
            print("   🔧 System optimization required")
        
        return total_passed >= total_tests * 0.8

async def main():
    async with ComprehensiveSystemTester() as tester:
        await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
