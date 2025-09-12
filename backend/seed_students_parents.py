#!/usr/bin/env python3
"""
Seed script to add 50 students and their parents to the database
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

# Thai names for realistic data
THAI_FIRST_NAMES = [
    "สมชาย", "สมหญิง", "สมศักดิ์", "สมปอง", "สมพร", "สมหมาย", "สมศรี", "สมนึก", "สมบูรณ์", "สมจิต",
    "ธนวัฒน์", "ธนกร", "ธนพล", "ธนพร", "ธนภรณ์", "ธนรัตน์", "ธนศักดิ์", "ธนวัฒน์", "ธนารัตน์", "ธนาพร",
    "ณัฐพล", "ณัฐวุฒิ", "ณัฐกานต์", "ณัฐธิดา", "ณัฐพร", "ณัฐวรา", "ณัฐชนก", "ณัฐธิชา", "ณัฐกมล", "ณัฐธัญ",
    "ศิริพร", "ศิริวรรณ", "ศิริมาศ", "ศิริกาญจน์", "ศิริรัตน์", "ศิริธร", "ศิริพงษ์", "ศิริวัฒน์", "ศิริชัย", "ศิริมา",
    "อภิชาติ", "อภิชาต", "อภิญญา", "อภิรมย์", "อภิรดี", "อภิรดา", "อภิรันต์", "อภิรัตน์", "อภิสิทธิ์", "อภิสร"
]

THAI_LAST_NAMES = [
    "วงศ์ใหญ่", "วงศ์เล็ก", "วงศ์สวัสดิ์", "วงศ์สุข", "วงศ์ศรี", "วงศ์ทอง", "วงศ์เงิน", "วงศ์ทองคำ", "วงศ์เพชร", "วงศ์มณี",
    "ศรีสุข", "ศรีทอง", "ศรีเงิน", "ศรีเพชร", "ศรีมณี", "ศรีรัตน์", "ศรีวัฒน์", "ศรีชัย", "ศรีมา", "ศรีพร",
    "ทองสุข", "ทองคำ", "ทองเงิน", "ทองเพชร", "ทองมณี", "ทองรัตน์", "ทองวัฒน์", "ทองชัย", "ทองมา", "ทองพร",
    "สุขศรี", "สุขทอง", "สุขเงิน", "สุขเพชร", "สุขมณี", "สุขรัตน์", "สุขวัฒน์", "สุขชัย", "สุขมา", "สุขพร",
    "เพชรทอง", "เพชรเงิน", "เพชรมณี", "เพชรรัตน์", "เพชรวัฒน์", "เพชรชัย", "เพชรมา", "เพชรพร", "เพชรศรี", "เพชรสุข"
]

THAI_SCHOOLS = [
    "โรงเรียนวัดพระศรีมหาธาตุ", "โรงเรียนสวนกุหลาบวิทยาลัย", "โรงเรียนเทพศิรินทร์", "โรงเรียนสตรีวิทยา",
    "โรงเรียนบดินทรเดชา", "โรงเรียนเตรียมอุดมศึกษา", "โรงเรียนมหิดลวิทยานุสรณ์", "โรงเรียนจุฬาภรณราชวิทยาลัย",
    "โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย", "โรงเรียนมหิดลวิทยานุสรณ์", "โรงเรียนเตรียมอุดมศึกษาพัฒนาการ",
    "โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ", "โรงเรียนสาธิตมหาวิทยาลัยเกษตรศาสตร์", "โรงเรียนสาธิตมหาวิทยาลัยมหิดล",
    "โรงเรียนสาธิตมหาวิทยาลัยเชียงใหม่", "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น", "โรงเรียนสาธิตมหาวิทยาลัยสงขลานครินทร์",
    "โรงเรียนสาธิตมหาวิทยาลัยนเรศวร", "โรงเรียนสาธิตมหาวิทยาลัยบูรพา", "โรงเรียนสาธิตมหาวิทยาลัยมหาสารคาม"
]

GRADE_LEVELS = ["ประถมศึกษาปีที่ 1", "ประถมศึกษาปีที่ 2", "ประถมศึกษาปีที่ 3", "ประถมศึกษาปีที่ 4", 
                "ประถมศึกษาปีที่ 5", "ประถมศึกษาปีที่ 6", "มัธยมศึกษาปีที่ 1", "มัธยมศึกษาปีที่ 2", 
                "มัธยมศึกษาปีที่ 3", "มัธยมศึกษาปีที่ 4", "มัธยมศึกษาปีที่ 5", "มัธยมศึกษาปีที่ 6"]

TEACHER_POSITIONS = ["ครูประจำชั้น", "ครูผู้สอน", "ครูหัวหน้ากลุ่มสาระ", "ครูแนะแนว", "ครูบรรณารักษ์", 
                     "ครูพี่เลี้ยง", "ครูผู้ช่วย", "ครูพิเศษ", "ครูประจำวิชา", "ครูที่ปรึกษา"]

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def connect_to_mongodb():
    """Connect to MongoDB"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    return db

