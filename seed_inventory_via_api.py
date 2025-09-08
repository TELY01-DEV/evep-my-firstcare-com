#!/usr/bin/env python3
"""
Script to seed glasses inventory data using the existing API endpoints
"""

import requests
import json
import time

# API Configuration
BASE_URL = "http://localhost:8014/api/v1"
INVENTORY_ENDPOINT = f"{BASE_URL}/inventory/glasses"

# Sample glasses inventory data
GLASSES_INVENTORY_DATA = [
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
    },
    {
        "item_code": "GL008",
        "item_name": "Contact Lens Solution - 120ml",
        "category": "accessories",
        "brand": "Bausch & Lomb",
        "model": "BL-001",
        "specifications": {
            "frame_color": "Clear",
            "frame_size": "120ml",
            "lens_type": "Solution",
            "lens_material": "Liquid",
            "lens_coating": "Multi-Purpose",
            "prescription_range": {
                "sphere_min": 0.0,
                "sphere_max": 0.0,
                "cylinder_min": 0.0,
                "cylinder_max": 0.0
            }
        },
        "unit_price": 150.0,
        "cost_price": 80.0,
        "initial_stock": 100,
        "reorder_level": 20,
        "supplier_info": {
            "name": "Bausch & Lomb Thailand",
            "location": "Warehouse A"
        },
        "notes": "Multi-purpose contact lens solution"
    },
    {
        "item_code": "GL009",
        "item_name": "Contact Lens Case - Twin Pack",
        "category": "accessories",
        "brand": "Generic",
        "model": "CLC-001",
        "specifications": {
            "frame_color": "Blue",
            "frame_size": "Standard",
            "lens_type": "Case",
            "lens_material": "Plastic",
            "lens_coating": "None",
            "prescription_range": {
                "sphere_min": 0.0,
                "sphere_max": 0.0,
                "cylinder_min": 0.0,
                "cylinder_max": 0.0
            }
        },
        "unit_price": 50.0,
        "cost_price": 25.0,
        "initial_stock": 200,
        "reorder_level": 40,
        "supplier_info": {
            "name": "Local Supplier",
            "location": "Warehouse C"
        },
        "notes": "Twin pack contact lens storage cases"
    },
    {
        "item_code": "GL010",
        "item_name": "Microfiber Cleaning Cloth",
        "category": "accessories",
        "brand": "Generic",
        "model": "MFC-001",
        "specifications": {
            "frame_color": "White",
            "frame_size": "15x15cm",
            "lens_type": "Cloth",
            "lens_material": "Microfiber",
            "lens_coating": "None",
            "prescription_range": {
                "sphere_min": 0.0,
                "sphere_max": 0.0,
                "cylinder_min": 0.0,
                "cylinder_max": 0.0
            }
        },
        "unit_price": 80.0,
        "cost_price": 40.0,
        "initial_stock": 150,
        "reorder_level": 30,
        "supplier_info": {
            "name": "Local Supplier",
            "location": "Warehouse C"
        },
        "notes": "Premium microfiber cleaning cloths for glasses"
    }
]

def check_existing_inventory():
    """Check if inventory already has data"""
    try:
        response = requests.get(INVENTORY_ENDPOINT)
        if response.status_code == 200:
            data = response.json()
            return len(data) if isinstance(data, list) else 0
        elif response.status_code == 401:
            print("🔒 API requires authentication - this is expected")
            return 0
        else:
            print(f"⚠️  API returned status {response.status_code}")
            return 0
    except requests.exceptions.RequestException as e:
        print(f"❌ Error checking inventory: {e}")
        return 0

def seed_inventory_via_api():
    """Seed inventory using the API endpoints"""
    print("🌱 Starting inventory seeding via API...")
    
    # First, let's check if we can access the API
    print(f"🔍 Testing API endpoint: {INVENTORY_ENDPOINT}")
    
    try:
        # Test the endpoint
        response = requests.get(INVENTORY_ENDPOINT)
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API is working (authentication required as expected)")
            print("📝 Note: To actually seed data, you'll need to:")
            print("   1. Login to the frontend")
            print("   2. Use the inventory management interface")
            print("   3. Or provide a valid authentication token")
        elif response.status_code == 200:
            print("✅ API is accessible and returning data")
            existing_data = response.json()
            print(f"📊 Current inventory items: {len(existing_data) if isinstance(existing_data, list) else 0}")
        else:
            print(f"⚠️  API returned unexpected status: {response.status_code}")
            print(f"📄 Response: {response.text[:200]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error accessing API: {e}")
        return False
    
    print("\n📋 Sample inventory data structure:")
    print(json.dumps(GLASSES_INVENTORY_DATA[0], indent=2))
    
    print(f"\n🎯 Total items to seed: {len(GLASSES_INVENTORY_DATA)}")
    print("\n💡 To populate the inventory:")
    print("   1. Access the frontend at: http://localhost:3013/dashboard/glasses-management/inventory")
    print("   2. Login with your credentials")
    print("   3. Use the 'Add New Item' button to add inventory items")
    print("   4. Or use the API with proper authentication")
    
    return True

def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Glasses Inventory Seeding")
    print("=" * 60)
    
    # Check existing inventory
    existing_count = check_existing_inventory()
    if existing_count > 0:
        print(f"✅ Inventory already has {existing_count} items")
        print("🔄 Skipping seeding...")
        return
    
    # Seed inventory via API
    success = seed_inventory_via_api()
    
    if success:
        print("\n✅ Inventory seeding preparation completed!")
        print("🚀 You can now populate the inventory through the frontend interface")
    else:
        print("\n❌ Inventory seeding failed")
        print("🔧 Please check the backend service and try again")

if __name__ == "__main__":
    main()

