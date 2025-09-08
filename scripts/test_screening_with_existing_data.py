#!/usr/bin/env python3
"""
Test Screening Endpoints with Existing Data
Tests screening endpoints using any existing data in the database
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

class ExistingDataScreeningTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        self.existing_data = {
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
    
    async def find_existing_data(self):
        """Find any existing data in the database"""
        print("\n🔍 Searching for existing data in database...")
        
        # Use admin user as examiner
        self.existing_data["examiner_id"] = "68be5c3fa392cd3ee7968f03"  # Admin user ID
        print(f"    ✅ Using examiner: {self.existing_data['examiner_id']}")
        
        # Create a test appointment ID
        self.existing_data["appointment_id"] = str(ObjectId())
        print(f"    ✅ Generated appointment ID: {self.existing_data['appointment_id']}")
        
        # Try to find any existing patients
        print("  🔸 Searching for existing patients...")
        patients_result = await self.make_request("GET", "/api/v1/patients/")
        if patients_result["success"] and patients_result["data"]:
            patients = patients_result["data"]
            if isinstance(patients, list) and len(patients) > 0:
                # Try to extract ID from first patient
                first_patient = patients[0]
                if isinstance(first_patient, dict):
                    patient_id = first_patient.get("_id") or first_patient.get("id") or first_patient.get("patient_id")
                    if patient_id:
                        self.existing_data["patient_id"] = str(patient_id)
                        print(f"    ✅ Found existing patient: {self.existing_data['patient_id']}")
                    else:
                        print(f"    ⚠️  Patient found but no ID: {first_patient}")
                else:
                    print(f"    ⚠️  Unexpected patient format: {type(patients)}")
            else:
                print("    ❌ No patients found")
        else:
            print(f"    ❌ Failed to fetch patients: {patients_result['data']}")
        
        # Try to find any existing students
        print("  🔸 Searching for existing students...")
        students_result = await self.make_request("GET", "/api/v1/evep/students")
        if students_result["success"] and students_result["data"]:
            students = students_result["data"]
            if isinstance(students, list) and len(students) > 0:
                first_student = students[0]
                if isinstance(first_student, dict):
                    student_id = first_student.get("_id") or first_student.get("id")
                    if student_id:
                        self.existing_data["student_id"] = str(student_id)
                        print(f"    ✅ Found existing student: {self.existing_data['student_id']}")
                    else:
                        print(f"    ⚠️  Student found but no ID: {first_student}")
                else:
                    print(f"    ⚠️  Unexpected student format: {type(students)}")
            else:
                print("    ❌ No students found")
        else:
            print(f"    ❌ Failed to fetch students: {students_result['data']}")
        
        # Try to find any existing teachers
        print("  🔸 Searching for existing teachers...")
        teachers_result = await self.make_request("GET", "/api/v1/evep/teachers")
        if teachers_result["success"] and teachers_result["data"]:
            teachers = teachers_result["data"]
            if isinstance(teachers, list) and len(teachers) > 0:
                first_teacher = teachers[0]
                if isinstance(first_teacher, dict):
                    teacher_id = first_teacher.get("_id") or first_teacher.get("id")
                    if teacher_id:
                        self.existing_data["teacher_id"] = str(teacher_id)
                        print(f"    ✅ Found existing teacher: {self.existing_data['teacher_id']}")
                    else:
                        print(f"    ⚠️  Teacher found but no ID: {first_teacher}")
                else:
                    print(f"    ⚠️  Unexpected teacher format: {type(teachers)}")
            else:
                print("    ❌ No teachers found")
        else:
            print(f"    ❌ Failed to fetch teachers: {teachers_result['data']}")
        
        # Try to find any existing schools
        print("  🔸 Searching for existing schools...")
        schools_result = await self.make_request("GET", "/api/v1/evep/schools")
        if schools_result["success"] and schools_result["data"]:
            schools = schools_result["data"]
            if isinstance(schools, list) and len(schools) > 0:
                first_school = schools[0]
                if isinstance(first_school, dict):
                    school_id = first_school.get("_id") or first_school.get("id")
                    if school_id:
                        self.existing_data["school_id"] = str(school_id)
                        print(f"    ✅ Found existing school: {self.existing_data['school_id']}")
                    else:
                        print(f"    ⚠️  School found but no ID: {first_school}")
                else:
                    print(f"    ⚠️  Unexpected school format: {type(schools)}")
            else:
                print("    ❌ No schools found")
        else:
            print(f"    ❌ Failed to fetch schools: {schools_result['data']}")
        
        print(f"\n📋 Existing data summary:")
        for key, value in self.existing_data.items():
            if value:
                print(f"   {key}: {value}")
            else:
                print(f"   {key}: ❌ Not found")
    
    async def test_mobile_screening_with_existing_data(self):
        """Test mobile screening with existing data"""
        print("\n📱 Testing Mobile Screening with Existing Data...")
        
        # CREATE - Create a new mobile screening session
        print("  🔸 Testing CREATE...")
        new_mobile_screening = {
            "patient_id": self.existing_data["patient_id"] or str(ObjectId()),
            "examiner_id": self.existing_data["examiner_id"],
            "screening_type": "mobile_comprehensive",
            "equipment_used": "mobile_reflection_unit",
            "location": "school_grounds",
            "school_name": "Test School",
            "equipment_calibration": {
                "auto_refractor_model": "Test Model",
                "calibration_date": "2025-01-01T00:00:00Z",
                "calibration_status": "valid",
                "examiner_id": self.existing_data["examiner_id"]
            },
            "notes": "Test mobile screening with existing data"
        }
        
        create_result = await self.make_request("POST", "/api/v1/mobile-screening/sessions", new_mobile_screening)
        self.test_results["mobile_screening_create_existing"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            mobile_id = create_result["data"].get("session_id") or create_result["data"].get("_id") or create_result["data"].get("id")
            
            if mobile_id:
                # Test UPDATE
                print("  🔸 Testing UPDATE...")
                update_data = {"notes": "Updated mobile screening notes with existing data"}
                update_result = await self.make_request("PUT", f"/api/v1/mobile-screening/sessions/{mobile_id}", update_data)
                self.test_results["mobile_screening_update_existing"] = update_result
                
                if update_result["success"]:
                    print(f"    ✅ UPDATE successful: {update_result['status']}")
                else:
                    print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
                
                # Test DELETE
                print("  🔸 Testing DELETE...")
                delete_result = await self.make_request("DELETE", f"/api/v1/mobile-screening/sessions/{mobile_id}")
                self.test_results["mobile_screening_delete_existing"] = delete_result
                
                if delete_result["success"]:
                    print(f"    ✅ DELETE successful: {delete_result['status']}")
                else:
                    print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
            else:
                print("    ⚠️  No mobile ID returned for UPDATE/DELETE tests")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
    
    async def test_va_screening_with_existing_data(self):
        """Test VA screening with existing data"""
        print("\n👁️ Testing VA Screening with Existing Data...")
        
        # CREATE - Create a new VA screening
        print("  🔸 Testing CREATE...")
        new_va_screening = {
            "patient_id": self.existing_data["patient_id"] or str(ObjectId()),
            "appointment_id": self.existing_data["appointment_id"],
            "screening_type": "distance",
            "equipment_used": "snellen_chart",
            "examiner_notes": "Test VA screening with existing data"
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/va", new_va_screening)
        self.test_results["va_screening_create_existing"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            va_id = create_result["data"].get("screening_id") or create_result["data"].get("_id") or create_result["data"].get("id")
            
            if va_id:
                # Test UPDATE
                print("  🔸 Testing UPDATE...")
                update_data = {"examiner_notes": "Updated VA screening notes with existing data"}
                update_result = await self.make_request("PUT", f"/api/v1/screenings/va/{va_id}", update_data)
                self.test_results["va_screening_update_existing"] = update_result
                
                if update_result["success"]:
                    print(f"    ✅ UPDATE successful: {update_result['status']}")
                else:
                    print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
                
                # Test DELETE
                print("  🔸 Testing DELETE...")
                delete_result = await self.make_request("DELETE", f"/api/v1/screenings/va/{va_id}")
                self.test_results["va_screening_delete_existing"] = delete_result
                
                if delete_result["success"]:
                    print(f"    ✅ DELETE successful: {delete_result['status']}")
                else:
                    print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
            else:
                print("    ⚠️  No VA ID returned for UPDATE/DELETE tests")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
    
    async def test_specialized_screenings_with_existing_data(self):
        """Test specialized screenings with existing data"""
        print("\n🔬 Testing Specialized Screenings with Existing Data...")
        
        patient_id = self.existing_data["patient_id"] or str(ObjectId())
        examiner_id = self.existing_data["examiner_id"]
        
        # Test Color Vision Screening
        print("  🔸 Testing Color Vision Screening...")
        color_vision_data = {
            "patient_id": patient_id,
            "examiner_id": examiner_id,
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "notes": "Test color vision screening with existing data"
        }
        
        color_vision_result = await self.make_request("POST", "/api/v1/specialized-screenings/color-vision", color_vision_data)
        self.test_results["color_vision_screening_create_existing"] = color_vision_result
        
        if color_vision_result["success"]:
            print(f"    ✅ Color Vision CREATE successful: {color_vision_result['status']}")
        else:
            print(f"    ❌ Color Vision CREATE failed: {color_vision_result['status']} - {color_vision_result['data']}")
        
        # Test Depth Perception Screening
        print("  🔸 Testing Depth Perception Screening...")
        depth_perception_data = {
            "patient_id": patient_id,
            "examiner_id": examiner_id,
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "notes": "Test depth perception screening with existing data"
        }
        
        depth_perception_result = await self.make_request("POST", "/api/v1/specialized-screenings/depth-perception", depth_perception_data)
        self.test_results["depth_perception_screening_create_existing"] = depth_perception_result
        
        if depth_perception_result["success"]:
            print(f"    ✅ Depth Perception CREATE successful: {depth_perception_result['status']}")
        else:
            print(f"    ❌ Depth Perception CREATE failed: {depth_perception_result['status']} - {depth_perception_result['data']}")
        
        # Test Comprehensive Screening
        print("  🔸 Testing Comprehensive Screening...")
        comprehensive_data = {
            "patient_id": patient_id,
            "examiner_id": examiner_id,
            "screening_type": "comprehensive",
            "equipment_used": "comprehensive_kit",
            "notes": "Test comprehensive screening with existing data"
        }
        
        comprehensive_result = await self.make_request("POST", "/api/v1/specialized-screenings/comprehensive", comprehensive_data)
        self.test_results["comprehensive_screening_create_existing"] = comprehensive_result
        
        if comprehensive_result["success"]:
            print(f"    ✅ Comprehensive CREATE successful: {comprehensive_result['status']}")
        else:
            print(f"    ❌ Comprehensive CREATE failed: {comprehensive_result['status']} - {comprehensive_result['data']}")
    
    async def run_all_tests(self):
        """Run all screening CRUD tests with existing data"""
        print("🚀 Starting Screening CRUD Tests with Existing Data")
        print("=" * 60)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Find existing data
        await self.find_existing_data()
        
        # Run CRUD tests with existing data
        await self.test_mobile_screening_with_existing_data()
        await self.test_va_screening_with_existing_data()
        await self.test_specialized_screenings_with_existing_data()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 SCREENING CRUD TESTS WITH EXISTING DATA SUMMARY")
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
    async with ExistingDataScreeningTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
