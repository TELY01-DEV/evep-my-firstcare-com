#!/usr/bin/env python3
from pymongo import MongoClient
from bson import ObjectId
import random
from datetime import datetime, timedelta

def populate_evep_data():
    """Populate evep collections with comprehensive realistic data"""
    
    client = MongoClient('mongodb://mongo-primary:27017')
    db = client.evep
    
    print("=== POPULATING EVEP COLLECTIONS ===")
    
    # Clear existing data (except students)
    print("Clearing existing data...")
    db['evep.parents'].delete_many({})
    db['evep.teachers'].delete_many({})
    db['evep.schools'].delete_many({})
    
    # Create schools
    print("Creating schools...")
    schools = create_schools()
    for school in schools:
        db['evep.schools'].insert_one(school)
    
    # Create teachers
    print("Creating teachers...")
    teachers = create_teachers(schools)
    for teacher in teachers:
        db['evep.teachers'].insert_one(teacher)
    
    # Create parents
    print("Creating parents...")
    parents = create_parents()
    for parent in parents:
        db['evep.parents'].insert_one(parent)
    
    # Update students with proper teacher and school assignments
    print("Updating students with teacher and school assignments...")
    update_students_with_assignments(db, teachers, schools)
    
    print("\n=== FINAL STATUS ===")
    print(f"evep.schools: {db['evep.schools'].count_documents({})} documents")
    print(f"evep.teachers: {db['evep.teachers'].count_documents({})} documents")
    print(f"evep.parents: {db['evep.parents'].count_documents({})} documents")
    print(f"evep.students: {db['evep.students'].count_documents({})} documents")
    
    client.close()

