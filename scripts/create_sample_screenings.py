#!/usr/bin/env python3
"""
Create Sample Screening Data
This script creates sample vision screening sessions and results for testing.
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

class ScreeningDataCreator:
    def __init__(self):
        self.session = None
        self.access_token = None
        self.patients = []
        self.examiners = []
        
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
        """Get all patients from the system"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/patients",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    patients = result.get("patients", [])
                    print(f"👥 Found {len(patients)} patients")
                    return patients
                else:
                    print(f"❌ Failed to get patients: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting patients: {str(e)}")
            return []
    
    async def get_examiners(self) -> List[Dict[str, Any]]:
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
                    examiners = [user for user in users if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]]
                    print(f"👨‍⚕️ Found {len(examiners)} medical examiners")
                    return examiners
                else:
                    print(f"❌ Failed to get examiners: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting examiners: {str(e)}")
            return []
    
    def generate_screening_results(self) -> List[Dict[str, Any]]:
        """Generate realistic screening results"""
        results = []
        
        # Left eye results
        left_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
        left_color = random.choice(["normal", "mild_deficiency", "moderate_deficiency"])
        
        results.append({
            "eye": "left",
            "distance_acuity": left_acuity,
            "near_acuity": left_acuity,
            "color_vision": left_color,
            "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
            "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"]),
            "additional_tests": {
                "stereopsis": random.choice(["normal", "reduced", "absent"]),
                "convergence": random.choice(["normal", "insufficient", "excessive"])
            }
        })
        
        # Right eye results
        right_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
        right_color = random.choice(["normal", "mild_deficiency", "moderate_deficiency"])
        
        results.append({
            "eye": "right",
            "distance_acuity": right_acuity,
            "near_acuity": right_acuity,
            "color_vision": right_color,
            "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
            "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"]),
            "additional_tests": {
                "stereopsis": random.choice(["normal", "reduced", "absent"]),
                "convergence": random.choice(["normal", "insufficient", "excessive"])
            }
        })
        
        return results
    
    def generate_screening_outcome(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate screening outcome based on results"""
        # Analyze results to determine outcome
        left_acuity = results[0]["distance_acuity"]
        right_acuity = results[1]["distance_acuity"]
        
        # Determine overall result
        if "20/20" in left_acuity and "20/20" in right_acuity:
            overall_result = "normal"
            risk_level = "low"
            recommendations = ["Continue regular eye care", "Annual screening recommended"]
            follow_up_required = False
        elif "20/30" in left_acuity or "20/30" in right_acuity:
            overall_result = "borderline"
            risk_level = "medium"
            recommendations = ["Monitor closely", "Consider glasses prescription", "Follow-up in 6 months"]
            follow_up_required = True
            follow_up_type = "routine"
        else:
            overall_result = "abnormal"
            risk_level = "high"
            recommendations = ["Immediate referral to eye specialist", "Glasses prescription required", "Follow-up in 3 months"]
            follow_up_required = True
            follow_up_type = "urgent"
        
        return {
            "overall_result": overall_result,
            "risk_level": risk_level,
            "specific_findings": [
                f"Left eye acuity: {left_acuity}",
                f"Right eye acuity: {right_acuity}",
                f"Color vision: {results[0]['color_vision']}"
            ],
            "academic_impact": "May affect reading and learning" if overall_result != "normal" else "No significant impact",
            "recommendations": recommendations,
            "follow_up_required": follow_up_required,
            "follow_up_type": follow_up_type,
            "follow_up_date": (datetime.now() + timedelta(days=90)).isoformat() if follow_up_required else None,
            "notes": f"Screening completed on {datetime.now().strftime('%Y-%m-%d')}"
        }
    
    async def create_screening_session(self, patient: Dict[str, Any], examiner: Dict[str, Any]) -> bool:
        """Create a screening session for a patient"""
        try:
            # Generate screening data
            results = self.generate_screening_results()
            outcome = self.generate_screening_outcome(results)
            
            # Create screening session
            session_data = {
                "patient_id": patient.get("id"),
                "examiner_id": examiner.get("id"),
                "screening_type": random.choice(["distance", "near", "comprehensive"]),
                "screening_category": random.choice(["school_screening", "medical_screening"]),
                "equipment_used": random.choice(["Snellen Chart", "Tumbling E Chart", "Lea Symbols"]),
                "notes": f"Screening performed by {examiner.get('first_name')} {examiner.get('last_name')}"
            }
            
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create the session
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/screenings/sessions",
                json=session_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    session_result = await response.json()
                    session_id = session_result.get("session_id")
                    
                    # Update session with results
                    update_data = {
                        "results": results,
                        "conclusion": outcome["notes"],
                        "recommendations": "; ".join(outcome["recommendations"]),
                        "follow_up_date": outcome["follow_up_date"],
                        "status": "completed"
                    }
                    
                    async with self.session.put(
                        f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}",
                        json=update_data,
                        headers=headers
                    ) as update_response:
                        if update_response.status == 200:
                            # Create screening outcome
                            outcome_data = {
                                "outcome": outcome,
                                "examiner_notes": f"Comprehensive vision screening completed. {outcome['notes']}",
                                "parent_notification_sent": False,
                                "school_notification_sent": False
                            }
                            
                            async with self.session.post(
                                f"{API_BASE_URL}/api/v1/screenings/sessions/{session_id}/outcome",
                                json=outcome_data,
                                headers=headers
                            ) as outcome_response:
                                if outcome_response.status == 201:
                                    print(f"✅ Created screening for {patient.get('first_name')} {patient.get('last_name')} - {outcome['overall_result']}")
                                    return True
                                else:
                                    print(f"⚠️ Session created but outcome failed for {patient.get('first_name')}")
                                    return True
                        else:
                            print(f"⚠️ Session created but update failed for {patient.get('first_name')}")
                            return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create screening for {patient.get('first_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating screening for {patient.get('first_name')}: {str(e)}")
            return False
    
    async def create_sample_screenings(self, count: int = 10):
        """Create sample screening sessions"""
        if not await self.login():
            return
        
        # Get patients and examiners
        self.patients = await self.get_patients()
        self.examiners = await self.get_examiners()
        
        if not self.patients:
            print("❌ No patients found. Please create patients first.")
            return
        
        if not self.examiners:
            print("❌ No medical examiners found. Please create medical staff first.")
            return
        
        print(f"\n🔄 Creating {count} sample screening sessions...")
        
        success_count = 0
        for i in range(min(count, len(self.patients))):
            patient = self.patients[i]
            examiner = random.choice(self.examiners)
            
            if await self.create_screening_session(patient, examiner):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Screening sessions created: {success_count}")
        print(f"   Failed: {count - success_count}")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Sample Screening Data Creation")
    print("=" * 60)
    
    async with ScreeningDataCreator() as creator:
        await creator.create_sample_screenings(15)  # Create 15 sample screenings

if __name__ == "__main__":
    asyncio.run(main())
