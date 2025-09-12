#!/usr/bin/env python3
"""
Test script for Mobile Reflection Unit missing flows

This script tests all the missing flows identified in the Thai clinical pathway:
1. Patient Registration
2. Initial Assessment (Three-path)
3. Clinical Decision Points
4. Glasses Prescription Process
5. Manufacturing & Delivery
6. Follow-up & Monitoring
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8013/api/v1"
TEST_TOKEN = "test_token_for_mobile_screening"  # In production, get from auth endpoint

def get_headers():
    """Get headers for API requests"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_TOKEN}"
    }

def test_patient_registration():
    """Test patient registration flow"""
    print("🔵 Testing Patient Registration Flow...")
    
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
            "consent_date": datetime.utcnow().isoformat()
        },
        "medical_history": {
            "previous_eye_surgery": False,
            "eye_diseases": [],
            "medications": [],
            "allergies": []
        },
        "equipment_calibration": {
            "auto_refractor_model": "Topcon KR-8000",
            "calibration_date": datetime.utcnow().isoformat(),
            "calibration_status": "calibrated",
            "examiner_id": "EX001"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/registration",
            headers=get_headers(),
            json=registration_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Patient Registration: {result['message']}")
            print(f"   Registration ID: {result['registration_id']}")
            return result['registration_id']
        else:
            print(f"❌ Patient Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Patient Registration error: {str(e)}")
        return None

def test_screening_session(patient_id: str):
    """Test screening session creation"""
    print("🔵 Testing Screening Session Creation...")
    
    session_data = {
        "patient_id": patient_id,
        "examiner_id": "EX001",
        "school_name": "ABC Elementary School",
        "session_date": datetime.utcnow().isoformat(),
        "equipment_calibration": {
            "auto_refractor_model": "Topcon KR-8000",
            "calibration_date": datetime.utcnow().isoformat(),
            "calibration_status": "calibrated",
            "examiner_id": "EX001"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/sessions",
            headers=get_headers(),
            json=session_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Screening Session: {result['message']}")
            print(f"   Session ID: {result['session']['session_id']}")
            return result['session']['session_id']
        else:
            print(f"❌ Screening Session failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Screening Session error: {str(e)}")
        return None

def test_initial_assessment(session_id: str, patient_id: str):
    """Test initial assessment with three-path evaluation"""
    print("🔵 Testing Initial Assessment (Three-Path)...")
    
    assessment_data = {
        "session_id": session_id,
        "patient_id": patient_id,
        "assessment_date": datetime.utcnow().isoformat(),
        "auto_refraction": {
            "left_eye": {
                "sphere": "-2.50",
                "cylinder": "-0.75",
                "axis": "90"
            },
            "right_eye": {
                "sphere": "-2.25",
                "cylinder": "-0.50",
                "axis": "85"
            },
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
            headers=get_headers(),
            json=assessment_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Initial Assessment: {result['message']}")
            print(f"   Assessment ID: {result['assessment']['assessment_id']}")
            print(f"   Outcome: {result['assessment']['assessment_outcome']}")
            return result['assessment']['assessment_id']
        else:
            print(f"❌ Initial Assessment failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Initial Assessment error: {str(e)}")
        return None

def test_clinical_decision(assessment_id: str, patient_id: str):
    """Test clinical decision making"""
    print("🔵 Testing Clinical Decision...")
    
    decision_data = {
        "assessment_id": assessment_id,
        "patient_id": patient_id,
        "decision_date": datetime.utcnow().isoformat(),
        "assessment_outcome": "abnormal",
        "abnormality_type": "refractive_error",
        "refractive_error": {
            "type": "myopia",
            "severity": "moderate",
            "prescription_required": True
        },
        "eye_disease": None,
        "clinical_notes": "Patient shows moderate myopia requiring glasses prescription",
        "referral_required": False,
        "referral_type": None
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/clinical-decisions",
            headers=get_headers(),
            json=decision_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Clinical Decision: {result['message']}")
            print(f"   Decision ID: {result['decision']['decision_id']}")
            print(f"   Abnormality Type: {result['decision']['abnormality_type']}")
            return result['decision']['decision_id']
        else:
            print(f"❌ Clinical Decision failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Clinical Decision error: {str(e)}")
        return None

def test_glasses_prescription(decision_id: str, patient_id: str):
    """Test glasses prescription creation"""
    print("🔵 Testing Glasses Prescription...")
    
    prescription_data = {
        "decision_id": decision_id,
        "patient_id": patient_id,
        "prescription_date": datetime.utcnow().isoformat(),
        "final_prescription": {
            "left_eye": {
                "sphere": "-2.50",
                "cylinder": "-0.75",
                "axis": "90"
            },
            "right_eye": {
                "sphere": "-2.25",
                "cylinder": "-0.50",
                "axis": "85"
            },
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
            headers=get_headers(),
            json=prescription_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Glasses Prescription: {result['message']}")
            print(f"   Prescription ID: {result['prescription']['prescription_id']}")
            return result['prescription']['prescription_id']
        else:
            print(f"❌ Glasses Prescription failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Glasses Prescription error: {str(e)}")
        return None

def test_manufacturing_order(prescription_id: str, patient_id: str):
    """Test manufacturing order creation"""
    print("🔵 Testing Manufacturing Order...")
    
    order_data = {
        "prescription_id": prescription_id,
        "patient_id": patient_id,
        "order_date": datetime.utcnow().isoformat(),
        "manufacturing_status": "ordered",
        "estimated_completion": (datetime.utcnow() + timedelta(days=60)).isoformat(),
        "delivery": {
            "method": "school_delivery",
            "delivery_date": None,
            "delivery_status": "pending",
            "recipient_name": "Mary Johnson",
            "recipient_phone": "+1234567890"
        },
        "fitting": {
            "fitting_date": None,
            "fitting_status": "pending",
            "adjustments_needed": False,
            "adjustment_notes": None
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/manufacturing-orders",
            headers=get_headers(),
            json=order_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Manufacturing Order: {result['message']}")
            print(f"   Order ID: {result['order']['order_id']}")
            print(f"   Status: {result['order']['manufacturing_status']}")
            return result['order']['order_id']
        else:
            print(f"❌ Manufacturing Order failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Manufacturing Order error: {str(e)}")
        return None

def test_follow_up_session(prescription_id: str, patient_id: str):
    """Test follow-up session creation"""
    print("🔵 Testing Follow-up Session...")
    
    followup_data = {
        "patient_id": patient_id,
        "prescription_id": prescription_id,
        "followup_date": (datetime.utcnow() + timedelta(days=180)).isoformat(),
        "six_month_followup": {
            "scheduled_date": (datetime.utcnow() + timedelta(days=180)).isoformat(),
            "completed_date": None,
            "vision_improvement": None,
            "glasses_compliance": None,
            "academic_impact": None,
            "notes": None
        },
        "annual_screening": {
            "next_screening_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "screening_reminder_sent": False
        },
        "parent_communication": {
            "initial_notification_sent": True,
            "followup_notification_sent": False,
            "parent_feedback": None
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/follow-up-sessions",
            headers=get_headers(),
            json=followup_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Follow-up Session: {result['message']}")
            print(f"   Follow-up ID: {result['followup']['followup_id']}")
            return result['followup']['followup_id']
        else:
            print(f"❌ Follow-up Session failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Follow-up Session error: {str(e)}")
        return None

def test_complete_workflow():
    """Test complete workflow in one call"""
    print("🔵 Testing Complete Workflow...")
    
    # Sample patient ID
    patient_id = "P001234"
    
    # Session data
    session_data = {
        "patient_id": patient_id,
        "examiner_id": "EX001",
        "school_name": "ABC Elementary School",
        "session_date": datetime.utcnow().isoformat(),
        "equipment_calibration": {
            "auto_refractor_model": "Topcon KR-8000",
            "calibration_date": datetime.utcnow().isoformat(),
            "calibration_status": "calibrated",
            "examiner_id": "EX001"
        }
    }
    
    # Assessment data
    assessment_data = {
        "patient_id": patient_id,
        "assessment_date": datetime.utcnow().isoformat(),
        "auto_refraction": {
            "left_eye": {"sphere": "-1.75", "cylinder": "-0.50", "axis": "90"},
            "right_eye": {"sphere": "-1.50", "cylinder": "-0.25", "axis": "85"},
            "pupillary_distance": "60",
            "interpupillary_distance": "62",
            "equipment_used": "Topcon KR-8000",
            "measurement_quality": "good"
        },
        "distance_vision": {
            "left_eye": "20/25",
            "right_eye": "20/20",
            "binocular": "20/20",
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
    
    # Decision data
    decision_data = {
        "patient_id": patient_id,
        "assessment_outcome": "abnormal",
        "abnormality_type": "refractive_error",
        "refractive_error": {
            "type": "myopia",
            "severity": "mild",
            "prescription_required": True
        },
        "clinical_notes": "Patient shows mild myopia requiring glasses prescription",
        "referral_required": False
    }
    
    # Prescription data
    prescription_data = {
        "patient_id": patient_id,
        "prescription_date": datetime.utcnow().isoformat(),
        "final_prescription": {
            "left_eye": {"sphere": "-1.75", "cylinder": "-0.50", "axis": "90"},
            "right_eye": {"sphere": "-1.50", "cylinder": "-0.25", "axis": "85"},
            "pupillary_distance": "60",
            "interpupillary_distance": "62",
            "vertex_distance": "12mm",
            "pantoscopic_tilt": "8 degrees"
        },
        "frame_selection": {
            "frame_size": "small",
            "face_measurements": {
                "bridge_width": "16mm",
                "temple_length": "135mm"
            },
            "frame_material": "plastic",
            "lens_type": "single_vision",
            "lens_coatings": ["anti_reflective", "uv_protection"]
        },
        "prescription_status": "approved"
    }
    
    # Order data
    order_data = {
        "patient_id": patient_id,
        "manufacturing_status": "ordered",
        "estimated_completion": (datetime.utcnow() + timedelta(days=45)).isoformat(),
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
    
    # Follow-up data
    followup_data = {
        "patient_id": patient_id,
        "followup_date": (datetime.utcnow() + timedelta(days=180)).isoformat(),
        "six_month_followup": {
            "scheduled_date": (datetime.utcnow() + timedelta(days=180)).isoformat()
        },
        "annual_screening": {
            "next_screening_date": (datetime.utcnow() + timedelta(days=365)).isoformat()
        },
        "parent_communication": {
            "initial_notification_sent": True,
            "followup_notification_sent": False
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/mobile-screening/complete-workflow",
            headers=get_headers(),
            json={
                "session_data": session_data,
                "assessment_data": assessment_data,
                "decision_data": decision_data,
                "prescription_data": prescription_data,
                "order_data": order_data,
                "followup_data": followup_data
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Complete Workflow: {result['message']}")
            print(f"   Session ID: {result['session']['session_id']}")
            print(f"   Assessment ID: {result['assessment']['assessment_id']}")
            print(f"   Decision ID: {result['decision']['decision_id']}")
            if result['prescription']:
                print(f"   Prescription ID: {result['prescription']['prescription_id']}")
            if result['order']:
                print(f"   Order ID: {result['order']['order_id']}")
            if result['followup']:
                print(f"   Follow-up ID: {result['followup']['followup_id']}")
            return True
        else:
            print(f"❌ Complete Workflow failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Complete Workflow error: {str(e)}")
        return False

def test_statistics():
    """Test statistics endpoint"""
    print("🔵 Testing Statistics...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/mobile-screening/statistics",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Statistics: {result['message']}")
            stats = result['statistics']
            print(f"   Total Sessions: {stats['total_sessions']}")
            print(f"   Total Assessments: {stats['total_assessments']}")
            print(f"   Total Decisions: {stats['total_decisions']}")
            print(f"   Total Prescriptions: {stats['total_prescriptions']}")
            print(f"   Total Orders: {stats['total_orders']}")
            print(f"   Total Follow-ups: {stats['total_followups']}")
            print(f"   Assessment Outcomes: {stats['assessment_outcomes']}")
            print(f"   Manufacturing Status: {stats['manufacturing_status']}")
            return True
        else:
            print(f"❌ Statistics failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Statistics error: {str(e)}")
        return False

def test_patient_workflow(patient_id: str):
    """Test patient workflow retrieval"""
    print(f"🔵 Testing Patient Workflow for {patient_id}...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/mobile-screening/patients/{patient_id}/workflow",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Patient Workflow: {result['message']}")
            workflow = result['workflow']
            print(f"   Sessions: {len(workflow['sessions'])}")
            print(f"   Assessments: {len(workflow['assessments'])}")
            print(f"   Decisions: {len(workflow['decisions'])}")
            print(f"   Prescriptions: {len(workflow['prescriptions'])}")
            print(f"   Orders: {len(workflow['orders'])}")
            print(f"   Follow-ups: {len(workflow['followups'])}")
            return True
        else:
            print(f"❌ Patient Workflow failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Patient Workflow error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Mobile Reflection Unit Missing Flows Test")
    print("=" * 60)
    
    # Test individual flows
    print("\n📋 Testing Individual Flows:")
    print("-" * 40)
    
    # Test patient registration
    registration_id = test_patient_registration()
    if not registration_id:
        print("❌ Cannot continue without registration")
        return
    
    # Test screening session
    session_id = test_screening_session("P001234")
    if not session_id:
        print("❌ Cannot continue without session")
        return
    
    # Test initial assessment
    assessment_id = test_initial_assessment(session_id, "P001234")
    if not assessment_id:
        print("❌ Cannot continue without assessment")
        return
    
    # Test clinical decision
    decision_id = test_clinical_decision(assessment_id, "P001234")
    if not decision_id:
        print("❌ Cannot continue without decision")
        return
    
    # Test glasses prescription
    prescription_id = test_glasses_prescription(decision_id, "P001234")
    if not prescription_id:
        print("❌ Cannot continue without prescription")
        return
    
    # Test manufacturing order
    order_id = test_manufacturing_order(prescription_id, "P001234")
    if not order_id:
        print("❌ Cannot continue without order")
        return
    
    # Test follow-up session
    followup_id = test_follow_up_session(prescription_id, "P001234")
    if not followup_id:
        print("❌ Cannot continue without follow-up")
        return
    
    # Test complete workflow
    print("\n📋 Testing Complete Workflow:")
    print("-" * 40)
    test_complete_workflow()
    
    # Test statistics
    print("\n📊 Testing Statistics:")
    print("-" * 40)
    test_statistics()
    
    # Test patient workflow
    print("\n👤 Testing Patient Workflow:")
    print("-" * 40)
    test_patient_workflow("P001234")
    
    print("\n✅ Mobile Reflection Unit Missing Flows Test Completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
