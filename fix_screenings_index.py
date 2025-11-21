#!/usr/bin/env python3
"""
Fix the duplicate key constraint issue in screenings collection
"""
import asyncio
import sys
import os
sys.path.append('/app')

from app.core.database import get_database
from bson import ObjectId

async def fix_screenings_index():
    try:
        db_client = get_database()
        db = db_client.evep
        
        # Check current indexes
        indexes = await db.screenings.index_information()
        print("Current indexes in screenings collection:")
        for name, info in indexes.items():
            print(f"  {name}: {info}")
        
        # Check if there's a unique index on patient_id
        patient_id_index = None
        for name, info in indexes.items():
            if 'patient_id' in str(info.get('key', [])):
                print(f"\nFound patient_id index: {name}")
                print(f"  Key: {info.get('key')}")
                print(f"  Unique: {info.get('unique', False)}")
                if info.get('unique'):
                    patient_id_index = name
        
        # If there's a unique index on patient_id, drop it
        if patient_id_index and patient_id_index != '_id_':
            print(f"\nDropping unique index on patient_id: {patient_id_index}")
            await db.screenings.drop_index(patient_id_index)
            print("✅ Unique index on patient_id dropped successfully")
        
        # Check for existing sessions for this patient
        patient_id = ObjectId('691fd2a347bc19fb3444060d')
        existing_sessions = await db.screenings.find({"patient_id": patient_id}).to_list(None)
        print(f"\nExisting sessions for patient {patient_id}:")
        for session in existing_sessions:
            print(f"  Session ID: {session.get('_id')}")
            print(f"  Status: {session.get('status')}")
            print(f"  Created: {session.get('created_at')}")
            print("---")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_screenings_index())