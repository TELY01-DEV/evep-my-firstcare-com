# EVEP Admin Panel Documentation

## Overview

The EVEP Admin Panel is a separate, secure interface designed specifically for system administrators to manage the EVEP (EYE Vision Evaluation Platform) system. It provides comprehensive user management, system monitoring, and administrative controls with role-based access control.

## Table of Contents

1. [Architecture](#architecture)
2. [Security Model](#security-model)
3. [Admin Panel Features](#admin-panel-features)
4. [API Endpoints](#api-endpoints)
5. [User Management](#user-management)
6. [System Monitoring](#system-monitoring)
7. [Access Control](#access-control)
8. [Audit Trail](#audit-trail)
9. [Installation & Setup](#installation--setup)
10. [Usage Guide](#usage-guide)
11. [Troubleshooting](#troubleshooting)

## Architecture

### Frontend Components

```
frontend/src/
├── pages/
│   ├── Admin.tsx                 # Admin page wrapper
│   ├── AdminDashboard.tsx        # Main admin dashboard
│   └── AdminUsers.tsx            # User management interface
├── components/
│   ├── Layout/
│   │   └── AdminLayout.tsx       # Admin-specific layout
│   └── Auth/
│       └── AdminRoute.tsx        # Admin route protection
└── App.tsx                       # Admin routes integration
```

### Backend API Structure

```
backend/app/api/
└── admin.py                      # Admin API endpoints
    ├── System Statistics         # GET /api/v1/admin/stats
    ├── User Management           # CRUD operations for users
    ├── Role Management           # Role assignment and permissions
    └── Audit Logging             # Blockchain-based audit trail
```

## Security Model

### Role-Based Access Control (RBAC)

The admin panel implements a strict RBAC system:

- **Admin Role**: Full access to admin panel and all administrative functions
- **Medical Roles**: Restricted access to medical professional features only
- **Route Protection**: Automatic redirection for unauthorized access

### Authentication Flow

1. **Login Verification**: JWT token validation
2. **Role Check**: Verify user has `role: "admin"`
3. **Route Protection**: AdminRoute component enforces access control
4. **API Protection**: All admin endpoints require admin role

### Security Features

- ✅ **JWT Token Validation**: Secure authentication
- ✅ **Role Verification**: Admin-only access
- ✅ **Audit Trail**: All actions logged with blockchain hashes
- ✅ **Soft Delete**: Users deactivated rather than permanently deleted
- ✅ **Input Validation**: Pydantic models for data validation

## Admin Panel Features

### 1. Admin Dashboard

**Purpose**: System overview and monitoring

**Features**:
- Real-time system statistics
- User activity monitoring
- System health indicators
- Quick action buttons
- Recent activity feed

**Statistics Displayed**:
- Total Users
- Total Patients
- Total Screenings
- Active Users (last 24 hours)
- System Health Status
- Storage Usage
- Last Backup Time

### 2. User Management

**Purpose**: Comprehensive user administration

**Features**:
- View all system users
- Create new users
- Edit existing users
- Activate/deactivate users
- Delete users (soft delete)
- Role assignment
- Organization management

**User Roles Supported**:
- **Admin**: Full system access
- **Doctor**: Medical professional access
- **Nurse**: Medical professional access
- **Teacher**: Educational access
- **Parent**: Limited access

### 3. System Settings (Placeholder)

**Purpose**: System configuration management

**Planned Features**:
- System parameters configuration
- Email settings
- Notification preferences
- Security settings
- Backup configuration

### 4. Security Audit (Placeholder)

**Purpose**: Security monitoring and compliance

**Planned Features**:
- Security event logs
- Login attempt monitoring
- Suspicious activity detection
- Compliance reporting

### 5. Data Management (Placeholder)

**Purpose**: Data backup and recovery

**Planned Features**:
- Automated backup scheduling
- Manual backup creation
- Data restoration
- Backup verification

## API Endpoints

### System Statistics

```http
GET /api/v1/admin/stats
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "totalUsers": 3,
  "totalPatients": 0,
  "totalScreenings": 0,
  "activeUsers": 1,
  "systemHealth": "healthy",
  "storageUsage": 65,
  "lastBackup": "2025-08-28T10:00:00Z"
}
```

### User Management

#### Get All Users
```http
GET /api/v1/admin/users
Authorization: Bearer <admin_token>
```

#### Create User
```http
POST /api/v1/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "organization": "Medical Center",
  "password": "securepassword",
  "is_active": true
}
```

#### Update User
```http
PUT /api/v1/admin/users/{user_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "first_name": "Updated Name",
  "role": "nurse",
  "is_active": false
}
```

#### Update User Status
```http
PATCH /api/v1/admin/users/{user_id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_active": true
}
```

#### Delete User
```http
DELETE /api/v1/admin/users/{user_id}
Authorization: Bearer <admin_token>
```

## User Management

### User Creation Process

1. **Form Validation**: Client-side validation for required fields
2. **Email Uniqueness**: Check for existing email addresses
3. **Password Hashing**: Secure password storage using bcrypt
4. **Role Assignment**: Assign appropriate role and permissions
5. **Audit Logging**: Log user creation with blockchain hash
6. **Database Storage**: Store user in MongoDB with audit trail

### User Update Process

1. **Permission Check**: Verify admin has permission to update
2. **Data Validation**: Validate updated fields
3. **Audit Trail**: Generate new blockchain hash for changes
4. **Database Update**: Update user record with audit information
5. **Logging**: Log all changes for compliance

### User Deactivation Process

1. **Soft Delete**: Mark user as inactive instead of hard delete
2. **Session Invalidation**: Invalidate active sessions
3. **Audit Logging**: Log deactivation with timestamp
4. **Data Preservation**: Maintain user data for compliance

## System Monitoring

### Real-time Statistics

The admin dashboard provides real-time system metrics:

- **User Counts**: Total and active users
- **Data Metrics**: Patients and screenings counts
- **System Health**: Overall system status
- **Storage Usage**: Current storage utilization
- **Backup Status**: Last backup timestamp

### Health Monitoring

- **Database Connectivity**: MongoDB connection status
- **API Performance**: Response time monitoring
- **Error Tracking**: System error logging
- **Resource Usage**: CPU and memory monitoring

## Access Control

### Admin Route Protection

```typescript
// AdminRoute.tsx - Role-based access control
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem('evep_token');
      const userStr = localStorage.getItem('evep_user');
      
      if (!token || !userStr) {
        setIsAdmin(false);
        return;
      }

      // Decode JWT and check role
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### API Endpoint Protection

```python
# admin.py - Admin-only endpoint protection
@router.get("/stats")
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    # Check if user has admin permissions
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Admin functionality here...
```

## Audit Trail

### Blockchain-Based Audit Logging

All admin actions are logged with blockchain hashes for immutability:

```python
# Generate blockchain hash for audit
audit_hash = generate_blockchain_hash(
    f"user_creation:{user_data.email}:{current_user['user_id']}"
)

# Log user creation
await audit_logs_collection.insert_one({
    "action": "user_created",
    "user_id": current_user["user_id"],
    "target_user_id": str(result.inserted_id),
    "timestamp": settings.get_current_timestamp(),
    "audit_hash": audit_hash,
    "details": {
        "user_email": user_data.email,
        "user_role": user_data.role,
        "created_by": current_user["email"]
    }
})
```

### Audit Log Structure

```json
{
  "action": "user_created|user_updated|user_deleted|user_status_updated",
  "user_id": "admin_user_id",
  "target_user_id": "affected_user_id",
  "timestamp": "2025-08-28T09:25:46.916721",
  "audit_hash": "blockchain_hash",
  "details": {
    "user_email": "user@example.com",
    "user_role": "doctor",
    "created_by": "admin@evep.com"
  }
}
```

## Installation & Setup

### Prerequisites

- EVEP Platform running with Docker
- MongoDB database initialized
- Admin user created in the system

### Setup Steps

1. **Start EVEP Platform**:
   ```bash
   docker-compose up -d
   ```

2. **Initialize Demo Users**:
   ```bash
   docker exec evep-backend python init-demo-users.py
   ```

3. **Access Admin Panel**:
   - URL: `http://localhost:3013/admin`
   - Login: `admin@evep.com` / `demo123`

### Environment Configuration

Ensure the following environment variables are set:

```env
# Database
DATABASE_URL=mongodb://mongo-primary:27017/evep

# JWT Settings
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin Settings
ADMIN_EMAIL=admin@evep.com
ADMIN_PASSWORD=demo123
```

## Usage Guide

### Accessing the Admin Panel

1. **Navigate to Admin Panel**:
   ```
   http://localhost:3013/admin
   ```

2. **Login with Admin Credentials**:
   ```
   Email: admin@evep.com
   Password: demo123
   ```

3. **Verify Admin Access**:
   - Should redirect to admin dashboard
   - Non-admin users will be redirected to login

### Managing Users

#### Creating a New User

1. **Navigate to User Management**:
   - Click "User Management" in sidebar
   - Or go to `/admin/users`

2. **Add New User**:
   - Click "Add User" button
   - Fill in required fields:
     - First Name
     - Last Name
     - Email
     - Organization
     - Role
     - Password
   - Click "Create"

3. **Verify User Creation**:
   - User appears in user list
   - Audit log entry created

#### Editing a User

1. **Find User in List**:
   - Use search or pagination
   - Click "Edit" button for target user

2. **Update Information**:
   - Modify desired fields
   - Click "Update"

3. **Verify Changes**:
   - Changes reflected in user list
   - Audit log entry created

#### Deactivating a User

1. **Find User in List**:
   - Locate user to deactivate

2. **Toggle Status**:
   - Click lock/unlock icon
   - Confirm action

3. **Verify Deactivation**:
   - User status shows "Inactive"
   - User cannot login

### Monitoring System

#### View System Statistics

1. **Access Dashboard**:
   - Navigate to `/admin`
   - View system overview

2. **Monitor Metrics**:
   - Total users count
   - Active users count
   - System health status
   - Storage usage

3. **Check Recent Activity**:
   - View activity feed
   - Monitor user actions

## Troubleshooting

### Common Issues

#### 1. Admin Panel Not Accessible

**Symptoms**: Redirected to login despite admin credentials

**Solutions**:
- Verify user role is "admin" in database
- Check JWT token validity
- Clear browser cache and localStorage
- Restart frontend container

#### 2. API Endpoints Return 403

**Symptoms**: Admin API calls return "Admin access required"

**Solutions**:
- Verify user role in JWT token
- Check if user exists and is active
- Ensure proper Authorization header
- Verify admin user in database

#### 3. User Management Not Working

**Symptoms**: Cannot create, edit, or delete users

**Solutions**:
- Check MongoDB connection
- Verify admin permissions
- Check audit log collection
- Review backend logs

#### 4. System Statistics Not Loading

**Symptoms**: Dashboard shows no data or errors

**Solutions**:
- Check database connectivity
- Verify collection access
- Review backend logs
- Check API endpoint availability

### Debug Commands

#### Check Admin User Status

```bash
# Connect to MongoDB
docker exec -it evep-mongo-primary mongosh

# Check admin user
use evep
db.users.find({role: "admin"})
```

#### Verify API Endpoints

```bash
# Test admin stats endpoint
curl -X GET http://localhost:8013/api/v1/admin/stats \
  -H "Authorization: Bearer <admin_token>"

# Test user list endpoint
curl -X GET http://localhost:8013/api/v1/admin/users \
  -H "Authorization: Bearer <admin_token>"
```

#### Check Backend Logs

```bash
# View backend logs
docker logs evep-backend

# Follow logs in real-time
docker logs -f evep-backend
```

### Performance Optimization

#### Database Indexing

Ensure proper indexes for admin queries:

```javascript
// MongoDB indexes for admin performance
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "is_active": 1 })
db.users.createIndex({ "created_at": -1 })
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "user_id": 1 })
```

#### Caching Strategy

Implement caching for frequently accessed data:

- System statistics (5-minute cache)
- User list (1-minute cache)
- Role permissions (session cache)

## Future Enhancements

### Planned Features

1. **Advanced User Management**:
   - Bulk user operations
   - User import/export
   - Advanced filtering and search

2. **System Configuration**:
   - Email server settings
   - Notification preferences
   - Security policies

3. **Monitoring & Analytics**:
   - Real-time system monitoring
   - Performance analytics
   - Usage statistics

4. **Backup & Recovery**:
   - Automated backup scheduling
   - Point-in-time recovery
   - Backup verification

5. **Security Features**:
   - Two-factor authentication
   - IP whitelisting
   - Session management

### Integration Opportunities

1. **External Systems**:
   - LDAP/Active Directory integration
   - SSO (Single Sign-On)
   - Third-party authentication

2. **Reporting**:
   - Custom report generation
   - Data export capabilities
   - Compliance reporting

3. **Automation**:
   - Automated user provisioning
   - Scheduled maintenance tasks
   - Alert notifications

## Conclusion

The EVEP Admin Panel provides a comprehensive, secure, and scalable solution for system administration. With its role-based access control, audit trail, and user management capabilities, it ensures proper governance of the EVEP platform while maintaining security and compliance requirements.

The modular architecture allows for easy extension and enhancement as the platform grows, making it a solid foundation for future administrative features and integrations.
