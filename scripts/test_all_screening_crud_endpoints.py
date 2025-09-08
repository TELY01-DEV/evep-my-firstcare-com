#!/usr/bin/env python3
"""
Comprehensive CRUD Testing for All Screening Types
Tests all screening-related endpoints to ensure they work properly
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class ScreeningCRUDTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        
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
    
    async def test_screening_sessions_crud(self):
        """Test CRUD operations for screening sessions"""
        print("\n📋 Testing Screening Sessions CRUD...")
        
        # CREATE - Create a new screening session
        print("  🔸 Testing CREATE...")
        new_session = {
            "patient_id": "test_patient_001",
            "patient_name": "Test Patient",
            "examiner_id": "test_examiner_001",
            "examiner_name": "Test Examiner",
            "screening_type": "comprehensive",
            "equipment_used": "standard_equipment",
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/sessions", new_session)
        self.test_results["screening_sessions_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            session_id = create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            session_id = None
        
        # READ - Get all screening sessions
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/screenings/sessions")
        self.test_results["screening_sessions_read"] = read_result
        
        if read_result["success"]:
            sessions = read_result["data"]
            print(f"    ✅ READ successful: {len(sessions)} sessions found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE - Update the created session (if we have an ID)
        if session_id:
            print("  🔸 Testing UPDATE...")
            update_data = {
                "status": "in_progress",
                "updated_at": datetime.utcnow().isoformat()
            }
            update_result = await self.make_request("PUT", f"/api/v1/screenings/sessions/{session_id}", update_data)
            self.test_results["screening_sessions_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            # DELETE - Delete the created session
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/sessions/{session_id}")
            self.test_results["screening_sessions_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no session ID)")
            self.test_results["screening_sessions_update"] = {"status": "skipped", "data": "No session ID", "success": False}
            self.test_results["screening_sessions_delete"] = {"status": "skipped", "data": "No session ID", "success": False}
    
    async def test_va_screening_crud(self):
        """Test CRUD operations for VA (Visual Acuity) screenings"""
        print("\n👁️ Testing VA Screening CRUD...")
        
        # CREATE - Create a new VA screening
        print("  🔸 Testing CREATE...")
        new_va_screening = {
            "patient_id": "test_patient_002",
            "patient_name": "Test Patient VA",
            "examiner_id": "test_examiner_002",
            "examiner_name": "Test Examiner VA",
            "screening_type": "va",
            "left_eye_distance": "20/20",
            "right_eye_distance": "20/25",
            "left_eye_near": "20/20",
            "right_eye_near": "20/20",
            "equipment_used": "snellen_chart",
            "status": "completed",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/va", new_va_screening)
        self.test_results["va_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            va_id = create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            va_id = None
        
        # READ - Get all VA screenings
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/screenings/va")
        self.test_results["va_screening_read"] = read_result
        
        if read_result["success"]:
            va_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(va_screenings)} VA screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE and DELETE if we have an ID
        if va_id:
            print("  🔸 Testing UPDATE...")
            update_data = {"right_eye_distance": "20/20", "updated_at": datetime.utcnow().isoformat()}
            update_result = await self.make_request("PUT", f"/api/v1/screenings/va/{va_id}", update_data)
            self.test_results["va_screening_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/va/{va_id}")
            self.test_results["va_screening_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no VA ID)")
            self.test_results["va_screening_update"] = {"status": "skipped", "data": "No VA ID", "success": False}
            self.test_results["va_screening_delete"] = {"status": "skipped", "data": "No VA ID", "success": False}
    
    async def test_color_vision_screening_crud(self):
        """Test CRUD operations for Color Vision screenings"""
        print("\n🌈 Testing Color Vision Screening CRUD...")
        
        # CREATE - Create a new Color Vision screening
        print("  🔸 Testing CREATE...")
        new_cv_screening = {
            "patient_id": "test_patient_003",
            "patient_name": "Test Patient CV",
            "examiner_id": "test_examiner_003",
            "examiner_name": "Test Examiner CV",
            "screening_type": "color_vision",
            "color_vision_result": "normal",
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "status": "completed",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/color-vision", new_cv_screening)
        self.test_results["color_vision_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            cv_id = create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            cv_id = None
        
        # READ - Get all Color Vision screenings
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/screenings/color-vision")
        self.test_results["color_vision_screening_read"] = read_result
        
        if read_result["success"]:
            cv_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(cv_screenings)} Color Vision screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE and DELETE if we have an ID
        if cv_id:
            print("  🔸 Testing UPDATE...")
            update_data = {"color_vision_result": "deficient", "updated_at": datetime.utcnow().isoformat()}
            update_result = await self.make_request("PUT", f"/api/v1/screenings/color-vision/{cv_id}", update_data)
            self.test_results["color_vision_screening_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/color-vision/{cv_id}")
            self.test_results["color_vision_screening_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no Color Vision ID)")
            self.test_results["color_vision_screening_update"] = {"status": "skipped", "data": "No CV ID", "success": False}
            self.test_results["color_vision_screening_delete"] = {"status": "skipped", "data": "No CV ID", "success": False}
    
    async def test_depth_perception_screening_crud(self):
        """Test CRUD operations for Depth Perception screenings"""
        print("\n🎯 Testing Depth Perception Screening CRUD...")
        
        # CREATE - Create a new Depth Perception screening
        print("  🔸 Testing CREATE...")
        new_dp_screening = {
            "patient_id": "test_patient_004",
            "patient_name": "Test Patient DP",
            "examiner_id": "test_examiner_004",
            "examiner_name": "Test Examiner DP",
            "screening_type": "depth_perception",
            "depth_perception_result": "normal",
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "status": "completed",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/depth-perception", new_dp_screening)
        self.test_results["depth_perception_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            dp_id = create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            dp_id = None
        
        # READ - Get all Depth Perception screenings
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/screenings/depth-perception")
        self.test_results["depth_perception_screening_read"] = read_result
        
        if read_result["success"]:
            dp_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(dp_screenings)} Depth Perception screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE and DELETE if we have an ID
        if dp_id:
            print("  🔸 Testing UPDATE...")
            update_data = {"depth_perception_result": "impaired", "updated_at": datetime.utcnow().isoformat()}
            update_result = await self.make_request("PUT", f"/api/v1/screenings/depth-perception/{dp_id}", update_data)
            self.test_results["depth_perception_screening_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/depth-perception/{dp_id}")
            self.test_results["depth_perception_screening_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no Depth Perception ID)")
            self.test_results["depth_perception_screening_update"] = {"status": "skipped", "data": "No DP ID", "success": False}
            self.test_results["depth_perception_screening_delete"] = {"status": "skipped", "data": "No DP ID", "success": False}
    
    async def test_comprehensive_screening_crud(self):
        """Test CRUD operations for Comprehensive screenings"""
        print("\n🔬 Testing Comprehensive Screening CRUD...")
        
        # CREATE - Create a new Comprehensive screening
        print("  🔸 Testing CREATE...")
        new_comp_screening = {
            "patient_id": "test_patient_005",
            "patient_name": "Test Patient Comprehensive",
            "examiner_id": "test_examiner_005",
            "examiner_name": "Test Examiner Comprehensive",
            "screening_type": "comprehensive",
            "va_results": {
                "left_eye_distance": "20/20",
                "right_eye_distance": "20/20",
                "left_eye_near": "20/20",
                "right_eye_near": "20/20"
            },
            "color_vision_result": "normal",
            "depth_perception_result": "normal",
            "equipment_used": "comprehensive_kit",
            "status": "completed",
            "notes": "All tests passed",
            "recommendations": "No follow-up required",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/comprehensive", new_comp_screening)
        self.test_results["comprehensive_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            comp_id = create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            comp_id = None
        
        # READ - Get all Comprehensive screenings
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/screenings/comprehensive")
        self.test_results["comprehensive_screening_read"] = read_result
        
        if read_result["success"]:
            comp_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(comp_screenings)} Comprehensive screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE and DELETE if we have an ID
        if comp_id:
            print("  🔸 Testing UPDATE...")
            update_data = {"notes": "Updated notes", "updated_at": datetime.utcnow().isoformat()}
            update_result = await self.make_request("PUT", f"/api/v1/screenings/comprehensive/{comp_id}", update_data)
            self.test_results["comprehensive_screening_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/screenings/comprehensive/{comp_id}")
            self.test_results["comprehensive_screening_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no Comprehensive ID)")
            self.test_results["comprehensive_screening_update"] = {"status": "skipped", "data": "No Comp ID", "success": False}
            self.test_results["comprehensive_screening_delete"] = {"status": "skipped", "data": "No Comp ID", "success": False}
    
    async def test_school_screenings_crud(self):
        """Test CRUD operations for School screenings"""
        print("\n🏫 Testing School Screenings CRUD...")
        
        # READ - Get school screenings (this is typically a read-only endpoint)
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/evep/school-screenings")
        self.test_results["school_screenings_read"] = read_result
        
        if read_result["success"]:
            school_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(school_screenings)} school screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # Test with filters
        print("  🔸 Testing READ with filters...")
        filtered_result = await self.make_request("GET", "/api/v1/evep/school-screenings", params={"status": "completed"})
        self.test_results["school_screenings_filtered_read"] = filtered_result
        
        if filtered_result["success"]:
            print(f"    ✅ Filtered READ successful: {filtered_result['status']}")
        else:
            print(f"    ❌ Filtered READ failed: {filtered_result['status']} - {filtered_result['data']}")
    
    async def run_all_tests(self):
        """Run all screening CRUD tests"""
        print("🚀 Starting Comprehensive Screening CRUD Tests")
        print("=" * 60)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Run all tests
        await self.test_screening_sessions_crud()
        await self.test_va_screening_crud()
        await self.test_color_vision_screening_crud()
        await self.test_depth_perception_screening_crud()
        await self.test_comprehensive_screening_crud()
        await self.test_school_screenings_crud()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 SCREENING CRUD TESTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - successful_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Successful: {successful_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        print("\n📋 Detailed Results:")
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result["success"] else "❌"
            print(f"  {status_icon} {test_name}: {result['status']}")
            if not result["success"] and result["status"] != "skipped":
                print(f"      Error: {result['data']}")

async def main():
    """Main function to run the tests"""
    async with ScreeningCRUDTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
