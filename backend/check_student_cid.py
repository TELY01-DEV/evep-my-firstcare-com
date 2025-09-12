#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_student_cid():
    """Check which students have CID (Citizen ID) numbers"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all students
        all_students = await db.students.find({}).to_list(length=None)
        total_students = len(all_students)
        
        print(f"📊 Total Students: {total_students}")
        
        # Check for CID field
        students_with_cid = []
        students_without_cid = []
        
        for student in all_students:
            cid = student.get('cid') or student.get('citizen_id') or student.get('national_id')
            if cid:
                students_with_cid.append(student)
            else:
                students_without_cid.append(student)
        
        print(f"\n🆔 CID Status:")
        print(f"   Students with CID: {len(students_with_cid)}")
        print(f"   Students without CID: {len(students_without_cid)}")
        
        # Show sample students with CID
        if students_with_cid:
            print(f"\n✅ Sample Students with CID:")
            for i, student in enumerate(students_with_cid[:5]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                cid = student.get('cid') or student.get('citizen_id') or student.get('national_id')
                print(f"   {i+1}. {name} - CID: {cid}")
        
        # Show sample students without CID
        if students_without_cid:
            print(f"\n❌ Sample Students without CID:")
            for i, student in enumerate(students_without_cid[:5]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        # Check all possible CID field names
        print(f"\n🔍 Checking for CID field variations...")
        cid_fields = ['cid', 'citizen_id', 'national_id', 'thai_id', 'id_number']
        for field in cid_fields:
            count = await db.students.count_documents({field: {"$exists": True, "$ne": ""}})
            if count > 0:
                print(f"   Field '{field}': {count} students have this field")
        
        # Show complete field structure of first student
        if all_students:
            print(f"\n📋 Complete field structure of first student:")
            first_student = all_students[0]
            for field, value in first_student.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking student CID: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_student_cid())
