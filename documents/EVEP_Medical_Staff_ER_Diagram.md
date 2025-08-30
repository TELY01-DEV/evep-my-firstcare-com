# EVEP Mobile Reflection Unit - Medical Staff ER Diagram

## Overview
This ER Diagram focuses on the medical staff entities and their relationships within the EVEP Mobile Reflection Unit system, showing how medical staff interact with patients, equipment, and the screening workflow.

## Entity-Relationship Diagram

```mermaid
erDiagram
    %% Medical Staff Core Entities
    MEDICAL_STAFF {
        ObjectId _id PK
        String staff_id UK "MST001234"
        String employee_number UK "EMP001234"
        String first_name "Dr. John"
        String last_name "Smith"
        String email "john.smith@hospital.com"
        String phone "+66-81-234-5678"
        String role "doctor|nurse|technician|coordinator"
        String specialization "ophthalmology|optometry|pediatrics"
        String license_number "MD123456"
        String hospital_id FK
        String department "Mobile Unit|Ophthalmology|Pediatrics"
        Boolean is_active true
        Date employment_date "2023-01-15"
        Date created_at "2023-01-15T10:00:00Z"
        Date updated_at "2023-01-15T10:00:00Z"
    }

    HOSPITAL {
        ObjectId _id PK
        String hospital_id UK "HOS001"
        String hospital_name "Bangkok General Hospital"
        String hospital_code "BGH"
        String address "123 Hospital Road, Bangkok"
        String phone "+66-2-123-4567"
        String email "info@bgh.com"
        String type "public|private"
        Boolean is_active true
        Date created_at "2023-01-01T00:00:00Z"
        Date updated_at "2023-01-01T00:00:00Z"
    }

    %% Medical Staff Credentials & Training
    MEDICAL_CREDENTIALS {
        ObjectId _id PK
        String credential_id UK "CRED001234"
        String staff_id FK
        String credential_type "medical_license|specialization|certification"
        String credential_number "MD123456"
        String issuing_authority "Medical Council of Thailand"
        Date issue_date "2020-01-15"
        Date expiry_date "2025-01-15"
        String status "active|expired|suspended"
        String document_url "https://docs.example.com/credential.pdf"
        Date created_at "2023-01-15T10:00:00Z"
        Date updated_at "2023-01-15T10:00:00Z"
    }

    STAFF_TRAINING {
        ObjectId _id PK
        String training_id UK "TRN001234"
        String staff_id FK
        String training_type "equipment|protocol|safety|software"
        String training_name "Auto-refractor Operation"
        String training_provider "Equipment Manufacturer"
        Date training_date "2023-06-15"
        Date expiry_date "2024-06-15"
        String status "completed|in_progress|expired"
        String certificate_url "https://docs.example.com/certificate.pdf"
        String notes "Training notes and observations"
        Date created_at "2023-06-15T10:00:00Z"
        Date updated_at "2023-06-15T10:00:00Z"
    }

    %% Medical Staff Work Schedule & Assignments
    STAFF_SCHEDULE {
        ObjectId _id PK
        String schedule_id UK "SCH001234"
        String staff_id FK
        String schedule_type "mobile_unit|hospital|on_call"
        Date schedule_date "2024-01-15"
        Time start_time "08:00:00"
        Time end_time "17:00:00"
        String location "School Name or Hospital"
        String status "scheduled|confirmed|completed|cancelled"
        String notes "Schedule notes and special instructions"
        Date created_at "2024-01-10T10:00:00Z"
        Date updated_at "2024-01-10T10:00:00Z"
    }

    MOBILE_UNIT_ASSIGNMENT {
        ObjectId _id PK
        String assignment_id UK "ASG001234"
        String staff_id FK
        String mobile_unit_id FK
        String school_id FK
        Date assignment_date "2024-01-15"
        String role "lead_doctor|nurse|technician|coordinator"
        String status "assigned|in_progress|completed"
        String notes "Assignment specific notes"
        Date created_at "2024-01-10T10:00:00Z"
        Date updated_at "2024-01-10T10:00:00Z"
    }

    %% Equipment & Calibration
    EQUIPMENT {
        ObjectId _id PK
        String equipment_id UK "EQP001234"
        String equipment_type "auto_refractor|vision_chart|computer"
        String model "Topcon KR-8000"
        String serial_number "SN123456789"
        String manufacturer "Topcon"
        Date purchase_date "2023-01-15"
        String status "active|maintenance|retired"
        String location "Mobile Unit 1"
        String assigned_staff_id FK
        Date created_at "2023-01-15T10:00:00Z"
        Date updated_at "2023-01-15T10:00:00Z"
    }

    EQUIPMENT_CALIBRATION {
        ObjectId _id PK
        String calibration_id UK "CAL001234"
        String equipment_id FK
        String staff_id FK "Calibrated by"
        Date calibration_date "2024-01-15"
        Date next_calibration_date "2024-04-15"
        String calibration_status "calibrated|needs_calibration|failed"
        String calibration_method "manufacturer|in_house|external"
        String calibration_report_url "https://docs.example.com/calibration.pdf"
        String notes "Calibration notes and observations"
        Date created_at "2024-01-15T10:00:00Z"
        Date updated_at "2024-01-15T10:00:00Z"
    }

    %% Screening Sessions & Patient Care
    MOBILE_SCREENING_SESSION {
        ObjectId _id PK
        String session_id UK "MSS001234"
        String patient_id FK
        String lead_staff_id FK "Lead medical staff"
        String assistant_staff_id FK "Assistant staff"
        String school_id FK
        String mobile_unit_id FK
        Date session_date "2024-01-15"
        Time start_time "10:30:00"
        Time end_time "11:30:00"
        String session_status "scheduled|in_progress|completed|cancelled"
        String session_type "initial|follow_up|emergency"
        String notes "Session notes and observations"
        Date created_at "2024-01-15T10:30:00Z"
        Date updated_at "2024-01-15T11:30:00Z"
    }

    SCREENING_ASSESSMENT {
        ObjectId _id PK
        String assessment_id UK "ASS001234"
        String session_id FK
        String staff_id FK "Assessed by"
        String assessment_type "auto_refractor|manual_vision|eye_examination"
        Date assessment_date "2024-01-15"
        Time assessment_time "10:45:00"
        Object assessment_data "Detailed assessment results"
        String assessment_status "completed|in_progress|cancelled"
        String notes "Assessment notes and observations"
        Date created_at "2024-01-15T10:45:00Z"
        Date updated_at "2024-01-15T10:45:00Z"
    }

    CLINICAL_DECISION {
        ObjectId _id PK
        String decision_id UK "DEC001234"
        String session_id FK
        String staff_id FK "Decision made by"
        String decision_type "normal|abnormal|referral|glasses_needed"
        Date decision_date "2024-01-15"
        String decision_reason "Clinical reasoning"
        Object decision_data "Detailed decision information"
        String decision_status "pending|confirmed|implemented"
        String notes "Decision notes and recommendations"
        Date created_at "2024-01-15T11:00:00Z"
        Date updated_at "2024-01-15T11:00:00Z"
    }

    %% Glasses Prescription & Manufacturing
    GLASSES_PRESCRIPTION {
        ObjectId _id PK
        String prescription_id UK "PRES001234"
        String session_id FK
        String staff_id FK "Prescribed by"
        String patient_id FK
        Date prescription_date "2024-01-15"
        Object prescription_data "Detailed prescription specifications"
        String prescription_status "draft|confirmed|sent_to_manufacturing"
        String frame_selection "Frame details and preferences"
        String notes "Prescription notes and special instructions"
        Date created_at "2024-01-15T11:15:00Z"
        Date updated_at "2024-01-15T11:15:00Z"
    }

    MANUFACTURING_ORDER {
        ObjectId _id PK
        String order_id UK "ORD001234"
        String prescription_id FK
        String staff_id FK "Ordered by"
        String manufacturer_id FK
        Date order_date "2024-01-15"
        String order_status "pending|confirmed|in_production|completed"
        Date estimated_completion "2024-01-29"
        Date actual_completion "2024-01-28"
        String tracking_number "TRK123456789"
        String notes "Manufacturing order notes"
        Date created_at "2024-01-15T11:30:00Z"
        Date updated_at "2024-01-15T11:30:00Z"
    }

    %% Quality Assurance & Follow-up
    QUALITY_ASSURANCE {
        ObjectId _id PK
        String qa_id UK "QA001234"
        String session_id FK
        String staff_id FK "QA conducted by"
        String qa_type "equipment|procedure|documentation|patient_care"
        Date qa_date "2024-01-15"
        String qa_status "passed|failed|needs_improvement"
        Object qa_criteria "QA criteria and results"
        String qa_notes "QA findings and recommendations"
        Date created_at "2024-01-15T12:00:00Z"
        Date updated_at "2024-01-15T12:00:00Z"
    }

    FOLLOW_UP_SESSION {
        ObjectId _id PK
        String followup_id UK "FUP001234"
        String original_session_id FK
        String staff_id FK "Follow-up conducted by"
        String patient_id FK
        Date followup_date "2024-04-15"
        String followup_type "glasses_fitting|progress_check|adjustment"
        Object followup_data "Follow-up assessment results"
        String followup_status "scheduled|completed|cancelled"
        String followup_notes "Follow-up notes and recommendations"
        Date created_at "2024-01-15T12:30:00Z"
        Date updated_at "2024-01-15T12:30:00Z"
    }

    %% Relationships
    MEDICAL_STAFF ||--o{ MEDICAL_CREDENTIALS : "has"
    MEDICAL_STAFF ||--o{ STAFF_TRAINING : "receives"
    MEDICAL_STAFF ||--o{ STAFF_SCHEDULE : "has"
    MEDICAL_STAFF ||--o{ MOBILE_UNIT_ASSIGNMENT : "assigned_to"
    MEDICAL_STAFF ||--o{ EQUIPMENT : "assigned_to"
    MEDICAL_STAFF ||--o{ EQUIPMENT_CALIBRATION : "performs"
    MEDICAL_STAFF ||--o{ MOBILE_SCREENING_SESSION : "conducts"
    MEDICAL_STAFF ||--o{ SCREENING_ASSESSMENT : "performs"
    MEDICAL_STAFF ||--o{ CLINICAL_DECISION : "makes"
    MEDICAL_STAFF ||--o{ GLASSES_PRESCRIPTION : "creates"
    MEDICAL_STAFF ||--o{ MANUFACTURING_ORDER : "places"
    MEDICAL_STAFF ||--o{ QUALITY_ASSURANCE : "conducts"
    MEDICAL_STAFF ||--o{ FOLLOW_UP_SESSION : "conducts"
    
    HOSPITAL ||--o{ MEDICAL_STAFF : "employs"
    EQUIPMENT ||--o{ EQUIPMENT_CALIBRATION : "requires"
    MOBILE_SCREENING_SESSION ||--o{ SCREENING_ASSESSMENT : "includes"
    MOBILE_SCREENING_SESSION ||--o{ CLINICAL_DECISION : "results_in"
    MOBILE_SCREENING_SESSION ||--o{ GLASSES_PRESCRIPTION : "may_require"
    GLASSES_PRESCRIPTION ||--o{ MANUFACTURING_ORDER : "generates"
    MOBILE_SCREENING_SESSION ||--o{ QUALITY_ASSURANCE : "undergoes"
    MOBILE_SCREENING_SESSION ||--o{ FOLLOW_UP_SESSION : "may_require"
```

