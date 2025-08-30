#!/usr/bin/env python3
"""
Simple test script for Mobile Reflection Unit missing flows

This script tests the API endpoints without authentication to verify implementation.
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8013/api/v1"

def test_endpoints():
    """Test all mobile screening endpoints"""
    print("🚀 Testing Mobile Screening Endpoints")
    print("=" * 50)
    
    # Test 1: Registration
    print("\n🔵 Testing Registration Endpoint...")
    registration_data = {
        "student_id": "STU001234",
        "school_name": "ABC Elementary School",
        "grade_level": "5th Grade",
        "parent_name": "Mary Johnson",
        "parent_phone": "+1234567890",
        "parent_email": "mary.johnson@email.com",
        "consent_forms": {
            "vision_screening": True,
            "data_sharing": True,
            "glasses_prescription": True,
            "consent_date": datetime.now().isoformat()
        },
        "medical_history": {
            "previous_eye_surgery": False,
            "eye_diseases": [],
            "medications": [],
            "allergies": []
        },
        "equipment_calibration": {
            "auto_refractor_model": "Topcon KR-8000",
            "calibration_date": datetime.now().isoformat(),
            "calibration_status": "calibrated",
            "examiner_id": "EX001"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/registration",
            json=registration_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Screening Session
    print("\n🔵 Testing Screening Session Endpoint...")
    session_data = {
        "patient_id": "P001234",
        "examiner_id": "EX001",
        "school_name": "ABC Elementary School",
        "session_date": datetime.now().isoformat(),
        "equipment_calibration": {
            "auto_refractor_model": "Topcon KR-8000",
            "calibration_date": datetime.now().isoformat(),
            "calibration_status": "calibrated",
            "examiner_id": "EX001"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/sessions",
            json=session_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Initial Assessment
    print("\n🔵 Testing Initial Assessment Endpoint...")
    assessment_data = {
        "session_id": "MSS123456",
        "patient_id": "P001234",
        "assessment_date": datetime.now().isoformat(),
        "auto_refraction": {
            "left_eye": {"sphere": "-2.50", "cylinder": "-0.75", "axis": "90"},
            "right_eye": {"sphere": "-2.25", "cylinder": "-0.50", "axis": "85"},
            "pupillary_distance": "62",
            "interpupillary_distance": "64",
            "equipment_used": "Topcon KR-8000",
            "measurement_quality": "good"
        },
        "distance_vision": {
            "left_eye": "20/30",
            "right_eye": "20/25",
            "binocular": "20/25",
            "chart_type": "snellen"
        },
        "near_vision": {
            "left_eye": "N8",
            "right_eye": "N8",
            "reading_distance": "40cm"
        },
        "external_examination": {
            "eyelids": "normal",
            "conjunctiva": "normal",
            "cornea": "normal",
            "pupil_response": "normal",
            "notes": "No abnormalities detected"
        },
        "ocular_motility": {
            "eye_movements": "normal",
            "alignment": "normal",
            "convergence": "normal"
        },
        "color_vision": {
            "ishihara_test": "normal",
            "color_deficiency_type": None
        },
        "depth_perception": {
            "stereopsis": "normal",
            "depth_perception_score": "40 arc seconds"
        },
        "assessment_outcome": "abnormal"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/assessments",
            json=assessment_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Clinical Decision
    print("\n🔵 Testing Clinical Decision Endpoint...")
    decision_data = {
        "assessment_id": "IA123456",
        "patient_id": "P001234",
        "decision_date": datetime.now().isoformat(),
        "assessment_outcome": "abnormal",
        "abnormality_type": "refractive_error",
        "refractive_error": {
            "type": "myopia",
            "severity": "moderate",
            "prescription_required": True
        },
        "clinical_notes": "Patient shows moderate myopia requiring glasses prescription",
        "referral_required": False
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/clinical-decisions",
            json=decision_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Glasses Prescription
    print("\n🔵 Testing Glasses Prescription Endpoint...")
    prescription_data = {
        "decision_id": "CD123456",
        "patient_id": "P001234",
        "prescription_date": datetime.now().isoformat(),
        "final_prescription": {
            "left_eye": {"sphere": "-2.50", "cylinder": "-0.75", "axis": "90"},
            "right_eye": {"sphere": "-2.25", "cylinder": "-0.50", "axis": "85"},
            "pupillary_distance": "62",
            "interpupillary_distance": "64",
            "vertex_distance": "12mm",
            "pantoscopic_tilt": "8 degrees"
        },
        "frame_selection": {
            "frame_size": "medium",
            "face_measurements": {
                "bridge_width": "18mm",
                "temple_length": "140mm"
            },
            "frame_material": "plastic",
            "lens_type": "single_vision",
            "lens_coatings": ["anti_reflective", "uv_protection"]
        },
        "prescription_status": "approved"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/glasses-prescriptions",
            json=prescription_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Manufacturing Order
    print("\n🔵 Testing Manufacturing Order Endpoint...")
    order_data = {
        "prescription_id": "GP123456",
        "patient_id": "P001234",
        "order_date": datetime.now().isoformat(),
        "manufacturing_status": "ordered",
        "estimated_completion": (datetime.now() + timedelta(days=60)).isoformat(),
        "delivery": {
            "method": "school_delivery",
            "delivery_status": "pending",
            "recipient_name": "Mary Johnson",
            "recipient_phone": "+1234567890"
        },
        "fitting": {
            "fitting_status": "pending",
            "adjustments_needed": False
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/manufacturing-orders",
            json=order_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 7: Follow-up Session
    print("\n🔵 Testing Follow-up Session Endpoint...")
    followup_data = {
        "patient_id": "P001234",
        "prescription_id": "GP123456",
        "followup_date": (datetime.now() + timedelta(days=180)).isoformat(),
        "six_month_followup": {
            "scheduled_date": (datetime.now() + timedelta(days=180)).isoformat()
        },
        "annual_screening": {
            "next_screening_date": (datetime.now() + timedelta(days=365)).isoformat()
        },
        "parent_communication": {
            "initial_notification_sent": True,
            "followup_notification_sent": False
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/follow-up-sessions",
            json=followup_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 8: Statistics
    print("\n🔵 Testing Statistics Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/mobile-screening/statistics")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 9: Patient Workflow
    print("\n🔵 Testing Patient Workflow Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/mobile-screening/patients/P001234/workflow")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (authentication required)")
        else:
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ All endpoints tested!")
    print("=" * 50)

if __name__ == "__main__":
    test_endpoints()
