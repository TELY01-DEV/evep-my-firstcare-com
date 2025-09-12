#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_parent_cid():
    """Check which parents are missing CID (Citizen ID) numbers"""
    
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
            cid = parent.get('cid') or parent.get('citizen_id') or parent.get('national_id')
            if cid:
                parents_with_cid.append(parent)
            else:
                parents_without_cid.append(parent)
        
        print(f"\n🆔 CID Status:")
        print(f"   Parents with CID: {len(parents_with_cid)}")
        print(f"   Parents without CID: {len(parents_without_cid)}")
        
        # Show sample parents with CID
        if parents_with_cid:
            print(f"\n✅ Sample Parents with CID:")
            for i, parent in enumerate(parents_with_cid[:5]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                cid = parent.get('cid') or parent.get('citizen_id') or parent.get('national_id')
                print(f"   {i+1}. {name} - CID: {cid}")
        
        # Show sample parents without CID
        if parents_without_cid:
            print(f"\n❌ Sample Parents without CID:")
            for i, parent in enumerate(parents_without_cid[:5]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                print(f"   {i+1}. {name}")
        
        # Check all possible CID field names
        print(f"\n🔍 Checking for CID field variations...")
        cid_fields = ['cid', 'citizen_id', 'national_id', 'thai_id', 'id_number']
        for field in cid_fields:
            count = await db.parents.count_documents({field: {"$exists": True, "$ne": ""}})
            if count > 0:
                print(f"   Field '{field}': {count} parents have this field")
        
        # Show complete field structure of first parent
        if all_parents:
            print(f"\n📋 Complete field structure of first parent:")
            first_parent = all_parents[0]
            for field, value in first_parent.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking parent CID: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_parent_cid())
