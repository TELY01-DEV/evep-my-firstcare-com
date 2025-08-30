# EVEP Platform - Separate Admin Panel Architecture

## 🎯 **Overview**

The EVEP Platform now has a **completely separate Admin Panel system** that is independent from the Medical Portal, while sharing the same backend API and database. This provides true separation of concerns, enhanced security, and better maintainability.

---

## 🏗️ **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVEP Platform Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Medical Portal│    │   Admin Panel   │    │   Backend API   │        │
│  │   (Port 3013)   │    │   (Port 3015)   │    │   (Port 8013)   │        │
│  │                 │    │                 │    │                 │        │
│  │ • Patient Mgmt  │    │ • User Mgmt     │    │ • Shared API    │        │
│  │ • Screenings    │    │ • System Config │    │ • Shared DB     │        │
│  │ • Reports       │    │ • Security      │    │ • Shared Auth   │        │
│  │ • Analytics     │    │ • Monitoring    │    │ • Shared Data   │        │
│  │ • Medical UI    │    │ • Admin UI      │    │ • Shared Logic  │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   │                                        │
│                    ┌─────────────────┐                                    │
│                    │   MongoDB DB    │                                    │
│                    │   (Port 27030)  │                                    │
│                    │                 │                                    │
│                    │ • users         │                                    │
│                    │ • admin_users   │                                    │
│                    │ • medical_staff_users │                              │
│                    │ • patients      │                                    │
│                    │ • screenings    │                                    │
│                    │ • school_screenings │                                │
│                    │ • system_settings │                                  │
│                    │ • audit_logs    │                                    │
│                    └─────────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Shared Resources**

### **Backend API (Port 8013)**
Both portals connect to the same backend API endpoints:

#### **Authentication Endpoints:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

#### **Admin Endpoints:**
- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/users` - Get all users
- `POST /api/v1/admin/users` - Create user
- `PUT /api/v1/admin/users/{id}` - Update user
- `DELETE /api/v1/admin/users/{id}` - Delete user
- `GET /api/v1/admin/settings` - Get system settings
- `PUT /api/v1/admin/settings` - Update system settings
- `GET /api/v1/admin/security/events` - Security events
- `GET /api/v1/admin/security/audit` - Audit logs

#### **Medical Endpoints:**
- `GET /api/v1/patients` - Get patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/screenings` - Get general screenings
- `POST /api/v1/screenings` - Create general screening
- `GET /api/v1/school-screenings` - Get school screenings
- `POST /api/v1/school-screenings` - Create school screening
- `GET /api/v1/medical-staff` - Get medical staff users
- `POST /api/v1/medical-staff` - Create medical staff user

### **Database Collections:**
- **`users`**: General users (teachers, parents, general users)
- **`admin_users`**: Admin panel users (admin, super_admin)
- **`medical_staff_users`**: Medical portal users (doctors, nurses, medical_staff, exclusive_hospital)
- **`patients`**: Patient records
- **`screenings`**: Vision screening data (general screenings)
- **`school_screenings`**: Vision screening data by teachers
- **`system_settings`**: Dynamic configuration
- **`audit_logs`**: Security audit trails

---

## 🎨 **Admin Panel Features**

### **📋 Menu Structure:**
1. **System Overview** - Dashboard with system statistics
2. **User Management** - General user management (teachers, parents)
3. **Admin Panel Users** - Manage admin panel access (admin, super_admin)
4. **Medical Staff Users** - Manage medical portal users (doctors, nurses, medical_staff, exclusive_hospital)
5. **System Configuration** - MongoDB-based settings
6. **Security & Audit** - Security monitoring and logs
7. **Database Management** - Database operations
8. **System Monitoring** - Performance and metrics
9. **Backup & Recovery** - System backup operations

### **🔐 Authentication:**
- **Separate Token Storage**: Uses `evep_admin_token` instead of `evep_token`
- **Role Validation**: Only allows `admin` and `super_admin` roles
- **Access Control**: Prevents non-admin users from accessing admin panel
- **Session Management**: Independent session handling

### **🎨 Visual Design:**
- **Dark Blue Theme**: Professional admin color scheme
- **Admin Badge**: "ADMIN" chip in app bar
- **Gradient Headers**: Modern gradient backgrounds
- **Professional Typography**: Clean, technical styling

---

## 🏥 **Medical Portal Features**

### **📋 Menu Structure:**
1. **Dashboard** - Medical overview
2. **Patient Management** - Patient records
3. **Vision Screenings** - Screening tests
4. **Medical Reports** - Medical analytics
5. **Health Analytics** - Health data trends

### **👥 User Types:**
- **Doctors**: Medical professionals with full access
- **Nurses**: Medical staff with patient management access
- **Medical Staff**: Support staff with limited access
- **Exclusive Hospital**: Hospital-specific users with specialized access

### **🎨 Visual Design:**
- **Medical Blue Theme**: Medical professional color scheme
- **Clean Interface**: Simplified medical interface
- **Patient-Centric**: Focused on patient care
- **Medical Typography**: Medical professional styling

---

## 🔧 **Technical Implementation**

### **Admin Panel Structure:**
```
admin-panel/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── AdminLayout.tsx
│   │   └── Auth/
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── LoginPage.tsx
│   │   ├── UserManagement.tsx
│   │   ├── AdminUserManagement.tsx
│   │   ├── MedicalUserManagement.tsx
│   │   ├── SystemSettings.tsx
│   │   ├── SecurityAudit.tsx
│   │   ├── DatabaseManagement.tsx
│   │   ├── SystemMonitoring.tsx
│   │   └── BackupRecovery.tsx
│   ├── contexts/
│   │   └── AdminAuthContext.tsx
│   ├── theme/
│   │   └── adminTheme.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
│   ├── index.html
│   └── evep-logo.png
├── package.json
├── Dockerfile
└── nginx.conf
```

