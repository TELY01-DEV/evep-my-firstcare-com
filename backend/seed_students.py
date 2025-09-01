#!/usr/bin/env python3
import asyncio
import sys
import os
import random
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def seed_students():
    """Seed demo student data"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    # Demo students data
    demo_students = [
        {
            "student_id": "STU001",
            "name": "Aisha Rahman",
            "gender": "female",
            "age": 8,
            "grade": "3rd Grade",
            "school": "Bangkok International School",
            "parent_name": "Fatima Rahman",
            "parent_phone": "+66-2-123-4567",
            "parent_email": "fatima.rahman@email.com",
            "consent_status": "granted",
            "consent_date": datetime.now().isoformat(),
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU002",
            "name": "Chen Wei",
            "gender": "male",
            "age": 9,
            "grade": "4th Grade",
            "school": "Bangkok International School",
            "parent_name": "Li Wei",
            "parent_phone": "+66-2-123-4568",
            "parent_email": "li.wei@email.com",
            "consent_status": "granted",
            "consent_date": datetime.now().isoformat(),
            "medical_history": "None",
            "allergies": "Peanuts",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU003",
            "name": "Priya Patel",
            "gender": "female",
            "age": 7,
            "grade": "2nd Grade",
            "school": "Bangkok International School",
            "parent_name": "Raj Patel",
            "parent_phone": "+66-2-123-4569",
            "parent_email": "raj.patel@email.com",
            "consent_status": "pending",
            "consent_date": None,
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU004",
            "name": "Ahmed Hassan",
            "gender": "male",
            "age": 10,
            "grade": "5th Grade",
            "school": "Bangkok International School",
            "parent_name": "Omar Hassan",
            "parent_phone": "+66-2-123-4570",
            "parent_email": "omar.hassan@email.com",
            "consent_status": "granted",
            "consent_date": datetime.now().isoformat(),
            "medical_history": "Asthma",
            "allergies": "Dust",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU005",
            "name": "Emma Johnson",
            "gender": "female",
            "age": 8,
            "grade": "3rd Grade",
            "school": "Bangkok International School",
            "parent_name": "Sarah Johnson",
            "parent_phone": "+66-2-123-4571",
            "parent_email": "sarah.johnson@email.com",
            "consent_status": "granted",
            "consent_date": datetime.now().isoformat(),
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU006",
            "name": "Yuki Tanaka",
            "gender": "male",
            "age": 9,
            "grade": "4th Grade",
            "school": "Bangkok International School",
            "parent_name": "Ken Tanaka",
            "parent_phone": "+66-2-123-4572",
            "parent_email": "ken.tanaka@email.com",
            "consent_status": "denied",
            "consent_date": None,
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU007",
            "name": "Maria Garcia",
            "gender": "female",
            "age": 7,
            "grade": "2nd Grade",
            "school": "Bangkok International School",
            "parent_name": "Carlos Garcia",
            "parent_phone": "+66-2-123-4573",
            "parent_email": "carlos.garcia@email.com",
            "consent_status": "granted",
            "consent_date": datetime.now().isoformat(),
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "student_id": "STU008",
            "name": "Arun Kumar",
            "gender": "male",
            "age": 10,
            "grade": "5th Grade",
            "school": "Bangkok International School",
            "parent_name": "Vikram Kumar",
            "parent_phone": "+66-2-123-4574",
            "parent_email": "vikram.kumar@email.com",
            "consent_status": "pending",
            "consent_date": None,
            "medical_history": "None",
            "allergies": "None",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    try:
        # Clear existing demo students
        await db.students.delete_many({"student_id": {"$in": [student["student_id"] for student in demo_students]}})
        print("✅ Cleared existing demo students")
        
        # Insert demo students
        result = await db.students.insert_many(demo_students)
        print(f"✅ Created {len(result.inserted_ids)} demo students")
        
        # Print summary
        print("\n📊 Student Summary:")
        total_students = await db.students.count_documents({})
        male_students = await db.students.count_documents({"gender": "male"})
        female_students = await db.students.count_documents({"gender": "female"})
        with_consent = await db.students.count_documents({"consent_status": "granted"})
        
        print(f"   Total Students: {total_students}")
        print(f"   Male Students: {male_students}")
        print(f"   Female Students: {female_students}")
        print(f"   With Consent: {with_consent}")
        
        print("\n📋 Created Students:")
        for student in demo_students:
            print(f"   - {student['name']} ({student['gender']}) - Consent: {student['consent_status']}")
        
        print("\n🎉 Demo students seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_students())
