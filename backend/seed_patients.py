#!/usr/bin/env python3
"""
Seed script to add 10 patients to the database
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

MEDICAL_CONDITIONS = [
    "ไม่มีประวัติทางการแพทย์", "สายตาสั้น", "สายตายาว", "สายตาเอียง", "ตาขี้เกียจ", 
    "ตาสีแดง", "ตาแห้ง", "ปวดหัวบ่อย", "เวียนหัว", "คลื่นไส้"
]

ALLERGIES = [
    "ไม่มีอาการแพ้", "แพ้ยา", "แพ้อาหารทะเล", "แพ้ถั่ว", "แพ้นม", "แพ้ไข่", 
    "แพ้แป้งสาลี", "แพ้ฝุ่น", "แพ้เกสรดอกไม้", "แพ้ขนสัตว์"
]

# MongoDB connection
MONGO_URL = "mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017"
DB_NAME = "evep_db"

async def connect_to_mongodb():
    """Connect to MongoDB"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    return db

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

def generate_medical_history() -> Dict[str, Any]:
    """Generate realistic medical history"""
    return {
        "vision_problems": random.choice([True, False]),
        "previous_screenings": random.randint(0, 3),
        "family_vision_history": random.choice([True, False]),
        "chronic_conditions": random.choice([None, "เบาหวาน", "ความดันโลหิตสูง", "หอบหืด"]),
        "medications": random.choice([None, "ยารักษาสายตา", "ยาความดัน", "ยาหอบหืด"]),
        "last_eye_exam": random.choice([None, "1 ปีที่แล้ว", "2 ปีที่แล้ว", "3 ปีที่แล้ว", "ไม่เคยตรวจ"])
    }

def generate_family_vision_history() -> Dict[str, Any]:
    """Generate family vision history"""
    return {
        "father_vision": random.choice(["ปกติ", "สายตาสั้น", "สายตายาว", "ไม่ทราบ"]),
        "mother_vision": random.choice(["ปกติ", "สายตาสั้น", "สายตายาว", "ไม่ทราบ"]),
        "siblings_vision": random.choice(["ปกติ", "มีปัญหาสายตา", "ไม่ทราบ"]),
        "grandparents_vision": random.choice(["ปกติ", "มีปัญหาสายตา", "ไม่ทราบ"])
    }

async def create_patients(db, num_patients: int = 10):
    """Create patients with realistic data"""
    patients_collection = db.patients
    
    print(f"Creating {num_patients} patients...")
    
    for i in range(num_patients):
        # Generate patient data
        first_name = random.choice(THAI_FIRST_NAMES)
        last_name = random.choice(THAI_LAST_NAMES)
        parent_first_name = random.choice(THAI_FIRST_NAMES)
        parent_last_name = random.choice(THAI_LAST_NAMES)
        
        # Generate date of birth (6-18 years old)
        age = random.randint(6, 18)
        birth_date = datetime.now() - timedelta(days=age*365 + random.randint(0, 365))
        
        # Generate unique CID (13 digits)
        cid = f"{random.randint(1, 9)}{''.join([str(random.randint(0, 9)) for _ in range(12)])}"
        
        patient_data = {
            "first_name": first_name,
            "last_name": last_name,
            "cid": cid,  # Citizen ID as primary key
            "date_of_birth": birth_date.isoformat(),
            "gender": random.choice(["male", "female"]),
            "parent_email": generate_email(parent_first_name, parent_last_name),
            "parent_phone": generate_phone_number(),
            "emergency_contact": f"{parent_first_name} {parent_last_name}",
            "emergency_phone": generate_phone_number(),
            "address": generate_address(),
            "school": random.choice(THAI_SCHOOLS),
            "grade": random.choice(GRADE_LEVELS),
            "medical_history": generate_medical_history(),
            "family_vision_history": generate_family_vision_history(),
            "insurance_info": {
                "has_insurance": random.choice([True, False]),
                "insurance_provider": random.choice([None, "ประกันสังคม", "ประกันสุขภาพ", "ประกันเอกชน"]),
                "policy_number": f"POL{random.randint(100000, 999999)}" if random.choice([True, False]) else None
            },
            "consent_forms": {
                "screening_consent": True,
                "data_sharing_consent": random.choice([True, False]),
                "treatment_consent": True,
                "emergency_consent": True
            },
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": "system_seed",
            "audit_hash": f"patient_creation_{i}_{datetime.now().timestamp()}",
            "screening_history": [],
            "documents": [],
            # Photo fields (empty for now)
            "profile_photo": None,
            "extra_photos": [],
            "photo_metadata": {}
        }
        
        result = await patients_collection.insert_one(patient_data)
        
        if (i + 1) % 2 == 0:
            print(f"Created {i + 1} patients...")
    
    print(f"✅ Created {num_patients} patients successfully!")

async def main():
    """Main seeding function"""
    print("🚀 Starting Patient Seeding...")
    
    try:
        # Connect to MongoDB
        db = await connect_to_mongodb()
        print("✅ Connected to MongoDB")
        
        # Clear existing patient data (optional - comment out if you want to keep existing data)
        # await db.patients.delete_many({})
        # print("🗑️ Cleared existing patient data")
        
        # Create patients
        await create_patients(db, 10)
        
        # Print summary
        patients_count = await db.patients.count_documents({})
        
        print("\n📊 Seeding Summary:")
        print(f"   Patients: {patients_count}")
        print("\n✅ Patient seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        # Close connection
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(main())
