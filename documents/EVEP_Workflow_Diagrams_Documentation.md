# EVEP Workflow Diagrams & Documentation

## Overview
This document provides a comprehensive overview of all workflow diagrams, screening component analysis, and entity-relationship diagrams for the EVEP (Eye Vision Enhancement Platform) Mobile Reflection Unit system.

## Table of Contents
1. [EVEP Screening Component Comparison & Analysis](#evep-screening-component-comparison--analysis)
2. [EVEP Entity-Relationship (ER) Diagram](#evep-entity-relationship-er-diagram)
3. [EVEP Medical Staff ER Diagram](#evep-medical-staff-er-diagram)
4. [EVEP Mobile Reflection Unit Workflow](#evep-mobile-reflection-unit-workflow)
5. [Documentation Files](#documentation-files)

---

## EVEP Screening Component Comparison & Analysis

### School-based Screening vs Hospital Mobile Unit Screening

| Component | School-based Screening | Hospital Mobile Unit Screening |
|-----------|----------------------|--------------------------------|
| **Conducted By** | Teachers | Medical Staff (Doctors, Nurses, Technicians) |
| **Equipment** | Basic vision charts | Advanced auto-refractors, specialized equipment |
| **Scope** | Initial screening | Comprehensive assessment and diagnosis |
| **Outcome** | Basic vision status | Detailed diagnosis and prescription |
| **Follow-up** | Referral to mobile unit | Direct treatment and glasses provision |
| **Data Storage** | School system | Hospital medical records |
| **Consent** | Basic school consent | Medical consent with parent approval |

### Workflow Integration
- **Phase 1**: School-based screening identifies potential issues
- **Phase 2**: Hospital mobile unit conducts detailed assessment
- **Phase 3**: Treatment and follow-up care provided

---

## EVEP Entity-Relationship (ER) Diagram

### Core System Entities

#### 1. **Users & Authentication**
- `users` - System user accounts
- `medical_staff_users` - Medical staff specific accounts
- `roles` - User role definitions
- `permissions` - Access control permissions

#### 2. **Patient Management**
- `patients` - Patient records and demographics
- `schools` - School information
- `teachers` - Teacher profiles
- `parents` - Parent/guardian information

#### 3. **Screening & Assessment**
- `mobile_screening_sessions` - Screening session records
- `initial_assessments` - Initial assessment data
- `clinical_decisions` - Clinical decision outcomes
- `screenings` - General screening records

#### 4. **Treatment & Follow-up**
- `glasses_prescriptions` - Glasses prescription data
- `manufacturing_orders` - Manufacturing order tracking
- `follow_up_sessions` - Follow-up session records

#### 5. **Equipment & Inventory**
- `equipment` - Medical equipment records
- `equipment_calibration` - Calibration tracking
- `inventory` - Glasses inventory management

### Key Relationships
- **School → Teacher → Student → Parent** (Hierarchical relationship)
- **Medical Staff → Screening Sessions** (Clinical workflow)
- **Patient → Assessment → Decision → Treatment** (Clinical pathway)
- **Equipment → Calibration → Staff** (Equipment management)

---

## EVEP Medical Staff ER Diagram

### Medical Staff Core Entities

#### 1. **MEDICAL_STAFF**
- Complete staff profiles with roles and specializations
- Contact information and employment details
- Hospital assignment and department information
- Active status and employment tracking

#### 2. **HOSPITAL**
- Hospital information and contact details
- Type classification (public/private)
- Active status management

#### 3. **Staff Credentials & Training**
- **MEDICAL_CREDENTIALS**: License tracking and certifications
- **STAFF_TRAINING**: Equipment and protocol training records
- Expiry date tracking and status management

#### 4. **Equipment Management**
- **EQUIPMENT**: Auto-refractors, vision charts, computers
- **EQUIPMENT_CALIBRATION**: Calibration tracking with staff responsibility
- Equipment assignment and maintenance records

#### 5. **Clinical Workflow Integration**
- **MOBILE_SCREENING_SESSION**: Screening sessions with staff assignment
- **SCREENING_ASSESSMENT**: Individual assessments by staff
- **CLINICAL_DECISION**: Clinical decisions made by medical staff

### Medical Staff Roles & Responsibilities

#### **Lead Doctor (Ophthalmologist/Optometrist)**
- Conduct comprehensive eye examinations
- Make clinical decisions and diagnoses
- Create glasses prescriptions
- Supervise screening sessions
- Quality assurance oversight
- Patient consultation and education

#### **Nurse**
- Patient registration and preparation
- Assist with screening procedures
- Patient care and comfort
- Equipment setup and calibration
- Documentation and record keeping
- Follow-up coordination

#### **Technician**
- Equipment operation and maintenance
- Auto-refractor calibration
- Technical support during screening
- Equipment troubleshooting
- Data collection and entry
- Quality control checks

#### **Coordinator**
- Schedule management and coordination
- School communication and liaison
- Mobile unit logistics
- Staff assignment and supervision
- Report generation and distribution
- Quality assurance coordination

### Access Control Matrix

| Role | School Screening | Mobile Unit | Equipment | Patient Data | Reports |
|------|------------------|--------------|-----------|--------------|---------|
| **Lead Doctor** | Read | Full Access | Full Access | Full Access | Full Access |
| **Nurse** | Read | Full Access | Read/Update | Full Access | Read |
| **Technician** | Read | Limited | Full Access | Read | Read |
| **Coordinator** | Read | Read/Update | Read | Read | Full Access |

---

## EVEP Mobile Reflection Unit Workflow

### Complete Clinical Pathway

#### **Phase 1: School-based Screening Management System**
- **System Relationships**:
  - Teacher belongs to School
  - Student belongs to Teacher
  - Parent has relationship with Student
- **Teacher Workflow**:
  - Teacher login to system
  - Select Student from class list
  - Conduct screening assessment
  - Save screening outcome to system
  - Generate screening reports

#### **Phase 2: Hospital Mobile Unit - Appointment & Consent**
- **Hospital Staff Actions**:
  - Create appointment schedule
  - Send schedule to school
  - Prepare notification letters
  - Prepare consent documents
  - Set up LINE BOT integration
- **Teacher & Parent Communication**:
  - Teacher sends notification letter
  - Teacher sends consent document
  - LINE BOT delivers soft copy documents
  - Parents accept with consent
  - Consent confirmation received
- **Student List Generation**:
  - List all students with parent consent
  - Include school-based screening outcomes
  - Prioritize based on screening results
  - Generate appointment schedule

#### **Phase 3: Mobile Reflection Unit Screening Day**
- **Step 1: Student Registration (Admit as Patient)**
  - Medical staff register student to system
  - Verify student identity and consent
  - Review school-based screening outcomes
  - Create patient record
  - Assign patient ID
- **Step 2: VA Screening and Diagnosis Flow**
  - Conduct comprehensive vision assessment
  - Auto-refractor measurements
  - Manual vision testing
  - Eye abnormality assessment
  - Generate diagnosis results
- **Step 3: Outcome Classification**
  - Normal patients: Screening complete
  - Abnormal patients: Select glasses option
  - Document screening outcomes
  - Generate patient reports
- **Step 4: Glasses Selection Process**
  - Check glasses inventory
  - Select appropriate frames
  - Verify prescription accuracy
  - Create glasses order

#### **Phase 4: Glasses Delivery to School**
- **Delivery Preparation**:
  - Manufacturing completion verification
  - Quality control check
  - Packaging and labeling
  - Delivery schedule coordination
  - School notification
- **School Delivery Process**:
  - 14-day delivery timeline
  - Deliver to school location
  - Patient verification at school
  - Glasses fitting and adjustment
  - Delivery confirmation

#### **Phase 5: Follow-up & Monitoring**
- Comprehensive monitoring and quality assurance
- Patient satisfaction tracking
- Performance metrics analysis

### API Endpoints

#### **Core Workflow Endpoints**
- `POST /mobile-screening/registration` - Patient registration
- `POST /mobile-screening/assessments` - Initial assessment
- `POST /mobile-screening/clinical-decisions` - Clinical decisions
- `POST /mobile-screening/glasses-prescriptions` - Glasses prescriptions
- `POST /mobile-screening/manufacturing-orders` - Manufacturing orders
- `POST /mobile-screening/follow-up-sessions` - Follow-up sessions
- `GET /mobile-screening/statistics` - Statistics and analytics

#### **Complete Workflow API**
- `POST /mobile-screening/complete-workflow` - Execute entire workflow

#### **Additional Endpoints**
- `GET /mobile-screening/school-screening/{id}` - School screening data
- `GET /mobile-screening/appointments/{id}` - Appointment details
- `GET /mobile-screening/consent/{id}` - Consent information
- `GET /mobile-screening/screening-session/{id}` - Screening session
- `GET /mobile-screening/delivery/status/{id}` - Delivery status

---

## Documentation Files

### Current Documentation Structure

#### **Core Documentation**
1. **EVEP_Updated_ER_Diagram.md** - Complete database schema
2. **EVEP_Medical_Staff_ER_Diagram.md** - Medical staff specific ER diagram
3. **EVEP_ER_FLOWCHART_PRINT.html** - Print-friendly workflow flowchart
4. **EVEP_Medical_Staff_ER_Diagram_Print.html** - Print-friendly medical staff diagram

#### **Workflow Documentation**
1. **MOBILE_VISION_SCREENING_WORKFLOW.md** - Detailed clinical pathway
2. **Mobile_Reflection_Unit_Workflow_PDF.md** - Human-readable workflow guide
3. **Mobile_Reflection_Unit_Implementation_Summary.md** - Implementation overview

#### **Analysis & Planning**
1. **MOBILE_REFLECTION_UNIT_MISSING_FLOWS.md** - Missing flows analysis
2. **EVEP_Database_Collections_Structure.md** - Database structure details

### Key Features of Documentation

#### **1. Comprehensive Coverage**
- Complete system architecture
- All workflow phases documented
- Medical staff management
- Equipment and inventory tracking

#### **2. Multiple Formats**
- Markdown (.md) for technical documentation
- HTML (.html) for print-friendly versions
- Mermaid diagrams for visual representation
- Tables for comparison and analysis

#### **3. Implementation Ready**
- API endpoint specifications
- Database schema definitions
- Access control matrices
- Role-based permissions

#### **4. Quality Assurance**
- Print-optimized layouts
- Professional formatting
- Clear visual hierarchy
- Comprehensive indexing

### Implementation Status

#### **✅ Completed Components**
- Complete ER diagram for all entities
- Medical staff ER diagram with roles
- Workflow documentation for all phases
- API endpoint specifications
- Access control matrices
- Print-friendly documentation

#### **🔄 In Progress**
- Backend API implementation
- Database schema implementation
- Frontend integration
- Testing and validation

#### **📋 Next Steps**
- Complete backend development
- Frontend interface development
- Integration testing
- User acceptance testing
- Production deployment

---

## Summary

The EVEP Workflow Diagrams & Documentation provides a comprehensive foundation for the Mobile Reflection Unit system, covering:

1. **Complete System Architecture** - All entities, relationships, and workflows
2. **Medical Staff Management** - Roles, responsibilities, and access control
3. **Clinical Workflow** - End-to-end patient care pathway
4. **Technical Implementation** - API endpoints and database schema
5. **Quality Assurance** - Documentation standards and print optimization

This documentation serves as the single source of truth for system development, implementation, and maintenance, ensuring consistency and quality across all aspects of the EVEP platform.

---

**Document Version**: 2.0  
**Last Updated**: January 2024  
**Next Review**: April 2024  
**Status**: ✅ Complete and Ready for Implementation
