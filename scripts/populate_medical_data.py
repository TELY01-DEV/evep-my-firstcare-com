#!/usr/bin/env python3
"""
Populate Medical Data Directly
This script directly populates the database with medical data for testing.
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

class MedicalDataPopulator:
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
                    medical_staff = [user for user in users if user.get("role") in ["doctor", "nurse", "medical_staff", "optometrist"]]
                    print(f"👨‍⚕️ Found {len(medical_staff)} medical staff")
                    return medical_staff
                else:
                    print(f"❌ Failed to get medical staff: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting medical staff: {str(e)}")
            return []
    
    async def create_sample_screening_data(self, students: List[Dict[str, Any]], medical_staff: List[Dict[str, Any]]):
        """Create sample screening data directly in the database"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create sample screening sessions
            screening_data = {
                "sessions": [],
                "results": [],
                "outcomes": []
            }
            
            for i, student in enumerate(students[:5]):  # Create screenings for first 5 students
                examiner = random.choice(medical_staff) if medical_staff else {"id": "admin", "first_name": "Admin", "last_name": "User"}
                
                # Create screening session
                session = {
                    "session_id": f"SCREEN_{i+1:03d}",
                    "patient_id": student.get("id"),
                    "patient_name": f"{student.get('first_name', '')} {student.get('last_name', '')}",
                    "examiner_id": examiner.get("id"),
                    "examiner_name": f"{examiner.get('first_name', '')} {examiner.get('last_name', '')}",
                    "screening_type": random.choice(["distance", "near", "comprehensive"]),
                    "screening_category": random.choice(["school_screening", "medical_screening"]),
                    "equipment_used": random.choice(["Snellen Chart", "Tumbling E Chart", "Lea Symbols"]),
                    "status": "completed",
                    "created_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                    "completed_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                    "notes": f"Screening performed by {examiner.get('first_name', '')} {examiner.get('last_name', '')}"
                }
                
                # Create screening results
                left_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
                right_acuity = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
                
                results = [
                    {
                        "session_id": session["session_id"],
                        "eye": "left",
                        "distance_acuity": left_acuity,
                        "near_acuity": left_acuity,
                        "color_vision": random.choice(["normal", "mild_deficiency", "moderate_deficiency"]),
                        "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
                        "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"])
                    },
                    {
                        "session_id": session["session_id"],
                        "eye": "right",
                        "distance_acuity": right_acuity,
                        "near_acuity": right_acuity,
                        "color_vision": random.choice(["normal", "mild_deficiency", "moderate_deficiency"]),
                        "depth_perception": random.choice(["normal", "mild_impairment", "moderate_impairment"]),
                        "contrast_sensitivity": random.choice(["normal", "mild_reduction", "moderate_reduction"])
                    }
                ]
                
                # Create screening outcome
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
                else:
                    overall_result = "abnormal"
                    risk_level = "high"
                    recommendations = ["Immediate referral to eye specialist", "Glasses prescription required", "Follow-up in 3 months"]
                    follow_up_required = True
                
                outcome = {
                    "session_id": session["session_id"],
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
                    "follow_up_type": "urgent" if overall_result == "abnormal" else "routine",
                    "follow_up_date": (datetime.now() + timedelta(days=90)).isoformat() if follow_up_required else None,
                    "notes": f"Screening completed on {session['created_at'][:10]}",
                    "examiner_notes": f"Comprehensive vision screening completed. {overall_result.title()} vision detected.",
                    "parent_notification_sent": False,
                    "school_notification_sent": False,
                    "created_at": session["completed_at"]
                }
                
                screening_data["sessions"].append(session)
                screening_data["results"].extend(results)
                screening_data["outcomes"].append(outcome)
            
            # Save screening data to a file for manual import
            with open("sample_screening_data.json", "w") as f:
                json.dump(screening_data, f, indent=2)
            
            print(f"✅ Created sample screening data for {len(screening_data['sessions'])} students")
            print(f"   - {len(screening_data['sessions'])} screening sessions")
            print(f"   - {len(screening_data['results'])} screening results")
            print(f"   - {len(screening_data['outcomes'])} screening outcomes")
            print(f"   - Data saved to sample_screening_data.json")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating screening data: {str(e)}")
            return False
    
    async def create_sample_inventory_data(self):
        """Create sample inventory data"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Sample inventory items
            inventory_items = [
                {
                    "item_code": "FRAME-001",
                    "item_name": "Children's Plastic Frame - Blue",
                    "category": "frames",
                    "brand": "KidsVision",
                    "model": "KV-001",
                    "specifications": {
                        "material": "plastic",
                        "color": "blue",
                        "size": "small",
                        "age_range": "3-8 years"
                    },
                    "unit_price": 450.0,
                    "cost_price": 300.0,
                    "current_stock": 50,
                    "reorder_level": 10,
                    "is_active": True
                },
                {
                    "item_code": "LENS-001",
                    "item_name": "Single Vision Lens - Clear",
                    "category": "lenses",
                    "brand": "ClearVision",
                    "model": "CV-SV-001",
                    "specifications": {
                        "type": "single_vision",
                        "material": "polycarbonate",
                        "index": "1.59"
                    },
                    "unit_price": 800.0,
                    "cost_price": 500.0,
                    "current_stock": 100,
                    "reorder_level": 20,
                    "is_active": True
                }
            ]
            
            # Save inventory data to a file for manual import
            with open("sample_inventory_data.json", "w") as f:
                json.dump(inventory_items, f, indent=2)
            
            print(f"✅ Created sample inventory data with {len(inventory_items)} items")
            print(f"   - Data saved to sample_inventory_data.json")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating inventory data: {str(e)}")
            return False
    
    async def populate_medical_data(self):
        """Populate medical data"""
        if not await self.login():
            return
        
        students = await self.get_students()
        medical_staff = await self.get_medical_staff()
        
        if not students:
            print("❌ No students found")
            return
        
        print(f"\n🔄 Creating sample medical data...")
        
        # Create screening data
        await self.create_sample_screening_data(students, medical_staff)
        
        # Create inventory data
        await self.create_sample_inventory_data()
        
        print(f"\n📊 Summary:")
        print(f"   Students available: {len(students)}")
        print(f"   Medical staff available: {len(medical_staff)}")
        print(f"   Sample data files created for manual import")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Medical Data Population")
    print("=" * 60)
    
    async with MedicalDataPopulator() as populator:
        await populator.populate_medical_data()

if __name__ == "__main__":
    asyncio.run(main())
