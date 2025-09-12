#!/usr/bin/env python3
import requests
import json

def test_school_screening():
    try:
        # Get auth token
        auth_url = 'https://stardust.evep.my-firstcare.com/api/v1/auth/login'
        auth_data = {'email': 'admin@evep.com', 'password': 'admin123'}
        
        print("Getting auth token...")
        auth_response = requests.post(auth_url, json=auth_data)
        print(f"Auth response status: {auth_response.status_code}")
        
        if auth_response.status_code != 200:
            print(f"Auth failed: {auth_response.text}")
            return
        
        token = auth_response.json().get('access_token')
        print(f"Token obtained: {token[:20]}...")

        # Test school screening creation
        screening_url = 'https://stardust.evep.my-firstcare.com/api/v1/evep/school-screenings'
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        screening_data = {
            'student_id': '68be9b7219d48ff5ee0bed2e',
            'teacher_id': '68bfc3c537fc1d904d08069e',
            'school_name': 'โรงเรียนอนุบาลกรุงเทพ',
            'screening_type': 'basic_school',
            'screening_date': '2025-09-10T10:56:55.682Z',
            'notes': 'Test screening after fix'
        }

        print('\nTesting school screening creation...')
        print(f'Student ID: {screening_data["student_id"]}')
        print(f'Teacher ID: {screening_data["teacher_id"]}')

        response = requests.post(screening_url, json=screening_data, headers=headers)
        print(f'Response status: {response.status_code}')
        print(f'Response text: {response.text}')
        
        if response.status_code == 200:
            print("✅ School screening created successfully!")
        else:
            print("❌ School screening creation failed")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_school_screening()
