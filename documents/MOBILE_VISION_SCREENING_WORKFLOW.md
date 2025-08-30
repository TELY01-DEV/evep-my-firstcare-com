# Mobile Vision Screening Workflow

## 🏥 **Mobile Reflection Unit - Vision Screening System**

### **Overview**
The Mobile Vision Screening system is specifically designed for mobile reflection units that provide vision screening services to schools and communities. The workflow follows the complete clinical pathway: **Register → Initial Assessment → Automatic Measurement → Diagnosis → Glasses Prescription → Delivery → Follow-up**.

---

## 📋 **Complete Clinical Workflow Steps**

### **Step 1: Patient Registration** (ลงทะเบียน)
- **Patient Identification**
  - Student ID verification
  - Parent/Guardian contact information
  - Consent form collection
  - Medical history review
- **Screening Session Setup**
  - Equipment calibration
  - Environment preparation
  - Examiner assignment

### **Step 2: Initial Vision Assessment** (ตรวจประเมินการมองเห็นเบื้องต้น)
**Three Parallel Assessment Paths:**

#### **2A: Automatic Eye Measurement** (วัดสายตาด้วยเครื่องอัตโนมัติ)
- **Automated Refraction**
  - Left Eye: Sphere / Cylinder x Axis
  - Right Eye: Sphere / Cylinder x Axis
  - Pupillary Distance (PD)
  - Interpupillary Distance (IPD)
- **Equipment Used**
  - Auto-refractor model
  - Calibration status
  - Measurement quality indicators

#### **2B: Vision Assessment by Reading** (ประเมินการมองเห็นด้วยการอ่านป้ายตัวเลขหรือรูปภาพ)
- **Distance Vision Testing**
  - Left Eye Distance Vision (e.g., 20/20, 20/25, 20/30)
  - Right Eye Distance Vision
  - Binocular Vision
- **Near Vision Testing**
  - Left Eye Near Vision (e.g., N8, N10, N12)
  - Right Eye Near Vision
  - Reading Distance
- **Chart Types Used**
  - Snellen Chart
  - Tumbling E Chart
  - Lea Symbols Chart
  - Number Chart

#### **2C: Initial Eye Abnormality Assessment** (ตรวจประเมินความผิดปกติทางตาเบื้องต้น)
- **External Eye Examination**
  - Eyelid assessment
  - Conjunctiva inspection
  - Cornea examination
  - Pupil response
- **Basic Ocular Motility**
  - Eye movement testing
  - Alignment assessment
  - Convergence testing
- **Color Vision Testing**
  - Ishihara Color Test
  - Color deficiency detection
- **Depth Perception Testing**
  - Stereopsis assessment
  - Depth perception evaluation

### **Step 3: Assessment Outcomes & Decision Points**

#### **3A: Normal Results** (ปกติ)
- **All assessments normal**
- **Action**: Give advice and return to classroom
- **Documentation**: Normal screening certificate
- **Follow-up**: Routine screening in 1 year

#### **3B: Abnormal Results** (ผิดปกติ)
- **Any assessment shows abnormality**
- **Action**: Proceed to detailed eye measurement
- **Documentation**: Abnormal findings report

### **Step 4: Detailed Eye Measurement** (วัดสายตา)

#### **4A: Eye Disease or Other Abnormality Detection** (มีโรคตาหรือความผิดปกติอื่น)
- **Pathological Conditions**
  - Cataracts
  - Glaucoma
  - Retinal disorders
  - Corneal abnormalities
  - Strabismus
  - Amblyopia
- **Action**: Refer according to rights/eligibility
- **Documentation**: Medical referral form
- **Follow-up**: Specialist consultation

#### **4B: Vision Abnormality Only** (มีเพียงความผิดปกติทางสายตา)
- **Refractive Errors**
  - Myopia (Nearsightedness)
  - Hyperopia (Farsightedness)
  - Astigmatism
  - Presbyopia
- **Action**: Proceed to glasses prescription
- **Documentation**: Refractive error assessment

### **Step 5: Glasses Prescription Process**

#### **5A: Frame Selection** (เลือกกรอบแว่น)
- **Frame Fitting**
  - Frame size selection
  - Face measurement
  - Bridge width
  - Temple length
  - Frame material preference
