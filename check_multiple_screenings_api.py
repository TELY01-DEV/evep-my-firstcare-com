#!/usr/bin/env python3
"""
Check Screen-ID tracking for patients with multiple screenings using API
"""

import requests
import json
import sys
from datetime import datetime
from collections import defaultdict, Counter

# API Configuration
BASE_URL = "https://stardust.evep.my-firstcare.com"
API_ENDPOINTS = {
    'patients': f"{BASE_URL}/api/v1/patients/",
    'screenings': f"{BASE_URL}/api/v1/screenings/sessions"
}

# Authentication headers (will be updated after login)
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def get_auth_token():
    """Get authentication token for API access"""
    login_endpoint = f"{BASE_URL}/api/v1/auth/login"
    credentials = {"email": "admin@evep.com", "password": "admin123"}
    
    try:
        print(f"🔐 Authenticating with {login_endpoint}")
        response = requests.post(login_endpoint, json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print("✅ Authentication successful")
                return token
        
        print(f"❌ Authentication failed: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def get_api_data(endpoint, params=None):
    """Fetch data from API endpoint with error handling"""
    try:
        print(f"Fetching data from: {endpoint}")
        response = requests.get(endpoint, headers=HEADERS, params=params)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            print(f"❌ Authentication required for {endpoint}")
            return None
        elif response.status_code == 404:
            print(f"❌ Endpoint not found: {endpoint}")
            return None
        else:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return None

def check_patients_multiple_screenings():
    """Check patients with multiple screenings and their screen-ID tracking"""
    
    print("🔍 CHECKING SCREEN-ID TRACKING FOR PATIENTS WITH MULTIPLE SCREENINGS")
    print("=" * 80)
    
    # Get all patients
    print("\n📋 Step 1: Fetching all patients...")
    patients_data = get_api_data(API_ENDPOINTS['patients'])
    
    if not patients_data:
        print("❌ Unable to fetch patients data")
        return
    
    # Handle different response formats
    if isinstance(patients_data, dict):
        if 'data' in patients_data:
            patients = patients_data['data']
        elif 'patients' in patients_data:
            patients = patients_data['patients']
        else:
            patients = list(patients_data.values()) if patients_data else []
    else:
        patients = patients_data if isinstance(patients_data, list) else []
    
    print(f"✅ Found {len(patients)} patients")
    
    # Get all screenings
    print("\n📋 Step 2: Fetching screening sessions...")
    screenings_data = get_api_data(API_ENDPOINTS['screenings'])
    
    if screenings_data:
        if isinstance(screenings_data, dict):
            if 'data' in screenings_data:
                screenings = screenings_data['data']
            elif 'screenings' in screenings_data:
                screenings = screenings_data['screenings']
            elif 'sessions' in screenings_data:
                screenings = screenings_data['sessions']
            else:
                screenings = list(screenings_data.values()) if screenings_data else []
        else:
            screenings = screenings_data if isinstance(screenings_data, list) else []
        print(f"✅ Found {len(screenings)} screenings")
    else:
        screenings = []
        print("⚠️ No screenings found or unable to fetch")
    
    # Create patient lookup
    patient_lookup = {}
    for patient in patients:
        if isinstance(patient, dict):
            patient_id = patient.get('_id') or patient.get('id')
            if patient_id:
                patient_lookup[patient_id] = patient
    
    print(f"\n📊 Created patient lookup with {len(patient_lookup)} entries")
    
    # Analyze screenings by patient
    patient_screenings = defaultdict(list)
    
    # Process all screenings
    for screening in screenings:
        if isinstance(screening, dict):
            patient_id = screening.get('patient_id') or screening.get('patient', {}).get('_id')
            if patient_id:
                screening['type'] = 'screening'
                patient_screenings[patient_id].append(screening)
    
    print(f"\n📈 Analysis Results:")
    print(f"Total patients with screenings: {len(patient_screenings)}")
    
    # Find patients with multiple screenings
    patients_with_multiple = {}
    for patient_id, screenings in patient_screenings.items():
        if len(screenings) > 1:
            patients_with_multiple[patient_id] = screenings
    
    print(f"Patients with multiple screenings: {len(patients_with_multiple)}")
    
    if not patients_with_multiple:
        print("\n✅ No patients found with multiple screenings")
        return
    
    print("\n🔍 DETAILED ANALYSIS OF PATIENTS WITH MULTIPLE SCREENINGS:")
    print("=" * 80)
    
    screen_id_issues = []
    properly_tracked = []
    
    for patient_id, screenings in patients_with_multiple.items():
        patient = patient_lookup.get(patient_id)
        patient_name = "Unknown"
        
        if patient:
            first_name = patient.get('first_name', '')
            last_name = patient.get('last_name', '')
            patient_name = f"{first_name} {last_name}".strip()
        
        print(f"\n👤 Patient: {patient_name} (ID: {patient_id})")
        print(f"   Total screenings: {len(screenings)}")
        
        # Sort screenings by date
        sorted_screenings = sorted(screenings, key=lambda x: x.get('created_at', ''))
        
        screen_ids = []
        session_ids = []
        
        for i, screening in enumerate(sorted_screenings):
            screening_id = screening.get('_id') or screening.get('id')
            screening_type = screening.get('type', 'unknown')
            created_at = screening.get('created_at', 'Unknown date')
            status = screening.get('status', 'unknown')
            
            # Check for screen-ID field (different possible field names)
            screen_id = (screening.get('screen_id') or 
                        screening.get('screening_id') or 
                        screening.get('session_id') or 
                        screening_id)
            
            screen_ids.append(screen_id)
            session_ids.append(screening_id)
            
            print(f"   #{i+1} [{screening_type.upper()}] {created_at[:19]} - Status: {status}")
            print(f"       Session ID: {screening_id}")
            print(f"       Screen ID: {screen_id}")
            
            # Check if screening has proper identification
            if not screen_id or screen_id == screening_id:
                print(f"       ⚠️ No unique screen-ID found")
            else:
                print(f"       ✅ Has unique screen-ID")
        
        # Check for issues
        unique_screen_ids = set(filter(None, screen_ids))
        unique_session_ids = set(filter(None, session_ids))
        
        has_issues = False
        
        if len(unique_screen_ids) != len(screenings):
            print(f"   ❌ ISSUE: Screen-IDs not unique or missing")
            print(f"      Expected: {len(screenings)} unique screen-IDs")
            print(f"      Found: {len(unique_screen_ids)} unique screen-IDs")
            has_issues = True
        
        if len(unique_session_ids) != len(screenings):
            print(f"   ❌ ISSUE: Session-IDs not unique")
            has_issues = True
        
        if has_issues:
            screen_id_issues.append({
                'patient_id': patient_id,
                'patient_name': patient_name,
                'screening_count': len(screenings),
                'unique_screen_ids': len(unique_screen_ids),
                'screenings': sorted_screenings
            })
        else:
            properly_tracked.append({
                'patient_id': patient_id,
                'patient_name': patient_name,
                'screening_count': len(screenings)
            })
            print(f"   ✅ All screenings properly tracked")
    
    # Summary Report
    print("\n" + "=" * 80)
    print("📊 SUMMARY REPORT")
    print("=" * 80)
    
    print(f"Total patients analyzed: {len(patients_with_multiple)}")
    print(f"Patients with proper screen-ID tracking: {len(properly_tracked)}")
    print(f"Patients with screen-ID issues: {len(screen_id_issues)}")
    
    if screen_id_issues:
        print(f"\n❌ PATIENTS WITH SCREEN-ID ISSUES:")
        for issue in screen_id_issues:
            print(f"   • {issue['patient_name']} ({issue['patient_id']})")
            print(f"     {issue['screening_count']} screenings, {issue['unique_screen_ids']} unique screen-IDs")
    
    if properly_tracked:
        print(f"\n✅ PATIENTS WITH PROPER TRACKING:")
        for patient in properly_tracked:
            print(f"   • {patient['patient_name']} ({patient['screening_count']} screenings)")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if screen_id_issues:
        print("1. Implement unique screen-ID generation for each screening session")
        print("2. Add screen-ID field validation in the API")
        print("3. Update frontend to display screen-IDs properly")
        print("4. Consider adding screening sequence numbers (1st screening, 2nd screening, etc.)")
    else:
        print("✅ Screen-ID tracking appears to be working correctly!")
    
    return {
        'total_patients': len(patients_with_multiple),
        'properly_tracked': len(properly_tracked),
        'issues_found': len(screen_id_issues),
        'issue_details': screen_id_issues
    }

def check_screening_data_structure():
    """Check the data structure of screenings to understand available fields"""
    
    print("\n🔍 CHECKING SCREENING DATA STRUCTURE")
    print("=" * 50)
    
    # Get sample screening data
    screenings_data = get_api_data(API_ENDPOINTS['screenings'])
    
    # Analyze screenings structure
    if screenings_data:
        if isinstance(screenings_data, dict):
            if 'data' in screenings_data:
                sample_screenings = screenings_data['data'][:3]  # First 3 samples
            elif 'sessions' in screenings_data:
                sample_screenings = screenings_data['sessions'][:3]
            elif 'screenings' in screenings_data:
                sample_screenings = screenings_data['screenings'][:3]
            else:
                sample_screenings = []
        elif isinstance(screenings_data, list):
            sample_screenings = screenings_data[:3]
        else:
            sample_screenings = []
        
        if sample_screenings:
            print("📋 Screening Session Fields:")
            for i, screening in enumerate(sample_screenings):
                if isinstance(screening, dict):
                    print(f"\n   Sample {i+1} fields: {list(screening.keys())}")
        else:
            print("⚠️ No screening samples found for structure analysis")

if __name__ == "__main__":
    print("🏥 EVEP MEDICAL SCREENING - SCREEN-ID TRACKING ANALYSIS")
    print("Using API endpoints for data analysis")
    print(f"Timestamp: {datetime.now()}")
    
    # Authenticate first
    token = get_auth_token()
    if not token:
        print("❌ Failed to authenticate. Exiting.")
        sys.exit(1)
    
    # Update headers with auth token
    HEADERS['Authorization'] = f"Bearer {token}"
    
    try:
        # Check data structure first
        check_screening_data_structure()
        
        # Perform main analysis
        result = check_patients_multiple_screenings()
        
        if result:
            print(f"\n✅ Analysis completed successfully!")
            if result['issues_found'] > 0:
                print(f"⚠️ Found {result['issues_found']} patients with screen-ID tracking issues")
                sys.exit(1)  # Exit with error code if issues found
            else:
                print("🎉 All patients have proper screen-ID tracking!")
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)