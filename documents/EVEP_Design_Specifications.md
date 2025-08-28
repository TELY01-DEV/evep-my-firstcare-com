# EVEP Design Specifications

## 🎨 **UI/UX Design System**

### **Design Principles**
- **Accessibility First**: WCAG 2.1 AA compliance for all users
- **Child-Friendly Interface**: Age-appropriate design for 6-12 year olds
- **Medical Professional**: Clean, clinical interface for healthcare providers
- **Responsive Design**: Mobile-first approach with cross-platform compatibility
- **Cultural Sensitivity**: Thai and English language support with cultural considerations

### **Color Palette**
```css
/* Primary Colors */
--primary-blue: #2563eb;      /* Trust, medical, professional */
--primary-green: #10b981;     /* Health, success, positive */
--accent-orange: #f59e0b;     /* Attention, warnings, children */
--neutral-gray: #6b7280;      /* Text, borders, secondary */

/* Semantic Colors */
--success: #059669;           /* Positive actions, good results */
--warning: #d97706;           /* Caution, attention needed */
--error: #dc2626;             /* Errors, critical issues */
--info: #2563eb;              /* Information, neutral */

/* Background Colors */
--bg-primary: #ffffff;        /* Main background */
--bg-secondary: #f9fafb;      /* Secondary background */
--bg-tertiary: #f3f4f6;       /* Cards, sections */
--bg-dark: #111827;           /* Dark mode background */
```

### **Typography System**
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-secondary: 'Noto Sans Thai', 'Inter', sans-serif;
--font-display: 'Poppins', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px - Captions, labels */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Large text */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Section headers */
--text-3xl: 1.875rem;  /* 30px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Hero titles */
```

### **Component Library**

#### **1. Navigation Components**
```jsx
// Header Navigation
<Header>
  <Logo />
  <PrimaryNav>
    <NavItem>Dashboard</NavItem>
    <NavItem>Patients</NavItem>
    <NavItem>Screenings</NavItem>
    <NavItem>Reports</NavItem>
  </PrimaryNav>
  <UserMenu>
    <Avatar />
    <DropdownMenu />
  </UserMenu>
</Header>

// Sidebar Navigation
<Sidebar>
  <SidebarItem icon="dashboard" label="Dashboard" />
  <SidebarItem icon="users" label="Patients" />
  <SidebarItem icon="eye" label="Screenings" />
  <SidebarItem icon="chart" label="Analytics" />
  <SidebarItem icon="settings" label="Settings" />
</Sidebar>
```

#### **2. Form Components**
```jsx
// Patient Registration Form
<Form>
  <FormSection title="Personal Information">
    <InputField
      label="First Name"
      placeholder="Enter first name"
      validation={required}
    />
    <InputField
      label="Last Name"
      placeholder="Enter last name"
      validation={required}
    />
    <DatePicker
      label="Date of Birth"
      validation={required}
    />
    <SelectField
      label="Gender"
      options={genderOptions}
      validation={required}
    />
  </FormSection>
  
  <FormSection title="Medical History">
    <CheckboxGroup
      label="Allergies"
      options={allergyOptions}
    />
    <TextArea
      label="Additional Notes"
      placeholder="Enter any additional medical information"
    />
  </FormSection>
</Form>
```

#### **3. Data Display Components**
```jsx
// Patient Card
<PatientCard>
  <PatientAvatar />
  <PatientInfo>
    <PatientName>John Doe</PatientName>
    <PatientAge>8 years old</PatientAge>
    <PatientStatus status="active" />
  </PatientInfo>
  <PatientActions>
    <Button variant="primary">View Details</Button>
    <Button variant="secondary">Start Screening</Button>
  </PatientActions>
</PatientCard>

// Screening Results Table
<DataTable>
  <TableHeader>
    <TableColumn>Date</TableColumn>
    <TableColumn>Test Type</TableColumn>
    <TableColumn>Results</TableColumn>
    <TableColumn>Status</TableColumn>
    <TableColumn>Actions</TableColumn>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>2024-01-15</TableCell>
      <TableCell>Vision Screening</TableCell>
      <TableCell>20/20</TableCell>
      <TableCell><StatusBadge status="normal" /></TableCell>
      <TableCell><ActionMenu /></TableCell>
    </TableRow>
  </TableBody>
</DataTable>
```

#### **4. Interactive Components**
```jsx
// Vision Screening Interface
<ScreeningInterface>
  <ScreeningHeader>
    <ProgressIndicator step={2} total={5} />
    <Timer duration={300} />
  </ScreeningHeader>
  
  <ScreeningContent>
    <EyeChart
      type="Snellen"
      size="large"
      distance={20}
    />
    <ResponseButtons>
      <Button size="large">I can see it</Button>
      <Button size="large" variant="secondary">I cannot see it</Button>
    </ResponseButtons>
  </ScreeningContent>
  
  <ScreeningControls>
    <Button variant="outline">Previous</Button>
    <Button variant="primary">Next</Button>
  </ScreeningControls>
</ScreeningInterface>
```

### **Responsive Breakpoints**
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### **Animation & Transitions**
```css
/* Micro-interactions */
--transition-fast: 150ms ease-in-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;

/* Hover Effects */
.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all var(--transition-normal);
}

/* Loading States */
.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 🏗️ **System Architecture Design**

