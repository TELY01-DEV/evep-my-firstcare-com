#!/usr/bin/env python3
"""
Screening CRUD Testing with Real Data
Tests screening endpoints using actual patient/student data from the database
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone
from bson import ObjectId
import sys
import os

API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class RealDataScreeningTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        self.real_data = {
            "patient_id": None,
            "examiner_id": None,
            "appointment_id": None,
            "student_id": None,
            "teacher_id": None,
            "school_id": None
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate and get access token"""
        print("🔐 Authenticating...")
        try:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("access_token")
                    print(f"✅ Authentication successful")
                    return True
                else:
                    print(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    async def make_request(self, method, endpoint, data=None, params=None):
        """Make authenticated API request"""
        headers = {"Authorization": f"Bearer {self.token}"}
        if data:
            headers["Content-Type"] = "application/json"
            
        try:
            async with self.session.request(
                method, f"{API_BASE_URL}{endpoint}", 
                json=data, params=params, headers=headers
            ) as response:
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                return {
                    "status": response.status,
                    "data": response_data,
                    "success": response.status < 400
                }
        except Exception as e:
            return {
                "status": 0,
                "data": str(e),
                "success": False
            }
    
    async def fetch_real_data(self):
        """Fetch real patient, student, teacher, and school data from the database"""
        print("\n🔍 Fetching real data from database...")
        
        # Fetch patients
        print("  🔸 Fetching patients...")
        patients_result = await self.make_request("GET", "/api/v1/patients/")
        if patients_result["success"] and patients_result["data"]:
            patients = patients_result["data"]
            if isinstance(patients, dict) and "data" in patients:
                patients = patients["data"]
            if isinstance(patients, list) and len(patients) > 0:
                self.real_data["patient_id"] = patients[0].get("_id") or patients[0].get("id")
                print(f"    ✅ Found patient: {self.real_data['patient_id']}")
            else:
                print("    ❌ No patients found")
        else:
            print(f"    ❌ Failed to fetch patients: {patients_result['data']}")
        
        # Fetch students
        print("  🔸 Fetching students...")
        students_result = await self.make_request("GET", "/api/v1/evep/students")
        if students_result["success"] and students_result["data"]:
            students = students_result["data"]
            if isinstance(students, dict) and "data" in students:
                students = students["data"]
            if isinstance(students, list) and len(students) > 0:
                self.real_data["student_id"] = students[0].get("_id") or students[0].get("id")
                print(f"    ✅ Found student: {self.real_data['student_id']}")
            else:
                print("    ❌ No students found")
        else:
            print(f"    ❌ Failed to fetch students: {students_result['data']}")
        
        # Fetch teachers
        print("  🔸 Fetching teachers...")
        teachers_result = await self.make_request("GET", "/api/v1/evep/teachers")
        if teachers_result["success"] and teachers_result["data"]:
            teachers = teachers_result["data"]
            if isinstance(teachers, dict) and "data" in teachers:
                teachers = teachers["data"]
            if isinstance(teachers, list) and len(teachers) > 0:
                self.real_data["teacher_id"] = teachers[0].get("_id") or teachers[0].get("id")
                print(f"    ✅ Found teacher: {self.real_data['teacher_id']}")
            else:
                print("    ❌ No teachers found")
        else:
            print(f"    ❌ Failed to fetch teachers: {teachers_result['data']}")
        
        # Fetch schools
        print("  🔸 Fetching schools...")
        schools_result = await self.make_request("GET", "/api/v1/evep/schools")
        if schools_result["success"] and schools_result["data"]:
            schools = schools_result["data"]
            if isinstance(schools, dict) and "data" in schools:
                schools = schools["data"]
            if isinstance(schools, list) and len(schools) > 0:
                self.real_data["school_id"] = schools[0].get("_id") or schools[0].get("id")
                print(f"    ✅ Found school: {self.real_data['school_id']}")
            else:
                print("    ❌ No schools found")
        else:
            print(f"    ❌ Failed to fetch schools: {schools_result['data']}")
        
        # Use admin user as examiner
        print("  🔸 Using admin user as examiner...")
        self.real_data["examiner_id"] = "68be5c3fa392cd3ee7968f03"  # Admin user ID
        print(f"    ✅ Using examiner: {self.real_data['examiner_id']}")
        
        # Create a test appointment ID
        self.real_data["appointment_id"] = str(ObjectId())
        print(f"    ✅ Generated appointment ID: {self.real_data['appointment_id']}")
        
        print(f"\n📋 Real data summary:")
        for key, value in self.real_data.items():
            print(f"   {key}: {value}")
    
    async def test_va_screening_with_real_data(self):
        """Test VA screening with real patient data"""
        print("\n👁️ Testing VA Screening with Real Data...")
        
        if not self.real_data["patient_id"]:
            print("  ❌ No patient data available, skipping VA screening test")
            return
        
        # CREATE - Create a new VA screening with real patient
        print("  🔸 Testing CREATE with real patient...")
        new_va_screening = {
            "patient_id": self.real_data["patient_id"],
            "appointment_id": self.real_data["appointment_id"],
            "screening_type": "distance",
            "equipment_used": "snellen_chart",
            "examiner_notes": "Test VA screening with real patient data"
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/va", new_va_screening)
        self.test_results["va_screening_create_real"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            va_id = create_result["data"].get("screening_id") or create_result["data"].get("_id") or create_result["data"].get("id")
            
            # Test UPDATE
            print("  🔸 Testing UPDATE...")
            update_data = {"examiner_notes": "Updated VA screening notes with real data"}
            update_result = await self.make_request("PUT", f"/api/v1/screenings/va/{va_id}", update_data)
            self.test_results["va_screening_update_real"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            # Test DELETE
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/va/{va_id}")
            self.test_results["va_screening_delete_real"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
    
    async def test_school_screening_with_real_data(self):
        """Test school screening with real student/teacher/school data"""
        print("\n🏫 Testing School Screening with Real Data...")
        
        if not all([self.real_data["student_id"], self.real_data["teacher_id"], self.real_data["school_id"]]):
            print("  ❌ Missing student/teacher/school data, skipping school screening test")
            return
        
        # CREATE - Create a new school screening with real data
        print("  🔸 Testing CREATE with real student/teacher/school...")
        new_school_screening = {
            "student_id": self.real_data["student_id"],
            "teacher_id": self.real_data["teacher_id"],
            "school_id": self.real_data["school_id"],
            "grade_level": "Grade 1",
            "screening_type": "comprehensive",
            "screening_date": datetime.now().isoformat(),
            "notes": "Test school screening with real data"
        }
        
        create_result = await self.make_request("POST", "/api/v1/evep/school-screenings", new_school_screening)
        self.test_results["school_screening_create_real"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            school_id = create_result["data"].get("screening_id") or create_result["data"].get("_id") or create_result["data"].get("id")
            
            # Test UPDATE
            print("  🔸 Testing UPDATE...")
            update_data = {"notes": "Updated school screening notes with real data"}
            update_result = await self.make_request("PUT", f"/api/v1/evep/school-screenings/{school_id}", update_data)
            self.test_results["school_screening_update_real"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            # Test DELETE
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/evep/school-screenings/{school_id}")
            self.test_results["school_screening_delete_real"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
    
    async def test_specialized_screenings_with_real_data(self):
        """Test specialized screenings with real patient data"""
        print("\n🔬 Testing Specialized Screenings with Real Data...")
        
        if not self.real_data["patient_id"]:
            print("  ❌ No patient data available, skipping specialized screenings test")
            return
        
        # Test Color Vision Screening
        print("  🔸 Testing Color Vision Screening...")
        color_vision_data = {
            "patient_id": self.real_data["patient_id"],
            "examiner_id": self.real_data["examiner_id"],
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "notes": "Test color vision screening with real patient"
        }
        
        color_vision_result = await self.make_request("POST", "/api/v1/specialized-screenings/color-vision", color_vision_data)
        self.test_results["color_vision_screening_create_real"] = color_vision_result
        
        if color_vision_result["success"]:
            print(f"    ✅ Color Vision CREATE successful: {color_vision_result['status']}")
        else:
            print(f"    ❌ Color Vision CREATE failed: {color_vision_result['status']} - {color_vision_result['data']}")
        
        # Test Depth Perception Screening
        print("  🔸 Testing Depth Perception Screening...")
        depth_perception_data = {
            "patient_id": self.real_data["patient_id"],
            "examiner_id": self.real_data["examiner_id"],
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "notes": "Test depth perception screening with real patient"
        }
        
        depth_perception_result = await self.make_request("POST", "/api/v1/specialized-screenings/depth-perception", depth_perception_data)
        self.test_results["depth_perception_screening_create_real"] = depth_perception_result
        
        if depth_perception_result["success"]:
            print(f"    ✅ Depth Perception CREATE successful: {depth_perception_result['status']}")
        else:
            print(f"    ❌ Depth Perception CREATE failed: {depth_perception_result['status']} - {depth_perception_result['data']}")
        
        # Test Comprehensive Screening
        print("  🔸 Testing Comprehensive Screening...")
        comprehensive_data = {
            "patient_id": self.real_data["patient_id"],
            "examiner_id": self.real_data["examiner_id"],
            "screening_type": "comprehensive",
            "equipment_used": "comprehensive_kit",
            "notes": "Test comprehensive screening with real patient"
        }
        
        comprehensive_result = await self.make_request("POST", "/api/v1/specialized-screenings/comprehensive", comprehensive_data)
        self.test_results["comprehensive_screening_create_real"] = comprehensive_result
        
        if comprehensive_result["success"]:
            print(f"    ✅ Comprehensive CREATE successful: {comprehensive_result['status']}")
        else:
            print(f"    ❌ Comprehensive CREATE failed: {comprehensive_result['status']} - {comprehensive_result['data']}")
    
    async def run_all_tests(self):
        """Run all screening CRUD tests with real data"""
        print("🚀 Starting Screening CRUD Tests with Real Data")
        print("=" * 60)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Fetch real data from database
        await self.fetch_real_data()
        
        # Run CRUD tests with real data
        await self.test_va_screening_with_real_data()
        await self.test_school_screening_with_real_data()
        await self.test_specialized_screenings_with_real_data()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 SCREENING CRUD TESTS WITH REAL DATA SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - successful_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Successful: {successful_tests}")
        print(f"❌ Failed: {failed_tests}")
        if total_tests > 0:
            print(f"📈 Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        print("\n📋 Detailed Results:")
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result["success"] else "❌"
            print(f"  {status_icon} {test_name}: {result['status']}")
            if not result["success"]:
                print(f"      Error: {result['data']}")

async def main():
    """Main function to run the tests"""
    async with RealDataScreeningTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
