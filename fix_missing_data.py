#!/usr/bin/env python3
from pymongo import MongoClient
from bson import ObjectId
import json

def fix_missing_data():
    """Check and fix missing data in evep collections"""
    
    client = MongoClient('mongodb://mongo-primary:27017')
    db = client.evep
    
    print("=== CHECKING MISSING DATA ===")
    
    # Check evep collections
    evep_students = db['evep.students'].count_documents({})
    evep_parents = db['evep.parents'].count_documents({})
    evep_teachers = db['evep.teachers'].count_documents({})
    evep_schools = db['evep.schools'].count_documents({})
    
    print(f"evep.students: {evep_students} documents")
    print(f"evep.parents: {evep_parents} documents")
    print(f"evep.teachers: {evep_teachers} documents")
    print(f"evep.schools: {evep_schools} documents")
    
    # Check if we need to create sample data
    if evep_parents == 0:
        print("\n⚠️ evep.parents is empty - creating sample parent data...")
        create_sample_parents(db)
    
    if evep_teachers < 5:
        print(f"\n⚠️ evep.teachers has only {evep_teachers} documents - creating sample teacher data...")
        create_sample_teachers(db)
    
    if evep_schools < 5:
        print(f"\n⚠️ evep.schools has only {evep_schools} documents - creating sample school data...")
        create_sample_schools(db)
    
    print("\n=== FINAL STATUS ===")
    evep_students = db['evep.students'].count_documents({})
    evep_parents = db['evep.parents'].count_documents({})
    evep_teachers = db['evep.teachers'].count_documents({})
    evep_schools = db['evep.schools'].count_documents({})
    
    print(f"evep.students: {evep_students} documents")
    print(f"evep.parents: {evep_parents} documents")
    print(f"evep.teachers: {evep_teachers} documents")
    print(f"evep.schools: {evep_schools} documents")
    
    client.close()

def create_sample_parents(db):
    """Create sample parent data"""
    
    sample_parents = [
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e8057b5"),
            "title": "คุณ",
            "first_name": "สมชาย",
            "last_name": "วงศ์เงิน",
            "cid": "1234567890123",
            "birth_date": "1980-01-15",
            "gender": "1",
            "relation": "father",
            "phone": "0812345678",
            "email": "somchai@example.com",
            "address": {
                "street": "123 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        },
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e805793"),
            "title": "คุณ",
            "first_name": "สมหญิง",
            "last_name": "วงศ์เงิน",
            "cid": "1234567890124",
            "birth_date": "1982-03-20",
            "gender": "2",
            "relation": "mother",
            "phone": "0812345679",
            "email": "somying@example.com",
            "address": {
                "street": "123 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    # Insert sample parents
    for parent in sample_parents:
        db['evep.parents'].insert_one(parent)
    
    print(f"✓ Created {len(sample_parents)} sample parents")

def create_sample_teachers(db):
    """Create sample teacher data"""
    
    sample_teachers = [
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e8057c0"),
            "title": "ครู",
            "first_name": "วิชัย",
            "last_name": "มุ่งมั่น",
            "cid": "1234567890125",
            "birth_date": "1975-06-10",
            "gender": "1",
            "phone": "0812345680",
            "email": "wichai@example.com",
            "school": "โรงเรียนนานาชาตินิสท์",
            "subject": "คณิตศาสตร์",
            "grade_level": "ประถมศึกษา",
            "address": {
                "street": "456 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        },
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e8057c1"),
            "title": "ครู",
            "first_name": "สมหญิง",
            "last_name": "รักเรียน",
            "cid": "1234567890126",
            "birth_date": "1978-09-15",
            "gender": "2",
            "phone": "0812345681",
            "email": "somying_teacher@example.com",
            "school": "โรงเรียนนานาชาติกรุงเทพ",
            "subject": "วิทยาศาสตร์",
            "grade_level": "มัธยมศึกษา",
            "address": {
                "street": "789 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "profile_photo": "",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    # Insert sample teachers
    for teacher in sample_teachers:
        db['evep.teachers'].insert_one(teacher)
    
    print(f"✓ Created {len(sample_teachers)} sample teachers")

def create_sample_schools(db):
    """Create sample school data"""
    
    sample_schools = [
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e8057d0"),
            "name": "โรงเรียนนานาชาตินิสท์",
            "type": "นานาชาติ",
            "school_code": "SCH003",
            "address": {
                "street": "123 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "phone": "02-123-4567",
            "email": "info@nis.edu.th",
            "website": "https://www.nis.edu.th",
            "principal": "ดร. จอห์น สมิธ",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        },
        {
            "_id": ObjectId("68b50fa3b4fe5ea88e8057d1"),
            "name": "โรงเรียนนานาชาติกรุงเทพ",
            "type": "นานาชาติ",
            "school_code": "SCH001",
            "address": {
                "street": "456 ถนนสุขุมวิท",
                "district": "วัฒนา",
                "city": "กรุงเทพมหานคร",
                "province": "กรุงเทพมหานคร",
                "postal_code": "10110"
            },
            "phone": "02-234-5678",
            "email": "info@bkkis.edu.th",
            "website": "https://www.bkkis.edu.th",
            "principal": "ดร. สมหญิง จอห์นสัน",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    # Insert sample schools
    for school in sample_schools:
        db['evep.schools'].insert_one(school)
    
    print(f"✓ Created {len(sample_schools)} sample schools")

if __name__ == "__main__":
    fix_missing_data()