def generate_student_code(school_index: int, student_index: int) -> str:
    """Generate unique student code"""
    year = datetime.now().year
    school_code = f"{school_index:02d}"
    student_num = f"{student_index:03d}"
    return f"{year}{school_code}{student_num}"

def generate_phone_number() -> str:
    """Generate realistic Thai phone number"""
    prefixes = ["08", "09", "06"]
    prefix = random.choice(prefixes)
    number = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f"{prefix}{number}"

def generate_email(first_name: str, last_name: str) -> str:
    """Generate email from name"""
    domains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"]
    domain = random.choice(domains)
    # Remove Thai characters and use English transliteration
    name_mapping = {
        "สมชาย": "somchai", "สมหญิง": "somying", "สมศักดิ์": "somsak", "สมปอง": "sompong",
        "ธนวัฒน์": "thanawat", "ธนกร": "thanakorn", "ธนพล": "thanapon", "ธนพร": "thanaporn",
        "ณัฐพล": "nattapon", "ณัฐวุฒิ": "nattawut", "ณัฐกานต์": "nattakan", "ณัฐธิดา": "nattida",
        "ศิริพร": "siriporn", "ศิริวรรณ": "siriwan", "ศิริมาศ": "sirimas", "ศิริกาญจน์": "sirikan",
        "อภิชาติ": "apichart", "อภิชาต": "apichat", "อภิญญา": "apinya", "อภิรมย์": "apirom"
    }
    
    eng_first = name_mapping.get(first_name, first_name.lower())
    eng_last = last_name.lower().replace("์", "").replace("ะ", "a").replace("ิ", "i").replace("ี", "ee")
    
    return f"{eng_first}.{eng_last}@{domain}"

def generate_address() -> str:
    """Generate realistic Thai address"""
    provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "นครราชสีมา", "อุบลราชธานี", 
                "ชลบุรี", "นครศรีธรรมราช", "สงขลา", "นครปฐม", "สมุทรปราการ"]
    districts = ["เขตปทุมวัน", "เขตดินแดง", "เขตห้วยขวาง", "เขตวัฒนา", "เขตคลองเตย",
                "เขตบางนา", "เขตพระโขนง", "เขตสวนหลวง", "เขตบางขุนเทียน", "เขตภาษีเจริญ"]
    sub_districts = ["แขวงดินแดง", "แขวงห้วยขวาง", "แขวงคลองเตย", "แขวงคลองตันเหนือ", "แขวงคลองตัน",
                    "แขวงพระโขนงเหนือ", "แขวงพระโขนงใต้", "แขวงบางนาเหนือ", "แขวงบางนาใต้", "แขวงทุ่งมหาเมฆ"]
    
    province = random.choice(provinces)
    district = random.choice(districts)
    sub_district = random.choice(sub_districts)
    house_number = random.randint(1, 999)
    soi_number = random.randint(1, 50)
    road_number = random.randint(1, 100)
    
    return f"{house_number} ซอย {soi_number} ถนน {road_number} แขวง{sub_district} เขต{district} {province}"

