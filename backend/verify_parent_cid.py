#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verify_parent_cid():
    """Verify the current CID status for parents"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents
        all_parents = await db.parents.find({}).to_list(length=None)
        total_parents = len(all_parents)
        
        print(f"📊 Total Parents: {total_parents}")
        
        # Check for CID field
        parents_with_cid = []
        parents_without_cid = []
        
        for parent in all_parents:
            cid = parent.get('cid')
            if cid and cid.strip():
                parents_with_cid.append(parent)
            else:
                parents_without_cid.append(parent)
        
        print(f"\n🆔 CID Status:")
        print(f"   Parents with CID: {len(parents_with_cid)}")
        print(f"   Parents without CID: {len(parents_without_cid)}")
        
        # Show all parents with their CID numbers
        if parents_with_cid:
            print(f"\n✅ All Parents with CID Numbers:")
            for i, parent in enumerate(parents_with_cid):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                cid = parent.get('cid', '')
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} ({relation}) - CID: {cid}")
        
        # Show parents without CID
        if parents_without_cid:
            print(f"\n❌ Parents without CID:")
            for i, parent in enumerate(parents_without_cid):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        # Test API response
        print(f"\n🔍 Testing API Response:")
        print(f"   All parents should have realistic 13-digit Thai Citizen ID numbers")
        print(f"   CID format: 1-2345-67890-12-3")
        
        # Show sample parent data
        if all_parents:
            print(f"\n📋 Sample Parent Data:")
            first_parent = all_parents[0]
            name = f"{first_parent.get('first_name', '')} {first_parent.get('last_name', '')}"
            cid = first_parent.get('cid', '')
            relation = first_parent.get('relation', '')
            print(f"   Name: {name}")
            print(f"   Relation: {relation}")
            print(f"   CID: {cid}")
            print(f"   CID Length: {len(cid) if cid else 0} digits")
            
            # Validate CID format
            if cid and len(cid) == 13 and cid.isdigit():
                print(f"   ✅ CID Format: Valid (13 digits)")
            else:
                print(f"   ❌ CID Format: Invalid")
        
    except Exception as e:
        print(f"❌ Error verifying parent CID: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_parent_cid())
