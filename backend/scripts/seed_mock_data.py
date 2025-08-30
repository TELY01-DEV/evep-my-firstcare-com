#!/usr/bin/env python3
"""
Database Seeding Script for EVEP System
Populates the database with Thai mock data for development and testing
"""

import sys
import os
import asyncio
from datetime import datetime, date, timedelta
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database
from app.core.config import settings
from app.models.evep_models import Student, Teacher, School, Parent
from app.models.mobile_screening_models import MobileScreeningSession, GlassesPrescription
from app.api.glasses_inventory import GlassesItemCreate
from app.api.screenings import ScreeningSessionCreate, ScreeningResult

async def seed_students(db):
    """Seed students with Thai names and data"""
    students_data = [
        {
            "title": "เด็กชาย",
            "first_name": "สมชาย",
            "last_name": "ใจดี",
            "cid": "1234567890123",
            "birth_date": "2010-05-15",
            "gender": "male",
            "student_code": "STU001",
            "school_name": "โรงเรียนนานาชาติกรุงเทพ",
            "grade_level": "ประถมศึกษา",
            "grade_number": "5",
            "address": {
                "house_no": "123",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "parent_id": "parent_001",
            "consent_document": True,
            "status": "active"
        },
        {
            "title": "เด็กหญิง",
            "first_name": "สมหญิง",
            "last_name": "รักเรียน",
            "cid": "1234567890124",
            "birth_date": "2009-08-22",
            "gender": "female",
            "student_code": "STU002",
            "school_name": "โรงเรียนนานาชาติเซนต์แอนดรูว์",
            "grade_level": "ประถมศึกษา",
            "grade_number": "6",
            "address": {
                "house_no": "456",
                "soi": "สุขุมวิท 107",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "parent_id": "parent_002",
            "consent_document": True,
            "status": "active"
        },
        {
            "title": "เด็กหญิง",
            "first_name": "ดวงใจ",
            "last_name": "สวยงาม",
            "cid": "1234567890125",
            "birth_date": "2011-03-10",
            "gender": "female",
            "student_code": "STU003",
            "school_name": "โรงเรียนนานาชาตินิสท์",
            "grade_level": "ประถมศึกษา",
            "grade_number": "4",
            "address": {
                "house_no": "789",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "parent_id": "parent_003",
            "consent_document": True,
            "status": "active"
        },
        {
            "title": "เด็กชาย",
            "first_name": "วิชัย",
            "last_name": "มุ่งมั่น",
            "cid": "1234567890126",
            "birth_date": "2010-12-03",
            "gender": "male",
            "student_code": "STU004",
            "school_name": "โรงเรียนนานาชาติกรุงเทพ",
            "grade_level": "ประถมศึกษา",
            "grade_number": "5",
            "address": {
                "house_no": "321",
                "soi": "สุขุมวิท 55",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "parent_id": "parent_004",
            "consent_document": True,
            "status": "active"
        },
        {
            "title": "เด็กชาย",
            "first_name": "สมศักดิ์",
            "last_name": "พัฒนาการ",
            "cid": "1234567890127",
            "birth_date": "2009-06-18",
            "gender": "male",
            "student_code": "STU005",
            "school_name": "โรงเรียนนานาชาติเซนต์แอนดรูว์",
            "grade_level": "ประถมศึกษา",
            "grade_number": "6",
            "address": {
                "house_no": "654",
                "soi": "สุขุมวิท 101",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "parent_id": "parent_005",
            "consent_document": True,
            "status": "active"
        }
    ]
    
    for student_data in students_data:
        student = Student(**student_data)
        # Convert the model to dict and handle date serialization
        student_dict = student.model_dump()
        # Convert date objects to strings for MongoDB
        if 'birth_date' in student_dict and isinstance(student_dict['birth_date'], date):
            student_dict['birth_date'] = student_dict['birth_date'].isoformat()
        db.evep.students.insert_one(student_dict)
    
    print(f"✅ Seeded {len(students_data)} students")

async def seed_schools(db):
    """Seed schools with Thai data"""
    schools_data = [
        {
            "school_code": "SCH001",
            "name": "โรงเรียนนานาชาติกรุงเทพ",
            "type": "นานาชาติ",
            "address": {
                "house_no": "123",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "phone": "+66-2-123-4567",
            "email": "info@bangkokpatana.ac.th",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "school_code": "SCH002",
            "name": "โรงเรียนนานาชาติเซนต์แอนดรูว์",
            "type": "นานาชาติ",
            "address": {
                "house_no": "9",
                "soi": "สุขุมวิท 107",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "phone": "+66-2-234-5678",
            "email": "info@standrews.ac.th",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "school_code": "SCH003",
            "name": "โรงเรียนนานาชาตินิสท์",
            "type": "นานาชาติ",
            "address": {
                "house_no": "36",
                "village_no": "",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "phone": "+66-2-345-6789",
            "email": "info@nist.ac.th",
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    for school_data in schools_data:
        school = School(**school_data)
        db.evep.schools.insert_one(school.model_dump())
    
    print(f"✅ Seeded {len(schools_data)} schools")

async def seed_teachers(db):
    """Seed teachers with Thai data"""
    teachers_data = [
        {
            "first_name": "ดร. สมหญิง",
            "last_name": "จอห์นสัน",
            "cid": "1234567890128",
            "birth_date": "1985-03-15",
            "gender": "female",
            "phone": "+66-81-234-5678",
            "email": "sarah.johnson@evep.com",
            "school": "โรงเรียนนานาชาติกรุงเทพ",
            "position": "พยาบาลโรงเรียน",
            "work_address": {
                "house_no": "123",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "status": "active"
        },
        {
            "first_name": "ดร. ไมเคิล",
            "last_name": "เฉิน",
            "cid": "1234567890129",
            "birth_date": "1980-08-22",
            "gender": "male",
            "phone": "+66-82-345-6789",
            "email": "michael.chen@evep.com",
            "school": "โรงเรียนนานาชาติเซนต์แอนดรูว์",
            "position": "ผู้ประสานงานสุขภาพ",
            "work_address": {
                "house_no": "9",
                "soi": "สุขุมวิท 107",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "status": "active"
        },
        {
            "first_name": "พยาบาล",
            "last_name": "ลิซ่า ทอมป์สัน",
            "cid": "1234567890130",
            "birth_date": "1990-12-10",
            "gender": "female",
            "phone": "+66-83-456-7890",
            "email": "lisa.thompson@evep.com",
            "school": "โรงเรียนนานาชาตินิสท์",
            "position": "พยาบาลโรงเรียน",
            "work_address": {
                "house_no": "36",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "status": "active"
        }
    ]
    
    for teacher_data in teachers_data:
        teacher = Teacher(**teacher_data)
        # Convert the model to dict and handle date serialization
        teacher_dict = teacher.model_dump()
        # Convert date objects to strings for MongoDB
        if 'birth_date' in teacher_dict and isinstance(teacher_dict['birth_date'], date):
            teacher_dict['birth_date'] = teacher_dict['birth_date'].isoformat()
        db.evep.teachers.insert_one(teacher_dict)
    
    print(f"✅ Seeded {len(teachers_data)} teachers")

async def seed_parents(db):
    """Seed parents with Thai names and data"""
    parents_data = [
        {
            "first_name": "สมชาย",
            "last_name": "ใจดี",
            "cid": "1234567890128",
            "birth_date": "1980-03-15",
            "gender": "male",
            "phone": "0812345678",
            "email": "somchai.jaidee@email.com",
            "relation": "บิดา",
            "occupation": "วิศวกร",
            "address": {
                "house_no": "123",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "emergency_contact": {
                "name": "นาง สมหญิง ใจดี",
                "phone": "0823456789",
                "relation": "มารดา"
            }
        },
        {
            "first_name": "สมหญิง",
            "last_name": "รักเรียน",
            "cid": "1234567890129",
            "birth_date": "1982-07-22",
            "gender": "female",
            "phone": "0834567890",
            "email": "somying.rakrian@email.com",
            "relation": "มารดา",
            "occupation": "ครู",
            "address": {
                "house_no": "456",
                "soi": "สุขุมวิท 107",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "emergency_contact": {
                "name": "นาย สมชาย รักเรียน",
                "phone": "0845678901",
                "relation": "บิดา"
            },
            "status": "active"
        },
        {
            "first_name": "วิชัย",
            "last_name": "มุ่งมั่น",
            "cid": "1234567890130",
            "birth_date": "1978-11-10",
            "gender": "male",
            "phone": "0856789012",
            "email": "wichai.mungman@email.com",
            "relation": "บิดา",
            "occupation": "แพทย์",
            "address": {
                "house_no": "789",
                "soi": "สุขุมวิท 15",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "emergency_contact": {
                "name": "นาง ดวงใจ มุ่งมั่น",
                "phone": "0867890123",
                "relation": "มารดา"
            },
            "status": "active"
        },
        {
            "first_name": "ดวงใจ",
            "last_name": "สวยงาม",
            "cid": "1234567890131",
            "birth_date": "1985-04-18",
            "gender": "female",
            "phone": "0878901234",
            "email": "duangjai.suayngam@email.com",
            "relation": "มารดา",
            "occupation": "นักบัญชี",
            "address": {
                "house_no": "321",
                "soi": "สุขุมวิท 55",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "emergency_contact": {
                "name": "นาย สมชาย สวยงาม",
                "phone": "0889012345",
                "relation": "บิดา"
            },
            "status": "active"
        },
        {
            "first_name": "สมศักดิ์",
            "last_name": "พัฒนาการ",
            "cid": "1234567890132",
            "birth_date": "1983-09-25",
            "gender": "male",
            "phone": "0890123456",
            "email": "somsak.pattanakarn@email.com",
            "relation": "บิดา",
            "occupation": "นักธุรกิจ",
            "address": {
                "house_no": "654",
                "soi": "สุขุมวิท 101",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "emergency_contact": {
                "name": "นาง สมหญิง พัฒนาการ",
                "phone": "0801234567",
                "relation": "มารดา"
            },
            "status": "active"
        }
    ]
    
    for parent_data in parents_data:
        parent = Parent(**parent_data)
        # Convert the model to dict and handle date serialization
        parent_dict = parent.model_dump()
        # Convert date objects to strings for MongoDB
        if 'birth_date' in parent_dict and isinstance(parent_dict['birth_date'], date):
            parent_dict['birth_date'] = parent_dict['birth_date'].isoformat()
        db.evep.parents.insert_one(parent_dict)
    
    print(f"✅ Seeded {len(parents_data)} parents")

async def seed_medical_staff_simple(db):
    """Seed medical staff with simple data structure"""
    medical_staff_data = [
        {
            "first_name": "สมหญิง",
            "last_name": "จอห์นสัน",
            "cid": "1234567890133",
            "birth_date": "1975-06-12",
            "gender": "female",
            "phone": "0811111111",
            "email": "somying.johnson@hospital.com",
            "school": "โรงพยาบาลกรุงเทพ",
            "position": "จักษุแพทย์",
            "work_address": {
                "house_no": "111",
                "soi": "สุขุมวิท 20",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            }
        },
        {
            "first_name": "ไมเคิล",
            "last_name": "เฉิน",
            "cid": "1234567890134",
            "birth_date": "1980-03-25",
            "gender": "male",
            "phone": "0833333333",
            "email": "michael.chen@hospital.com",
            "school": "โรงพยาบาลกรุงเทพ",
            "position": "จักษุแพทย์",
            "work_address": {
                "house_no": "222",
                "soi": "สุขุมวิท 30",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            }
        },
        {
            "first_name": "สุภาพร",
            "last_name": "ใจดี",
            "cid": "1234567890135",
            "birth_date": "1988-12-08",
            "gender": "female",
            "phone": "0855555555",
            "email": "supaporn.jaidee@hospital.com",
            "school": "โรงพยาบาลกรุงเทพ",
            "position": "พยาบาลวิชาชีพ",
            "work_address": {
                "house_no": "333",
                "soi": "สุขุมวิท 40",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "คลองเตยเหนือ",
                "district": "วัฒนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            }
        }
    ]
    
    for staff_data in medical_staff_data:
        staff = Teacher(**staff_data)
        # Convert the model to dict and handle date serialization
        staff_dict = staff.model_dump()
        # Convert date objects to strings for MongoDB
        if 'birth_date' in staff_dict and isinstance(staff_dict['birth_date'], date):
            staff_dict['birth_date'] = staff_dict['birth_date'].isoformat()
        db.evep.medical_staff.insert_one(staff_dict)
    
    print(f"✅ Seeded {len(medical_staff_data)} medical staff")

async def seed_glasses_inventory(db):
    """Seed glasses inventory with Thai data"""
    glasses_inventory_data = [
        {
            "item_code": "GL001",
            "item_name": "Ray-Ban RB3025 Aviator - ทอง",
            "category": "frames",
            "brand": "Ray-Ban",
            "model": "RB3025 Aviator",
            "specifications": {
                "frame_color": "ทอง",
                "frame_size": "58mm",
                "lens_type": "โปรเกรสซีฟ",
                "lens_material": "โพลีคาร์บอเนต",
                "lens_coating": "ป้องกันแสงสีน้ำเงิน",
                "prescription_range": {
                    "sphere_min": -8.0,
                    "sphere_max": +8.0,
                    "cylinder_min": -4.0,
                    "cylinder_max": +4.0
                }
            },
            "unit_price": 2500,
            "cost_price": 1800,
            "initial_stock": 25,
            "reorder_level": 5,
            "supplier_info": {
                "name": "เรย์-แบน ประเทศไทย",
                "location": "คลังสินค้า A"
            },
            "notes": "แว่นตารุ่นคลาสสิกสำหรับเด็กและวัยรุ่น"
        },
        {
            "item_code": "GL002",
            "item_name": "Oakley OX8046-0956 - ดำ",
            "category": "frames",
            "brand": "Oakley",
            "model": "OX8046-0956",
            "specifications": {
                "frame_color": "ดำ",
                "frame_size": "60mm",
                "lens_type": "เดี่ยว",
                "lens_material": "ไฮ-อินเด็กซ์",
                "lens_coating": "ป้องกันแสงสะท้อน",
                "prescription_range": {
                    "sphere_min": -6.0,
                    "sphere_max": +6.0,
                    "cylinder_min": -3.0,
                    "cylinder_max": +3.0
                }
            },
            "unit_price": 1800,
            "cost_price": 1200,
            "initial_stock": 15,
            "reorder_level": 3,
            "supplier_info": {
                "name": "โอ๊คลี่ ประเทศไทย",
                "location": "คลังสินค้า A"
            },
            "notes": "แว่นตาสำหรับกีฬาและกิจกรรมกลางแจ้ง"
        },
        {
            "item_code": "GL003",
            "item_name": "Tommy Hilfiger TH 1140/S - น้ำเงิน",
            "category": "frames",
            "brand": "Tommy Hilfiger",
            "model": "TH 1140/S",
            "specifications": {
                "frame_color": "น้ำเงิน",
                "frame_size": "55mm",
                "lens_type": "โปรเกรสซีฟ",
                "lens_material": "ไฮ-อินเด็กซ์",
                "lens_coating": "ป้องกันแสงสีน้ำเงิน",
                "prescription_range": {
                    "sphere_min": -7.0,
                    "sphere_max": +7.0,
                    "cylinder_min": -3.5,
                    "cylinder_max": +3.5
                }
            },
            "unit_price": 2200,
            "cost_price": 1500,
            "initial_stock": 8,
            "reorder_level": 2,
            "supplier_info": {
                "name": "ทอมมี่ ฮิลฟิเกอร์ ประเทศไทย",
                "location": "คลังสินค้า B"
            },
            "notes": "แว่นตาสไตล์แฟชั่นสำหรับวัยรุ่น"
        },
        {
            "item_code": "GL004",
            "item_name": "Nike NIKE 8620-0100 - แดง",
            "category": "frames",
            "brand": "Nike",
            "model": "NIKE 8620-0100",
            "specifications": {
                "frame_color": "แดง",
                "frame_size": "58mm",
                "lens_type": "เดี่ยว",
                "lens_material": "โพลีคาร์บอเนต",
                "lens_coating": "ป้องกันแสงสะท้อน",
                "prescription_range": {
                    "sphere_min": -5.0,
                    "sphere_max": +5.0,
                    "cylinder_min": -2.5,
                    "cylinder_max": +2.5
                }
            },
            "unit_price": 1500,
            "cost_price": 900,
            "initial_stock": 0,
            "reorder_level": 5,
            "supplier_info": {
                "name": "ไนกี้ ประเทศไทย",
                "location": "คลังสินค้า B"
            },
            "notes": "แว่นตาสำหรับกีฬาและกิจกรรมกลางแจ้ง"
        },
        {
            "item_code": "GL005",
            "item_name": "Adidas AD 1001 - เขียว",
            "category": "frames",
            "brand": "Adidas",
            "model": "AD 1001",
            "specifications": {
                "frame_color": "เขียว",
                "frame_size": "56mm",
                "lens_type": "โปรเกรสซีฟ",
                "lens_material": "ไฮ-อินเด็กซ์",
                "lens_coating": "ป้องกันแสงสีน้ำเงิน",
                "prescription_range": {
                    "sphere_min": -6.5,
                    "sphere_max": +6.5,
                    "cylinder_min": -3.0,
                    "cylinder_max": +3.0
                }
            },
            "unit_price": 1900,
            "cost_price": 1300,
            "initial_stock": 12,
            "reorder_level": 3,
            "supplier_info": {
                "name": "อาดิดาส ประเทศไทย",
                "location": "คลังสินค้า A"
            },
            "notes": "แว่นตาสำหรับกีฬาและกิจกรรมกลางแจ้ง"
        }
    ]
    
    for glasses_data in glasses_inventory_data:
        glasses_item = GlassesItemCreate(**glasses_data)
        db.evep.glasses_inventory.insert_one(glasses_item.model_dump())
    
    print(f"✅ Seeded {len(glasses_inventory_data)} glasses inventory items")

async def seed_glasses_delivery(db):
    """Seed glasses delivery records with Thai data"""
    delivery_data = [
        {
            "delivery_id": "DEL001",
            "patient_id": "1",
            "patient_name": "สมชาย ใจดี",
            "glasses_item_code": "GL001",
            "glasses_description": "Ray-Ban RB3025 Aviator - ทอง",
            "prescription": {
                "right_eye": {"sphere": -2.5, "cylinder": -0.5, "axis": 90},
                "left_eye": {"sphere": -2.0, "cylinder": -0.25, "axis": 85}
            },
            "delivery_date": datetime.now(),
            "delivery_method": "school_delivery",
            "delivery_address": {
                "school_name": "โรงเรียนนานาชาติกรุงเทพ",
                "address": "123 ถนนสุขุมวิท, คลองเตยเหนือ, วัฒนา, กรุงเทพมหานคร 10110"
            },
            "delivery_status": "delivered",
            "delivered_by": "นางสาว สุภาพร ใจดี",
            "received_by": "นาง สมหญิง ใจดี",
            "notes": "ส่งมอบเรียบร้อยแล้ว"
        },
        {
            "delivery_id": "DEL002",
            "patient_id": "2",
            "patient_name": "สมหญิง รักเรียน",
            "glasses_item_code": "GL002",
            "glasses_description": "Oakley OX8046-0956 - ดำ",
            "prescription": {
                "right_eye": {"sphere": -1.75, "cylinder": -0.75, "axis": 95},
                "left_eye": {"sphere": -1.5, "cylinder": -0.5, "axis": 90}
            },
            "delivery_date": datetime.now(),
            "delivery_method": "home_delivery",
            "delivery_address": {
                "house_no": "456",
                "soi": "สุขุมวิท 107",
                "road": "ถนนสุขุมวิท",
                "subdistrict": "บางนา",
                "district": "บางนา",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10260"
            },
            "delivery_status": "in_transit",
            "delivered_by": "นาย อนุชา พัฒนาการ",
            "received_by": None,
            "notes": "อยู่ระหว่างการจัดส่ง"
        },
        {
            "delivery_id": "DEL003",
            "patient_id": "3",
            "patient_name": "ดวงใจ สวยงาม",
            "glasses_item_code": "GL003",
            "glasses_description": "Tommy Hilfiger TH 1140/S - น้ำเงิน",
            "prescription": {
                "right_eye": {"sphere": -3.0, "cylinder": -1.0, "axis": 88},
                "left_eye": {"sphere": -2.75, "cylinder": -0.75, "axis": 92}
            },
            "delivery_date": datetime.now(),
            "delivery_method": "immediate",
            "delivery_address": {
                "location": "โรงพยาบาลกรุงเทพ - แผนกจักษุวิทยา"
            },
            "delivery_status": "scheduled",
            "delivered_by": "นางสาว รัตนา สวยงาม",
            "received_by": None,
            "notes": "นัดส่งมอบในวันที่ 15 ธันวาคม 2024"
        }
    ]
    
    for delivery_item in delivery_data:
        db.evep.glasses_delivery.insert_one(delivery_item)
    
    print(f"✅ Seeded {len(delivery_data)} glasses delivery records")

async def seed_screening_sessions(db):
    """Seed screening sessions with Thai data"""
    screening_data = [
        {
            "patient_id": "1",
            "patient_name": "สมชาย ใจดี",
            "examiner_id": "1",
            "examiner_name": "ดร. สมหญิง จอห์นสัน",
            "screening_type": "comprehensive",
            "screening_category": "school_screening",
            "equipment_used": "ตารางสเนลเลน, แบบทดสอบการมองเห็นสี",
            "notes": "นักเรียนมีสายตาปกติทั้งสองข้าง",
            "status": "completed",
            "results": [
                {"eye": "left", "distance": "20/20", "near": "20/20", "color": "normal"},
                {"eye": "right", "distance": "20/20", "near": "20/20", "color": "normal"}
            ],
            "conclusion": "สายตาปกติ",
            "recommendations": "ไม่ต้องใส่แว่นตา",
            "follow_up_date": "2024-12-01"
        },
        {
            "patient_id": "2",
            "patient_name": "สมหญิง รักเรียน",
            "examiner_id": "2",
            "examiner_name": "ดร. ไมเคิล เฉิน",
            "screening_type": "distance",
            "screening_category": "school_screening",
            "equipment_used": "ตารางสเนลเลน",
            "notes": "นักเรียนต้องการแว่นตาสำหรับการมองเห็นระยะไกล",
            "status": "in_progress",
            "results": [
                {"eye": "left", "distance": "20/40", "near": "20/20"},
                {"eye": "right", "distance": "20/40", "near": "20/20"}
            ],
            "conclusion": "สายตาสั้นเล็กน้อย",
            "recommendations": "แนะนำให้ใส่แว่นตาตามใบสั่ง",
            "follow_up_date": "2024-11-30"
        }
    ]
    
    for screening_item in screening_data:
        screening_session = ScreeningSessionCreate(**screening_item)
        db.evep.screening_sessions.insert_one(screening_session.model_dump())
    
    print(f"✅ Seeded {len(screening_data)} screening sessions")

async def seed_comprehensive_screening_data(db):
    """Seed comprehensive screening data for all three screening types based on existing students"""
    
    # Get existing students to use as patients
    students_cursor = db.evep.students.find({"status": "active"})
    students = await students_cursor.to_list(length=None)
    if not students:
        print("⚠️ No active students found. Please seed students first.")
        return
    
    # Get existing teachers to use as examiners
    teachers_cursor = db.evep.teachers.find({"status": "active"})
    teachers = await teachers_cursor.to_list(length=None)
    if not teachers:
        print("⚠️ No active teachers found. Using default examiner.")
        examiners = [{"_id": "default_examiner", "first_name": "แพทย์", "last_name": "ประจำโรงเรียน"}]
    else:
        examiners = teachers
    
    screening_types = [
        "standard_vision_screening",
        "mobile_vision_screening", 
        "enhanced_vision_screening"
    ]
    
    screening_data = []
    
    for i, student in enumerate(students):
        examiner = examiners[i % len(examiners)]
        
        # Create screening sessions for each type
        for screening_type in screening_types:
            # Generate realistic screening dates (within last 6 months)
            days_ago = (i * 7) % 180  # Spread out over 6 months
            screening_date = datetime.utcnow() - timedelta(days=days_ago)
            
            # Generate realistic screening results based on screening type
            if screening_type == "standard_vision_screening":
                results = generate_standard_screening_results()
                equipment_used = "Snellen Chart, Near Vision Chart"
                screening_category = "school_screening"
                
            elif screening_type == "mobile_vision_screening":
                results = generate_mobile_screening_results()
                equipment_used = "Mobile Vision Kit, Auto-refractor"
                screening_category = "medical_screening"
                
            else:  # enhanced_vision_screening
                results = generate_enhanced_screening_results()
                equipment_used = "Digital Vision Analyzer, Color Vision Test, Depth Perception Test"
                screening_category = "medical_screening"
            
            # Determine status and completion
            status = "completed" if i % 3 != 0 else "in_progress"
            completed_at = screening_date + timedelta(minutes=30) if status == "completed" else None
            
            screening_session = {
                "session_id": f"{screening_type}_{student['_id']}_{i}",
                "patient_id": str(student['_id']),
                "patient_name": f"{student['first_name']} {student['last_name']}",
                "examiner_id": str(examiner['_id']),
                "examiner_name": f"{examiner['first_name']} {examiner['last_name']}",
                "screening_type": screening_type,
                "screening_category": screening_category,
                "equipment_used": equipment_used,
                "status": status,
                "results": results,
                "conclusion": generate_conclusion(results),
                "recommendations": generate_recommendations(results),
                "follow_up_required": results.get('follow_up_required', False),
                "follow_up_date": generate_follow_up_date(results) if results.get('follow_up_required') else None,
                "notes": generate_screening_notes(screening_type, results),
                "created_at": screening_date.isoformat(),
                "completed_at": completed_at.isoformat() if completed_at else None,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            screening_data.append(screening_session)
    
    # Insert screening data
    for screening in screening_data:
        await db.evep.screenings.insert_one(screening)
    
    print(f"✅ Seeded {len(screening_data)} comprehensive screening sessions across {len(screening_types)} screening types")

def generate_standard_screening_results():
    """Generate realistic standard vision screening results"""
    import random
    
    # Generate realistic vision acuity values
    distance_left = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
    distance_right = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
    near_left = random.choice(["20/20", "20/25", "20/30", "20/40"])
    near_right = random.choice(["20/20", "20/25", "20/30", "20/40"])
    
    # Determine if follow-up is needed
    follow_up_required = (
        distance_left in ["20/40", "20/50"] or 
        distance_right in ["20/40", "20/50"] or
        near_left in ["20/40"] or 
        near_right in ["20/40"]
    )
    
    return {
        "left_eye_distance": distance_left,
        "right_eye_distance": distance_right,
        "left_eye_near": near_left,
        "right_eye_near": near_right,
        "color_vision": random.choice(["normal", "deficient", "failed"]),
        "depth_perception": random.choice(["normal", "impaired", "failed"]),
        "follow_up_required": follow_up_required,
        "notes": "Standard vision screening completed",
        "recommendations": "Continue regular eye care" if not follow_up_required else "Schedule follow-up with optometrist"
    }

def generate_mobile_screening_results():
    """Generate realistic mobile vision screening results"""
    import random
    
    # Generate comprehensive mobile screening results
    distance_left = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50", "20/60"])
    distance_right = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50", "20/60"])
    near_left = random.choice(["20/20", "20/25", "20/30", "20/40"])
    near_right = random.choice(["20/20", "20/25", "20/30", "20/40"])
    
    # Auto-refractor results
    sphere_left = random.uniform(-3.0, 2.0)
    sphere_right = random.uniform(-3.0, 2.0)
    cylinder_left = random.uniform(-2.0, 2.0)
    cylinder_right = random.uniform(-2.0, 2.0)
    
    # Determine if glasses prescription is needed
    needs_glasses = abs(sphere_left) > 0.5 or abs(sphere_right) > 0.5 or abs(cylinder_left) > 0.5 or abs(cylinder_right) > 0.5
    
    return {
        "left_eye_distance": distance_left,
        "right_eye_distance": distance_right,
        "left_eye_near": near_left,
        "right_eye_near": near_right,
        "color_vision": random.choice(["normal", "deficient", "failed"]),
        "depth_perception": random.choice(["normal", "impaired", "failed"]),
        "auto_refractor": {
            "left_eye": {
                "sphere": round(sphere_left, 2),
                "cylinder": round(cylinder_left, 2),
                "axis": random.randint(0, 180)
            },
            "right_eye": {
                "sphere": round(sphere_right, 2),
                "cylinder": round(cylinder_right, 2),
                "axis": random.randint(0, 180)
            }
        },
        "glasses_prescription": {
            "left_eye_sphere": round(sphere_left, 2) if needs_glasses else None,
            "right_eye_sphere": round(sphere_right, 2) if needs_glasses else None,
            "left_eye_cylinder": round(cylinder_left, 2) if needs_glasses else None,
            "right_eye_cylinder": round(cylinder_right, 2) if needs_glasses else None,
            "left_eye_axis": random.randint(0, 180) if needs_glasses else None,
            "right_eye_axis": random.randint(0, 180) if needs_glasses else None
        },
        "follow_up_required": needs_glasses or distance_left in ["20/40", "20/50", "20/60"] or distance_right in ["20/40", "20/50", "20/60"],
        "notes": "Mobile vision screening with auto-refractor completed",
        "recommendations": "No glasses needed" if not needs_glasses else "Glasses prescription recommended"
    }

def generate_enhanced_screening_results():
    """Generate realistic enhanced vision screening results"""
    import random
    
    # Generate comprehensive enhanced screening results
    distance_left = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50", "20/60", "20/80"])
    distance_right = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50", "20/60", "20/80"])
    near_left = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
    near_right = random.choice(["20/20", "20/25", "20/30", "20/40", "20/50"])
    
    # Advanced tests
    contrast_sensitivity = random.choice(["normal", "reduced", "severely_reduced"])
    visual_field = random.choice(["normal", "constricted", "defect"])
    color_vision = random.choice(["normal", "mild_deficiency", "moderate_deficiency", "severe_deficiency"])
    depth_perception = random.choice(["normal", "impaired", "failed"])
    
    # Digital analysis results
    digital_analysis = {
        "pupil_size": {
            "left": round(random.uniform(2.5, 5.0), 1),
            "right": round(random.uniform(2.5, 5.0), 1)
        },
        "reaction_time": {
            "left": round(random.uniform(0.2, 0.8), 2),
            "right": round(random.uniform(0.2, 0.8), 2)
        },
        "accommodation": {
            "amplitude": round(random.uniform(8.0, 12.0), 1),
            "facility": round(random.uniform(3.0, 8.0), 1)
        }
    }
    
    # Determine if specialist referral is needed
    needs_specialist = (
        distance_left in ["20/60", "20/80"] or 
        distance_right in ["20/60", "20/80"] or
        contrast_sensitivity in ["reduced", "severely_reduced"] or
        visual_field in ["constricted", "defect"] or
        color_vision in ["moderate_deficiency", "severe_deficiency"]
    )
    
    return {
        "left_eye_distance": distance_left,
        "right_eye_distance": distance_right,
        "left_eye_near": near_left,
        "right_eye_near": near_right,
        "color_vision": color_vision,
        "depth_perception": depth_perception,
        "contrast_sensitivity": contrast_sensitivity,
        "visual_field": visual_field,
        "digital_analysis": digital_analysis,
        "follow_up_required": needs_specialist,
        "notes": "Enhanced vision screening with digital analysis completed",
        "recommendations": "Continue regular eye care" if not needs_specialist else "Refer to ophthalmologist for further evaluation"
    }

def generate_conclusion(results):
    """Generate screening conclusion based on results"""
    if results.get('follow_up_required'):
        if results.get('glasses_prescription'):
            return "Vision correction needed - glasses prescription recommended"
        elif results.get('digital_analysis'):
            return "Advanced evaluation required - specialist referral recommended"
        else:
            return "Follow-up screening recommended"
    else:
        return "Vision screening normal - no immediate action required"

def generate_recommendations(results):
    """Generate recommendations based on screening results"""
    recommendations = []
    
    if results.get('glasses_prescription'):
        recommendations.append("Schedule glasses fitting appointment")
        recommendations.append("Follow up in 6 months for vision check")
    
    if results.get('follow_up_required') and not results.get('glasses_prescription'):
        recommendations.append("Schedule follow-up screening in 3 months")
        recommendations.append("Monitor vision changes")
    
    if results.get('digital_analysis'):
        recommendations.append("Consider comprehensive eye examination")
    
    if not recommendations:
        recommendations.append("Continue regular eye care")
        recommendations.append("Annual vision screening recommended")
    
    return "; ".join(recommendations)

def generate_follow_up_date(results):
    """Generate follow-up date based on results"""
    import random
    from datetime import datetime, timedelta
    
    if results.get('glasses_prescription'):
        # Follow up in 1-2 weeks for glasses
        days = random.randint(7, 14)
    elif results.get('follow_up_required'):
        # Follow up in 1-3 months for monitoring
        days = random.randint(30, 90)
    else:
        # Annual follow up
        days = 365
    
    follow_up_date = datetime.utcnow() + timedelta(days=days)
    return follow_up_date.strftime("%Y-%m-%d")

def generate_screening_notes(screening_type, results):
    """Generate screening notes based on type and results"""
    notes = []
    
    if screening_type == "standard_vision_screening":
        notes.append("Standard vision screening performed using Snellen chart")
        notes.append(f"Distance vision: L={results.get('left_eye_distance')}, R={results.get('right_eye_distance')}")
        notes.append(f"Near vision: L={results.get('left_eye_near')}, R={results.get('right_eye_near')}")
        
    elif screening_type == "mobile_vision_screening":
        notes.append("Mobile vision screening with auto-refractor")
        notes.append(f"Auto-refractor results recorded")
        if results.get('glasses_prescription'):
            notes.append("Glasses prescription generated")
            
    else:  # enhanced_vision_screening
        notes.append("Enhanced vision screening with digital analysis")
        notes.append("Advanced tests performed: contrast sensitivity, visual field, color vision")
        notes.append("Digital analysis completed")
    
    if results.get('follow_up_required'):
        notes.append("Follow-up recommended")
    
    return "; ".join(notes)

async def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    try:
        db = get_database()
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.evep.students.delete_many({})
        db.evep.schools.delete_many({})
        db.evep.teachers.delete_many({})
        db.evep.parents.delete_many({})
        db.evep.medical_staff.delete_many({})
        db.evep.glasses_inventory.delete_many({})
        db.evep.glasses_delivery.delete_many({})
        db.evep.screening_sessions.delete_many({})
        db.evep.screenings.delete_many({})
        
        # Seed data
        await seed_students(db)
        await seed_schools(db)
        await seed_teachers(db)
        await seed_parents(db)
        await seed_medical_staff_simple(db)
        await seed_glasses_inventory(db)
        await seed_glasses_delivery(db)
        await seed_screening_sessions(db)
        await seed_comprehensive_screening_data(db)
        
        print("✅ Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    asyncio.run(main())