async def create_parents(db, num_parents: int = 50) -> List[str]:
    """Create parents and return their IDs"""
    parents_collection = db.parents
    parent_ids = []
    
    print(f"Creating {num_parents} parents...")
    
    for i in range(num_parents):
        first_name = random.choice(THAI_FIRST_NAMES)
        last_name = random.choice(THAI_LAST_NAMES)
        
        parent_data = {
            "first_name": first_name,
            "last_name": last_name,
            "phone": generate_phone_number(),
            "email": generate_email(first_name, last_name),
            "address": generate_address(),
            "relationship": random.choice(["พ่อ", "แม่", "ผู้ปกครอง"]),
            "occupation": random.choice(["พนักงานบริษัท", "ครู", "แพทย์", "วิศวกร", "นักธุรกิจ", "เกษตรกร", "ข้าราชการ"]),
            "emergency_contact": generate_phone_number(),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await parents_collection.insert_one(parent_data)
        parent_ids.append(str(result.inserted_id))
        
        if (i + 1) % 10 == 0:
            print(f"Created {i + 1} parents...")
    
    print(f"✅ Created {num_parents} parents successfully!")
    return parent_ids

async def create_students(db, parent_ids: List[str], num_students: int = 50):
    """Create students with parent references"""
    students_collection = db.students
    teachers_collection = db.teachers
    
    print(f"Creating {num_students} students...")
    
    # Create some teachers first
    teacher_ids = []
    for i in range(10):
        first_name = random.choice(THAI_FIRST_NAMES)
        last_name = random.choice(THAI_LAST_NAMES)
        
        teacher_data = {
            "first_name": first_name,
            "last_name": last_name,
            "position": random.choice(TEACHER_POSITIONS),
            "school": random.choice(THAI_SCHOOLS),
            "phone": generate_phone_number(),
            "email": generate_email(first_name, last_name),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await teachers_collection.insert_one(teacher_data)
        teacher_ids.append(str(result.inserted_id))
    
    print(f"Created {len(teacher_ids)} teachers...")
    
    for i in range(num_students):
        first_name = random.choice(THAI_FIRST_NAMES)
        last_name = random.choice(THAI_LAST_NAMES)
        school = random.choice(THAI_SCHOOLS)
        school_index = THAI_SCHOOLS.index(school)
        
        # Generate date of birth (6-18 years old)
        age = random.randint(6, 18)
        birth_date = datetime.now() - timedelta(days=age*365 + random.randint(0, 365))
        
        student_data = {
            "first_name": first_name,
            "last_name": last_name,
            "student_code": generate_student_code(school_index, i + 1),
            "date_of_birth": birth_date,
            "gender": random.choice(["ชาย", "หญิง"]),
            "school_name": school,
            "grade_level": random.choice(GRADE_LEVELS),
            "parent_id": random.choice(parent_ids),
            "teacher_id": random.choice(teacher_ids),
            "address": generate_address(),
            "phone": generate_phone_number(),
            "emergency_contact": generate_phone_number(),
            "medical_conditions": random.choice([None, "ภูมิแพ้", "หอบหืด", "เบาหวาน", "ความดันโลหิตสูง"]),
            "allergies": random.choice([None, "แพ้ยา", "แพ้อาหารทะเล", "แพ้ถั่ว", "แพ้นม"]),
            "blood_type": random.choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            "height": random.randint(100, 180),
            "weight": random.randint(20, 80),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await students_collection.insert_one(student_data)
        
        if (i + 1) % 10 == 0:
            print(f"Created {i + 1} students...")
    
    print(f"✅ Created {num_students} students successfully!")

async def main():
    """Main seeding function"""
    print("🚀 Starting Student and Parent Seeding...")
    
    try:
        # Connect to MongoDB
        db = await connect_to_mongodb()
        print("✅ Connected to MongoDB")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        # await db.students.delete_many({})
        # await db.parents.delete_many({})
        # await db.teachers.delete_many({})
        # print("🗑️ Cleared existing data")
        
        # Create parents first
        parent_ids = await create_parents(db, 50)
        
        # Create students with parent references
        await create_students(db, parent_ids, 50)
        
        # Print summary
        students_count = await db.students.count_documents({})
        parents_count = await db.parents.count_documents({})
        teachers_count = await db.teachers.count_documents({})
        
        print("\n📊 Seeding Summary:")
        print(f"   Students: {students_count}")
        print(f"   Parents: {parents_count}")
        print(f"   Teachers: {teachers_count}")
        print("\n✅ Seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        # Close connection
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(main())
