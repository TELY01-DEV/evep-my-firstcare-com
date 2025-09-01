#!/usr/bin/env python3
"""
Script to create additional parents for students
"""
import asyncio
import aiohttp
import json
import random
from datetime import datetime, timedelta

# Thai names for parents
THAI_FIRST_NAMES_MALE = [
    "สมชาย", "สมศักดิ์", "วิชัย", "ประยุทธ", "สมพงษ์", "สมเกียรติ", "สมบูรณ์", "สมาน", "สมหมาย", "สมพร",
    "สมคิด", "สมศักดิ์", "สมชาย", "สมเกียรติ", "สมบูรณ์", "สมาน", "สมหมาย", "สมพร", "สมคิด", "สมศักดิ์",
    "ธนวัฒน์", "ธนากร", "ธนพล", "ธนกฤต", "ธนวัฒน์", "ธนากร", "ธนพล", "ธนกฤต", "ธนวัฒน์", "ธนากร",
    "อภิชาติ", "อภิรักษ์", "อภิสิทธิ์", "อภิชัย", "อภิชาติ", "อภิรักษ์", "อภิสิทธิ์", "อภิชัย", "อภิชาติ", "อภิรักษ์"
]

THAI_LAST_NAMES_MALE = [
    "มุ่งมั่น", "พัฒนาการ", "ใจดี", "สุภาพ", "รักเรียน", "ขยัน", "อดทน", "ซื่อสัตย์", "มีน้ำใจ", "เก่งกล้า",
    "ฉลาด", "รอบรู้", "มีสติ", "มีปัญญา", "มีศีล", "มีธรรม", "มีคุณธรรม", "มีจริยธรรม", "มีมนุษยธรรม", "มีสันติ",
    "วัฒนา", "พัฒนา", "เจริญ", "ก้าวหน้า", "รุ่งเรือง", "เจริญรุ่งเรือง", "ก้าวหน้า", "พัฒนา", "เจริญ", "วัฒนา",
    "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข"
]

THAI_FIRST_NAMES_FEMALE = [
    "สมหญิง", "ดวงใจ", "รัตนา", "วันดี", "ศรีสุดา", "มาลี", "กมลา", "กัลยา", "กัลยาณี", "กัลยาณี",
    "สมหญิง", "ดวงใจ", "รัตนา", "วันดี", "ศรีสุดา", "มาลี", "กมลา", "กัลยา", "กัลยาณี", "กัลยาณี",
    "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา", "ธิดา",
    "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี", "อภิรดี"
]

THAI_LAST_NAMES_FEMALE = [
    "รักเรียน", "สวยงาม", "ใจดี", "สุภาพ", "ขยัน", "อดทน", "ซื่อสัตย์", "มีน้ำใจ", "เก่งกล้า", "ฉลาด",
    "รอบรู้", "มีสติ", "มีปัญญา", "มีศีล", "มีธรรม", "มีคุณธรรม", "มีจริยธรรม", "มีมนุษยธรรม", "มีสันติ", "วัฒนา",
    "พัฒนา", "เจริญ", "ก้าวหน้า", "รุ่งเรือง", "เจริญรุ่งเรือง", "ก้าวหน้า", "พัฒนา", "เจริญ", "วัฒนา", "ศรีสุข",
    "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข", "ศรีสุข"
]

OCCUPATIONS = [
    "พนักงานบริษัท", "ครู", "แพทย์", "พยาบาล", "วิศวกร", "สถาปนิก", "นักบัญชี", "นักกฎหมาย", "ทนายความ", "ตำรวจ",
    "ทหาร", "ข้าราชการ", "พนักงานรัฐวิสาหกิจ", "นักธุรกิจ", "พ่อค้า", "แม่ค้า", "เกษตรกร", "ช่าง", "ช่างไฟฟ้า", "ช่างประปา",
    "ช่างยนต์", "ช่างซ่อม", "พนักงานขาย", "พนักงานบริการ", "พนักงานโรงแรม", "พนักงานร้านอาหาร", "พนักงานขนส่ง", "พนักงานคลังสินค้า", "พนักงานผลิต", "พนักงานควบคุมคุณภาพ"
]

def generate_thai_cid():
    """Generate a realistic Thai Citizen ID"""
    # Format: 1-2345-67890-12-3
    digits = [random.randint(0, 9) for _ in range(12)]
    
    # Calculate check digit
    sum_val = 0
    for i in range(12):
        sum_val += digits[i] * (13 - i)
    check_digit = (11 - (sum_val % 11)) % 10
    digits.append(check_digit)
    
    return ''.join(map(str, digits))

def generate_birth_date():
    """Generate a realistic birth date for parents (25-60 years old)"""
    start_date = datetime.now() - timedelta(days=60*365)
    end_date = datetime.now() - timedelta(days=25*365)
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_date = start_date + timedelta(days=random_days)
    return random_date.strftime("%Y-%m-%d")

def generate_phone():
    """Generate a realistic Thai phone number"""
    prefixes = ["08", "09", "06"]
    prefix = random.choice(prefixes)
    number = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f"{prefix}{number}"

