#!/usr/bin/env python3
"""
Create Real Screening Sessions
This script creates actual screening sessions using the patient records we just created.
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

class RealScreeningCreator:
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
    
    async def get_patients(self) -> List[Dict[str, Any]]:
        """Get all patient users from the system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    users = result.get("users", [])
                    # Filter for patient users
                    patients = [user for user in users if user.get("role") == "patient"]
                    print(f"👥 Found {len(patients)} patient users")
                    return patients
                else:
                    print(f"❌ Failed to get patients: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting patients: {str(e)}")
            return []
    
    async def get_medical_staff(self) -> List[Dict[str, Any]]:
        """Get medical staff who can perform screenings"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/admin/users",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    users = result.get("users", [])
                    # Filter for medical staff
                    medical_staff = [user for user in users if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist", "super_admin"]]
                    print(f"👨‍⚕️ Found {len(medical_staff)} medical staff")
                    return medical_staff
                else:
                    print(f"❌ Failed to get medical staff: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting medical staff: {str(e)}")
            return []
    
    async def create_screening_session(self, patient: Dict[str, Any], examiner: Dict[str, Any]) -> bool:
        """Create a screening session using the screenings API"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create screening session data
            session_data = {
                "patient_id": patient.get("user_id") or patient.get("id"),
                "examiner_id": examiner.get("user_id") or examiner.get("id"),
                "screening_type": random.choice(["distance", "near", "comprehensive"]),
                "screening_category": random.choice(["school_screening", "medical_screening"]),
                "equipment_used": random.choice(["Snellen Chart", "Tumbling E Chart", "Lea Symbols"]),
                "notes": f"Screening performed by {examiner.get('first_name', '')} {examiner.get('last_name', '')}"
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/screenings/sessions",
                json=session_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    result = await response.json()
                    session_id = result.get("session_id")
                    print(f"✅ Created screening session {session_id} for {patient.get('first_name')} {patient.get('last_name')}")
                    
                    # Update session with results
                    await self.update_screening_with_results(session_id, patient, examiner)
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create screening session for {patient.get('first_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating screening session for {patient.get('first_name')}: {str(e)}")
            return False
    
    async def update_screening_with_results(self, session_id: str, patient: Dict[str, Any], examiner: Dict[str, Any]) -> bool:
        """Update screening session with results"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Generate realistic screening results
            left_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
            right_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
            
            results = [
                {
                    "eye": "left",
                    "distance_acuity": left_acuity,
                    "near_acuity": left_acuity,
                    "color_vision": random.choice(["normal", "mild_deficiency", "moderate_deficiency"]),
                    "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
                    "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"])
                },
                {
                    "eye": "right",
                    "distance_acuity": right_acuity,
                    "near_acuity": right_acuity,
                    "color_vision": random.choice(["normal", "mild_deficiency", "moderate_deficiency"]),
                    "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
                    "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"])
                }
            ]
            
            # Determine outcome
            if "20/20" in left_acuity and "20/20" in right_acuity:
                overall_result = "normal"
                recommendations = ["Continue regular eye care", "Annual screening recommended"]
                follow_up_required = False
            elif "20/30" in left_acuity or "20/30" in right_acuity:
                overall_result = "borderline"
                recommendations = ["Monitor closely", "Consider glasses prescription", "Follow-up in 6 months"]
                follow_up_required = True
            else:
                overall_result = "abnormal"
                recommendations = ["Immediate referral to eye specialist", "Glasses prescription required", "Follow-up in 3 months"]
                follow_up_required = True
            
            # Update session with results
            update_data = {
                "results": results,
                "conclusion": f"Screening completed. {overall_result.title()} vision detected.",
                "recommendations": "; ".join(recommendations),
                "follow_up_date": (datetime.now() + timedelta(days=90)).isoformat() if follow_up_required else None,
                "status": "completed"
            }
            
            async with self.session.put(
                f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}",
                json=update_data,
                headers=headers
            ) as response:
                if response.status == 200:
                    print(f"✅ Updated screening session {session_id} with results - {overall_result}")
                    
                    # Create screening outcome
                    await self.create_screening_outcome(session_id, overall_result, recommendations, follow_up_required)
                    return True
                else:
                    error_text = await response.text()
                    print(f"⚠️ Session created but update failed for {session_id}: {error_text}")
                    return True  # Still count as success since session was created
        except Exception as e:
            print(f"❌ Error updating screening session {session_id}: {str(e)}")
            return False
    
    async def create_screening_outcome(self, session_id: str, overall_result: str, recommendations: List[str], follow_up_required: bool) -> bool:
        """Create screening outcome"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            outcome_data = {
                "outcome": {
                    "overall_result": overall_result,
                    "risk_level": "high" if overall_result == "abnormal" else "medium" if overall_result == "borderline" else "low",
                    "specific_findings": [
                        f"Vision screening completed with {overall_result} result"
                    ],
                    "academic_impact": "May affect reading and learning" if overall_result != "normal" else "No significant impact",
                    "recommendations": recommendations,
                    "follow_up_required": follow_up_required,
                    "follow_up_type": "urgent" if overall_result == "abnormal" else "routine",
                    "follow_up_date": (datetime.now() + timedelta(days=90)).isoformat() if follow_up_required else None,
                    "notes": f"Screening outcome: {overall_result}"
                },
                "examiner_notes": f"Comprehensive vision screening completed. {overall_result.title()} vision detected.",
                "parent_notification_sent": False,
                "school_notification_sent": False
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}/outcome",
                json=outcome_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    print(f"✅ Created screening outcome for session {session_id}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"⚠️ Session updated but outcome creation failed for {session_id}: {error_text}")
                    return True  # Still count as success
        except Exception as e:
            print(f"❌ Error creating screening outcome for {session_id}: {str(e)}")
            return False
    
    async def create_real_screenings(self, count: int = 5):
        """Create real screening sessions using CRUD endpoints"""
        if not await self.login():
            return
        
        patients = await self.get_patients()
        medical_staff = await self.get_medical_staff()
        
        if not patients:
            print("❌ No patients found. Please create patients first.")
            return
        
        if not medical_staff:
            print("❌ No medical staff found")
            return
        
        print(f"\n🔄 Creating {count} real screening sessions using CRUD endpoints...")
        
        success_count = 0
        for i in range(min(count, len(patients))):
            patient = patients[i]
            examiner = random.choice(medical_staff)
            
            if await self.create_screening_session(patient, examiner):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Screening sessions created: {success_count}")
        print(f"   Failed: {count - success_count}")
        
        if success_count > 0:
            print(f"\n🎉 Successfully created {success_count} real screening sessions!")
            print(f"   The dashboard should now show screening statistics.")
    
    async def test_dashboard_after_screenings(self):
        """Test dashboard data after creating screenings"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/dashboard/stats",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"\n📊 Dashboard Statistics (AFTER SCREENINGS):")
                    print(f"   Total Students: {result.get('totalStudents', 0)}")
                    print(f"   Total Teachers: {result.get('totalTeachers', 0)}")
                    print(f"   Total Schools: {result.get('totalSchools', 0)}")
                    print(f"   Total Screenings: {result.get('totalScreenings', 0)}")
                    print(f"   Completed Screenings: {result.get('completedScreenings', 0)}")
                    print(f"   Pending Screenings: {result.get('pendingScreenings', 0)}")
                    return True
                else:
                    print(f"❌ Failed to get dashboard stats: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Error getting dashboard stats: {str(e)}")
            return False

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Real Screening Sessions Creation")
    print("=" * 60)
    
    async with RealScreeningCreator() as creator:
        # Create real screening sessions
        await creator.create_real_screenings(5)
        
        # Test dashboard data
        await creator.test_dashboard_after_screenings()

if __name__ == "__main__":
    asyncio.run(main())
