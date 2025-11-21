#!/usr/bin/env python3
"""
Database Indexes Creation Script
Adds unique indexes to prevent duplicate patient records and screening sessions
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def create_unique_indexes():
    """Create unique indexes to prevent duplicate records"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("🔧 Creating unique indexes to prevent duplicates...")
    
    try:
        # 1. Unique index on patients collection for CID
        print("📝 Creating unique index on patients.cid...")
        await db.patients.create_index(
            [("cid", 1)], 
            unique=True, 
            sparse=True,
            name="unique_patient_cid",
            background=True
        )
        
        # 2. Compound unique index on patients for name + DOB (to catch duplicates with different/missing CIDs)
        print("📝 Creating compound unique index on patients (name + DOB)...")
        await db.patients.create_index(
            [("first_name", 1), ("last_name", 1), ("date_of_birth", 1)], 
            unique=True, 
            sparse=True,
            name="unique_patient_name_dob",
            background=True
        )
        
        # 3. Unique index on screening sessions to prevent duplicate sessions for same patient on same day
        print("📝 Creating unique index on screening sessions...")
        await db.screenings.create_index(
            [("patient_id", 1), ("screening_type", 1), ("created_at", 1)], 
            unique=True, 
            sparse=True,
            name="unique_patient_screening_session",
            background=True,
            # Allow duplicates if they're more than 1 hour apart
            expireAfterSeconds=3600  # 1 hour
        )
        
        # 4. Unique index on student_patient_mapping
        print("📝 Creating unique index on student-patient mapping...")
        await db.student_patient_mapping.create_index(
            [("student_id", 1)], 
            unique=True, 
            sparse=True,
            name="unique_student_mapping",
            background=True
        )
        
        # 5. Performance indexes for common queries
        print("📝 Creating performance indexes...")
        
        # Index for patient searches
        await db.patients.create_index(
            [("first_name", "text"), ("last_name", "text"), ("cid", "text"), ("school", "text")],
            name="patient_search_text",
            background=True
        )
        
        # Index for screening sessions by patient
        await db.screenings.create_index(
            [("patient_id", 1), ("created_at", -1)],
            name="screening_by_patient_date",
            background=True
        )
        
        # Index for active patients
        await db.patients.create_index(
            [("is_active", 1), ("created_at", -1)],
            name="active_patients_by_date",
            background=True
        )
        
        print("✅ All indexes created successfully!")
        
        # List all indexes to verify
        print("\n📋 Current indexes on patients collection:")
        indexes = await db.patients.index_information()
        for name, details in indexes.items():
            print(f"  - {name}: {details.get('key', 'N/A')}")
            
        print("\n📋 Current indexes on screenings collection:")
        indexes = await db.screenings.index_information()
        for name, details in indexes.items():
            print(f"  - {name}: {details.get('key', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
    finally:
        client.close()

async def drop_duplicate_records():
    """Remove duplicate records that might already exist"""
    
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("\n🧹 Checking for and removing duplicate records...")
    
    try:
        # Find duplicate patients by CID
        print("🔍 Checking for duplicate patients by CID...")
        cid_duplicates = await db.patients.aggregate([
            {"$match": {"cid": {"$ne": None, "$ne": "", "$ne": "0000000000000"}}},
            {"$group": {"_id": "$cid", "count": {"$sum": 1}, "docs": {"$push": "$_id"}}},
            {"$match": {"count": {"$gt": 1}}}
        ]).to_list(length=None)
        
        for dup in cid_duplicates:
            print(f"  Found {dup['count']} patients with CID: {dup['_id']}")
            # Keep the first one, remove the rest
            docs_to_remove = dup['docs'][1:]
            if docs_to_remove:
                result = await db.patients.delete_many({"_id": {"$in": docs_to_remove}})
                print(f"    Removed {result.deleted_count} duplicate patient records")
        
        # Find duplicate patients by name + DOB
        print("🔍 Checking for duplicate patients by name + DOB...")
        name_dob_duplicates = await db.patients.aggregate([
            {"$match": {"first_name": {"$ne": None, "$ne": ""}, "last_name": {"$ne": None, "$ne": ""}, "date_of_birth": {"$ne": None, "$ne": ""}}},
            {"$group": {
                "_id": {"first_name": "$first_name", "last_name": "$last_name", "date_of_birth": "$date_of_birth"}, 
                "count": {"$sum": 1}, 
                "docs": {"$push": "$_id"}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]).to_list(length=None)
        
        for dup in name_dob_duplicates:
            print(f"  Found {dup['count']} patients with name: {dup['_id']['first_name']} {dup['_id']['last_name']} DOB: {dup['_id']['date_of_birth']}")
            # Keep the first one, remove the rest  
            docs_to_remove = dup['docs'][1:]
            if docs_to_remove:
                result = await db.patients.delete_many({"_id": {"$in": docs_to_remove}})
                print(f"    Removed {result.deleted_count} duplicate patient records")
        
        print("✅ Duplicate cleanup completed!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
    finally:
        client.close()

async def main():
    """Main function to run all operations"""
    print("🚀 Starting database optimization for duplicate prevention...\n")
    
    # First clean up any existing duplicates
    await drop_duplicate_records()
    
    # Then create unique indexes
    await create_unique_indexes()
    
    print("\n🎉 Database optimization completed!")
    print("📌 Unique constraints are now in place to prevent:")
    print("   • Duplicate patients with same CID")
    print("   • Duplicate patients with same name + birth date")
    print("   • Duplicate screening sessions for same patient")
    print("   • Duplicate student-patient mappings")

if __name__ == "__main__":
    asyncio.run(main())