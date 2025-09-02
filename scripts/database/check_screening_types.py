#!/usr/bin/env python3
"""
Check screening types in the database
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

async def check_screening_types():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongo-primary:27017')
    db = client.evep
    
    print('🔍 Checking Screening Types in Database')
    print('=' * 40)
    
    # Get all screenings
    screenings = await db.school_screenings.find({}).to_list(length=None)
    
    print(f'Total screenings: {len(screenings)}')
    
    # Get unique screening types
    screening_types = set()
    statuses = set()
    
    for screening in screenings:
        screening_type = screening.get('screening_type', '')
        status = screening.get('status', '')
        screening_types.add(screening_type)
        statuses.add(status)
    
    print('\nScreening Types found:')
    for st in sorted(screening_types):
        count = sum(1 for s in screenings if s.get('screening_type') == st)
        print(f'  - "{st}": {count} screenings')
    
    print('\nStatuses found:')
    for status in sorted(statuses):
        count = sum(1 for s in screenings if s.get('status') == status)
        print(f'  - "{status}": {count} screenings')
    
    # Get a sample screening
    if screenings:
        sample = screenings[0]
        print(f'\nSample screening:')
        print(f'  screening_type: "{sample.get("screening_type")}"')
        print(f'  status: "{sample.get("status")}"')
        print(f'  student_name: "{sample.get("student_name")}"')
        print(f'  teacher_name: "{sample.get("teacher_name")}"')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_screening_types())
