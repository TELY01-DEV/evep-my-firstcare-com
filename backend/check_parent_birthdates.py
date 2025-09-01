#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_parent_birthdates():
    """Check which parents are missing birth dates"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Get all parents
        all_parents = await db.parents.find({}).to_list(length=None)
        total_parents = len(all_parents)
        
        print(f"📊 Total Parents: {total_parents}")
        
        # Check birth date status
        parents_with_birthdate = []
        parents_without_birthdate = []
        
        for parent in all_parents:
            birth_date = parent.get('birth_date', '')
            if birth_date and birth_date.strip():
                parents_with_birthdate.append(parent)
            else:
                parents_without_birthdate.append(parent)
        
        print(f"\n🎂 Birth Date Status:")
        print(f"   Parents with birth date: {len(parents_with_birthdate)}")
        print(f"   Parents without birth date: {len(parents_without_birthdate)}")
        
        # Show sample parents with birth dates
        if parents_with_birthdate:
            print(f"\n✅ Sample Parents with Birth Dates:")
            for i, parent in enumerate(parents_with_birthdate[:5]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                birth_date = parent.get('birth_date', '')
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} ({relation}) - Birth Date: {birth_date}")
        
        # Show sample parents without birth dates
        if parents_without_birthdate:
            print(f"\n❌ Sample Parents without Birth Dates:")
            for i, parent in enumerate(parents_without_birthdate[:5]):
                name = f"{parent.get('first_name', '')} {parent.get('last_name', '')}"
                relation = parent.get('relation', '')
                print(f"   {i+1}. {name} ({relation})")
        
        # Show complete field structure of first parent
        if all_parents:
            print(f"\n📋 Complete field structure of first parent:")
            first_parent = all_parents[0]
            for field, value in first_parent.items():
                print(f"   {field}: {value}")
        
    except Exception as e:
        print(f"❌ Error checking parent birth dates: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_parent_birthdates())
