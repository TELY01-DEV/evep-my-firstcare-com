# EVEP Platform - Updated ER Diagram with Mobile Reflection Unit Flows

## 🎯 **Overview**

This updated ER diagram includes all the missing flows identified in the Mobile Reflection Unit screening workflow, providing a complete data model for the clinical pathway: **Register → Initial Assessment → Automatic Measurement → Diagnosis → Glasses Prescription → Delivery → Follow-up**.

---

## 🗄️ **Enhanced Database Collections**

### **👥 User Management Collections**

#### **1. `users` Collection** (Enhanced)
```json
{
  "_id": "ObjectId",
  "email": "teacher@school.com",
  "name": "John Doe",
  "role": "teacher",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "profile": {
    "phone": "+1234567890",
    "school": "ABC School",
    "grade": "5th Grade",
    "examiner_id": "EX001",
    "certification": "Vision Screening Certified",
    "certification_date": "2024-01-01T00:00:00Z"
  }
}
```

#### **2. `medical_staff_users` Collection** (Enhanced)
```json
{
  "_id": "ObjectId",
  "email": "doctor@hospital.com",
  "name": "Dr. Jane Smith",
  "role": "doctor",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "medical_license": "MD123456",
  "specialization": "Ophthalmology",
  "hospital": "City General Hospital",
  "profile": {
    "phone": "+1234567890",
    "department": "Eye Care",
    "experience_years": 10,
    "examiner_id": "EX002",
    "equipment_certification": ["Auto-refractor", "Ophthalmoscope"]
  }
}
```

### **📊 Enhanced Data Collections**

#### **3. `patients` Collection** (Enhanced with Registration Data)
```json
{
  "_id": "ObjectId",
  "patient_id": "P001234",
  "name": "Alice Johnson",
  "date_of_birth": "2010-05-15",
  "gender": "female",
  "contact_info": {
    "phone": "+1234567890",
    "email": "parent@email.com",
    "address": "123 Main St, City"
  },
  "registration_data": {
    "student_id": "STU001234",
    "school_name": "ABC School",
    "grade_level": "5th Grade",
    "parent_name": "Mary Johnson",
    "parent_phone": "+1234567890",
    "parent_email": "parent@email.com",
    "consent_forms": {
      "vision_screening": true,
      "data_sharing": true,
      "glasses_prescription": true,
      "consent_date": "2024-01-15T10:30:00Z"
    },
    "medical_history": {
      "previous_eye_surgery": false,
      "eye_diseases": [],
      "medications": [],
      "allergies": []
    }
  },
  "medical_history": {
    "previous_conditions": ["Astigmatism"],
    "medications": [],
    "allergies": []
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "ObjectId(teacher_id)",
  "assigned_doctor": "ObjectId(doctor_id)"
}
```

