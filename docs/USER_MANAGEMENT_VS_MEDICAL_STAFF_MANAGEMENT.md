# User Management vs Medical Staff Management

## Overview

The EVEP (Eye Vision Examination Platform) includes two distinct management systems for handling different types of users and staff members. This document outlines the key differences, use cases, and technical specifications for both systems.

## Table of Contents

- [System Overview](#system-overview)
- [Key Differences](#key-differences)
- [User Management System](#user-management-system)
- [Medical Staff Management System](#medical-staff-management-system)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Access Control & Permissions](#access-control--permissions)
- [Navigation & UI](#navigation--ui)
- [Best Practices](#best-practices)

---

## System Overview

### Purpose

The EVEP platform separates user administration into two specialized management systems:

1. **User Management**: System-wide user administration and access control
2. **Medical Staff Management**: Healthcare workforce management with clinical focus

### Architecture

```
EVEP Platform
├── User Management System
│   ├── System Authentication
│   ├── Role-Based Access Control (RBAC)
│   ├── Account Administration
│   └── System Permissions
└── Medical Staff Management System
    ├── Clinical Staff Registration
    ├── Medical Credentials Management
    ├── Training & Certification Tracking
    └── Healthcare Workforce Analytics
```

---

## Key Differences

| **Aspect** | **User Management** | **Medical Staff Management** |
|------------|-------------------|----------------------------|
| **Primary Purpose** | System administration & access control | Healthcare workforce management |
| **Target Audience** | System administrators, IT staff | Medical administrators, HR managers |
| **Data Focus** | User accounts, authentication, permissions | Medical credentials, training, specializations |
| **Scope** | Platform-wide user control | Clinical operations focused |
| **API Endpoint** | `/api/v1/user-management` | `/api/v1/medical-staff-management` |
| **Navigation Path** | `/dashboard/user-management` | `/dashboard/medical-staff` |

---

## User Management System

### Purpose & Scope

The User Management system handles **system-wide user administration** for all platform users, focusing on:

- User account creation and management
- Authentication and password management
- System role assignment and permissions
- Platform access control
- User profile management

### Supported Roles

```typescript
enum UserRoles {
  SUPER_ADMIN = "super_admin",      // Full system access
  SYSTEM_ADMIN = "system_admin",    // System administration
  MEDICAL_ADMIN = "medical_admin",  // Medical system admin
  DOCTOR = "doctor",                // Medical practitioner
  NURSE = "nurse",                  // Nursing staff
  OPTOMETRIST = "optometrist",      // Eye care specialist
  TECHNICIAN = "technician",        // Technical support
  COORDINATOR = "coordinator",      // Operations coordinator
  ASSISTANT = "assistant"           // Administrative assistant
}
```

### Data Model

```typescript
interface User {
  id: string;
  email: string;                    // Unique identifier
  password: string;                 // Hashed password
  first_name: string;
  last_name: string;
  role: UserRoles;                  // System role
  department?: string;              // Organizational unit
  phone?: string;
  avatar?: string;                  // Profile picture URL
  is_active: boolean;               // Account status
  last_login?: string;              // Last system access
  created_at: string;
  updated_at: string;
}
```

### Key Features

#### 1. Account Management
- ✅ Create new user accounts
- ✅ Edit user information
- ✅ Activate/deactivate accounts
- ✅ Password management
- ✅ Profile photo upload

#### 2. Role & Permission Management
- ✅ Assign system roles
- ✅ Role-based access control (RBAC)
- ✅ Permission inheritance
- ✅ Multi-level authorization

#### 3. User Analytics
- ✅ User statistics dashboard
- ✅ Login activity tracking
- ✅ Role distribution analytics
- ✅ Account status monitoring

### API Endpoints

```typescript
// User Management API
POST   /api/v1/user-management/              // Create user
GET    /api/v1/user-management/              // List users
GET    /api/v1/user-management/{id}          // Get user details
PUT    /api/v1/user-management/{id}          // Update user
DELETE /api/v1/user-management/{id}          // Deactivate user
POST   /api/v1/user-management/{id}/activate // Activate user
GET    /api/v1/user-management/statistics/overview // User statistics
```

---

## Medical Staff Management System

### Purpose & Scope

The Medical Staff Management system handles **healthcare workforce management** with focus on:

- Medical staff registration and onboarding
- Clinical credentials and license management
- Training and certification tracking
- Medical specialization assignments
- Healthcare department organization

### Supported Roles

```typescript
enum MedicalStaffRoles {
  DOCTOR = "doctor",                    // Medical doctor
  NURSE = "nurse",                      // Registered nurse
  MEDICAL_STAFF = "medical_staff",      // General medical staff
  EXCLUSIVE_HOSPITAL = "exclusive_hospital", // Hospital-specific staff
  TEACHER = "teacher",                  // School health staff
  SCHOOL_ADMIN = "school_admin",        // School health administrator
  SCHOOL_STAFF = "school_staff"         // School health support
}
```

### Data Model

```typescript
interface MedicalStaff {
  medical_staff_id: string;         // Unique medical staff identifier
  staff_id: string;                 // Employee ID
  email: string;
  first_name: string;
  last_name: string;
  role: MedicalStaffRoles;          // Medical role
  specialization: string;           // Medical specialty
  license_number: string;           // Medical license
  hire_date: Date;                  // Employment start date
  department?: string;              // Medical department
  supervisor_id?: string;           // Reporting manager
  credentials: Credential[];        // Medical credentials
  training: Training[];             // Training records
  qualifications: string[];         // Professional qualifications
  status: "active" | "inactive";    // Employment status
  created_at: Date;
  updated_at: Date;
}

interface Credential {
  credential_id: string;
  medical_staff_id: string;
  credential_type: string;          // License, Certificate, etc.
  issuing_authority: string;
  issue_date: Date;
  expiry_date?: Date;
  credential_number: string;
  status: "active" | "expired" | "suspended";
}

interface Training {
  training_id: string;
  medical_staff_id: string;
  training_name: string;
  training_type: string;
  completion_date: Date;
  expiry_date?: Date;
  training_hours: number;
  certification_body: string;
}
```

### Key Features

#### 1. Staff Registration & Management
- ✅ Medical staff onboarding
- ✅ Employee profile management
- ✅ Department assignments
- ✅ Supervisor hierarchy management

#### 2. Credentials & Licensing
- ✅ Medical license tracking
- ✅ Certification management
- ✅ Expiry date monitoring
- ✅ Renewal notifications

#### 3. Training & Development
- ✅ Training record management
- ✅ Continuing education tracking
- ✅ Certification maintenance
- ✅ Professional development planning

#### 4. Workforce Analytics
- ✅ Staff statistics dashboard
- ✅ Department distribution
- ✅ Credential status monitoring
- ✅ Training compliance tracking

### API Endpoints

```typescript
// Medical Staff Management API
POST   /api/v1/medical-staff-management/              // Create staff member
GET    /api/v1/medical-staff-management/              // List staff
GET    /api/v1/medical-staff-management/{id}          // Get staff details
PUT    /api/v1/medical-staff-management/{id}          // Update staff
DELETE /api/v1/medical-staff-management/{id}          // Remove staff
GET    /api/v1/medical-staff-management/statistics    // Staff statistics

// Credentials Management
POST   /api/v1/medical-staff-management/{id}/credentials    // Add credential
GET    /api/v1/medical-staff-management/{id}/credentials    // List credentials
PUT    /api/v1/medical-staff-management/credentials/{cred_id} // Update credential
DELETE /api/v1/medical-staff-management/credentials/{cred_id} // Remove credential

// Training Management
POST   /api/v1/medical-staff-management/{id}/training       // Add training
GET    /api/v1/medical-staff-management/{id}/training       // List training
PUT    /api/v1/medical-staff-management/training/{train_id} // Update training
DELETE /api/v1/medical-staff-management/training/{train_id} // Remove training
```

---

## Database Schema

### User Management Collections

```javascript
// users collection
{
  _id: ObjectId,
  email: String (unique),
  password_hash: String,
  first_name: String,
  last_name: String,
  role: String,
  department: String,
  phone: String,
  avatar: String,
  is_active: Boolean,
  last_login: Date,
  created_at: Date,
  updated_at: Date,
  blockchain_hash: String  // For enhanced security
}

// user_sessions collection
{
  _id: ObjectId,
  user_id: ObjectId,
  session_token: String,
  expires_at: Date,
  created_at: Date
}
```

### Medical Staff Management Collections

```javascript
// medical_staff collection
{
  _id: ObjectId,
  medical_staff_id: String (unique),
  staff_id: String,
  email: String,
  first_name: String,
  last_name: String,
  role: String,
  specialization: String,
  license_number: String,
  hire_date: Date,
  department: String,
  supervisor_id: String,
  status: String,
  created_at: Date,
  updated_at: Date
}

// staff_credentials collection
{
  _id: ObjectId,
  credential_id: String (unique),
  medical_staff_id: String,
  credential_type: String,
  issuing_authority: String,
  issue_date: Date,
  expiry_date: Date,
  credential_number: String,
  status: String,
  created_at: Date
}

// staff_training collection
{
  _id: ObjectId,
  training_id: String (unique),
  medical_staff_id: String,
  training_name: String,
  training_type: String,
  completion_date: Date,
  expiry_date: Date,
  training_hours: Number,
  certification_body: String,
  created_at: Date
}
```

---

## Access Control & Permissions

### User Management Permissions

| **Role** | **Create Users** | **Edit Users** | **Delete Users** | **View All Users** | **Manage Roles** |
|----------|------------------|----------------|------------------|-------------------|------------------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **System Admin** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Medical Admin** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Doctor** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Others** | ❌ | ❌ | ❌ | ❌ | ❌ |

### Medical Staff Management Permissions

| **Role** | **Create Staff** | **Edit Staff** | **Delete Staff** | **View Staff** | **Manage Credentials** |
|----------|------------------|----------------|------------------|----------------|----------------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Supervisor** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **HR Manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Doctor** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Nurse** | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Navigation & UI

### User Management Navigation

```
📍 Main Navigation: /dashboard/user-management/
├── 📂 User Directory (/dashboard/user-management/)
│   ├── 👁️ View all users (read-only)
│   ├── 🔍 Search and filter users
│   ├── 📊 User statistics overview
│   └── 🔗 Link to management interface
└── 📂 User Management (/dashboard/user-management/management)
    ├── ➕ Create new users
    ├── ✏️ Edit existing users
    ├── 🔄 Activate/deactivate users
    ├── 🖼️ Avatar upload management
    └── 📈 Detailed user analytics
```

### Medical Staff Management Navigation

```
📍 Main Navigation: /dashboard/medical-staff/
├── 📂 Staff Directory (/dashboard/medical-staff/)
│   ├── 👁️ View all medical staff (read-only)
│   ├── 🔍 Search by role, department, specialization
│   ├── 📊 Staff statistics overview
│   └── 🔗 Link to management interface
└── 📂 Staff Management (/dashboard/medical-staff/management)
    ├── ➕ Register new medical staff
    ├── ✏️ Edit staff profiles
    ├── 🏥 Manage credentials and licenses
    ├── 📚 Track training and certifications
    └── 📈 Workforce analytics
```

---

## Best Practices

### User Management Best Practices

1. **Security**
   - Always hash passwords using bcrypt
   - Implement strong password policies
   - Use JWT tokens with appropriate expiration
   - Enable two-factor authentication for admin roles

2. **Role Management**
   - Follow principle of least privilege
   - Regularly audit user permissions
   - Implement role inheritance where appropriate
   - Document role responsibilities clearly

3. **Data Management**
   - Soft delete users (deactivate instead of hard delete)
   - Maintain audit logs for all user changes
   - Regular backup of user data
   - GDPR compliance for user data handling

### Medical Staff Management Best Practices

1. **Credential Management**
   - Set up automated expiry notifications
   - Maintain digital copies of all credentials
   - Regular verification with issuing authorities
   - Track renewal requirements and deadlines

2. **Training Compliance**
   - Monitor continuing education requirements
   - Set up automated training reminders
   - Maintain comprehensive training records
   - Generate compliance reports regularly

3. **Data Accuracy**
   - Regular verification of staff information
   - Maintain up-to-date contact information
   - Verify supervisor relationships
   - Regular audit of department assignments

---

## Integration Points

### Shared Components

Both systems share certain components and services:

1. **Authentication Service** (`unifiedAuth.ts`)
   - Handles login/logout for both systems
   - Manages JWT tokens
   - Provides user context

2. **API Service** (`unifiedApi.ts`)
   - Unified HTTP client for both systems
   - Handles authentication headers
   - Provides consistent error handling

3. **Avatar Upload Component** (`AvatarUpload.tsx`)
   - Used in both user and staff profile management
   - Handles HTTPS file uploads to CDN
   - Provides consistent UI experience

### Data Synchronization

- User accounts may reference medical staff records
- Medical staff members must have corresponding user accounts for system access
- Role synchronization between systems for access control
- Audit trail maintenance across both systems

---

## Troubleshooting

### Common Issues

1. **User Management Issues**
   - Password field not visible in edit forms
   - Role assignment not working
   - Avatar upload HTTPS errors
   - API endpoint connection refused

2. **Medical Staff Management Issues**
   - Credential expiry notifications not working
   - Training records not updating
   - Department assignments not saving
   - Supervisor hierarchy conflicts

### Resolution Steps

1. **Check API Endpoints**
   ```bash
   # Verify user management API
   curl -H "Authorization: Bearer $TOKEN" \
        https://stardust.evep.my-firstcare.com/api/v1/user-management/
   
   # Verify medical staff API
   curl -H "Authorization: Bearer $TOKEN" \
        https://stardust.evep.my-firstcare.com/api/v1/medical-staff-management/
   ```

2. **Verify Permissions**
   - Check user role assignments
   - Verify RBAC configuration
   - Confirm API endpoint permissions

3. **Frontend Issues**
   - Clear browser cache
   - Check console for JavaScript errors
   - Verify API service configuration

---

## Conclusion

The separation of User Management and Medical Staff Management provides a clean architectural approach that:

- **Separates concerns** between system administration and healthcare operations
- **Provides specialized interfaces** for different user types
- **Maintains data integrity** through focused data models
- **Enables role-based access control** appropriate for each domain
- **Supports compliance requirements** for healthcare environments

This dual-system approach ensures that system administrators can focus on platform management while medical administrators can concentrate on healthcare workforce management, each with tools and interfaces designed for their specific needs.



