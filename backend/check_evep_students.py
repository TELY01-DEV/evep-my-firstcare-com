#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_evep_students():
    """Check if there are students in the EVEP database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🔍 Checking EVEP students database...")
        
        # Check students collection
        students_count = await db.students.count_documents({})
        active_students_count = await db.students.count_documents({"status": "active"})
        
        print(f"\n📊 EVEP Students Statistics:")
        print(f"   Total students: {students_count}")
        print(f"   Active students: {active_students_count}")
        
        if active_students_count > 0:
            print(f"\n✅ Found {active_students_count} active students in EVEP database")
            
            # Get sample students
            sample_students = await db.students.find({"status": "active"}).limit(5).to_list(length=None)
            
            print(f"\n📋 Sample Students:")
            for student in sample_students:
                print(f"   - ID: {student['_id']}")
                print(f"     Name: {student.get('first_name', '')} {student.get('last_name', '')}")
                print(f"     School: {student.get('school_name', 'N/A')}")
                print(f"     Grade: {student.get('grade_level', 'N/A')}")
                print(f"     Status: {student.get('status', 'N/A')}")
                print()
        else:
            print(f"\n⚠️  No active students found in EVEP database!")
            print("   This is why the student selection dropdown is empty.")
            
            # Check if there are any students at all
            if students_count > 0:
                print(f"   There are {students_count} inactive students.")
                
                # Get sample inactive students
                sample_inactive = await db.students.find({"status": {"$ne": "active"}}).limit(3).to_list(length=None)
                
                print(f"\n📋 Sample Inactive Students:")
                for student in sample_inactive:
                    print(f"   - ID: {student['_id']}")
                    print(f"     Name: {student.get('first_name', '')} {student.get('last_name', '')}")
                    print(f"     Status: {student.get('status', 'N/A')}")
                    print()
        
        # Check if students have required fields for frontend
        if active_students_count > 0:
            print(f"\n🔍 Checking student data structure...")
            
            sample_student = await db.students.find_one({"status": "active"})
            if sample_student:
                print(f"   Required fields for frontend:")
                print(f"     - id: {'✅' if '_id' in sample_student else '❌'}")
                print(f"     - first_name: {'✅' if 'first_name' in sample_student else '❌'}")
                print(f"     - last_name: {'✅' if 'last_name' in sample_student else '❌'}")
                print(f"     - student_code: {'✅' if 'student_code' in sample_student else '❌'}")
                print(f"     - school_name: {'✅' if 'school_name' in sample_student else '❌'}")
                print(f"     - grade_level: {'✅' if 'grade_level' in sample_student else '❌'}")
        
    except Exception as e:
        print(f"❌ Error checking EVEP students: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_evep_students())
