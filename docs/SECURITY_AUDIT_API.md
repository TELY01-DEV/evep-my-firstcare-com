# Security & Audit System - API Documentation

## 🌐 Base URL
```
http://localhost:8013/api/v1
```

## 🔐 Authentication
All endpoints require Bearer token authentication:
```http
Authorization: Bearer <your_jwt_token>
```

## 📋 API Endpoints

### Admin Panel Security Endpoints

#### 1. Get Admin Security Events
```http
GET /admin/security/events
```

**Description**: Retrieve security events for the admin panel

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 50, max: 100)
- `event_type` (optional): Filter by event type
- `severity` (optional): Filter by severity level (low, medium, high)

**Response**:
```json
{
  "events": [
    {
      "id": "68b15c6df2b2a42b9ee5cae7",
      "timestamp": "2025-08-29T07:53:17.730208",
      "event_type": "access",
      "portal": "admin",
      "user_id": "68b131b09cf9b01a0274e39a",
      "user_email": "admin@evep.com",
      "user_role": "admin",
      "ip_address": "192.168.65.1",
      "user_agent": "Mozilla/5.0...",
      "resource": "/api/v1/admin/security/events",
      "action": "Security events accessed",
      "status": "success",
      "details": "Admin accessed security audit logs",
      "severity": "low"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Events retrieved successfully
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

#### 2. Get Admin Security Statistics
```http
GET /admin/security/stats
```

**Description**: Retrieve security statistics for the admin panel

**Response**:
```json
{
  "total_events": 5,
  "failed_logins": 0,
  "suspicious_activities": 0,
  "blocked_ips": 0,
  "security_alerts": 0,
  "last_24h_events": 5,
  "last_7d_events": 5,
  "last_30d_events": 5,
  "current_client_ip": "192.168.65.1",
  "current_user_agent": "Mozilla/5.0...",
  "last_activity": "2025-08-29T07:53:17.730208"
}
```

### Medical Portal Security Endpoints

#### 1. Get Medical Security Events
```http
GET /medical/security/events
```

**Description**: Retrieve security events for the medical portal

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 50, max: 100)
- `event_type` (optional): Filter by event type
- `patient_id` (optional): Filter by patient ID
- `severity` (optional): Filter by severity level

**Response**:
```json
{
  "events": [
    {
      "id": "68b15c6df2b2a42b9ee5cae8",
      "timestamp": "2025-08-29T07:53:17.743857",
      "event_type": "patient_access",
      "portal": "medical",
      "user_id": "68b131b09cf9b01a0274e39a",
      "user_email": "doctor@evep.com",
      "user_role": "doctor",
      "ip_address": "192.168.65.1",
      "user_agent": "Mozilla/5.0...",
      "resource": "/api/v1/patients/12345",
      "action": "Patient data accessed",
      "patient_id": "12345",
      "screening_id": null,
      "status": "success",
      "details": "Patient 12345 accessed by doctor@evep.com",
      "severity": "low"
    }
  ]
}
```

#### 2. Get Medical Security Statistics
```http
GET /medical/security/stats
```

**Description**: Retrieve security statistics for the medical portal

**Response**:
```json
{
  "total_events": 11,
  "patient_access_events": 5,
  "screening_events": 3,
  "record_updates": 2,
  "failed_access": 0,
  "last_24h_events": 11,
  "last_7d_events": 11,
  "last_30d_events": 11,
  "current_client_ip": "192.168.65.1",
  "current_user_agent": "Mozilla/5.0...",
  "last_activity": "2025-08-29T07:53:17.743857"
}
```

## 📊 Event Types Reference

### Admin Portal Event Types
| Event Type | Description | Severity | Portal |
|------------|-------------|----------|--------|
| `access` | General admin access | Low | admin |
| `login` | User login/logout | Low | admin |
| `access_denied` | Failed access attempts | Medium | admin |
| `security_alert` | Security violations | High | admin |
| `user_management` | User CRUD operations | Medium | admin |
| `system_config` | System settings changes | High | admin |

### Medical Portal Event Types
| Event Type | Description | Severity | Portal |
|------------|-------------|----------|--------|
| `patient_access` | Patient data access | Medium | medical |
| `screening_access` | Vision screening access | Medium | medical |
| `record_update` | Medical record changes | High | medical |
| `access` | General medical access | Low | medical |
| `failed_access` | Failed medical access | Medium | medical |

## 🔐 Role-Based Access Control

### Admin Panel Security
- **Required Roles**: `admin`, `super_admin`
- **Data Access**: All admin portal events
- **Filtering**: `{"portal": "admin"}`

### Medical Portal Security
- **Required Roles**: `admin`, `doctor`, `nurse`, `teacher`, `parent`, `medical_staff`
- **Data Access**: 
  - Admin users: All medical portal events
  - Medical users: Only their own events
- **Filtering**: `{"portal": "medical"}` + user-specific filtering

## 📝 Request Examples

### cURL Examples

#### Get Admin Security Events
```bash
curl -X GET "http://localhost:8013/api/v1/admin/security/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Medical Security Events with Filters
```bash
curl -X GET "http://localhost:8013/api/v1/medical/security/events?limit=20&event_type=patient_access" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Security Statistics
```bash
curl -X GET "http://localhost:8013/api/v1/admin/security/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript Examples

#### Fetch Admin Security Events
```javascript
const response = await fetch('http://localhost:8013/api/v1/admin/security/events', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.events);
```

#### Fetch Medical Security Statistics
```javascript
const response = await fetch('http://localhost:8013/api/v1/medical/security/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const stats = await response.json();
console.log(`Total events: ${stats.total_events}`);
```

## 🗄️ Database Schema

### Audit Log Document Structure
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

## 🔧 Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Invalid token"
}
```

#### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Failed to get security events: Database connection error"
}
```

## 📈 Performance Considerations

### Response Times
- **Event Retrieval**: < 100ms for 50 events
- **Statistics Calculation**: < 200ms
- **Database Queries**: Optimized with indexes

### Rate Limiting
- **Default Limit**: 50 events per request
- **Maximum Limit**: 100 events per request
- **Rate Limit**: 100 requests per minute per user

### Caching
- **Statistics**: Cached for 5 minutes
- **Event Lists**: No caching (real-time data)

## 🔍 Monitoring & Debugging

### Health Check
```bash
# Check if security endpoints are accessible
curl -X GET "http://localhost:8013/api/v1/admin/security/events" \
  -H "Authorization: Bearer $TOKEN" \
  -w "Response time: %{time_total}s\n"
```

### Database Queries
```javascript
// Check recent events
db.audit_logs.find({}).sort({timestamp: -1}).limit(10)

// Check portal-specific events
db.audit_logs.find({portal: "admin"}).count()
db.audit_logs.find({portal: "medical"}).count()

// Check user-specific events
db.audit_logs.find({user_id: "68b131b09cf9b01a0274e39a"})
```

---

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Base URL**: `http://localhost:8013/api/v1`
