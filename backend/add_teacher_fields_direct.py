#!/usr/bin/env python3
import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

def generate_thai_cid():
    """Generate a realistic Thai CID number"""
    first_digit = random.randint(1, 8)
    province_code = random.randint(1000, 9999)
    sequential = random.randint(10000, 99999)
    check_digits = random.randint(10, 99)
    verification = random.randint(0, 9)
    cid = f"{first_digit}{province_code:04d}{sequential:05d}{check_digits:02d}{verification}"
    return cid

def generate_birth_date(age_min=25, age_max=60):
    """Generate a realistic birth date for teachers"""
    current_year = datetime.now().year
    age = random.randint(age_min, age_max)
    birth_year = current_year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{birth_year}-{month:02d}-{day:02d}"

def generate_thai_address():
    """Generate a realistic Thai address"""
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
    """Generate a realistic international address"""
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

def generate_teacher_profile_photo_url(teacher_name, gender, is_thai=True):
    """Generate a realistic profile photo URL for teachers"""
    # Use a professional avatar service for teachers
    
    # Clean the name for URL
    clean_name = teacher_name.replace(' ', '').replace('์', '').replace('่', '').replace('้', '').replace('๊', '').replace('๋', '')
    
    # Generate a random seed for consistent photos
    seed = hash(clean_name) % 10000
    
    # Use professional styles for teachers
    if is_thai:
        style = 'personas'  # Professional for Thai teachers
    else:
        style = 'personas'  # Professional for international teachers
    
    # Generate avatar URL with professional colors
    photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=1e40af,7c3aed,059669,dc2626,f59e0b"
    
    return photo_url

def generate_teacher_extra_photos(teacher_name, count=1):
    """Generate extra photo URLs for teachers"""
    extra_photos = []
    
    # Generate 1-2 extra photos for teachers
    for i in range(count):
        # Use professional styles for teachers
        styles = ['personas', 'initials']
        style = random.choice(styles)
        
        # Generate different seed for each photo
        seed = hash(f"{teacher_name}{i}") % 10000
        
        photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=1e40af,7c3aed,059669,dc2626,f59e0b"
        extra_photos.append(photo_url)
    
    return extra_photos

def generate_teacher_photo_metadata(teacher_name, photo_type="profile"):
    """Generate photo metadata for teachers"""
    metadata = {
        "upload_date": "2025-08-31T16:00:00Z",
        "file_size": random.randint(80000, 150000),  # 80KB to 150KB
        "dimensions": {
            "width": 400,
            "height": 400
        },
        "format": "svg",
        "description": f"{photo_type.title()} photo for {teacher_name}",
        "tags": ["teacher", "profile", "avatar", "professional"],
        "uploaded_by": "system",
        "is_public": True
    }
    
    return metadata

async def add_teacher_fields_direct():
    """Add CID, birth date, address, and profile photos to teachers directly in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all teachers
        teachers = await db.teachers.find({}).to_list(length=None)
        print(f"📊 Found {len(teachers)} teachers to update")
        
        # Update each teacher with new fields
        updated_count = 0
        failed_count = 0
        
        for teacher in teachers:
            try:
                # Generate new fields
                teacher_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
                gender = teacher.get('gender', '')
                email = teacher.get('email', '')
                
                # Determine if Thai or international teacher
                is_thai = '@school.edu.th' in email
                
                # Generate CID (only for Thai teachers)
                cid = generate_thai_cid() if is_thai else ""
                
                # Generate birth date
                birth_date = generate_birth_date()
                
                # Generate address
                address = generate_thai_address() if is_thai else generate_international_address()
                
                # Generate profile photo
                profile_photo = generate_teacher_profile_photo_url(teacher_name, gender, is_thai)
                extra_photos = generate_teacher_extra_photos(teacher_name, random.randint(1, 2))
                photo_metadata = generate_teacher_photo_metadata(teacher_name, "profile")
                
                # Update teacher directly in database
                result = await db.teachers.update_one(
                    {"_id": teacher["_id"]},
                    {
                        "$set": {
                            "cid": cid,
                            "birth_date": birth_date,
                            "address": address,
                            "work_address": address,  # Also set work_address for API compatibility
                            "school": "Bangkok International School" if is_thai else "International School",
                            "profile_photo": profile_photo,
                            "extra_photos": extra_photos,
                            "photo_metadata": photo_metadata,
                            "updated_at": "2025-08-31T16:00:00Z"
                        }
                    }
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✅ Updated {teacher_name} with CID: {cid[:10]}..., Birth: {birth_date}, Photo: {profile_photo[:50]}...")
                else:
                    failed_count += 1
                    print(f"❌ Failed to update teacher {teacher_name}")
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating teacher {teacher_name}: {e}")
        
        print(f"\n📊 Update Summary:")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Failed updates: {failed_count}")
        print(f"   Total teachers: {len(teachers)}")
        
        # Verify the updates
        teachers_with_cid = await db.teachers.count_documents({"cid": {"$exists": True, "$ne": ""}})
        teachers_with_birth_date = await db.teachers.count_documents({"birth_date": {"$exists": True, "$ne": ""}})
        teachers_with_address = await db.teachers.count_documents({"address": {"$exists": True, "$ne": {}}})
        teachers_with_photo = await db.teachers.count_documents({"profile_photo": {"$exists": True, "$ne": ""}})
        
        print(f"   Teachers with CID after update: {teachers_with_cid}")
        print(f"   Teachers with birth date after update: {teachers_with_birth_date}")
        print(f"   Teachers with address after update: {teachers_with_address}")
        print(f"   Teachers with profile photo after update: {teachers_with_photo}")
        
        # Show sample updated teachers
        sample_teachers = await db.teachers.find({"profile_photo": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Teachers with New Fields:")
        for teacher in sample_teachers:
            name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
            cid = teacher.get('cid', 'N/A')
            birth_date = teacher.get('birth_date', 'N/A')
            address = teacher.get('address', {})
            profile_photo = teacher.get('profile_photo', '')
            print(f"   {name} - CID: {cid[:10]}..., Birth: {birth_date}, Photo: {profile_photo[:50]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_teacher_fields_direct())