### **Medical Portal Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── MedicalLayout.tsx
│   │   └── Auth/
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   ├── Screenings.tsx
│   │   └── Reports.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── theme/
│   │   └── medicalTheme.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
├── Dockerfile
└── nginx.conf
```

---

## 🚀 **Deployment Configuration**

### **Docker Compose Services:**

#### **Admin Panel Service:**
```yaml
admin-panel:
  build:
    context: ./admin-panel
    dockerfile: Dockerfile
  container_name: evep-admin-panel
  ports:
    - "3015:3000"
  environment:
    - REACT_APP_API_URL=http://localhost:8013
    - REACT_APP_ENVIRONMENT=development
  volumes:
    - ./admin-panel:/app
    - /app/node_modules
  depends_on:
    - backend
  networks:
    - evep-network
  restart: unless-stopped
```

#### **Medical Portal Service:**
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: evep-frontend
  ports:
    - "3013:3000"
  environment:
    - REACT_APP_API_URL=http://localhost:8013
    - REACT_APP_ENVIRONMENT=development
  volumes:
    - ./frontend:/app
    - /app/node_modules
  depends_on:
    - backend
  networks:
    - evep-network
  restart: unless-stopped
```

---

## 🔐 **Security Benefits**

### **1. Complete Separation:**
- **Independent Codebases**: No shared frontend code
- **Separate Authentication**: Different token storage
- **Isolated Sessions**: Independent session management
- **Role-Based Access**: Strict role validation

### **2. Enhanced Security:**
- **No Cross-Contamination**: Medical users cannot access admin features
- **Separate Tokens**: Different authentication tokens
- **Access Control**: Role-based access at both frontend and backend
- **Audit Trail**: Separate audit logs for admin actions

### **3. Data Protection:**
- **Shared Database**: Single source of truth
- **Consistent Data**: No data synchronization issues
- **Backup Strategy**: Unified backup and recovery
- **Data Integrity**: Consistent data across portals

---

## 📊 **Key Benefits**

### **For Administrators:**
- **Dedicated Interface**: Clean, admin-focused UI
- **Full Control**: Complete system management
- **Security**: Isolated admin functions
- **Efficiency**: Streamlined admin workflows

### **For Medical Professionals:**
- **Medical Focus**: Patient-centric interface
- **Simplified Navigation**: Medical-specific menu
- **Reduced Complexity**: No technical distractions
- **Better UX**: Intuitive medical workflows

### **For System Security:**
- **Role Separation**: Clear access boundaries
- **Audit Trail**: Separate admin actions
- **Access Control**: Role-based permissions
- **Data Protection**: Isolated data access

### **For Development:**
- **Maintainability**: Separate codebases
- **Scalability**: Independent scaling
- **Testing**: Isolated testing environments
- **Deployment**: Independent deployments

---

## 🌐 **Access Information**

### **Development Environment:**
```
Medical Portal: http://localhost:3013
Admin Panel: http://localhost:3015
Backend API: http://localhost:8013
Database: localhost:27030
```

### **Production Environment:**
```
Medical Portal: https://portal.evep.my-firstcare.com
Admin Panel: https://admin.evep.my-firstcare.com
Backend API: https://api.evep.my-firstcare.com
```

---

## 🔧 **Development Workflow**

### **1. Admin Panel Development:**
```bash
# Navigate to admin panel
cd admin-panel

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### **2. Medical Portal Development:**
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### **3. Backend Development:**
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8013
```

---

## 📝 **Current Status**

### **✅ Completed:**
- [x] **Separate Admin Panel**: Complete independent system
- [x] **Dedicated Authentication**: Admin-specific auth context
- [x] **Professional UI**: Admin-focused design
- [x] **Docker Configuration**: Separate container setup
- [x] **Routing Structure**: Complete admin navigation
- [x] **Theme System**: Professional admin theme
- [x] **Security Implementation**: Role-based access control

### **🔧 Technical Stack:**
- **Admin Panel**: React + TypeScript + Material-UI
- **Medical Portal**: React + TypeScript + Material-UI
- **Backend**: FastAPI + Python + MongoDB
- **Database**: MongoDB with separate collections
- **Authentication**: JWT with role-based access
- **Deployment**: Docker + Docker Compose

### **🎯 Next Steps:**
1. **Implement Full Features**: Complete all admin panel pages
2. **API Integration**: Connect to shared backend endpoints
3. **Testing**: Comprehensive testing for both portals
4. **Production Deployment**: Deploy to production environment
5. **Monitoring**: Add monitoring and logging

---

## 🎯 **Summary**

The EVEP Platform now has a **completely separate Admin Panel system** that provides:

1. **True Separation**: Independent frontend applications
2. **Shared Backend**: Single API and database
3. **Enhanced Security**: Role-based access control
4. **Professional UI**: Admin-focused interface
5. **Scalable Architecture**: Independent development and deployment
6. **Data Consistency**: Single source of truth
7. **Maintainability**: Separate codebases

**🔧 The EVEP Platform now has a truly separate Admin Panel that maintains data consistency while providing complete functional and visual separation from the Medical Portal!**
