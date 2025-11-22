#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# API Configuration
BASE_URL = 'http://localhost:8014'
LOGIN_URL = f'{BASE_URL}/api/v1/auth/login'
PATIENTS_URL = f'{BASE_URL}/api/v1/patients/'
SCREENINGS_URL = f'{BASE_URL}/api/v1/screenings/sessions'

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

def get_all_screenings():
    """Get all screenings directly from the screenings API"""
    token = get_auth_token()
    if not token:
        return None
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Get all screenings
        response = requests.get(SCREENINGS_URL, headers=headers, params={'limit': 100})
        if response.status_code == 200:
            return response.json()
        else:
            print(f'Failed to get screenings: {response.status_code}')
            print(f'Response: {response.text}')
            return None
        
    except Exception as e:
        print(f'Error getting screenings: {e}')
        return None

def get_all_patients():
    """Get all patients"""
    token = get_auth_token()
    if not token:
        return None
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(PATIENTS_URL, headers=headers, params={'limit': 100})
        if response.status_code == 200:
            return response.json()
        else:
            print(f'Failed to get patients: {response.status_code}')
            return None
        
    except Exception as e:
        print(f'Error getting patients: {e}')
        return None

def analyze_screen_id_comprehensive():
    """Comprehensive analysis of screen-ID tracking"""
    print('=== COMPREHENSIVE SCREEN-ID TRACKING ANALYSIS ===')
    print(f'Analysis started at: {datetime.now()}')
    print()
    
    # Get patients
    patients = get_all_patients()
    if patients is None:
        print('Failed to retrieve patient data')
        return
    
    # Get screenings
    screenings = get_all_screenings()
    if screenings is None:
        print('Failed to retrieve screening data')
        return
    
    print(f'Total patients found: {len(patients)}')
    print(f'Total screenings found: {len(screenings)}')
    print()
    
    # Analyze patients with embedded screenings
    patients_with_multiple_screenings = []
    screen_id_issues = []
    
    for patient in patients:
        embedded_screenings = patient.get('screenings', [])
        if len(embedded_screenings) > 1:
            patients_with_multiple_screenings.append({
                'patient_id': patient.get('_id'),
                'name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                'screening_count': len(embedded_screenings),
                'screenings': embedded_screenings
            })
            
            # Check screen-ID consistency in embedded screenings
            screen_ids = []
            for screening in embedded_screenings:
                screen_id = screening.get('screen_id') or screening.get('screening_id') or screening.get('id')
                if screen_id:
                    screen_ids.append(screen_id)
            
            if len(screen_ids) != len(embedded_screenings):
                screen_id_issues.append({
                    'type': 'missing_screen_ids_embedded',
                    'patient_id': patient.get('_id'),
                    'name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
                    'total_screenings': len(embedded_screenings),
                    'screenings_with_screen_id': len(screen_ids)
                })
    
    # Analyze standalone screenings collection
    standalone_screenings_by_patient = {}
    screen_ids_found = []
    
    for screening in screenings:
        patient_id = screening.get('patient_id') or screening.get('cid')
        screen_id = screening.get('screen_id') or screening.get('screening_id') or screening.get('id')
        
        if screen_id:
            screen_ids_found.append(screen_id)
        
        if patient_id:
            if patient_id not in standalone_screenings_by_patient:
                standalone_screenings_by_patient[patient_id] = []
            standalone_screenings_by_patient[patient_id].append(screening)
    
    # Find patients with multiple standalone screenings
    patients_with_multiple_standalone = []
    for patient_id, patient_screenings in standalone_screenings_by_patient.items():
        if len(patient_screenings) > 1:
            patients_with_multiple_standalone.append({
                'patient_id': patient_id,
                'screening_count': len(patient_screenings),
                'screenings': patient_screenings
            })
            
            # Check screen-ID consistency
            screen_ids = []
            for screening in patient_screenings:
                screen_id = screening.get('screen_id') or screening.get('screening_id') or screening.get('id')
                if screen_id:
                    screen_ids.append(screen_id)
            
            if len(screen_ids) != len(patient_screenings):
                screen_id_issues.append({
                    'type': 'missing_screen_ids_standalone',
                    'patient_id': patient_id,
                    'total_screenings': len(patient_screenings),
                    'screenings_with_screen_id': len(screen_ids)
                })
    
    # Check for duplicate screen-IDs
    duplicate_screen_ids = []
    screen_id_counts = {}
    for screen_id in screen_ids_found:
        if screen_id in screen_id_counts:
            screen_id_counts[screen_id] += 1
        else:
            screen_id_counts[screen_id] = 1
    
    for screen_id, count in screen_id_counts.items():
        if count > 1:
            duplicate_screen_ids.append({'screen_id': screen_id, 'count': count})
    
    # Report findings
    print('=== FINDINGS ===')
    
    print(f'Patients with multiple embedded screenings: {len(patients_with_multiple_screenings)}')
    print(f'Patients with multiple standalone screenings: {len(patients_with_multiple_standalone)}')
    print(f'Total unique screen-IDs found: {len(set(screen_ids_found))}')
    print(f'Screen-ID issues detected: {len(screen_id_issues)}')
    print(f'Duplicate screen-IDs found: {len(duplicate_screen_ids)}')
    print()
    
    # Detailed reporting
    if patients_with_multiple_screenings:
        print('=== PATIENTS WITH MULTIPLE EMBEDDED SCREENINGS ===')
        for patient in patients_with_multiple_screenings:
            print(f'Patient: {patient["name"]} (ID: {patient["patient_id"]})')
            print(f'  Total screenings: {patient["screening_count"]}')
            for i, screening in enumerate(patient['screenings'], 1):
                screen_id = screening.get('screen_id') or screening.get('screening_id') or screening.get('id')
                created_at = screening.get('created_at', 'N/A')
                print(f'    {i}. Screen-ID: {screen_id or "MISSING"} | Created: {created_at}')
            print()
    
    if patients_with_multiple_standalone:
        print('=== PATIENTS WITH MULTIPLE STANDALONE SCREENINGS ===')
        for patient in patients_with_multiple_standalone:
            print(f'Patient ID: {patient["patient_id"]}')
            print(f'  Total screenings: {patient["screening_count"]}')
            for i, screening in enumerate(patient['screenings'], 1):
                screen_id = screening.get('screen_id') or screening.get('screening_id') or screening.get('id')
                created_at = screening.get('created_at', 'N/A')
                status = screening.get('status', 'N/A')
                print(f'    {i}. Screen-ID: {screen_id or "MISSING"} | Created: {created_at} | Status: {status}')
            print()
    
    if screen_id_issues:
        print('=== SCREEN-ID TRACKING ISSUES ===')
        for issue in screen_id_issues:
            print(f'Issue Type: {issue["type"]}')
            print(f'Patient ID: {issue["patient_id"]}')
            if 'name' in issue:
                print(f'Patient Name: {issue["name"]}')
            print(f'Total screenings: {issue["total_screenings"]}')
            print(f'Screenings with screen-ID: {issue["screenings_with_screen_id"]}')
            print(f'Missing screen-IDs: {issue["total_screenings"] - issue["screenings_with_screen_id"]}')
            print()
    
    if duplicate_screen_ids:
        print('=== DUPLICATE SCREEN-IDs ===')
        for dup in duplicate_screen_ids:
            print(f'Screen-ID: {dup["screen_id"]} appears {dup["count"]} times')
        print()
    
    if not screen_id_issues and not duplicate_screen_ids and not patients_with_multiple_screenings and not patients_with_multiple_standalone:
        print('✅ No screen-ID tracking issues found!')
    
    print('=== ANALYSIS COMPLETE ===')

if __name__ == '__main__':
    analyze_screen_id_comprehensive()