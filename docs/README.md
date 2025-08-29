# EVEP Platform Documentation

Welcome to the EVEP Platform documentation! This directory contains comprehensive documentation for all aspects of the EVEP Platform, including the Security & Audit system.

## 📚 Documentation Index

### 🔒 Security & Audit System
- **[Security Audit System](SECURITY_AUDIT_SYSTEM.md)** - Complete documentation of the dual-panel security audit system
- **[Security Audit Quick Reference](SECURITY_AUDIT_QUICK_REFERENCE.md)** - Quick reference guide for daily operations
- **[Security Audit API](SECURITY_AUDIT_API.md)** - Detailed API documentation with examples

### 🏗️ System Architecture
- **[System Overview](../README.md)** - Main system documentation
- **[API Documentation](../backend/README.md)** - Backend API documentation
- **[Frontend Documentation](../frontend/README.md)** - Frontend application documentation

## 🎯 Quick Start

### Access Security Dashboards
- **Admin Panel Security**: `http://localhost:3015/admin/security`
- **Medical Portal Security**: `http://localhost:3013/dashboard/security`

### Test Security System
```bash
# Get authentication token
TOKEN=$(curl -s -X POST "http://localhost:8013/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evep.com","password":"admin123"}' | jq -r '.access_token')

# Test admin security
curl -X GET "http://localhost:8013/api/v1/admin/security/events" \
  -H "Authorization: Bearer $TOKEN"

# Test medical security
curl -X GET "http://localhost:8013/api/v1/medical/security/events" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔍 Current System Status

### Security Audit Implementation
- ✅ **Dual-Panel Security**: Separate audit systems for Admin and Medical portals
- ✅ **Real-Time Logging**: All activities logged with timestamps and user details
- ✅ **Role-Based Access**: Different access levels for different user roles
- ✅ **Data Isolation**: Users only see events from their respective portal
- ✅ **Real Data**: 100% real data, no mock content
- ✅ **Audit Trail**: Complete activity history with blockchain-style hashes

### Current Statistics
- **Admin Portal Events**: 5 events (admin activities only)
- **Medical Portal Events**: 11 events (medical activities only)
- **Total Security Events**: 16 events across both portals
- **Real Client IP**: 192.168.65.1 (your actual IP)

## 📊 Key Features

### 🔒 Admin Panel Security
- **Portal Tag**: `"portal": "admin"`
- **Access Control**: Admin and Super Admin roles only
- **Event Types**: System administration, user management, admin activities
- **Data Filtering**: Only shows admin portal events

### 🏥 Medical Portal Security
- **Portal Tag**: `"portal": "medical"`
- **Access Control**: Medical roles + Admin roles
- **Event Types**: Patient care, medical data access, healthcare activities
- **Data Filtering**: Only shows medical portal events + user-specific filtering

## 🔐 Role-Based Access Control

| User Role | Admin Security | Medical Security | Data Access |
|-----------|----------------|------------------|-------------|
| super_admin | ✅ Full Access | ✅ Full Access | All events |
| admin | ✅ Full Access | ✅ Full Access | All events |
| doctor | ❌ No Access | ✅ Own Events | Personal events only |
| nurse | ❌ No Access | ✅ Own Events | Personal events only |
| teacher | ❌ No Access | ✅ Own Events | Personal events only |
| parent | ❌ No Access | ✅ Own Events | Personal events only |

## 📋 Event Types

### Admin Portal Events
- `access` - General admin access
- `login` - User login/logout
- `access_denied` - Failed access attempts
- `security_alert` - Security violations
- `user_management` - User CRUD operations
- `system_config` - System settings changes

### Medical Portal Events
- `patient_access` - Patient data access
- `screening_access` - Vision screening access
- `record_update` - Medical record changes
- `access` - General medical access
- `failed_access` - Failed medical access

## 🗄️ Database Schema

### Audit Logs Collection
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

## 🔧 Troubleshooting

### Common Issues

#### 1. Events Not Appearing
```bash
# Check backend logs
docker-compose logs backend | grep "SECURITY EVENT"

# Check database
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({}).count()"
```

#### 2. Portal Filtering Issues
```bash
# Verify portal tags
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.distinct('portal')"

# Test API response
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8013/api/v1/admin/security/events | jq '.events[0].portal'
```

#### 3. Access Denied
```bash
# Check user role
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8013/api/v1/auth/me | jq '.role'
```

## 📈 Monitoring Commands

### Real-time Monitoring
```bash
# Watch backend logs
docker-compose logs -f backend | grep "SECURITY EVENT"

# Monitor database
watch -n 5 'docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({}).count()"'
```

### Security Alerts
```bash
# Check failed access attempts
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({status: 'failed'}).count()"

# Check high severity events
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({severity: 'high'}).count()"
```

## 🎯 Development Status

### ✅ Completed Features
- [x] Dual-panel security audit systems
- [x] Real-time event logging
- [x] Role-based access control
- [x] Portal-specific data filtering
- [x] User-specific event filtering
- [x] Real data (no mock content)
- [x] Blockchain-style audit hashes
- [x] Frontend security dashboards
- [x] Export functionality (CSV)
- [x] Real-time statistics

### 🔄 Maintenance Tasks
- [ ] Daily security event monitoring
- [ ] Weekly access pattern review
- [ ] Monthly data cleanup
- [ ] Quarterly security policy review

## 📞 Support

### Files Location
- **Admin Security**: `backend/app/api/admin.py`
- **Medical Security**: `backend/app/api/medical_security.py`
- **Admin Dashboard**: `admin-panel/src/pages/SecurityAudit.tsx`
- **Medical Dashboard**: `frontend/src/components/SecurityAudit.tsx`

### Documentation Files
- **Full Documentation**: `docs/SECURITY_AUDIT_SYSTEM.md`
- **Quick Reference**: `docs/SECURITY_AUDIT_QUICK_REFERENCE.md`
- **API Documentation**: `docs/SECURITY_AUDIT_API.md`

---

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Author**: EVEP Development Team