- **Lens Options**
  - Single vision
  - Bifocal
  - Progressive
  - Anti-reflective coating
  - UV protection
  - Photochromic options

#### **5B: Parameter Measurement** (วัดค่าพารามิเตอร์)
- **Final Prescription**
  - Left Eye: Sphere / Cylinder x Axis
  - Right Eye: Sphere / Cylinder x Axis
  - Pupillary Distance (PD)
  - Interpupillary Distance (IPD)
  - Vertex distance
  - Pantoscopic tilt
- **Lens Specifications**
  - Lens material
  - Lens thickness
  - Edge treatment
  - Special coatings

### **Step 6: Glasses Manufacturing & Delivery**
- **Manufacturing Timeline**: 1-2 months
- **Quality Control**: Final inspection
- **Delivery Options**
  - School delivery
  - Home delivery
  - Mobile unit pickup
- **Fitting Appointment**: Initial fitting and adjustment

### **Step 7: Follow-up & Monitoring**
- **6-Month Follow-up**: Post-glasses assessment
- **Annual Screening**: Routine vision check
- **Academic Impact**: Performance monitoring
- **Parent Communication**: Progress updates

---

## 🎯 **Enhanced Data Capture Requirements**

### **Registration Data**
```typescript
interface RegistrationData {
  student_id: string;
  school_name: string;
  grade_level: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  consent_forms: {
    vision_screening: boolean;
    data_sharing: boolean;
    glasses_prescription: boolean;
  };
  medical_history: {
    previous_eye_surgery: boolean;
    eye_diseases: string[];
    medications: string[];
    allergies: string[];
  };
}
```

### **Initial Assessment Data**
```typescript
interface InitialAssessmentData {
  // Automatic Eye Measurement
  auto_refraction: {
    left_eye: {
      sphere: string;
      cylinder: string;
      axis: string;
    };
    right_eye: {
      sphere: string;
      cylinder: string;
      axis: string;
    };
    pupillary_distance: string;
    interpupillary_distance: string;
    equipment_used: string;
    measurement_quality: 'good' | 'fair' | 'poor';
  };
  
  // Vision Assessment by Reading
  distance_vision: {
    left_eye: string;
    right_eye: string;
    binocular: string;
    chart_type: 'snellen' | 'tumbling_e' | 'lea_symbols' | 'numbers';
  };
  
  near_vision: {
    left_eye: string;
    right_eye: string;
    reading_distance: string;
  };
  
  // Eye Abnormality Assessment
  external_examination: {
    eyelids: 'normal' | 'abnormal';
    conjunctiva: 'normal' | 'abnormal';
    cornea: 'normal' | 'abnormal';
    pupil_response: 'normal' | 'abnormal';
    notes: string;
  };
  
  ocular_motility: {
    eye_movements: 'normal' | 'abnormal';
    alignment: 'normal' | 'strabismus';
    convergence: 'normal' | 'abnormal';
  };
  
  color_vision: {
    ishihara_test: 'normal' | 'deficient' | 'failed';
    color_deficiency_type?: string;
  };
  
  depth_perception: {
    stereopsis: 'normal' | 'impaired' | 'failed';
    depth_perception_score?: string;
  };
}
```

### **Diagnosis & Prescription Data**
```typescript
interface DiagnosisData {
  assessment_outcome: 'normal' | 'abnormal';
  
  // For Abnormal Cases
  abnormality_type: 'refractive_error' | 'eye_disease' | 'other';
  
  // Eye Disease Cases
  eye_disease?: {
    condition: string;
    severity: 'mild' | 'moderate' | 'severe';
    referral_required: boolean;
    referral_type: 'ophthalmologist' | 'optometrist' | 'specialist';
  };
  
  // Refractive Error Cases
  refractive_error?: {
    type: 'myopia' | 'hyperopia' | 'astigmatism' | 'presbyopia';
    severity: 'mild' | 'moderate' | 'severe';
    prescription_required: boolean;
  };
  
  // Final Prescription
  final_prescription?: {
    left_eye: {
      sphere: string;
      cylinder: string;
      axis: string;
    };
    right_eye: {
      sphere: string;
      cylinder: string;
      axis: string;
    };
    pupillary_distance: string;
    interpupillary_distance: string;
    vertex_distance: string;
    pantoscopic_tilt: string;
  };
  
  // Frame Selection
  frame_selection?: {
    frame_size: string;
    face_measurements: {
      bridge_width: string;
      temple_length: string;
    };
    frame_material: string;
    lens_type: 'single_vision' | 'bifocal' | 'progressive';
    lens_coatings: string[];
  };
}
```

