#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def optimize_performance():
    """Optimize database performance by adding indexes and checking system status"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🔍 Analyzing database performance...")
        
        # Check current indexes
        print("\n📊 Current Indexes:")
        
        collections = ['students', 'teachers', 'parents', 'schools', 'screenings']
        
        for collection_name in collections:
            indexes = await db[collection_name].list_indexes().to_list(length=None)
            print(f"\n   {collection_name.upper()}:")
            for idx in indexes:
                print(f"     - {idx['name']}: {idx['key']}")
        
        # Add missing indexes for better performance
        print("\n🔧 Adding performance indexes...")
        
        # Students indexes
        try:
            await db.students.create_index("status")
            print("✅ Added index on students.status")
        except Exception as e:
            print(f"⚠️ Index on students.status already exists or failed: {e}")
        
        try:
            await db.students.create_index("school_name")
            print("✅ Added index on students.school_name")
        except Exception as e:
            print(f"⚠️ Index on students.school_name already exists or failed: {e}")
        
        try:
            await db.students.create_index("teacher_id")
            print("✅ Added index on students.teacher_id")
        except Exception as e:
            print(f"⚠️ Index on students.teacher_id already exists or failed: {e}")
        
        # Teachers indexes
        try:
            await db.teachers.create_index("status")
            print("✅ Added index on teachers.status")
        except Exception as e:
            print(f"⚠️ Index on teachers.status already exists or failed: {e}")
        
        try:
            await db.teachers.create_index("school")
            print("✅ Added index on teachers.school")
        except Exception as e:
            print(f"⚠️ Index on teachers.school already exists or failed: {e}")
        
        # Parents indexes
        try:
            await db.parents.create_index("status")
            print("✅ Added index on parents.status")
        except Exception as e:
            print(f"⚠️ Index on parents.status already exists or failed: {e}")
        
        # Schools indexes
        try:
            await db.schools.create_index("status")
            print("✅ Added index on schools.status")
        except Exception as e:
            print(f"⚠️ Index on schools.status already exists or failed: {e}")
        
        # Screenings indexes
        try:
            await db.screenings.create_index("screening_category")
            print("✅ Added index on screenings.screening_category")
        except Exception as e:
            print(f"⚠️ Index on screenings.screening_category already exists or failed: {e}")
        
        try:
            await db.screenings.create_index("patient_id")
            print("✅ Added index on screenings.patient_id")
        except Exception as e:
            print(f"⚠️ Index on screenings.patient_id already exists or failed: {e}")
        
        # Check collection sizes
        print("\n📊 Collection Sizes:")
        for collection_name in collections:
            count = await db[collection_name].count_documents({})
            print(f"   {collection_name}: {count} documents")
        
        # Check database stats
        print("\n📊 Database Statistics:")
        stats = await db.command("dbStats")
        print(f"   Data Size: {stats['dataSize'] / 1024:.2f} KB")
        print(f"   Storage Size: {stats['storageSize'] / 1024:.2f} KB")
        print(f"   Index Size: {stats['indexSize'] / 1024:.2f} KB")
        print(f"   Total Size: {stats['storageSize'] / 1024:.2f} KB")
        
        # Performance recommendations
        print("\n💡 Performance Recommendations:")
        
        if stats['dataSize'] > 1024 * 1024:  # > 1MB
            print("   ⚠️ Consider implementing pagination for large datasets")
        
        if stats['indexSize'] > stats['dataSize'] * 0.5:
            print("   ⚠️ Index size is large relative to data size - review index usage")
        
        print("   ✅ Use pagination (skip/limit) for large result sets")
        print("   ✅ Add compound indexes for frequently used query combinations")
        print("   ✅ Consider caching frequently accessed data")
        print("   ✅ Monitor slow queries and optimize them")
        
        # Test query performance
        print("\n⚡ Testing Query Performance:")
        
        # Test students query
        start_time = asyncio.get_event_loop().time()
        students = await db.students.find({"status": "active"}).to_list(length=None)
        end_time = asyncio.get_event_loop().time()
        print(f"   Students query: {len(students)} results in {(end_time - start_time) * 1000:.2f}ms")
        
        # Test teachers query
        start_time = asyncio.get_event_loop().time()
        teachers = await db.teachers.find({"status": "active"}).to_list(length=None)
        end_time = asyncio.get_event_loop().time()
        print(f"   Teachers query: {len(teachers)} results in {(end_time - start_time) * 1000:.2f}ms")
        
        # Test schools query
        start_time = asyncio.get_event_loop().time()
        schools = await db.schools.find({"status": "active"}).to_list(length=None)
        end_time = asyncio.get_event_loop().time()
        print(f"   Schools query: {len(schools)} results in {(end_time - start_time) * 1000:.2f}ms")
        
        print("\n✅ Performance optimization completed!")
        
    except Exception as e:
        print(f"❌ Error optimizing performance: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(optimize_performance())

