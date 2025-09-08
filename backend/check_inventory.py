#!/usr/bin/env python3
"""
Script to check and populate glasses inventory data
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def check_inventory():
    """Check if glasses inventory data exists"""
    try:
        from app.core.database import get_database
        
        db = await get_database()
        
        # Check if glasses inventory collection exists and has data
        count = await db.evep.glasses_inventory.count_documents({})
        print(f"📊 Current glasses inventory items: {count}")
        
        if count > 0:
            # Show some sample data
            sample = await db.evep.glasses_inventory.find_one()
            print(f"✅ Sample item: {sample.get('item_name', 'Unknown')}")
        else:
            print("❌ No glasses inventory data found")
            
        await db.client.close()
        return count
        
    except Exception as e:
        print(f"❌ Error checking inventory: {e}")
        return 0

async def populate_inventory():
    """Populate glasses inventory with sample data"""
    try:
        from app.core.database import get_database
        from app.api.glasses_inventory import GlassesItemCreate
        
        db = await get_database()
        
        # Sample glasses inventory data
        glasses_data = [
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
                        "sphere_max": +8.0,
                        "cylinder_min": -4.0,
                        "cylinder_max": +4.0
                    }
                },
                "unit_price": 2500.0,
                "cost_price": 1800.0,
                "initial_stock": 25,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Ray-Ban Thailand",
                    "location": "Warehouse A"
                },
                "notes": "Classic aviator frames for children and teenagers"
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
                        "sphere_max": +6.0,
                        "cylinder_min": -3.0,
                        "cylinder_max": +3.0
                    }
                },
                "unit_price": 1800.0,
                "cost_price": 1200.0,
                "initial_stock": 15,
                "reorder_level": 3,
                "supplier_info": {
                    "name": "Oakley Thailand",
                    "location": "Warehouse A"
                },
                "notes": "Sports frames for outdoor activities"
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
                        "sphere_max": +7.0,
                        "cylinder_min": -3.5,
                        "cylinder_max": +3.5
                    }
                },
                "unit_price": 2200.0,
                "cost_price": 1500.0,
                "initial_stock": 8,
                "reorder_level": 2,
                "supplier_info": {
                    "name": "Tommy Hilfiger Thailand",
                    "location": "Warehouse B"
                },
                "notes": "Fashion frames for teenagers"
            },
            {
                "item_code": "GL004",
                "item_name": "Nike NIKE 8620-0100 - Red",
                "category": "frames",
                "brand": "Nike",
                "model": "NIKE 8620-0100",
                "specifications": {
                    "frame_color": "Red",
                    "frame_size": "58mm",
                    "lens_type": "Single Vision",
                    "lens_material": "Polycarbonate",
                    "lens_coating": "Anti-Reflective",
                    "prescription_range": {
                        "sphere_min": -5.0,
                        "sphere_max": +5.0,
                        "cylinder_min": -2.5,
                        "cylinder_max": +2.5
                    }
                },
                "unit_price": 1500.0,
                "cost_price": 900.0,
                "initial_stock": 0,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Nike Thailand",
                    "location": "Warehouse B"
                },
                "notes": "Sports frames for outdoor activities"
            },
            {
                "item_code": "GL005",
                "item_name": "Adidas AD 1001 - Green",
                "category": "frames",
                "brand": "Adidas",
                "model": "AD 1001",
                "specifications": {
                    "frame_color": "Green",
                    "frame_size": "56mm",
                    "lens_type": "Progressive",
                    "lens_material": "High-Index",
                    "lens_coating": "Blue Light Protection",
                    "prescription_range": {
                        "sphere_min": -6.5,
                        "sphere_max": +6.5,
                        "cylinder_min": -3.0,
                        "cylinder_max": +3.0
                    }
                },
                "unit_price": 1900.0,
                "cost_price": 1300.0,
                "initial_stock": 12,
                "reorder_level": 3,
                "supplier_info": {
                    "name": "Adidas Thailand",
                    "location": "Warehouse A"
                },
                "notes": "Sports frames for outdoor activities"
            },
            {
                "item_code": "GL006",
                "item_name": "Polarized Sunglasses - Brown",
                "category": "accessories",
                "brand": "Generic",
                "model": "PS-001",
                "specifications": {
                    "frame_color": "Brown",
                    "frame_size": "58mm",
                    "lens_type": "Sunglasses",
                    "lens_material": "Polycarbonate",
                    "lens_coating": "Polarized",
                    "prescription_range": {
                        "sphere_min": -3.0,
                        "sphere_max": +3.0,
                        "cylinder_min": -1.5,
                        "cylinder_max": +1.5
                    }
                },
                "unit_price": 800.0,
                "cost_price": 500.0,
                "initial_stock": 20,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "Local Supplier",
                    "location": "Warehouse C"
                },
                "notes": "Affordable polarized sunglasses"
            },
            {
                "item_code": "GL007",
                "item_name": "Reading Glasses +1.50",
                "category": "frames",
                "brand": "Generic",
                "model": "RG-001",
                "specifications": {
                    "frame_color": "Black",
                    "frame_size": "54mm",
                    "lens_type": "Reading",
                    "lens_material": "CR-39",
                    "lens_coating": "Anti-Scratch",
                    "prescription_range": {
                        "sphere_min": +1.0,
                        "sphere_max": +3.0,
                        "cylinder_min": 0.0,
                        "cylinder_max": 0.0
                    }
                },
                "unit_price": 300.0,
                "cost_price": 150.0,
                "initial_stock": 50,
                "reorder_level": 10,
                "supplier_info": {
                    "name": "Local Supplier",
                    "location": "Warehouse C"
                },
                "notes": "Basic reading glasses for adults"
            }
        ]
        
        # Insert the data
        for item_data in glasses_data:
            try:
                glasses_item = GlassesItemCreate(**item_data)
                result = await db.evep.glasses_inventory.insert_one(glasses_item.model_dump())
                print(f"✅ Added: {item_data['item_name']}")
            except Exception as e:
                print(f"❌ Error adding {item_data['item_name']}: {e}")
        
        # Verify the data was added
        final_count = await db.evep.glasses_inventory.count_documents({})
        print(f"📊 Final glasses inventory count: {final_count}")
        
        await db.client.close()
        return final_count
        
    except Exception as e:
        print(f"❌ Error populating inventory: {e}")
        return 0

async def main():
    """Main function"""
    print("🔍 Checking glasses inventory...")
    
    current_count = await check_inventory()
    
    if current_count == 0:
        print("\n🌱 Populating glasses inventory...")
        await populate_inventory()
    else:
        print(f"\n✅ Inventory already has {current_count} items")
        
        # Show current items
        try:
            from app.core.database import get_database
            db = await get_database()
            
            print("\n📋 Current inventory items:")
            cursor = db.evep.glasses_inventory.find({}, {"item_name": 1, "item_code": 1, "current_stock": 1, "category": 1})
            
            async for item in cursor:
                stock = item.get('current_stock', item.get('initial_stock', 0))
                print(f"  • {item['item_code']}: {item['item_name']} ({item['category']}) - Stock: {stock}")
            
            await db.client.close()
            
        except Exception as e:
            print(f"❌ Error showing inventory: {e}")

if __name__ == "__main__":
    asyncio.run(main())
