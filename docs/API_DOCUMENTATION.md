# EVEP Platform API Documentation

## Overview

This document provides comprehensive API documentation for the EVEP (Eye Vision Examination Platform) User Management and Medical Staff Management systems.

## Base Configuration

### API Base URLs
- **Production**: `https://stardust.evep.my-firstcare.com`
- **Development**: `http://localhost:8014`

### Authentication
All API endpoints require JWT authentication via Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

---

## User Management API

Base endpoint: `/api/v1/user-management`

### Authentication & Authorization

Required roles for User Management operations:
- **Create/Edit Users**: `super_admin`, `system_admin`, `medical_admin`
- **View Users**: All authenticated users
- **Delete/Deactivate Users**: `super_admin`, `system_admin`

### Data Models

#### UserCreate
```typescript
{
  email: string;              // Valid email address
  password: string;           // Minimum 8 characters
  first_name: string;         // Required
  last_name: string;          // Required
  role: string;               // See supported roles below
  department?: string;        // Optional department
  phone?: string;             // Optional phone number
  is_active: boolean;         // Default: true
}
```

#### UserUpdate
```typescript
{
  first_name?: string;
  last_name?: string;
  role?: string;
  department?: string;
  phone?: string;
  password?: string;          // Optional password change
  is_active?: boolean;
}
```

#### UserResponse
```typescript
{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

### Supported Roles

```typescript
enum UserRoles {
  "super_admin"     // Full system access
  "system_admin"    // System administration
  "medical_admin"   // Medical system admin
  "doctor"          // Medical practitioner
  "nurse"           // Nursing staff
  "optometrist"     // Eye care specialist
  "technician"      // Technical support
  "coordinator"     // Operations coordinator
  "assistant"       // Administrative assistant
}
```

### Endpoints

#### Create User
```http
POST /api/v1/user-management/
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "john.doe@evep.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "department": "Ophthalmology",
  "phone": "+1234567890",
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user_id": "68b7040f529c345875e5c87e",
  "user": {
    "id": "68b7040f529c345875e5c87e",
    "email": "john.doe@evep.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "department": "Ophthalmology",
    "phone": "+1234567890",
    "is_active": true,
    "created_at": "2025-01-03T10:30:00Z"
  }
}
```

#### List Users
```http
GET /api/v1/user-management/?page=1&limit=10&role=doctor&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `role` (optional): Filter by role
- `search` (optional): Search in name/email
- `department` (optional): Filter by department
- `is_active` (optional): Filter by status (true/false)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "68b7040f529c345875e5c87e",
      "email": "john.doe@evep.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "doctor",
      "department": "Ophthalmology",
      "is_active": true,
      "last_login": "2025-01-03T09:15:00Z",
      "created_at": "2025-01-03T10:30:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 25,
  "total_pages": 3
}
```

#### Get User Details
```http
GET /api/v1/user-management/{user_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "68b7040f529c345875e5c87e",
  "email": "john.doe@evep.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "department": "Ophthalmology",
  "phone": "+1234567890",
  "avatar": "https://cdn.evep.my-firstcare.com/avatars/john_doe.jpg",
  "is_active": true,
  "last_login": "2025-01-03T09:15:00Z",
  "created_at": "2025-01-03T10:30:00Z",
  "updated_at": "2025-01-03T11:45:00Z"
}
```

#### Update User
```http
PUT /api/v1/user-management/{user_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "first_name": "John",
  "last_name": "Smith",
  "department": "Emergency Medicine",
  "phone": "+1987654321"
}
```

**Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "68b7040f529c345875e5c87e",
    "email": "john.doe@evep.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "doctor",
    "department": "Emergency Medicine",
    "phone": "+1987654321",
    "is_active": true,
    "updated_at": "2025-01-03T12:00:00Z"
  }
}
```

#### Deactivate User
```http
DELETE /api/v1/user-management/{user_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User deactivated successfully",
  "user_id": "68b7040f529c345875e5c87e"
}
```