def create_schools():
    """Create realistic school data"""
    
    school_types = ["รัฐบาล", "เอกชน", "นานาชาติ", "สาธิตมหาวิทยาลัย"]
    provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต", "ชลบุรี", "นครราชสีมา"]
    
    schools = []
    for i in range(15):
        school_type = random.choice(school_types)
        province = random.choice(provinces)
        
        school = {
            "_id": ObjectId(),
            "name": f"โรงเรียน{'นานาชาติ' if school_type == 'นานาชาติ' else ''}{get_school_name(i)}",
            "type": school_type,
            "school_code": f"SCH{str(i+1).zfill(3)}",
            "address": {
                "street": f"{random.randint(1, 999)} ถนน{'สุขุมวิท' if province == 'กรุงเทพมหานคร' else 'หลักเมือง'}",
                "district": random.choice(["วัฒนา", "คลองเตย", "พระโขนง", "บางนา", "ลาดกระบัง"]),
                "city": province,
                "province": province,
                "postal_code": f"{random.randint(10000, 99999)}"
            },
            "phone": f"02-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "email": f"info@school{i+1}.edu.th",
            "website": f"https://www.school{i+1}.edu.th",
            "principal": f"ดร. {get_thai_name()}",
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        schools.append(school)
    
    return schools

def create_teachers(schools):
    """Create realistic teacher data"""
    
    subjects = ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "สังคมศึกษา", "ศิลปะ", "พลศึกษา", "คอมพิวเตอร์"]
    grade_levels = ["อนุบาล", "ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย"]
    
    teachers = []
    for i in range(25):
        school = random.choice(schools)
        teacher = {
            "_id": ObjectId(),
            "title": random.choice(["ครู", "อาจารย์", "ดร."]),
            "first_name": get_thai_name(),
            "last_name": get_thai_name(),
            "cid": f"{random.randint(1000000000000, 9999999999999)}",
            "birth_date": f"{random.randint(1970, 1990)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "gender": str(random.randint(1, 2)),
            "phone": f"08{random.randint(10000000, 99999999)}",
            "email": f"teacher{i+1}@school.edu.th",
            "school": school["name"],
            "subject": random.choice(subjects),
            "grade_level": random.choice(grade_levels),
            "address": {
                "street": f"{random.randint(1, 999)} ถนน{'สุขุมวิท' if 'กรุงเทพ' in school['address']['province'] else 'หลักเมือง'}",
                "district": random.choice(["วัฒนา", "คลองเตย", "พระโขนง", "บางนา", "ลาดกระบัง"]),
                "city": school["address"]["province"],
                "province": school["address"]["province"],
                "postal_code": f"{random.randint(10000, 99999)}"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        teachers.append(teacher)
    
    return teachers

def create_parents():
    """Create realistic parent data"""
    
    relations = ["father", "mother", "guardian"]
    
    parents = []
    for i in range(60):
        parent = {
            "_id": ObjectId(),
            "title": random.choice(["คุณ", "นาย", "นาง", "นางสาว"]),
            "first_name": get_thai_name(),
            "last_name": get_thai_name(),
            "cid": f"{random.randint(1000000000000, 9999999999999)}",
            "birth_date": f"{random.randint(1960, 1990)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "gender": str(random.randint(1, 2)),
            "relation": random.choice(relations),
            "phone": f"08{random.randint(10000000, 99999999)}",
            "email": f"parent{i+1}@example.com",
            "address": {
                "street": f"{random.randint(1, 999)} ถนน{'สุขุมวิท' if random.choice([True, False]) else 'หลักเมือง'}",
                "district": random.choice(["วัฒนา", "คลองเตย", "พระโขนง", "บางนา", "ลาดกระบัง"]),
                "city": random.choice(["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต", "ชลบุรี", "นครราชสีมา"]),
                "province": random.choice(["กรุงเทพมหานคร", "เชียงใหม่", "ภูเก็ต", "ชลบุรี", "นครราชสีมา"]),
                "postal_code": f"{random.randint(10000, 99999)}"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        parents.append(parent)
    
    return parents

def update_students_with_assignments(db, teachers, schools):
    """Update students with proper teacher and school assignments"""
    
    students = list(db['evep.students'].find({}))
    
    for student in students:
        # Assign random teacher
        teacher = random.choice(teachers)
        
        # Assign school based on teacher's school
        school = next((s for s in schools if s["name"] == teacher["school"]), random.choice(schools))
        
        # Update student
        db['evep.students'].update_one(
            {"_id": student["_id"]},
            {
                "$set": {
                    "teacher_id": str(teacher["_id"]),
                    "school_name": school["name"],
                    "updated_at": datetime.now().isoformat()
                }
            }
        )

def get_school_name(index):
    """Generate realistic school names"""
    school_names = [
        "บดินทรเดชา", "สาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ", "มหิดลวิทยานุสรณ์",
        "สาธิตมหาวิทยาลัยบูรพา", "วิทยาศาสตร์จุฬาภรณราชวิทยาลัย", "เตรียมอุดมศึกษา",
        "สวนกุหลาบวิทยาลัย", "เทพศิรินทร์", "สตรีวิทยา", "เบญจมราชาลัย",
        "อัสสัมชัญ", "เซนต์คาเบรียล", "เซนต์ฟรังซีสซาเวียร์", "เซนต์โยเซฟคอนเวนต์",
        "เซนต์ดอมินิก"
    ]
    return school_names[index % len(school_names)]

def get_thai_name():
    """Generate realistic Thai names"""
    first_names = [
        "สมชาย", "สมหญิง", "วิชัย", "วิชา", "สมบูรณ์", "สมศรี", "สมศักดิ์", "สมปอง",
        "สมพร", "สมหมาย", "สมนึก", "สมใจ", "สมศิริ", "สมเกียรติ", "สมชาย", "สมหญิง",
        "วิชัย", "วิชา", "สมบูรณ์", "สมศรี", "สมศักดิ์", "สมปอง", "สมพร", "สมหมาย"
    ]
    last_names = [
        "วงศ์เงิน", "วงศ์ทอง", "วงศ์สวัสดิ์", "วงศ์ใหญ่", "วงศ์เล็ก", "วงศ์กลาง",
        "วงศ์นอก", "วงศ์ใน", "วงศ์เหนือ", "วงศ์ใต้", "วงศ์ตะวันออก", "วงศ์ตะวันตก",
        "วงศ์กลาง", "วงศ์รอบ", "วงศ์วง", "วงศ์แถว", "วงศ์แถว", "วงศ์แถว"
    ]
    return random.choice(first_names) + " " + random.choice(last_names)

if __name__ == "__main__":
    populate_evep_data()
