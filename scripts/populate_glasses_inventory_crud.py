#!/usr/bin/env python3
"""
Populate Glasses Inventory Using CRUD Endpoints
This script populates the glasses inventory using the existing API endpoints.
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

class GlassesInventoryPopulator:
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
    
    def get_sample_inventory_items(self) -> List[Dict[str, Any]]:
        """Get sample inventory items to create"""
        return [
            # Frames
            {
                "item_code": "FRAME-001",
                "item_name": "Children's Plastic Frame - Blue",
                "category": "frames",
                "brand": "KidsVision",
                "model": "KV-001",
                "specifications": {
                    "material": "plastic",
                    "color": "blue",
                    "size": "small",
                    "age_range": "3-8 years",
                    "bridge_width": "16mm",
                    "lens_width": "45mm",
                    "temple_length": "120mm"
                },
                "unit_price": 450.0,
                "cost_price": 300.0,
                "initial_stock": 50,
                "reorder_level": 10,
                "supplier_info": {
                    "name": "KidsVision Thailand",
                    "contact": "02-123-4567",
                    "email": "orders@kidsvision.co.th"
                },
                "notes": "Popular frame for young children"
            },
            {
                "item_code": "FRAME-002",
                "item_name": "Teenager's Metal Frame - Black",
                "category": "frames",
                "brand": "TeenStyle",
                "model": "TS-002",
                "specifications": {
                    "material": "metal",
                    "color": "black",
                    "size": "medium",
                    "age_range": "13-18 years",
                    "bridge_width": "18mm",
                    "lens_width": "50mm",
                    "temple_length": "135mm"
                },
                "unit_price": 650.0,
                "cost_price": 450.0,
                "initial_stock": 30,
                "reorder_level": 8,
                "supplier_info": {
                    "name": "TeenStyle Optical",
                    "contact": "02-234-5678",
                    "email": "sales@teenstyle.co.th"
                },
                "notes": "Trendy frame for teenagers"
            },
            {
                "item_code": "FRAME-003",
                "item_name": "Unisex Titanium Frame - Silver",
                "category": "frames",
                "brand": "TitanOptics",
                "model": "TO-003",
                "specifications": {
                    "material": "titanium",
                    "color": "silver",
                    "size": "large",
                    "age_range": "adult",
                    "bridge_width": "20mm",
                    "lens_width": "52mm",
                    "temple_length": "140mm"
                },
                "unit_price": 1200.0,
                "cost_price": 800.0,
                "initial_stock": 20,
                "reorder_level": 5,
                "supplier_info": {
                    "name": "TitanOptics International",
                    "contact": "02-345-6789",
                    "email": "orders@titanoptics.com"
                },
                "notes": "Premium lightweight frame"
            },
            
            # Lenses
            {
                "item_code": "LENS-001",
                "item_name": "Single Vision Lens - Clear",
                "category": "lenses",
                "brand": "ClearVision",
                "model": "CV-SV-001",
                "specifications": {
                    "type": "single_vision",
                    "material": "polycarbonate",
                    "index": "1.59",
                    "coating": "anti-reflective",
                    "uv_protection": True,
                    "blue_light_filter": False
                },
                "unit_price": 800.0,
                "cost_price": 500.0,
                "initial_stock": 100,
                "reorder_level": 20,
                "supplier_info": {
                    "name": "ClearVision Lenses",
                    "contact": "02-456-7890",
                    "email": "orders@clearvision.co.th"
                },
                "notes": "Standard single vision lens"
            },
            {
                "item_code": "LENS-002",
                "item_name": "Progressive Lens - Premium",
                "category": "lenses",
                "brand": "ProgressivePlus",
                "model": "PP-PROG-002",
                "specifications": {
                    "type": "progressive",
                    "material": "trivex",
                    "index": "1.53",
                    "coating": "multi-coating",
                    "uv_protection": True,
                    "blue_light_filter": True
                },
                "unit_price": 1500.0,
                "cost_price": 1000.0,
                "initial_stock": 50,
                "reorder_level": 10,
                "supplier_info": {
                    "name": "ProgressivePlus Optics",
                    "contact": "02-567-8901",
                    "email": "sales@progressiveplus.co.th"
                },
                "notes": "Premium progressive lens with blue light filter"
            },
            
            # Accessories
            {
                "item_code": "ACC-001",
                "item_name": "Eyeglass Case - Hard Shell",
                "category": "accessories",
                "brand": "ProtectCase",
                "model": "PC-001",
                "specifications": {
                    "material": "hard_plastic",
                    "color": "black",
                    "size": "universal",
                    "features": ["shock_absorbing", "water_resistant"]
                },
                "unit_price": 150.0,
                "cost_price": 80.0,
                "initial_stock": 200,
                "reorder_level": 50,
                "supplier_info": {
                    "name": "ProtectCase Accessories",
                    "contact": "02-789-0123",
                    "email": "sales@protectcase.co.th"
                },
                "notes": "Durable hard shell case"
            },
            {
                "item_code": "ACC-002",
                "item_name": "Cleaning Cloth - Microfiber",
                "category": "accessories",
                "brand": "CleanOptics",
                "model": "CO-002",
                "specifications": {
                    "material": "microfiber",
                    "size": "15cm x 15cm",
                    "color": "white",
                    "features": ["lint_free", "scratch_resistant"]
                },
                "unit_price": 50.0,
                "cost_price": 25.0,
                "initial_stock": 500,
                "reorder_level": 100,
                "supplier_info": {
                    "name": "CleanOptics Supplies",
                    "contact": "02-890-1234",
                    "email": "orders@cleanoptics.co.th"
                },
                "notes": "High-quality microfiber cleaning cloth"
            }
        ]
    
    async def create_inventory_item(self, item_data: Dict[str, Any]) -> bool:
        """Create an inventory item using the glasses inventory API"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Try the correct endpoint path
            async with self.session.post(
                f"{API_BASE_URL}/api/v1/glasses-inventory/inventory/glasses",
                json=item_data,
                headers=headers
            ) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    print(f"✅ Created inventory item: {item_data['item_name']} ({item_data['item_code']})")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to create item {item_data['item_name']}: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error creating item {item_data['item_name']}: {str(e)}")
            return False
    
    async def populate_inventory(self):
        """Populate inventory with sample data"""
        if not await self.login():
            return
        
        items = self.get_sample_inventory_items()
        print(f"\n🔄 Creating {len(items)} inventory items using CRUD endpoints...")
        
        success_count = 0
        for item in items:
            if await self.create_inventory_item(item):
                success_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Total items: {len(items)}")
        print(f"   Items created: {success_count}")
        print(f"   Failed: {len(items) - success_count}")
        
        if success_count > 0:
            print(f"\n🎉 Successfully created {success_count} inventory items!")
            print(f"   The glasses inventory system is now populated with sample data.")

async def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Glasses Inventory Population via CRUD")
    print("=" * 65)
    
    async with GlassesInventoryPopulator() as populator:
        await populator.populate_inventory()

if __name__ == "__main__":
    asyncio.run(main())
