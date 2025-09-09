#!/usr/bin/env python3
"""
Migrate AOC data to EVEP database
Connects to external AOC MongoDB and duplicates specified collections with relationships
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Database connections
AOC_MONGODB_URL = "mongodb://aoc:wzsGL2aPhY3TRXTz@coruscant.aocopt.com:27017/aoc"
EVEP_MONGODB_URL = "mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin"  # Using local MongoDB with auth

# Collections to migrate
COLLECTIONS_TO_MIGRATE = [
    'allhospitals',
    'hospitaltypes', 
    'provinces',
    'districts',
    'subdistricts'
]

async def connect_databases():
    """Connect to both AOC and EVEP databases"""
    print("🔌 Connecting to databases...")
    
    # Connect to AOC database
    aoc_client = motor.motor_asyncio.AsyncIOMotorClient(AOC_MONGODB_URL)
    aoc_db = aoc_client.aoc
    
    # Connect to EVEP database
    evep_client = motor.motor_asyncio.AsyncIOMotorClient(EVEP_MONGODB_URL)
    evep_db = evep_client.evep
    
    print("✅ Connected to both databases")
    return aoc_db, evep_db, aoc_client, evep_client

async def get_collection_stats(db, collection_name):
    """Get collection statistics"""
    try:
        collection = db[collection_name]
        count = await collection.count_documents({})
        return count
    except Exception as e:
        print(f"❌ Error getting stats for {collection_name}: {e}")
        return 0

async def migrate_collection(aoc_db, evep_db, collection_name):
    """Migrate a single collection with relationship preservation"""
    print(f"\n📦 Migrating collection: {collection_name}")
    
    try:
        # Get source collection
        source_collection = aoc_db[collection_name]
        target_collection = evep_db[collection_name]
        
        # Get document count
        total_docs = await source_collection.count_documents({})
        print(f"   📊 Found {total_docs} documents")
        
        if total_docs == 0:
            print(f"   ⚠️  No documents found in {collection_name}")
            return
        
        # Clear existing data in target collection
        await target_collection.delete_many({})
        print(f"   🗑️  Cleared existing data in {collection_name}")
        
        # Add migration metadata
        migration_metadata = {
            "migrated_from": "aoc",
            "migrated_at": datetime.utcnow().isoformat(),
            "source_collection": collection_name,
            "total_documents": total_docs
        }
        
        # Migrate documents in batches
        batch_size = 100
        migrated_count = 0
        
        async for document in source_collection.find({}):
            # Add migration metadata to each document
            document['_migration_metadata'] = migration_metadata
            document['_created_at'] = datetime.utcnow().isoformat()
            document['_updated_at'] = datetime.utcnow().isoformat()
            
            # Insert document
            await target_collection.insert_one(document)
            migrated_count += 1
            
            if migrated_count % batch_size == 0:
                print(f"   📝 Migrated {migrated_count}/{total_docs} documents...")
        
        print(f"   ✅ Successfully migrated {migrated_count} documents to {collection_name}")
        
        # Create indexes for better performance
        await create_indexes(target_collection, collection_name)
        
    except Exception as e:
        print(f"   ❌ Error migrating {collection_name}: {e}")
        raise

async def create_indexes(collection, collection_name):
    """Create appropriate indexes for each collection"""
    try:
        if collection_name == 'allhospitals':
            # Create indexes for hospitals
            await collection.create_index("hospital_id")
            await collection.create_index("hospital_name")
            await collection.create_index("province_id")
            await collection.create_index("district_id")
            await collection.create_index("subdistrict_id")
            await collection.create_index("hospital_type_id")
            print(f"   🔍 Created indexes for {collection_name}")
            
        elif collection_name == 'hospitaltypes':
            # Create indexes for hospital types
            await collection.create_index("type_id")
            await collection.create_index("type_name")
            print(f"   🔍 Created indexes for {collection_name}")
            
        elif collection_name == 'provinces':
            # Create indexes for provinces
            await collection.create_index("province_id")
            await collection.create_index("province_name")
            print(f"   🔍 Created indexes for {collection_name}")
            
        elif collection_name == 'districts':
            # Create indexes for districts
            await collection.create_index("district_id")
            await collection.create_index("district_name")
            await collection.create_index("province_id")
            print(f"   🔍 Created indexes for {collection_name}")
            
        elif collection_name == 'subdistricts':
            # Create indexes for subdistricts
            await collection.create_index("subdistrict_id")
            await collection.create_index("subdistrict_name")
            await collection.create_index("district_id")
            await collection.create_index("province_id")
            print(f"   🔍 Created indexes for {collection_name}")
            
    except Exception as e:
        print(f"   ⚠️  Warning: Could not create indexes for {collection_name}: {e}")

async def verify_migration(aoc_db, evep_db):
    """Verify the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    for collection_name in COLLECTIONS_TO_MIGRATE:
        try:
            aoc_count = await get_collection_stats(aoc_db, collection_name)
            evep_count = await get_collection_stats(evep_db, collection_name)
            
            if aoc_count == evep_count:
                print(f"   ✅ {collection_name}: {evep_count} documents (matches source)")
            else:
                print(f"   ⚠️  {collection_name}: {evep_count} documents (source had {aoc_count})")
                
        except Exception as e:
            print(f"   ❌ Error verifying {collection_name}: {e}")

