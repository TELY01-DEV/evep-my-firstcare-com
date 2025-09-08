#!/usr/bin/env python3
"""
Script to check the database directly for existing inventory data
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def check_database_inventory():
    """Check the database directly for inventory data"""
    try:
        from app.core.database import get_database
        
        print("🔍 Checking database directly...")
        
        db = await get_database()
        
        # Check glasses inventory collection
        inventory_count = await db.evep.glasses_inventory.count_documents({})
        print(f"📊 Glasses Inventory items in database: {inventory_count}")
        
        if inventory_count > 0:
            print("\n📋 Existing inventory items:")
            cursor = db.evep.glasses_inventory.find({}, {"item_name": 1, "item_code": 1, "category": 1})
            
            async for item in cursor:
                print(f"  • {item.get('item_code', 'N/A')}: {item.get('item_name', 'N/A')} ({item.get('category', 'N/A')})")
        else:
            print("❌ No inventory data found in database")
            
        # Check glasses delivery collection
        delivery_count = await db.evep.glasses_delivery.count_documents({})
        print(f"\n📦 Glasses Delivery records in database: {delivery_count}")
        
        if delivery_count > 0:
            print("\n📋 Existing delivery records:")
            cursor = db.evep.glasses_delivery.find({}, {"delivery_id": 1, "patient_name": 1, "glasses_description": 1})
            
            async for item in cursor:
                print(f"  • {item.get('delivery_id', 'N/A')}: {item.get('patient_name', 'N/A')} - {item.get('glasses_description', 'N/A')}")
        else:
            print("❌ No delivery data found in database")
            
        await db.client.close()
        
        return inventory_count, delivery_count
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return 0, 0

async def populate_sample_inventory():
    """Populate the database with sample inventory data"""
    try:
        from app.core.database import get_database
        from datetime import datetime
        
        print("\n🌱 Populating database with sample inventory data...")
        
        db = await get_database()
        
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
        
        await db.client.close()
        return final_count
        
    except Exception as e:
        print(f"❌ Error populating inventory: {e}")
        return 0

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Database Inventory Check")
    print("=" * 60)
    
    # Check existing data
    inventory_count, delivery_count = await check_database_inventory()
    
    if inventory_count == 0:
        print(f"\n🌱 No inventory data found. Populating with sample data...")
        await populate_sample_inventory()
    else:
        print(f"\n✅ Database already has {inventory_count} inventory items")
    
    print(f"\n📦 Database has {delivery_count} delivery records")
    
    print("\n💡 Next steps:")
    print("   1. Refresh your frontend page")
    print("   2. Check the Glasses Inventory Management interface")
    print("   3. You should now see the inventory data")
    print("   4. If still not visible, check browser console for errors")

if __name__ == "__main__":
    asyncio.run(main())