### **Frontend Architecture**
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form components
│   ├── navigation/     # Navigation components
│   └── screens/        # Screen-specific components
├── pages/              # Page components
│   ├── dashboard/      # Dashboard pages
│   ├── patients/       # Patient management
│   ├── screenings/     # Screening interface
│   └── reports/        # Reporting pages
├── hooks/              # Custom React hooks
├── services/           # API services
├── store/              # State management
├── utils/              # Utility functions
└── types/              # TypeScript definitions
```

### **Backend Architecture**
```
backend/
├── app/
│   ├── api/            # API routes
│   │   ├── v1/         # API version 1
│   │   └── websockets/ # WebSocket handlers
│   ├── core/           # Core functionality
│   │   ├── auth/       # Authentication
│   │   ├── database/   # Database models
│   │   └── services/   # Business logic
│   ├── ml/             # AI/ML services
│   │   ├── models/     # ML models
│   │   ├── training/   # Model training
│   │   └── inference/  # Model inference
│   └── utils/          # Utility functions
├── tests/              # Test files
├── migrations/         # Database migrations
└── config/             # Configuration files
```

### **Database Design Patterns**

#### **1. Repository Pattern**
```python
class PatientRepository:
    def __init__(self, db: Database):
        self.db = db
    
    async def create(self, patient_data: PatientCreate) -> Patient:
        # Implementation
        pass
    
    async def get_by_id(self, patient_id: str) -> Optional[Patient]:
        # Implementation
        pass
    
    async def update(self, patient_id: str, patient_data: PatientUpdate) -> Patient:
        # Implementation
        pass
```

#### **2. Service Layer Pattern**
```python
class PatientService:
    def __init__(self, patient_repo: PatientRepository):
        self.patient_repo = patient_repo
    
    async def create_patient(self, patient_data: PatientCreate) -> Patient:
        # Business logic validation
        # Data processing
        # Repository call
        return await self.patient_repo.create(patient_data)
```

#### **3. Event-Driven Architecture**
```python
class ScreeningCompletedEvent:
    def __init__(self, screening_id: str, results: dict):
        self.screening_id = screening_id
        self.results = results
        self.timestamp = datetime.utcnow()

class EventHandler:
    async def handle_screening_completed(self, event: ScreeningCompletedEvent):
        # Trigger AI analysis
        # Send notifications
        # Update analytics
        pass
```

### **API Design Patterns**

#### **1. RESTful API Design**
```python
@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get patient by ID"""
    pass

@router.post("/patients")
async def create_patient(patient: PatientCreate):
    """Create new patient"""
    pass

@router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient: PatientUpdate):
    """Update patient"""
    pass

@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete patient"""
    pass
```

#### **2. GraphQL Schema Design**
```graphql
type Patient {
  id: ID!
  firstName: String!
  lastName: String!
  dateOfBirth: Date!
  screenings: [Screening!]!
  medicalHistory: MedicalHistory
}

type Screening {
  id: ID!
  patientId: ID!
  testType: TestType!
  results: ScreeningResults!
  aiAnalysis: AIAnalysis
  createdAt: DateTime!
}

type Query {
  patient(id: ID!): Patient
  patients(filter: PatientFilter): [Patient!]!
  screening(id: ID!): Screening
}
```

### **Security Design Patterns**

#### **1. JWT Authentication**
```python
class JWTAuth:
    def create_token(self, user_id: str, role: str) -> str:
        payload = {
            "user_id": user_id,
            "role": role,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    
    def verify_token(self, token: str) -> dict:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
```

#### **2. Role-Based Access Control**
```python
def require_role(required_role: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Check user role
            # Verify permissions
            return await func(*args, **kwargs)
        return wrapper
    return decorator

@require_role("doctor")
async def update_patient_diagnosis(patient_id: str, diagnosis: str):
    # Only doctors can update diagnosis
    pass
```

#### **3. Data Encryption**
```python
class DataEncryption:
    def __init__(self, key: bytes):
        self.cipher = AES.new(key, AES.MODE_GCM)
    
    def encrypt(self, data: str) -> bytes:
        ciphertext, tag = self.cipher.encrypt_and_digest(data.encode())
        return ciphertext + tag
    
    def decrypt(self, encrypted_data: bytes) -> str:
        ciphertext = encrypted_data[:-16]
        tag = encrypted_data[-16:]
        plaintext = self.cipher.decrypt_and_verify(ciphertext, tag)
        return plaintext.decode()
```

## 📱 **Mobile App Design**

### **React Native Architecture**
```
mobile/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation setup
│   ├── services/       # API services
│   ├── store/          # State management
│   └── utils/          # Utility functions
├── android/            # Android specific
├── ios/                # iOS specific
└── assets/             # Images, fonts, etc.
```

### **Mobile-Specific Components**
```jsx
// Camera Integration
<CameraView
  onCapture={handleImageCapture}
  onError={handleCameraError}
  style={styles.camera}
>
  <CameraOverlay />
  <CaptureButton onPress={captureImage} />
</CameraView>

// Offline Support
<OfflineIndicator>
  <Text>Working offline</Text>
  <SyncButton onPress={syncData} />
</OfflineIndicator>

// Push Notifications
<NotificationHandler>
  <NotificationPermission />
  <NotificationSettings />
</NotificationHandler>
```

## 🎯 **Design System Guidelines**

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Clear focus indicators and logical tab order

### **Performance Guidelines**
- **Lazy Loading**: Components and images load on demand
- **Code Splitting**: Route-based code splitting
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Service worker for offline support
- **Bundle Optimization**: Tree shaking and minification

### **Internationalization**
- **Multi-language Support**: Thai and English
- **RTL Support**: Right-to-left language support
- **Cultural Adaptations**: Localized content and imagery
- **Number Formatting**: Localized number and date formats
- **Currency Support**: Local currency display

This design specification provides a comprehensive foundation for building a consistent, accessible, and scalable EVEP platform.
