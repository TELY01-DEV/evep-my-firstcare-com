#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_parent_student_relationships():
    """Fix parent-student relationships by assigning existing parents to students"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents and students
        all_parents = await db.parents.find({}).to_list(length=None)
        all_students = await db.students.find({}).to_list(length=None)
        
        print(f"📊 Found {len(all_parents)} parents and {len(all_students)} students")
        
        if len(all_parents) == 0:
            print("❌ No parents found in database")
            return
        
        if len(all_students) == 0:
            print("❌ No students found in database")
            return
        
        # Group parents by relation type
        mothers = [p for p in all_parents if p.get('relation') == 'มารดา']
        fathers = [p for p in all_parents if p.get('relation') == 'บิดา']
        other_guardians = [p for p in all_parents if p.get('relation') not in ['มารดา', 'บิดา']]
        
        print(f"👥 Parent breakdown:")
        print(f"   Mothers: {len(mothers)}")
        print(f"   Fathers: {len(fathers)}")
        print(f"   Other Guardians: {len(other_guardians)}")
        
        # Fix student-parent relationships
        updated_count = 0
        students_with_parents = 0
        
        for i, student in enumerate(all_students):
            # Check if student already has a valid parent
            current_parent_id = student.get('parent_id', '')
            if current_parent_id:
                # Check if parent exists
                parent_exists = await db.parents.find_one({"_id": current_parent_id})
                if parent_exists:
                    students_with_parents += 1
                    continue
            
            # Assign a parent based on student index
            if i < len(mothers):
                # Assign mother
                parent = mothers[i]
                parent_id = str(parent['_id'])
                relation = 'มารดา'
            elif i < len(mothers) + len(fathers):
                # Assign father
                parent = fathers[i - len(mothers)]
                parent_id = str(parent['_id'])
                relation = 'บิดา'
            else:
                # Assign other guardian (cycle through available guardians)
                guardian_index = (i - len(mothers) - len(fathers)) % len(other_guardians) if other_guardians else 0
                if other_guardians:
                    parent = other_guardians[guardian_index]
                    parent_id = str(parent['_id'])
                    relation = parent.get('relation', 'ผู้ปกครอง')
                else:
                    # If no other guardians, use first available parent
                    parent = all_parents[i % len(all_parents)]
                    parent_id = str(parent['_id'])
                    relation = parent.get('relation', 'ผู้ปกครอง')
            
            # Update student with parent_id
            result = await db.students.update_one(
                {"_id": student["_id"]},
                {"$set": {"parent_id": parent_id}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
                parent_name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                print(f"✅ Assigned {student_name} → {parent_name} ({relation})")
        
        print(f"\n📊 Relationship Fix Summary:")
        print(f"   Students with existing valid parents: {students_with_parents}")
        print(f"   Students updated with new parents: {updated_count}")
        print(f"   Total students: {len(all_students)}")
        
        # Verify the relationships
        students_with_parents_after = await db.students.count_documents({"parent_id": {"$exists": True, "$ne": ""}})
        students_without_parents_after = await db.students.count_documents({"parent_id": {"$exists": False}})
        students_with_empty_parents_after = await db.students.count_documents({"parent_id": ""})
        
        print(f"\n🔗 Final Relationship Status:")
        print(f"   Students with parent_id: {students_with_parents_after}")
        print(f"   Students without parent_id field: {students_without_parents_after}")
        print(f"   Students with empty parent_id: {students_with_empty_parents_after}")
        
        # Show sample relationships
        sample_students = await db.students.find({"parent_id": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Student-Parent Relationships:")
        for student in sample_students:
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
        
    except Exception as e:
        print(f"❌ Error fixing parent-student relationships: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_parent_student_relationships())

