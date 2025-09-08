#!/usr/bin/env python3
"""
Test Final Fixes for Screening CRUD
Tests the fixed UPDATE operations with existing patient data
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

class FinalFixesTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.test_results = {}
        self.patient_id = "68bed9284d1fe51637364b69"  # Use existing patient from previous test
        
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
    
    async def test_fixed_update_operations(self):
        """Test the fixed UPDATE operations with status field"""
        print("\n🔧 Testing Fixed UPDATE Operations...")
        
        examiner_id = "68be5c3fa392cd3ee7968f03"  # Admin user ID
        
        # Test Color Vision Screening CRUD with fixed UPDATE
        print("\n  🌈 Testing Color Vision Screening with Fixed UPDATE...")
        color_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "test_method": "ishihara",
            "equipment_used": "ishihara_plates",
            "notes": "Test color vision screening - fixed update"
        }
        
        color_create = await self.make_request("POST", "/api/v1/specialized-screenings/color-vision", color_data)
        self.test_results["color_create"] = color_create
        
        if color_create["success"]:
            print(f"    ✅ Color Vision CREATE: {color_create['status']}")
            color_id = color_create["data"].get("screening_id") or color_create["data"].get("_id") or color_create["data"].get("id")
            
            if color_id:
                # Test FIXED UPDATE with status field
                print("    🔧 Testing FIXED UPDATE...")
                color_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/color-vision/{color_id}", {
                    "notes": "Updated color vision notes - FIXED",
                    "status": "completed"
                })
                self.test_results["color_update_fixed"] = color_update
                print(f"    {'✅' if color_update['success'] else '❌'} Color Vision UPDATE (FIXED): {color_update['status']}")
                
                # Test DELETE
                color_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/color-vision/{color_id}")
                self.test_results["color_delete"] = color_delete
                print(f"    {'✅' if color_delete['success'] else '❌'} Color Vision DELETE: {color_delete['status']}")
            else:
                print("    ⚠️  No color ID returned")
        else:
            print(f"    ❌ Color Vision CREATE: {color_create['status']} - {color_create['data']}")
        
        # Test Depth Perception Screening CRUD with fixed UPDATE
        print("\n  🎯 Testing Depth Perception Screening with Fixed UPDATE...")
        depth_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "test_method": "stereo_test",
            "equipment_used": "stereo_glasses",
            "notes": "Test depth perception screening - fixed update"
        }
        
        depth_create = await self.make_request("POST", "/api/v1/specialized-screenings/depth-perception", depth_data)
        self.test_results["depth_create"] = depth_create
        
        if depth_create["success"]:
            print(f"    ✅ Depth Perception CREATE: {depth_create['status']}")
            depth_id = depth_create["data"].get("screening_id") or depth_create["data"].get("_id") or depth_create["data"].get("id")
            
            if depth_id:
                # Test FIXED UPDATE with status field
                print("    🔧 Testing FIXED UPDATE...")
                depth_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/depth-perception/{depth_id}", {
                    "notes": "Updated depth perception notes - FIXED",
                    "status": "completed"
                })
                self.test_results["depth_update_fixed"] = depth_update
                print(f"    {'✅' if depth_update['success'] else '❌'} Depth Perception UPDATE (FIXED): {depth_update['status']}")
                
                # Test DELETE
                depth_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/depth-perception/{depth_id}")
                self.test_results["depth_delete"] = depth_delete
                print(f"    {'✅' if depth_delete['success'] else '❌'} Depth Perception DELETE: {depth_delete['status']}")
            else:
                print("    ⚠️  No depth ID returned")
        else:
            print(f"    ❌ Depth Perception CREATE: {depth_create['status']} - {depth_create['data']}")
        
        # Test Comprehensive Screening CRUD with fixed UPDATE
        print("\n  🔬 Testing Comprehensive Screening with Fixed UPDATE...")
        comp_data = {
            "patient_id": self.patient_id,
            "examiner_id": examiner_id,
            "screening_type": "comprehensive",
            "equipment_used": "comprehensive_kit",
            "notes": "Test comprehensive screening - fixed update"
        }
        
        comp_create = await self.make_request("POST", "/api/v1/specialized-screenings/comprehensive", comp_data)
        self.test_results["comp_create"] = comp_create
        
        if comp_create["success"]:
            print(f"    ✅ Comprehensive CREATE: {comp_create['status']}")
            comp_id = comp_create["data"].get("screening_id") or comp_create["data"].get("_id") or comp_create["data"].get("id")
            
            if comp_id:
                # Test FIXED UPDATE with status field
                print("    🔧 Testing FIXED UPDATE...")
                comp_update = await self.make_request("PUT", f"/api/v1/specialized-screenings/comprehensive/{comp_id}", {
                    "notes": "Updated comprehensive notes - FIXED",
                    "status": "completed"
                })
                self.test_results["comp_update_fixed"] = comp_update
                print(f"    {'✅' if comp_update['success'] else '❌'} Comprehensive UPDATE (FIXED): {comp_update['status']}")
                
                # Test DELETE
                comp_delete = await self.make_request("DELETE", f"/api/v1/specialized-screenings/comprehensive/{comp_id}")
                self.test_results["comp_delete"] = comp_delete
                print(f"    {'✅' if comp_delete['success'] else '❌'} Comprehensive DELETE: {comp_delete['status']}")
            else:
                print("    ⚠️  No comprehensive ID returned")
        else:
            print(f"    ❌ Comprehensive CREATE: {comp_create['status']} - {comp_create['data']}")
    
    async def test_va_screening_with_appointment(self):
        """Test VA screening with appointment creation"""
        print("\n  👁️ Testing VA Screening with Appointment...")
        
        examiner_id = "68be5c3fa392cd3ee7968f03"  # Admin user ID
        
        # Create appointment first
        print("    📅 Creating appointment...")
        appointment_data = {
            "patient_id": self.patient_id,
            "appointment_date": datetime.now().isoformat(),
            "appointment_type": "screening",
            "status": "scheduled",
            "notes": "Test appointment for VA screening"
        }
        
        appointment_result = await self.make_request("POST", "/api/v1/appointments", appointment_data)
        if appointment_result["success"]:
            appointment_id = appointment_result["data"].get("_id") or appointment_result["data"].get("id")
            print(f"    ✅ Appointment created: {appointment_id}")
            
            # Test VA Screening with appointment
            va_data = {
                "patient_id": self.patient_id,
                "appointment_id": appointment_id,
                "screening_type": "distance",
                "equipment_used": "snellen_chart",
                "examiner_notes": "Test VA screening with appointment"
            }
            
            va_create = await self.make_request("POST", "/api/v1/screenings/va", va_data)
            self.test_results["va_create_with_appointment"] = va_create
            
            if va_create["success"]:
                print(f"    ✅ VA CREATE with appointment: {va_create['status']}")
                va_id = va_create["data"].get("screening_id") or va_create["data"].get("_id") or va_create["data"].get("id")
                
                if va_id:
                    # Test UPDATE
                    va_update = await self.make_request("PUT", f"/api/v1/screenings/va/{va_id}", {
                        "examiner_notes": "Updated VA notes with appointment",
                        "status": "completed"
                    })
                    self.test_results["va_update_with_appointment"] = va_update
                    print(f"    {'✅' if va_update['success'] else '❌'} VA UPDATE with appointment: {va_update['status']}")
                    
                    # Test DELETE
                    va_delete = await self.make_request("DELETE", f"/api/v1/screenings/va/{va_id}")
                    self.test_results["va_delete_with_appointment"] = va_delete
                    print(f"    {'✅' if va_delete['success'] else '❌'} VA DELETE with appointment: {va_delete['status']}")
            else:
                print(f"    ❌ VA CREATE with appointment: {va_create['status']} - {va_create['data']}")
        else:
            print(f"    ❌ Appointment creation failed: {appointment_result['status']} - {appointment_result['data']}")
    
    async def run_all_tests(self):
        """Run all final fix tests"""
        print("🚀 Testing Final Fixes for Screening CRUD")
        print("=" * 50)
        print(f"👤 Using existing patient: {self.patient_id}")
        print("=" * 50)
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Test fixed UPDATE operations
        await self.test_fixed_update_operations()
        
        # Test VA screening with appointment
        await self.test_va_screening_with_appointment()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("📊 FINAL FIXES TEST SUMMARY")
        print("=" * 50)
        
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
    async with FinalFixesTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
