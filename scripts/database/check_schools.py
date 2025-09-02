#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_schools():
    """Check if schools exist in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all schools
        all_schools = await db.schools.find({}).to_list(length=None)
        total_schools = len(all_schools)
        
        print(f"📊 Total Schools: {total_schools}")
        
        if total_schools == 0:
            print("❌ No schools found in database")
            return
        
        # Show sample schools
        print(f"\n📋 Sample Schools:")
        for i, school in enumerate(all_schools[:5]):
            name = school.get('name', 'N/A')
            school_code = school.get('school_code', 'N/A')
            school_type = school.get('type', 'N/A')
            address = school.get('address', {})
            
            print(f"   {i+1}. {name}")
            print(f"      Code: {school_code}")
            print(f"      Type: {school_type}")
            print(f"      Address: {address}")
            print()
        
        # Show complete field structure of first school
        if all_schools:
            print(f"📋 Complete Field Structure (First School):")
            first_school = all_schools[0]
            for field, value in first_school.items():
                print(f"   {field}: {value}")
        
        # Check what school names students have
        students = await db.students.find({}).to_list(length=None)
        school_names = set()
        for student in students:
            school_name = student.get('school_name', '')
            if school_name:
                school_names.add(school_name)
        
        print(f"\n📋 School Names from Students:")
        for school_name in sorted(school_names):
            print(f"   - {school_name}")
        
    except Exception as e:
        print(f"❌ Error checking schools: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_schools())

