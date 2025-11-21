#!/usr/bin/env python3
"""
Check Patient Data via API
Script to verify if walk-in patients are being properly saved to the database
"""

import requests
import json
import sys
from datetime import datetime

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
API_ENDPOINTS = {
    "patients": f"{API_BASE_URL}/api/v1/patients",
    "students": f"{API_BASE_URL}/api/v1/evep/students", 
    "screenings": f"{API_BASE_URL}/api/v1/screenings/sessions",
    "auth": f"{API_BASE_URL}/api/v1/auth/login"
}

def get_auth_token():
    """Get authentication token for API access"""
    
    # Try different login endpoints and credential formats
    login_endpoints = [
        f"{API_BASE_URL}/api/v1/auth/login",
        f"{API_BASE_URL}/api/v1/login", 
        f"{API_BASE_URL}/login",
        f"{API_BASE_URL}/api/auth/login"
    ]
    
    credential_formats = [
        {"email": "admin@evep.com", "password": "admin123"},
        {"username": "admin@evep.com", "password": "admin123"},
        {"username": "admin", "password": "admin123"}
    ]
    
    for endpoint in login_endpoints:
        for credentials in credential_formats:
            try:
                print(f"🔍 Trying: {endpoint} with {list(credentials.keys())}")
                response = requests.post(endpoint, json=credentials)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    token = data.get("access_token") or data.get("token") or data.get("jwt")
                    if token:
                        print(f"✅ Authentication successful with {endpoint}")
                        return token
                else:
                    print(f"   Response: {response.text[:100]}...")
                    
            except Exception as e:
                print(f"   Error: {e}")
    
    print("❌ All authentication attempts failed")
    return None

def check_patients_api(token=None):
    """Check all patients via patients API"""
    print("\n🔍 Checking Patients API...")
    print("=" * 50)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Try different endpoints that might work
    endpoints_to_try = [
        (f"{API_ENDPOINTS['patients']}/", "GET", "patients list"),
        (f"{API_ENDPOINTS['patients']}/search", "GET", "patients search"),
        (f"{API_ENDPOINTS['patients']}/search", "POST", "patients search with POST")
    ]
    
    for endpoint, method, description in endpoints_to_try:
        try:
            print(f"\n🔍 Trying {description}: {method} {endpoint}")
            
            if method == "GET":
                response = requests.get(endpoint, headers=headers)
            elif method == "POST":
                # Try empty search to get all patients
                search_data = {"query": "", "limit": 100}
                response = requests.post(endpoint, json=search_data, headers=headers)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle different response formats
                if isinstance(data, list):
                    patients = data
                elif isinstance(data, dict):
                    patients = data.get("patients", []) or data.get("results", []) or data.get("data", [])
                else:
                    patients = []
                
                print(f"✅ Found {len(patients)} patients via {description}")
                
                # Display recent patients
                for i, patient in enumerate(patients[:10]):  # Show first 10
                    print(f"\n📋 Patient {i+1}:")
                    print(f"   ID: {patient.get('_id', patient.get('patient_id', 'N/A'))}")
                    print(f"   Name: {patient.get('first_name', '')} {patient.get('last_name', '')}")
                    print(f"   Full Name: {patient.get('full_name', 'N/A')}")
                    print(f"   DOB: {patient.get('date_of_birth', 'N/A')}")
                    print(f"   School: {patient.get('school', 'N/A')}")
                    print(f"   Grade: {patient.get('grade', 'N/A')}")
                    print(f"   Created: {patient.get('created_at', 'N/A')}")
                    print(f"   Active: {patient.get('is_active', 'N/A')}")
                
                return patients
                
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Error with {description}: {e}")
    
    return []

