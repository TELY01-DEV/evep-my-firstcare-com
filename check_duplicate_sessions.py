#!/usr/bin/env python3
"""
Check for duplicate screening sessions in the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict
from bson import ObjectId
import os
from datetime import datetime

async def main():
    # Connect to MongoDB
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://admin:admin123@localhost:27017/evep?authSource=admin')
    client = AsyncIOMotorClient(mongo_uri)
    db = client.evep
    
    print("🔍 Checking for duplicate screening sessions...")
    
    try:
        # Get all screening sessions
        sessions_cursor = db.screenings.find({})
        sessions = await sessions_cursor.to_list(length=None)
        
        print(f"📊 Total screening sessions found: {len(sessions)}")
        
        if len(sessions) == 0:
            print("❌ No screening sessions found in database")
            return
        
        # Group by potential duplicate criteria
        duplicates_by_patient_date = defaultdict(list)
        duplicates_by_patient_type = defaultdict(list)
        duplicates_by_exact_time = defaultdict(list)
        
        for session in sessions:
            session_id = str(session["_id"])
            patient_id = str(session.get("patient_id", ""))
            screening_type = session.get("screening_type", "")
            created_at = session.get("created_at", "")
            status = session.get("status", "")
            
            # Check for same patient, same day
            if created_at:
                if isinstance(created_at, datetime):
                    date_key = created_at.strftime("%Y-%m-%d")
                else:
                    date_key = str(created_at)[:10]  # Assume ISO format
                
                patient_date_key = f"{patient_id}_{date_key}"
                duplicates_by_patient_date[patient_date_key].append({
                    "session_id": session_id,
                    "patient_id": patient_id,
                    "screening_type": screening_type,
                    "status": status,
                    "created_at": created_at
                })
            
            # Check for same patient, same type
            patient_type_key = f"{patient_id}_{screening_type}"
            duplicates_by_patient_type[patient_type_key].append({
                "session_id": session_id,
                "patient_id": patient_id,
                "screening_type": screening_type,
                "status": status,
                "created_at": created_at
            })
            
            # Check for exact same time
            if created_at:
                time_key = str(created_at)
                duplicates_by_exact_time[time_key].append({
                    "session_id": session_id,
                    "patient_id": patient_id,
                    "screening_type": screening_type,
                    "status": status,
                    "created_at": created_at
                })
        
        # Report duplicates by patient and date
        print("\n🔍 Checking for multiple sessions per patient per day...")
        found_patient_date_duplicates = False
        for key, sessions_list in duplicates_by_patient_date.items():
            if len(sessions_list) > 1:
                found_patient_date_duplicates = True
                patient_id, date = key.split("_", 1)
                print(f"\n⚠️  Patient {patient_id} has {len(sessions_list)} sessions on {date}:")
                for session in sessions_list:
                    print(f"   - Session {session['session_id']}: {session['screening_type']} ({session['status']})")
        
        if not found_patient_date_duplicates:
            print("✅ No duplicate sessions found for same patient on same day")
        
        # Report duplicates by patient and type
        print("\n🔍 Checking for multiple sessions per patient per type...")
        found_patient_type_duplicates = False
        for key, sessions_list in duplicates_by_patient_type.items():
            if len(sessions_list) > 1:
                found_patient_type_duplicates = True
                patient_id, screening_type = key.rsplit("_", 1)
                print(f"\n⚠️  Patient {patient_id} has {len(sessions_list)} {screening_type} sessions:")
                for session in sessions_list:
                    print(f"   - Session {session['session_id']}: {session['status']} at {session['created_at']}")
        
        if not found_patient_type_duplicates:
            print("✅ No duplicate sessions found for same patient with same type")
        
        # Report exact time duplicates
        print("\n🔍 Checking for sessions at exact same time...")
        found_exact_time_duplicates = False
        for time_key, sessions_list in duplicates_by_exact_time.items():
            if len(sessions_list) > 1:
                found_exact_time_duplicates = True
                print(f"\n⚠️  {len(sessions_list)} sessions created at exactly {time_key}:")
                for session in sessions_list:
                    print(f"   - Session {session['session_id']}: Patient {session['patient_id']}, {session['screening_type']} ({session['status']})")
        
        if not found_exact_time_duplicates:
            print("✅ No sessions found with exact same creation time")
        
        # Check for potential data integrity issues
        print("\n🔍 Checking data integrity...")
        patients_cursor = db.patients.find({})
        patients = await patients_cursor.to_list(length=None)
        
        students_cursor = db.students.find({})
        students = await students_cursor.to_list(length=None)
        
        patient_ids = {str(p["_id"]) for p in patients}
        student_ids = {str(s["_id"]) for s in students}
        
        orphaned_sessions = []
        for session in sessions:
            patient_id = str(session.get("patient_id", ""))
            if patient_id and patient_id not in patient_ids and patient_id not in student_ids:
                orphaned_sessions.append({
                    "session_id": str(session["_id"]),
                    "patient_id": patient_id,
                    "screening_type": session.get("screening_type", ""),
                    "status": session.get("status", "")
                })
        
        if orphaned_sessions:
            print(f"\n⚠️  Found {len(orphaned_sessions)} sessions with invalid patient_id:")
            for session in orphaned_sessions[:5]:  # Show first 5
                print(f"   - Session {session['session_id']}: Patient {session['patient_id']} not found")
            if len(orphaned_sessions) > 5:
                print(f"   ... and {len(orphaned_sessions) - 5} more")
        else:
            print("✅ All sessions have valid patient references")
        
        # Summary
        print(f"\n📊 Summary:")
        print(f"   Total sessions: {len(sessions)}")
        print(f"   Patient-date duplicates: {'Yes' if found_patient_date_duplicates else 'No'}")
        print(f"   Patient-type duplicates: {'Yes' if found_patient_type_duplicates else 'No'}")
        print(f"   Exact time duplicates: {'Yes' if found_exact_time_duplicates else 'No'}")
        print(f"   Orphaned sessions: {len(orphaned_sessions)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())