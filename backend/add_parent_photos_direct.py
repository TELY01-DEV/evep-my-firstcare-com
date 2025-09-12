#!/usr/bin/env python3
import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient

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

async def add_parent_photos_direct():
    """Add profile photos to parents directly in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents
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
                
                # Update parent directly in database
                result = await db.parents.update_one(
                    {"_id": parent["_id"]},
                    {
                        "$set": {
                            "profile_photo": profile_photo,
                            "extra_photos": extra_photos,
                            "photo_metadata": photo_metadata,
                            "updated_at": "2025-08-31T16:00:00Z"
                        }
                    }
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✅ Updated {parent_name} ({relation}) with profile photo: {profile_photo[:50]}...")
                else:
                    failed_count += 1
                    print(f"❌ Failed to update parent {parent_name}")
                
            except Exception as e:
                failed_count += 1
                print(f"❌ Error updating parent {parent_name}: {e}")
        
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
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_parent_photos_direct())
