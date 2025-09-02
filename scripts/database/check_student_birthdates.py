#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_student_birthdates():
    """Check which students are missing birth dates"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all students
        all_students = await db.students.find({}).to_list(length=None)
        total_students = len(all_students)
        
        print(f"📊 Total Students: {total_students}")
        
        # Check birth date status
        students_with_birthdate = []
        students_without_birthdate = []
        
        for student in all_students:
            birth_date = student.get('birth_date', '')
            if birth_date and birth_date.strip():
                students_with_birthdate.append(student)
            else:
                students_without_birthdate.append(student)
        
        print(f"\n🎂 Birth Date Status:")
        print(f"   Students with birth date: {len(students_with_birthdate)}")
        print(f"   Students without birth date: {len(students_without_birthdate)}")
        
        # Show sample students with birth dates
        if students_with_birthdate:
            print(f"\n✅ Sample Students with Birth Dates:")
            for i, student in enumerate(students_with_birthdate[:5]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                birth_date = student.get('birth_date', '')
                print(f"   {i+1}. {name} - Birth Date: {birth_date}")
        
        # Show sample students without birth dates
        if students_without_birthdate:
            print(f"\n❌ Sample Students without Birth Dates:")
            for i, student in enumerate(students_without_birthdate[:10]):
                name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                age = student.get('age', 'N/A')
                grade = student.get('grade_level', 'N/A')
                print(f"   {i+1}. {name} - Age: {age}, Grade: {grade}")
        
        # Show complete field structure of first student
        if all_students:
            print(f"\n📋 Complete field structure of first student:")
            first_student = all_students[0]
            for field, value in first_student.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking student birth dates: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_student_birthdates())

