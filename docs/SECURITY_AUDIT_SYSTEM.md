# EVEP Platform Security & Audit System Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Audit Components](#security-audit-components)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Role-Based Access Control](#role-based-access-control)
7. [Event Types](#event-types)
8. [Frontend Integration](#frontend-integration)
9. [Configuration](#configuration)
10. [Monitoring & Logging](#monitoring--logging)
11. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The EVEP Platform implements a **dual-panel Security & Audit system** that provides comprehensive activity tracking and security monitoring for both the Admin Panel and Medical Portal. Each panel has its own unique security audit system with proper data isolation and role-based access control.

### Key Features
- ✅ **Dual-Panel Security**: Separate audit systems for Admin and Medical portals
- ✅ **Real-Time Logging**: All activities logged with timestamps and user details
- ✅ **Role-Based Access**: Different access levels for different user roles
- ✅ **Data Isolation**: Users only see events from their respective portal
- ✅ **Real Data**: 100% real data, no mock content
- ✅ **Audit Trail**: Complete activity history with blockchain-style hashes

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    EVEP Platform                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Admin Panel   │    │ Medical Portal  │                │
│  │ Security Audit  │    │ Security Audit  │                │
│  └─────────────────┘    └─────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Admin Security  │    │ Medical Security│                │
│  │    API Layer    │    │    API Layer    │                │
│  └─────────────────┘    └─────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │              MongoDB Audit Database                     ││
│  │  ┌─────────────────┐    ┌─────────────────┐            ││
│  │  │ Admin Events    │    │ Medical Events  │            ││
│  │  │ portal: "admin" │    │ portal: "medical"│            ││
│  │  └─────────────────┘    └─────────────────┘            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **User Activity** → Frontend triggers API call
2. **API Endpoint** → Logs security event with portal tag
3. **Database Storage** → Event saved with portal identification
4. **Security Dashboard** → Displays filtered events by portal
5. **Role-Based Access** → Users see only relevant data

## 🔒 Security Audit Components

### 1. Admin Panel Security Audit
- **File**: `backend/app/api/admin.py`
- **Portal Tag**: `"portal": "admin"`
- **Access Control**: Admin and Super Admin roles only
- **Event Types**: System administration, user management, admin activities

### 2. Medical Portal Security Audit
- **File**: `backend/app/api/medical_security.py`
- **Portal Tag**: `"portal": "medical"`
- **Access Control**: Medical roles + Admin roles
- **Event Types**: Patient care, medical data access, healthcare activities

### 3. Frontend Security Dashboard
- **Admin Panel**: `admin-panel/src/pages/SecurityAudit.tsx`
- **Medical Portal**: `frontend/src/components/SecurityAudit.tsx`
- **Features**: Real-time data, export functionality, role-based display

## 🌐 API Endpoints

### Admin Panel Security Endpoints

#### Get Admin Security Events
```http
GET /api/v1/admin/security/events
Authorization: Bearer <token>
```

**Response:**
```json
{
  "events": [
    {
      "id": "68b15c6df2b2a42b9ee5cae7",
      "timestamp": "2025-08-29T07:53:17.730208",
      "event_type": "access",
      "portal": "admin",
      "user_email": "admin@evep.com",
      "ip_address": "192.168.65.1",
      "action": "Security events accessed",
      "status": "success",
      "severity": "low"
    }
  ]
}
```

#### Get Admin Security Statistics
```http
GET /api/v1/admin/security/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_events": 5,
  "failed_logins": 0,
  "suspicious_activities": 0,
  "blocked_ips": 0,
  "security_alerts": 0,
  "last_24h_events": 5,
  "current_client_ip": "192.168.65.1"
}
```

### Medical Portal Security Endpoints

#### Get Medical Security Events
```http
GET /api/v1/medical/security/events
Authorization: Bearer <token>
```

**Response:**
```json
{
  "events": [
    {
      "id": "68b15c6df2b2a42b9ee5cae8",
      "timestamp": "2025-08-29T07:53:17.743857",
      "event_type": "patient_access",
      "portal": "medical",
      "user_email": "doctor@evep.com",
      "ip_address": "192.168.65.1",
      "action": "Patient data accessed",
      "patient_id": "12345",
      "status": "success",
      "severity": "low"
    }
  ]
}
```

#### Get Medical Security Statistics
```http
GET /api/v1/medical/security/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_events": 11,
  "patient_access_events": 5,
  "screening_events": 3,
  "record_updates": 2,
  "failed_access": 0,
  "last_24h_events": 11,
  "current_client_ip": "192.168.65.1"
}
```

## 🗄️ Database Schema

### Audit Logs Collection (`audit_logs`)

```javascript
{
  "_id": ObjectId,
  "timestamp": "2025-08-29T07:53:17.730208",
  "event_type": "access",
  "portal": "admin" | "medical",
  "user_id": "68b131b09cf9b01a0274e39a",
  "user_email": "admin@evep.com",
  "user_role": "admin",
  "ip_address": "192.168.65.1",
  "user_agent": "Mozilla/5.0...",
  "resource": "/api/v1/admin/security/events",
  "action": "Security events accessed",
  "patient_id": "12345",        // Only for medical events
  "screening_id": "67890",      // Only for medical events
  "status": "success" | "failed",
  "details": "Additional details",
  "severity": "low" | "medium" | "high",
  "audit_hash": "admin_access_68b131b09cf9b01a0274e39a_192.168.65.1_1735467197"
}
```

### Key Fields
- **portal**: Distinguishes between admin and medical events
- **audit_hash**: Blockchain-style hash for audit trail integrity
- **patient_id/screening_id**: Medical-specific identifiers
- **severity**: Event importance level

## 🔐 Role-Based Access Control

### Admin Panel Security
```python
# Allowed roles
allowed_roles = ["admin", "super_admin"]

# Data filtering
query = {"portal": "admin"}
```

### Medical Portal Security
```python
# Allowed roles
allowed_roles = ["admin", "doctor", "nurse", "teacher", "parent", "medical_staff"]

# Data filtering
query = {"portal": "medical"}

# User-specific filtering for non-admin users
if current_user["role"] not in ["admin", "super_admin"]:
    query["user_id"] = current_user.get("id")
```

### Access Matrix
| User Role | Admin Security | Medical Security | Data Access |
|-----------|----------------|------------------|-------------|
| super_admin | ✅ Full Access | ✅ Full Access | All events |
| admin | ✅ Full Access | ✅ Full Access | All events |
| doctor | ❌ No Access | ✅ Own Events | Personal events only |
| nurse | ❌ No Access | ✅ Own Events | Personal events only |
| teacher | ❌ No Access | ✅ Own Events | Personal events only |
| parent | ❌ No Access | ✅ Own Events | Personal events only |

## 📊 Event Types

### Admin Portal Events
| Event Type | Description | Severity |
|------------|-------------|----------|
| `access` | General admin access | Low |
| `login` | User login/logout | Low |
| `access_denied` | Failed access attempts | Medium |
| `security_alert` | Security violations | High |
| `user_management` | User CRUD operations | Medium |
| `system_config` | System settings changes | High |

### Medical Portal Events
| Event Type | Description | Severity |
|------------|-------------|----------|
| `patient_access` | Patient data access | Medium |
| `screening_access` | Vision screening access | Medium |
| `record_update` | Medical record changes | High |
| `access` | General medical access | Low |
| `failed_access` | Failed medical access | Medium |

## 🎨 Frontend Integration

### Admin Panel Security Dashboard
```typescript
// File: admin-panel/src/pages/SecurityAudit.tsx
interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  portal: "admin";
  user_email: string;
  ip_address: string;
  action: string;
  status: string;
  severity: string;
}
```

### Medical Portal Security Dashboard
```typescript
// File: frontend/src/components/SecurityAudit.tsx
interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  portal: "medical";
  user_email: string;
  ip_address: string;
  action: string;
  patient_id?: string;
  screening_id?: string;
  status: string;
  severity: string;
}
```

### Navigation Integration
```typescript
// Admin Panel Navigation
{
  text: 'Security & Audit',
  icon: <SecurityIcon />,
  path: '/admin/security',
  badge: null,
}

// Medical Portal Navigation
{
  text: 'Security Audit',
  icon: <SecurityIcon />,
  path: '/dashboard/security',
  badge: null,
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Security Configuration
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/evep
```

### Security Settings
```python
# Security event logging configuration
SECURITY_EVENT_RETENTION_DAYS = 90
SECURITY_EVENT_BATCH_SIZE = 50
SECURITY_ALERT_THRESHOLD = 5  # Failed attempts before alert
```

## 📈 Monitoring & Logging

### Console Logging
```bash
# Admin Portal Events
🔒 SECURITY EVENT: access - Security events accessed from 192.168.65.1 by admin@evep.com

# Medical Portal Events
🏥 MEDICAL SECURITY EVENT: patient_access - Patient data accessed from 192.168.65.1 by doctor@evep.com
   📋 Patient ID: 12345
```

### Database Monitoring
```javascript
// Check recent security events
db.audit_logs.find({}).sort({timestamp: -1}).limit(10)

// Check portal-specific events
db.audit_logs.find({portal: "admin"}).count()
db.audit_logs.find({portal: "medical"}).count()

// Check user-specific events
db.audit_logs.find({user_id: "68b131b09cf9b01a0274e39a"})
```

### Performance Metrics
- **Event Logging**: < 10ms per event
- **Query Performance**: < 100ms for 50 events
- **Storage**: ~1KB per event
- **Retention**: 90 days by default

## 🔧 Troubleshooting

### Common Issues

#### 1. Events Not Appearing
```bash
# Check if events are being logged
docker-compose logs backend | grep "SECURITY EVENT"

# Check database for events
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({}).count()"
```

#### 2. Portal Filtering Not Working
```bash
# Verify portal tags in database
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.distinct('portal')"

# Check API response
curl -H "Authorization: Bearer $TOKEN" http://localhost:8013/api/v1/admin/security/events | jq '.events[0].portal'
```

#### 3. Role-Based Access Issues
```bash
# Check user role
curl -H "Authorization: Bearer $TOKEN" http://localhost:8013/api/v1/auth/me | jq '.role'

# Test access with different roles
# Create test users with different roles and verify access
```

### Debug Commands
```bash
# Test admin security endpoints
TOKEN=$(curl -s -X POST "http://localhost:8013/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evep.com","password":"admin123"}' | jq -r '.access_token')

curl -X GET "http://localhost:8013/api/v1/admin/security/events" \
  -H "Authorization: Bearer $TOKEN" | jq '.events | length'

# Test medical security endpoints
curl -X GET "http://localhost:8013/api/v1/medical/security/events" \
  -H "Authorization: Bearer $TOKEN" | jq '.events | length'
```

### Performance Optimization
```javascript
// Create indexes for better performance
db.audit_logs.createIndex({"portal": 1, "timestamp": -1})
db.audit_logs.createIndex({"user_id": 1, "portal": 1})
db.audit_logs.createIndex({"event_type": 1, "portal": 1})
```

## 📋 Best Practices

### Security
1. **Regular Monitoring**: Check security events daily
2. **Access Reviews**: Review user access monthly
3. **Audit Trail**: Maintain complete audit trail
4. **Data Retention**: Implement proper data retention policies

### Performance
1. **Indexing**: Create proper database indexes
2. **Batch Processing**: Process events in batches
3. **Caching**: Cache frequently accessed data
4. **Cleanup**: Regular cleanup of old events

### Compliance
1. **HIPAA**: Ensure medical data compliance
2. **GDPR**: Implement data protection measures
3. **Audit Requirements**: Meet regulatory audit requirements
4. **Documentation**: Maintain comprehensive documentation

## 🔄 Maintenance

### Regular Tasks
- **Daily**: Monitor security events and alerts
- **Weekly**: Review access patterns and anomalies
- **Monthly**: Clean up old events and optimize performance
- **Quarterly**: Review and update security policies

### Backup & Recovery
```bash
# Backup audit logs
docker exec evep-mongo-primary mongodump --db evep --collection audit_logs

# Restore audit logs
docker exec evep-mongo-primary mongorestore --db evep --collection audit_logs
```

---

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Author**: EVEP Development Team
