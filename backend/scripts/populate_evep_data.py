#!/usr/bin/env python3
"""
Script to populate EVEP database with sample data
"""

import asyncio
import sys
import os
from datetime import date, datetime
from bson import ObjectId

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database
from app.models.evep_models import Parent, Student, Teacher, School

async def populate_evep_data():
    """Populate EVEP database with sample data"""
    db = get_database()
    
    print("🚀 Starting EVEP data population...")
    
    # Clear existing data
    print("🧹 Clearing existing EVEP data...")
    await db.evep.parents.delete_many({})
    await db.evep.schools.delete_many({})
    await db.evep.teachers.delete_many({})
    await db.evep.students.delete_many({})
    
    # Sample Schools
    print("🏫 Creating sample schools...")
    schools_data = [
        {
            "school_code": "SCH001",
            "name": "โรงเรียนอนุบาลกรุงเทพ",
            "type": "อนุบาล",
            "address": {
                "house_no": "123",
                "village_no": "45",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "phone": "02-123-4567",
            "email": "info@bangkok-kindergarten.ac.th",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "school_code": "SCH002",
            "name": "โรงเรียนประถมศึกษาสาธิต",
            "type": "ประถมศึกษา",
            "address": {
                "house_no": "456",
                "village_no": "78",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "phone": "02-234-5678",
            "email": "info@demo-primary.ac.th",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "school_code": "SCH003",
            "name": "โรงเรียนมัธยมศึกษานครหลวง",
            "type": "มัธยมศึกษา",
            "address": {
                "house_no": "789",
                "village_no": "12",
                "soi": "ลาดพร้าว",
                "road": "ลาดพร้าว",
                "subdistrict": "ลาดพร้าว",
                "district": "ลาดพร้าว",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10310"
            },
            "phone": "02-345-6789",
            "email": "info@bangkok-high.ac.th",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    school_results = await db.evep.schools.insert_many(schools_data)
    school_ids = school_results.inserted_ids
    print(f"✅ Created {len(school_ids)} schools")
    
    # Sample Parents
    print("👨‍👩‍👧‍👦 Creating sample parents...")
    parents_data = [
        {
            "first_name": "สมชาย",
            "last_name": "ใจดี",
            "cid": "1234567890123",
            "birth_date": datetime(1980, 5, 15),
            "gender": "M",
            "phone": "081-123-4567",
            "email": "somchai@email.com",
            "relation": "บิดา",
            "occupation": "วิศวกร",
            "income_level": "middle",
            "address": {
                "house_no": "10",
                "village_no": "5",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "emergency_contact": {
                "name": "สมหญิง ใจดี",
                "phone": "081-234-5678",
                "relation": "มารดา"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "สมหญิง",
            "last_name": "ใจดี",
            "cid": "1234567890124",
            "birth_date": datetime(1982, 8, 20),
            "gender": "F",
            "phone": "081-234-5678",
            "email": "somying@email.com",
            "relation": "มารดา",
            "occupation": "ครู",
            "income_level": "middle",
            "address": {
                "house_no": "10",
                "village_no": "5",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "emergency_contact": {
                "name": "สมชาย ใจดี",
                "phone": "081-123-4567",
                "relation": "บิดา"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "ประยุทธ",
            "last_name": "รักเรียน",
            "cid": "1234567890125",
            "birth_date": datetime(1978, 3, 10),
            "gender": "M",
            "phone": "081-345-6789",
            "email": "prayut@email.com",
            "relation": "บิดา",
            "occupation": "แพทย์",
            "income_level": "high",
            "address": {
                "house_no": "25",
                "village_no": "8",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "emergency_contact": {
                "name": "ประภา รักเรียน",
                "phone": "081-456-7890",
                "relation": "มารดา"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "ประภา",
            "last_name": "รักเรียน",
            "cid": "1234567890126",
            "birth_date": datetime(1981, 12, 5),
            "gender": "F",
            "phone": "081-456-7890",
            "email": "prapa@email.com",
            "relation": "มารดา",
            "occupation": "พยาบาล",
            "income_level": "high",
            "address": {
                "house_no": "25",
                "village_no": "8",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "emergency_contact": {
                "name": "ประยุทธ รักเรียน",
                "phone": "081-345-6789",
                "relation": "บิดา"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "วิชัย",
            "last_name": "มุ่งมั่น",
            "cid": "1234567890127",
            "birth_date": datetime(1975, 7, 25),
            "gender": "M",
            "phone": "081-567-8901",
            "email": "wichai@email.com",
            "relation": "บิดา",
            "occupation": "นักธุรกิจ",
            "income_level": "high",
            "address": {
                "house_no": "50",
                "village_no": "15",
                "soi": "ลาดพร้าว",
                "road": "ลาดพร้าว",
                "subdistrict": "ลาดพร้าว",
                "district": "ลาดพร้าว",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10310"
            },
            "emergency_contact": {
                "name": "วิภา มุ่งมั่น",
                "phone": "081-678-9012",
                "relation": "มารดา"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    parent_results = await db.evep.parents.insert_many(parents_data)
    parent_ids = parent_results.inserted_ids
    print(f"✅ Created {len(parent_ids)} parents")
    
    # Sample Teachers
    print("👨‍🏫 Creating sample teachers...")
    teachers_data = [
        {
            "first_name": "ครูสมศรี",
            "last_name": "สอนดี",
            "cid": "9876543210123",
            "birth_date": datetime(1985, 4, 12),
            "gender": "F",
            "phone": "082-111-2222",
            "email": "somsri@school.ac.th",
            "school": "โรงเรียนอนุบาลกรุงเทพ",
            "position": "ครูประจำชั้น",
            "school_year": "2567",
            "work_address": {
                "house_no": "123",
                "village_no": "45",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "ครูประจักษ์",
            "last_name": "วิชาการ",
            "cid": "9876543210124",
            "birth_date": datetime(1983, 9, 18),
            "gender": "M",
            "phone": "082-222-3333",
            "email": "prajak@school.ac.th",
            "school": "โรงเรียนประถมศึกษาสาธิต",
            "position": "ครูวิทยาศาสตร์",
            "school_year": "2567",
            "work_address": {
                "house_no": "456",
                "village_no": "78",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "ครูรัตนา",
            "last_name": "ศิลปะ",
            "cid": "9876543210125",
            "birth_date": datetime(1987, 11, 30),
            "gender": "F",
            "phone": "082-333-4444",
            "email": "rattana@school.ac.th",
            "school": "โรงเรียนมัธยมศึกษานครหลวง",
            "position": "ครูศิลปะ",
            "school_year": "2567",
            "work_address": {
                "house_no": "789",
                "village_no": "12",
                "soi": "ลาดพร้าว",
                "road": "ลาดพร้าว",
                "subdistrict": "ลาดพร้าว",
                "district": "ลาดพร้าว",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10310"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "first_name": "ครูสมชาย",
            "last_name": "พลศึกษา",
            "cid": "9876543210126",
            "birth_date": datetime(1980, 6, 22),
            "gender": "M",
            "phone": "082-444-5555",
            "email": "somchai.pe@school.ac.th",
            "school": "โรงเรียนมัธยมศึกษานครหลวง",
            "position": "ครูพลศึกษา",
            "school_year": "2567",
            "work_address": {
                "house_no": "789",
                "village_no": "12",
                "soi": "ลาดพร้าว",
                "road": "ลาดพร้าว",
                "subdistrict": "ลาดพร้าว",
                "district": "ลาดพร้าว",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10310"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    teacher_results = await db.evep.teachers.insert_many(teachers_data)
    teacher_ids = teacher_results.inserted_ids
    print(f"✅ Created {len(teacher_ids)} teachers")
    
    # Sample Students
    print("👨‍🎓 Creating sample students...")
    students_data = [
        {
            "title": "เด็กชาย",
            "first_name": "ดวงใจ",
            "last_name": "ใจดี",
            "cid": "1111111111111",
            "birth_date": datetime(2018, 3, 15),
            "gender": "M",
            "student_code": "STU001",
            "school_name": "โรงเรียนอนุบาลกรุงเทพ",
            "grade_level": "อนุบาล 3",
            "grade_number": "3",
            "address": {
                "house_no": "10",
                "village_no": "5",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "disease": None,
            "parent_id": str(parent_ids[0]),  # สมชาย ใจดี
            "consent_document": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "เด็กหญิง",
            "first_name": "ดวงดาว",
            "last_name": "ใจดี",
            "cid": "1111111111112",
            "birth_date": datetime(2016, 7, 22),
            "gender": "F",
            "student_code": "STU002",
            "school_name": "โรงเรียนประถมศึกษาสาธิต",
            "grade_level": "ประถมศึกษา",
            "grade_number": "2",
            "address": {
                "house_no": "10",
                "village_no": "5",
                "soi": "สุขุมวิท",
                "road": "สุขุมวิท",
                "subdistrict": "คลองเตย",
                "district": "คลองเตย",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "disease": "ภูมิแพ้",
            "parent_id": str(parent_ids[0]),  # สมชาย ใจดี
            "consent_document": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "เด็กชาย",
            "first_name": "ปัญญา",
            "last_name": "รักเรียน",
            "cid": "1111111111113",
            "birth_date": datetime(2015, 12, 8),
            "gender": "M",
            "student_code": "STU003",
            "school_name": "โรงเรียนประถมศึกษาสาธิต",
            "grade_level": "ประถมศึกษา",
            "grade_number": "3",
            "address": {
                "house_no": "25",
                "village_no": "8",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "disease": None,
            "parent_id": str(parent_ids[2]),  # ประยุทธ รักเรียน
            "consent_document": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "เด็กหญิง",
            "first_name": "ปัญญา",
            "last_name": "รักเรียน",
            "cid": "1111111111114",
            "birth_date": datetime(2013, 5, 14),
            "gender": "F",
            "student_code": "STU004",
            "school_name": "โรงเรียนมัธยมศึกษานครหลวง",
            "grade_level": "มัธยมศึกษา",
            "grade_number": "1",
            "address": {
                "house_no": "25",
                "village_no": "8",
                "soi": "รัชดาภิเษก",
                "road": "รัชดาภิเษก",
                "subdistrict": "ดินแดง",
                "district": "ดินแดง",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10400"
            },
            "disease": "สายตาสั้น",
            "parent_id": str(parent_ids[2]),  # ประยุทธ รักเรียน
            "consent_document": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "เด็กชาย",
            "first_name": "มุ่งมั่น",
            "last_name": "มุ่งมั่น",
            "cid": "1111111111115",
            "birth_date": datetime(2012, 9, 30),
            "gender": "M",
            "student_code": "STU005",
            "school_name": "โรงเรียนมัธยมศึกษานครหลวง",
            "grade_level": "มัธยมศึกษา",
            "grade_number": "2",
            "address": {
                "house_no": "50",
                "village_no": "15",
                "soi": "ลาดพร้าว",
                "road": "ลาดพร้าว",
                "subdistrict": "ลาดพร้าว",
                "district": "ลาดพร้าว",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10310"
            },
            "disease": None,
            "parent_id": str(parent_ids[4]),  # วิชัย มุ่งมั่น
            "consent_document": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    student_results = await db.evep.students.insert_many(students_data)
    student_ids = student_results.inserted_ids
    print(f"✅ Created {len(student_ids)} students")
    
    print("\n🎉 EVEP data population completed successfully!")
    print(f"📊 Summary:")
    print(f"   - Schools: {len(school_ids)}")
    print(f"   - Parents: {len(parent_ids)}")
    print(f"   - Teachers: {len(teacher_ids)}")
    print(f"   - Students: {len(student_ids)}")
    print("\n🔗 Relationships:")
    print(f"   - Students linked to parents via parent_id")
    print(f"   - Students and teachers linked to schools via school_name")
    print(f"   - Emergency contacts configured for all parents")

if __name__ == "__main__":
    asyncio.run(populate_evep_data())
