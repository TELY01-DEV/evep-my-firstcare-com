# EVEP Platform API Documentation

## Overview

The EVEP Platform provides a comprehensive REST API for vision screening and patient management. This documentation covers all available endpoints, request/response formats, and authentication methods.

## Base URL

```
http://localhost:8013/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Modules

### 1. Authentication Module (`/auth`)

Handles user authentication, registration, and token management.

#### Endpoints:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `GET /auth/health` - Health check

### 2. Patient Management Module (`/patient_management`)

Manages patient records, demographics, and medical history.

#### Endpoints:
- `GET /patient_management/api/v1/patients/` - List patients
- `POST /patient_management/api/v1/patients/` - Create patient
- `GET /patient_management/api/v1/patients/{patient_id}` - Get patient details
- `PUT /patient_management/api/v1/patients/{patient_id}` - Update patient
- `DELETE /patient_management/api/v1/patients/{patient_id}` - Delete patient
- `GET /patient_management/api/v1/patients/health` - Health check

### 3. Screening Module (`/screening`)

Manages vision screening sessions and assessments.

#### Endpoints:
- `GET /screening/api/v1/screenings/` - List screenings
- `POST /screening/api/v1/screenings/` - Create screening
- `GET /screening/api/v1/screenings/{screening_id}` - Get screening details
- `PUT /screening/api/v1/screenings/{screening_id}` - Update screening
- `POST /screening/api/v1/screenings/{screening_id}/start` - Start screening
- `POST /screening/api/v1/screenings/{screening_id}/complete` - Complete screening
- `GET /screening/api/v1/screenings/health` - Health check

### 4. AI/ML Module (`/ai_ml`)

Provides AI-powered insights and analysis.

#### Endpoints:
- `POST /ai_ml/analyze-screening` - Analyze screening results
- `POST /ai_ml/generate-insights` - Generate AI insights
- `POST /ai_ml/predict-risk` - Predict risk assessment
- `POST /ai_ml/embed` - Create vector embeddings
- `POST /ai_ml/search-similar` - Search similar content
- `GET /ai_ml/prompts` - Get prompt templates
- `POST /ai_ml/conversations` - Start AI conversation
- `GET /ai_ml/analytics/insights` - Get insights analytics
- `GET /ai_ml/health` - Health check

### 5. LINE Integration Module (`/line_integration`)

Manages LINE Bot integration and messaging.

#### Endpoints:
- `POST /line_integration/webhook` - LINE webhook handler
- `POST /line_integration/send-message` - Send LINE message
- `POST /line_integration/screening-reminder` - Send screening reminder
- `GET /line_integration/analytics` - Get LINE analytics
- `GET /line_integration/health` - Health check

### 6. LINE Bot Manager (`/line_integration/bot`)

Manages LINE Bot settings and configurations.

#### Endpoints:
- `GET /line_integration/bot/settings` - Get bot settings
- `PUT /line_integration/bot/settings` - Update bot settings
- `GET /line_integration/bot/keyword-replies` - Get keyword replies
- `POST /line_integration/bot/keyword-replies` - Create keyword reply
- `GET /line_integration/bot/flex-messages` - Get flex messages
- `POST /line_integration/bot/flex-messages` - Create flex message
- `GET /line_integration/bot/rich-menus` - Get rich menus
- `POST /line_integration/bot/rich-menus` - Create rich menu

### 7. Reporting Module (`/reporting`)

Generates reports and analytics.

#### Endpoints:
- `GET /reporting/api/v1/reports/analytics/patients` - Patient analytics
- `GET /reporting/api/v1/reports/analytics/screenings` - Screening analytics
- `GET /reporting/api/v1/reports/dashboard/patient-summary` - Patient dashboard
- `GET /reporting/api/v1/reports/dashboard/screening-summary` - Screening dashboard
- `GET /reporting/api/v1/reports/export/patients` - Export patient data
- `GET /reporting/api/v1/reports/export/screenings` - Export screening data

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

## Rate Limiting

API requests are rate-limited to prevent abuse. Limits are:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## WebSocket Support

Real-time updates are available via WebSocket connections:
- `ws://localhost:8013/ws` - Real-time notifications and updates

## Testing

You can test the API using:
- Swagger UI: http://localhost:8013/docs
- ReDoc: http://localhost:8013/redoc
- Postman collection: documents/api/postman-collection.json

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- React Native
- Flutter

## Support

For API support and questions:
- Documentation: documents/api/
- Issues: GitHub repository
- Email: support@evep-platform.com

---

*Generated on: $(date)*
*API Version: 1.0.0*