#### Activate User
```http
POST /api/v1/user-management/{user_id}/activate
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User activated successfully",
  "user_id": "68b7040f529c345875e5c87e"
}
```

#### User Statistics
```http
GET /api/v1/user-management/statistics/overview
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "total_users": 150,
  "active_users": 142,
  "inactive_users": 8,
  "users_by_role": {
    "doctor": 45,
    "nurse": 60,
    "technician": 25,
    "coordinator": 15,
    "assistant": 5
  },
  "recent_logins": 89,
  "new_users_this_month": 12
}
```

---

## Medical Staff Management API

Base endpoint: `/api/v1/medical-staff-management`

### Authentication & Authorization

Required roles for Medical Staff Management operations:
- **Create/Edit Staff**: `admin`, `supervisor`, `hr_manager`
- **View Staff**: `admin`, `supervisor`, `hr_manager`, `doctor`, `nurse`
- **Delete Staff**: `admin`, `hr_manager`
- **Manage Credentials**: `admin`, `supervisor`, `hr_manager`

### Data Models

#### MedicalStaffCreate
```typescript
{
  email: string;              // Valid email address
  password: string;           // Minimum 8 characters
  first_name: string;         // Required
  last_name: string;          // Required
  role: string;               // See supported roles below
  department?: string;        // Medical department
  specialization?: string;    // Medical specialization
  phone?: string;             // Contact number
  license_number?: string;    // Medical license number
  qualifications?: string[];  // Professional qualifications
  is_active: boolean;         // Default: true
}
```

#### MedicalStaffUpdate
```typescript
{
  first_name?: string;
  last_name?: string;
  role?: string;
  department?: string;
  specialization?: string;
  phone?: string;
  license_number?: string;
  qualifications?: string[];
  is_active?: boolean;
}
```

#### MedicalStaffResponse
```typescript
{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  specialization?: string;
  phone?: string;
  license_number?: string;
  qualifications?: string[];
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

### Supported Medical Roles

```typescript
enum MedicalStaffRoles {
  "doctor"              // Medical doctor
  "nurse"               // Registered nurse
  "medical_staff"       // General medical staff
  "exclusive_hospital"  // Hospital-specific staff
  "teacher"             // School health staff
  "school_admin"        // School health administrator
  "school_staff"        // School health support
}
```

### Endpoints

#### Create Medical Staff
```http
POST /api/v1/medical-staff-management/
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "dr.smith@evep.com",
  "password": "MedicalPass123!",
  "first_name": "Sarah",
  "last_name": "Smith",
  "role": "doctor",
  "department": "Pediatric Ophthalmology",
  "specialization": "Pediatric Eye Care",
  "phone": "+1234567890",
  "license_number": "MD123456789",
  "qualifications": ["MD", "Board Certified Ophthalmologist"],
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "message": "Medical staff created successfully",
  "staff_id": "68b7040f529c345875e5c88f",
  "staff": {
    "id": "68b7040f529c345875e5c88f",
    "email": "dr.smith@evep.com",
    "first_name": "Sarah",
    "last_name": "Smith",
    "role": "doctor",
    "department": "Pediatric Ophthalmology",
    "specialization": "Pediatric Eye Care",
    "license_number": "MD123456789",
    "is_active": true,
    "created_at": "2025-01-03T10:30:00Z"
  }
}
```

#### List Medical Staff
```http
GET /api/v1/medical-staff-management/?page=1&limit=10&role=doctor&department=Ophthalmology
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `role` (optional): Filter by medical role
- `department` (optional): Filter by department
- `specialization` (optional): Filter by specialization
- `is_active` (optional): Filter by status (true/false)

**Response (200 OK):**
```json
{
  "staff": [
    {
      "id": "68b7040f529c345875e5c88f",
      "email": "dr.smith@evep.com",
      "first_name": "Sarah",
      "last_name": "Smith",
      "role": "doctor",
      "department": "Pediatric Ophthalmology",
      "specialization": "Pediatric Eye Care",
      "license_number": "MD123456789",
      "qualifications": ["MD", "Board Certified Ophthalmologist"],
      "is_active": true,
      "last_login": "2025-01-03T09:15:00Z",
      "created_at": "2025-01-03T10:30:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 45,
  "total_pages": 5
}
```

