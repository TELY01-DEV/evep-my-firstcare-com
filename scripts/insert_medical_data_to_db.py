#!/usr/bin/env python3
"""
Insert Medical Data Directly to MongoDB
This script directly inserts the sample medical data into the MongoDB database.
"""

import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Dict, Any, List

# MongoDB Configuration
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/evep?authSource=admin"

class MedicalDataInserter:
    def __init__(self):
        self.client = None
        self.db = None
        
    async def __aenter__(self):
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.client.evep
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            self.client.close()
    
    async def insert_screening_data(self):
        """Insert screening data into the database"""
        try:
            # Read the sample screening data
            if not os.path.exists("sample_screening_data.json"):
                print("❌ sample_screening_data.json not found")
                return False
            
            with open("sample_screening_data.json", "r") as f:
                screening_data = json.load(f)
            
            # Insert screening sessions
            if screening_data.get("sessions"):
                sessions_collection = self.db.screening_sessions
                for session in screening_data["sessions"]:
                    session["_id"] = session["session_id"]
                    session["created_at"] = datetime.fromisoformat(session["created_at"].replace("Z", "+00:00"))
                    session["completed_at"] = datetime.fromisoformat(session["completed_at"].replace("Z", "+00:00"))
                
                await sessions_collection.insert_many(screening_data["sessions"])
                print(f"✅ Inserted {len(screening_data['sessions'])} screening sessions")
            
            # Insert screening results
            if screening_data.get("results"):
                results_collection = self.db.screening_results
                for result in screening_data["results"]:
                    result["_id"] = f"{result['session_id']}_{result['eye']}"
                
                await results_collection.insert_many(screening_data["results"])
                print(f"✅ Inserted {len(screening_data['results'])} screening results")
            
            # Insert screening outcomes
            if screening_data.get("outcomes"):
                outcomes_collection = self.db.screening_outcomes
                for outcome in screening_data["outcomes"]:
                    outcome["_id"] = f"outcome_{outcome['session_id']}"
                    if outcome.get("created_at"):
                        outcome["created_at"] = datetime.fromisoformat(outcome["created_at"].replace("Z", "+00:00"))
                    if outcome.get("follow_up_date"):
                        outcome["follow_up_date"] = datetime.fromisoformat(outcome["follow_up_date"].replace("Z", "+00:00"))
                
                await outcomes_collection.insert_many(screening_data["outcomes"])
                print(f"✅ Inserted {len(screening_data['outcomes'])} screening outcomes")
            
            return True
            
        except Exception as e:
            print(f"❌ Error inserting screening data: {str(e)}")
            return False
    
    async def insert_inventory_data(self):
        """Insert inventory data into the database"""
        try:
            # Read the sample inventory data
            if not os.path.exists("sample_inventory_data.json"):
                print("❌ sample_inventory_data.json not found")
                return False
            
            with open("sample_inventory_data.json", "r") as f:
                inventory_data = json.load(f)
            
            # Insert inventory items
            if inventory_data:
                inventory_collection = self.db.glasses_inventory
                for item in inventory_data:
                    item["_id"] = item["item_code"]
                    item["created_at"] = datetime.utcnow()
                    item["updated_at"] = datetime.utcnow()
                
                await inventory_collection.insert_many(inventory_data)
                print(f"✅ Inserted {len(inventory_data)} inventory items")
            
            return True
            
        except Exception as e:
            print(f"❌ Error inserting inventory data: {str(e)}")
            return False
    
    async def create_patient_records(self):
        """Create patient records from existing students"""
        try:
            # Get students from the database
            students_collection = self.db.evep.students
            students = await students_collection.find({"status": "active"}).to_list(length=None)
            
            if not students:
                print("❌ No students found")
                return False
            
            # Create patient records
            patients_collection = self.db.patients
            patient_count = 0
            
            for student in students:
                # Check if patient already exists
                existing_patient = await patients_collection.find_one({"student_id": str(student["_id"])})
                if existing_patient:
                    continue
                
                # Create patient record
                patient = {
                    "_id": f"patient_{student['_id']}",
                    "student_id": str(student["_id"]),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "date_of_birth": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "address": student.get("address", {}),
                    "school": student.get("school_name", ""),
                    "grade": student.get("grade_level", ""),
                    "medical_history": {
                        "allergies": [],
                        "medications": [],
                        "conditions": []
                    },
                    "family_vision_history": {
                        "parent_vision_issues": False,
                        "sibling_vision_issues": False,
                        "family_glasses_use": False
                    },
                    "insurance_info": {
                        "provider": "",
                        "policy_number": "",
                        "group_number": ""
                    },
                    "consent_forms": {
                        "medical_treatment": False,
                        "data_sharing": False,
                        "photo_consent": student.get("consent_document", False)
                    },
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await patients_collection.insert_one(patient)
                patient_count += 1
            
            print(f"✅ Created {patient_count} patient records from students")
            return True
            
        except Exception as e:
            print(f"❌ Error creating patient records: {str(e)}")
            return False
    
    async def insert_all_data(self):
        """Insert all medical data"""
        print("🔄 Inserting medical data into MongoDB...")
        
        # Create patient records
        await self.create_patient_records()
        
        # Insert screening data
        await self.insert_screening_data()
        
        # Insert inventory data
        await self.insert_inventory_data()
        
        print("\n📊 Medical data insertion completed!")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Medical Data Database Insertion")
    print("=" * 60)
    
    async with MedicalDataInserter() as inserter:
        await inserter.insert_all_data()

if __name__ == "__main__":
    asyncio.run(main())
