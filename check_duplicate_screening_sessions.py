#!/usr/bin/env python3
"""
Check for Duplicate Screening Sessions
Script to identify and analyze duplicate screening sessions in the database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from collections import defaultdict

# MongoDB Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "evep"

async def check_duplicate_sessions():
    """Check for duplicate screening sessions"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("🔍 Checking for duplicate screening sessions...")
        
        # Get all screening sessions
        sessions = await db.screenings.find({}).to_list(length=None)
        
        print(f"📊 Total screening sessions: {len(sessions)}")
        
        # Group by patient_id to find potential duplicates
        patient_sessions = defaultdict(list)
        
        for session in sessions:
            patient_id = str(session.get("patient_id"))
            patient_sessions[patient_id].append(session)
        
        # Check for duplicates
        duplicates_found = False
        total_duplicates = 0
        
        print(f"\n🔍 Analyzing {len(patient_sessions)} unique patients...")
        
        for patient_id, patient_session_list in patient_sessions.items():
            if len(patient_session_list) > 1:
                duplicates_found = True
                
                print(f"\n⚠️  Patient {patient_id} has {len(patient_session_list)} screening sessions:")
                
                for i, session in enumerate(patient_session_list, 1):
                    session_id = str(session.get("_id"))
                    screening_type = session.get("screening_type", "unknown")
                    status = session.get("status", "unknown")
                    created_at = session.get("created_at", "unknown")
                    examiner_id = session.get("examiner_id", "unknown")
                    
                    print(f"   {i}. Session ID: {session_id}")
                    print(f"      Type: {screening_type}")
                    print(f"      Status: {status}")
                    print(f"      Created: {created_at}")
                    print(f"      Examiner: {examiner_id}")
                    
                    # Check if results are different
                    results = session.get("results", {})
                    if results:
                        print(f"      Has Results: Yes")
                    else:
                        print(f"      Has Results: No")
                
                total_duplicates += len(patient_session_list) - 1
        
        if not duplicates_found:
            print("\n✅ No duplicate screening sessions found!")
        else:
            print(f"\n📊 Summary:")
            print(f"   Patients with multiple sessions: {sum(1 for sessions in patient_sessions.values() if len(sessions) > 1)}")
            print(f"   Total duplicate sessions: {total_duplicates}")
        
        # Check for sessions with same patient_id, screening_type, and date
        print(f"\n🔍 Checking for exact duplicates (same patient, type, and date)...")
        
        exact_duplicates = defaultdict(list)
        
        for session in sessions:
            patient_id = str(session.get("patient_id"))
            screening_type = session.get("screening_type", "unknown")
            created_date = session.get("created_at")
            
            if isinstance(created_date, datetime):
                created_date = created_date.date()
            elif isinstance(created_date, str):
                try:
                    created_date = datetime.fromisoformat(created_date.replace('Z', '+00:00')).date()
                except:
                    created_date = "unknown"
            
            key = f"{patient_id}_{screening_type}_{created_date}"
            exact_duplicates[key].append(session)
        
        exact_duplicates_found = False
        for key, session_list in exact_duplicates.items():
            if len(session_list) > 1:
                exact_duplicates_found = True
                patient_id, screening_type, date = key.split('_', 2)
                
                print(f"\n❗ Exact duplicates found:")
                print(f"   Patient: {patient_id}")
                print(f"   Type: {screening_type}")
                print(f"   Date: {date}")
                print(f"   Sessions: {len(session_list)}")
                
                for i, session in enumerate(session_list, 1):
                    session_id = str(session.get("_id"))
                    status = session.get("status", "unknown")
                    print(f"      {i}. {session_id} ({status})")
        
        if not exact_duplicates_found:
            print("✅ No exact duplicates found!")
        
        # Check for patients with multiple sessions on the same day
        print(f"\n🔍 Checking for multiple sessions on same day...")
        
        same_day_sessions = defaultdict(list)
        
        for session in sessions:
            patient_id = str(session.get("patient_id"))
            created_date = session.get("created_at")
            
            if isinstance(created_date, datetime):
                date_str = created_date.strftime("%Y-%m-%d")
            elif isinstance(created_date, str):
                try:
                    date_str = datetime.fromisoformat(created_date.replace('Z', '+00:00')).strftime("%Y-%m-%d")
                except:
                    date_str = "unknown"
            else:
                date_str = "unknown"
            
            key = f"{patient_id}_{date_str}"
            same_day_sessions[key].append(session)
        
        same_day_found = False
        for key, session_list in same_day_sessions.items():
            if len(session_list) > 1:
                same_day_found = True
                patient_id, date = key.rsplit('_', 1)
                
                print(f"\n📅 Multiple sessions on {date}:")
                print(f"   Patient: {patient_id}")
                print(f"   Sessions: {len(session_list)}")
                
                for i, session in enumerate(session_list, 1):
                    session_id = str(session.get("_id"))
                    screening_type = session.get("screening_type", "unknown")
                    status = session.get("status", "unknown")
                    print(f"      {i}. {session_id} - {screening_type} ({status})")
        
        if not same_day_found:
            print("✅ No multiple sessions on same day found!")
    
    except Exception as e:
        print(f"❌ Error checking duplicates: {str(e)}")
    
    finally:
        client.close()

async def get_patient_info():
    """Get patient information for context"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Get total patients
        total_patients = await db.patients.count_documents({})
        total_students = await db.students.count_documents({})
        total_sessions = await db.screenings.count_documents({})
        
        print(f"\n📊 Database Overview:")
        print(f"   Total Patients: {total_patients}")
        print(f"   Total Students: {total_students}")
        print(f"   Total Screening Sessions: {total_sessions}")
        
        # Check for recent sessions
        recent_sessions = await db.screenings.find({}).sort("created_at", -1).limit(5).to_list(length=5)
        
        print(f"\n📅 Recent Sessions:")
        for session in recent_sessions:
            session_id = str(session.get("_id"))
            patient_id = str(session.get("patient_id"))
            screening_type = session.get("screening_type", "unknown")
            status = session.get("status", "unknown")
            created_at = session.get("created_at", "unknown")
            
            print(f"   {session_id} - Patient: {patient_id} - {screening_type} ({status}) - {created_at}")
    
    except Exception as e:
        print(f"❌ Error getting patient info: {str(e)}")
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🔍 Starting duplicate screening session check...\n")
    
    asyncio.run(get_patient_info())
    asyncio.run(check_duplicate_sessions())
    
    print(f"\n✅ Duplicate check completed!")