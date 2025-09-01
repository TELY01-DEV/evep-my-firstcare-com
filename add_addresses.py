#!/usr/bin/env python3
import asyncio
import aiohttp
import random

# Thai address data
THAI_PROVINCES = [
    {"name": "กรุงเทพมหานคร", "postal_code": "10110"},
    {"name": "กรุงเทพมหานคร", "postal_code": "10260"},
    {"name": "กรุงเทพมหานคร", "postal_code": "10310"},
    {"name": "กรุงเทพมหานคร", "postal_code": "10400"},
    {"name": "กรุงเทพมหานคร", "postal_code": "10500"},
    {"name": "นนทบุรี", "postal_code": "11000"},
    {"name": "ปทุมธานี", "postal_code": "12000"},
    {"name": "สมุทรปราการ", "postal_code": "10280"},
    {"name": "สมุทรสาคร", "postal_code": "74000"},
    {"name": "นครปฐม", "postal_code": "73000"}
]

THAI_DISTRICTS = [
    "วัฒนา", "บางนา", "คลองเตย", "สาทร", "พระโขนง", "ห้วยขวาง", "ดินแดง", "ลาดพร้าว", "จตุจักร", "ดอนเมือง",
    "สายไหม", "บางเขน", "หลักสี่", "ทุ่งสองห้อง", "บางซื่อ", "พหลโยธิน", "ลาดยาว", "เสนานิคม", "จันทรเกษม", "บางพลัด"
]

THAI_SUB_DISTRICTS = [
    "คลองเตยเหนือ", "คลองเตยใต้", "คลองเตย", "คลองตันเหนือ", "คลองตันใต้", "คลองตัน", "พระโขนงเหนือ", "พระโขนงใต้",
    "บางนาเหนือ", "บางนาใต้", "บางนา", "วัฒนา", "สวนหลวง", "คลองตันเหนือ", "คลองตันใต้", "คลองตัน", "พระโขนงเหนือ",
    "พระโขนงใต้", "บางนาเหนือ", "บางนาใต้", "บางนา", "วัฒนา", "สวนหลวง", "คลองเตยเหนือ", "คลองเตยใต้", "คลองเตย"
]

THAI_ROADS = [
    "ถนนสุขุมวิท", "ถนนรัชดาภิเษก", "ถนนลาดพร้าว", "ถนนวิภาวดีรังสิต", "ถนนพหลโยธิน", "ถนนรัชดาภิเษก", "ถนนลาดพร้าว",
    "ถนนวิภาวดีรังสิต", "ถนนพหลโยธิน", "ถนนรัชดาภิเษก", "ถนนลาดพร้าว", "ถนนวิภาวดีรังสิต", "ถนนพหลโยธิน", "ถนนรัชดาภิเษก"
]

THAI_SOIS = [
    "สุขุมวิท 15", "สุขุมวิท 20", "สุขุมวิท 25", "สุขุมวิท 30", "สุขุมวิท 35", "สุขุมวิท 40", "สุขุมวิท 45", "สุขุมวิท 50",
    "ลาดพร้าว 1", "ลาดพร้าว 2", "ลาดพร้าว 3", "ลาดพร้าว 4", "ลาดพร้าว 5", "ลาดพร้าว 6", "ลาดพร้าว 7", "ลาดพร้าว 8",
    "รัชดาภิเษก 1", "รัชดาภิเษก 2", "รัชดาภิเษก 3", "รัชดาภิเษก 4", "รัชดาภิเษก 5", "รัชดาภิเษก 6", "รัชดาภิเษก 7", "รัชดาภิเษก 8"
]

def generate_thai_address():
    """Generate a realistic Thai address"""
    province_data = random.choice(THAI_PROVINCES)
    
    address = {
        "house_no": str(random.randint(1, 999)),
        "village_no": str(random.randint(1, 20)) if random.random() > 0.5 else None,
        "soi": random.choice(THAI_SOIS),
        "road": random.choice(THAI_ROADS),
        "sub_district": random.choice(THAI_SUB_DISTRICTS),
        "district": random.choice(THAI_DISTRICTS),
        "province": province_data["name"],
        "postal_code": province_data["postal_code"]
    }
    
    return address

def generate_international_address():
    """Generate a realistic international address"""
    countries = [
        {"name": "United States", "postal_code": "10001"},
        {"name": "United Kingdom", "postal_code": "SW1A 1AA"},
        {"name": "Canada", "postal_code": "M5V 3A8"},
        {"name": "Australia", "postal_code": "2000"},
        {"name": "Singapore", "postal_code": "018956"},
        {"name": "Japan", "postal_code": "100-0001"},
        {"name": "South Korea", "postal_code": "04524"},
        {"name": "India", "postal_code": "110001"},
        {"name": "China", "postal_code": "100000"},
        {"name": "Germany", "postal_code": "10115"}
    ]
    
    country = random.choice(countries)
    
    address = {
        "house_no": str(random.randint(1, 9999)),
        "village_no": None,
        "soi": f"Street {random.randint(1, 100)}",
        "road": f"Main Road {random.randint(1, 50)}",
        "sub_district": f"District {random.randint(1, 20)}",
        "district": f"City {random.randint(1, 10)}",
        "province": country["name"],
        "postal_code": country["postal_code"]
    }
    
    return address

