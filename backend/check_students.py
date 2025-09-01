#!/usr/bin/env python3
import asyncio
import sys
import os

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def check_students():
    """Check students in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check total students
        total_students = await db.students.count_documents({})
        print(f"📊 Total Students: {total_students}")
        
        if total_students > 0:
            # Get some sample students
            students = await db.students.find({}, {"name": 1, "gender": 1, "consent_status": 1}).limit(5).to_list(length=5)
            print("\n📋 Sample Students:")
            for student in students:
                print(f"   - {student.get('name', 'Unknown')} ({student.get('gender', 'Unknown')}) - Consent: {student.get('consent_status', 'Unknown')}")
        else:
            print("❌ No students found in database")
            
        # Check by gender
        male_students = await db.students.count_documents({"gender": "male"})
        female_students = await db.students.count_documents({"gender": "female"})
        
        print(f"\n👥 Gender Breakdown:")
        print(f"   Male Students: {male_students}")
        print(f"   Female Students: {female_students}")
        
        # Check consent status
        with_consent = await db.students.count_documents({"consent_status": "granted"})
        without_consent = await db.students.count_documents({"consent_status": {"$ne": "granted"}})
        
        print(f"\n✅ Consent Status:")
        print(f"   With Consent: {with_consent}")
        print(f"   Without Consent: {without_consent}")
        
    except Exception as e:
        print(f"❌ Error checking students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_students())
