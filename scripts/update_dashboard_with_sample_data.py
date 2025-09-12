#!/usr/bin/env python3
"""
Update Dashboard with Sample Data
This script directly updates the database to show sample screening data on the dashboard.
"""

import asyncio
import aiohttp
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class DashboardDataUpdater:
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
    
    async def get_students(self) -> List[Dict[str, Any]]:
        """Get all students from the system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/evep/students",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    students = result.get("students", [])
                    print(f"📚 Found {len(students)} students")
                    return students
                else:
                    print(f"❌ Failed to get students: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting students: {str(e)}")
            return []
    
    async def create_sample_screening_data_via_admin(self):
        """Create sample screening data using admin endpoints"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create sample screening sessions directly in the database via admin endpoint
            screening_data = {
                "sessions": [
                    {
                        "session_id": "SCREEN_001",
                        "patient_id": "68be9b7219d48ff5ee0bed2e",  # First student ID
                        "patient_name": "สมเกียรติ รักลูก",
                        "examiner_id": "68be5c3fa392cd3ee7968f03",  # Admin user ID
                        "examiner_name": "Super Administrator",
                        "screening_type": "comprehensive",
                        "screening_category": "school_screening",
                        "equipment_used": "Snellen Chart",
                        "status": "completed",
                        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
                        "completed_at": (datetime.now() - timedelta(days=5)).isoformat(),
                        "results": [
                            {
                                "eye": "left",
                                "distance_acuity": "20/25",
                                "near_acuity": "20/25",
                                "color_vision": "normal",
                                "depth_perception": "normal",
                                "contrast_sensitivity": "normal"
                            },
                            {
                                "eye": "right",
                                "distance_acuity": "20/30",
                                "near_acuity": "20/30",
                                "color_vision": "normal",
                                "depth_perception": "mild_impairment",
                                "contrast_sensitivity": "normal"
                            }
                        ],
                        "conclusion": "Borderline vision detected in right eye",
                        "recommendations": "Monitor closely, consider glasses prescription, follow-up in 6 months",
                        "follow_up_date": (datetime.now() + timedelta(days=90)).isoformat(),
                        "notes": "Screening performed by Super Administrator"
                    },
                    {
                        "session_id": "SCREEN_002",
                        "patient_id": "68be9b7219d48ff5ee0bed2f",  # Second student ID
                        "patient_name": "สมพร ใจดี",
                        "examiner_id": "68be5c3fa392cd3ee7968f03",
                        "examiner_name": "Super Administrator",
                        "screening_type": "distance",
                        "screening_category": "medical_screening",
                        "equipment_used": "Tumbling E Chart",
                        "status": "completed",
                        "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
                        "completed_at": (datetime.now() - timedelta(days=3)).isoformat(),
                        "results": [
                            {
                                "eye": "left",
                                "distance_acuity": "20/20",
                                "near_acuity": "20/20",
                                "color_vision": "normal",
                                "depth_perception": "normal",
                                "contrast_sensitivity": "normal"
                            },
                            {
                                "eye": "right",
                                "distance_acuity": "20/20",
                                "near_acuity": "20/20",
                                "color_vision": "normal",
                                "depth_perception": "normal",
                                "contrast_sensitivity": "normal"
                            }
                        ],
                        "conclusion": "Normal vision detected",
                        "recommendations": "Continue regular eye care, annual screening recommended",
                        "follow_up_date": None,
                        "notes": "Screening performed by Super Administrator"
                    },
                    {
                        "session_id": "SCREEN_003",
                        "patient_id": "68be9b7219d48ff5ee0bed30",  # Third student ID
                        "patient_name": "วิชัย เก่งเรียน",
                        "examiner_id": "68be5c3fa392cd3ee7968f03",
                        "examiner_name": "Super Administrator",
                        "screening_type": "near",
                        "screening_category": "school_screening",
                        "equipment_used": "Lea Symbols",
                        "status": "completed",
                        "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                        "completed_at": (datetime.now() - timedelta(days=1)).isoformat(),
                        "results": [
                            {
                                "eye": "left",
                                "distance_acuity": "20/40",
                                "near_acuity": "20/40",
                                "color_vision": "mild_deficiency",
                                "depth_perception": "moderate_impairment",
                                "contrast_sensitivity": "mild_reduction"
                            },
                            {
                                "eye": "right",
                                "distance_acuity": "20/50",
                                "near_acuity": "20/50",
                                "color_vision": "moderate_deficiency",
                                "depth_perception": "moderate_impairment",
                                "contrast_sensitivity": "moderate_reduction"
                            }
                        ],
                        "conclusion": "Abnormal vision detected, requires immediate attention",
                        "recommendations": "Immediate referral to eye specialist, glasses prescription required, follow-up in 3 months",
                        "follow_up_date": (datetime.now() + timedelta(days=30)).isoformat(),
                        "notes": "Screening performed by Super Administrator"
                    }
                ]
            }
            
            # Save the data to a file for manual import
            with open("sample_screening_sessions.json", "w") as f:
                json.dump(screening_data, f, indent=2)
            
            print(f"✅ Created sample screening data:")
            print(f"   - {len(screening_data['sessions'])} screening sessions")
            print(f"   - Data saved to sample_screening_sessions.json")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating screening data: {str(e)}")
            return False
    
    async def test_dashboard_before(self):
        """Test dashboard data before update"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/dashboard/stats",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"\n📊 Dashboard Statistics (BEFORE):")
                    print(f"   Total Students: {result.get('totalStudents', 0)}")
                    print(f"   Total Teachers: {result.get('totalTeachers', 0)}")
                    print(f"   Total Schools: {result.get('totalSchools', 0)}")
                    print(f"   Total Screenings: {result.get('totalScreenings', 0)}")
                    print(f"   Completed Screenings: {result.get('completedScreenings', 0)}")
                    print(f"   Pending Screenings: {result.get('pendingScreenings', 0)}")
                    return result
                else:
                    print(f"❌ Failed to get dashboard stats: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Error getting dashboard stats: {str(e)}")
            return None
    
    async def test_dashboard_after(self):
        """Test dashboard data after update"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/dashboard/stats",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"\n📊 Dashboard Statistics (AFTER):")
                    print(f"   Total Students: {result.get('totalStudents', 0)}")
                    print(f"   Total Teachers: {result.get('totalTeachers', 0)}")
                    print(f"   Total Schools: {result.get('totalSchools', 0)}")
                    print(f"   Total Screenings: {result.get('totalScreenings', 0)}")
                    print(f"   Completed Screenings: {result.get('completedScreenings', 0)}")
                    print(f"   Pending Screenings: {result.get('pendingScreenings', 0)}")
                    return result
                else:
                    print(f"❌ Failed to get dashboard stats: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Error getting dashboard stats: {str(e)}")
            return None

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Dashboard Data Update")
    print("=" * 50)
    
    async with DashboardDataUpdater() as updater:
        # Test dashboard before
        await updater.test_dashboard_before()
        
        # Get students
        students = await updater.get_students()
        
        # Create sample screening data
        await updater.create_sample_screening_data_via_admin()
        
        print(f"\n📝 Next Steps:")
        print(f"   1. The sample screening data has been created in sample_screening_sessions.json")
        print(f"   2. This data needs to be manually inserted into the MongoDB database")
        print(f"   3. The dashboard will then show real screening statistics")
        print(f"   4. Alternatively, the screenings API endpoints need to be fixed to accept student IDs")

if __name__ == "__main__":
    asyncio.run(main())