async def add_addresses_to_students():
    """Add addresses to students using the API"""
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://backend:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in")
        
        # Get all students from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        students = await db.students.find({}).to_list(length=None)
        print(f"📊 Found {len(students)} students to update")
        
        # Update each student with address
        updated_count = 0
        failed_count = 0
        
        for student in students:
            try:
                # Generate address based on student type
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                
                # Check if student has Thai name
                if any(char in name for char in ['ะ', 'า', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'เ', 'แ', 'โ', 'ใ', 'ไ', 'ำ', '่', '้', '๊', '๋', '์']):
                    address = generate_thai_address()
                else:
                    address = generate_international_address()
                
                # Prepare update data
                update_data = {
                    "title": student.get("title", "เด็ก"),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "cid": student.get("cid", ""),
                    "birth_date": student.get("birth_date", ""),
                    "gender": student.get("gender", ""),
                    "student_code": student.get("student_code", ""),
                    "school_name": student.get("school_name", ""),
                    "grade_level": student.get("grade_level", ""),
                    "grade_number": student.get("grade_number"),
                    "address": address,
                    "disease": student.get("disease"),
                    "parent_id": student.get("parent_id", ""),
                    "consent_document": student.get("consent_document", True),
                    "profile_photo": student.get("profile_photo"),
                    "extra_photos": student.get("extra_photos", []),
                    "photo_metadata": student.get("photo_metadata"),
                    "status": "active"
                }
                
                # Update student via API
                student_id = str(student["_id"])
                update_response = await session.put(
                    f"http://backend:8000/api/v1/evep/students/{student_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if update_response.status == 200:
                    updated_count += 1
                    print(f"✅ Updated {name} with address: {address['house_no']} {address['soi']}, {address['sub_district']}, {address['district']}, {address['province']} {address['postal_code']}")
                else:
                    failed_count += 1
                    error_text = await update_response.text()
                    print(f"❌ Failed to update student {student_id}: {error_text}")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating student: {e}")
        
        print(f"\n📊 Student Address Update Summary:")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Failed updates: {failed_count}")
        print(f"   Total students: {len(students)}")
        
        client.close()

async def add_addresses_to_parents():
    """Add complete addresses to parents using the API"""
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://backend:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in for parents")
        
        # Get all parents from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        parents = await db.parents.find({}).to_list(length=None)
        print(f"📊 Found {len(parents)} parents to update")
        
        # Update each parent with complete address
        updated_count = 0
        failed_count = 0
        
        for parent in parents:
            try:
                # Generate complete Thai address for parents
                address = generate_thai_address()
                
                # Prepare update data
                update_data = {
                    "first_name": parent.get("first_name", ""),
                    "last_name": parent.get("last_name", ""),
                    "cid": parent.get("cid", ""),
                    "birth_date": parent.get("birth_date", ""),
                    "gender": parent.get("gender", ""),
                    "phone": parent.get("phone", ""),
                    "email": parent.get("email", ""),
                    "relation": parent.get("relation", ""),
                    "occupation": parent.get("occupation", ""),
                    "income_level": parent.get("income_level"),
                    "address": address,
                    "emergency_contact": parent.get("emergency_contact", {
                        "name": "",
                        "phone": "",
                        "relation": ""
                    }),
                    "status": "active"
                }
                
                # Update parent via API
                parent_id = str(parent["_id"])
                update_response = await session.put(
                    f"http://backend:8000/api/v1/evep/parents/{parent_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if update_response.status == 200:
                    updated_count += 1
                    name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                    print(f"✅ Updated {name} with address: {address['house_no']} {address['soi']}, {address['sub_district']}, {address['district']}, {address['province']} {address['postal_code']}")
                else:
                    failed_count += 1
                    error_text = await update_response.text()
                    print(f"❌ Failed to update parent {parent_id}: {error_text}")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating parent: {e}")
        
        print(f"\n📊 Parent Address Update Summary:")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Failed updates: {failed_count}")
        print(f"   Total parents: {len(parents)}")
        
        client.close()

async def main():
    """Main function to add addresses to both students and parents"""
    print("🏠 Adding Addresses to Students and Parents")
    print("=" * 50)
    
    # Add addresses to students
    print("\n📚 Adding addresses to students...")
    await add_addresses_to_students()
    
    # Add addresses to parents
    print("\n👥 Adding addresses to parents...")
    await add_addresses_to_parents()
    
    print("\n✅ Address update process completed!")

if __name__ == "__main__":
    asyncio.run(main())

