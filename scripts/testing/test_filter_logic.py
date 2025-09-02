#!/usr/bin/env python3
"""
Test the filter logic to see if it's working correctly
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime

async def test_filter_logic():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongo-primary:27017')
    db = client.evep
    
    print('🧪 Testing Filter Logic')
    print('=' * 30)
    
    # Get all screenings
    screenings = await db.school_screenings.find({}).to_list(length=None)
    
    # Test filter by screening type
    print('\n📊 Testing Filter by Screening Type:')
    print('-' * 40)
    
    filter_types = [
        'basic_school',
        'vision_test', 
        'comprehensive_vision',
        'color_blindness',
        'depth_perception'
    ]
    
    for filter_type in filter_types:
        # Simulate the frontend filter logic
        filtered_screenings = [
            s for s in screenings 
            if s.get('screening_type') == filter_type
        ]
        
        print(f'Filter "{filter_type:20s}": {len(filtered_screenings):2d} screenings found')
        
        # Show first few results
        for i, screening in enumerate(filtered_screenings[:3], 1):
            student_name = screening.get('student_name', '')
            status = screening.get('status', '')
            print(f'  {i}. {student_name:20s} | Status: {status}')
        
        if len(filtered_screenings) > 3:
            print(f'  ... and {len(filtered_screenings) - 3} more')
        print()
    
    # Test filter by status
    print('\n📊 Testing Filter by Status:')
    print('-' * 30)
    
    statuses = ['completed', 'pending']
    
    for status in statuses:
        filtered_screenings = [
            s for s in screenings 
            if s.get('status') == status
        ]
        
        print(f'Filter "{status:10s}": {len(filtered_screenings):2d} screenings found')
        
        # Show first few results
        for i, screening in enumerate(filtered_screenings[:3], 1):
            student_name = screening.get('student_name', '')
            screening_type = screening.get('screening_type', '')
            print(f'  {i}. {student_name:20s} | Type: {screening_type}')
        
        if len(filtered_screenings) > 3:
            print(f'  ... and {len(filtered_screenings) - 3} more')
        print()
    
    # Test combined filters
    print('\n📊 Testing Combined Filters:')
    print('-' * 30)
    
    # Test: basic_school + completed
    combined_filtered = [
        s for s in screenings 
        if s.get('screening_type') == 'basic_school' and s.get('status') == 'completed'
    ]
    
    print(f'Filter "basic_school + completed": {len(combined_filtered)} screenings found')
    for i, screening in enumerate(combined_filtered, 1):
        student_name = screening.get('student_name', '')
        print(f'  {i}. {student_name}')
    
    print('\n✅ Filter logic test completed!')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_filter_logic())
