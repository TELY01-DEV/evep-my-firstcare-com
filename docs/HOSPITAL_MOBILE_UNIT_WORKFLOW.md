# 🏥 Hospital Mobile Unit Workflow & CSV Export Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Screening Types](#screening-types)
4. [Patient Registration Tabs](#patient-registration-tabs)
5. [CSV Export Functionality](#csv-export-functionality)
6. [Technical Implementation](#technical-implementation)
7. [User Guide](#user-guide)
8. [API Endpoints](#api-endpoints)
9. [Data Models](#data-models)
10. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Hospital Mobile Unit Workflow is a comprehensive vision screening system designed for field operations. It provides three distinct screening types, each with a unified 3-tab patient selection interface and comprehensive CSV export functionality that matches PDF export formats.

### Key Features
- **3-Tab Patient Selection System** for each screening type
- **Comprehensive Vision Assessment** with customizable test parameters
- **Real-time Data Export** to CSV format
- **Mobile-First Design** for field operations
- **Integrated Patient Management** across multiple registration sources

## 🏗️ System Architecture

### Frontend Components
```
frontend/src/components/
├── MobileVisionScreeningForm.tsx      # Mobile unit screening
├── StandardVisionScreeningForm.tsx    # Standard vision screening  
├── EnhancedScreeningInterface.tsx     # Enhanced vision screening
└── pages/
    └── MedicalReports.tsx             # CSV export functionality
```

### Backend Services
```
backend/app/api/
├── screenings.py                      # Screening session management
├── appointments.py                    # Appointment handling
├── evep/                             # Student and school data
└── user_management.py                # User and patient management
```

## 🔍 Screening Types

### 1. Mobile Vision Screening
- **Purpose**: Field operations with glasses prescription and fitting
- **Location**: `frontend/src/components/MobileVisionScreeningForm.tsx`
- **Features**: 
  - Complete workflow from screening to glasses delivery
  - Inventory management integration
  - Delivery scheduling and tracking

### 2. Standard Vision Screening
- **Purpose**: Standard clinical vision assessment
- **Location**: `frontend/src/components/StandardVisionScreeningForm.tsx`
- **Features**:
  - Comprehensive ophthalmic examination
  - Visual acuity testing
  - Color vision and depth perception assessment

### 3. Enhanced Vision Screening
- **Purpose**: Advanced medical-grade vision assessment
- **Location**: `frontend/src/components/EnhancedScreeningInterface.tsx`
- **Features**:
  - Advanced diagnostic tools
  - Specialist referral integration
  - Detailed medical reporting

## 📱 Patient Registration Tabs

Each screening type implements a unified 3-tab patient selection system:

### Tab 1: School Screening Students
- **Data Source**: Students who completed school screenings
- **Filter Options**: School, grade, screening status
- **Search**: Name, student ID, school
- **Display**: Card-based layout with student information

### Tab 2: Manual Registration
- **Data Source**: Manually registered patients
- **Features**: Add new patient form
- **Fields**: Name, DOB, school, grade, parent contact
- **Validation**: Required field validation

### Tab 3: Citizen Card Reader
- **Data Source**: Patients registered via card scanning
- **Card Types**: Citizen ID, Student ID, Other cards
- **Features**: Real-time card reading simulation
- **Integration**: Automatic patient data extraction

## 📊 CSV Export Functionality

### Medical Reports Export
**Location**: `frontend/src/pages/MedicalReports.tsx`

#### Export Options
- **Excel Export**: Comprehensive data export
- **PDF Export**: Formatted report generation
- **CSV Export**: Raw data export (matches PDF format)
- **Filtered Export**: Custom data subset export

#### CSV Data Structure
```csv
Timestamp,Report Type,School,Total Students,Total Screenings,Completed Screenings,Pending Screenings,Vision Issues Detected,Referrals Required,Glasses Prescribed
2024-01-15 10:30:00,screening,Wat Phra Si Mahathat School,58,35,11,12,8,3,5
```

### Mobile Vision Screening Export
**Location**: `frontend/src/components/MobileVisionScreeningForm.tsx`

#### Export Trigger
- **When**: After screening completion
- **Button**: "Export to CSV" appears post-completion
- **Data**: Complete screening results and patient information

#### CSV Data Structure
```csv
Patient ID,Patient Name,Date of Birth,School,Grade,Screening Date,Left Eye Distance,Right Eye Distance,Left Eye Near,Right Eye Near,Color Vision,Depth Perception,Glasses Needed,Glasses Prescription,Glasses Fitted,Glasses Delivered,Delivery Method,Delivery Date,Overall Assessment,Academic Impact,Follow Up Required,Follow Up Type,Follow Up Date,Screening Notes,Recommendations
68b693ccd920ec113d6550a4,John Doe,2010-05-15,Wat Phra Si Mahathat School,Grade 5,2024-01-15,20/20,20/25,20/30,20/35,normal,normal,Yes,Yes,Yes,No,school_delivery,2024-01-20,mild_impairment,mild,Yes,glasses_adjustment,2024-02-15,Patient shows mild myopia,Prescribe glasses and follow up in 1 month
```

## ⚙️ Technical Implementation

### State Management
```typescript
// Patient selection state
const [selectedTab, setSelectedTab] = useState(0);
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [screeningCompleted, setScreeningCompleted] = useState(false);

// Screening results state
const [screeningResults, setScreeningResults] = useState<VisionResults>({
  left_eye_distance: '',
  right_eye_distance: '',
  // ... other fields
});
```

### CSV Export Function
```typescript
const exportScreeningToCSV = () => {
  if (!selectedPatient || !screeningResults) return;

  const headers = [
    'Patient ID', 'Patient Name', 'Date of Birth',
    // ... comprehensive field list
  ];

  const csvData = [
    selectedPatient._id,
    `${selectedPatient.first_name} ${selectedPatient.last_name}`,
    // ... data mapping
  ];

  const csvContent = [headers.join(','), csvData.join(',')].join('\n');
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mobile-vision-screening-${patientName}-${date}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

### Tab Navigation
```typescript
<Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
  <Tab label="School Screening Students" icon={<School />} />
  <Tab label="Manual Registration" icon={<Person />} />
  <Tab label="Citizen Card Reader" icon={<CreditCard />} />
</Tabs>
```

## 📖 User Guide

### Starting a Screening Session

1. **Navigate to Screening Page**
   - Go to `/dashboard/screenings`
   - Select screening type (Mobile, Standard, or Enhanced)

2. **Select Patient Source**
   - **Tab 1**: Browse school screening students
   - **Tab 2**: Manually register new patient
   - **Tab 3**: Use card reader for patient data

3. **Complete Screening Workflow**
   - Follow step-by-step workflow
   - Enter vision test results
   - Complete assessment and recommendations

4. **Export Data**
   - CSV export button appears after completion
   - Click to download comprehensive screening data

### Patient Selection Workflow

#### School Screening Students
1. Use search bar to find specific students
2. Filter by school or screening status
3. Click on student card to select
4. View student details and screening history

#### Manual Registration
1. Click "Add New Patient" button
2. Fill in required patient information
3. Submit form to create patient record
4. Patient appears in selection list

#### Citizen Card Reader
1. Insert patient's ID card
2. System automatically reads patient data
3. Verify information accuracy
4. Confirm patient selection

## 🔌 API Endpoints

### Screening Sessions
```
POST /api/v1/screenings/sessions/
GET /api/v1/screenings/sessions/
```

### Patient Data
```
GET /api/v1/evep/students
GET /api/v1/appointments
```

### User Management
```
GET /api/v1/user-management/
POST /api/v1/user-management/
```

## 📊 Data Models

### Patient Interface
```typescript
interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  school?: string;
  grade?: string;
  student_id?: string;
  citizen_id?: string;
  parent_consent?: boolean;
  registration_status?: 'pending' | 'registered' | 'screened';
  photos?: string[];
}
```

### Vision Results Interface
```typescript
interface VisionResults {
  // Basic Vision Tests
  left_eye_distance: string;
  right_eye_distance: string;
  left_eye_near: string;
  right_eye_near: string;
  
  // Additional Tests
  color_vision: 'normal' | 'deficient' | 'failed';
  depth_perception: 'normal' | 'impaired' | 'failed';
  
  // Mobile Unit Specific
  glasses_needed: boolean;
  glasses_prescription?: GlassesPrescription;
  glasses_fitted: boolean;
  glasses_delivered: boolean;
  delivery_method?: 'immediate' | 'school_delivery' | 'home_delivery';
  
  // Assessment
  overall_assessment: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  academic_impact: 'none' | 'mild' | 'moderate' | 'significant';
  follow_up_required: boolean;
  follow_up_type?: string;
  follow_up_date?: string;
  
  // Notes
  screening_notes: string;
  recommendations: string;
}
```

## 🚨 Troubleshooting

### Common Issues

#### CSV Export Not Working
- **Problem**: Export button not appearing
- **Solution**: Ensure screening is completed first
- **Check**: `screeningCompleted` state is true

#### Patient Data Not Loading
- **Problem**: Empty patient lists
- **Solution**: Check API connectivity
- **Check**: Backend service status and JWT token validity

#### Tab Navigation Issues
- **Problem**: Tabs not switching
- **Solution**: Verify `selectedTab` state management
- **Check**: Tab change handler implementation

### Debug Information

#### Frontend Logs
```typescript
console.log('Patient selection:', selectedPatient);
console.log('Screening results:', screeningResults);
console.log('CSV export data:', csvData);
```

#### Backend Logs
```bash
docker-compose logs backend --tail=50
```

### Performance Optimization

#### CSV Export
- **Large Datasets**: Implement pagination for CSV export
- **Memory Usage**: Stream CSV generation for large files
- **File Size**: Compress CSV files for large datasets

#### Patient Loading
- **Search Optimization**: Implement debounced search
- **Caching**: Cache frequently accessed patient data
- **Lazy Loading**: Load patient data on demand

## 🔄 Future Enhancements

### Planned Features
1. **Real-time Card Reader Integration**
2. **Offline Mode Support**
3. **Advanced Analytics Dashboard**
4. **Mobile App Version**
5. **Multi-language Support**

### Technical Improvements
1. **WebSocket Integration** for real-time updates
2. **Progressive Web App** capabilities
3. **Advanced Search Algorithms**
4. **Machine Learning** for vision assessment
5. **Blockchain** for data integrity

## 📞 Support

### Development Team
- **Frontend**: React/TypeScript specialists
- **Backend**: Python/FastAPI developers
- **DevOps**: Docker and deployment experts

### Documentation Updates
- **Last Updated**: January 2024
- **Version**: 1.0.0
- **Maintainer**: Development Team

---

## 📝 Change Log

### Version 1.0.0 (January 2024)
- ✅ Initial implementation of 3-tab patient selection
- ✅ CSV export functionality for all screening types
- ✅ Mobile unit workflow integration
- ✅ Comprehensive vision assessment forms
- ✅ Patient management across multiple sources

---

*This documentation is maintained by the development team and should be updated with each major release.*

