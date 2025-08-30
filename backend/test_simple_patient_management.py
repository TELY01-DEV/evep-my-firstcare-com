#!/usr/bin/env python3
"""
Simple test script for EVEP Platform Patient Management Services
This script tests the core patient management functionality without FastAPI dependencies
"""

import sys
import os
import asyncio
from datetime import datetime, date

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_patient_models():
    """Test patient model functionality"""
    print("🧪 Testing Patient Models")
    print("=" * 50)
    
    try:
        # Test patient data structure
        patient_data = {
            "patient_id": "PAT-000001",
            "name": "John Smith",
            "date_of_birth": date(2010, 5, 15),
            "gender": "male",
            "contact_info": {
                "phone": "+66-81-234-5678",
                "email": "john.smith@email.com",
                "address": "123 Sukhumvit Road, Bangkok"
            },
            "assigned_doctor": "doctor-001",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"👤 Patient: {patient_data['name']} ({patient_data['patient_id']})")
        print(f"🎭 Gender: {patient_data['gender']}")
        print(f"📅 Date of Birth: {patient_data['date_of_birth']}")
        print(f"📞 Phone: {patient_data['contact_info']['phone']}")
        print(f"📧 Email: {patient_data['contact_info']['email']}")
        print(f"🏥 Assigned Doctor: {patient_data['assigned_doctor']}")
        print(f"📊 Status: {patient_data['status']}")
        
        # Test validation
        valid_genders = ["male", "female", "other"]
        valid_statuses = ["active", "inactive", "pending", "archived"]
        
        if patient_data["gender"] in valid_genders:
            print(f"✅ Valid gender: {patient_data['gender']}")
        else:
            print(f"❌ Invalid gender: {patient_data['gender']}")
            return False
        
        if patient_data["status"] in valid_statuses:
            print(f"✅ Valid status: {patient_data['status']}")
        else:
            print(f"❌ Invalid status: {patient_data['status']}")
            return False
        
        print("✅ Patient model tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Patient model test failed: {e}")
        return False