#### Get Medical Staff Details
```http
GET /api/v1/medical-staff-management/{staff_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "68b7040f529c345875e5c88f",
  "email": "dr.smith@evep.com",
  "first_name": "Sarah",
  "last_name": "Smith",
  "role": "doctor",
  "department": "Pediatric Ophthalmology",
  "specialization": "Pediatric Eye Care",
  "phone": "+1234567890",
  "license_number": "MD123456789",
  "qualifications": ["MD", "Board Certified Ophthalmologist"],
  "avatar": "https://cdn.evep.my-firstcare.com/avatars/dr_smith.jpg",
  "is_active": true,
  "last_login": "2025-01-03T09:15:00Z",
  "created_at": "2025-01-03T10:30:00Z",
  "updated_at": "2025-01-03T11:45:00Z"
}
```

#### Update Medical Staff
```http
PUT /api/v1/medical-staff-management/{staff_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "department": "General Ophthalmology",
  "specialization": "Retinal Disorders",
  "phone": "+1987654321",
  "qualifications": ["MD", "Board Certified Ophthalmologist", "Retinal Specialist"]
}
```

**Response (200 OK):**
```json
{
  "message": "Medical staff updated successfully",
  "staff": {
    "id": "68b7040f529c345875e5c88f",
    "email": "dr.smith@evep.com",
    "first_name": "Sarah",
    "last_name": "Smith",
    "role": "doctor",
    "department": "General Ophthalmology",
    "specialization": "Retinal Disorders",
    "phone": "+1987654321",
    "qualifications": ["MD", "Board Certified Ophthalmologist", "Retinal Specialist"],
    "is_active": true,
    "updated_at": "2025-01-03T12:00:00Z"
  }
}
```

#### Medical Staff Statistics
```http
GET /api/v1/medical-staff-management/statistics/overview
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "total_staff": 85,
  "active_staff": 82,
  "inactive_staff": 3,
  "staff_by_role": {
    "doctor": 25,
    "nurse": 35,
    "medical_staff": 15,
    "teacher": 10
  },
  "staff_by_department": {
    "Ophthalmology": 40,
    "Pediatrics": 20,
    "Emergency": 15,
    "Administration": 10
  },
  "credentials_expiring_soon": 8,
  "training_due": 12
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message description",
  "status_code": 400,
  "error_type": "ValidationError",
  "timestamp": "2025-01-03T12:00:00Z"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

### Error Examples

#### Validation Error (422)
```json
{
  "detail": "Validation failed",
  "status_code": 422,
  "error_type": "ValidationError",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2025-01-03T12:00:00Z"
}
```

#### Permission Error (403)
```json
{
  "detail": "Insufficient permissions to perform this action",
  "status_code": 403,
  "error_type": "PermissionError",
  "required_roles": ["admin", "supervisor"],
  "user_role": "doctor",
  "timestamp": "2025-01-03T12:00:00Z"
}
```

#### Resource Not Found (404)
```json
{
  "detail": "User not found",
  "status_code": 404,
  "error_type": "NotFoundError",
  "resource_type": "User",
  "resource_id": "invalid_id",
  "timestamp": "2025-01-03T12:00:00Z"
}
```

---

## Rate Limiting

### Rate Limits
- **General API calls**: 1000 requests per hour per user
- **Authentication endpoints**: 10 requests per minute per IP
- **File upload endpoints**: 50 requests per hour per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641211200
```

### Rate Limit Exceeded Response (429)
```json
{
  "detail": "Rate limit exceeded",
  "status_code": 429,
  "error_type": "RateLimitError",
  "retry_after": 3600,
  "timestamp": "2025-01-03T12:00:00Z"
}
```

---

## File Upload API