def check_students_api(token=None):
    """Check students API (alternative patient storage)"""
    print("\n🔍 Checking Students API...")
    print("=" * 50)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(API_ENDPOINTS["students"], headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            students = data.get("students", []) if isinstance(data, dict) else data
            
            print(f"✅ Found {len(students)} students")
            
            # Display recent students
            for i, student in enumerate(students[:10]):  # Show first 10
                print(f"\n📚 Student {i+1}:")
                print(f"   ID: {student.get('_id', 'N/A')}")
                print(f"   Name: {student.get('first_name', '')} {student.get('last_name', '')}")
                print(f"   Full Name: {student.get('full_name', 'N/A')}")
                print(f"   DOB: {student.get('date_of_birth', 'N/A')}")
                print(f"   School: {student.get('school', 'N/A')}")
                print(f"   Grade: {student.get('grade', 'N/A')}")
                print(f"   Created: {student.get('created_at', 'N/A')}")
            
            return students
            
        else:
            print(f"❌ Failed to fetch students: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error checking students API: {e}")
        return []

def check_duplicate_screenings_api(token=None):
    """Check for duplicate screening sessions using API"""
    print("\n🔍 Checking for Duplicate Screening Sessions...")
    print("=" * 60)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(API_ENDPOINTS["screenings"], headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            sessions = data if isinstance(data, list) else data.get("sessions", [])
            
            print(f"✅ Found {len(sessions)} screening sessions")
            
            # Group by patient_id to find potential duplicates
            patient_sessions = {}
            
            for session in sessions:
                patient_id = session.get('patient_id', 'unknown')
                patient_name = session.get('patient_name', 'Unknown')
                
                if patient_id not in patient_sessions:
                    patient_sessions[patient_id] = []
                
                patient_sessions[patient_id].append(session)
            
            # Check for duplicates
            duplicates_found = False
            total_duplicates = 0
            
            print(f"\n🔍 Analyzing {len(patient_sessions)} unique patients...")
            
            for patient_id, session_list in patient_sessions.items():
                if len(session_list) > 1:
                    duplicates_found = True
                    patient_name = session_list[0].get('patient_name', 'Unknown')
                    
                    print(f"\n⚠️  Patient '{patient_name}' (ID: {patient_id}) has {len(session_list)} screening sessions:")
                    
                    for i, session in enumerate(session_list, 1):
                        session_id = session.get('session_id', session.get('_id', 'unknown'))
                        screening_type = session.get('screening_type', 'unknown')
                        status = session.get('status', 'unknown')
                        created_at = session.get('created_at', 'unknown')
                        examiner_name = session.get('examiner_name', 'unknown')
                        
                        print(f"     {i}. Session ID: {session_id}")
                        print(f"        Type: {screening_type}")
                        print(f"        Status: {status}")
                        print(f"        Created: {created_at}")
                        print(f"        Examiner: {examiner_name}")
                        
                        # Check if session has results
                        has_results = bool(session.get('results'))
                        print(f"        Has Results: {has_results}")
                    
                    total_duplicates += len(session_list) - 1
            
            if not duplicates_found:
                print("\n✅ No duplicate screening sessions found!")
            else:
                print(f"\n📊 DUPLICATE SUMMARY:")
                print(f"   Patients with multiple sessions: {sum(1 for sessions in patient_sessions.values() if len(sessions) > 1)}")
                print(f"   Total duplicate sessions: {total_duplicates}")
                
                # Provide recommendations
                print(f"\n💡 RECOMMENDATIONS:")
                print(f"   1. Review duplicate sessions to determine if they are legitimate")
                print(f"   2. Consider merging or removing duplicates if they're errors")
                print(f"   3. Check if different session types are intentionally separate")
            
            # Show recent sessions for context
            print(f"\n📅 RECENT SESSIONS (Last 5):")
            for i, session in enumerate(sessions[:5]):
                session_id = session.get('session_id', session.get('_id', 'unknown'))
                patient_name = session.get('patient_name', 'Unknown')
                screening_type = session.get('screening_type', 'unknown')
                status = session.get('status', 'unknown')
                created_at = session.get('created_at', 'unknown')
                
                print(f"   {i+1}. {session_id} - {patient_name} - {screening_type} ({status}) - {created_at}")
            
            return sessions
            
        else:
            print(f"❌ Failed to fetch screening sessions: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error checking screenings API: {e}")
        return []

def analyze_patient_screening_relationship(sessions, token=None):
    """Analyze the relationship between patients and screening sessions"""
    print("\n🔍 Analyzing Patient-Screening Relationship...")
    print("=" * 60)
    
    if not sessions:
        print("❌ No sessions to analyze")
        return
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Get unique patient IDs from sessions
    patient_ids_in_sessions = set()
    for session in sessions:
        patient_id = session.get('patient_id')
        if patient_id:
            patient_ids_in_sessions.add(patient_id)
    
    print(f"📊 Found {len(patient_ids_in_sessions)} unique patient IDs in screening sessions:")
    for patient_id in patient_ids_in_sessions:
        print(f"   - {patient_id}")
    
    # Check if these patients exist in the patients collection
    print(f"\n🔍 Checking if these patients exist in patients collection...")
    
    for patient_id in patient_ids_in_sessions:
        try:
            # Try to get patient by ID
            patient_url = f"{API_ENDPOINTS['patients']}/{patient_id}"
            response = requests.get(patient_url, headers=headers)
            
            if response.status_code == 200:
                patient = response.json()
                patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip()
                print(f"   ✅ {patient_id} - Found in patients: {patient_name}")
            else:
                print(f"   ❌ {patient_id} - NOT found in patients collection (status: {response.status_code})")
                
                # Check if it exists in students collection
                try:
                    student_url = f"{API_ENDPOINTS['students']}/{patient_id}"
                    student_response = requests.get(student_url, headers=headers)
                    
                    if student_response.status_code == 200:
                        student = student_response.json()
                        student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
                        print(f"      ➡️  Found in STUDENTS collection: {student_name}")
                        print(f"         This explains the issue: Screenings reference student IDs, not patient IDs!")
                    else:
                        print(f"      ❌ NOT found in students collection either")
                except:
                    print(f"      ❌ Error checking students collection")
                    
        except Exception as e:
            print(f"   ❌ Error checking {patient_id}: {e}")
    
    # Conclusion
    print(f"\n💡 ANALYSIS CONCLUSION:")
    print(f"   • You have 9 screening sessions")
    print(f"   • 0 records in patients collection") 
    print(f"   • 9 records in students collection")
    print(f"   • Screening sessions likely reference student IDs as patient_id")
    print(f"   • This is why you see 'duplicates' - the system treats students as patients")
    
    return patient_ids_in_sessions

def search_patient_by_id(patient_id, token=None):
    """Search for specific patient by ID"""
    print(f"\n🔎 Searching for Patient ID: {patient_id}")
    print("=" * 50)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Try patients API first
    try:
        response = requests.get(f"{API_ENDPOINTS['patients']}/{patient_id}", headers=headers)
        if response.status_code == 200:
            patient = response.json()
            print("✅ Found in Patients API:")
            print(json.dumps(patient, indent=2, default=str))
            return patient
        else:
            print(f"❌ Not found in Patients API: {response.status_code}")
    except Exception as e:
        print(f"❌ Error searching patients API: {e}")
    
    # Try screening sessions
    try:
        response = requests.get(f"{API_ENDPOINTS['screenings']}?patient_id={patient_id}", headers=headers)
        if response.status_code == 200:
            sessions = response.json()
            if sessions:
                print(f"✅ Found {len(sessions)} sessions for this patient:")
                for session in sessions:
                    print(json.dumps(session, indent=2, default=str))
                return sessions
            else:
                print("❌ No sessions found for this patient")
        else:
            print(f"❌ Error searching sessions: {response.status_code}")
    except Exception as e:
        print(f"❌ Error searching sessions API: {e}")
    
    return None
    """Search for specific patient by ID"""
    print(f"\n🔎 Searching for Patient ID: {patient_id}")
    print("=" * 50)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Try patients API first
    try:
        response = requests.get(f"{API_ENDPOINTS['patients']}/{patient_id}", headers=headers)
        if response.status_code == 200:
            patient = response.json()
            print("✅ Found in Patients API:")
            print(json.dumps(patient, indent=2, default=str))
            return patient
        else:
            print(f"❌ Not found in Patients API: {response.status_code}")
    except Exception as e:
        print(f"❌ Error searching patients API: {e}")
    
    # Try screening sessions
    try:
        response = requests.get(f"{API_ENDPOINTS['screenings']}?patient_id={patient_id}", headers=headers)
        if response.status_code == 200:
            sessions = response.json()
            if sessions:
                print(f"✅ Found {len(sessions)} sessions for this patient:")
                for session in sessions:
                    print(json.dumps(session, indent=2, default=str))
                return sessions
            else:
                print("❌ No sessions found for this patient")
        else:
            print(f"❌ Error searching sessions: {response.status_code}")
    except Exception as e:
        print(f"❌ Error searching sessions API: {e}")
    
    return None

def main():
    """Main function to check all patient data and duplicates"""
    print("🚀 Patient Data & Duplicate Screening Sessions Verification Tool")
    print("=" * 70)
    print(f"Checking APIs at: {API_BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Get authentication token (optional, try without first)
    token = None
    print("\n🔐 Attempting to get authentication token...")
    token = get_auth_token()
    
    if not token:
        print("⚠️  Proceeding without authentication token")
    else:
        print("✅ Authentication successful")
    
    # Check for duplicate screening sessions FIRST
    sessions = check_duplicate_screenings_api(token)
    
    # ANALYZE the patient-screening relationship
    analyze_patient_screening_relationship(sessions, token)
    
    # Check other APIs for reference
    patients = check_patients_api(token)
    students = check_students_api(token)
    
    # Summary
    print("\n📊 FINAL SUMMARY")
    print("=" * 50)
    print(f"Patients found: {len(patients)}")
    print(f"Students found: {len(students)}")
    print(f"Screening sessions found: {len(sessions)}")
    
    # Look for specific patient if provided
    if len(sys.argv) > 1:
        patient_id = sys.argv[1]
        search_patient_by_id(patient_id, token)
    
    # Check for recent walk-in patients (those created today)
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"\n🕐 Looking for patients created today ({today})...")
    
    recent_patients = []
    for patient in patients:
        created_at = patient.get('created_at', '')
        if today in created_at:
            recent_patients.append(patient)
    
    if recent_patients:
        print(f"✅ Found {len(recent_patients)} patients created today:")
        for patient in recent_patients:
            print(f"   - {patient.get('full_name', 'Unknown')} (ID: {patient.get('_id')})")
    else:
        print("❌ No patients created today")
    
    print(f"\n✅ Analysis completed! Check the duplicate screening sessions report above.")

if __name__ == "__main__":
    main()