## Medical Staff Roles and Responsibilities

### 1. **Lead Doctor (Ophthalmologist/Optometrist)**
- **Primary Responsibilities**:
  - Conduct comprehensive eye examinations
  - Make clinical decisions and diagnoses
  - Create glasses prescriptions
  - Supervise screening sessions
  - Quality assurance oversight
  - Patient consultation and education

### 2. **Nurse**
- **Primary Responsibilities**:
  - Patient registration and preparation
  - Assist with screening procedures
  - Patient care and comfort
  - Equipment setup and calibration
  - Documentation and record keeping
  - Follow-up coordination

### 3. **Technician**
- **Primary Responsibilities**:
  - Equipment operation and maintenance
  - Auto-refractor calibration
  - Technical support during screening
  - Equipment troubleshooting
  - Data collection and entry
  - Quality control checks

### 4. **Coordinator**
- **Primary Responsibilities**:
  - Schedule management and coordination
  - School communication and liaison
  - Mobile unit logistics
  - Staff assignment and supervision
  - Report generation and distribution
  - Quality assurance coordination

## Key Features of Medical Staff ER Diagram

### **1. Comprehensive Staff Management**
- Complete staff profiles with credentials
- Training and certification tracking
- Schedule and assignment management
- Role-based access control

### **2. Equipment Integration**
- Equipment assignment to staff
- Calibration tracking and responsibility
- Equipment usage monitoring
- Maintenance coordination

