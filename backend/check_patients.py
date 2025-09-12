#!/usr/bin/env python3
"""
Check patients in database
"""

import asyncio
import motor.motor_asyncio

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def check_patients():
    """Check patients in database"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Checking patients in database...")
    
    # Get all patients
    patients = await db.patients.find().to_list(length=None)
    
    print(f"📊 Found {len(patients)} patients")
    
    if len(patients) == 0:
        print("❌ No patients found in database")
        return
    
    # Check first few patients
    for i, patient in enumerate(patients[:5]):
        print(f"\n👤 Patient {i+1}:")
        print(f"   Name: {patient.get('first_name', 'N/A')} {patient.get('last_name', 'N/A')}")
        print(f"   CID: {patient.get('cid', 'MISSING')}")
        print(f"   Email: {patient.get('parent_email', 'N/A')}")
        print(f"   School: {patient.get('school', 'N/A')}")
        print(f"   Active: {patient.get('is_active', 'N/A')}")
    
    # Check how many have CID
    patients_with_cid = [p for p in patients if 'cid' in p]
    print(f"\n📈 Summary:")
    print(f"   Total patients: {len(patients)}")
    print(f"   Patients with CID: {len(patients_with_cid)}")
    print(f"   Patients without CID: {len(patients) - len(patients_with_cid)}")

if __name__ == "__main__":
    asyncio.run(check_patients())
