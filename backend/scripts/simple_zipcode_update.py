#!/usr/bin/env python3
"""
Simple script to update subdistrict documents with zipcode fields
"""

import os
from pymongo import MongoClient

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27030/evep")

# Helper function to get zipcode based on province
def get_zipcode_for_province(province_name):
    """Get zipcode based on province name"""
    # Thai province to zipcode mapping
    province_zipcode_map = {
        "กรุงเทพมหานคร": "10110",
        "นนทบุรี": "11000",
        "ปทุมธานี": "12000",
        "สมุทรปราการ": "10280",
        "สมุทรสาคร": "74000",
        "นครปฐม": "73000",
        "กาญจนบุรี": "71000",
        "ราชบุรี": "70000",
        "เพชรบุรี": "76000",
        "ประจวบคีรีขันธ์": "77000",
        "ชุมพร": "86000",
        "สุราษฎร์ธานี": "84000",
        "นครศรีธรรมราช": "80000",
        "กระบี่": "81000",
        "พังงา": "82000",
        "ภูเก็ต": "83000",
        "ตรัง": "92000",
        "สตูล": "91000",
        "สงขลา": "90000",
        "ยะลา": "95000",
        "นราธิวาส": "96000",
        "ปัตตานี": "94000",
        "นครราชสีมา": "30000",
        "บุรีรัมย์": "31000",
        "สุรินทร์": "32000",
        "ศรีสะเกษ": "33000",
        "อุบลราชธานี": "34000",
        "ยโสธร": "35000",
        "ชัยภูมิ": "36000",
        "อำนาจเจริญ": "37000",
        "หนองบัวลำภู": "39000",
        "ขอนแก่น": "40000",
        "อุดรธานี": "41000",
        "เลย": "42000",
        "หนองคาย": "43000",
        "มหาสารคาม": "44000",
        "ร้อยเอ็ด": "45000",
        "กาฬสินธุ์": "46000",
        "สกลนคร": "47000",
        "นครพนม": "48000",
        "มุกดาหาร": "49000",
        "เชียงใหม่": "50000",
        "ลำพูน": "51000",
        "ลำปาง": "52000",
        "อุตรดิตถ์": "53000",
        "แพร่": "54000",
        "น่าน": "55000",
        "พะเยา": "56000",
        "เชียงราย": "57000",
        "แม่ฮ่องสอน": "58000",
        "นครสวรรค์": "60000",
        "อุทัยธานี": "61000",
        "กำแพงเพชร": "62000",
        "ตาก": "63000",
        "สุโขทัย": "64000",
        "พิษณุโลก": "65000",
        "พิจิตร": "66000",
        "เพชรบูรณ์": "67000",
        "สุพรรณบุรี": "72000",
        "สมุทรสงคราม": "75000",
        "ระนอง": "85000",
        "พัทลุง": "93000"
    }
    
    # Handle both Thai and English names
    if isinstance(province_name, dict):
        # If it's an object with en/th keys, use the Thai name
        thai_name = province_name.get('th', '')
        return province_zipcode_map.get(thai_name, '')
    else:
        # If it's a string, try to match directly
        return province_zipcode_map.get(province_name, '')

def update_subdistricts():
    """Update subdistrict documents with zipcode fields"""
    client = MongoClient(MONGODB_URL)
    db = client.evep
    
    try:
        # Get all subdistricts
        subdistricts = list(db.subdistricts.find({}))
        print(f"Found {len(subdistricts)} subdistricts")
        
        updated_count = 0
        
        for subdistrict in subdistricts:
            subdistrict_id = subdistrict['_id']
            
            # Skip if already has zipcode
            if 'zipcode' in subdistrict and subdistrict['zipcode']:
                continue
            
            # Get province data
            if 'provinceId' in subdistrict:
                province = db.provinces.find_one({"_id": subdistrict['provinceId']})
                if province and 'name' in province:
                    zipcode = get_zipcode_for_province(province['name'])
                    
                    # Update the subdistrict
                    result = db.subdistricts.update_one(
                        {"_id": subdistrict_id},
                        {"$set": {"zipcode": zipcode}}
                    )
                    
                    if result.modified_count > 0:
                        updated_count += 1
                        print(f"Updated subdistrict {subdistrict.get('name', 'Unknown')} with zipcode {zipcode}")
        
        print(f"Migration completed! Updated {updated_count} subdistricts")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    print("Starting subdistrict zipcode migration...")
    update_subdistricts()
    print("Migration completed successfully!")