#### **4. `mobile_screening_sessions` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "session_id": "MSS001234",
  "patient_id": "ObjectId(patient_id)",
  "examiner_id": "ObjectId(examiner_id)",
  "school_name": "ABC School",
  "session_date": "2024-01-15T10:30:00Z",
  "equipment_calibration": {
    "auto_refractor_model": "Topcon KR-8000",
    "calibration_date": "2024-01-15T09:00:00Z",
    "calibration_status": "calibrated",
    "examiner_id": "ObjectId(examiner_id)"
  },
  "session_status": "in_progress",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **5. `initial_assessments` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "assessment_id": "IA001234",
  "session_id": "ObjectId(session_id)",
  "patient_id": "ObjectId(patient_id)",
  "assessment_date": "2024-01-15T10:30:00Z",
  
  // Automatic Eye Measurement
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
  
  // Vision Assessment by Reading
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
  
  // Eye Abnormality Assessment
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
    "color_deficiency_type": null
  },
  
  "depth_perception": {
    "stereopsis": "normal",
    "depth_perception_score": "40 arc seconds"
  },
  
  "assessment_outcome": "abnormal",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **6. `clinical_decisions` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "decision_id": "CD001234",
  "assessment_id": "ObjectId(assessment_id)",
  "patient_id": "ObjectId(patient_id)",
  "decision_date": "2024-01-15T10:30:00Z",
  
  "assessment_outcome": "abnormal",
  "abnormality_type": "refractive_error",
  
  "refractive_error": {
    "type": "myopia",
    "severity": "moderate",
    "prescription_required": true
  },
  
  "eye_disease": null,
  
  "clinical_notes": "Patient shows moderate myopia requiring glasses prescription",
  "referral_required": false,
  "referral_type": null,
  
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **7. `glasses_prescriptions` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "prescription_id": "GP001234",
  "decision_id": "ObjectId(decision_id)",
  "patient_id": "ObjectId(patient_id)",
  "prescription_date": "2024-01-15T10:30:00Z",
  
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
  
  "prescription_status": "approved",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **8. `manufacturing_orders` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "order_id": "MO001234",
  "prescription_id": "ObjectId(prescription_id)",
  "patient_id": "ObjectId(patient_id)",
  "order_date": "2024-01-15T10:30:00Z",
  
  "manufacturing_status": "ordered",
  "estimated_completion": "2024-03-15T00:00:00Z",
  "actual_completion": null,
  
  "delivery": {
    "method": "school_delivery",
    "delivery_date": null,
    "delivery_status": "pending",
    "recipient_name": "Mary Johnson",
    "recipient_phone": "+1234567890"
  },
  
  "fitting": {
    "fitting_date": null,
    "fitting_status": "pending",
    "adjustments_needed": false,
    "adjustment_notes": null
  },
  
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **9. `follow_up_sessions` Collection** (NEW)
```json
{
  "_id": "ObjectId",
  "followup_id": "FU001234",
  "patient_id": "ObjectId(patient_id)",
  "prescription_id": "ObjectId(prescription_id)",
  "followup_date": "2024-07-15T10:30:00Z",
  
  "six_month_followup": {
    "scheduled_date": "2024-07-15T10:30:00Z",
    "completed_date": null,
    "vision_improvement": null,
    "glasses_compliance": null,
    "academic_impact": null,
    "notes": null
  },
  
  "annual_screening": {
    "next_screening_date": "2025-01-15T10:30:00Z",
    "screening_reminder_sent": false
  },
  
  "parent_communication": {
    "initial_notification_sent": true,
    "followup_notification_sent": false,
    "parent_feedback": null
  },
  
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **10. `screenings` Collection** (Enhanced)
```json
{
  "_id": "ObjectId",
  "screening_id": "S001234",
  "patient_id": "ObjectId(patient_id)",
  "conducted_by": "ObjectId(medical_staff_id)",
  "screening_date": "2024-01-15T10:30:00Z",
  "screening_type": "mobile_reflection_unit",
  "session_id": "ObjectId(session_id)",
  "assessment_id": "ObjectId(assessment_id)",
  "decision_id": "ObjectId(decision_id)",
  "prescription_id": "ObjectId(prescription_id)",
  "order_id": "ObjectId(order_id)",
  "followup_id": "ObjectId(followup_id)",
  
  "results": {
    "left_eye": {
      "visual_acuity": "20/30",
      "pressure": 14,
      "notes": "Moderate myopia detected"
    },
    "right_eye": {
      "visual_acuity": "20/25",
      "pressure": 15,
      "notes": "Moderate myopia detected"
    }
  },
  
  "recommendations": "Glasses prescription ordered, follow-up in 6 months",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## 🔄 **Enhanced Data Relationships**

### **Mobile Reflection Unit Flow Relationships**
```
patients (1) ←→ (N) mobile_screening_sessions
mobile_screening_sessions (1) ←→ (1) initial_assessments
initial_assessments (1) ←→ (1) clinical_decisions
clinical_decisions (1) ←→ (1) glasses_prescriptions
glasses_prescriptions (1) ←→ (1) manufacturing_orders
manufacturing_orders (1) ←→ (1) follow_up_sessions
screenings (1) ←→ (1) mobile_screening_sessions
screenings (1) ←→ (1) initial_assessments
screenings (1) ←→ (1) clinical_decisions
screenings (1) ←→ (1) glasses_prescriptions
screenings (1) ←→ (1) manufacturing_orders
screenings (1) ←→ (1) follow_up_sessions
```

### **User Relationships**
```
users (examiners) (1) ←→ (N) mobile_screening_sessions
medical_staff_users (doctors) (1) ←→ (N) clinical_decisions
medical_staff_users (doctors) (1) ←→ (N) glasses_prescriptions
```

---

## 🎯 **Clinical Pathway Data Flow**

### **Step 1: Registration**
```
patients.registration_data → mobile_screening_sessions
```

### **Step 2: Initial Assessment (Three Paths)**
```
mobile_screening_sessions → initial_assessments.auto_refraction
mobile_screening_sessions → initial_assessments.distance_vision
mobile_screening_sessions → initial_assessments.external_examination
```

### **Step 3: Clinical Decision**
```
initial_assessments → clinical_decisions
```

### **Step 4: Glasses Prescription**
```
clinical_decisions → glasses_prescriptions
```

### **Step 5: Manufacturing & Delivery**
```
glasses_prescriptions → manufacturing_orders
```

### **Step 6: Follow-up**
```
manufacturing_orders → follow_up_sessions
```

---

## 🔐 **Enhanced Access Control Matrix**

| Collection | Admin | Doctor | Nurse | Medical Staff | Teacher | Parent |
|------------|-------|--------|-------|---------------|---------|--------|
| `patients` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R/W (limited) | ✅ R (own) |
| `mobile_screening_sessions` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R/W (own) | ✅ R (own) |
| `initial_assessments` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R/W (own) | ✅ R (own) |
| `clinical_decisions` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R (own) | ✅ R (own) |
| `glasses_prescriptions` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R (own) | ✅ R (own) |
| `manufacturing_orders` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R (own) | ✅ R (own) |
| `follow_up_sessions` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R (own) | ✅ R (own) |
| `screenings` | ✅ R/W | ✅ R/W | ✅ R/W | ✅ R | ✅ R/W (own) | ✅ R (own) |

---

## 🔧 **Implementation Notes**

### **Indexes**
```javascript
// New collections
db.mobile_screening_sessions.createIndex({ "session_id": 1 }, { unique: true })
db.mobile_screening_sessions.createIndex({ "patient_id": 1 })
db.mobile_screening_sessions.createIndex({ "examiner_id": 1 })

db.initial_assessments.createIndex({ "assessment_id": 1 }, { unique: true })
db.initial_assessments.createIndex({ "session_id": 1 })
db.initial_assessments.createIndex({ "patient_id": 1 })

db.clinical_decisions.createIndex({ "decision_id": 1 }, { unique: true })
db.clinical_decisions.createIndex({ "assessment_id": 1 })
db.clinical_decisions.createIndex({ "patient_id": 1 })

db.glasses_prescriptions.createIndex({ "prescription_id": 1 }, { unique: true })
db.glasses_prescriptions.createIndex({ "decision_id": 1 })
db.glasses_prescriptions.createIndex({ "patient_id": 1 })

db.manufacturing_orders.createIndex({ "order_id": 1 }, { unique: true })
db.manufacturing_orders.createIndex({ "prescription_id": 1 })
db.manufacturing_orders.createIndex({ "patient_id": 1 })

db.follow_up_sessions.createIndex({ "followup_id": 1 }, { unique: true })
db.follow_up_sessions.createIndex({ "patient_id": 1 })
db.follow_up_sessions.createIndex({ "prescription_id": 1 })
```

### **Validation Rules**
```javascript
// Example validation for initial_assessments
{
  validator: {
    $jsonSchema: {
      required: ["assessment_id", "session_id", "patient_id", "assessment_date"],
      properties: {
        assessment_outcome: {
          enum: ["normal", "abnormal"]
        },
        "auto_refraction.measurement_quality": {
          enum: ["good", "fair", "poor"]
        }
      }
    }
  }
}
```

---

## 🎯 **Summary**

This updated ER diagram provides:

1. **Complete Clinical Pathway**: All steps from registration to follow-up
2. **Three-Path Assessment**: Automatic measurement, vision testing, and abnormality assessment
3. **Clinical Decision Support**: Proper routing based on assessment outcomes
4. **Manufacturing Integration**: Complete glasses prescription and delivery tracking
5. **Follow-up Management**: 6-month and annual monitoring
6. **Data Integrity**: Comprehensive validation and relationships
7. **Scalability**: Optimized for mobile reflection unit operations

**🔧 This enhanced database structure ensures complete coverage of the Mobile Reflection Unit clinical pathway!**
