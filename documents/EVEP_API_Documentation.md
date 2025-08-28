# EVEP API Documentation

## Overview

The EVEP (EYE Vision Evaluation Platform) API provides comprehensive endpoints for managing pediatric vision screening operations. This API is built with FastAPI and provides real-time data processing, AI-powered insights, and secure authentication.

**Base URL**: `https://admin.evep.my-firstcare.com/api/v1`  
**API Version**: v1  
**Content Type**: `application/json`

## Authentication

The EVEP API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid Bearer token in the Authorization header.

### Authentication Flow

1. **Register** or **Login** to obtain an access token
2. Include the token in subsequent requests: `Authorization: Bearer <token>`
3. Tokens expire after 24 hours and can be refreshed

### Headers

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

## Endpoints

### Authentication

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "organization": "Test Hospital",
  "phone": "+66-123-456-789"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": "user_123",
  "user": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "organization": "Test Hospital"
  }
}
```

#### POST /auth/login

Authenticate user and obtain access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "user_id": "user_123",
    "email": "user@example.com",
    "role": "doctor"
  }
}
```

#### GET /auth/profile

Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user_id": "user_123",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "organization": "Test Hospital",
  "phone": "+66-123-456-789"
}
```

#### PUT /auth/profile

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "phone": "+66-999-888-777"
}
```

#### PUT /auth/change-password

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### POST /auth/refresh

Refresh access token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

#### POST /auth/logout

Logout user and invalidate token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Patient Management

#### GET /patients

List all patients with optional filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10)
- `search` (string): Search by name or email
- `school` (string): Filter by school
- `grade` (string): Filter by grade
- `gender` (string): Filter by gender
- `status` (string): Filter by status

**Response (200):**
```json
{
  "patients": [
    {
      "patient_id": "patient_123",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "2015-03-15",
      "gender": "male",
      "school": "Test School",
      "grade": "3A",
      "parent_name": "Jane Doe",
      "parent_phone": "+66-123-456-789",
      "parent_email": "jane.doe@example.com",
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "total_pages": 1
}
```

#### POST /patients

Create a new patient record.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2015-03-15",
  "gender": "male",
  "school": "Test School",
  "grade": "3A",
  "parent_name": "Jane Doe",
  "parent_phone": "+66-123-456-789",
  "parent_email": "jane.doe@example.com",
  "address": "123 Test Street, Bangkok",
  "medical_history": "None",
  "allergies": "None",
  "emergency_contact": "+66-987-654-321"
}
```

**Response (201):**
```json
{
  "message": "Patient created successfully",
  "patient_id": "patient_123",
  "patient": {
    "patient_id": "patient_123",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2015-03-15",
    "gender": "male",
    "school": "Test School",
    "grade": "3A"
  }
}
```

#### GET /patients/{patient_id}

Get specific patient details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "patient_id": "patient_123",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2015-03-15",
  "gender": "male",
  "school": "Test School",
  "grade": "3A",
  "parent_name": "Jane Doe",
  "parent_phone": "+66-123-456-789",
  "parent_email": "jane.doe@example.com",
  "address": "123 Test Street, Bangkok",
  "medical_history": "None",
  "allergies": "None",
  "emergency_contact": "+66-987-654-321",
  "created_at": "2024-01-15T10:30:00+07:00",
  "updated_at": "2024-01-15T10:30:00+07:00"
}
```

#### PUT /patients/{patient_id}

Update patient information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "grade": "4B"
}
```

#### DELETE /patients/{patient_id}

Delete patient record (soft delete).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Patient deleted successfully"
}
```

#### GET /patients/statistics

Get patient statistics and analytics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total_patients": 150,
  "by_gender": {
    "male": 75,
    "female": 75
  },
  "by_school": {
    "Test School": 50,
    "Another School": 100
  },
  "by_grade": {
    "3A": 25,
    "3B": 25,
    "4A": 25,
    "4B": 25
  }
}
```

### Screening Management

#### GET /screenings/sessions

List screening sessions with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Page number
- `limit` (int): Items per page
- `patient_id` (string): Filter by patient
- `status` (string): Filter by status
- `date_from` (string): Filter by start date
- `date_to` (string): Filter by end date

**Response (200):**
```json
{
  "sessions": [
    {
      "session_id": "session_123",
      "patient_id": "patient_123",
      "patient_name": "John Doe",
      "screening_type": "comprehensive",
      "status": "completed",
      "examiner_id": "user_123",
      "examiner_name": "Dr. Smith",
      "created_at": "2024-01-15T10:30:00+07:00",
      "completed_at": "2024-01-15T11:00:00+07:00"
    }
  ],
  "total": 1,
  "page": 1,
  "total_pages": 1
}
```

#### POST /screenings/sessions

Create a new screening session.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "patient_id": "patient_123",
  "screening_type": "comprehensive",
  "equipment_used": "standard_chart",
  "examiner_notes": "Patient cooperative during screening"
}
```

