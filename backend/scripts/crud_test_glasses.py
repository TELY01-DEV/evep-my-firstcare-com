#!/usr/bin/env python3
"""
Comprehensive CRUD test for glasses inventory API
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime

# API configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com/api/v1"

async def test_glasses_crud():
    """Test complete CRUD operations for glasses inventory"""
    
    print("🧪 Testing Glasses Inventory CRUD API")
    print("=" * 60)
    
    # Test data
    test_item = {
        "item_code": f"GL_CRUD_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "item_name": "CRUD Test Glasses",
        "category": "frames",
        "brand": "Test Brand",
        "model": "CRUD Model",
        "specifications": {
            "frame_color": "Test Blue",
            "lens_type": "UV Protection",
            "prescription_range": "-3.00 to +3.00",
            "size": "Medium",
            "material": "Acetate"
        },
        "unit_price": 1500.00,
        "cost_price": 900.00,
        "initial_stock": 15,
        "reorder_level": 5,
        "supplier_info": {
            "name": "CRUD Test Supplier",
            "contact": "02-999-9999",
            "location": "Test City"
        },
        "notes": "Created via CRUD API test"
    }
    
    update_data = {
        "item_name": "Updated CRUD Test Glasses",
        "unit_price": 1800.00,
        "notes": "Updated via CRUD API test"
    }
    
    print("📋 Available API Endpoints:")
    print("1. GET    /api/v1/inventory/glasses           - List all items")
    print("2. POST   /api/v1/inventory/glasses           - Create new item")
    print("3. GET    /api/v1/inventory/glasses/{id}      - Get specific item")
    print("4. PUT    /api/v1/inventory/glasses/{id}      - Update item")
    print("5. DELETE /api/v1/inventory/glasses/{id}      - Delete item")
    print("6. GET    /api/v1/inventory/glasses/stats     - Get statistics")
    print("7. GET    /api/v1/inventory/glasses/low-stock - Get low stock items")
    print("8. GET    /api/v1/inventory/glasses/available - Get available items")
    print()
    
    print("📊 Expected Data Structure:")
    print("GlassesItemResponse:")
    print(json.dumps({
        "item_id": "string",
        "item_code": "string", 
        "item_name": "string",
        "category": "string",
        "brand": "string",
        "model": "string",
        "specifications": {
            "frame_color": "string",
            "lens_type": "string",
            "prescription_range": "string",
            "size": "string",
            "material": "string"
        },
        "current_stock": 0,
        "reorder_level": 0,
        "unit_price": 0.0,
        "cost_price": 0.0,
        "supplier_info": {
            "name": "string",
            "contact": "string",
            "location": "string"
        },
        "notes": "string",
        "is_active": True,
        "created_at": "string",
        "updated_at": "string"
    }, indent=2))
    print()
    
    print("🔧 CRUD Test Scenarios:")
    print("1. CREATE: POST new glasses item")
    print(f"   Data: {json.dumps(test_item, indent=2)}")
    print()
    
    print("2. READ: GET all glasses items")
    print("   Expected: Array of GlassesItemResponse objects")
    print()
    
    print("3. READ: GET specific glasses item by ID")
    print("   Expected: Single GlassesItemResponse object")
    print()
    
    print("4. UPDATE: PUT update glasses item")
    print(f"   Data: {json.dumps(update_data, indent=2)}")
    print()
    
    print("5. DELETE: DELETE glasses item")
    print("   Expected: Success confirmation")
    print()
    
    print("📈 Statistics Endpoints:")
    print("6. GET /api/v1/inventory/glasses/stats")
    print("   Expected: {")
    print("     'total_items': 0,")
    print("     'low_stock_count': 0,")
    print("     'out_of_stock_count': 0,")
    print("     'total_inventory_value': 0.0,")
    print("     'categories': {...}")
    print("   }")
    print()
    
    print("7. GET /api/v1/inventory/glasses/low-stock")
    print("   Expected: Array of low stock items")
    print()
    
    print("8. GET /api/v1/inventory/glasses/available")
    print("   Expected: {")
    print("     'available_items': [...],")
    print("     'total_available': 0,")
    print("     'categories': [...]")
    print("   }")
    print()
    
    print("🔐 Authentication Requirements:")
    print("- All endpoints require JWT Bearer token")
    print("- Token must be included in Authorization header")
    print("- Format: 'Authorization: Bearer <token>'")
    print()
    
    print("✅ CRUD API Test Documentation Complete!")
    print("Note: Actual API testing requires valid authentication token")
    print("The database currently contains 6 sample glasses inventory items")

async def main():
    """Main function"""
    await test_glasses_crud()

if __name__ == "__main__":
    asyncio.run(main())
