#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_evep_students():
    client = AsyncIOMotorClient('mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin')
    db = client.evep
    
    print('Students in evep.students collection:')
    students = await db['evep.students'].find({}).to_list(None)
    for s in students:
        print(f'  - {s["_id"]}: {s.get("first_name", "")} {s.get("last_name", "")}')
    
    # Check if the problematic student exists
    student_id = '68be9b7219d48ff5ee0bed2e'
    student = await db['evep.students'].find_one({'_id': ObjectId(student_id)})
    print(f'\nStudent {student_id} in evep.students: {student is not None}')
    if student:
        print(f'Student name: {student.get("first_name", "")} {student.get("last_name", "")}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_evep_students())
