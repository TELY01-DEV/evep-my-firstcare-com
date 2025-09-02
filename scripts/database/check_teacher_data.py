#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_teacher_data():
    """Check current teacher data and what fields are missing"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all teachers
        all_teachers = await db.teachers.find({}).to_list(length=None)
        total_teachers = len(all_teachers)
        
        print(f"📊 Total Teachers: {total_teachers}")
        
        if total_teachers == 0:
            print("❌ No teachers found in database")
            return
        
        # Check each field status
        teachers_with_cid = []
        teachers_without_cid = []
        teachers_with_birth_date = []
        teachers_without_birth_date = []
        teachers_with_address = []
        teachers_without_address = []
        teachers_with_photo = []
        teachers_without_photo = []
        
        for teacher in all_teachers:
            # Check CID
            cid = teacher.get('cid', '')
            if cid and cid.strip():
                teachers_with_cid.append(teacher)
            else:
                teachers_without_cid.append(teacher)
            
            # Check birth date
            birth_date = teacher.get('birth_date', '')
            if birth_date and birth_date.strip():
                teachers_with_birth_date.append(teacher)
            else:
                teachers_without_birth_date.append(teacher)
            
            # Check address
            address = teacher.get('address', {})
            if address and isinstance(address, dict) and any(address.values()):
                teachers_with_address.append(teacher)
            else:
                teachers_without_address.append(teacher)
            
            # Check profile photo
            profile_photo = teacher.get('profile_photo', '')
            if profile_photo and profile_photo.strip():
                teachers_with_photo.append(teacher)
            else:
                teachers_without_photo.append(teacher)
        
        print(f"\n📋 Field Status Summary:")
        print(f"   Teachers with CID: {len(teachers_with_cid)}")
        print(f"   Teachers without CID: {len(teachers_without_cid)}")
        print(f"   Teachers with birth date: {len(teachers_with_birth_date)}")
        print(f"   Teachers without birth date: {len(teachers_without_birth_date)}")
        print(f"   Teachers with address: {len(teachers_with_address)}")
        print(f"   Teachers without address: {len(teachers_without_address)}")
        print(f"   Teachers with profile photo: {len(teachers_with_photo)}")
        print(f"   Teachers without profile photo: {len(teachers_without_photo)}")
        
        # Show sample teachers
        print(f"\n📋 Sample Teachers:")
        for i, teacher in enumerate(all_teachers[:5]):
            name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
            cid = teacher.get('cid', 'N/A')
            birth_date = teacher.get('birth_date', 'N/A')
            address = teacher.get('address', {})
            profile_photo = teacher.get('profile_photo', 'N/A')
            
            print(f"   {i+1}. {name}")
            print(f"      CID: {cid}")
            print(f"      Birth Date: {birth_date}")
            print(f"      Address: {address}")
            print(f"      Profile Photo: {profile_photo[:50] if profile_photo != 'N/A' else 'N/A'}...")
            print()
        
        # Show complete field structure of first teacher
        if all_teachers:
            print(f"📋 Complete Field Structure (First Teacher):")
            first_teacher = all_teachers[0]
            for field, value in first_teacher.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking teacher data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_teacher_data())

