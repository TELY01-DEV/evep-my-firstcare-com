#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def list_students():
    client = AsyncIOMotorClient('mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin')
    db = client.evep
    
    print('All students:')
    students = await db.students.find({}).to_list(None)
    for s in students:
        print(f'  - {s["_id"]}: {s.get("first_name", "")} {s.get("last_name", "")} (School: {s.get("school_name", "")})')
    
    print('\nAll patients:')
    patients = await db.patients.find({}).to_list(None)
    for p in patients:
        print(f'  - {p["_id"]}: {p.get("first_name", "")} {p.get("last_name", "")}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(list_students())
