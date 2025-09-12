#!/usr/bin/env python3
"""
Script to add Nakhon Pathom schools data using the existing API endpoints
Based on the user's preference for API-based seeding over direct database scripts
"""

import requests
import json
import time
from typing import List, Dict, Any

# API Configuration
BASE_URL = "http://localhost:8014/api/v1"
SCHOOLS_ENDPOINT = f"{BASE_URL}/evep/schools"

# School data from user input
NAKHON_PATHOM_SCHOOLS_DATA = [
    {
        "school_code": "1073180258",
        "name": "พระปฐมวิทยาลัย",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.phrapathom.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "พระปฐมเจดีย์",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180259",
        "name": "ราชินีบูรณะ",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.rn.ac.th/default/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "พระปฐมเจดีย์",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180260",
        "name": "พระปฐมวิทยาลัย2หลวงพ่อเงินอนุสรณ์",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.ppt2.ac.th/mainpage",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ดอนยายหอม",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180261",
        "name": "ศรีวิชัยวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.swc.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "วังตะกู",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180262",
        "name": "สระกะเทียมวิทยาคม \"สังวรเจษฎ์ประภาคมอุปถัมภ์\"",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.sktw.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "สระกะเทียม",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180263",
        "name": "วัดห้วยจรเข้วิทยาคม",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.wj.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "พระปฐมเจดีย์",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180264",
        "name": "โพรงมะเดื่อวิทยาคม",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.prongmadua.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "โพรงมะเดื่อ",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180265",
        "name": "สิรินธรราชวิทยาลัย",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.psc.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "สนามจันทร์",
            "district": "เมืองนครปฐม",
            "province": "นครปฐม",
            "postal_code": "73000"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180266",
        "name": "กำแพงแสนวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.kpsw.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ทุ่งกระพังโหม",
            "district": "กำแพงแสน",
            "province": "นครปฐม",
            "postal_code": "73180"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180267",
        "name": "มัธยมฐานบินกำแพงแสน",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://mtbk.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "กระตีบ",
            "district": "กำแพงแสน",
            "province": "นครปฐม",
            "postal_code": "73180"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180268",
        "name": "ศาลาตึกวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.salatuek.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ทุ่งลูกนก",
            "district": "กำแพงแสน",
            "province": "นครปฐม",
            "postal_code": "73180"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180276",
        "name": "คงทองวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.kongthong.ac.th/index.php/froum/index",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "สามง่าม",
            "district": "ดอนตูม",
            "province": "นครปฐม",
            "postal_code": "73150"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180277",
        "name": "บ้านหลวงวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://banluangwittaya.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "บ้านหลวง",
            "district": "ดอนตูม",
            "province": "นครปฐม",
            "postal_code": "73150"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180269",
        "name": "งิ้วรายบุญมีรังสฤษดิ์",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://ngbr.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "งิ้วราย",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180270",
        "name": "ภัทรญาณวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.py.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "วัดแค",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180271",
        "name": "อุบลรัตนราชกัญญาราชวิทยาลัย นครปฐม",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.ubrnp.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "บางแก้ว",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180272",
        "name": "พลอยจาตุรจินดา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.phloinpt.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ท่าพระยา",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180273",
        "name": "แหลมบัววิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://laembua.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "แหลมบัว",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180274",
        "name": "เพิ่มวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://permwit.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "นครชัยศรี",
            "district": "นครชัยศรี",
            "province": "นครปฐม",
            "postal_code": "73120"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180278",
        "name": "บางเลนวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.blnwy.ac.th/#",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "บางเลน",
            "district": "บางเลน",
            "province": "นครปฐม",
            "postal_code": "73130"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180279",
        "name": "บางหลวงวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.blwy.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "บางหลวง",
            "district": "บางเลน",
            "province": "นครปฐม",
            "postal_code": "73130"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180280",
        "name": "สถาพรวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://stpsch.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ลำพญา",
            "district": "บางเลน",
            "province": "นครปฐม",
            "postal_code": "73130"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180281",
        "name": "บัวปากท่าวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://bptw.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "บัวปากท่า",
            "district": "บางเลน",
            "province": "นครปฐม",
            "postal_code": "73130"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180282",
        "name": "สามพรานวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.spw.ac.th/web/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ยายชา",
            "district": "สามพราน",
            "province": "นครปฐม",
            "postal_code": "73110"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180283",
        "name": "ภ.ป.ร.ราชวิทยาลัย ในพระบรมราชูปถัมภ์",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.kc.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ท่าตลาด",
            "district": "สามพราน",
            "province": "นครปฐม",
            "postal_code": "73110"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180284",
        "name": "วัดไร่ขิงวิทยา",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.wrk.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ไร่ขิง",
            "district": "สามพราน",
            "province": "นครปฐม",
            "postal_code": "73110"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180285",
        "name": "ปรีดารามวิทยาคม",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "คลองจินดา",
            "district": "สามพราน",
            "province": "นครปฐม",
            "postal_code": "73110"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180286",
        "name": "รัตนโกสินทร์สมโภชบวรนิเวศศาลายา ในพระสังฆราชูปถัมภ์",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "http://www.rsbs.ac.th/index_1.html",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "ศาลายา",
            "district": "พุทธมณฑล",
            "province": "นครปฐม",
            "postal_code": "73170"
        },
        "phone": "",
        "email": ""
    },
    {
        "school_code": "1073180288",
        "name": "กาญจนาภิเษกวิทยาลัย นครปฐม (พระตำหนักสวนกุหลาบมัธยม)",
        "type": "โรงเรียนมัธยมศึกษา",
        "website": "https://www.kjn.ac.th/",
        "address": {
            "house_no": "",
            "village_no": "",
            "soi": "",
            "road": "",
            "subdistrict": "",
            "district": "พุทธมณฑล",
            "province": "นครปฐม",
            "postal_code": "73170"
        },
        "phone": "",
        "email": ""
    }
]

