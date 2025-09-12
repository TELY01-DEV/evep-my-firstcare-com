#!/usr/bin/env python3
"""
Create Simple Patient and Test Complete CRUD
Creates a simple patient and tests all screening CRUD operations
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

class SimplePatientAndTest:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        self.patient_id = None
        
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
    
    async def create_simple_patient(self):
        """Create a simple patient using the correct format"""
        print("\n👤 Creating simple patient...")
        
        # Try different patient creation formats
        patient_formats = [
            # Format 1: Based on the error messages
            {
                "first_name": "Test",
                "last_name": "Patient",
                "cid": f"123456789012{str(ObjectId())[:2]}",
                "parent_email": "parent@example.com",
                "parent_phone": "0812345678",
                "emergency_contact": "Emergency Contact",
                "emergency_phone": "0812345679",
                "address": "123 Test Street, Bangkok",
                "medical_history": {},
                "date_of_birth": "2010-01-01",
                "gender": "male"
            },
            # Format 2: Based on the shared model
            {
                "patient_id": f"PAT{str(ObjectId())[:8].upper()}",
                "name": "Test Patient",
                "date_of_birth": "2010-01-01",
                "gender": "male",
                "contact_info": {
                    "phone": "0812345678",
                    "email": "test.patient@example.com"
                },
                "medical_history": {},
                "notes": "Test patient"
            }
        ]
        
        for i, patient_data in enumerate(patient_formats, 1):
            print(f"  🔸 Trying format {i}...")
            result = await self.make_request("POST", "/api/v1/patients/", patient_data)
            
            if result["success"]:
                # Try to extract patient ID from response
                response_data = result["data"]
                if isinstance(response_data, dict):
                    patient_id = (response_data.get("_id") or 
                                response_data.get("id") or 
                                response_data.get("patient_id") or
                                str(response_data.get("inserted_id", "")))
                    
                    if patient_id and patient_id != "None":
                        self.patient_id = str(patient_id)
                        print(f"    ✅ Patient created with format {i}: {self.patient_id}")
                        return self.patient_id
                    else:
                        print(f"    ⚠️  Patient created but no ID returned: {response_data}")
                else:
                    print(f"    ⚠️  Unexpected response format: {response_data}")
            else:
                print(f"    ❌ Format {i} failed: {result['status']} - {result['data']}")
        
        print("    ❌ All patient creation formats failed")
        return None
    
    async def test_complete_screening_crud(self):
        """Test complete CRUD operations for all screening types"""
        print("\n🔬 Testing Complete Screening CRUD Operations...")
        
        if not self.patient_id:
            print("  ❌ No patient ID available, skipping screening tests")
            return
        
        examiner_id = "68be5c3fa392cd3ee7968f03"  # Admin user ID
        appointment_id = str(ObjectId())
        
        # Create a test appointment first
        print("\n  📅 Creating test appointment...")
        appointment_data = {
            "patient_id": self.patient_id,
            "appointment_date": datetime.now().isoformat(),
            "appointment_type": "screening",
            "status": "scheduled",
            "notes": "Test appointment for screening"
        }
        
        appointment_result = await self.make_request("POST", "/api/v1/appointments", appointment_data)
        if appointment_result["success"]:
            appointment_id = appointment_result["data"].get("_id") or appointment_result["data"].get("id") or appointment_id
            print(f"    ✅ Appointment created: {appointment_id}")
        else:
            print(f"    ⚠️  Appointment creation failed, using generated ID: {appointment_id}")
        
        # Test VA Screening CRUD
        print("\n  👁️ Testing VA Screening CRUD...")
        va_data = {
            "patient_id": self.patient_id,
            "appointment_id": appointment_id,
            "screening_type": "distance",
            "equipment_used": "snellen_chart",
            "examiner_notes": "Test VA screening"
        }
        
        va_create = await self.make_request("POST", "/api/v1/screenings/va", va_data)
        self.test_results["va_create"] = va_create
        
        if va_create["success"]:
            print(f"    ✅ VA CREATE: {va_create['status']}")
            va_id = va_create["data"].get("screening_id") or va_create["data"].get("_id") or va_create["data"].get("id")
            
            if va_id:
                # Test UPDATE
                va_update = await self.make_request("PUT", f"/api/v1/screenings/va/{va_id}", {"examiner_notes": "Updated VA notes"})
                self.test_results["va_update"] = va_update
                print(f"    {'✅' if va_update['success'] else '❌'} VA UPDATE: {va_update['status']}")
                
                # Test DELETE
                va_delete = await self.make_request("DELETE", f"/api/v1/screenings/va/{va_id}")
                self.test_results["va_delete"] = va_delete
                print(f"    {'✅' if va_delete['success'] else '❌'} VA DELETE: {va_delete['status']}")
        else:
            print(f"    ❌ VA CREATE: {va_create['status']} - {va_create['data']}")
        
        # Test Color Vision Screening CRUD
        print("\n  🌈 Testing Color Vision Screening CRUD...")
        color_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "notes": "Test color vision screening"
        }
        
        color_create = await self.make_request("POST", "/api/v1/specialized-screenings/color-vision", color_data)
        self.test_results["color_create"] = color_create
        
        if color_create["success"]:
            print(f"    ✅ Color Vision CREATE: {color_create['status']}")
            color_id = color_create["data"].get("screening_id") or color_create["data"].get("_id") or color_create["data"].get("id")
            
            if color_id:
                # Test UPDATE
                color_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/color-vision/{color_id}", {"notes": "Updated color vision notes", "status": "completed"})
                self.test_results["color_update"] = color_update
                print(f"    {'✅' if color_update['success'] else '❌'} Color Vision UPDATE: {color_update['status']}")
                
                # Test DELETE
                color_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/color-vision/{color_id}")
                self.test_results["color_delete"] = color_delete
                print(f"    {'✅' if color_delete['success'] else '❌'} Color Vision DELETE: {color_delete['status']}")
        else:
            print(f"    ❌ Color Vision CREATE: {color_create['status']} - {color_create['data']}")
        
        # Test Depth Perception Screening CRUD
        print("\n  🎯 Testing Depth Perception Screening CRUD...")
        depth_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "notes": "Test depth perception screening"
        }
        
        depth_create = await self.make_request("POST", "/api/v1/specialized-screenings/depth-perception", depth_data)
        self.test_results["depth_create"] = depth_create
        
        if depth_create["success"]:
            print(f"    ✅ Depth Perception CREATE: {depth_create['status']}")
            depth_id = depth_create["data"].get("screening_id") or depth_create["data"].get("_id") or depth_create["data"].get("id")
            
            if depth_id:
                # Test UPDATE
                depth_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/depth-perception/{depth_id}", {"notes": "Updated depth perception notes", "status": "completed"})
                self.test_results["depth_update"] = depth_update
                print(f"    {'✅' if depth_update['success'] else '❌'} Depth Perception UPDATE: {depth_update['status']}")
                
                # Test DELETE
                depth_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/depth-perception/{depth_id}")
                self.test_results["depth_delete"] = depth_delete
                print(f"    {'✅' if depth_delete['success'] else '❌'} Depth Perception DELETE: {depth_delete['status']}")
        else:
            print(f"    ❌ Depth Perception CREATE: {depth_create['status']} - {depth_create['data']}")
        
        # Test Comprehensive Screening CRUD
        print("\n  🔬 Testing Comprehensive Screening CRUD...")
        comp_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "screening_type": "comprehensive",
            "equipment_used": "comprehensive_kit",
            "notes": "Test comprehensive screening"
        }
        
        comp_create = await self.make_request("POST", "/api/v1/specialized-screenings/comprehensive", comp_data)
        self.test_results["comp_create"] = comp_create
        
        if comp_create["success"]:
            print(f"    ✅ Comprehensive CREATE: {comp_create['status']}")
            comp_id = comp_create["data"].get("screening_id") or comp_create["data"].get("_id") or comp_create["data"].get("id")
            
            if comp_id:
                # Test UPDATE
                comp_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/comprehensive/{comp_id}", {"notes": "Updated comprehensive notes", "status": "completed"})
                self.test_results["comp_update"] = comp_update
                print(f"    {'✅' if comp_update['success'] else '❌'} Comprehensive UPDATE: {comp_update['status']}")
                
                # Test DELETE
                comp_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/comprehensive/{comp_id}")
                self.test_results["comp_delete"] = comp_delete
                print(f"    {'✅' if comp_delete['success'] else '❌'} Comprehensive DELETE: {comp_delete['status']}")
        else:
            print(f"    ❌ Comprehensive CREATE: {comp_create['status']} - {comp_create['data']}")
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Complete Screening CRUD Test with Patient Creation")
        print("=" * 70)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Create patient
        await self.create_simple_patient()
        
        # Test complete CRUD
        await self.test_complete_screening_crud()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 70)
        print("📊 COMPLETE SCREENING CRUD TEST SUMMARY")
        print("=" * 70)
        
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
    async with SimplePatientAndTest() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