### **Manufacturing & Delivery Data**
```typescript
interface ManufacturingData {
  manufacturing_status: 'ordered' | 'in_progress' | 'completed' | 'delivered';
  order_date: string;
  estimated_completion: string;
  actual_completion?: string;
  
  delivery: {
    method: 'school_delivery' | 'home_delivery' | 'mobile_unit_pickup';
    delivery_date?: string;
    delivery_status: 'pending' | 'scheduled' | 'completed';
    recipient_name?: string;
    recipient_phone?: string;
  };
  
  fitting: {
    fitting_date?: string;
    fitting_status: 'pending' | 'completed';
    adjustments_needed: boolean;
    adjustment_notes?: string;
  };
}
```

### **Follow-up Data**
```typescript
interface FollowUpData {
  six_month_followup: {
    scheduled_date: string;
    completed_date?: string;
    vision_improvement: 'significant' | 'moderate' | 'minimal' | 'none';
    glasses_compliance: 'excellent' | 'good' | 'fair' | 'poor';
    academic_impact: 'positive' | 'neutral' | 'negative';
    notes: string;
  };
  
  annual_screening: {
    next_screening_date: string;
    screening_reminder_sent: boolean;
  };
  
  parent_communication: {
    initial_notification_sent: boolean;
    followup_notification_sent: boolean;
    parent_feedback?: string;
  };
}
```

---

## 🔧 **Updated Technical Implementation**

### **Enhanced Frontend Components**
1. **PatientRegistrationForm.tsx** - Complete registration with consent
2. **InitialAssessmentForm.tsx** - Three-path initial assessment
3. **AutomaticMeasurementForm.tsx** - Auto-refractor integration
4. **VisionAssessmentForm.tsx** - Manual vision testing
5. **EyeAbnormalityForm.tsx** - Basic eye examination
6. **DiagnosisForm.tsx** - Clinical decision making
7. **GlassesPrescriptionForm.tsx** - Frame selection and fitting
8. **ManufacturingTrackingForm.tsx** - Production and delivery tracking
9. **FollowUpForm.tsx** - 6-month and annual follow-up

### **Enhanced Backend Models**
1. **RegistrationModel** - Complete patient registration
2. **InitialAssessmentModel** - Three-path assessment data
3. **DiagnosisModel** - Clinical decision and prescription
4. **ManufacturingModel** - Production and delivery tracking
5. **FollowUpModel** - Long-term monitoring

### **New API Endpoints**
- `POST /api/v1/screenings/registration` - Patient registration
- `POST /api/v1/screenings/initial-assessment` - Initial assessment
- `POST /api/v1/screenings/automatic-measurement` - Auto-refractor data
- `POST /api/v1/screenings/diagnosis` - Clinical diagnosis
- `POST /api/v1/screenings/glasses-prescription` - Prescription management
- `POST /api/v1/screenings/manufacturing` - Manufacturing tracking
- `GET /api/v1/screenings/follow-up/{patient_id}` - Follow-up data

---

## 📊 **Quality Assurance & Compliance**

### **Clinical Standards**
- **Equipment Calibration**: Daily auto-refractor calibration
- **Quality Control**: Measurement quality indicators
- **Clinical Validation**: Manual verification of automated results
- **Documentation**: Complete clinical pathway documentation

### **Data Integrity**
- **Required Fields**: All critical clinical data points
- **Validation Rules**: Clinical range validation
- **Audit Trail**: Complete screening session audit
- **Backup**: Real-time data backup and sync

### **Timeline Compliance**
- **Manufacturing**: 1-2 months as specified
- **Follow-up**: 6-month post-glasses assessment
- **Annual Screening**: Routine vision monitoring
- **Communication**: Timely parent notifications

---

*This updated workflow now includes the complete clinical pathway from the Thai flowchart, ensuring comprehensive data capture and proper clinical decision-making for the Mobile Reflection Unit.*
