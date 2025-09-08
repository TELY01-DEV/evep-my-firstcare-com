# 🚀 Developer Quick Reference - Hospital Mobile Unit Workflow

## ⚡ Quick Start

### 1. Access Screening Forms
```typescript
// Navigate to screening pages
/dashboard/screenings                    # Main screening page
/dashboard/medical-staff                # Staff directory
/dashboard/medical-staff/management     # Staff management
/dashboard/user-management              # User directory
/dashboard/user-management/management   # User management
```

### 2. Key Components
```typescript
// Main screening components
MobileVisionScreeningForm.tsx          // Mobile unit workflow
StandardVisionScreeningForm.tsx        // Standard screening
EnhancedScreeningInterface.tsx         // Enhanced screening
MedicalReports.tsx                     // CSV export functionality
```

## 🔧 Implementation Patterns

### Tab Structure (All Screening Types)
```typescript
const [selectedTab, setSelectedTab] = useState(0);

<Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
  <Tab label="School Screening Students" icon={<School />} />
  <Tab label="Manual Registration" icon={<Person />} />
  <Tab label="Citizen Card Reader" icon={<CreditCard />} />
</Tabs>

// Tab content rendering
{selectedTab === 0 && <SchoolStudentsTab />}
{selectedTab === 1 && <ManualRegistrationTab />}
{selectedTab === 2 && <CardReaderTab />}
```

### CSV Export Implementation
```typescript
const exportToCSV = () => {
  const headers = ['Field1', 'Field2', 'Field3'];
  const data = [value1, value2, value3];
  
  const csvContent = [headers.join(','), data.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `filename-${date}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

## 📱 Patient Selection Workflow

### 1. School Screening Students
```typescript
// Filter students who completed school screenings
const schoolStudents = patients.filter(patient => 
  patient.school && patient.registration_status === 'screened'
);

// Search functionality
const filteredStudents = schoolStudents.filter(student =>
  student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### 2. Manual Registration
```typescript
// Add new patient form
const [newPatient, setNewPatient] = useState({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  school: '',
  grade: '',
  parent_name: '',
  parent_phone: ''
});

// Form submission
const handleAddPatient = async () => {
  // API call to create patient
  // Update patient list
  // Reset form
};
```

### 3. Citizen Card Reader
```typescript
// Simulate card reading
const handleCardRead = () => {
  const cardData = {
    citizen_id: '1234567890123',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01'
  };
  setCitizenCardData(cardData);
  setCitizenCardDialogOpen(true);
};
```

## 🎯 Screening Workflow States

### State Management
```typescript
const [activeStep, setActiveStep] = useState(0);
const [screeningResults, setScreeningResults] = useState<VisionResults>({});
const [screeningCompleted, setScreeningCompleted] = useState(false);

