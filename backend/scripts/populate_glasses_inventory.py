#!/usr/bin/env python3
"""
Script to populate glasses inventory with sample data
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import random

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongo-primary:27017/evep")

async def populate_glasses_inventory():
    """Populate glasses inventory with sample data"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    try:
        # Check if data already exists
        existing_count = await db.glasses_inventory.count_documents({})
        if existing_count > 0:
            print(f"Glasses inventory already has {existing_count} items. Skipping population.")
            return
        
        # Sample glasses inventory data
        sample_items = [
            {
                "item_code": "GL001",
                "item_name": "Classic Black Frames",
                "category": "frames",
                "brand": "Ray-Ban",
                "model": "RB3025",
                "specifications": {
                    "frame_color": "Black",
                    "lens_type": "UV Protection",
                    "prescription_range": "-6.00 to +6.00",
                    "size": "Medium",
                    "material": "Acetate"
                },
                "unit_price": 2500.00,
                "cost_price": 1500.00,
                "current_stock": 25,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Optical Supply Co.",
                    "contact": "02-123-4567",
                    "location": "Bangkok"
                },
                "notes": "Popular classic style",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "GL002",
                "item_name": "Blue Light Blocking Lenses",
                "category": "lenses",
                "brand": "Zeiss",
                "model": "BlueGuard",
                "specifications": {
                    "lens_type": "Blue Light Blocking",
                    "prescription_range": "-8.00 to +8.00",
                    "size": "Universal",
                    "material": "Polycarbonate"
                },
                "unit_price": 1800.00,
                "cost_price": 1200.00,
                "current_stock": 15,
                "reorder_level": 3,
                "supplier_info": {
                    "name": "Lens Technology Ltd.",
                    "contact": "02-234-5678",
                    "location": "Chiang Mai"
                },
                "notes": "High demand for digital eye strain",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "GL003",
                "item_name": "Titanium Sports Frames",
                "category": "frames",
                "brand": "Oakley",
                "model": "Radar EV",
                "specifications": {
                    "frame_color": "Matte Black",
                    "lens_type": "Polarized",
                    "prescription_range": "-4.00 to +4.00",
                    "size": "Large",
                    "material": "Titanium"
                },
                "unit_price": 4500.00,
                "cost_price": 3000.00,
                "current_stock": 8,
                "reorder_level": 2,
                "supplier_info": {
                    "name": "Sports Optics Inc.",
                    "contact": "02-345-6789",
                    "location": "Phuket"
                },
                "notes": "Premium sports eyewear",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "GL004",
                "item_name": "Progressive Lenses",
                "category": "lenses",
                "brand": "Essilor",
                "model": "Varilux",
                "specifications": {
                    "lens_type": "Progressive",
                    "prescription_range": "-10.00 to +10.00",
                    "size": "Universal",
                    "material": "High Index"
                },
                "unit_price": 3200.00,
                "cost_price": 2000.00,
                "current_stock": 12,
                "reorder_level": 4,
                "supplier_info": {
                    "name": "Advanced Lens Co.",
                    "contact": "02-456-7890",
                    "location": "Bangkok"
                },
                "notes": "Multifocal vision correction",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "GL005",
                "item_name": "Reading Glasses +1.50",
                "category": "frames",
                "brand": "Generic",
                "model": "Reader Pro",
                "specifications": {
                    "frame_color": "Brown",
                    "lens_type": "Reading",
                    "prescription_range": "+1.50",
                    "size": "Medium",
                    "material": "Plastic"
                },
                "unit_price": 800.00,
                "cost_price": 400.00,
                "current_stock": 0,
                "reorder_level": 10,
                "supplier_info": {
                    "name": "Basic Optics",
                    "contact": "02-567-8901",
                    "location": "Khon Kaen"
                },
                "notes": "Out of stock - urgent reorder needed",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "GL006",
                "item_name": "Sunglasses Aviator",
                "category": "frames",
                "brand": "Polaroid",
                "model": "Aviator Classic",
                "specifications": {
                    "frame_color": "Gold",
                    "lens_type": "Polarized",
                    "prescription_range": "Plano",
                    "size": "Large",
                    "material": "Metal"
                },
                "unit_price": 1200.00,
                "cost_price": 800.00,
                "current_stock": 3,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Sun Protection Ltd.",
                    "contact": "02-678-9012",
                    "location": "Pattaya"
                },
                "notes": "Low stock warning",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        # Insert sample data
        result = await db.glasses_inventory.insert_many(sample_items)
        print(f"Successfully inserted {len(result.inserted_ids)} glasses inventory items")
        
        # Verify insertion
        count = await db.glasses_inventory.count_documents({})
        print(f"Total glasses inventory items: {count}")
        
    except Exception as e:
        print(f"Error populating glasses inventory: {e}")
        raise
    finally:
        client.close()

async def main():
    """Main function"""
    print("Starting glasses inventory population...")
    await populate_glasses_inventory()
    print("Glasses inventory population completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
