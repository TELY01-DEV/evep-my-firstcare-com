#!/usr/bin/env python3
"""
Check Screening Data Updates via API
Script to verify if doctor diagnosis data is being properly saved and updated
"""

import requests
import json
import sys
from datetime import datetime

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
API_ENDPOINTS = {
    "patients": f"{API_BASE_URL}/api/v1/patients",
    "screenings": f"{API_BASE_URL}/api/v1/screenings/sessions",
    "auth": f"{API_BASE_URL}/api/v1/auth/login"
}

def get_auth_token():
    """Get authentication token for API access"""
    credentials = {"email": "admin@evep.com", "password": "admin123"}
    
    try:
        response = requests.post(API_ENDPOINTS["auth"], json=credentials)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token") or data.get("jwt")
            if token:
                print("✅ Authentication successful")
                return token
        
        print(f"❌ Authentication failed: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def check_screening_sessions_detailed(token=None):
    """Check screening sessions with detailed data including doctor diagnosis"""
    print("\n🔍 Checking Screening Sessions for Doctor Diagnosis Data...")
    print("=" * 70)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(API_ENDPOINTS["screenings"], headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch screening sessions: {response.text}")
            return []
        
        data = response.json()
        sessions = data if isinstance(data, list) else data.get("sessions", [])
        
        print(f"✅ Found {len(sessions)} screening sessions")
        
        # Focus on recent sessions with detailed analysis
        completed_sessions = 0
        doctor_diagnosis_sessions = 0
        sessions_with_workflow_data = 0
        
        for i, session in enumerate(sessions):
            session_id = session.get('session_id', 'N/A')
            patient_name = session.get('patient_name', 'N/A')
            status = session.get('status', 'N/A')
            created_at = session.get('created_at', 'N/A')
            
            print(f"\n📋 Session {i+1}: {session_id}")
            print(f"   Patient: {patient_name}")
            print(f"   Status: {status}")
            print(f"   Created: {created_at}")
            
            # Check for completion status
            if 'complete' in status.lower():
                completed_sessions += 1
                print(f"   ✅ Status: COMPLETED")
            
            # Check for doctor diagnosis status
            if 'doctor' in status.lower() or 'diagnosis' in status.lower():
                doctor_diagnosis_sessions += 1
                print(f"   🩺 Status: HAS DOCTOR DIAGNOSIS")
            
            # Check for workflow data
            if session.get('workflow_data'):
                sessions_with_workflow_data += 1
                workflow = session.get('workflow_data', {})
                print(f"   📊 Has workflow_data: YES")
                
                # Check for screening results
                screening_results = workflow.get('screening_results', {})
                if screening_results:
                    print(f"      📈 Has screening_results: YES")
                    
                    # Check specifically for doctor diagnosis data
                    doctor_diagnosis = screening_results.get('doctor_diagnosis', {})
                    if doctor_diagnosis:
                        print(f"      🩺 Has doctor_diagnosis: YES")
                        print(f"         Keys: {list(doctor_diagnosis.keys())}")
                        
                        # Show some key diagnosis data
                        if doctor_diagnosis.get('primaryDiagnosis'):
                            print(f"         Primary Diagnosis: {doctor_diagnosis.get('primaryDiagnosis')}")
                        if doctor_diagnosis.get('rightEyeVA'):
                            print(f"         Right Eye VA: {doctor_diagnosis.get('rightEyeVA')}")
                        if doctor_diagnosis.get('leftEyeVA'):
                            print(f"         Left Eye VA: {doctor_diagnosis.get('leftEyeVA')}")
                        if doctor_diagnosis.get('examinerName'):
                            print(f"         Examiner: {doctor_diagnosis.get('examinerName')}")
                        if doctor_diagnosis.get('examinationDate'):
                            print(f"         Exam Date: {doctor_diagnosis.get('examinationDate')}")
                    else:
                        print(f"      🩺 Has doctor_diagnosis: NO")
                
                # Check for VA screening data
                va_results = screening_results.get('va_screening', {})
                if va_results:
                    print(f"      👁️ Has VA screening: YES")
                else:
                    print(f"      👁️ Has VA screening: NO")
            else:
                print(f"   📊 Has workflow_data: NO")
            
            # Add separator for readability
            print("   " + "-" * 50)
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Sessions: {len(sessions)}")
        print(f"   Completed Sessions: {completed_sessions}")
        print(f"   Doctor Diagnosis Sessions: {doctor_diagnosis_sessions}")
        print(f"   Sessions with Workflow Data: {sessions_with_workflow_data}")
        
        return sessions
        
    except Exception as e:
        print(f"❌ Error checking screening sessions: {e}")
        return []

def get_specific_session(session_id, token=None):
    """Get detailed information for a specific session"""
    print(f"\n🔍 Getting Detailed Session Data for: {session_id}")
    print("=" * 70)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(f"{API_ENDPOINTS['screenings']}/{session_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            session = response.json()
            print("✅ Session found. Full data:")
            print(json.dumps(session, indent=2, default=str))
            return session
        else:
            print(f"❌ Failed to get session: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting session: {e}")
        return None

def check_recent_updates(token=None):
    """Check for recent updates to screening data"""
    print(f"\n🕐 Checking for Recent Updates...")
    print("=" * 70)
    
    sessions = check_screening_sessions_detailed(token)
    
    # Look for sessions updated today
    today = datetime.now().strftime('%Y-%m-%d')
    recent_sessions = []
    
    for session in sessions:
        created_at = session.get('created_at', '')
        updated_at = session.get('updated_at', session.get('modified_at', ''))
        
        if today in created_at or today in updated_at:
            recent_sessions.append(session)
    
    if recent_sessions:
        print(f"✅ Found {len(recent_sessions)} sessions from today:")
        for session in recent_sessions:
            session_id = session.get('session_id', 'N/A')
            print(f"   📋 {session_id} - {session.get('status', 'N/A')}")
            
            # Check if this session has been updated with doctor diagnosis
            workflow = session.get('workflow_data', {})
            screening_results = workflow.get('screening_results', {})
            doctor_diagnosis = screening_results.get('doctor_diagnosis', {})
            
            if doctor_diagnosis:
                print(f"      🩺 HAS DOCTOR DIAGNOSIS DATA")
            else:
                print(f"      ⚠️ No doctor diagnosis data yet")
    else:
        print(f"❌ No sessions found from today ({today})")
    
    return recent_sessions

def main():
    print("🚀 Screening Data Update Checker")
    print("=" * 50)
    print(f"Checking APIs at: {API_BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Get authentication token
    print("\n🔐 Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("❌ Cannot proceed without authentication")
        sys.exit(1)
    
    # Check all screening sessions
    sessions = check_screening_sessions_detailed(token)
    
    # Check for recent updates
    recent_sessions = check_recent_updates(token)
    
    # If there are completed sessions, get detailed data for the most recent one
    completed_sessions = [s for s in sessions if 'complete' in s.get('status', '').lower()]
    if completed_sessions:
        latest_session = completed_sessions[0]  # First one (most recent)
        session_id = latest_session.get('session_id')
        print(f"\n🔍 Getting detailed data for latest completed session: {session_id}")
        get_specific_session(session_id, token)

if __name__ == "__main__":
    main()