// Step navigation
const handleNext = () => setActiveStep(prev => prev + 1);
const handleBack = () => setActiveStep(prev => prev - 1);
```

### Workflow Steps
```typescript
const steps = [
  'Patient Selection',
  'Parent Consent',
  'Vision Assessment',
  'Glasses Prescription',
  'Glasses Fitting',
  'Delivery Planning',
  'Completion'
];
```

## 📊 Data Export Patterns

### CSV Structure for Mobile Screening
```typescript
const mobileScreeningHeaders = [
  'Patient ID', 'Patient Name', 'Date of Birth', 'School', 'Grade',
  'Screening Date', 'Left Eye Distance', 'Right Eye Distance',
  'Left Eye Near', 'Right Eye Near', 'Color Vision', 'Depth Perception',
  'Glasses Needed', 'Glasses Prescription', 'Glasses Fitted',
  'Glasses Delivered', 'Delivery Method', 'Delivery Date',
  'Overall Assessment', 'Academic Impact', 'Follow Up Required',
  'Follow Up Type', 'Follow Up Date', 'Screening Notes', 'Recommendations'
];
```

### CSV Structure for Medical Reports
```typescript
const medicalReportHeaders = [
  'Timestamp', 'Report Type', 'School', 'Total Students',
  'Total Screenings', 'Completed Screenings', 'Pending Screenings',
  'Vision Issues Detected', 'Referrals Required', 'Glasses Prescribed'
];
```

## 🔌 API Integration

### Screening Sessions
```typescript
// Create screening session
const response = await fetch('/api/v1/screenings/sessions/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    patient_id: selectedPatient?._id,
    examiner_id: user?.user_id,
    screening_type: 'mobile_vision_screening',
    results: screeningResults,
    workflow_completed: true
  })
});
```

### Patient Data
```typescript
// Fetch students
const studentsResponse = await fetch('/api/v1/evep/students', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Fetch appointments
const appointmentsResponse = await fetch('/api/v1/appointments', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🎨 UI Components

### Material-UI Components Used
```typescript
import {
  Box, Card, CardContent, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, Grid,
  FormControlLabel, Switch, Alert, CircularProgress, Divider,
  Paper, Stepper, Step, StepLabel, IconButton, Tooltip,
  Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
```

### Icons
```typescript
import {
  School, Person, CreditCard, Search, FilterList,
  Assessment, CheckCircle, Download, Add, Remove
} from '@mui/icons-material';
```

## 🚨 Common Issues & Solutions

### CSV Export Button Not Appearing
```typescript
// Check if screening is completed
{screeningCompleted && (
  <Button onClick={exportScreeningToCSV}>
    Export to CSV
  </Button>
)}

// Ensure state is set after completion
const handleScreeningComplete = async () => {
  // ... API call
  if (response.ok) {
    setScreeningCompleted(true); // This enables export button
  }
};
```

### Patient Data Not Loading
```typescript
// Check API connectivity
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      if (!token) {
        setError('No authentication token');
        return;
      }
      // ... fetch logic
    } catch (error) {
      setError('Failed to fetch data');
    }
  };
  fetchData();
}, []);
```

### Tab Navigation Issues
```typescript
// Ensure proper state management
const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  setSelectedTab(newValue);
  // Reset related states if needed
  setSearchTerm('');
  setSelectedPatient(null);
};
```

## 📝 Code Standards

### Naming Conventions
```typescript
// Functions
const handlePatientSelect = (patient: Patient) => { ... }
const exportScreeningToCSV = () => { ... }
const fetchPatients = async () => { ... }

// State variables
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [screeningResults, setScreeningResults] = useState<VisionResults>({});
const [loading, setLoading] = useState(false);

// Interfaces
interface Patient { ... }
interface VisionResults { ... }
interface ScreeningSession { ... }
```

### Error Handling
```typescript
try {
  setLoading(true);
  const response = await fetch(url, options);
  
  if (response.ok) {
    const data = await response.json();
    setSuccess('Operation completed successfully');
  } else {
    setError('Operation failed');
  }
} catch (error) {
  console.error('Error:', error);
  setError('Network error occurred');
} finally {
  setLoading(false);
}
```

## 🔄 Testing

### Component Testing
```typescript
// Test tab navigation
test('should switch between tabs', () => {
  render(<ScreeningForm />);
  const tab2 = screen.getByText('Manual Registration');
  fireEvent.click(tab2);
  expect(screen.getByText('Add New Patient')).toBeInTheDocument();
});

// Test CSV export
test('should export CSV after screening completion', () => {
  // Mock screening completion
  // Verify export button appears
  // Test export functionality
});
```

### API Testing
```typescript
// Test patient fetching
test('should fetch patients successfully', async () => {
  // Mock API response
  // Verify data loading
  // Check error handling
});
```

---

## 📚 Additional Resources

- **Full Documentation**: `docs/HOSPITAL_MOBILE_UNIT_WORKFLOW.md`
- **API Documentation**: Backend API docs
- **Component Library**: Material-UI documentation
- **TypeScript Guide**: Official TypeScript handbook

---

*This quick reference is maintained by the development team. For detailed information, refer to the full documentation.*

