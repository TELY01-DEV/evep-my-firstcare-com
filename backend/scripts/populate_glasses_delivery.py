#!/usr/bin/env python3
"""
Script to populate sample glasses delivery data for testing
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database

async def populate_delivery_data():
    """Populate sample glasses delivery data"""
    db = get_database()
    
    # Sample delivery data
    sample_deliveries = [
        {
            "delivery_id": "DEL001",
            "patient_id": "PAT001",
            "patient_name": "สมชาย ใจดี",
            "patient_cid": "1234567890123",
            "glasses_items": [
                {
                    "item_id": "GL001",
                    "item_name": "แว่นสายตาเด็ก",
                    "quantity": 1,
                    "prescription": "-2.00"
                }
            ],
            "prescription_details": {
                "right_eye": "-2.00",
                "left_eye": "-1.75",
                "pupillary_distance": "60mm"
            },
            "delivery_date": datetime.now() - timedelta(days=5),
            "delivery_status": "delivered",
            "delivery_method": "school_delivery",
            "delivered_by": "นางสาวสมใจ ใจดี",
            "school_name": "โรงเรียนวัดสระแก้ว",
            "notes": "ส่งมอบเรียบร้อยแล้ว",
            "created_at": datetime.now() - timedelta(days=6),
            "updated_at": datetime.now() - timedelta(days=5),
            "is_active": True
        },
        {
            "delivery_id": "DEL002",
            "patient_id": "PAT002",
            "patient_name": "สมหญิง รักดี",
            "patient_cid": "2345678901234",
            "glasses_items": [
                {
                    "item_id": "GL002",
                    "item_name": "แว่นสายตาสำหรับเด็ก",
                    "quantity": 1,
                    "prescription": "-1.50"
                }
            ],
            "prescription_details": {
                "right_eye": "-1.50",
                "left_eye": "-1.25",
                "pupillary_distance": "58mm"
            },
            "delivery_date": datetime.now() - timedelta(days=3),
            "delivery_status": "in_transit",
            "delivery_method": "home_delivery",
            "delivered_by": "นายสมศักดิ์ ใจดี",
            "school_name": "โรงเรียนบ้านหนองบัว",
            "notes": "กำลังจัดส่ง",
            "created_at": datetime.now() - timedelta(days=4),
            "updated_at": datetime.now() - timedelta(days=3),
            "is_active": True
        },
        {
            "delivery_id": "DEL003",
            "patient_id": "PAT003",
            "patient_name": "สมพร ใจงาม",
            "patient_cid": "3456789012345",
            "glasses_items": [
                {
                    "item_id": "GL003",
                    "item_name": "แว่นสายตาเด็ก",
                    "quantity": 1,
                    "prescription": "-3.00"
                }
            ],
            "prescription_details": {
                "right_eye": "-3.00",
                "left_eye": "-2.75",
                "pupillary_distance": "62mm"
            },
            "delivery_date": datetime.now() + timedelta(days=2),
            "delivery_status": "pending",
            "delivery_method": "school_delivery",
            "delivered_by": "",
            "school_name": "โรงเรียนชุมชนบ้านหนองแวง",
            "notes": "รอการจัดส่ง",
            "created_at": datetime.now() - timedelta(days=1),
            "updated_at": datetime.now() - timedelta(days=1),
            "is_active": True
        },
        {
            "delivery_id": "DEL004",
            "patient_id": "PAT004",
            "patient_name": "สมศักดิ์ ใจดี",
            "patient_cid": "4567890123456",
            "glasses_items": [
                {
                    "item_id": "GL004",
                    "item_name": "แว่นสายตาสำหรับเด็ก",
                    "quantity": 1,
                    "prescription": "-1.00"
                }
            ],
            "prescription_details": {
                "right_eye": "-1.00",
                "left_eye": "-0.75",
                "pupillary_distance": "56mm"
            },
            "delivery_date": datetime.now() - timedelta(days=10),
            "delivery_status": "delivered",
            "delivery_method": "home_delivery",
            "delivered_by": "นางสาวสมใจ ใจดี",
            "school_name": "โรงเรียนบ้านโนนสูง",
            "notes": "ส่งมอบเรียบร้อยแล้ว",
            "created_at": datetime.now() - timedelta(days=11),
            "updated_at": datetime.now() - timedelta(days=10),
            "is_active": True
        },
        {
            "delivery_id": "DEL005",
            "patient_id": "PAT005",
            "patient_name": "สมหมาย ใจงาม",
            "patient_cid": "5678901234567",
            "glasses_items": [
                {
                    "item_id": "GL005",
                    "item_name": "แว่นสายตาเด็ก",
                    "quantity": 1,
                    "prescription": "-2.50"
                }
            ],
            "prescription_details": {
                "right_eye": "-2.50",
                "left_eye": "-2.25",
                "pupillary_distance": "59mm"
            },
            "delivery_date": datetime.now() - timedelta(days=1),
            "delivery_status": "cancelled",
            "delivery_method": "school_delivery",
            "delivered_by": "",
            "school_name": "โรงเรียนบ้านหนองไผ่",
            "notes": "ยกเลิกการจัดส่ง - ผู้ปกครองไม่ต้องการ",
            "created_at": datetime.now() - timedelta(days=2),
            "updated_at": datetime.now() - timedelta(days=1),
            "is_active": True
        }
    ]
    
    try:
        # Clear existing delivery data
        await db.evep.glasses_delivery.delete_many({})
        print("Cleared existing delivery data")
        
        # Insert sample delivery data
        result = await db.evep.glasses_delivery.insert_many(sample_deliveries)
        print(f"Inserted {len(result.inserted_ids)} delivery records")
        
        # Verify the data
        count = await db.evep.glasses_delivery.count_documents({})
        print(f"Total delivery records in database: {count}")
        
        # Show sample data
        deliveries = await db.evep.glasses_delivery.find({}).to_list(5)
        print("\nSample delivery records:")
        for delivery in deliveries:
            print(f"- {delivery['delivery_id']}: {delivery['patient_name']} ({delivery['delivery_status']})")
        
    except Exception as e:
        print(f"Error populating delivery data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(populate_delivery_data())
