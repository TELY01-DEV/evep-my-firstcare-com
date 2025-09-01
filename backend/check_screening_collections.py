#!/usr/bin/env python3
"""
Check all screening-related collections in the database
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb://mongo-primary:27017"
DB_NAME = "evep"

async def check_screening_collections():
    """Check all screening-related collections"""
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("🔍 Checking Screening Collections")
    print("=" * 40)
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"All collections: {collections}")
    
    # Check screening-related collections
    screening_collections = [
        'school_screenings',
        'screenings',
        'vision_screenings',
        'medical_screenings',
        'evep.school_screenings',
        'evep.screenings'
    ]
    
    for collection_name in screening_collections:
        if collection_name in collections:
            print(f"\n📊 Collection: {collection_name}")
            count = await db[collection_name].count_documents({})
            print(f"   Documents: {count}")
            
            if count > 0:
                # Get a sample document
                sample = await db[collection_name].find_one({})
                print(f"   Sample document keys: {list(sample.keys())}")
                
                # Check for screening_id field
                if 'screening_id' in sample:
                    print(f"   Has screening_id: ✅")
                else:
                    print(f"   Has screening_id: ❌")
    
    # Check if there are any documents with 'screening' in the name
    print(f"\n🔍 Searching for documents with 'screening' in any field...")
    
    for collection_name in collections:
        count = await db[collection_name].count_documents({
            "$or": [
                {"screening_id": {"$exists": True}},
                {"screening_type": {"$exists": True}},
                {"type": {"$regex": "screening", "$options": "i"}}
            ]
        })
        
        if count > 0:
            print(f"   Collection {collection_name}: {count} documents with screening data")
    
    client.close()
    print(f"\n✅ Check completed")

if __name__ == "__main__":
    asyncio.run(check_screening_collections())
