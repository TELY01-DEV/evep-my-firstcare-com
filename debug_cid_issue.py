#!/usr/bin/env python3
"""
Debug script to check CID data in Hospital Mobile Unit
"""
import requests
import json

def test_evep_api():
    """Test the EVEP students API endpoint to see what CID data is returned"""
    
    # The API base URL (adjust if different)
    API_BASE_URL = "https://stardust.evep.my-firstcare.com/api/v1"
    
    print("🔍 Testing EVEP Students API for CID data...")
    print(f"API URL: {API_BASE_URL}/evep/students")
    
    try:
        # Test without authentication first to see if we get any data
        response = requests.get(f"{API_BASE_URL}/evep/students?limit=5")
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            students = data.get('students', [])
            
            print(f"Found {len(students)} students")
            
            for i, student in enumerate(students):
                print(f"\n--- Student {i+1} ---")
                print(f"ID: {student.get('id', 'N/A')}")
                print(f"Name: {student.get('first_name', 'N/A')} {student.get('last_name', 'N/A')}")
                print(f"CID: {student.get('cid', 'NOT FOUND')}")
                print(f"Citizen ID: {student.get('citizen_id', 'NOT FOUND')}")
                print(f"Student Code: {student.get('student_code', 'N/A')}")
                print(f"School: {student.get('school_name', 'N/A')}")
                print(f"Grade: {student.get('grade_level', 'N/A')}")
                
                # Print all keys to see what fields are available
                print(f"Available fields: {list(student.keys())}")
                
        elif response.status_code == 401:
            print("❌ Authentication required. Testing with sample data structure...")
            test_sample_data()
            
        elif response.status_code == 403:
            print("❌ Access denied. Testing with sample data structure...")
            test_sample_data()
            
        else:
            print(f"❌ Unexpected response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Testing with sample data structure...")
        test_sample_data()

def test_sample_data():
    """Test with sample student data structure"""
    
    print("\n🧪 Testing Sample Student Data Structure...")
    
    # This is what a typical EVEP student record should look like
    sample_student = {
        "id": "67123456789abcdef0123456",
        "first_name": "นักเรียน",
        "last_name": "ตัวอย่าง",
        "cid": "1234567890123",  # This is the key field we're looking for
        "student_code": "STU001",
        "grade_level": "ป.5",
        "grade_number": "5",
        "school_name": "โรงเรียนตัวอย่าง",
        "birth_date": "2010-05-15",
        "gender": "ชาย",
        "parent_id": "67123456789abcdef0123457",
        "teacher_id": "67123456789abcdef0123458",
        "consent_document": False,
        "status": "active"
    }
    
    print("Sample Student Data:")
    print(json.dumps(sample_student, indent=2, ensure_ascii=False))
    
    # Test the frontend data transformation logic
    print("\n🔄 Testing Frontend Data Transformation...")
    
    # This simulates the transformation in MobileVisionScreeningForm.tsx
    transformed_student = {
        "_id": sample_student.get("id"),
        "original_student_id": sample_student.get("id"),
        "first_name": sample_student.get("first_name", ""),
        "last_name": sample_student.get("last_name", ""),
        "date_of_birth": sample_student.get("birth_date", ""),
        "school": sample_student.get("school_name", ""),
        "grade": sample_student.get("grade_level", ""),
        "student_id": sample_student.get("student_code", ""),
        "citizen_id": sample_student.get("cid", ""),  # OLD: mapped to citizen_id
        "cid": sample_student.get("cid", ""),  # NEW: also mapped to cid field
        "parent_consent": sample_student.get("consent_document", False),
        "registration_status": sample_student.get("status", "pending"),
        "screening_status": "pending",
        "follow_up_needed": False,
        "registration_date": "",
        "parent_phone": "",
        "parent_email": "",
        "gender": sample_student.get("gender", "")
    }
    
    print("Transformed Student Data (for frontend):")
    print(json.dumps(transformed_student, indent=2, ensure_ascii=False))
    
    # Test the CID display logic
    print("\n📱 Testing CID Display Logic...")
    
    cid_value = transformed_student.get("cid", "")
    citizen_id_value = transformed_student.get("citizen_id", "")
    fallback_cid = cid_value or citizen_id_value or ""
    
    print(f"CID field: '{cid_value}'")
    print(f"Citizen ID field: '{citizen_id_value}'")
    print(f"Fallback CID: '{fallback_cid}'")
    
    if fallback_cid:
        print("✅ CID data should be displayed correctly")
    else:
        print("❌ CID data is missing!")
    
    return transformed_student

def test_patient_registration_data():
    """Test what data is sent during patient registration"""
    
    print("\n📝 Testing Patient Registration Data...")
    
    # Sample student data (what we get from selection)
    selected_student = test_sample_data()
    
    # This simulates the registration data creation in registerStudentAsPatient()
    registration_data = {
        "first_name": selected_student.get("first_name", ""),
        "last_name": selected_student.get("last_name", ""),
        "cid": selected_student.get("cid", "") or selected_student.get("citizen_id", ""),
        "date_of_birth": selected_student.get("date_of_birth", ""),
        "gender": selected_student.get("gender", "male"),
        "parent_email": selected_student.get("parent_email", "noemail@example.com"),
        "parent_phone": selected_student.get("parent_phone", "0000000000"),
        "emergency_contact": selected_student.get("parent_name", "ไม่ระบุ"),
        "emergency_phone": selected_student.get("parent_phone", "0000000000"),
        "address": "",
        "school": selected_student.get("school", ""),
        "grade": selected_student.get("grade", ""),
        "medical_history": {},
        "family_vision_history": {},
        "insurance_info": {},
        "consent_forms": {},
        "registration_type": "from_student",
        "source_student_id": selected_student.get("original_student_id")
    }
    
    print("Patient Registration Data:")
    print(json.dumps(registration_data, indent=2, ensure_ascii=False))
    
    cid_in_registration = registration_data.get("cid", "")
    if cid_in_registration:
        print(f"✅ CID will be sent to backend: '{cid_in_registration}'")
    else:
        print("❌ CID is missing in registration data!")

if __name__ == "__main__":
    print("🏥 Hospital Mobile Unit - CID Data Debug")
    print("=" * 50)
    
    # Test the API
    test_evep_api()
    
    # Test patient registration
    test_patient_registration_data()
    
    print("\n" + "=" * 50)
    print("🔍 DIAGNOSIS:")
    print("If CID is not displaying in the Parent Consent step:")
    print("1. Check if EVEP students API returns 'cid' field")
    print("2. Verify data transformation maps 'cid' field correctly")
    print("3. Ensure Patient Information form displays selectedPatient.cid")
    print("4. Check if backend EVEP API includes CID in student records")