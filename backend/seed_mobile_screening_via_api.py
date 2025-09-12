#!/usr/bin/env python3
"""
Seed mobile screening data by converting existing students to patients via API
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import random

# API Configuration
API_BASE_URL = "http://backend:8000/api/v1"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

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

def generate_medical_history() -> dict:
    """Generate realistic medical history"""
    return {
        "vision_problems": random.choice([True, False]),
        "previous_screenings": random.randint(0, 3),
        "family_vision_history": random.choice([True, False]),
        "chronic_conditions": random.choice([None, "เบาหวาน", "ความดันโลหิตสูง", "หอบหืด"]),
        "medications": random.choice([None, "ยารักษาสายตา", "ยาความดัน", "ยาหอบหืด"]),
        "last_eye_exam": random.choice([None, "1 ปีที่แล้ว", "2 ปีที่แล้ว", "3 ปีที่แล้ว", "ไม่เคยตรวจ"])
    }

def generate_family_vision_history() -> dict:
    """Generate family vision history"""
    return {
        "father_vision": random.choice(["ปกติ", "สายตาสั้น", "สายตายาว", "ไม่ทราบ"]),
        "mother_vision": random.choice(["ปกติ", "สายตาสั้น", "สายตายาว", "ไม่ทราบ"]),
        "siblings_vision": random.choice(["ปกติ", "มีปัญหาสายตา", "ไม่ทราบ"]),
        "grandparents_vision": random.choice(["ปกติ", "มีปัญหาสายตา", "ไม่ทราบ"])
    }

async def get_auth_token(session: aiohttp.ClientSession) -> str:
    """Get authentication token"""
    try:
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        async with session.post(f"{API_BASE_URL}/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("access_token")
            else:
                print(f"❌ Login failed: {response.status}")
                return None
    except Exception as e:
        print(f"❌ Error getting auth token: {e}")
        return None

async def get_students(session: aiohttp.ClientSession, token: str) -> list:
    """Get existing students via API"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(f"{API_BASE_URL}/evep/students", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("students", [])
            else:
                print(f"❌ Failed to get students: {response.status}")
                return []
    except Exception as e:
        print(f"❌ Error getting students: {e}")
        return []