### Avatar Upload
```http
POST /api/v1/cdn/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <image_file>
```

**Response (200 OK):**
```json
{
  "message": "File uploaded successfully",
  "download_url": "/uploads/avatars/user_123_avatar.jpg",
  "file_size": 245760,
  "content_type": "image/jpeg",
  "upload_id": "upload_123456789"
}
```

### Update User Avatar
```http
PUT /api/v1/auth/profile/avatar
Content-Type: application/json
Authorization: Bearer <token>

{
  "avatar_url": "https://stardust.evep.my-firstcare.com/uploads/avatars/user_123_avatar.jpg"
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK Usage

```typescript
import { UnifiedApiService } from './services/unifiedApi';

const api = new UnifiedApiService();

// Create a new user
const createUser = async () => {
  try {
    const response = await api.post('/api/v1/user-management/', {
      email: 'john.doe@evep.com',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe',
      role: 'doctor',
      department: 'Ophthalmology'
    });
    
    console.log('User created:', response.data);
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// List users with pagination
const listUsers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/v1/user-management/?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Upload avatar
const uploadAvatar = async (file: File) => {
  try {
    const response = await api.uploadFile('/api/v1/cdn/upload', file);
    const avatarUrl = `https://stardust.evep.my-firstcare.com${response.data.download_url}`;
    
    // Update user profile with new avatar
    await api.put('/api/v1/auth/profile/avatar', { avatar_url: avatarUrl });
    
    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
```

### Python SDK Usage

```python
import requests
from typing import Dict, Any, Optional

class EVEPApiClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        response = requests.post(
            f'{self.base_url}/api/v1/user-management/',
            json=user_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def list_users(self, page: int = 1, limit: int = 10, **filters) -> Dict[str, Any]:
        """List users with pagination and filters"""
        params = {'page': page, 'limit': limit, **filters}
        response = requests.get(
            f'{self.base_url}/api/v1/user-management/',
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_user_statistics(self) -> Dict[str, Any]:
        """Get user statistics"""
        response = requests.get(
            f'{self.base_url}/api/v1/user-management/statistics/overview',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = EVEPApiClient('https://stardust.evep.my-firstcare.com', 'your_jwt_token')

# Create user
user_data = {
    'email': 'john.doe@evep.com',
    'password': 'SecurePass123!',
    'first_name': 'John',
    'last_name': 'Doe',
    'role': 'doctor',
    'department': 'Ophthalmology'
}

new_user = client.create_user(user_data)
print(f"Created user: {new_user['user']['id']}")

# List users
users = client.list_users(page=1, limit=10, role='doctor')
print(f"Found {users['total']} doctors")
```

---

## Testing

### API Testing with curl

```bash
# Set environment variables
export API_BASE="https://stardust.evep.my-firstcare.com"
export TOKEN="your_jwt_token_here"

# Test user creation
curl -X POST "$API_BASE/api/v1/user-management/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@evep.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "doctor",
    "department": "Testing"
  }'

# Test user listing
curl -X GET "$API_BASE/api/v1/user-management/?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Test user statistics
curl -X GET "$API_BASE/api/v1/user-management/statistics/overview" \
  -H "Authorization: Bearer $TOKEN"
```

### Postman Collection

A Postman collection is available with pre-configured requests for all endpoints. Import the collection and set the following environment variables:

- `base_url`: `https://stardust.evep.my-firstcare.com`
- `token`: Your JWT authentication token

---

## Changelog

### Version 1.2.0 (2025-01-03)
- Added comprehensive error handling
- Implemented rate limiting
- Added file upload support for avatars
- Enhanced user statistics endpoint
- Added medical staff management endpoints

### Version 1.1.0 (2024-12-15)
- Added pagination support
- Implemented role-based filtering
- Added user activation/deactivation endpoints
- Enhanced search functionality

### Version 1.0.0 (2024-12-01)
- Initial API release
- Basic CRUD operations for users
- JWT authentication implementation
- Role-based access control