async def create_relationship_summary(evep_db):
    """Create a summary of relationships between collections"""
    print("\n📋 Creating relationship summary...")
    
    try:
        # Get sample documents to understand relationships
        hospitals = await evep_db.allhospitals.find_one({})
        provinces = await evep_db.provinces.find_one({})
        districts = await evep_db.districts.find_one({})
        subdistricts = await evep_db.subdistricts.find_one({})
        hospital_types = await evep_db.hospitaltypes.find_one({})
        
        summary = {
            "migration_summary": {
                "migrated_at": datetime.utcnow().isoformat(),
                "source_database": "aoc",
                "target_database": "evep",
                "collections_migrated": COLLECTIONS_TO_MIGRATE,
                "relationships": {
                    "hospitals": {
                        "references": ["province_id", "district_id", "subdistrict_id", "hospital_type_id"],
                        "description": "Hospitals reference provinces, districts, subdistricts, and hospital types"
                    },
                    "districts": {
                        "references": ["province_id"],
                        "description": "Districts reference provinces"
                    },
                    "subdistricts": {
                        "references": ["district_id", "province_id"],
                        "description": "Subdistricts reference districts and provinces"
                    }
                }
            }
        }
        
        # Save summary to database
        await evep_db.migration_summaries.insert_one(summary)
        print("   ✅ Relationship summary saved")
        
    except Exception as e:
        print(f"   ⚠️  Warning: Could not create relationship summary: {e}")

async def main():
    """Main migration function"""
    print("🚀 Starting AOC to EVEP data migration")
    print("=" * 50)
    
    aoc_db = None
    evep_db = None
    aoc_client = None
    evep_client = None
    
    try:
        # Connect to databases
        aoc_db, evep_db, aoc_client, evep_client = await connect_databases()
        
        # Show source collection stats
        print("\n📊 Source collection statistics:")
        for collection_name in COLLECTIONS_TO_MIGRATE:
            count = await get_collection_stats(aoc_db, collection_name)
            print(f"   {collection_name}: {count} documents")
        
        # Migrate each collection
        for collection_name in COLLECTIONS_TO_MIGRATE:
            await migrate_collection(aoc_db, evep_db, collection_name)
        
        # Verify migration
        await verify_migration(aoc_db, evep_db)
        
        # Create relationship summary
        await create_relationship_summary(evep_db)
        
        print("\n🎉 Migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Verify data integrity in EVEP database")
        print("2. Test relationships between collections")
        print("3. Update application code to use new collections")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
        
    finally:
        # Close database connections
        if aoc_client:
            aoc_client.close()
        if evep_client:
            evep_client.close()
        print("\n🔌 Database connections closed")

if __name__ == "__main__":
    asyncio.run(main())
