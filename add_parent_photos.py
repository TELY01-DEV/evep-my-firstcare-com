#!/usr/bin/env python3
import asyncio
import aiohttp
import random

def generate_parent_profile_photo_url(parent_name, gender, relation):
    """Generate a realistic profile photo URL for parents"""
    # Use a more professional avatar service for parents
    # This creates realistic-looking profile photos for adults
    
    # Clean the name for URL
    clean_name = parent_name.replace(' ', '').replace('์', '').replace('่', '').replace('้', '').replace('๊', '').replace('๋', '')
    
    # Generate a random seed for consistent photos
    seed = hash(clean_name) % 10000
    
    # Use different styles based on gender and relation
    if gender.lower() in ['male', 'm', 'ชาย'] or relation in ['บิดา', 'father']:
        style = 'personas'  # More professional for fathers
    else:
        style = 'personas'  # Professional for mothers too
    
    # Generate avatar URL with professional colors
    photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=4f46e5,7c3aed,059669,dc2626,f59e0b"
    
    return photo_url

def generate_parent_extra_photos(parent_name, count=1):
    """Generate extra photo URLs for parents"""
    extra_photos = []
    
    # Generate 1-2 extra photos for parents
    for i in range(count):
        # Use professional styles for parents
        styles = ['personas', 'initials']
        style = random.choice(styles)
        
        # Generate different seed for each photo
        seed = hash(f"{parent_name}{i}") % 10000
        
        photo_url = f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor=4f46e5,7c3aed,059669,dc2626,f59e0b"
        extra_photos.append(photo_url)
    
    return extra_photos

def generate_parent_photo_metadata(parent_name, photo_type="profile"):
    """Generate photo metadata for parents"""
    metadata = {
        "upload_date": "2025-08-31T16:00:00Z",
        "file_size": random.randint(80000, 150000),  # 80KB to 150KB
        "dimensions": {
            "width": 400,
            "height": 400
        },
        "format": "svg",
        "description": f"{photo_type.title()} photo for {parent_name}",
        "tags": ["parent", "profile", "avatar", "adult"],
        "uploaded_by": "system",
        "is_public": True
    }
    
    return metadata

async def add_parent_photos():
    """Add profile photos to parents using the API"""
    
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
        
        # Update each parent with profile photo
        updated_count = 0
        failed_count = 0
        
        for parent in parents:
            try:
                # Generate profile photo and metadata
                parent_name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                gender = parent.get('gender', '')
                relation = parent.get('relation', '')
                
                profile_photo = generate_parent_profile_photo_url(parent_name, gender, relation)
                extra_photos = generate_parent_extra_photos(parent_name, random.randint(1, 2))
                photo_metadata = generate_parent_photo_metadata(parent_name, "profile")
                
                # Prepare update data
                update_data = {
                    "title": parent.get("title", "คุณ"),
                    "first_name": parent.get("first_name", ""),
                    "last_name": parent.get("last_name", ""),
                    "cid": parent.get("cid", ""),
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
                    "profile_photo": profile_photo,
                    "extra_photos": extra_photos,
                    "photo_metadata": photo_metadata,
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
                    print(f"✅ Updated {parent_name} ({relation}) with profile photo: {profile_photo[:50]}...")
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
        parents_with_photo = await db.parents.count_documents({"profile_photo": {"$exists": True, "$ne": ""}})
        parents_with_extra_photos = await db.parents.count_documents({"extra_photos": {"$exists": True, "$ne": []}})
        print(f"   Parents with profile photo after update: {parents_with_photo}")
        print(f"   Parents with extra photos after update: {parents_with_extra_photos}")
        
        # Show sample updated parents
        sample_parents = await db.parents.find({"profile_photo": {"$exists": True, "$ne": ""}}).limit(5).to_list(length=None)
        print(f"\n📋 Sample Parents with Profile Photos:")
        for parent in sample_parents:
            name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
            relation = parent.get('relation', '')
            profile_photo = parent.get('profile_photo', '')
            extra_photos_count = len(parent.get('extra_photos', []))
            print(f"   {name} ({relation}) - Profile: {profile_photo[:50]}..., Extra: {extra_photos_count} photos")
        
        client.close()

if __name__ == "__main__":
    asyncio.run(add_parent_photos())

