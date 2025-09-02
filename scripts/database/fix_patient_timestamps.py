#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def fix_patient_timestamps():
    """Fix timestamp format issues in patient records"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🔧 Fixing patient timestamp formats...")
        
        # Find patients with float timestamps
        patients_with_float_timestamps = await db.patients.find({
            "$or": [
                {"updated_at": {"$type": "double"}},
                {"created_at": {"$type": "double"}},
                {"merged_at": {"$type": "double"}}
            ]
        }).to_list(length=None)
        
        print(f"📊 Found {len(patients_with_float_timestamps)} patients with float timestamps")
        
        if not patients_with_float_timestamps:
            print("✅ No timestamp issues found!")
            return
        
        fixed_count = 0
        
        for patient in patients_with_float_timestamps:
            patient_id = patient["_id"]
            updates = {}
            
            # Fix updated_at if it's a float
            if isinstance(patient.get("updated_at"), (int, float)):
                updates["updated_at"] = datetime.utcnow().isoformat()
                print(f"   Fixed updated_at for patient {patient_id}")
            
            # Fix created_at if it's a float
            if isinstance(patient.get("created_at"), (int, float)):
                # Convert float timestamp to ISO string
                timestamp = patient["created_at"]
                if timestamp > 1e10:  # Unix timestamp in seconds
                    dt = datetime.fromtimestamp(timestamp)
                else:  # Unix timestamp in milliseconds
                    dt = datetime.fromtimestamp(timestamp / 1000)
                updates["created_at"] = dt.isoformat()
                print(f"   Fixed created_at for patient {patient_id}")
            
            # Fix merged_at if it's a float
            if isinstance(patient.get("merged_at"), (int, float)):
                # Convert float timestamp to ISO string
                timestamp = patient["merged_at"]
                if timestamp > 1e10:  # Unix timestamp in seconds
                    dt = datetime.fromtimestamp(timestamp)
                else:  # Unix timestamp in milliseconds
                    dt = datetime.fromtimestamp(timestamp / 1000)
                updates["merged_at"] = dt.isoformat()
                print(f"   Fixed merged_at for patient {patient_id}")
            
            # Update the patient if there are fixes needed
            if updates:
                await db.patients.update_one(
                    {"_id": patient_id},
                    {"$set": updates}
                )
                fixed_count += 1
        
        print(f"\n✅ Fixed timestamps for {fixed_count} patients")
        
        # Verify the fix
        remaining_float_timestamps = await db.patients.find({
            "$or": [
                {"updated_at": {"$type": "double"}},
                {"created_at": {"$type": "double"}},
                {"merged_at": {"$type": "double"}}
            ]
        }).to_list(length=None)
        
        if remaining_float_timestamps:
            print(f"⚠️  Still have {len(remaining_float_timestamps)} patients with float timestamps")
        else:
            print("✅ All timestamp issues resolved!")
        
    except Exception as e:
        print(f"❌ Error fixing timestamps: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_patient_timestamps())

