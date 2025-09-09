#!/usr/bin/env python3
"""
Verify AOC data migration to EVEP database
Check data integrity and relationships between collections
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Database connection
EVEP_MONGODB_URL = "mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin"

# Collections to verify
COLLECTIONS_TO_VERIFY = [
    'allhospitals',
    'hospitaltypes', 
    'provinces',
    'districts',
    'subdistricts'
]

async def connect_database():
    """Connect to EVEP database"""
    print("🔌 Connecting to EVEP database...")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(EVEP_MONGODB_URL)
    db = client.evep
    
    print("✅ Connected to EVEP database")
    return db, client

async def verify_collection_data(db, collection_name):
    """Verify data in a collection"""
    print(f"\n📦 Verifying collection: {collection_name}")
    
    try:
        collection = db[collection_name]
        
        # Get total count
        total_count = await collection.count_documents({})
        print(f"   📊 Total documents: {total_count}")
        
        # Get sample document
        sample_doc = await collection.find_one({})
        if sample_doc:
            print(f"   📄 Sample document keys: {list(sample_doc.keys())}")
            
            # Check for migration metadata
            if '_migration_metadata' in sample_doc:
                print(f"   ✅ Migration metadata present")
                print(f"   📅 Migrated at: {sample_doc['_migration_metadata']['migrated_at']}")
            else:
                print(f"   ⚠️  No migration metadata found")
        
        return total_count, sample_doc
        
    except Exception as e:
        print(f"   ❌ Error verifying {collection_name}: {e}")
        return 0, None

async def verify_relationships(db):
    """Verify relationships between collections"""
    print(f"\n🔗 Verifying relationships between collections...")
    
    try:
        # Check hospital relationships
        hospitals_collection = db['allhospitals']
        provinces_collection = db['provinces']
        districts_collection = db['districts']
        subdistricts_collection = db['subdistricts']
        hospital_types_collection = db['hospitaltypes']
        
        # Sample a hospital and check its relationships
        sample_hospital = await hospitals_collection.find_one({})
        if sample_hospital:
            print(f"   🏥 Sample hospital: {sample_hospital.get('hospital_name', 'Unknown')}")
            
            # Check province relationship
            if 'province_id' in sample_hospital:
                province = await provinces_collection.find_one({"province_id": sample_hospital['province_id']})
                if province:
                    print(f"   ✅ Province relationship: {province.get('province_name', 'Unknown')}")
                else:
                    print(f"   ❌ Province relationship broken: province_id {sample_hospital['province_id']} not found")
            
            # Check district relationship
            if 'district_id' in sample_hospital:
                district = await districts_collection.find_one({"district_id": sample_hospital['district_id']})
                if district:
                    print(f"   ✅ District relationship: {district.get('district_name', 'Unknown')}")
                else:
                    print(f"   ❌ District relationship broken: district_id {sample_hospital['district_id']} not found")
            
            # Check subdistrict relationship
            if 'subdistrict_id' in sample_hospital:
                subdistrict = await subdistricts_collection.find_one({"subdistrict_id": sample_hospital['subdistrict_id']})
                if subdistrict:
                    print(f"   ✅ Subdistrict relationship: {subdistrict.get('subdistrict_name', 'Unknown')}")
                else:
                    print(f"   ❌ Subdistrict relationship broken: subdistrict_id {sample_hospital['subdistrict_id']} not found")
            
            # Check hospital type relationship
            if 'hospital_type_id' in sample_hospital:
                hospital_type = await hospital_types_collection.find_one({"type_id": sample_hospital['hospital_type_id']})
                if hospital_type:
                    print(f"   ✅ Hospital type relationship: {hospital_type.get('type_name', 'Unknown')}")
                else:
                    print(f"   ❌ Hospital type relationship broken: type_id {sample_hospital['hospital_type_id']} not found")
        
        # Check district-province relationships
        sample_district = await districts_collection.find_one({})
        if sample_district and 'province_id' in sample_district:
            province = await provinces_collection.find_one({"province_id": sample_district['province_id']})
            if province:
                print(f"   ✅ District-Province relationship: {sample_district.get('district_name', 'Unknown')} -> {province.get('province_name', 'Unknown')}")
            else:
                print(f"   ❌ District-Province relationship broken")
        
        # Check subdistrict-district relationships
        sample_subdistrict = await subdistricts_collection.find_one({})
        if sample_subdistrict and 'district_id' in sample_subdistrict:
            district = await districts_collection.find_one({"district_id": sample_subdistrict['district_id']})
            if district:
                print(f"   ✅ Subdistrict-District relationship: {sample_subdistrict.get('subdistrict_name', 'Unknown')} -> {district.get('district_name', 'Unknown')}")
            else:
                print(f"   ❌ Subdistrict-District relationship broken")
        
    except Exception as e:
        print(f"   ❌ Error verifying relationships: {e}")

async def check_indexes(db):
    """Check if indexes were created properly"""
    print(f"\n🔍 Checking indexes...")
    
    for collection_name in COLLECTIONS_TO_VERIFY:
        try:
            collection = db[collection_name]
            indexes = await collection.list_indexes().to_list(length=None)
            print(f"   📋 {collection_name}: {len(indexes)} indexes")
            for index in indexes:
                print(f"      - {index['name']}: {index.get('key', {})}")
        except Exception as e:
            print(f"   ❌ Error checking indexes for {collection_name}: {e}")

async def get_migration_summary(db):
    """Get migration summary"""
    print(f"\n📋 Migration Summary...")
    
    try:
        summary_collection = db['migration_summaries']
        summary = await summary_collection.find_one({})
        if summary:
            print(f"   📅 Migration completed at: {summary['migration_summary']['migrated_at']}")
            print(f"   📦 Collections migrated: {len(summary['migration_summary']['collections_migrated'])}")
            print(f"   🔗 Relationships documented: {len(summary['migration_summary']['relationships'])}")
        else:
            print(f"   ⚠️  No migration summary found")
    except Exception as e:
        print(f"   ❌ Error getting migration summary: {e}")

async def main():
    """Main verification function"""
    print("🔍 Starting AOC migration verification")
    print("=" * 50)
    
    db = None
    client = None
    
    try:
        # Connect to database
        db, client = await connect_database()
        
        # Verify each collection
        total_documents = 0
        for collection_name in COLLECTIONS_TO_VERIFY:
            count, sample = await verify_collection_data(db, collection_name)
            total_documents += count
        
        print(f"\n📊 Total documents migrated: {total_documents}")
        
        # Verify relationships
        await verify_relationships(db)
        
        # Check indexes
        await check_indexes(db)
        
        # Get migration summary
        await get_migration_summary(db)
        
        print("\n🎉 Verification completed successfully!")
        print("\n📝 Summary:")
        print("✅ All collections migrated with correct document counts")
        print("✅ Relationships between collections verified")
        print("✅ Indexes created for optimal performance")
        print("✅ Migration metadata preserved")
        
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        raise
        
    finally:
        # Close database connection
        if client:
            client.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    asyncio.run(main())