**Response (201):**
```json
{
  "message": "Screening session created successfully",
  "session_id": "session_123",
  "session": {
    "session_id": "session_123",
    "patient_id": "patient_123",
    "screening_type": "comprehensive",
    "status": "in_progress"
  }
}
```

#### GET /screenings/sessions/{session_id}

Get specific screening session details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "session_id": "session_123",
  "patient_id": "patient_123",
  "patient_name": "John Doe",
  "screening_type": "comprehensive",
  "equipment_used": "standard_chart",
  "status": "completed",
  "examiner_id": "user_123",
  "examiner_name": "Dr. Smith",
  "examiner_notes": "Patient cooperative during screening",
  "results": {
    "left_eye_distance": "20/20",
    "right_eye_distance": "20/25",
    "left_eye_near": "20/20",
    "right_eye_near": "20/20",
    "color_vision": "normal",
    "depth_perception": "normal"
  },
  "created_at": "2024-01-15T10:30:00+07:00",
  "completed_at": "2024-01-15T11:00:00+07:00"
}
```

#### PUT /screenings/sessions/{session_id}

Update screening session with results.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "results": {
    "left_eye_distance": "20/20",
    "right_eye_distance": "20/25",
    "left_eye_near": "20/20",
    "right_eye_near": "20/20",
    "color_vision": "normal",
    "depth_perception": "normal"
  },
  "examiner_notes": "Updated notes"
}
```

#### DELETE /screenings/sessions/{session_id}

Delete screening session (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Screening session deleted successfully"
}
```

#### GET /screenings/analytics/patient/{patient_id}

Get screening analytics for a specific patient.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "patient_id": "patient_123",
  "total_screenings": 5,
  "average_scores": {
    "left_eye_distance": 20.0,
    "right_eye_distance": 19.8,
    "left_eye_near": 20.0,
    "right_eye_near": 20.0
  },
  "trends": [
    {
      "date": "2024-01-15",
      "left_eye": 20.0,
      "right_eye": 19.8
    }
  ]
}
```

### AI Insights

#### POST /insights/generate

Generate AI-powered insights.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "insight_type": "patient_analysis",
  "patient_id": "patient_123",
  "date_range": "30d",
  "context": {
    "include_trends": true,
    "compare_with_peers": true
  }
}
```

**Response (200):**
```json
{
  "message": "AI insight generated successfully",
  "insight_id": "insight_123",
  "insight": {
    "insight_id": "insight_123",
    "insight_type": "patient_analysis",
    "title": "Patient Vision Analysis",
    "description": "Patient shows consistent improvement in vision scores",
    "confidence_score": 0.92,
    "recommendations": [
      "Continue current treatment plan",
      "Schedule follow-up in 3 months"
    ],
    "risk_level": "low",
    "generated_at": "2024-01-15T10:30:00+07:00"
  }
}
```

#### GET /insights/history

Get historical AI insights.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `insight_type` (string): Filter by insight type
- `page` (int): Page number
- `limit` (int): Items per page

**Response (200):**
```json
{
  "insights": [
    {
      "insight_id": "insight_123",
      "insight_type": "patient_analysis",
      "title": "Patient Vision Analysis",
      "description": "Patient shows consistent improvement",
      "confidence_score": 0.92,
      "recommendations": ["Continue treatment"],
      "risk_level": "low",
      "generated_at": "2024-01-15T10:30:00+07:00"
    }
  ],
  "total": 1,
  "page": 1,
  "total_pages": 1
}
```

#### GET /insights/analytics

Get AI insights analytics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total_insights": 50,
  "insights_by_type": {
    "patient_analysis": 20,
    "screening_trends": 15,
    "risk_assessment": 10,
    "recommendations": 5
  },
  "insights_by_role": {
    "doctor": 30,
    "teacher": 15,
    "admin": 5
  },
  "recent_activity": [
    {
      "insight_id": "insight_123",
      "type": "patient_analysis",
      "generated_at": "2024-01-15T10:30:00+07:00"
    }
  ]
}
```

