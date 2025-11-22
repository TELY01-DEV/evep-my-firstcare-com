#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# API Configuration
BASE_URL = 'http://localhost:8014'
LOGIN_URL = f'{BASE_URL}/api/v1/auth/login'
PATIENTS_URL = f'{BASE_URL}/api/v1/patients/'

# Admin credentials for API access
ADMIN_CREDENTIALS = {
    'email': 'admin@evep.com', 
    'password': 'admin123'
}

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(LOGIN_URL, json=ADMIN_CREDENTIALS)
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f'Failed to authenticate: {response.status_code}')
            return None
    except Exception as e:
        print(f'Authentication error: {e}')
        return None

def get_patients_with_screenings():
    """Get all patients and their screening data"""
    token = get_auth_token()
    if not token:
        return None
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Get all patients
        response = requests.get(PATIENTS_URL, headers=headers)
        if response.status_code != 200:
            print(f'Failed to get patients: {response.status_code}')
            return None
        
        patients = response.json()
        print(f'Total patients found: {len(patients)}')
        
        # Filter patients with multiple screenings and check screen-ID tracking
        patients_with_multiple_screenings = []
        patients_with_screen_id_issues = []
        
        for patient in patients:
            screenings = patient.get('screenings', [])
            if len(screenings) > 1:
                patients_with_multiple_screenings.append({
                    'patient_id': patient.get('_id'),
                    'first_name': patient.get('first_name', 'N/A'),
                    'last_name': patient.get('last_name', 'N/A'), 
                    'date_of_birth': patient.get('date_of_birth', 'N/A'),
                    'screening_count': len(screenings),
                    'screenings': screenings
                })
                
                # Check screen-ID tracking consistency
                screen_ids = []
                for screening in screenings:
                    screen_id = screening.get('screen_id') or screening.get('screening_id')
                    if screen_id:
                        screen_ids.append(screen_id)
                
                # Check for issues
                if len(screen_ids) != len(screenings):
                    patients_with_screen_id_issues.append({
                        'patient_id': patient.get('_id'),
                        'name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                        'total_screenings': len(screenings),
                        'screenings_with_screen_id': len(screen_ids),
                        'missing_screen_ids': len(screenings) - len(screen_ids)
                    })
                
                # Check for duplicate screen IDs
                if len(screen_ids) != len(set(screen_ids)):
                    patients_with_screen_id_issues.append({
                        'patient_id': patient.get('_id'),
                        'name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                        'issue': 'duplicate_screen_ids',
                        'screen_ids': screen_ids
                    })
        
        return {
            'total_patients': len(patients),
            'patients_with_multiple_screenings': patients_with_multiple_screenings,
            'patients_with_screen_id_issues': patients_with_screen_id_issues
        }
        
    except Exception as e:
        print(f'Error getting patients: {e}')
        return None

def analyze_screen_id_tracking():
    """Main analysis function"""
    print('=== EVEP Screen-ID Tracking Analysis ===')
    print(f'Analysis started at: {datetime.now()}')
    print()
    
    data = get_patients_with_screenings()
    if not data:
        print('Failed to retrieve patient data')
        return
    
    print(f'Total patients in system: {data["total_patients"]}')
    print(f'Patients with multiple screenings: {len(data["patients_with_multiple_screenings"])}')
    print(f'Patients with screen-ID issues: {len(data["patients_with_screen_id_issues"])}')
    print()
    
    # Detailed analysis of patients with multiple screenings
    if data['patients_with_multiple_screenings']:
        print('=== PATIENTS WITH MULTIPLE SCREENINGS ===')
        for patient in data['patients_with_multiple_screenings']:
            print(f'Patient: {patient["first_name"]} {patient["last_name"]}')
            print(f'  ID: {patient["patient_id"]}')
            print(f'  DOB: {patient["date_of_birth"]}')
            print(f'  Total screenings: {patient["screening_count"]}')
            
            print('  Screening details:')
            for i, screening in enumerate(patient['screenings'], 1):
                screen_id = screening.get('screen_id') or screening.get('screening_id')
                created_at = screening.get('created_at', 'N/A')
                status = screening.get('status', 'N/A')
                print(f'    {i}. Screen-ID: {screen_id or "MISSING"} | Created: {created_at} | Status: {status}')
            print()
    
    # Screen-ID issues analysis
    if data['patients_with_screen_id_issues']:
        print('=== SCREEN-ID TRACKING ISSUES ===')
        for issue in data['patients_with_screen_id_issues']:
            print(f'Patient: {issue["name"]} (ID: {issue["patient_id"]})')
            if 'missing_screen_ids' in issue:
                print(f'  Issue: Missing screen-IDs')
                print(f'  Total screenings: {issue["total_screenings"]}')
                print(f'  Screenings with screen-ID: {issue["screenings_with_screen_id"]}')
                print(f'  Missing screen-IDs: {issue["missing_screen_ids"]}')
            elif issue.get('issue') == 'duplicate_screen_ids':
                print(f'  Issue: Duplicate screen-IDs')
                print(f'  Screen-IDs: {issue["screen_ids"]}')
            print()
    else:
        print('✅ No screen-ID tracking issues found!')
    
    print('=== ANALYSIS COMPLETE ===')

if __name__ == '__main__':
    analyze_screen_id_tracking()