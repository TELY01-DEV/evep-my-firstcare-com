# EVEP Medical Portal - API Documentation

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Medical Endpoints](#medical-endpoints)
5. [AI & Chat Bot Endpoints](#ai--chat-bot-endpoints)
6. [RBAC Endpoints](#rbac-endpoints)
7. [Export Endpoints](#export-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## 🌐 API Overview

**Base URL**: `https://stardust.evep.my-firstcare.com`
**API Version**: v1
**Content Type**: `application/json`
**Authentication**: Bearer Token (JWT)

### API Status
- **Total Endpoints**: 18
- **Success Rate**: 100% (18/18)
- **Average Response Time**: 0.025s
- **Uptime**: 99.9%

---

## 🔐 Authentication

### Login
Authenticate user and receive JWT token.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@evep.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "user_id": "68be5c3fa392cd3ee7968f03",
    "email": "admin@evep.com",
    "role": "super_admin"
  }
}
```

### Get Current User
Get current authenticated user information.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "68be5c3fa392cd3ee7968f03",
  "email": "admin@evep.com",
  "role": "super_admin",
  "first_name": "Admin",
  "last_name": "User"
}
```

### Health Check
Check API health status.

```http
GET /api/v1/auth/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

---

## 📊 Core Endpoints

### Dashboard Statistics
Get comprehensive dashboard statistics.

```http
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalStudents": 9,
  "totalTeachers": 9,
  "totalPatients": 3,
  "totalScreenings": 3,
  "recentActivity": [
    {
      "id": "act001",
      "type": "screening_completed",
      "description": "Vision screening completed for John Doe",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### User Management
Manage system users and administrators.

#### Get Users
```http
GET /api/v1/user-management/
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10, max: 100)
- `search` (string): Search term
- `role` (string): Filter by role
- `department` (string): Filter by department
- `is_active` (boolean): Filter by active status

**Response:**
```json
{
  "users": [
    {
      "user_id": "68be5c3fa392cd3ee7968f03",
      "email": "admin@evep.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "super_admin",
      "department": "IT",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "total_pages": 1
}
```

#### Create User
```http
POST /api/v1/user-management/
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "department": "Ophthalmology",
  "specialization": "Pediatric Ophthalmology",
  "phone": "+66-123-456-789",
  "license_number": "DOC123456",
  "qualifications": ["MD", "PhD"],
  "is_active": true
}
```

**Response:**
```json
{
  "user_id": "new_user_id",
  "email": "doctor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "message": "User created successfully"
}
```

---

## 🏫 EVEP Management Endpoints

### Students
Manage student records and information.

#### Get Students
```http
GET /api/v1/evep/students
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (int): Number of records to skip
- `limit` (int): Number of records to return
- `school_id` (string): Filter by school ID
- `class` (string): Filter by class
- `status` (string): Filter by status

**Response:**
```json
[
  {
    "_id": "student_id",
    "student_id": "STU001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2010-05-15",
    "school_id": "school_id",
    "class": "Grade 5A",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Student
```http
POST /api/v1/evep/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": "STU002",
  "first_name": "Jane",
  "last_name": "Smith",
  "date_of_birth": "2011-03-20",
  "school_id": "school_id",
  "class": "Grade 4B",
  "parent_contact": "+66-987-654-321",
  "emergency_contact": "+66-111-222-333"
}
```

#### Update Student
```http
PUT /api/v1/evep/students/{student_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "class": "Grade 6A",
  "status": "active"
}
```

#### Delete Student
```http
DELETE /api/v1/evep/students/{student_id}
Authorization: Bearer <token>
```

### Teachers
Manage teacher records and information.

#### Get Teachers
```http
GET /api/v1/evep/teachers
Authorization: Bearer <token>
```

#### Create Teacher
```http
POST /api/v1/evep/teachers
Authorization: Bearer <token>
Content-Type: application/json

{
  "teacher_id": "TCH001",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@school.edu",
  "phone": "+66-555-666-777",
  "school_id": "school_id",
  "subject": "Mathematics",
  "class_teacher": "Grade 5A"
}
```

### Schools
Manage school records and information.

#### Get Schools
```http
GET /api/v1/evep/schools
Authorization: Bearer <token>
```

#### Create School
```http
POST /api/v1/evep/schools
Authorization: Bearer <token>
Content-Type: application/json

{
  "school_id": "SCH001",
  "name": "Bangkok International School",
  "address": "123 Sukhumvit Road, Bangkok",
  "phone": "+66-2-123-4567",
  "email": "info@bangkok-school.edu",
  "principal": "Dr. Smith",
  "district": "Bangkok",
  "province": "Bangkok"
}
```

---

## 🏥 Medical Endpoints

### Patients
Manage patient medical records.

#### Get Patients
```http
GET /api/v1/patients/
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (int): Number of records to skip
- `limit` (int): Number of records to return
- `search` (string): Search term

**Response:**
```json
[
  {
    "_id": "patient_id",
    "patient_id": "PAT001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2010-05-15",
    "gender": "male",
    "contact_info": {
      "phone": "+66-123-456-789",
      "email": "john.doe@email.com"
    },
    "medical_history": [],
    "allergies": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Patient
```http
POST /api/v1/patients/
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": "PAT002",
  "first_name": "Jane",
  "last_name": "Smith",
  "date_of_birth": "2011-03-20",
  "gender": "female",
  "contact_info": {
    "phone": "+66-987-654-321",
    "email": "jane.smith@email.com"
  },
  "medical_history": [],
  "allergies": []
}
```

### Screenings
Manage screening sessions and results.

#### Get Screening Sessions
```http
GET /api/v1/screenings/sessions
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (int): Number of records to skip
- `limit` (int): Number of records to return
- `student_id` (string): Filter by student ID
- `screening_type` (string): Filter by screening type
- `status` (string): Filter by status

**Response:**
```json
[
  {
    "_id": "screening_id",
    "session_id": "SCR001",
    "student_id": "student_id",
    "screening_date": "2024-01-15T10:00:00Z",
    "screening_type": "vision",
    "results": {
      "left_eye": "6/6",
      "right_eye": "6/9",
      "recommendation": "Follow-up required"
    },
    "screened_by": "doctor_id",
    "status": "completed",
    "notes": "Student showed signs of mild myopia"
  }
]
```

#### Create Screening Session
```http
POST /api/v1/screenings/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": "student_id",
  "screening_type": "vision",
  "screening_date": "2024-01-15T10:00:00Z",
  "results": {
    "left_eye": "6/6",
    "right_eye": "6/9",
    "recommendation": "Follow-up required"
  },
  "notes": "Student showed signs of mild myopia"
}
```

---

## 📦 Inventory Endpoints

### Glasses Inventory
Manage glasses and equipment inventory.

#### Get Glasses Inventory
```http
GET /api/v1/inventory/glasses
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "item_id",
    "item_name": "Reading Glasses +2.0",
    "item_type": "glasses",
    "category": "reading",
    "brand": "VisionCare",
    "model": "RC-200",
    "prescription": "+2.0",
    "frame_color": "black",
    "lens_type": "standard",
    "quantity_available": 25,
    "quantity_used": 5,
    "unit_price": 1500.00,
    "supplier": "VisionCare Ltd",
    "purchase_date": "2024-01-01T00:00:00Z",
    "expiry_date": "2026-01-01T00:00:00Z",
    "status": "available"
  }
]
```

#### Create Glasses Item
```http
POST /api/v1/inventory/glasses
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_name": "Reading Glasses +1.5",
  "item_type": "glasses",
  "category": "reading",
  "brand": "VisionCare",
  "model": "RC-150",
  "prescription": "+1.5",
  "frame_color": "brown",
  "lens_type": "standard",
  "quantity_available": 30,
  "unit_price": 1200.00,
  "supplier": "VisionCare Ltd"
}
```

---

## 🤖 AI & Chat Bot Endpoints

### Chat with AI Agent
Interact with specialized AI agents based on user type.

```http
POST /api/v1/chat-bot/ai-agent
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I create a new screening session?",
  "conversation_id": "optional-conversation-id"
}
```

**Response:**
```json
{
  "response": "To create a new screening session, follow these steps:\n1. Go to the Screenings section\n2. Click 'Create New Session'\n3. Fill in the student information\n4. Select the screening type\n5. Record the results\n6. Save the session",
  "conversation_id": "conv_123",
  "agent_type": "medical_admin",
  "timestamp": "2024-01-01T10:00:00Z",
  "suggestions": [
    "How to view screening results?",
    "How to export screening data?",
    "How to manage student records?"
  ]
}
```

### Get AI Agent Configurations
Get all AI agent configurations (Admin only).

```http
GET /api/v1/chat-bot/agent-configs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "agent_configurations": [
    {
      "agent_type": "parent",
      "name": "Parent Assistant",
      "description": "AI agent for parents of students",
      "capabilities": ["screening_info", "appointment_booking", "general_queries"],
      "language": "thai",
      "is_active": true
    }
  ],
  "total_configs": 12,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### AI Chat Health Check
Check AI chat service health.

```http
GET /api/v1/chat-bot/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Chat Bot",
  "openai_configured": true,
  "anthropic_configured": true,
  "vector_db_connected": true,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 🔐 RBAC Endpoints

### File-based RBAC
Access file-based role and permission data.

#### Get Roles
```http
GET /api/v1/rbac/roles/
Authorization: Bearer <token>
```

#### Get Permissions
```http
GET /api/v1/rbac/permissions/
Authorization: Bearer <token>
```

### MongoDB-based RBAC
Access database-driven role and permission data.

#### Get MongoDB Roles
```http
GET /api/v1/rbac-mongodb/roles/
Authorization: Bearer <token>
```

#### Create Role
```http
POST /api/v1/rbac-mongodb/roles/
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_name": "vision_specialist",
  "description": "Specialized role for vision screening specialists",
  "permissions": ["screenings_create", "screenings_view", "screenings_update"],
  "is_active": true
}
```

#### Get MongoDB Permissions
```http
GET /api/v1/rbac-mongodb/permissions/
Authorization: Bearer <token>
```

#### Create Permission
```http
POST /api/v1/rbac-mongodb/permissions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission_name": "advanced_analytics",
  "description": "Access to advanced analytics and reporting",
  "category": "analytics",
  "is_active": true
}
```

---

## 📄 Export Endpoints

### CSV Export
Export data in CSV format for analysis and reporting.

#### Dashboard Summary Export
```http
GET /api/v1/csv-export/dashboard-summary
Authorization: Bearer <token>
```

**Response:** CSV file download

#### Students Export
```http
GET /api/v1/csv-export/students
Authorization: Bearer <token>
```

**Query Parameters:**
- `school_id` (string): Filter by school
- `class` (string): Filter by class
- `status` (string): Filter by status

#### Teachers Export
```http
GET /api/v1/csv-export/teachers
Authorization: Bearer <token>
```

#### Schools Export
```http
GET /api/v1/csv-export/schools
Authorization: Bearer <token>
```

---

## ⚠️ Error Handling

### HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### Error Response Format
```json
{
  "detail": "Error message description",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T10:00:00Z",
  "request_id": "req_123456"
}
```

### Common Error Codes
- **AUTH_REQUIRED**: Authentication token required
- **INVALID_TOKEN**: Invalid or expired token
- **INSUFFICIENT_PERMISSIONS**: User lacks required permissions
- **RESOURCE_NOT_FOUND**: Requested resource does not exist
- **VALIDATION_ERROR**: Request data validation failed
- **DATABASE_ERROR**: Database operation failed

---

## 🚦 Rate Limiting

### Rate Limits
- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute
- **Export Endpoints**: 10 requests per minute
- **AI Chat**: 20 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

---

## 📝 Examples

### Complete Workflow Example

#### 1. Login
```bash
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@evep.com", "password": "admin123"}'
```

#### 2. Create Student
```bash
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/evep/students" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2010-05-15",
    "school_id": "school_id",
    "class": "Grade 5A"
  }'
```

#### 3. Create Screening Session
```bash
curl -X POST "https://stardust.evep.my-firstcare.com/api/v1/screenings/sessions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_id",
    "screening_type": "vision",
    "results": {
      "left_eye": "6/6",
      "right_eye": "6/9",
      "recommendation": "Follow-up required"
    }
  }'
```

#### 4. Export Data
```bash
curl -X GET "https://stardust.evep.my-firstcare.com/api/v1/csv-export/students" \
  -H "Authorization: Bearer <token>" \
  -o students_export.csv
```

---

## 🔗 Additional Resources

- **Interactive API Documentation**: https://stardust.evep.my-firstcare.com/docs
- **System Documentation**: [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting Guide**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

*Last Updated: January 2024*
*API Version: 1.0.0*