async def create_patient_from_student(session: aiohttp.ClientSession, token: str, student: dict) -> bool:
    """Create a patient from student data via API"""
    try:
        # Generate parent data
        parent_first_name = random.choice(THAI_FIRST_NAMES)
        parent_last_name = random.choice(THAI_LAST_NAMES)
        
        # Convert student gender to English
        gender_mapping = {"ชาย": "male", "หญิง": "female"}
        gender = gender_mapping.get(student.get("gender", "ชาย"), "male")
        
        # Generate unique CID (13 digits)
        cid = f"{random.randint(1, 9)}{''.join([str(random.randint(0, 9)) for _ in range(12)])}"
        
        patient_data = {
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "cid": cid,  # Use student's CID or generate new one
            "date_of_birth": student.get("birth_date", ""),
            "gender": gender,
            "parent_email": generate_email(parent_first_name, parent_last_name),
            "parent_phone": generate_phone_number(),
            "emergency_contact": f"{parent_first_name} {parent_last_name}",
            "emergency_phone": generate_phone_number(),
            "address": generate_address(),
            "school": student.get("school_name", ""),
            "grade": student.get("grade_level", ""),
            "medical_history": generate_medical_history(),
            "family_vision_history": generate_family_vision_history(),
            "insurance_info": {
                "has_insurance": random.choice([True, False]),
                "insurance_provider": random.choice([None, "ประกันสังคม", "ประกันสุขภาพ", "ประกันเอกชน"]),
                "policy_number": f"POL{random.randint(100000, 999999)}" if random.choice([True, False]) else None
            },
            "consent_forms": {
                "screening_consent": student.get("consent_document", False),
                "data_sharing_consent": random.choice([True, False]),
                "treatment_consent": True,
                "emergency_consent": True
            }
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with session.post(f"{API_BASE_URL}/patients", json=patient_data, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Created patient: {patient_data['first_name']} {patient_data['last_name']} - CID: {cid}")
                return True
            else:
                error_data = await response.text()
                print(f"❌ Failed to create patient: {response.status} - {error_data}")
                return False
                
    except Exception as e:
        print(f"❌ Error creating patient: {e}")
        return False

async def main():
    """Main seeding function"""
    print("🚀 Starting Mobile Screening Seeding via API...")
    
    async with aiohttp.ClientSession() as session:
        # Get authentication token
        print("🔐 Getting authentication token...")
        token = await get_auth_token(session)
        if not token:
            print("❌ Failed to get authentication token")
            return
        
        print("✅ Authentication successful")
        
        # Get existing students
        print("📚 Fetching existing students...")
        students = await get_students(session, token)
        print(f"📊 Found {len(students)} students")
        
        if len(students) == 0:
            print("❌ No students found")
            return
        
        # Convert students to patients
        print("🔄 Converting students to patients...")
        success_count = 0
        
        for i, student in enumerate(students):
            print(f"Processing student {i+1}/{len(students)}: {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')}")
            
            if await create_patient_from_student(session, token, student):
                success_count += 1
            
            # Add small delay to avoid overwhelming the API
            await asyncio.sleep(0.1)
        
        # If we have fewer students than expected, create additional patients from our seeded data
        if len(students) < 50:
            print(f"\n📝 Creating additional patients to reach 50 total...")
            additional_needed = 50 - len(students)
            
            # Use our seeded student data to create additional patients
            for i in range(additional_needed):
                # Generate a new patient with realistic data
                first_name = random.choice(THAI_FIRST_NAMES)
                last_name = random.choice(THAI_LAST_NAMES)
                school = random.choice(THAI_SCHOOLS)
                grade = random.choice(GRADE_LEVELS)
                
                # Generate unique CID (13 digits)
                cid = f"{random.randint(1, 9)}{''.join([str(random.randint(0, 9)) for _ in range(12)])}"
                
                # Generate parent data
                parent_first_name = random.choice(THAI_FIRST_NAMES)
                parent_last_name = random.choice(THAI_LAST_NAMES)
                
                # Generate date of birth (6-18 years old)
                age = random.randint(6, 18)
                birth_date = datetime.now() - timedelta(days=age*365 + random.randint(0, 365))
                
                patient_data = {
                    "first_name": first_name,
                    "last_name": last_name,
                    "cid": cid,
                    "date_of_birth": birth_date.isoformat(),
                    "gender": random.choice(["male", "female"]),
                    "parent_email": generate_email(parent_first_name, parent_last_name),
                    "parent_phone": generate_phone_number(),
                    "emergency_contact": f"{parent_first_name} {parent_last_name}",
                    "emergency_phone": generate_phone_number(),
                    "address": generate_address(),
                    "school": school,
                    "grade": grade,
                    "medical_history": generate_medical_history(),
                    "family_vision_history": generate_family_vision_history(),
                    "insurance_info": {
                        "has_insurance": random.choice([True, False]),
                        "insurance_provider": random.choice([None, "ประกันสังคม", "ประกันสุขภาพ", "ประกันเอกชน"]),
                        "policy_number": f"POL{random.randint(100000, 999999)}" if random.choice([True, False]) else None
                    },
                    "consent_forms": {
                        "screening_consent": random.choice([True, False]),
                        "data_sharing_consent": random.choice([True, False]),
                        "treatment_consent": True,
                        "emergency_consent": True
                    }
                }
                
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                async with session.post(f"{API_BASE_URL}/patients", json=patient_data, headers=headers) as response:
                    if response.status == 200:
                        success_count += 1
                        print(f"✅ Created additional patient: {first_name} {last_name} - CID: {cid}")
                    else:
                        error_data = await response.text()
                        print(f"❌ Failed to create additional patient: {response.status} - {error_data}")
                
                # Add small delay
                await asyncio.sleep(0.1)
        
        print(f"\n📈 Seeding Summary:")
        print(f"   Students processed: {len(students)}")
        print(f"   Patients created: {success_count}")
        print(f"   Success rate: {(success_count/len(students)*100):.1f}%")
        
        # Verify the results
        print("\n🔍 Verifying results...")
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(f"{API_BASE_URL}/patients", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                total_patients = len(data)
                print(f"   Total patients in system: {total_patients}")
            else:
                print(f"   Could not verify patient count: {response.status}")
        
        print("\n✅ Mobile screening seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
