#!/usr/bin/env python3
import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Thai teacher names
THAI_TEACHER_NAMES = [
    ("อาจารย์", "สมชาย", "ใจดี", "male"),
    ("อาจารย์", "สมหญิง", "รักเรียน", "female"),
    ("อาจารย์", "วิชัย", "มุ่งมั่น", "male"),
    ("อาจารย์", "ดวงใจ", "สวยงาม", "female"),
    ("อาจารย์", "สมศักดิ์", "พัฒนาการ", "male"),
    ("อาจารย์", "ศิริรัตน์", "วงศ์ศรี", "female"),
    ("อาจารย์", "ธนพล", "สุขพร", "male"),
    ("อาจารย์", "สมพร", "ทองชัย", "female"),
    ("อาจารย์", "ณัฐกานต์", "สุขวัฒน์", "male"),
    ("อาจารย์", "ศิริมา", "สุขมา", "female")
]

# International teacher names
INTERNATIONAL_TEACHER_NAMES = [
    ("Mr.", "John", "Smith", "male"),
    ("Ms.", "Sarah", "Johnson", "female"),
    ("Mr.", "Michael", "Brown", "male"),
    ("Ms.", "Emily", "Davis", "female"),
    ("Mr.", "David", "Wilson", "male"),
    ("Ms.", "Lisa", "Anderson", "female"),
    ("Mr.", "Robert", "Taylor", "male"),
    ("Ms.", "Jennifer", "Martinez", "female"),
    ("Mr.", "William", "Garcia", "male"),
    ("Ms.", "Amanda", "Rodriguez", "female")
]

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

async def seed_teachers():
    """Seed demo teachers with basic information"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check if teachers already exist
        existing_count = await db.teachers.count_documents({})
        if existing_count > 0:
            print(f"📊 Found {existing_count} existing teachers")
            return
        
        print("🌱 Seeding demo teachers...")
        
        teachers_data = []
        
        # Create Thai teachers
        for i, (title, first_name, last_name, gender) in enumerate(THAI_TEACHER_NAMES):
            teacher = {
                "title": title,
                "first_name": first_name,
                "last_name": last_name,
                "gender": gender,
                "email": f"{first_name.lower()}.{last_name.lower()}@school.edu.th",
                "phone": f"08{random.randint(10000000, 99999999)}",
                "subject": random.choice(["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "พลศึกษา", "ศิลปะ", "ดนตรี"]),
                "grade_level": random.choice(["ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย"]),
                "experience_years": random.randint(1, 20),
                "education_level": random.choice(["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]),
                "status": "active",
                "created_at": "2025-08-31T16:00:00Z",
                "updated_at": "2025-08-31T16:00:00Z"
            }
            teachers_data.append(teacher)
        
        # Create international teachers
        for i, (title, first_name, last_name, gender) in enumerate(INTERNATIONAL_TEACHER_NAMES):
            teacher = {
                "title": title,
                "first_name": first_name,
                "last_name": last_name,
                "gender": gender,
                "email": f"{first_name.lower()}.{last_name.lower()}@international.edu",
                "phone": f"+66{random.randint(80000000, 89999999)}",
                "subject": random.choice(["Mathematics", "Science", "English", "History", "Physical Education", "Art", "Music", "Computer Science"]),
                "grade_level": random.choice(["Elementary", "Middle School", "High School"]),
                "experience_years": random.randint(1, 15),
                "education_level": random.choice(["Bachelor's Degree", "Master's Degree", "PhD"]),
                "status": "active",
                "created_at": "2025-08-31T16:00:00Z",
                "updated_at": "2025-08-31T16:00:00Z"
            }
            teachers_data.append(teacher)
        
        # Insert teachers
        result = await db.teachers.insert_many(teachers_data)
        
        print(f"✅ Successfully seeded {len(result.inserted_ids)} teachers")
        
        # Verify the seeding
        total_teachers = await db.teachers.count_documents({})
        print(f"📊 Total teachers in database: {total_teachers}")
        
        # Show sample teachers
        sample_teachers = await db.teachers.find({}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Teachers Created:")
        for teacher in sample_teachers:
            name = f"{teacher.get('title', '')} {teacher.get('first_name', '')} {teacher.get('last_name', '')}"
            subject = teacher.get('subject', '')
            email = teacher.get('email', '')
            print(f"   {name} - {subject} - {email}")
        
    except Exception as e:
        print(f"❌ Error seeding teachers: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_teachers())
