#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_parents():
    """Check parent data and their relationships to students"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents
        all_parents = await db.parents.find({}).to_list(length=None)
        total_parents = len(all_parents)
        
        print(f"📊 Total Parents: {total_parents}")
        
        # Check parent types
        mothers = []
        fathers = []
        other_guardians = []
        
        for parent in all_parents:
            relation = parent.get('relation', '').lower()
            gender = parent.get('gender', '').lower()
            
            if relation in ['mother', 'mom', 'แม่'] or gender == 'female':
                mothers.append(parent)
            elif relation in ['father', 'dad', 'พ่อ'] or gender == 'male':
                fathers.append(parent)
            else:
                other_guardians.append(parent)
        
        print(f"\n👥 Parent Types:")
        print(f"   Mothers: {len(mothers)}")
        print(f"   Fathers: {len(fathers)}")
        print(f"   Other Guardians: {len(other_guardians)}")
        
        # Show sample parents
        if mothers:
            print(f"\n👩 Sample Mothers:")
            for i, parent in enumerate(mothers[:3]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} - Relation: {relation}")
        
        if fathers:
            print(f"\n👨 Sample Fathers:")
            for i, parent in enumerate(fathers[:3]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} - Relation: {relation}")
        
        if other_guardians:
            print(f"\n👤 Sample Other Guardians:")
            for i, parent in enumerate(other_guardians[:3]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                gender = parent.get('gender', '')
                print(f"   {i+1}. {name} - Relation: {relation}, Gender: {gender}")
        
        # Check student-parent relationships
        print(f"\n🔗 Student-Parent Relationships:")
        students_with_parents = await db.students.count_documents({"parent_id": {"$exists": True, "$ne": ""}})
        students_without_parents = await db.students.count_documents({"parent_id": {"$exists": False}})
        students_with_empty_parents = await db.students.count_documents({"parent_id": ""})
        
        print(f"   Students with parent_id: {students_with_parents}")
        print(f"   Students without parent_id field: {students_without_parents}")
        print(f"   Students with empty parent_id: {students_with_empty_parents}")
        
        # Show sample relationships
        students = await db.students.find({"parent_id": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Student-Parent Relationships:")
        for student in students:
            student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
            parent_id = student.get('parent_id', '')
            
            # Find the parent
            parent = await db.parents.find_one({"_id": parent_id})
            if parent:
                parent_name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                print(f"   {student_name} → {parent_name} ({relation})")
            else:
                print(f"   {student_name} → Parent ID {parent_id} (not found)")
        
        # Show complete field structure of first parent
        if all_parents:
            print(f"\n📋 Complete field structure of first parent:")
            first_parent = all_parents[0]
            for field, value in first_parent.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking parents: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_parents())

