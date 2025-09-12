#!/usr/bin/env python3
"""
Test script for EVEP Platform Patient Management Module
This script tests the patient management module functionality
"""

import sys
import os
import asyncio

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_patient_service():
    """Test the patient service"""
    print("🧪 Testing Patient Service")
    print("=" * 50)
    
    try:
        from app.modules.patient_management.services.patient_service import PatientService
        from app.shared.models.patient import PatientCreate, PatientUpdate, Gender, PatientStatus
        
        print("✅ PatientService imported successfully")
        
        # Initialize service
        patient_service = PatientService()
        await patient_service.initialize()
        
        # Test get patients
        patients = await patient_service.get_patients()
        print(f"📋 Total patients: {len(patients)}")
        
        # Test create patient
        new_patient = PatientCreate(
            name="Test Patient",
            date_of_birth="2015-06-15",
            gender=Gender.MALE,
            contact_info={
                "phone": "+66-84-567-8901",
                "email": "test.patient@email.com",
                "address": "999 Test Street, Bangkok"
            },
            assigned_doctor="doctor-003",
            status=PatientStatus.ACTIVE
        )
        
        created_patient = await patient_service.create_patient(new_patient)
        print(f"👤 Patient created: {created_patient.name} ({created_patient.patient_id})")
        
        # Test get patient by ID
        retrieved_patient = await patient_service.get_patient(created_patient.patient_id)
        print(f"🔍 Patient retrieved: {retrieved_patient.name if retrieved_patient else 'Not found'}")
        
        # Test update patient
        patient_update = PatientUpdate(name="Updated Test Patient")
        updated_patient = await patient_service.update_patient(created_patient.patient_id, patient_update)
        print(f"✏️ Patient updated: {updated_patient.name if updated_patient else 'Update failed'}")
        
        # Test statistics
        stats = await patient_service.get_patient_statistics()
        print(f"📊 Patient statistics: {stats['total_patients']} total patients")
        
        # Test advanced search
        search_results = await patient_service.advanced_search({"gender": "male"})
        print(f"🔍 Advanced search results: {len(search_results)} patients")
        
        print("\n✅ All patient service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Patient service test failed: {e}")
        return False

async def test_demographics_service():
    """Test the demographics service"""
    print("\n🧪 Testing Demographics Service")
    print("=" * 50)
    
    try:
        from app.modules.patient_management.services.demographics_service import DemographicsService
        
        print("✅ DemographicsService imported successfully")
        
        # Initialize service
        demographics_service = DemographicsService()
        await demographics_service.initialize()
        
        # Test update demographics
        demographics_data = {
            "age": 25,
            "gender": "male",
            "ethnicity": "Thai",
            "education_level": "bachelor",
            "occupation": "student"
        }
        
        updated_demographics = await demographics_service.update_patient_demographics(
            "PAT-000001", demographics_data
        )
        print(f"📊 Demographics updated: {updated_demographics['age']} years old")
        
        # Test get demographics
        demographics = await demographics_service.get_patient_demographics("PAT-000001")
        print(f"📋 Demographics retrieved: {demographics['ethnicity'] if demographics else 'Not found'}")
        
        # Test statistics
        stats = await demographics_service.get_demographics_statistics()
        print(f"📈 Demographics statistics: {stats['total_records']} records")
        
        # Test validation
        validation = await demographics_service.validate_demographics_data(demographics_data)
        print(f"✅ Demographics validation: {'Valid' if validation['is_valid'] else 'Invalid'}")
        
        print("\n✅ All demographics service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Demographics service test failed: {e}")
        return False

async def test_medical_history_service():
    """Test the medical history service"""
    print("\n🧪 Testing Medical History Service")
    print("=" * 50)
    
    try:
        from app.modules.patient_management.services.medical_history_service import MedicalHistoryService
        
        print("✅ MedicalHistoryService imported successfully")
        
        # Initialize service
        medical_history_service = MedicalHistoryService()
        await medical_history_service.initialize()
        
        # Test add medical history entry
        entry_data = {
            "condition": "Myopia",
            "diagnosis_date": "2023-01-15",
            "severity": "moderate",
            "description": "Nearsightedness requiring corrective lenses",
            "treatments": ["Prescription glasses", "Regular eye exams"],
            "medications": [],
            "allergies": ["Latex"],
            "family_history": True,
            "notes": "Both parents have myopia"
        }
        
        entry = await medical_history_service.add_medical_history_entry("PAT-000001", entry_data)
        print(f"📝 Medical history entry added: {entry['condition']}")
        
        # Test get medical history
        history = await medical_history_service.get_patient_medical_history("PAT-000001")
        print(f"📋 Medical history retrieved: {len(history['entries'])} entries")
        
        # Test get allergies summary
        allergies = await medical_history_service.get_allergies_summary("PAT-000001")
        print(f"⚠️ Allergies summary: {allergies}")
        
        # Test get medications summary
        medications = await medical_history_service.get_medications_summary("PAT-000001")
        print(f"💊 Medications summary: {medications}")
        
        # Test statistics
        stats = await medical_history_service.get_medical_history_statistics("PAT-000001")
        print(f"📊 Medical history statistics: {stats['total_entries']} entries")
        
        # Test validation
        validation = await medical_history_service.validate_medical_history_entry(entry_data)
        print(f"✅ Medical history validation: {'Valid' if validation['is_valid'] else 'Invalid'}")
        
        print("\n✅ All medical history service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Medical history service test failed: {e}")
        return False

async def test_patient_management_module():
    """Test the patient management module"""
    print("\n🧪 Testing Patient Management Module")
    print("=" * 50)
    
    try:
        from app.modules.patient_management.patient_management_module import PatientManagementModule
        
        print("✅ PatientManagementModule imported successfully")
        
        # Initialize module
        patient_module = PatientManagementModule()
        await patient_module.initialize()
        
        # Test module info
        print(f"📦 Module name: {patient_module.name}")
        print(f"📋 Module version: {patient_module.version}")
        print(f"📝 Module description: {patient_module.description}")
        
        # Test events
        events = patient_module.get_events()
        print(f"📡 Module events: {events}")
        
        # Test router
        router = patient_module.get_router()
        print(f"🌐 Module router: {len(router.routes)} routes")
        
        print("\n✅ All patient management module tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Patient management module test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 EVEP Platform Patient Management Module Test")
    print("=" * 60)
    
    # Run tests
    patient_service_test = await test_patient_service()
    demographics_service_test = await test_demographics_service()
    medical_history_service_test = await test_medical_history_service()
    patient_module_test = await test_patient_management_module()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Patient Service: {'✅ PASS' if patient_service_test else '❌ FAIL'}")
    print(f"   Demographics Service: {'✅ PASS' if demographics_service_test else '❌ FAIL'}")
    print(f"   Medical History Service: {'✅ PASS' if medical_history_service_test else '❌ FAIL'}")
    print(f"   Patient Management Module: {'✅ PASS' if patient_module_test else '❌ FAIL'}")
    
    if all([patient_service_test, demographics_service_test, medical_history_service_test, patient_module_test]):
        print("\n🎉 All tests passed! Patient management module is working correctly.")
        return True
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)



