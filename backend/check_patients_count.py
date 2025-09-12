#!/usr/bin/env python3
"""
Check patient count
"""

import asyncio
import motor.motor_asyncio

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def check_patients():
    """Check patient count"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Checking patients...")
    
    # Get patient count
    patient_count = await db.patients.count_documents({})
    print(f"📊 Total patients in database: {patient_count}")
    
    if patient_count > 0:
        # Get first few patients
        patients = await db.patients.find().limit(3).to_list(length=None)
        print("\n👤 First few patients:")
        for i, patient in enumerate(patients):
            print(f"   {i+1}. {patient.get('first_name', 'N/A')} {patient.get('last_name', 'N/A')} - CID: {patient.get('cid', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(check_patients())
