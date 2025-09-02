#!/usr/bin/env python3
"""
Test script to check school screening update functionality
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import json

# MongoDB connection
MONGO_URI = "mongodb://mongo-primary:27017"
DB_NAME = "evep"

async def test_school_screening_update():
    """Test school screening update functionality"""
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("🔍 Testing School Screening Update Functionality")
    print("=" * 50)
    
    # 1. Check existing screenings
    print("\n1. Checking existing school screenings...")
    screenings = await db.evep.school_screenings.find({}).to_list(length=10)
    print(f"   Found {len(screenings)} screenings")
    
    if not screenings:
        print("   ❌ No screenings found to test with")
        return
    
    # 2. Get a sample screening
    sample_screening = screenings[0]
    screening_id = sample_screening.get('screening_id')
    print(f"\n2. Testing with screening ID: {screening_id}")
    
    # 3. Check current data
    print(f"\n3. Current screening data:")
    print(f"   Status: {sample_screening.get('status')}")
    print(f"   Results: {len(sample_screening.get('results', []))} results")
    print(f"   Notes: {sample_screening.get('notes', 'None')}")
    print(f"   Updated at: {sample_screening.get('updated_at')}")
    
    # 4. Simulate an update
    print(f"\n4. Simulating update...")
    update_data = {
        "results": [
            {
                "eye": "left",
                "distance_acuity": "20/25",
                "near_acuity": "20/40",
                "color_vision": "normal",
                "depth_perception": "normal",
                "additional_tests": None
            },
            {
                "eye": "right",
                "distance_acuity": "20/30",
                "near_acuity": "20/35",
                "color_vision": "normal",
                "depth_perception": "normal",
                "additional_tests": None
            }
        ],
        "status": "completed",
        "notes": "Test update from script",
        "recommendations": "Follow up in 6 months",
        "conclusion": "Normal vision screening results",
        "referral_needed": False,
        "referral_notes": None,
        "updated_at": datetime.now()
    }
    
    # 5. Perform update
    result = await db.evep.school_screenings.update_one(
        {"screening_id": screening_id},
        {"$set": update_data}
    )
    
    print(f"   Update result: {result.modified_count} documents modified")
    
    # 6. Verify update
    print(f"\n5. Verifying update...")
    updated_screening = await db.evep.school_screenings.find_one({"screening_id": screening_id})
    
    if updated_screening:
        print(f"   ✅ Screening found after update")
        print(f"   Status: {updated_screening.get('status')}")
        print(f"   Results: {len(updated_screening.get('results', []))} results")
        print(f"   Notes: {updated_screening.get('notes', 'None')}")
        print(f"   Updated at: {updated_screening.get('updated_at')}")
        
        # Check if results were updated
        if len(updated_screening.get('results', [])) == 2:
            print(f"   ✅ Results updated successfully")
        else:
            print(f"   ❌ Results not updated properly")
            
        # Check if status was updated
        if updated_screening.get('status') == 'completed':
            print(f"   ✅ Status updated successfully")
        else:
            print(f"   ❌ Status not updated properly")
            
    else:
        print(f"   ❌ Screening not found after update")
    
    # 7. Check all screenings to see if data is persisted
    print(f"\n6. Checking all screenings for data consistency...")
    all_screenings = await db.evep.school_screenings.find({}).to_list(length=None)
    
    completed_count = sum(1 for s in all_screenings if s.get('status') == 'completed')
    with_results_count = sum(1 for s in all_screenings if s.get('results'))
    
    print(f"   Total screenings: {len(all_screenings)}")
    print(f"   Completed screenings: {completed_count}")
    print(f"   Screenings with results: {with_results_count}")
    
    # 8. Check for any screenings with recent updates
    recent_screenings = await db.evep.school_screenings.find({
        "updated_at": {"$gte": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
    }).to_list(length=None)
    
    print(f"   Screenings updated today: {len(recent_screenings)}")
    
    client.close()
    print(f"\n✅ Test completed")

if __name__ == "__main__":
    asyncio.run(test_school_screening_update())
