#!/usr/bin/env python3
"""
Populate Glasses Inventory - Fixed Field Names
This script populates the glasses inventory using the correct field names from API validation.
"""

import asyncio
import aiohttp
import json
import random
from datetime import datetime
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
ADMIN_EMAIL = "admin@evep.com"
ADMIN_PASSWORD = "admin123"

class FixedGlassesInventoryPopulator:
    def __init__(self):
        self.session = None
        self.access_token = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self) -> bool:
        """Login to get access token"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json=login_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result.get("access_token")
                    print(f"✅ Login successful")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    async def get_sample_inventory_items(self) -> List[Dict[str, Any]]:
        """Get sample glasses inventory items with correct field names"""
        return [
            {
                "item_name": "เด็กชาย แว่นสายตา - กรอบพลาสติก",
                "item_code": "EK-001-BLUE-S",
                "item_type": "glasses",
                "category": "children",
                "frame_material": "plastic",
                "frame_color": "blue",
                "lens_type": "single_vision",
                "prescription_range": "0.00 to -3.00",
                "size": "small",
                "brand": "EvepKids",
                "model": "EK-001",
                "unit_price": 450.00,
                "cost_price": 200.00,
                "initial_stock": 25,
                "reorder_level": 5,
                "max_stock_level": 50,
                "supplier": "Evep Optical",
                "description": "แว่นสายตาสำหรับเด็กชาย กรอบพลาสติกสีน้ำเงิน เหมาะสำหรับเด็กอายุ 6-12 ปี",
                "is_active": True
            },
            {
                "item_name": "เด็กหญิง แว่นสายตา - กรอบโลหะ",
                "item_code": "EK-002-PINK-S",
                "item_type": "glasses",
                "category": "children",
                "frame_material": "metal",
                "frame_color": "pink",
                "lens_type": "single_vision",
                "prescription_range": "0.00 to -3.00",
                "size": "small",
                "brand": "EvepKids",
                "model": "EK-002",
                "unit_price": 550.00,
                "cost_price": 250.00,
                "initial_stock": 20,
                "reorder_level": 5,
                "max_stock_level": 50,
                "supplier": "Evep Optical",
                "description": "แว่นสายตาสำหรับเด็กหญิง กรอบโลหะสีชมพู เหมาะสำหรับเด็กอายุ 6-12 ปี",
                "is_active": True
            },
            {
                "item_name": "ผู้ใหญ่ แว่นสายตา - กรอบพลาสติก",
                "item_code": "EV-001-BLACK-M",
                "item_type": "glasses",
                "category": "adult",
                "frame_material": "plastic",
                "frame_color": "black",
                "lens_type": "single_vision",
                "prescription_range": "0.00 to -6.00",
                "size": "medium",
                "brand": "EvepVision",
                "model": "EV-001",
                "unit_price": 750.00,
                "cost_price": 350.00,
                "initial_stock": 15,
                "reorder_level": 3,
                "max_stock_level": 30,
                "supplier": "Evep Optical",
                "description": "แว่นสายตาสำหรับผู้ใหญ่ กรอบพลาสติกสีดำ เหมาะสำหรับผู้ใหญ่ทุกวัย",
                "is_active": True
            },
            {
                "item_name": "ผู้ใหญ่ แว่นสายตา - กรอบโลหะ",
                "item_code": "EV-002-SILVER-M",
                "item_type": "glasses",
                "category": "adult",
                "frame_material": "metal",
                "frame_color": "silver",
                "lens_type": "single_vision",
                "prescription_range": "0.00 to -6.00",
                "size": "medium",
                "brand": "EvepVision",
                "model": "EV-002",
                "unit_price": 950.00,
                "cost_price": 450.00,
                "initial_stock": 12,
                "reorder_level": 3,
                "max_stock_level": 30,
                "supplier": "Evep Optical",
                "description": "แว่นสายตาสำหรับผู้ใหญ่ กรอบโลหะสีเงิน เหมาะสำหรับผู้ใหญ่ทุกวัย",
                "is_active": True
            },
            {
                "item_name": "แว่นกันแดด - กรอบพลาสติก",
                "item_code": "ES-001-BROWN-M",
                "item_type": "sunglasses",
                "category": "unisex",
                "frame_material": "plastic",
                "frame_color": "brown",
                "lens_type": "sunglass",
                "prescription_range": "N/A",
                "size": "medium",
                "brand": "EvepSun",
                "model": "ES-001",
                "unit_price": 350.00,
                "cost_price": 150.00,
                "initial_stock": 30,
                "reorder_level": 10,
                "max_stock_level": 100,
                "supplier": "Evep Optical",
                "description": "แว่นกันแดด กรอบพลาสติกสีน้ำตาล เหมาะสำหรับทุกเพศทุกวัย",
                "is_active": True
            },
            {
                "item_name": "แว่นอ่านหนังสือ - กรอบพลาสติก",
                "item_code": "ER-001-BLACK-M",
                "item_type": "reading_glasses",
                "category": "adult",
                "frame_material": "plastic",
                "frame_color": "black",
                "lens_type": "reading",
                "prescription_range": "+1.00 to +3.00",
                "size": "medium",
                "brand": "EvepRead",
                "model": "ER-001",
                "unit_price": 250.00,
                "cost_price": 100.00,
                "initial_stock": 40,
                "reorder_level": 10,
                "max_stock_level": 100,
                "supplier": "Evep Optical",
                "description": "แว่นอ่านหนังสือ กรอบพลาสติกสีดำ เหมาะสำหรับผู้ที่มีปัญหาการมองเห็นระยะใกล้",
                "is_active": True
            }
        ]
    
    async def create_inventory_item(self, item_data: Dict[str, Any]) -> bool:
        """Create an inventory item using the API"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Create inventory item via the API
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/inventory/glasses",
                json=item_data,
                headers=headers
            ) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    print(f"✅ Created inventory item: {item_data.get('item_name')} (ID: {result.get('item_id', 'N/A')})")
                    return True
                elif response.status == 400:
                    error_text = await response.text()
                    if "already exists" in error_text or "duplicate" in error_text:
                        print(f"⚠️ Inventory item already exists: {item_data.get('item_name')}")
                        return True  # Count as success since item exists
                    else:
                        print(f"❌ Failed to create inventory item {item_data.get('item_name')}: {response.status} - {error_text}")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create inventory item {item_data.get('item_name')}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating inventory item {item_data.get('item_name')}: {str(e)}")
            return False
    
    async def populate_inventory(self):
        """Populate the glasses inventory with sample items"""
        if not await self.login():
            return
        
        inventory_items = await self.get_sample_inventory_items()
        
        print(f"\n🔄 Creating {len(inventory_items)} glasses inventory items...")
        
        success_count = 0
        for item in inventory_items:
            if await self.create_inventory_item(item):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Total items: {len(inventory_items)}")
        print(f"   Items created: {success_count}")
        print(f"   Failed: {len(inventory_items) - success_count}")
        
        if success_count > 0:
            print(f"\n🎉 Successfully created {success_count} glasses inventory items!")
            print(f"   These should now be available in the inventory system.")
            
            # Test the inventory endpoint
            print(f"\n🧪 Testing inventory endpoint...")
            await self.test_inventory_endpoint()
    
    async def test_inventory_endpoint(self):
        """Test the inventory endpoint to verify items were created"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with self.session.get(
                f"{API_BASE_URL}/api/v1/inventory/glasses",
                headers=headers
            ) as response:
                if response.status == 200:
                    items = await response.json()
                    print(f"✅ Inventory endpoint working! Found {len(items)} items")
                    if items:
                        print(f"   Sample item: {items[0].get('item_name', 'N/A')}")
                        print(f"   Total stock value: {sum(item.get('initial_stock', 0) * item.get('unit_price', 0) for item in items):.2f} THB")
                    return True
                else:
                    print(f"❌ Inventory endpoint failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Error testing inventory endpoint: {str(e)}")
            return False

async def main():
    """Main function"""
    print("👓 EVEP Medical Portal - Populate Glasses Inventory (Fixed)")
    print("=" * 70)
    
    async with FixedGlassesInventoryPopulator() as populator:
        await populator.populate_inventory()

if __name__ == "__main__":
    asyncio.run(main())
