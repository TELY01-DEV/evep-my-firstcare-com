#!/usr/bin/env python3
"""
Check if existing screening data matches the screening types
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

async def check_screening_data_mismatch():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongo-primary:27017')
    db = client.evep
    
    print('🔍 Checking Screening Data vs Screening Types')
    print('=' * 50)
    
    # Get all screenings
    screenings = await db.school_screenings.find({}).to_list(length=None)
    
    print(f'Total screenings: {len(screenings)}')
    
    # Define expected screening types
    expected_types = [
        'basic_school',
        'vision_test', 
        'comprehensive_vision',
        'color_blindness',
        'depth_perception'
    ]
    
    # Check each screening
    print('\n📊 Screening Data Analysis:')
    print('-' * 40)
    
    for i, screening in enumerate(screenings, 1):
        screening_type = screening.get('screening_type', '')
        student_name = screening.get('student_name', '')
        status = screening.get('status', '')
        
        # Check if screening type matches expected types
        is_valid = screening_type in expected_types
        
        print(f'{i:2d}. {student_name:20s} | Type: "{screening_type:20s}" | Status: {status:10s} | Valid: {"✅" if is_valid else "❌"}')
        
        if not is_valid:
            print(f'     ⚠️  Unexpected screening type: "{screening_type}"')
    
    # Summary
    print('\n📈 Summary:')
    print('-' * 20)
    
    # Count by screening type
    type_counts = {}
    for screening in screenings:
        screening_type = screening.get('screening_type', '')
        type_counts[screening_type] = type_counts.get(screening_type, 0) + 1
    
    print('Screening Type Counts:')
    for screening_type, count in sorted(type_counts.items()):
        is_expected = screening_type in expected_types
        status = "✅ Expected" if is_expected else "❌ Unexpected"
        print(f'  "{screening_type:20s}": {count:2d} screenings | {status}')
    
    # Check for any unexpected types
    unexpected_types = [st for st in type_counts.keys() if st not in expected_types]
    if unexpected_types:
        print(f'\n⚠️  Unexpected screening types found: {unexpected_types}')
        print('   These types are not in the filter options!')
    else:
        print('\n✅ All screening types match the filter options!')
    
    # Check for missing expected types
    missing_types = [st for st in expected_types if st not in type_counts]
    if missing_types:
        print(f'\n⚠️  Expected screening types not found in data: {missing_types}')
    else:
        print('\n✅ All expected screening types are present in the data!')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_screening_data_mismatch())