def generate_address():
    """Generate a realistic Thai address"""
    provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "นครราชสีมา", "ขอนแก่น", "อุบลราชธานี", "นครปฐม", "ชลบุรี", "ภูเก็ต", "สงขลา", "นครศรีธรรมราช"]
    districts = ["ดอนเมือง", "บางนา", "ลาดพร้าว", "ห้วยขวาง", "ดินแดง", "วัฒนา", "คลองเตย", "ยานนาวา", "สาทร", "บางรัก"]
    
    return {
        "house_no": str(random.randint(1, 9999)),
        "village_no": str(random.randint(1, 99)) if random.random() > 0.5 else None,
        "soi": f"สุขุมวิท {random.randint(1, 100)}",
        "road": f"ถนน{random.choice(['ลาดพร้าว', 'สุขุมวิท', 'รัชดาภิเษก', 'วิภาวดี', 'พระราม 9'])}",
        "subdistrict": f"แขวง{random.choice(['ดินแดง', 'ห้วยขวาง', 'คลองเตย', 'วัฒนา', 'บางนา'])}",
        "district": random.choice(districts),
        "province": random.choice(provinces),
        "postal_code": str(random.randint(10000, 99999))
    }

def generate_emergency_contact(first_name, last_name, relation):
    """Generate emergency contact information"""
    if relation == "มารดา":
        # Mother's emergency contact is usually the father
        emergency_name = f"นาย {random.choice(THAI_FIRST_NAMES_MALE)} {last_name}"
        emergency_relation = "บิดา"
    else:
        # Father's emergency contact is usually the mother
        emergency_name = f"นาง {random.choice(THAI_FIRST_NAMES_FEMALE)} {last_name}"
        emergency_relation = "มารดา"
    
    return {
        "name": emergency_name,
        "phone": generate_phone(),
        "relation": emergency_relation
    }

def generate_profile_photo():
    """Generate a DiceBear profile photo URL"""
    seed = random.randint(1000, 9999)
    style = random.choice(["personas", "avataaars", "initials", "bottts"])
    colors = ["4f46e5", "7c3aed", "059669", "dc2626", "f59e0b"]
    background_color = ",".join(random.sample(colors, 3))
    return f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor={background_color}"

async def create_additional_parents():
    """Create additional parents for students"""
    
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhiNDc0MjFjNTg1MjQyNzAwODIzMDIzIiwiZW1haWwiOiJkb2N0b3JAZXZlcC5jb20iLCJyb2xlIjoiZG9jdG9yIiwidG9rZW5fdHlwZSI6ImFjY2VzcyIsImV4cCI6MTc1Njc0MzU0NSwiaWF0IjoxNzU2NjU3MTQ1fQ.NUBOTgeIjX9MX3mctoqqNOudmjrtgS0SEADdU_RAWn8"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # We need to create parents for about 50 more students (assuming 2 parents per student)
    # Let's create 100 new parents (50 pairs)
    
    async with aiohttp.ClientSession() as session:
        created_count = 0
        
        for i in range(50):  # Create 50 pairs of parents
            # Create father
            father_data = {
                "first_name": random.choice(THAI_FIRST_NAMES_MALE),
                "last_name": random.choice(THAI_LAST_NAMES_MALE),
                "cid": generate_thai_cid(),
                "birth_date": generate_birth_date(),
                "gender": "male",
                "phone": generate_phone(),
                "email": f"father{i+6}@email.com",
                "relation": "บิดา",
                "occupation": random.choice(OCCUPATIONS),
                "profile_photo": generate_profile_photo(),
                "address": generate_address(),
                "emergency_contact": {
                    "name": f"นาง {random.choice(THAI_FIRST_NAMES_FEMALE)} {random.choice(THAI_LAST_NAMES_FEMALE)}",
                    "phone": generate_phone(),
                    "relation": "มารดา"
                }
            }
            
            try:
                async with session.post(
                    "http://localhost:8014/api/v1/evep/parents",
                    headers=headers,
                    json=father_data
                ) as response:
                    if response.status == 200:
                        created_count += 1
                        print(f"✅ Created father {i+1}: {father_data['first_name']} {father_data['last_name']}")
                    else:
                        print(f"❌ Failed to create father {i+1}: {response.status}")
            except Exception as e:
                print(f"❌ Error creating father {i+1}: {e}")
            
            # Create mother
            mother_data = {
                "first_name": random.choice(THAI_FIRST_NAMES_FEMALE),
                "last_name": random.choice(THAI_LAST_NAMES_FEMALE),
                "cid": generate_thai_cid(),
                "birth_date": generate_birth_date(),
                "gender": "female",
                "phone": generate_phone(),
                "email": f"mother{i+6}@email.com",
                "relation": "มารดา",
                "occupation": random.choice(OCCUPATIONS),
                "profile_photo": generate_profile_photo(),
                "address": generate_address(),
                "emergency_contact": {
                    "name": f"นาย {random.choice(THAI_FIRST_NAMES_MALE)} {random.choice(THAI_LAST_NAMES_MALE)}",
                    "phone": generate_phone(),
                    "relation": "บิดา"
                }
            }
            
            try:
                async with session.post(
                    "http://localhost:8014/api/v1/evep/parents",
                    headers=headers,
                    json=mother_data
                ) as response:
                    if response.status == 200:
                        created_count += 1
                        print(f"✅ Created mother {i+1}: {mother_data['first_name']} {mother_data['last_name']}")
                    else:
                        print(f"❌ Failed to create mother {i+1}: {response.status}")
            except Exception as e:
                print(f"❌ Error creating mother {i+1}: {e}")
        
        print(f"\n🎉 Created {created_count} new parents!")
        print("Now you should have enough parents for all students.")

if __name__ == "__main__":
    asyncio.run(create_additional_parents())
