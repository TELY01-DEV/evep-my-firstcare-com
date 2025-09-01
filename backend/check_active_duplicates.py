#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict

async def check_active_duplicates():
    """Check for duplicate patients among active patients only"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        print("🔍 Checking for duplicate patients (active only)...")
        
        # Get only active patients
        active_patients = await db.patients.find({"is_active": True}).to_list(length=None)
        inactive_patients = await db.patients.find({"is_active": False}).to_list(length=None)
        
        print(f"\n📊 Patient Statistics:")
        print(f"   Active patients: {len(active_patients)}")
        print(f"   Inactive patients: {len(inactive_patients)}")
        print(f"   Total patients: {len(active_patients) + len(inactive_patients)}")
        
        # Check for duplicates by different criteria (active only)
        duplicates_by_cid = defaultdict(list)
        duplicates_by_name = defaultdict(list)
        duplicates_by_email = defaultdict(list)
        duplicates_by_phone = defaultdict(list)
        
        for patient in active_patients:
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
        print("\n🔍 Active Duplicates by Citizen ID (CID):")
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
        print("\n🔍 Active Duplicates by Full Name:")
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
        print("\n🔍 Active Duplicates by Parent Email:")
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
        print("\n🔍 Active Duplicates by Parent Phone:")
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
        
        print(f"\n📊 Summary (Active Patients Only):")
        print(f"   Active patients: {len(active_patients)}")
        print(f"   Duplicates by CID: {len(cid_duplicates)}")
        print(f"   Duplicates by name: {len(name_duplicates)}")
        print(f"   Duplicates by email: {len(email_duplicates)}")
        print(f"   Duplicates by phone: {len(phone_duplicates)}")
        print(f"   Total duplicate groups: {total_duplicates}")
        
        if total_duplicates > 0:
            print(f"\n⚠️  Found {total_duplicates} groups of active duplicates!")
            print("   Consider merging or cleaning up duplicate records.")
        else:
            print(f"\n✅ No active duplicates found!")
        
        # Show inactive patients summary
        print(f"\n📊 Inactive Patients Summary:")
        print(f"   Total inactive: {len(inactive_patients)}")
        
        if inactive_patients:
            merged_patients = [p for p in inactive_patients if p.get("merged_into")]
            print(f"   Merged into other records: {len(merged_patients)}")
            
            if merged_patients:
                print(f"   Merge reasons:")
                merge_reasons = {}
                for patient in merged_patients:
                    reason = patient.get("merge_reason", "Unknown")
                    merge_reasons[reason] = merge_reasons.get(reason, 0) + 1
                
                for reason, count in merge_reasons.items():
                    print(f"     - {reason}: {count} patients")
        
    except Exception as e:
        print(f"❌ Error checking active duplicates: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_active_duplicates())