### **3. Clinical Workflow Integration**
- Direct connection to screening sessions
- Assessment and decision tracking
- Prescription and manufacturing workflow
- Quality assurance processes

### **4. Quality Assurance**
- Staff performance monitoring
- Equipment calibration tracking
- Clinical decision validation
- Follow-up session management

### **5. Reporting and Analytics**
- Staff productivity metrics
- Equipment utilization tracking
- Clinical outcome analysis
- Quality assurance reporting

## Access Control Matrix

| Role | School Screening | Mobile Unit | Equipment | Patient Data | Reports |
|------|------------------|--------------|-----------|--------------|---------|
| **Lead Doctor** | Read | Full Access | Full Access | Full Access | Full Access |
| **Nurse** | Read | Full Access | Read/Update | Full Access | Read |
| **Technician** | Read | Limited | Full Access | Read | Read |
| **Coordinator** | Read | Read/Update | Read | Read | Full Access |

## Implementation Notes

### **1. Security Considerations**
- Role-based access control (RBAC)
- Audit trail for all medical staff actions
- HIPAA/Data protection compliance
- Secure credential storage

### **2. Integration Points**
- Hospital information system (HIS) integration
- Equipment manufacturer APIs
- School management system integration
- LINE BOT for communication

### **3. Scalability**
- Support for multiple mobile units
- Multi-hospital deployment capability
- Staff rotation and assignment flexibility
- Equipment sharing and allocation

### **4. Quality Assurance**
- Automated calibration reminders
- Staff training expiration alerts
- Clinical decision validation
- Performance metrics tracking

This ER Diagram provides a comprehensive view of how medical staff interact with all aspects of the EVEP Mobile Reflection Unit system, ensuring proper accountability, quality assurance, and efficient workflow management.
