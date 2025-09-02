#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict
from bson import ObjectId

async def cleanup_duplicate_patients():
    """Clean up duplicate patients by merging or marking them"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🧹 Cleaning up duplicate patients...")
        
        # Get all patients
        patients = await db.patients.find({}).to_list(length=None)
        
        # Group by name
        patients_by_name = defaultdict(list)
        for patient in patients:
            full_name = f"{patient.get('first_name', '').strip()} {patient.get('last_name', '').strip()}".strip()
            if full_name:
                patients_by_name[full_name].append(patient)
        
        # Find duplicates
        duplicates = {name: patients_list for name, patients_list in patients_by_name.items() if len(patients_list) > 1}
        
        if not duplicates:
            print("✅ No duplicates found to clean up!")
            return
        
        print(f"\n📊 Found {len(duplicates)} groups of duplicates:")
        
        for name, patients_list in duplicates.items():
            print(f"\n🔍 Processing: {name}")
            print(f"   Found {len(patients_list)} records")
            
            # Sort by creation date (keep the oldest as primary)
            patients_list.sort(key=lambda x: x.get('created_at', ''))
            
            # Keep the first (oldest) record as primary
            primary_patient = patients_list[0]
            duplicate_patients = patients_list[1:]
            
            print(f"   Primary patient ID: {primary_patient['_id']}")
            print(f"   Duplicate patient IDs: {[p['_id'] for p in duplicate_patients]}")
            
            # Merge data from duplicates into primary
            merged_data = {}
            
            for duplicate in duplicate_patients:
                # Merge screening history
                if duplicate.get('screening_history'):
                    if not merged_data.get('screening_history'):
                        merged_data['screening_history'] = []
                    merged_data['screening_history'].extend(duplicate['screening_history'])
                
                # Merge documents
                if duplicate.get('documents'):
                    if not merged_data.get('documents'):
                        merged_data['documents'] = []
                    merged_data['documents'].extend(duplicate['documents'])
                
                # Merge medical history (if different)
                if duplicate.get('medical_history') and duplicate['medical_history'] != primary_patient.get('medical_history'):
                    if not merged_data.get('medical_history'):
                        merged_data['medical_history'] = primary_patient.get('medical_history', {})
                    merged_data['medical_history'].update(duplicate['medical_history'])
                
                # Merge family vision history (if different)
                if duplicate.get('family_vision_history') and duplicate['family_vision_history'] != primary_patient.get('family_vision_history'):
                    if not merged_data.get('family_vision_history'):
                        merged_data['family_vision_history'] = primary_patient.get('family_vision_history', {})
                    merged_data['family_vision_history'].update(duplicate['family_vision_history'])
                
                # Merge insurance info (if different)
                if duplicate.get('insurance_info') and duplicate['insurance_info'] != primary_patient.get('insurance_info'):
                    if not merged_data.get('insurance_info'):
                        merged_data['insurance_info'] = primary_patient.get('insurance_info', {})
                    merged_data['insurance_info'].update(duplicate['insurance_info'])
                
                # Merge consent forms (if different)
                if duplicate.get('consent_forms') and duplicate['consent_forms'] != primary_patient.get('consent_forms'):
                    if not merged_data.get('consent_forms'):
                        merged_data['consent_forms'] = primary_patient.get('consent_forms', {})
                    merged_data['consent_forms'].update(duplicate['consent_forms'])
            
            # Update primary patient with merged data
            if merged_data:
                merged_data['updated_at'] = asyncio.get_event_loop().time()
                await db.patients.update_one(
                    {"_id": primary_patient["_id"]},
                    {"$set": merged_data}
                )
                print(f"   ✅ Merged data into primary patient")
            
            # Mark duplicates as inactive and add reference to primary
            for duplicate in duplicate_patients:
                await db.patients.update_one(
                    {"_id": duplicate["_id"]},
                    {
                        "$set": {
                            "is_active": False,
                            "merged_into": str(primary_patient["_id"]),
                            "merge_reason": "Duplicate name - merged into primary record",
                            "merged_at": asyncio.get_event_loop().time()
                        }
                    }
                )
                print(f"   ✅ Marked duplicate {duplicate['_id']} as inactive")
        
        # Verify cleanup
        print(f"\n🔍 Verifying cleanup...")
        remaining_patients = await db.patients.find({"is_active": True}).to_list(length=None)
        inactive_patients = await db.patients.find({"is_active": False}).to_list(length=None)
        
        print(f"   Active patients: {len(remaining_patients)}")
        print(f"   Inactive patients: {len(inactive_patients)}")
        
        # Check for remaining duplicates
        remaining_by_name = defaultdict(list)
        for patient in remaining_patients:
            full_name = f"{patient.get('first_name', '').strip()} {patient.get('last_name', '').strip()}".strip()
            if full_name:
                remaining_by_name[full_name].append(patient)
        
        remaining_duplicates = {name: patients_list for name, patients_list in remaining_by_name.items() if len(patients_list) > 1}
        
        if remaining_duplicates:
            print(f"   ⚠️  Still have {len(remaining_duplicates)} groups of active duplicates")
            for name, patients_list in remaining_duplicates.items():
                print(f"     - {name}: {len(patients_list)} records")
        else:
            print(f"   ✅ No remaining active duplicates!")
        
        print(f"\n✅ Cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_duplicate_patients())

