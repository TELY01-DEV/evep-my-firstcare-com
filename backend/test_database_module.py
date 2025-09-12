#!/usr/bin/env python3
"""
Test script for EVEP Platform Database Module
This script tests the database module functionality
"""

import sys
import os
import asyncio

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_database_service():
    """Test the database service"""
    print("🧪 Testing Database Service")
    print("=" * 50)
    
    try:
        from app.modules.database.services.database_service import DatabaseService
        
        print("✅ DatabaseService imported successfully")
        
        # Initialize service
        db_service = DatabaseService()
        await db_service.initialize()
        
        # Test status
        status = await db_service.get_status()
        print(f"📊 Database status: {status['status']}")
        print(f"🗄️ Database name: {status['database_name']}")
        print(f"📁 Collections count: {status['collections_count']}")
        print(f"📄 Total documents: {status['total_documents']}")
        
        # Test backup creation
        backup_info = await db_service.create_backup()
        print(f"💾 Backup created: {backup_info['backup_id']}")
        print(f"📦 Backup size: {backup_info['size_mb']} MB")
        
        # Test backup listing
        backups = await db_service.get_backups()
        print(f"📋 Available backups: {len(backups)}")
        
        # Test collection info
        collection_info = await db_service.get_collection_info("users")
        if collection_info:
            print(f"📁 Users collection: {collection_info['document_count']} documents")
        
        print("\n✅ All database service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database service test failed: {e}")
        return False

async def test_collection_service():
    """Test the collection service"""
    print("\n🧪 Testing Collection Service")
    print("=" * 50)
    
    try:
        from app.modules.database.services.collection_service import CollectionService
        
        print("✅ CollectionService imported successfully")
        
        # Initialize service
        collection_service = CollectionService()
        await collection_service.initialize()
        
        # Test get all collections
        collections = await collection_service.get_all_collections()
        print(f"📁 Total collections: {len(collections)}")
        
        for collection in collections:
            print(f"  - {collection['name']}: {collection['description']}")
        
        # Test collection stats
        stats = await collection_service.get_collection_stats("users")
        print(f"📊 Users collection stats: {stats['document_count']} documents")
        
        # Test validation
        test_document = {
            "email": "test@evep.com",
            "name": "Test User",
            "role": "doctor"
        }
        validation = await collection_service.validate_document("users", test_document)
        print(f"✅ Document validation: {'Valid' if validation['is_valid'] else 'Invalid'}")
        
        # Test indexes
        indexes = await collection_service.get_collection_indexes("users")
        print(f"🔍 Users collection indexes: {len(indexes)} indexes")
        
        print("\n✅ All collection service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Collection service test failed: {e}")
        return False

async def test_migration_service():
    """Test the migration service"""
    print("\n🧪 Testing Migration Service")
    print("=" * 50)
    
    try:
        from app.modules.database.services.migration_service import MigrationService
        
        print("✅ MigrationService imported successfully")
        
        # Initialize service
        migration_service = MigrationService()
        await migration_service.initialize()
        
        # Test get migrations
        migrations = await migration_service.get_migrations()
        print(f"📋 Total migrations: {len(migrations)}")
        
        # Test get applied migrations
        applied = await migration_service.get_applied_migrations()
        print(f"✅ Applied migrations: {len(applied)}")
        
        # Test get pending migrations
        pending = await migration_service.get_pending_migrations()
        print(f"⏳ Pending migrations: {len(pending)}")
        
        for migration in pending:
            print(f"  - {migration['id']}: {migration['description']}")
        
        # Test migration status
        status = await migration_service.get_migration_status()
        print(f"📊 Migration status:")
        print(f"  - Current version: {status['current_version']}")
        print(f"  - Latest version: {status['latest_version']}")
        print(f"  - Applied: {status['applied_migrations']}")
        print(f"  - Pending: {status['pending_migrations']}")
        
        # Test run migrations (if any pending)
        if pending:
            print("\n🔄 Running pending migrations...")
            results = await migration_service.run_migrations()
            print(f"✅ Migrations applied: {results['migrations_applied']}")
            print(f"❌ Migrations failed: {results['migrations_failed']}")
        
        print("\n✅ All migration service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Migration service test failed: {e}")
        return False

async def test_database_module():
    """Test the database module"""
    print("\n🧪 Testing Database Module")
    print("=" * 50)
    
    try:
        from app.modules.database.database_module import DatabaseModule
        
        print("✅ DatabaseModule imported successfully")
        
        # Initialize module
        db_module = DatabaseModule()
        await db_module.initialize()
        
        # Test module info
        print(f"📦 Module name: {db_module.name}")
        print(f"📋 Module version: {db_module.version}")
        print(f"📝 Module description: {db_module.description}")
        
        # Test events
        events = db_module.get_events()
        print(f"📡 Module events: {events}")
        
        # Test router
        router = db_module.get_router()
        print(f"🌐 Module router: {len(router.routes)} routes")
        
        print("\n✅ All database module tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database module test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 EVEP Platform Database Module Test")
    print("=" * 60)
    
    # Run tests
    db_service_test = await test_database_service()
    collection_service_test = await test_collection_service()
    migration_service_test = await test_migration_service()
    db_module_test = await test_database_module()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Database Service: {'✅ PASS' if db_service_test else '❌ FAIL'}")
    print(f"   Collection Service: {'✅ PASS' if collection_service_test else '❌ FAIL'}")
    print(f"   Migration Service: {'✅ PASS' if migration_service_test else '❌ FAIL'}")
    print(f"   Database Module: {'✅ PASS' if db_module_test else '❌ FAIL'}")
    
    if all([db_service_test, collection_service_test, migration_service_test, db_module_test]):
        print("\n🎉 All tests passed! Database module is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)



