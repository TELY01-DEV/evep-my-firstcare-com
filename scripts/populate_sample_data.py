#!/usr/bin/env python3
"""
Sample Data Population Script for EVEP Medical Portal
This script populates the database with sample data for all entities using CRUD endpoints.
"""

import asyncio
import aiohttp
import json
from datetime import datetime, date
from typing import Dict, List, Any
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
LOGIN_EMAIL = "admin@evep.com"
LOGIN_PASSWORD = "admin123"

class DataPopulator:
    def __init__(self):
        self.session = None
        self.token = None
        self.created_ids = {
            'schools': [],
            'teachers': [],
            'parents': [],
            'students': [],
            'hospitals': [],
            'doctors': [],
            'nurses': [],
            'optometrists': [],
            'medical_staff': [],
            'hospital_staff': [],
            'medical_admins': [],
            'system_admins': [],
            'executives': []
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def login(self):
        """Login and get authentication token"""
        print("🔐 Logging in...")
        login_data = {
            "email": LOGIN_EMAIL,
            "password": LOGIN_PASSWORD
        }
        
        async with self.session.post(f"{API_BASE_URL}/api/v1/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                self.token = data.get('access_token')
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status}")
                return False

    def get_headers(self):
        """Get headers with authentication token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def create_schools(self):
        """Create sample schools"""
        print("\n🏫 Creating schools...")
        
        schools_data = [
            {
                "school_code": "SCH001",
                "name": "โรงเรียนอนุบาลกรุงเทพ",
                "type": "อนุบาล",
                "address": {
                    "house_no": "123",
                    "village_no": "1",
                    "soi": "สุขุมวิท 1",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                },
                "phone": "02-123-4567",
                "email": "info@bangkok-kindergarten.ac.th"
            },
            {
                "school_code": "SCH002",
                "name": "โรงเรียนประถมศึกษาสาธิต",
                "type": "ประถมศึกษา",
                "address": {
                    "house_no": "456",
                    "village_no": "2",
                    "soi": "พหลโยธิน 2",
                    "road": "พหลโยธิน",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                },
                "phone": "02-234-5678",
                "email": "info@prathom-satit.ac.th"
            },
            {
                "school_code": "SCH003",
                "name": "โรงเรียนมัธยมศึกษานานาชาติ",
                "type": "มัธยมศึกษา",
                "address": {
                    "house_no": "789",
                    "village_no": "3",
                    "soi": "รัชดาภิเษก 3",
                    "road": "รัชดาภิเษก",
                    "subdistrict": "ห้วยขวาง",
                    "district": "ห้วยขวาง",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10310"
                },
                "phone": "02-345-6789",
                "email": "info@international-school.ac.th"
            }
        ]

        for school_data in schools_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/schools",
                json=school_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    school_id = result.get('school_id')
                    self.created_ids['schools'].append(school_id)
                    print(f"✅ Created school: {school_data['name']} (ID: {school_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create school {school_data['name']}: {response.status} - {error_text}")

    async def create_teachers(self):
        """Create sample teachers"""
        print("\n👨‍🏫 Creating teachers...")
        
        teachers_data = [
            {
                "title": "นาง",
                "first_name": "สมใจ",
                "last_name": "ใจดี",
                "cid": "1234567890123",
                "birth_date": "1985-03-15",
                "gender": "2",
                "phone": "081-111-1111",
                "email": "somjai@school.ac.th",
                "school": "โรงเรียนอนุบาลกรุงเทพ",
                "position": "ครูประจำชั้น",
                "school_year": "2567",
                "work_address": {
                    "house_no": "123",
                    "village_no": "1",
                    "soi": "สุขุมวิท 1",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                }
            },
            {
                "title": "นาย",
                "first_name": "วิชัย",
                "last_name": "สอนดี",
                "cid": "1234567890124",
                "birth_date": "1980-07-22",
                "gender": "1",
                "phone": "082-222-2222",
                "email": "wichai@school.ac.th",
                "school": "โรงเรียนประถมศึกษาสาธิต",
                "position": "ครูวิชาการ",
                "school_year": "2567",
                "work_address": {
                    "house_no": "456",
                    "village_no": "2",
                    "soi": "พหลโยธิน 2",
                    "road": "พหลโยธิน",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                }
            },
            {
                "title": "นางสาว",
                "first_name": "มาลี",
                "last_name": "สอนเก่ง",
                "cid": "1234567890125",
                "birth_date": "1990-11-08",
                "gender": "2",
                "phone": "083-333-3333",
                "email": "malee@school.ac.th",
                "school": "โรงเรียนมัธยมศึกษานานาชาติ",
                "position": "ครูภาษาอังกฤษ",
                "school_year": "2567",
                "work_address": {
                    "house_no": "789",
                    "village_no": "3",
                    "soi": "รัชดาภิเษก 3",
                    "road": "รัชดาภิเษก",
                    "subdistrict": "ห้วยขวาง",
                    "district": "ห้วยขวาง",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10310"
                }
            }
        ]

        for teacher_data in teachers_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/teachers",
                json=teacher_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    teacher_id = result.get('teacher_id')
                    self.created_ids['teachers'].append(teacher_id)
                    print(f"✅ Created teacher: {teacher_data['first_name']} {teacher_data['last_name']} (ID: {teacher_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create teacher {teacher_data['first_name']}: {response.status} - {error_text}")

    async def create_parents(self):
        """Create sample parents"""
        print("\n👨‍👩‍👧‍👦 Creating parents...")
        
        parents_data = [
            {
                "title": "นาย",
                "first_name": "สมชาย",
                "last_name": "รักลูก",
                "cid": "1234567890130",
                "birth_date": "1980-05-10",
                "gender": "1",
                "phone": "084-444-4444",
                "email": "somchai@email.com",
                "relation": "บิดา",
                "occupation": "วิศวกร",
                "income_level": "middle",
                "address": {
                    "house_no": "100",
                    "village_no": "5",
                    "soi": "ลาดพร้าว 5",
                    "road": "ลาดพร้าว",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                },
                "emergency_contact": {
                    "name": "สมหญิง รักลูก",
                    "phone": "085-555-5555",
                    "relation": "มารดา"
                }
            },
            {
                "title": "นาง",
                "first_name": "สมหญิง",
                "last_name": "รักลูก",
                "cid": "1234567890131",
                "birth_date": "1982-08-15",
                "gender": "2",
                "phone": "085-555-5555",
                "email": "somying@email.com",
                "relation": "มารดา",
                "occupation": "ครู",
                "income_level": "middle",
                "address": {
                    "house_no": "100",
                    "village_no": "5",
                    "soi": "ลาดพร้าว 5",
                    "road": "ลาดพร้าว",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                },
                "emergency_contact": {
                    "name": "สมชาย รักลูก",
                    "phone": "084-444-4444",
                    "relation": "บิดา"
                }
            },
            {
                "title": "นาย",
                "first_name": "วิชัย",
                "last_name": "พ่อดี",
                "cid": "1234567890132",
                "birth_date": "1978-12-03",
                "gender": "1",
                "phone": "086-666-6666",
                "email": "wichai.parent@email.com",
                "relation": "บิดา",
                "occupation": "แพทย์",
                "income_level": "high",
                "address": {
                    "house_no": "200",
                    "village_no": "10",
                    "soi": "สุขุมวิท 10",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                },
                "emergency_contact": {
                    "name": "มาลี แม่ดี",
                    "phone": "087-777-7777",
                    "relation": "มารดา"
                }
            }
        ]

        for parent_data in parents_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/parents",
                json=parent_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    parent_id = result.get('parent_id')
                    self.created_ids['parents'].append(parent_id)
                    print(f"✅ Created parent: {parent_data['first_name']} {parent_data['last_name']} (ID: {parent_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create parent {parent_data['first_name']}: {response.status} - {error_text}")

    async def create_students(self):
        """Create sample students"""
        print("\n🎓 Creating students...")
        
        students_data = [
            {
                "title": "เด็กชาย",
                "first_name": "สมเกียรติ",
                "last_name": "รักลูก",
                "cid": "1234567890140",
                "birth_date": "2015-03-20",
                "gender": "1",
                "student_code": "STU001",
                "school_name": "โรงเรียนอนุบาลกรุงเทพ",
                "grade_level": "อนุบาล 3",
                "grade_number": "3",
                "address": {
                    "house_no": "100",
                    "village_no": "5",
                    "soi": "ลาดพร้าว 5",
                    "road": "ลาดพร้าว",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                },
                "disease": "",
                "parent_id": self.created_ids['parents'][0] if self.created_ids['parents'] else "",
                "teacher_id": self.created_ids['teachers'][0] if self.created_ids['teachers'] else "",
                "consent_document": True
            },
            {
                "title": "เด็กหญิง",
                "first_name": "สมพร",
                "last_name": "รักลูก",
                "cid": "1234567890141",
                "birth_date": "2013-07-12",
                "gender": "2",
                "student_code": "STU002",
                "school_name": "โรงเรียนประถมศึกษาสาธิต",
                "grade_level": "ประถมศึกษาปีที่ 4",
                "grade_number": "4",
                "address": {
                    "house_no": "100",
                    "village_no": "5",
                    "soi": "ลาดพร้าว 5",
                    "road": "ลาดพร้าว",
                    "subdistrict": "จตุจักร",
                    "district": "จตุจักร",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10900"
                },
                "disease": "",
                "parent_id": self.created_ids['parents'][0] if self.created_ids['parents'] else "",
                "teacher_id": self.created_ids['teachers'][1] if len(self.created_ids['teachers']) > 1 else "",
                "consent_document": True
            },
            {
                "title": "เด็กชาย",
                "first_name": "วิชัย",
                "last_name": "พ่อดี",
                "cid": "1234567890142",
                "birth_date": "2010-11-25",
                "gender": "1",
                "student_code": "STU003",
                "school_name": "โรงเรียนมัธยมศึกษานานาชาติ",
                "grade_level": "มัธยมศึกษาปีที่ 2",
                "grade_number": "2",
                "address": {
                    "house_no": "200",
                    "village_no": "10",
                    "soi": "สุขุมวิท 10",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                },
                "disease": "",
                "parent_id": self.created_ids['parents'][2] if len(self.created_ids['parents']) > 2 else "",
                "teacher_id": self.created_ids['teachers'][2] if len(self.created_ids['teachers']) > 2 else "",
                "consent_document": True
            }
        ]

        for student_data in students_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/students",
                json=student_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    student_id = result.get('student_id')
                    self.created_ids['students'].append(student_id)
                    print(f"✅ Created student: {student_data['first_name']} {student_data['last_name']} (ID: {student_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create student {student_data['first_name']}: {response.status} - {error_text}")

    async def create_medical_staff(self):
        """Create sample medical staff (doctors, nurses, optometrists, medical staff)"""
        print("\n👨‍⚕️ Creating medical staff...")
        
        # Doctors
        doctors_data = [
            {
                "email": "doctor1@hospital.com",
                "password": "password123",
                "first_name": "สมชาย",
                "last_name": "หมอดี",
                "role": "doctor",
                "department": "จักษุวิทยา",
                "specialization": "จักษุแพทย์",
                "phone": "088-888-8888",
                "license_number": "DOC001",
                "qualifications": ["แพทยศาสตร์บัณฑิต", "วุฒิบัตรจักษุวิทยา"],
                "is_active": True
            },
            {
                "email": "doctor2@hospital.com",
                "password": "password123",
                "first_name": "สมหญิง",
                "last_name": "หมอเก่ง",
                "role": "doctor",
                "department": "กุมารเวชศาสตร์",
                "specialization": "กุมารแพทย์",
                "phone": "089-999-9999",
                "license_number": "DOC002",
                "qualifications": ["แพทยศาสตร์บัณฑิต", "วุฒิบัตรกุมารเวชศาสตร์"],
                "is_active": True
            }
        ]

        # Nurses
        nurses_data = [
            {
                "email": "nurse1@hospital.com",
                "password": "password123",
                "first_name": "มาลี",
                "last_name": "พยาบาลดี",
                "role": "nurse",
                "department": "จักษุวิทยา",
                "specialization": "พยาบาลจักษุ",
                "phone": "090-000-0000",
                "license_number": "NUR001",
                "qualifications": ["พยาบาลศาสตร์บัณฑิต"],
                "is_active": True
            },
            {
                "email": "nurse2@hospital.com",
                "password": "password123",
                "first_name": "วิชัย",
                "last_name": "พยาบาลเก่ง",
                "role": "nurse",
                "department": "กุมารเวชศาสตร์",
                "specialization": "พยาบาลกุมาร",
                "phone": "091-111-1111",
                "license_number": "NUR002",
                "qualifications": ["พยาบาลศาสตร์บัณฑิต"],
                "is_active": True
            }
        ]

        # Optometrists
        optometrists_data = [
            {
                "email": "optometrist1@hospital.com",
                "password": "password123",
                "first_name": "สมพร",
                "last_name": "ทัศนมาตรดี",
                "role": "optometrist",
                "department": "จักษุวิทยา",
                "specialization": "ทัศนมาตร",
                "phone": "092-222-2222",
                "license_number": "OPT001",
                "qualifications": ["ทัศนมาตรศาสตร์บัณฑิต"],
                "is_active": True
            }
        ]

        # Medical Staff
        medical_staff_data = [
            {
                "email": "medstaff1@hospital.com",
                "password": "password123",
                "first_name": "สมศักดิ์",
                "last_name": "เจ้าหน้าที่ดี",
                "role": "medical_staff",
                "department": "จักษุวิทยา",
                "specialization": "เจ้าหน้าที่เทคนิค",
                "phone": "093-333-3333",
                "license_number": "MED001",
                "qualifications": ["เทคนิคการแพทย์"],
                "is_active": True
            }
        ]

        # Create doctors
        for doctor_data in doctors_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/medical-staff-management/",
                json=doctor_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    doctor_id = result.get('id')
                    self.created_ids['doctors'].append(doctor_id)
                    print(f"✅ Created doctor: {doctor_data['first_name']} {doctor_data['last_name']} (ID: {doctor_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create doctor {doctor_data['first_name']}: {response.status} - {error_text}")

        # Create nurses
        for nurse_data in nurses_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/medical-staff-management/",
                json=nurse_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    nurse_id = result.get('id')
                    self.created_ids['nurses'].append(nurse_id)
                    print(f"✅ Created nurse: {nurse_data['first_name']} {nurse_data['last_name']} (ID: {nurse_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create nurse {nurse_data['first_name']}: {response.status} - {error_text}")

        # Create optometrists
        for optometrist_data in optometrists_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/medical-staff-management/",
                json=optometrist_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    optometrist_id = result.get('id')
                    self.created_ids['optometrists'].append(optometrist_id)
                    print(f"✅ Created optometrist: {optometrist_data['first_name']} {optometrist_data['last_name']} (ID: {optometrist_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create optometrist {optometrist_data['first_name']}: {response.status} - {error_text}")

        # Create medical staff
        for staff_data in medical_staff_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/medical-staff-management/",
                json=staff_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    staff_id = result.get('id')
                    self.created_ids['medical_staff'].append(staff_id)
                    print(f"✅ Created medical staff: {staff_data['first_name']} {staff_data['last_name']} (ID: {staff_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create medical staff {staff_data['first_name']}: {response.status} - {error_text}")

    async def create_admin_users(self):
        """Create sample admin users (medical admin, system admin, executive)"""
        print("\n👨‍💼 Creating admin users...")
        
        # Medical Admin
        medical_admin_data = {
            "email": "medical.admin@hospital.com",
            "password": "password123",
            "first_name": "สมศักดิ์",
            "last_name": "แพทย์ใหญ่",
            "role": "medical_admin",
            "portal_access": ["medical", "admin"],
            "organization": "โรงพยาบาลกรุงเทพ",
            "department": "บริหารงานแพทย์",
            "specialization": "การบริหารงานแพทย์",
            "phone": "094-444-4444",
            "license_number": "MEDADMIN001",
            "qualifications": ["แพทยศาสตร์บัณฑิต", "บริหารธุรกิจมหาบัณฑิต"],
            "is_active": True,
            "is_verified": True
        }

        # System Admin
        system_admin_data = {
            "email": "system.admin@hospital.com",
            "password": "password123",
            "first_name": "สมชาย",
            "last_name": "ระบบดี",
            "role": "system_admin",
            "portal_access": ["medical", "admin", "school"],
            "organization": "โรงพยาบาลกรุงเทพ",
            "department": "เทคโนโลยีสารสนเทศ",
            "specialization": "การบริหารระบบ",
            "phone": "095-555-5555",
            "license_number": "SYSADMIN001",
            "qualifications": ["วิทยาการคอมพิวเตอร์", "บริหารธุรกิจมหาบัณฑิต"],
            "is_active": True,
            "is_verified": True
        }

        # Executive
        executive_data = {
            "email": "executive@hospital.com",
            "password": "password123",
            "first_name": "สมหญิง",
            "last_name": "ผู้บริหาร",
            "role": "executive",
            "portal_access": ["medical", "admin", "school"],
            "organization": "โรงพยาบาลกรุงเทพ",
            "department": "บริหารงานทั่วไป",
            "specialization": "การบริหารองค์กร",
            "phone": "096-666-6666",
            "license_number": "EXEC001",
            "qualifications": ["บริหารธุรกิจมหาบัณฑิต", "การบริหารสาธารณสุข"],
            "is_active": True,
            "is_verified": True
        }

        # Hospital Staff
        hospital_staff_data = {
            "email": "hospital.staff@hospital.com",
            "password": "password123",
            "first_name": "มาลี",
            "last_name": "เจ้าหน้าที่โรงพยาบาล",
            "role": "hospital_staff",
            "portal_access": ["medical"],
            "organization": "โรงพยาบาลกรุงเทพ",
            "department": "งานบริการ",
            "specialization": "เจ้าหน้าที่บริการ",
            "phone": "097-777-7777",
            "license_number": "HOSP001",
            "qualifications": ["การจัดการบริการสุขภาพ"],
            "is_active": True,
            "is_verified": True
        }

        # Create medical admin
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/admin/users",
            json=medical_admin_data,
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                admin_id = result.get('id')
                self.created_ids['medical_admins'].append(admin_id)
                print(f"✅ Created medical admin: {medical_admin_data['first_name']} {medical_admin_data['last_name']} (ID: {admin_id})")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create medical admin: {response.status} - {error_text}")

        # Create system admin
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/admin/users",
            json=system_admin_data,
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                admin_id = result.get('id')
                self.created_ids['system_admins'].append(admin_id)
                print(f"✅ Created system admin: {system_admin_data['first_name']} {system_admin_data['last_name']} (ID: {admin_id})")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create system admin: {response.status} - {error_text}")

        # Create executive
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/admin/users",
            json=executive_data,
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                admin_id = result.get('id')
                self.created_ids['executives'].append(admin_id)
                print(f"✅ Created executive: {executive_data['first_name']} {executive_data['last_name']} (ID: {admin_id})")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create executive: {response.status} - {error_text}")

        # Create hospital staff
        async with self.session.post(
            f"{API_BASE_URL}/api/v1/admin/users",
            json=hospital_staff_data,
            headers=self.get_headers()
        ) as response:
            if response.status == 200:
                result = await response.json()
                admin_id = result.get('id')
                self.created_ids['hospital_staff'].append(admin_id)
                print(f"✅ Created hospital staff: {hospital_staff_data['first_name']} {hospital_staff_data['last_name']} (ID: {admin_id})")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create hospital staff: {response.status} - {error_text}")

    async def create_hospitals(self):
        """Create sample hospitals (using school endpoint as template)"""
        print("\n🏥 Creating hospitals...")
        
        hospitals_data = [
            {
                "school_code": "HOS001",
                "name": "โรงพยาบาลกรุงเทพ",
                "type": "โรงพยาบาลเอกชน",
                "address": {
                    "house_no": "2",
                    "village_no": "1",
                    "soi": "สุขุมวิท 2",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                },
                "phone": "02-310-3000",
                "email": "info@bangkokhospital.com"
            },
            {
                "school_code": "HOS002",
                "name": "โรงพยาบาลจักษุกรุงเทพ",
                "type": "โรงพยาบาลเฉพาะทาง",
                "address": {
                    "house_no": "88",
                    "village_no": "2",
                    "soi": "สุขุมวิท 88",
                    "road": "สุขุมวิท",
                    "subdistrict": "คลองเตย",
                    "district": "คลองเตย",
                    "province": "กรุงเทพมหานคร",
                    "postal_code": "10110"
                },
                "phone": "02-310-3001",
                "email": "info@bangkokeye.com"
            }
        ]

        for hospital_data in hospitals_data:
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/evep/schools",
                json=hospital_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    hospital_id = result.get('school_id')
                    self.created_ids['hospitals'].append(hospital_id)
                    print(f"✅ Created hospital: {hospital_data['name']} (ID: {hospital_id})")
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create hospital {hospital_data['name']}: {response.status} - {error_text}")

    async def run(self):
        """Run the data population process"""
        print("🚀 Starting EVEP Medical Portal Data Population...")
        
        # Login first
        if not await self.login():
            print("❌ Cannot proceed without authentication")
            return

        try:
            # Create data in order (schools first, then teachers, parents, students, etc.)
            await self.create_schools()
            await self.create_teachers()
            await self.create_parents()
            await self.create_students()
            await self.create_hospitals()
            await self.create_medical_staff()
            await self.create_admin_users()

            print("\n🎉 Data population completed!")
            print("\n📊 Summary of created data:")
            for entity_type, ids in self.created_ids.items():
                if ids:
                    print(f"  {entity_type}: {len(ids)} records")
            
        except Exception as e:
            print(f"❌ Error during data population: {str(e)}")

async def main():
    async with DataPopulator() as populator:
        await populator.run()

if __name__ == "__main__":
    asyncio.run(main())
