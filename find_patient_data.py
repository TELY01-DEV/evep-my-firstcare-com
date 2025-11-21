#!/usr/bin/env python3
"""
Find patient data for specific patient ID
"""

import asyncio
import motor.motor_asyncio
import os

# MongoDB connection for server
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def find_patient_data():
    """Find patient data for specific patient ID"""
    patient_id = "691fb10cbe928e5f18289368"
    
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print(f"🔍 Searching for patient ID: {patient_id}")
        
        # List all collections
        collections = await db.list_collection_names()
        print(f"\n📚 Available collections: {collections}")
        
        # Search in different collections
        collections_to_search = ['patients', 'evep_students', 'evep_teachers', 'screening_sessions', 'students']
        
        for collection_name in collections_to_search:
            if collection_name in collections:
                print(f"\n🔍 Searching in {collection_name}...")
                
                # Search by _id
                result = await db[collection_name].find_one({"_id": patient_id})
                if result:
                    print(f"✅ Found in {collection_name} by _id:")
                    print(f"   Name: {result.get('first_name', 'N/A')} {result.get('last_name', 'N/A')}")
                    print(f"   Data: {result}")
                    continue
                
                # Search by patient_id field
                result = await db[collection_name].find_one({"patient_id": patient_id})
                if result:
                    print(f"✅ Found in {collection_name} by patient_id:")
                    print(f"   Name: {result.get('first_name', 'N/A')} {result.get('last_name', 'N/A')}")
                    print(f"   Data: {result}")
                    continue
                
                print(f"❌ Not found in {collection_name}")
        
        # Check screening sessions that reference this patient
        print(f"\n🔍 Checking screening sessions for patient {patient_id}...")
        sessions = await db.screening_sessions.find({"patient_id": patient_id}).to_list(length=10)
        print(f"📊 Found {len(sessions)} screening sessions for this patient")
        
        if sessions:
            for i, session in enumerate(sessions):
                print(f"\n📋 Session {i+1}:")
                print(f"   Session ID: {session.get('_id')}")
                print(f"   Patient Name: {session.get('patient_name')}")
                print(f"   Session Type: {session.get('session_type')}")
                print(f"   Status: {session.get('status')}")
                
        await client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(find_patient_data())