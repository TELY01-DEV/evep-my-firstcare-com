#!/usr/bin/env python3
"""
Check patient document structure
"""

import asyncio
import motor.motor_asyncio

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def check_patient_structure():
    """Check patient document structure"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Checking patient document structure...")
    
    # Get first patient
    patient = await db.patients.find_one()
    
    if not patient:
        print("❌ No patients found in database")
        return
    
    print(f"📋 Patient document fields:")
    for key, value in patient.items():
        print(f"   {key}: {type(value).__name__} = {str(value)[:50]}{'...' if len(str(value)) > 50 else ''}")
    
    print(f"\n📊 Total fields: {len(patient.keys())}")

if __name__ == "__main__":
    asyncio.run(check_patient_structure())
