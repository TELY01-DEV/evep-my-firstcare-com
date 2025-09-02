#!/usr/bin/env python3
import asyncio
import aiohttp
import random

def generate_thai_cid():
    """Generate a realistic Thai Citizen ID number (13 digits)"""
    # Thai CID format: 1-2345-67890-12-3
    # First digit: 1-8 (1=born 1900-1999, 2=born 2000-2099, etc.)
    # Next 4 digits: province code
    # Next 5 digits: sequential number
    # Next 2 digits: check digit
    # Last digit: verification digit
    
    # Generate first digit (1-8)
    first_digit = random.randint(1, 8)
    
    # Generate province code (4 digits)
    province_code = random.randint(1000, 9999)
    
    # Generate sequential number (5 digits)
    sequential = random.randint(10000, 99999)
    
    # Generate check digits (2 digits)
    check_digits = random.randint(10, 99)
    
    # Generate verification digit (1 digit)
    verification = random.randint(0, 9)
    
    # Combine all parts
    cid = f"{first_digit}{province_code:04d}{sequential:05d}{check_digits:02d}{verification}"
    
    return cid

async def update_parent_cid():
    """Update parent CID numbers with realistic Thai Citizen ID numbers using the API"""
    
    # Get authentication token
    async with aiohttp.ClientSession() as session:
        # Login to get token
        login_data = {
            "email": "doctor@evep.com",
            "password": "demo123"
        }
        
        login_response = await session.post(
            "http://backend:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status != 200:
            print("❌ Failed to login")
            return
        
        token_data = await login_response.json()
        token = token_data["access_token"]
        
        print("✅ Successfully logged in")
        
        # Get all parents from database
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
        db = client.evep
        
        parents = await db.parents.find({}).to_list(length=None)
        print(f"📊 Found {len(parents)} parents to update")
        
        # Update each parent with realistic CID
        updated_count = 0
        failed_count = 0
        
        for parent in parents:
            try:
                # Generate realistic Thai CID
                new_cid = generate_thai_cid()
                
                # Prepare update data
                update_data = {
                    "first_name": parent.get("first_name", ""),
                    "last_name": parent.get("last_name", ""),
                    "cid": new_cid,
                    "birth_date": parent.get("birth_date", ""),
                    "gender": parent.get("gender", ""),
                    "phone": parent.get("phone", ""),
                    "email": parent.get("email", ""),
                    "relation": parent.get("relation", ""),
                    "occupation": parent.get("occupation", ""),
                    "income_level": parent.get("income_level"),
                    "address": parent.get("address", {
                        "house_no": "",
                        "village_no": "",
                        "soi": "",
                        "road": "",
                        "sub_district": "",
                        "district": "",
                        "province": "",
                        "postal_code": ""
                    }),
                    "emergency_contact": parent.get("emergency_contact", {
                        "name": "",
                        "phone": "",
                        "relation": ""
                    }),
                    "status": "active"
                }
                
                # Update parent via API
                parent_id = str(parent["_id"])
                update_response = await session.put(
                    f"http://backend:8000/api/v1/evep/parents/{parent_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if update_response.status == 200:
                    updated_count += 1
                    name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                    old_cid = parent.get('cid', 'N/A')
                    print(f"✅ Updated {name} - Old CID: {old_cid} → New CID: {new_cid}")
                else:
                    failed_count += 1
                    error_text = await update_response.text()
                    print(f"❌ Failed to update parent {parent_id}: {error_text}")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating parent: {e}")
        
        print(f"\n📊 Update Summary:")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Failed updates: {failed_count}")
        print(f"   Total parents: {len(parents)}")
        
        # Verify the updates
        parents_with_cid = await db.parents.count_documents({"cid": {"$exists": True, "$ne": ""}})
        print(f"   Parents with CID after update: {parents_with_cid}")
        
        # Show sample updated parents
        sample_parents = await db.parents.find({"cid": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Parents with Updated CID:")
        for parent in sample_parents:
            name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
            cid = parent.get('cid', '')
            relation = parent.get('relation', '')
            print(f"   {name} ({relation}) - CID: {cid}")
        
        client.close()

if __name__ == "__main__":
    asyncio.run(update_parent_cid())

