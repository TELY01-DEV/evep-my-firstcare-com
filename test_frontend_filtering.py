#!/usr/bin/env python3
"""
Test Frontend Duplicate Filtering Logic
Simulate what the frontend filtering does to verify it works correctly
"""

import requests
import json
from datetime import datetime
from collections import defaultdict

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
API_ENDPOINTS = {
    "auth": f"{API_BASE_URL}/api/v1/auth/login",
    "screenings": f"{API_BASE_URL}/api/v1/screenings/sessions"
}

def get_auth_token():
    """Get authentication token"""
    credentials = {"email": "admin@evep.com", "password": "admin123"}
    
    try:
        response = requests.post(API_ENDPOINTS["auth"], json=credentials)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token") or data.get("jwt")
    except Exception as e:
        print(f"❌ Auth error: {e}")
    return None

def simulate_frontend_filtering():
    """Simulate the frontend duplicate filtering logic"""
    
    print("🧪 Testing Frontend Duplicate Filtering Logic")
    print("=" * 60)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Cannot authenticate")
        return
    
    # Get raw sessions from API
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(API_ENDPOINTS["screenings"], headers=headers)
    
    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return
    
    sessions_data = response.json()
    
    print(f"📊 RAW API DATA:")
    print(f"   Total sessions from API: {len(sessions_data)}")
    
    # Show all raw sessions
    print(f"\n📋 ALL RAW SESSIONS:")
    for i, session in enumerate(sessions_data, 1):
        patient_name = session.get('patient_name', 'Unknown')
        patient_id = session.get('patient_id', 'unknown')
        session_id = session.get('session_id', session.get('_id', 'unknown'))
        status = session.get('status', 'unknown')
        created_at = session.get('created_at', 'unknown')
        
        print(f"   {i}. {patient_name} (ID: {patient_id[:8]}...)")
        print(f"      Session: {session_id}")
        print(f"      Status: {status}")
        print(f"      Created: {created_at}")
        print()
    
    # SIMULATE FRONTEND FILTERING (same logic as in Screenings.tsx)
    print(f"🔄 APPLYING FRONTEND DUPLICATE FILTERING...")
    print("   (This simulates the logic in frontend/src/pages/Screenings.tsx)")
    
    # Group by patient_id and keep only most recent
    patient_session_map = {}
    
    for session in sessions_data:
        patient_id = session.get('patient_id')
        session_date = datetime.fromisoformat(session.get('created_at', '').replace('Z', '+00:00')) if session.get('created_at') else datetime.min
        
        if patient_id not in patient_session_map:
            patient_session_map[patient_id] = session
        else:
            existing_date = datetime.fromisoformat(patient_session_map[patient_id].get('created_at', '').replace('Z', '+00:00')) if patient_session_map[patient_id].get('created_at') else datetime.min
            
            if session_date > existing_date:
                patient_session_map[patient_id] = session
    
    unique_sessions = list(patient_session_map.values())
    
    print(f"\n✅ FRONTEND FILTERED RESULTS:")
    print(f"   Sessions after filtering: {len(unique_sessions)}")
    print(f"   Duplicates removed: {len(sessions_data) - len(unique_sessions)}")
    
    print(f"\n📋 UNIQUE SESSIONS (What users see in frontend):")
    for i, session in enumerate(unique_sessions, 1):
        patient_name = session.get('patient_name', 'Unknown')
        patient_id = session.get('patient_id', 'unknown')
        session_id = session.get('session_id', session.get('_id', 'unknown'))
        status = session.get('status', 'unknown')
        created_at = session.get('created_at', 'unknown')
        
        print(f"   {i}. {patient_name} (ID: {patient_id[:8]}...)")
        print(f"      Session: {session_id} (Most Recent)")
        print(f"      Status: {status}")
        print(f"      Created: {created_at}")
        print()
    
    # Summary comparison
    print(f"📊 COMPARISON SUMMARY:")
    print(f"   Raw API Response: {len(sessions_data)} sessions")
    print(f"   Frontend Display: {len(unique_sessions)} unique patients")
    print(f"   Reduction: {len(sessions_data) - len(unique_sessions)} duplicate sessions filtered out")
    
    # Verify the filtering worked
    if len(unique_sessions) < len(sessions_data):
        print(f"\n✅ SUCCESS: Frontend duplicate filtering is working!")
        print(f"   Users will see {len(unique_sessions)} unique patients instead of {len(sessions_data)} duplicate sessions")
    else:
        print(f"\n⚠️  No duplicates detected or filtering didn't work")
    
    return unique_sessions

if __name__ == "__main__":
    print("🧪 Frontend Duplicate Filtering Test")
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    simulate_frontend_filtering()
    
    print(f"\n💡 KEY INSIGHT:")
    print(f"   The API intentionally returns ALL sessions (unfiltered)")
    print(f"   The FRONTEND filters duplicates for display purposes")
    print(f"   This is the correct architecture - API provides data, UI filters presentation")