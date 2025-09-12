#!/usr/bin/env python3
"""
Update existing patients to add CID fields
"""

import asyncio
import motor.motor_asyncio
import random
from datetime import datetime

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def update_existing_patients():
    """Add CID fields to existing patients"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔧 Updating existing patients to add CID fields...")
    
    # Get patients without CID
    patients_without_cid = await db.patients.find({"cid": {"$exists": False}}).to_list(length=None)
    
    print(f"📊 Found {len(patients_without_cid)} patients without CID")
    
    if len(patients_without_cid) == 0:
        print("✅ All patients already have CID fields")
        return
    
    updated_count = 0
    
    for patient in patients_without_cid:
        # Generate unique CID (13 digits)
        cid = f"{random.randint(1, 9)}{''.join([str(random.randint(0, 9)) for _ in range(12)])}"
        
        # Update patient with CID
        result = await db.patients.update_one(
            {"_id": patient["_id"]},
            {
                "$set": {
                    "cid": cid,
                    "updated_at": datetime.now().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Updated patient: {patient.get('first_name', 'N/A')} {patient.get('last_name', 'N/A')} - CID: {cid}")
    
    print(f"\n📈 Update Summary:")
    print(f"   Patients updated: {updated_count}")
    print(f"   Patients remaining without CID: {len(patients_without_cid) - updated_count}")

if __name__ == "__main__":
    asyncio.run(update_existing_patients())
