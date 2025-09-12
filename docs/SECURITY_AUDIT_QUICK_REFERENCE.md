# Security & Audit System - Quick Reference Guide

## 🚀 Quick Start

### Access Security Dashboards
- **Admin Panel**: `http://localhost:3015/admin/security`
- **Medical Portal**: `http://localhost:3013/dashboard/security`

### Test Security Endpoints
```bash
# Get token
TOKEN=$(curl -s -X POST "http://localhost:8013/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evep.com","password":"admin123"}' | jq -r '.access_token')

# Admin Security Events
curl -X GET "http://localhost:8013/api/v1/admin/security/events" \
  -H "Authorization: Bearer $TOKEN"

# Medical Security Events
curl -X GET "http://localhost:8013/api/v1/medical/security/events" \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Current Status

### Admin Portal Security
- **Total Events**: 5
- **Portal Tag**: `"portal": "admin"`
- **Access**: Admin users only
- **Event Types**: System administration, user management

### Medical Portal Security
- **Total Events**: 11
- **Portal Tag**: `"portal": "medical"`
- **Access**: Medical users + Admin users
- **Event Types**: Patient care, medical data access

## 🔐 Access Control Matrix

| User Role | Admin Security | Medical Security | Data Access |
|-----------|----------------|------------------|-------------|
| super_admin | ✅ Full | ✅ Full | All events |
| admin | ✅ Full | ✅ Full | All events |
| doctor | ❌ None | ✅ Own | Personal only |
| nurse | ❌ None | ✅ Own | Personal only |
| teacher | ❌ None | ✅ Own | Personal only |
| parent | ❌ None | ✅ Own | Personal only |

## 📋 Event Types

### Admin Events
- `access` - General admin access
- `login` - User login/logout
- `access_denied` - Failed access attempts
- `security_alert` - Security violations
- `user_management` - User CRUD operations
- `system_config` - System settings changes

### Medical Events
- `patient_access` - Patient data access
- `screening_access` - Vision screening access
- `record_update` - Medical record changes
- `access` - General medical access
- `failed_access` - Failed medical access

## 🗄️ Database Queries

### Check Recent Events
```javascript
// All events
db.audit_logs.find({}).sort({timestamp: -1}).limit(10)

// Admin events only
db.audit_logs.find({portal: "admin"}).sort({timestamp: -1})

// Medical events only
db.audit_logs.find({portal: "medical"}).sort({timestamp: -1})

// User-specific events
db.audit_logs.find({user_id: "68b131b09cf9b01a0274e39a"})
```

### Event Counts
```javascript
// Total events by portal
db.audit_logs.aggregate([
  {$group: {_id: "$portal", count: {$sum: 1}}}
])

// Events by type
db.audit_logs.aggregate([
  {$group: {_id: "$event_type", count: {$sum: 1}}}
])
```

## 🔧 Troubleshooting

### Common Issues

#### 1. No Events Showing
```bash
# Check backend logs
docker-compose logs backend | grep "SECURITY EVENT"

# Check database
docker exec evep-mongo-primary mongosh evep --eval "db.audit_logs.find({}).count()"
```

#### 2. Portal Filtering Issues
```bash
# Check portal tags
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

### Performance Optimization
```javascript
// Create indexes
db.audit_logs.createIndex({"portal": 1, "timestamp": -1})
db.audit_logs.createIndex({"user_id": 1, "portal": 1})
db.audit_logs.createIndex({"event_type": 1, "portal": 1})
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

## 🎯 Key Features

### ✅ Implemented
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

### Documentation
- **Full Documentation**: `docs/SECURITY_AUDIT_SYSTEM.md`
- **Quick Reference**: `docs/SECURITY_AUDIT_QUICK_REFERENCE.md`

---

**Last Updated**: August 29, 2025  
**Version**: 1.0.0
