#!/usr/bin/env python3
"""
Fixed CRUD Testing for Screening Endpoints
Tests with corrected data models and proper authentication
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

class FixedScreeningCRUDTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        self.valid_object_ids = {
            "patient_id": str(ObjectId()),
            "examiner_id": str(ObjectId()),
            "appointment_id": str(ObjectId()),
            "student_id": str(ObjectId()),
            "teacher_id": str(ObjectId()),
            "school_id": str(ObjectId())
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
    
    async def test_va_screening_crud(self):
        """Test CRUD operations for VA screenings (/api/v1/screenings/va)"""
        print("\n👁️ Testing VA Screening CRUD...")
        
        # CREATE - Create a new VA screening
        print("  🔸 Testing CREATE...")
        new_va_screening = {
            "patient_id": self.valid_object_ids["patient_id"],
            "appointment_id": self.valid_object_ids["appointment_id"],  # Required field
            "screening_type": "distance",
            "equipment_used": "snellen_chart",
            "examiner_notes": "Test VA screening"
        }
        
        create_result = await self.make_request("POST", "/api/v1/screenings/va", new_va_screening)
        self.test_results["va_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            va_id = create_result["data"].get("screening_id") or create_result["data"].get("_id") or create_result["data"].get("id")
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
            update_data = {"examiner_notes": "Updated VA screening notes"}
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
    
    async def test_mobile_screening_crud(self):
        """Test CRUD operations for Mobile screenings (/api/v1/mobile-screening)"""
        print("\n📱 Testing Mobile Screening CRUD...")
        
        # CREATE - Create a new mobile screening session with correct data model
        print("  🔸 Testing CREATE...")
        new_mobile_screening = {
            "patient_id": self.valid_object_ids["patient_id"],
            "examiner_id": self.valid_object_ids["examiner_id"],
            "screening_type": "mobile_comprehensive",
            "equipment_used": "mobile_reflection_unit",
            "location": "school_grounds",
            "school_name": "Test School",  # Required field
            "equipment_calibration": {  # Required field - now as object
                "auto_refractor_model": "Test Model",
                "calibration_date": "2025-01-01T00:00:00Z",
                "calibration_status": "valid",
                "examiner_id": self.valid_object_ids["examiner_id"]
            },
            "notes": "Test mobile screening with correct data model"
        }
        
        create_result = await self.make_request("POST", "/api/v1/mobile-screening/sessions", new_mobile_screening)
        self.test_results["mobile_screening_create"] = create_result
        
        if create_result["success"]:
            print(f"    ✅ CREATE successful: {create_result['status']}")
            mobile_id = create_result["data"].get("session_id") or create_result["data"].get("_id") or create_result["data"].get("id")
        else:
            print(f"    ❌ CREATE failed: {create_result['status']} - {create_result['data']}")
            mobile_id = None
        
        # READ - Get all mobile screening sessions
        print("  🔸 Testing READ (List)...")
        read_result = await self.make_request("GET", "/api/v1/mobile-screening/sessions")
        self.test_results["mobile_screening_read"] = read_result
        
        if read_result["success"]:
            mobile_screenings = read_result["data"]
            print(f"    ✅ READ successful: {len(mobile_screenings)} mobile screenings found")
        else:
            print(f"    ❌ READ failed: {read_result['status']} - {read_result['data']}")
        
        # UPDATE and DELETE if we have an ID
        if mobile_id:
            print("  🔸 Testing UPDATE...")
            update_data = {"notes": "Updated mobile screening notes"}
            update_result = await self.make_request("PUT", f"/api/v1/mobile-screening/sessions/{mobile_id}", update_data)
            self.test_results["mobile_screening_update"] = update_result
            
            if update_result["success"]:
                print(f"    ✅ UPDATE successful: {update_result['status']}")
            else:
                print(f"    ❌ UPDATE failed: {update_result['status']} - {update_result['data']}")
            
            print("  🔸 Testing DELETE...")
            delete_result = await self.make_request("DELETE", f"/api/v1/mobile-screening/sessions/{mobile_id}")
            self.test_results["mobile_screening_delete"] = delete_result
            
            if delete_result["success"]:
                print(f"    ✅ DELETE successful: {delete_result['status']}")
            else:
                print(f"    ❌ DELETE failed: {delete_result['status']} - {delete_result['data']}")
        else:
            print("  ⚠️  Skipping UPDATE and DELETE tests (no Mobile ID)")
            self.test_results["mobile_screening_update"] = {"status": "skipped", "data": "No Mobile ID", "success": False}
            self.test_results["mobile_screening_delete"] = {"status": "skipped", "data": "No Mobile ID", "success": False}
    
    async def test_specialized_screenings_crud(self):
        """Test CRUD operations for specialized screenings"""
        print("\n🔬 Testing Specialized Screenings CRUD...")
        
        # Test Color Vision Screening
        print("  🔸 Testing Color Vision Screening...")
        color_vision_data = {
            "patient_id": self.valid_object_ids["patient_id"],
            "examiner_id": self.valid_object_ids["examiner_id"],
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "notes": "Test color vision screening"
        }
        
        color_vision_result = await self.make_request("POST", "/api/v1/specialized-screenings/color-vision", color_vision_data)
        self.test_results["color_vision_screening_create"] = color_vision_result
        
        if color_vision_result["success"]:
            print(f"    ✅ Color Vision CREATE successful: {color_vision_result['status']}")
        else:
            print(f"    ❌ Color Vision CREATE failed: {color_vision_result['status']} - {color_vision_result['data']}")
        
        # Test Depth Perception Screening
        print("  🔸 Testing Depth Perception Screening...")
        depth_perception_data = {
            "patient_id": self.valid_object_ids["patient_id"],
            "examiner_id": self.valid_object_ids["examiner_id"],
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "notes": "Test depth perception screening"
        }
        
        depth_perception_result = await self.make_request("POST", "/api/v1/specialized-screenings/depth-perception", depth_perception_data)
        self.test_results["depth_perception_screening_create"] = depth_perception_result
        
        if depth_perception_result["success"]:
            print(f"    ✅ Depth Perception CREATE successful: {depth_perception_result['status']}")
        else:
            print(f"    ❌ Depth Perception CREATE failed: {depth_perception_result['status']} - {depth_perception_result['data']}")
        
        # Test Comprehensive Screening
        print("  🔸 Testing Comprehensive Screening...")
        comprehensive_data = {
            "patient_id": self.valid_object_ids["patient_id"],
            "examiner_id": self.valid_object_ids["examiner_id"],
            "screening_type": "comprehensive",
            "equipment_used": "comprehensive_kit",
            "notes": "Test comprehensive screening"
        }
        
        comprehensive_result = await self.make_request("POST", "/api/v1/specialized-screenings/comprehensive", comprehensive_data)
        self.test_results["comprehensive_screening_create"] = comprehensive_result
        
        if comprehensive_result["success"]:
            print(f"    ✅ Comprehensive CREATE successful: {comprehensive_result['status']}")
        else:
            print(f"    ❌ Comprehensive CREATE failed: {comprehensive_result['status']} - {comprehensive_result['data']}")
    
    async def test_screening_endpoints_availability(self):
        """Test if various screening endpoints are available"""
        print("\n🔍 Testing Screening Endpoints Availability...")
        
        endpoints_to_test = [
            ("/api/v1/screenings/sessions", "Screening Sessions"),
            ("/api/v1/evep/school-screenings", "School Screenings"),
            ("/api/v1/mobile-screening/sessions", "Mobile Screening Sessions"),
            ("/api/v1/screenings/va", "VA Screenings"),
            ("/api/v1/specialized-screenings/color-vision", "Color Vision Screenings"),
            ("/api/v1/specialized-screenings/depth-perception", "Depth Perception Screenings"),
            ("/api/v1/specialized-screenings/comprehensive", "Comprehensive Screenings")
        ]
        
        for endpoint, name in endpoints_to_test:
            print(f"  🔸 Testing {name} endpoint...")
            result = await self.make_request("GET", endpoint)
            self.test_results[f"endpoint_{name.lower().replace(' ', '_')}"] = result
            
            if result["success"]:
                print(f"    ✅ {name} endpoint available: {result['status']}")
            else:
                print(f"    ❌ {name} endpoint not available: {result['status']} - {result['data']}")
    
    async def run_all_tests(self):
        """Run all screening CRUD tests"""
        print("🚀 Starting Fixed Screening CRUD Tests")
        print("=" * 60)
        print(f"🔑 Using valid ObjectIds:")
        for key, value in self.valid_object_ids.items():
            print(f"   {key}: {value}")
        print("=" * 60)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Test endpoint availability first
        await self.test_screening_endpoints_availability()
        
        # Run CRUD tests for available endpoints
        await self.test_va_screening_crud()
        await self.test_mobile_screening_crud()
        await self.test_specialized_screenings_crud()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 FIXED SCREENING CRUD TESTS SUMMARY")
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
    async with FixedScreeningCRUDTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
