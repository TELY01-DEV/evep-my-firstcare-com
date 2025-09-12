#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_addresses():
    """Check address status for students and parents"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check students
        all_students = await db.students.find({}).to_list(length=None)
        total_students = len(all_students)
        
        students_with_address = []
        students_without_address = []
        
        for student in all_students:
            address = student.get('address', {})
            if address and any(address.get(field) for field in ['street', 'sub_district', 'district', 'province', 'postal_code']):
                students_with_address.append(student)
            else:
                students_without_address.append(student)
        
        print(f"📊 Students Address Status:")
        print(f"   Total Students: {total_students}")
        print(f"   Students with address: {len(students_with_address)}")
        print(f"   Students without address: {len(students_without_address)}")
        
        # Check parents
        all_parents = await db.parents.find({}).to_list(length=None)
        total_parents = len(all_parents)
        
        parents_with_address = []
        parents_without_address = []
        
        for parent in all_parents:
            address = parent.get('address', {})
            if address and any(address.get(field) for field in ['street', 'sub_district', 'district', 'province', 'postal_code']):
                parents_with_address.append(parent)
            else:
                parents_without_address.append(parent)
        
        print(f"\n📊 Parents Address Status:")
        print(f"   Total Parents: {total_parents}")
        print(f"   Parents with address: {len(parents_with_address)}")
        print(f"   Parents without address: {len(parents_without_address)}")
        
        # Show sample addresses
        if students_with_address:
            print(f"\n✅ Sample Students with Addresses:")
            for i, student in enumerate(students_with_address[:3]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                address = student.get('address', {})
                print(f"   {i+1}. {name}")
                print(f"      Address: {address.get('street', '')}, {address.get('sub_district', '')}, {address.get('district', '')}, {address.get('province', '')} {address.get('postal_code', '')}")
        
        if parents_with_address:
            print(f"\n✅ Sample Parents with Addresses:")
            for i, parent in enumerate(parents_with_address[:3]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                address = parent.get('address', {})
                print(f"   {i+1}. {name}")
                print(f"      Address: {address.get('street', '')}, {address.get('sub_district', '')}, {address.get('district', '')}, {address.get('province', '')} {address.get('postal_code', '')}")
        
        # Show sample without addresses
        if students_without_address:
            print(f"\n❌ Sample Students without Addresses:")
            for i, student in enumerate(students_without_address[:3]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        if parents_without_address:
            print(f"\n❌ Sample Parents without Addresses:")
            for i, parent in enumerate(parents_without_address[:3]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        # Show complete address structure
        if all_students:
            print(f"\n📋 Complete Address Structure (First Student):")
            first_student = all_students[0]
            address = first_student.get('address', {})
            print(f"   Address: {address}")
        
        if all_parents:
            print(f"\n📋 Complete Address Structure (First Parent):")
            first_parent = all_parents[0]
            address = first_parent.get('address', {})
            print(f"   Address: {address}")
        
    except Exception as e:
        print(f"❌ Error checking addresses: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_addresses())