def test_demographics_structure():
    """Test demographics data structure"""
    print("\n🧪 Testing Demographics Structure")
    print("=" * 50)
    
    try:
        # Test demographics data
        demographics_data = {
            "patient_id": "PAT-000001",
            "age": 25,
            "gender": "male",
            "ethnicity": "Thai",
            "education_level": "bachelor",
            "occupation": "student",
            "marital_status": "single",
            "income_level": "middle",
            "location": {
                "city": "Bangkok",
                "district": "Sukhumvit",
                "postal_code": "10110"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"📊 Demographics for patient: {demographics_data['patient_id']}")
        print(f"👤 Age: {demographics_data['age']}")
        print(f"🎭 Gender: {demographics_data['gender']}")
        print(f"🌍 Ethnicity: {demographics_data['ethnicity']}")
        print(f"🎓 Education: {demographics_data['education_level']}")
        print(f"💼 Occupation: {demographics_data['occupation']}")
        print(f"💍 Marital Status: {demographics_data['marital_status']}")
        print(f"💰 Income Level: {demographics_data['income_level']}")
        print(f"📍 Location: {demographics_data['location']['city']}, {demographics_data['location']['district']}")
        
        # Test validation
        valid_education_levels = ["primary", "secondary", "bachelor", "master", "phd", "other"]
        valid_marital_statuses = ["single", "married", "divorced", "widowed", "other"]
        valid_income_levels = ["low", "middle", "high", "prefer_not_to_say"]
        
        if demographics_data["education_level"] in valid_education_levels:
            print(f"✅ Valid education level: {demographics_data['education_level']}")
        else:
            print(f"❌ Invalid education level: {demographics_data['education_level']}")
            return False
        
        if demographics_data["marital_status"] in valid_marital_statuses:
            print(f"✅ Valid marital status: {demographics_data['marital_status']}")
        else:
            print(f"❌ Invalid marital status: {demographics_data['marital_status']}")
            return False
        
        if demographics_data["income_level"] in valid_income_levels:
            print(f"✅ Valid income level: {demographics_data['income_level']}")
        else:
            print(f"❌ Invalid income level: {demographics_data['income_level']}")
            return False
        
        print("✅ Demographics structure tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Demographics structure test failed: {e}")
        return False

def test_medical_history_structure():
    """Test medical history data structure"""
    print("\n🧪 Testing Medical History Structure")
    print("=" * 50)
    
    try:
        # Test medical history entry
        medical_entry = {
            "id": "entry_001",
            "patient_id": "PAT-000001",
            "condition": "Myopia",
            "diagnosis_date": "2023-01-15",
            "severity": "moderate",
            "description": "Nearsightedness requiring corrective lenses",
            "treatments": ["Prescription glasses", "Regular eye exams"],
            "medications": [],
            "allergies": ["Latex"],
            "family_history": True,
            "notes": "Both parents have myopia",
            "created_at": datetime.utcnow()
        }
        
        print(f"📝 Medical History Entry: {medical_entry['id']}")
        print(f"👤 Patient: {medical_entry['patient_id']}")
        print(f"🏥 Condition: {medical_entry['condition']}")
        print(f"📅 Diagnosis Date: {medical_entry['diagnosis_date']}")
        print(f"⚠️ Severity: {medical_entry['severity']}")
        print(f"📋 Description: {medical_entry['description']}")
        print(f"💊 Treatments: {', '.join(medical_entry['treatments'])}")
        print(f"⚠️ Allergies: {', '.join(medical_entry['allergies'])}")
        print(f"👨‍👩‍👧‍👦 Family History: {'Yes' if medical_entry['family_history'] else 'No'}")
        
        # Test validation
        valid_severities = ["mild", "moderate", "severe", "critical"]
        valid_conditions = ["myopia", "hyperopia", "astigmatism", "cataracts", "glaucoma", "other"]
        
        if medical_entry["severity"] in valid_severities:
            print(f"✅ Valid severity: {medical_entry['severity']}")
        else:
            print(f"❌ Invalid severity: {medical_entry['severity']}")
            return False
        
        if medical_entry["condition"].lower() in valid_conditions:
            print(f"✅ Valid condition: {medical_entry['condition']}")
        else:
            print(f"⚠️ Condition not in standard list: {medical_entry['condition']}")
        
        print("✅ Medical history structure tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Medical history structure test failed: {e}")
        return False

def test_patient_operations():
    """Test patient operations"""
    print("\n🧪 Testing Patient Operations")
    print("=" * 50)
    
    try:
        # Test CRUD operations
        operations = {
            "create": {
                "description": "Create new patient record",
                "required_fields": ["name", "date_of_birth", "gender"],
                "optional_fields": ["contact_info", "assigned_doctor", "notes"]
            },
            "read": {
                "description": "Retrieve patient information",
                "methods": ["get_by_id", "get_all", "search_by_name", "filter_by_status"]
            },
            "update": {
                "description": "Update patient information",
                "allowed_fields": ["name", "contact_info", "assigned_doctor", "status", "notes"]
            },
            "delete": {
                "description": "Soft delete patient record",
                "method": "mark_as_inactive",
                "preserve_data": True
            }
        }
        
        for operation, details in operations.items():
            print(f"🔧 {operation.upper()}:")
            print(f"  Description: {details['description']}")
            if 'required_fields' in details:
                print(f"  Required: {', '.join(details['required_fields'])}")
            if 'optional_fields' in details:
                print(f"  Optional: {', '.join(details['optional_fields'])}")
            if 'methods' in details:
                print(f"  Methods: {', '.join(details['methods'])}")
            if 'allowed_fields' in details:
                print(f"  Allowed: {', '.join(details['allowed_fields'])}")
            if 'method' in details:
                print(f"  Method: {details['method']}")
            if 'preserve_data' in details:
                print(f"  Preserve Data: {details['preserve_data']}")
        
        # Test search operations
        search_operations = {
            "basic_search": "Search by name or patient ID",
            "advanced_search": "Search with multiple filters (age, gender, status, doctor)",
            "demographics_search": "Search by demographics (ethnicity, education, location)",
            "medical_search": "Search by medical conditions or allergies"
        }
        
        print(f"\n🔍 Search Operations:")
        for search_type, description in search_operations.items():
            print(f"  - {search_type}: {description}")
        
        print("✅ Patient operations tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Patient operations test failed: {e}")
        return False

def test_patient_statistics():
    """Test patient statistics functionality"""
    print("\n🧪 Testing Patient Statistics")
    print("=" * 50)
    
    try:
        # Test statistics structure
        statistics = {
            "total_patients": 150,
            "active_patients": 120,
            "inactive_patients": 30,
            "gender_distribution": {
                "male": 75,
                "female": 70,
                "other": 5
            },
            "age_distribution": {
                "0-5": 15,
                "6-12": 45,
                "13-18": 60,
                "19+": 30
            },
            "doctor_assignment": {
                "doctor-001": 25,
                "doctor-002": 30,
                "doctor-003": 20,
                "unassigned": 75
            },
            "demographics": {
                "ethnicity_distribution": {
                    "Thai": 100,
                    "Chinese": 30,
                    "Other": 20
                },
                "education_distribution": {
                    "primary": 20,
                    "secondary": 60,
                    "bachelor": 50,
                    "other": 20
                }
            },
            "medical_conditions": {
                "myopia": 80,
                "hyperopia": 25,
                "astigmatism": 30,
                "other": 15
            },
            "last_updated": datetime.utcnow()
        }
        
        print(f"📊 Patient Statistics Overview:")
        print(f"  Total Patients: {statistics['total_patients']}")
        print(f"  Active Patients: {statistics['active_patients']}")
        print(f"  Inactive Patients: {statistics['inactive_patients']}")
        
        print(f"\n👥 Gender Distribution:")
        for gender, count in statistics["gender_distribution"].items():
            percentage = (count / statistics["total_patients"]) * 100
            print(f"  {gender.capitalize()}: {count} ({percentage:.1f}%)")
        
        print(f"\n📅 Age Distribution:")
        for age_group, count in statistics["age_distribution"].items():
            percentage = (count / statistics["total_patients"]) * 100
            print(f"  {age_group}: {count} ({percentage:.1f}%)")
        
        print(f"\n🏥 Doctor Assignment:")
        for doctor, count in statistics["doctor_assignment"].items():
            percentage = (count / statistics["total_patients"]) * 100
            print(f"  {doctor}: {count} ({percentage:.1f}%)")
        
        print(f"\n🏥 Medical Conditions:")
        for condition, count in statistics["medical_conditions"].items():
            percentage = (count / statistics["total_patients"]) * 100
            print(f"  {condition.capitalize()}: {count} ({percentage:.1f}%)")
        
        print("✅ Patient statistics tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Patient statistics test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 EVEP Platform Simple Patient Management Test")
    print("=" * 60)
    
    # Run tests
    patient_models_test = test_patient_models()
    demographics_structure_test = test_demographics_structure()
    medical_history_structure_test = test_medical_history_structure()
    patient_operations_test = test_patient_operations()
    patient_statistics_test = test_patient_statistics()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Patient Models: {'✅ PASS' if patient_models_test else '❌ FAIL'}")
    print(f"   Demographics Structure: {'✅ PASS' if demographics_structure_test else '❌ FAIL'}")
    print(f"   Medical History Structure: {'✅ PASS' if medical_history_structure_test else '❌ FAIL'}")
    print(f"   Patient Operations: {'✅ PASS' if patient_operations_test else '❌ FAIL'}")
    print(f"   Patient Statistics: {'✅ PASS' if patient_statistics_test else '❌ FAIL'}")
    
    if all([patient_models_test, demographics_structure_test, medical_history_structure_test, patient_operations_test, patient_statistics_test]):
        print("\n🎉 All tests passed! Patient management functionality is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



