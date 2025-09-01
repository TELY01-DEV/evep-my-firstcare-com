#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict

async def check_duplicate_patients():
    """Check for duplicate patients in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🔍 Checking for duplicate patients...")
        
        # Get all patients
        patients = await db.patients.find({}).to_list(length=None)
        
        print(f"\n📊 Total patients found: {len(patients)}")
        
        # Check for duplicates by different criteria
        duplicates_by_cid = defaultdict(list)
        duplicates_by_name = defaultdict(list)
        duplicates_by_email = defaultdict(list)
        duplicates_by_phone = defaultdict(list)
        
        for patient in patients:
            patient_id = str(patient["_id"])
            
            # Check by CID (Citizen ID)
            cid = patient.get("cid", "").strip()
            if cid:
                duplicates_by_cid[cid].append({
                    "id": patient_id,
                    "name": f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                    "email": patient.get("parent_email", ""),
                    "phone": patient.get("parent_phone", "")
                })
            
            # Check by full name
            full_name = f"{patient.get('first_name', '').strip()} {patient.get('last_name', '').strip()}".strip()
            if full_name:
                duplicates_by_name[full_name].append({
                    "id": patient_id,
                    "cid": patient.get("cid", ""),
                    "email": patient.get("parent_email", ""),
                    "phone": patient.get("parent_phone", "")
                })
            
            # Check by parent email
            email = patient.get("parent_email", "").strip()
            if email:
                duplicates_by_email[email].append({
                    "id": patient_id,
                    "name": f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                    "cid": patient.get("cid", ""),
                    "phone": patient.get("parent_phone", "")
                })
            
            # Check by parent phone
            phone = patient.get("parent_phone", "").strip()
            if phone:
                duplicates_by_phone[phone].append({
                    "id": patient_id,
                    "name": f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                    "cid": patient.get("cid", ""),
                    "email": patient.get("parent_email", "")
                })
        
        # Report duplicates by CID
        print("\n🔍 Duplicates by Citizen ID (CID):")
        cid_duplicates = {cid: patients for cid, patients in duplicates_by_cid.items() if len(patients) > 1}
        if cid_duplicates:
            for cid, patients_list in cid_duplicates.items():
                print(f"\n   CID: {cid}")
                for patient in patients_list:
                    print(f"     - ID: {patient['id']}")
                    print(f"       Name: {patient['name']}")
                    print(f"       Email: {patient['email']}")
                    print(f"       Phone: {patient['phone']}")
        else:
            print("   ✅ No duplicates found by CID")
        
        # Report duplicates by name
        print("\n🔍 Duplicates by Full Name:")
        name_duplicates = {name: patients for name, patients in duplicates_by_name.items() if len(patients) > 1}
        if name_duplicates:
            for name, patients_list in name_duplicates.items():
                print(f"\n   Name: {name}")
                for patient in patients_list:
                    print(f"     - ID: {patient['id']}")
                    print(f"       CID: {patient['cid']}")
                    print(f"       Email: {patient['email']}")
                    print(f"       Phone: {patient['phone']}")
        else:
            print("   ✅ No duplicates found by name")
        
        # Report duplicates by email
        print("\n🔍 Duplicates by Parent Email:")
        email_duplicates = {email: patients for email, patients in duplicates_by_email.items() if len(patients) > 1}
        if email_duplicates:
            for email, patients_list in email_duplicates.items():
                print(f"\n   Email: {email}")
                for patient in patients_list:
                    print(f"     - ID: {patient['id']}")
                    print(f"       Name: {patient['name']}")
                    print(f"       CID: {patient['cid']}")
                    print(f"       Phone: {patient['phone']}")
        else:
            print("   ✅ No duplicates found by email")
        
        # Report duplicates by phone
        print("\n🔍 Duplicates by Parent Phone:")
        phone_duplicates = {phone: patients for phone, patients in duplicates_by_phone.items() if len(patients) > 1}
        if phone_duplicates:
            for phone, patients_list in phone_duplicates.items():
                print(f"\n   Phone: {phone}")
                for patient in patients_list:
                    print(f"     - ID: {patient['id']}")
                    print(f"       Name: {patient['name']}")
                    print(f"       CID: {patient['cid']}")
                    print(f"       Email: {patient['email']}")
        else:
            print("   ✅ No duplicates found by phone")
        
        # Summary
        total_duplicates = len(cid_duplicates) + len(name_duplicates) + len(email_duplicates) + len(phone_duplicates)
        
        print(f"\n📊 Summary:")
        print(f"   Total patients: {len(patients)}")
        print(f"   Duplicates by CID: {len(cid_duplicates)}")
        print(f"   Duplicates by name: {len(name_duplicates)}")
        print(f"   Duplicates by email: {len(email_duplicates)}")
        print(f"   Duplicates by phone: {len(phone_duplicates)}")
        print(f"   Total duplicate groups: {total_duplicates}")
        
        if total_duplicates > 0:
            print(f"\n⚠️  Found {total_duplicates} groups of potential duplicates!")
            print("   Consider merging or cleaning up duplicate records.")
        else:
            print(f"\n✅ No duplicates found!")
        
        # Check for patients with missing critical data
        print(f"\n🔍 Data Quality Check:")
        missing_cid = [p for p in patients if not p.get("cid")]
        missing_email = [p for p in patients if not p.get("parent_email")]
        missing_phone = [p for p in patients if not p.get("parent_phone")]
        
        print(f"   Patients missing CID: {len(missing_cid)}")
        print(f"   Patients missing email: {len(missing_email)}")
        print(f"   Patients missing phone: {len(missing_phone)}")
        
        if missing_cid or missing_email or missing_phone:
            print("   ⚠️  Some patients are missing critical contact information")
        
    except Exception as e:
        print(f"❌ Error checking duplicates: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_duplicate_patients())
