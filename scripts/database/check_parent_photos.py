#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_parent_photos():
    """Check which parents are missing profile photos"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents
        all_parents = await db.parents.find({}).to_list(length=None)
        total_parents = len(all_parents)
        
        print(f"📊 Total Parents: {total_parents}")
        
        # Check profile photo status
        parents_with_photo = []
        parents_without_photo = []
        
        for parent in all_parents:
            profile_photo = parent.get('profile_photo', '')
            if profile_photo and profile_photo.strip():
                parents_with_photo.append(parent)
            else:
                parents_without_photo.append(parent)
        
        print(f"\n📸 Profile Photo Status:")
        print(f"   Parents with profile photo: {len(parents_with_photo)}")
        print(f"   Parents without profile photo: {len(parents_without_photo)}")
        
        # Show sample parents with photos
        if parents_with_photo:
            print(f"\n✅ Sample Parents with Profile Photos:")
            for i, parent in enumerate(parents_with_photo[:5]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                photo = parent.get('profile_photo', '')
                print(f"   {i+1}. {name} - Photo: {photo[:50]}...")
        
        # Show sample parents without photos
        if parents_without_photo:
            print(f"\n❌ Sample Parents without Profile Photos:")
            for i, parent in enumerate(parents_without_photo[:10]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} ({relation})")
        
        # Check extra photos status
        parents_with_extra_photos = []
        parents_without_extra_photos = []
        
        for parent in all_parents:
            extra_photos = parent.get('extra_photos', [])
            if extra_photos and len(extra_photos) > 0:
                parents_with_extra_photos.append(parent)
            else:
                parents_without_extra_photos.append(parent)
        
        print(f"\n📸 Extra Photos Status:")
        print(f"   Parents with extra photos: {len(parents_with_extra_photos)}")
        print(f"   Parents without extra photos: {len(parents_without_extra_photos)}")
        
        # Show complete field structure of first parent
        if all_parents:
            print(f"\n📋 Complete Photo Fields (First Parent):")
            first_parent = all_parents[0]
            photo_fields = ['profile_photo', 'extra_photos', 'photo_metadata']
            for field in photo_fields:
                value = first_parent.get(field, 'N/A')
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking parent photos: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_parent_photos())

