#!/usr/bin/env python3
"""
Test script to check database access patterns
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb://mongo-primary:27017"

async def test_database_access():
    """Test different database access patterns"""
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    
    print("🔍 Testing Database Access Patterns")
    print("=" * 40)
    
    # Test 1: Direct database access
    db = client.evep
    print(f"\n1. Direct database access:")
    print(f"   Database name: {db.name}")
    
    # Test 2: Access school_screenings collection directly
    print(f"\n2. Accessing school_screenings collection directly:")
    count = await db.school_screenings.count_documents({})
    print(f"   Documents in school_screenings: {count}")
    
    # Test 3: Access through evep database
    print(f"\n3. Accessing through evep database:")
    evep_db = client.evep
    print(f"   Evep database name: {evep_db.name}")
    
    try:
        count = await evep_db.school_screenings.count_documents({})
        print(f"   Documents in evep.school_screenings: {count}")
    except Exception as e:
        print(f"   Error accessing evep.school_screenings: {e}")
    
    # Test 4: List all databases
    print(f"\n4. All databases:")
    databases = await client.list_database_names()
    print(f"   Databases: {databases}")
    
    # Test 5: Check if evep database exists
    if 'evep' in databases:
        print(f"   ✅ Evep database exists")
        evep_db = client.evep
        collections = await evep_db.list_collection_names()
        print(f"   Collections in evep: {collections}")
    else:
        print(f"   ❌ Evep database does not exist")
    
    # Test 6: Check evep database collections
    print(f"\n5. Evep database collections:")
    collections = await db.list_collection_names()
    print(f"   Collections: {collections}")
    
    # Test 7: Check if school_screenings exists in evep database
    if 'school_screenings' in collections:
        print(f"   ✅ school_screenings exists in evep database")
        sample = await db.school_screenings.find_one({})
        if sample:
            print(f"   Sample document keys: {list(sample.keys())}")
    else:
        print(f"   ❌ school_screenings does not exist in evep database")
    
    client.close()
    print(f"\n✅ Test completed")

if __name__ == "__main__":
    asyncio.run(test_database_access())
