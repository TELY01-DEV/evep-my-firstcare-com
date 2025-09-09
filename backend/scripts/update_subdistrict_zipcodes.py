#!/usr/bin/env python3
"""
Migration script to update subdistrict documents with code and zipcode fields
based on the JSON data structure from IMPRT_JSON folder.
"""

import asyncio
import json
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongo-primary:27017/evep")

# Helper function to get zipcode based on province and subdistrict code
def get_zipcode_for_subdistrict(province_name, subdistrict_code=None):
    """Get zipcode based on province name and optionally subdistrict code"""
    # Thai province to base zipcode mapping
    province_zipcode_map = {
        "กรุงเทพมหานคร": "10",
        "นนทบุรี": "11",
        "ปทุมธานี": "12",
        "สมุทรปราการ": "10",  # Same as Bangkok
        "สมุทรสาคร": "74",
        "นครปฐม": "73",
        "กาญจนบุรี": "71",
        "ราชบุรี": "70",
        "เพชรบุรี": "76",
        "ประจวบคีรีขันธ์": "77",
        "ชุมพร": "86",
        "สุราษฎร์ธานี": "84",
        "นครศรีธรรมราช": "80",
        "กระบี่": "81",
        "พังงา": "82",
        "ภูเก็ต": "83",
        "ตรัง": "92",
        "สตูล": "91",
        "สงขลา": "90",
        "ยะลา": "95",
        "นราธิวาส": "96",
        "ปัตตานี": "94",
        "นครราชสีมา": "30",
        "บุรีรัมย์": "31",
        "สุรินทร์": "32",
        "ศรีสะเกษ": "33",
        "อุบลราชธานี": "34",
        "ยโสธร": "35",
        "ชัยภูมิ": "36",
        "อำนาจเจริญ": "37",
        "หนองบัวลำภู": "39",
        "ขอนแก่น": "40",
        "อุดรธานี": "41",
        "เลย": "42",
        "หนองคาย": "43",
        "มหาสารคาม": "44",
        "ร้อยเอ็ด": "45",
        "กาฬสินธุ์": "46",
        "สกลนคร": "47",
        "นครพนม": "48",
        "มุกดาหาร": "49",
        "เชียงใหม่": "50",
        "ลำพูน": "51",
        "ลำปาง": "52",
        "อุตรดิตถ์": "53",
        "แพร่": "54",
        "น่าน": "55",
        "พะเยา": "56",
        "เชียงราย": "57",
        "แม่ฮ่องสอน": "58",
        "นครสวรรค์": "60",
        "อุทัยธานี": "61",
        "กำแพงเพชร": "62",
        "ตาก": "63",
        "สุโขทัย": "64",
        "พิษณุโลก": "65",
        "พิจิตร": "66",
        "เพชรบูรณ์": "67",
        "สุพรรณบุรี": "72",
        "สมุทรสงคราม": "75",
        "ระนอง": "85",
        "พัทลุง": "93"
    }
    
    # Get province code
    province_code = ""
    if isinstance(province_name, dict):
        # If it's an object with en/th keys, use the Thai name
        thai_name = province_name.get('th', '')
        province_code = province_zipcode_map.get(thai_name, '')
    else:
        # If it's a string, try to match directly
        province_code = province_zipcode_map.get(province_name, '')
    
    if not province_code:
        return ''
    
    # If we have a subdistrict code, try to generate a more specific zipcode
    if subdistrict_code and len(str(subdistrict_code)) >= 6:
        # Extract the last 3 digits from the subdistrict code for more specificity
        subdistrict_suffix = str(subdistrict_code)[-3:]
        return f"{province_code}{subdistrict_suffix}"
    else:
        # Default to province base zipcode with 000
        return f"{province_code}000"

async def load_json_data():
    """Load the JSON data from IMPRT_JSON folder"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    json_dir = project_root / "documents" / "SOURCES" / "IMPRT_JSON"
    
    # Load subdistricts data
    subdistricts_file = json_dir / "sub_districts.json"
    with open(subdistricts_file, 'r', encoding='utf-8') as f:
        subdistricts_data = json.load(f)
    
    # Load provinces data
    provinces_file = json_dir / "provinces.json"
    with open(provinces_file, 'r', encoding='utf-8') as f:
        provinces_data = json.load(f)
    
    return subdistricts_data, provinces_data

async def update_subdistricts():
    """Update subdistrict documents with code and zipcode fields"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.evep
    
    try:
        # Load JSON data
        logger.info("Loading JSON data...")
        subdistricts_json, provinces_json = await load_json_data()
        
        # Create lookup dictionaries
        subdistricts_lookup = {}
        for subdistrict in subdistricts_json:
            # Use the name to match with database records
            if 'name' in subdistrict and isinstance(subdistrict['name'], list):
                for name_obj in subdistrict['name']:
                    if name_obj.get('code') == 'th':
                        thai_name = name_obj.get('name', '')
                        subdistricts_lookup[thai_name] = {
                            'code': subdistrict.get('code'),
                            'province_code': subdistrict.get('province_code')
                        }
                        break
        
        provinces_lookup = {}
        for province in provinces_json:
            if 'name' in province and isinstance(province['name'], list):
                for name_obj in province['name']:
                    if name_obj.get('code') == 'th':
                        thai_name = name_obj.get('name', '')
                        provinces_lookup[thai_name] = province
                        break
        
        # Get all subdistricts from database
        logger.info("Fetching subdistricts from database...")
        subdistricts_collection = db.subdistricts
        subdistricts_cursor = subdistricts_collection.find({})
        subdistricts = await subdistricts_cursor.to_list(length=None)
        
        logger.info(f"Found {len(subdistricts)} subdistricts in database")
        
        updated_count = 0
        not_found_count = 0
        
        for subdistrict in subdistricts:
            subdistrict_id = subdistrict['_id']
            
            # Get subdistrict name
            subdistrict_name = None
            if 'name' in subdistrict:
                if isinstance(subdistrict['name'], dict):
                    subdistrict_name = subdistrict['name'].get('th', '')
                elif isinstance(subdistrict['name'], str):
                    subdistrict_name = subdistrict['name']
            
            if not subdistrict_name:
                logger.warning(f"Subdistrict {subdistrict_id} has no name")
                continue
            
            # Find matching JSON data
            json_data = subdistricts_lookup.get(subdistrict_name)
            if not json_data:
                logger.warning(f"No JSON data found for subdistrict: {subdistrict_name}")
                not_found_count += 1
                continue
            
            # Get province data for zipcode generation
            province_name = None
            if 'provinceId' in subdistrict:
                province = await db.provinces.find_one({"_id": ObjectId(subdistrict['provinceId'])})
                if province and 'name' in province:
                    province_name = province['name']
            
            # Generate zipcode
            zipcode = get_zipcode_for_subdistrict(province_name, json_data['code'])
            
            # Update the subdistrict document
            update_data = {
                'code': json_data['code'],
                'zipcode': zipcode
            }
            
            result = await subdistricts_collection.update_one(
                {"_id": subdistrict_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                logger.info(f"Updated subdistrict {subdistrict_name} with code {json_data['code']} and zipcode {zipcode}")
        
        logger.info(f"Migration completed!")
        logger.info(f"Updated: {updated_count} subdistricts")
        logger.info(f"Not found in JSON: {not_found_count} subdistricts")
        
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        raise
    finally:
        client.close()

async def main():
    """Main function"""
    logger.info("Starting subdistrict zipcode migration...")
    await update_subdistricts()
    logger.info("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
