#!/usr/bin/env python3
"""
Simple script to populate glasses inventory data
"""

import asyncio
from datetime import datetime
from app.core.database import get_database

async def populate_inventory():
    """Populate the database with sample inventory data"""
    try:
        print("🌱 Starting inventory population...")
        
        db = get_database()
        
        # Sample inventory data
        sample_items = [
            {
                "item_code": "GL001",
                "item_name": "Ray-Ban RB3025 Aviator - Gold",
                "category": "frames",
                "brand": "Ray-Ban",
                "model": "RB3025 Aviator",
                "specifications": {
                    "frame_color": "Gold",
                    "frame_size": "58mm",
                    "lens_type": "Progressive",
                    "lens_material": "Polycarbonate",
                    "lens_coating": "Blue Light Protection",
                    "prescription_range": {
                        "sphere_min": -8.0,
                        "sphere_max": 8.0,
                        "cylinder_min": -4.0,
                        "cylinder_max": 4.0
                    }
                },
                "unit_price": 2500.0,
                "cost_price": 1800.0,
                "current_stock": 25,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Ray-Ban Thailand",
                    "location": "Warehouse A"
                },
                "notes": "Classic aviator frames for children and teenagers",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            },
            {
                "item_code": "GL002",
                "item_name": "Oakley OX8046-0956 - Black",
                "category": "frames",
                "brand": "Oakley",
                "model": "OX8046-0956",
                "specifications": {
                    "frame_color": "Black",
                    "frame_size": "60mm",
                    "lens_type": "Single Vision",
                    "lens_material": "High-Index",
                    "lens_coating": "Anti-Reflective",
                    "prescription_range": {
                        "sphere_min": -6.0,
                        "sphere_max": 6.0,
                        "cylinder_min": -3.0,
                        "cylinder_max": 3.0
                    }
                },
                "unit_price": 1800.0,
                "cost_price": 1200.0,
                "current_stock": 15,
                "reorder_level": 3,
                "supplier_info": {
                    "name": "Oakley Thailand",
                    "location": "Warehouse A"
                },
                "notes": "Sports frames for outdoor activities",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            },
            {
                "item_code": "GL003",
                "item_name": "Tommy Hilfiger TH 1140/S - Blue",
                "category": "frames",
                "brand": "Tommy Hilfiger",
                "model": "TH 1140/S",
                "specifications": {
                    "frame_color": "Blue",
                    "frame_size": "55mm",
                    "lens_type": "Progressive",
                    "lens_material": "High-Index",
                    "lens_coating": "Blue Light Protection",
                    "prescription_range": {
                        "sphere_min": -7.0,
                        "sphere_max": 7.0,
                        "cylinder_min": -3.5,
                        "cylinder_max": 3.5
                    }
                },
                "unit_price": 2200.0,
                "cost_price": 1500.0,
                "current_stock": 8,
                "reorder_level": 2,
                "supplier_info": {
                    "name": "Tommy Hilfiger Thailand",
                    "location": "Warehouse B"
                },
                "notes": "Fashion frames for teenagers",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
        
        # Insert the data
        for item_data in sample_items:
            try:
                result = await db.evep.glasses_inventory.insert_one(item_data)
                print(f"✅ Added: {item_data['item_name']}")
            except Exception as e:
                print(f"❌ Error adding {item_data['item_name']}: {e}")
        
        # Verify the data was added
        final_count = await db.evep.glasses_inventory.count_documents({})
        print(f"\n📊 Final inventory count: {final_count}")
        
        return final_count
        
    except Exception as e:
        print(f"❌ Error populating inventory: {e}")
        return 0

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Simple Inventory Population")
    print("=" * 60)
    
    try:
        count = await populate_inventory()
        
        if count > 0:
            print(f"\n✅ Successfully populated {count} inventory items!")
            print("\n💡 Next steps:")
            print("   1. Refresh your frontend page")
            print("   2. Check the Glasses Inventory Management interface")
            print("   3. You should now see the inventory data")
        else:
            print("\n❌ Failed to populate inventory")
            
    except Exception as e:
        print(f"❌ Error in main: {e}")

if __name__ == "__main__":
    asyncio.run(main())

