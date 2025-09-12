#!/usr/bin/env python3
"""
Import script for master data collections:
- Provinces
- Districts  
- Sub-districts
- Hospitals
"""

import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
import sys

# MongoDB connection
MONGODB_URL = "mongodb://admin:Sim!44335599@localhost:27030/evep?authSource=admin&directConnection=true"

async def import_provinces():
    """Import provinces data"""
    print("🔄 Importing provinces...")
    
    with open('/www/dk_project/evep-my-firstcare-com/documents/SOURCES/IMPRT_JSON/provinces.json', 'r', encoding='utf-8') as f:
        provinces_data = json.load(f)
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    # Clear existing provinces
    await db.provinces.delete_many({})
    print("🗑️  Cleared existing provinces")
    
    # Process and insert provinces
    processed_provinces = []
    for province in provinces_data:
        # Extract Thai name (usually the first item in name array)
        thai_name = province['name'][0]['name'] if province['name'] else f"Province {province['code']}"
        
        processed_province = {
            "_id": ObjectId(province['_id']['$oid']),
            "code": province['code'],
            "name": thai_name,
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        processed_provinces.append(processed_province)
    
    # Insert provinces
    result = await db.provinces.insert_many(processed_provinces)
    print(f"✅ Imported {len(result.inserted_ids)} provinces")
    
    client.close()
    return len(result.inserted_ids)

async def import_districts():
    """Import districts data"""
    print("🔄 Importing districts...")
    
    with open('/www/dk_project/evep-my-firstcare-com/documents/SOURCES/IMPRT_JSON/districts.json', 'r', encoding='utf-8') as f:
        districts_data = json.load(f)
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    # Clear existing districts
    await db.districts.delete_many({})
    print("🗑️  Cleared existing districts")
    
    # Process and insert districts
    processed_districts = []
    for district in districts_data:
        # Extract Thai name
        thai_name = district['name'][0]['name'] if district['name'] else f"District {district['code']}"
        
        processed_district = {
            "_id": ObjectId(district['_id']['$oid']),
            "code": district['code'],
            "name": thai_name,
            "province_code": district.get('province_code', None),
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        processed_districts.append(processed_district)
    
    # Insert districts
    result = await db.districts.insert_many(processed_districts)
    print(f"✅ Imported {len(result.inserted_ids)} districts")
    
    client.close()
    return len(result.inserted_ids)

async def import_subdistricts():
    """Import sub-districts data"""
    print("🔄 Importing sub-districts...")
    
    with open('/www/dk_project/evep-my-firstcare-com/documents/SOURCES/IMPRT_JSON/sub_districts.json', 'r', encoding='utf-8') as f:
        subdistricts_data = json.load(f)
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    # Clear existing sub-districts
    await db.subdistricts.delete_many({})
    print("🗑️  Cleared existing sub-districts")
    
    # Process and insert sub-districts
    processed_subdistricts = []
    for subdistrict in subdistricts_data:
        # Extract Thai name
        thai_name = subdistrict['name'][0]['name'] if subdistrict['name'] else f"Sub-district {subdistrict['code']}"
        
        processed_subdistrict = {
            "_id": ObjectId(subdistrict['_id']['$oid']),
            "code": subdistrict['code'],
            "name": thai_name,
            "district_code": subdistrict.get('district_code', None),
            "province_code": subdistrict.get('province_code', None),
            "zipcode": subdistrict.get('zipcode', None),
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        processed_subdistricts.append(processed_subdistrict)
    
    # Insert sub-districts
    result = await db.subdistricts.insert_many(processed_subdistricts)
    print(f"✅ Imported {len(result.inserted_ids)} sub-districts")
    
    client.close()
    return len(result.inserted_ids)

async def import_hospitals():
    """Import hospitals data"""
    print("🔄 Importing hospitals...")
    
    with open('/www/dk_project/evep-my-firstcare-com/documents/SOURCES/IMPRT_JSON/hospitals.json', 'r', encoding='utf-8') as f:
        hospitals_data = json.load(f)
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    # Clear existing hospitals
    await db.allhospitals.delete_many({})
    print("🗑️  Cleared existing hospitals")
    
    # Process and insert hospitals
    processed_hospitals = []
    for hospital in hospitals_data:
        # Extract Thai name
        thai_name = hospital['name'][0]['name'] if hospital['name'] else f"Hospital {hospital.get('code', 'Unknown')}"
        
        processed_hospital = {
            "_id": ObjectId(hospital['_id']['$oid']),
            "code": hospital.get('code', None),
            "name": thai_name,
            "type": hospital.get('type', None),
            "province_code": hospital.get('province_code', None),
            "district_code": hospital.get('district_code', None),
            "subdistrict_code": hospital.get('subdistrict_code', None),
            "address": hospital.get('address', None),
            "phone": hospital.get('phone', None),
            "email": hospital.get('email', None),
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        processed_hospitals.append(processed_hospital)
    
    # Insert hospitals
    result = await db.allhospitals.insert_many(processed_hospitals)
    print(f"✅ Imported {len(result.inserted_ids)} hospitals")
    
    client.close()
    return len(result.inserted_ids)

async def main():
    """Main import function"""
    print("🚀 Starting master data import...")
    print("=" * 50)
    
    try:
        # Import all collections
        provinces_count = await import_provinces()
        districts_count = await import_districts()
        subdistricts_count = await import_subdistricts()
        hospitals_count = await import_hospitals()
        
        print("=" * 50)
        print("🎉 Import completed successfully!")
        print(f"📊 Summary:")
        print(f"   • Provinces: {provinces_count}")
        print(f"   • Districts: {districts_count}")
        print(f"   • Sub-districts: {subdistricts_count}")
        print(f"   • Hospitals: {hospitals_count}")
        print(f"   • Total records: {provinces_count + districts_count + subdistricts_count + hospitals_count}")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
