#!/usr/bin/env python3
import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient

def generate_thai_address():
    """Generate a realistic Thai address for schools"""
    provinces = [
        ("กรุงเทพมหานคร", "10000"),
        ("เชียงใหม่", "50000"),
        ("ภูเก็ต", "83000"),
        ("พัทยา", "20150"),
        ("นครราชสีมา", "30000"),
        ("ขอนแก่น", "40000"),
        ("อุบลราชธานี", "34000"),
        ("สงขลา", "90000"),
        ("นครศรีธรรมราช", "80000"),
        ("สุราษฎร์ธานี", "84000")
    ]
    
    districts = [
        "ปทุมวัน", "สวนหลวง", "วัฒนา", "บางนา", "พระโขนง",
        "คลองเตย", "ยานนาวา", "สาทร", "ดินแดง", "ห้วยขวาง"
    ]
    
    roads = [
        "ถนนสุขุมวิท", "ถนนรัชดาภิเษก", "ถนนลาดพร้าว", "ถนนเพชรบุรี",
        "ถนนพระราม 9", "ถนนอโศก", "ถนนสีลม", "ถนนสาทร"
    ]
    
    province, postal_code = random.choice(provinces)
    district = random.choice(districts)
    road = random.choice(roads)
    house_no = random.randint(1, 999)
    soi = random.randint(1, 50)
    
    address = {
        "house_no": str(house_no),
        "village_no": None,
        "soi": f"ซอย {soi}",
        "road": road,
        "subdistrict": None,
        "district": district,
        "province": province,
        "postal_code": postal_code
    }
    
    return address

def generate_international_address():
    """Generate a realistic international address for schools"""
    countries = [
        ("United States", "New York", "10001"),
        ("United Kingdom", "London", "SW1A 1AA"),
        ("Canada", "Toronto", "M5V 3A8"),
        ("Australia", "Sydney", "2000"),
        ("Singapore", "Singapore", "018956"),
        ("Japan", "Tokyo", "100-0001"),
        ("South Korea", "Seoul", "04524"),
        ("Germany", "Berlin", "10115"),
        ("France", "Paris", "75001"),
        ("Netherlands", "Amsterdam", "1011")
    ]
    
    country, city, postal_code = random.choice(countries)
    street_number = random.randint(1, 9999)
    street_name = f"Street {random.randint(1, 100)}"
    
    address = {
        "house_no": str(street_number),
        "village_no": None,
        "soi": f"Avenue {random.randint(1, 50)}",
        "road": street_name,
        "subdistrict": None,
        "district": city,
        "province": country,
        "postal_code": postal_code
    }
    
    return address

async def add_schools():
    """Add school records to the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check if schools already exist
        existing_count = await db.schools.count_documents({})
        if existing_count > 0:
            print(f"📊 Found {existing_count} existing schools")
            return
        
        # Get unique school names from students
        students = await db.students.find({}).to_list(length=None)
        school_names = set()
        for student in students:
            school_name = student.get('school_name', '')
            if school_name:
                school_names.add(school_name)
        
        print(f"📋 Creating schools for: {list(school_names)}")
        
        # Create school records
        schools_data = []
        
        for i, school_name in enumerate(school_names):
            # Generate school code
            school_code = f"SCH{i+1:03d}"
            
            # Determine school type and address
            if "International" in school_name or "Bangkok International" in school_name:
                school_type = "International School"
                address = generate_thai_address()  # International schools in Thailand
                phone = f"+66-2-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                email = f"info@{school_name.lower().replace(' ', '').replace('bangkok', '')}.edu.th"
            else:
                school_type = "Public School"
                address = generate_thai_address()
                phone = f"+66-{random.randint(30, 80)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                email = f"info@{school_name.lower().replace(' ', '')}.edu.th"
            
            school = {
                "school_code": school_code,
                "name": school_name,
                "type": school_type,
                "address": address,
                "phone": phone,
                "email": email,
                "status": "active",
                "created_at": "2025-08-31T16:00:00Z",
                "updated_at": "2025-08-31T16:00:00Z"
            }
            schools_data.append(school)
        
        # Insert schools
        result = await db.schools.insert_many(schools_data)
        
        print(f"✅ Successfully created {len(result.inserted_ids)} schools")
        
        # Verify the creation
        total_schools = await db.schools.count_documents({})
        print(f"📊 Total schools in database: {total_schools}")
        
        # Show sample schools
        sample_schools = await db.schools.find({}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Schools Created:")
        for school in sample_schools:
            name = school.get('name', '')
            code = school.get('school_code', '')
            school_type = school.get('type', '')
            address = school.get('address', {})
            phone = school.get('phone', '')
            email = school.get('email', '')
            
            print(f"   {name} ({code})")
            print(f"      Type: {school_type}")
            print(f"      Address: {address.get('house_no', '')} {address.get('road', '')}, {address.get('district', '')}, {address.get('province', '')}")
            print(f"      Phone: {phone}")
            print(f"      Email: {email}")
            print()
        
    except Exception as e:
        print(f"❌ Error creating schools: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_schools())
