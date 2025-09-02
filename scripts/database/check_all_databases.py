#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_databases():
    """Check all databases for students"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    
    try:
        # List all databases
        databases = await client.list_database_names()
        print(f"📊 Available databases: {databases}")
        
        for db_name in databases:
            if db_name not in ['admin', 'local', 'config']:  # Skip system databases
                db = client[db_name]
                
                # Check if students collection exists
                collections = await db.list_collection_names()
                if 'students' in collections:
                    student_count = await db.students.count_documents({})
                    print(f"\n📚 Database '{db_name}':")
                    print(f"   Students collection: {student_count} students")
                    
                    if student_count > 0:
                        # Show sample students
                        sample_students = await db.students.find({}, {"name": 1, "first_name": 1, "last_name": 1, "gender": 1}).limit(3).to_list(length=3)
                        print(f"   Sample students:")
                        for student in sample_students:
                            name = student.get('name') or f"{student.get('first_name', '')} {student.get('last_name', '')}"
                            print(f"     - {name} ({student.get('gender', 'unknown')})")
                
    except Exception as e:
        print(f"❌ Error checking databases: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_all_databases())