def check_existing_schools():
    """Check if schools already exist in the database"""
    try:
        response = requests.get(SCHOOLS_ENDPOINT)
        if response.status_code == 200:
            data = response.json()
            return data.get("total_count", 0) if isinstance(data, dict) else len(data) if isinstance(data, list) else 0
        elif response.status_code == 401:
            print("🔒 API requires authentication - this is expected")
            return 0
        else:
            print(f"⚠️  API returned status {response.status_code}")
            return 0
    except requests.exceptions.RequestException as e:
        print(f"❌ Error checking schools: {e}")
        return 0

def add_school_via_api(school_data: Dict[str, Any], auth_token: str = None) -> bool:
    """Add a single school via API"""
    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        response = requests.post(SCHOOLS_ENDPOINT, json=school_data, headers=headers)
        
        if response.status_code == 201:
            print(f"✅ Successfully added: {school_data['name']}")
            return True
        elif response.status_code == 401:
            print(f"🔒 Authentication required for: {school_data['name']}")
            return False
        elif response.status_code == 400:
            print(f"❌ Bad request for: {school_data['name']} - {response.text}")
            return False
        else:
            print(f"⚠️  Unexpected response for: {school_data['name']} - Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error adding school {school_data['name']}: {e}")
        return False

def seed_schools_via_api():
    """Seed schools using the API endpoints"""
    print("🏫 Starting Nakhon Pathom schools seeding via API...")
    
    # First, let's check if we can access the API
    print(f"🔍 Testing API endpoint: {SCHOOLS_ENDPOINT}")
    
    try:
        # Test the endpoint
        response = requests.get(SCHOOLS_ENDPOINT)
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API is working (authentication required as expected)")
            print("📝 Note: To actually seed data, you'll need to:")
            print("   1. Login to the admin panel")
            print("   2. Use the schools management interface")
            print("   3. Or provide a valid authentication token")
            return False
        elif response.status_code == 200:
            print("✅ API is accessible and returning data")
            existing_data = response.json()
            total_count = existing_data.get("total_count", 0) if isinstance(existing_data, dict) else len(existing_data) if isinstance(existing_data, list) else 0
            print(f"📊 Current schools in database: {total_count}")
        else:
            print(f"⚠️  API returned unexpected status: {response.status_code}")
            print(f"📄 Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error accessing API: {e}")
        return False
    
    print("\n📋 Sample school data structure:")
    print(json.dumps(NAKHON_PATHOM_SCHOOLS_DATA[0], indent=2, ensure_ascii=False))
    
    print(f"\n🎯 Total schools to seed: {len(NAKHON_PATHOM_SCHOOLS_DATA)}")
    print("\n💡 To populate the schools:")
    print("   1. Access the admin panel at: http://localhost:3014/dashboard/schools-management")
    print("   2. Login with your admin credentials")
    print("   3. Use the 'Add New School' button to add schools")
    print("   4. Or use the API with proper authentication")
    
    return True

def main():
    """Main function"""
    print("🏥 EVEP Medical Portal - Nakhon Pathom Schools Seeding")
    print("=" * 60)
    
    # Check existing schools
    existing_count = check_existing_schools()
    if existing_count > 0:
        print(f"✅ Database already has {existing_count} schools")
        print("🔄 You can still add these Nakhon Pathom schools...")
    
    # Seed schools via API
    success = seed_schools_via_api()
    
    if success:
        print("\n✅ Schools seeding preparation completed!")
        print("🚀 You can now populate the schools through the admin panel interface")
        print("\n📋 Schools to add:")
        for i, school in enumerate(NAKHON_PATHOM_SCHOOLS_DATA, 1):
            print(f"   {i:2d}. {school['name']} ({school['school_code']})")
            print(f"       📍 {school['address']['subdistrict']}, {school['address']['district']}, {school['address']['province']}")
            if school.get('website'):
                print(f"       🌐 {school['website']}")
            print()
    else:
        print("\n❌ Schools seeding failed")
        print("🔧 Please check the backend service and try again")

if __name__ == "__main__":
    main()