### Analytics

#### GET /analytics/dashboard

Get dashboard analytics and key metrics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total_patients": 150,
  "total_screenings": 300,
  "recent_screenings": 25,
  "completion_rate": 85.5,
  "avg_vision_scores": {
    "left_eye": 19.8,
    "right_eye": 19.9
  },
  "user_role": "doctor"
}
```

#### GET /analytics/trends

Get trend analysis data.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `date_range` (string): Date range (7d, 30d, 90d, 1y)
- `group_by` (string): Grouping criteria (month, week, day)

**Response (200):**
```json
{
  "trends": [
    {
      "period": "2024-01",
      "total_screenings": 50,
      "completed_screenings": 45,
      "completion_rate": 90.0
    }
  ],
  "summary": {
    "total_periods": 12,
    "avg_completion_rate": 85.5,
    "trend_direction": "up",
    "change_percentage": 5.2
  }
}
```

#### GET /analytics/predictions

Get predictive analytics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "predictions": [
    {
      "metric": "Screening Volume",
      "current_value": 45,
      "predicted_value": 52,
      "confidence_interval": [48, 56],
      "prediction_date": "2024-02-15T00:00:00+07:00"
    }
  ]
}
```

#### GET /analytics/comparisons

Get comparison analytics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `comparison_type` (string): Type of comparison (school, grade)

**Response (200):**
```json
{
  "comparison_type": "school",
  "comparisons": [
    {
      "name": "Test School",
      "total_screenings": 50,
      "completion_rate": 90.0,
      "avg_vision_score": 19.8
    }
  ]
}
```

#### GET /analytics/performance

Get performance analytics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "completion_rate": 85.5,
  "avg_processing_time": 15.5,
  "quality_score": 92.5,
  "screenings_per_day": 8.2,
  "patients_per_screening": 1.0
}
```

### Dashboard

#### GET /dashboard/stats

Get dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total_patients": 150,
  "total_screenings": 300,
  "pending_screenings": 25,
  "completed_screenings": 275,
  "recent_activity": [
    {
      "type": "screening",
      "description": "New screening completed for John Doe",
      "timestamp": "2024-01-15T10:30:00+07:00",
      "status": "success"
    }
  ]
}
```

### Admin Panel

#### GET /admin/users

Get all users (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "users": [
    {
      "user_id": "user_123",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "doctor",
      "organization": "Test Hospital",
      "status": "active",
      "created_at": "2024-01-15T10:30:00+07:00"
    }
  ],
  "total": 1
}
```

#### GET /admin/settings

Get system settings (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "platform_name": "EVEP",
  "max_file_size": 10485760,
  "session_timeout": 86400,
  "enable_notifications": true,
  "enable_audit_logs": true,
  "enable_blockchain": true,
  "maintenance_mode": false,
  "api_rate_limit": 1000
}
```

#### PUT /admin/settings

Update system settings (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "max_file_size": 20971520,
  "session_timeout": 43200,
  "enable_notifications": true
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **General endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## WebSocket Support

The API supports real-time communication via WebSocket connections:

**WebSocket URL**: `wss://admin.evep.my-firstcare.com/socket.io`

### Events

- `connect`: Connection established
- `disconnect`: Connection closed
- `screening_update`: Real-time screening updates
- `patient_update`: Real-time patient updates
- `notification`: System notifications

## SDKs and Libraries

### Python

```python
import requests

# Authentication
response = requests.post('https://admin.evep.my-firstcare.com/api/v1/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})
token = response.json()['access_token']

# API calls
headers = {'Authorization': f'Bearer {token}'}
patients = requests.get('https://admin.evep.my-firstcare.com/api/v1/patients', headers=headers)
```

### JavaScript

```javascript
// Authentication
const response = await fetch('https://admin.evep.my-firstcare.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password'
    })
});
const { access_token } = await response.json();

// API calls
const patients = await fetch('https://admin.evep.my-firstcare.com/api/v1/patients', {
    headers: { 'Authorization': `Bearer ${access_token}` }
});
```

## Support

For API support and questions:

- **Email**: support@evep.my-firstcare.com
- **Documentation**: https://docs.evep.my-firstcare.com
- **Status Page**: https://status.evep.my-firstcare.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication system
- Patient management
- Screening management
- AI insights
- Analytics dashboard
- Admin panel
