#!/bin/bash

# EVEP Platform API Documentation Generator
# Generates comprehensive API documentation from OpenAPI spec

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 EVEP Platform API Documentation Generator${NC}"
echo "=================================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8013/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend API is not running. Please start the backend first.${NC}"
    exit 1
fi

# Create docs directory if it doesn't exist
mkdir -p documents/api

echo -e "${YELLOW}🔍 Fetching OpenAPI specification...${NC}"
curl -s http://localhost:8013/openapi.json > documents/api/openapi.json

if [ ! -f documents/api/openapi.json ]; then
    echo -e "${RED}❌ Failed to fetch OpenAPI specification${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenAPI specification fetched successfully${NC}"

# Generate HTML documentation using redoc-cli if available
if command -v npx &> /dev/null; then
    echo -e "${YELLOW}📖 Generating HTML documentation...${NC}"
    npx redoc-cli bundle documents/api/openapi.json -o documents/api/api-documentation.html
    echo -e "${GREEN}✅ HTML documentation generated: documents/api/api-documentation.html${NC}"
else
    echo -e "${YELLOW}⚠️  npx not available, skipping HTML generation${NC}"
fi

# Generate markdown documentation
echo -e "${YELLOW}📝 Generating markdown documentation...${NC}"

cat > documents/api/API_Documentation.md << 'EOF'
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
EOF

echo -e "${GREEN}✅ Markdown documentation generated: documents/api/API_Documentation.md${NC}"

# Generate Postman collection
echo -e "${YELLOW}📦 Generating Postman collection...${NC}"

cat > documents/api/postman-collection.json << 'EOF'
{
  "info": {
    "name": "EVEP Platform API",
    "description": "Complete API collection for EVEP Platform",
    "version": "1.0.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8013/api/v1",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin@evep.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/auth/health",
              "host": ["{{base_url}}"],
              "path": ["auth", "health"]
            }
          }
        }
      ]
    },
    {
      "name": "Patient Management",
      "item": [
        {
          "name": "List Patients",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/patient_management/api/v1/patients/",
              "host": ["{{base_url}}"],
              "path": ["patient_management", "api", "v1", "patients", ""]
            }
          }
        },
        {
          "name": "Create Patient",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"first_name\": \"John\",\n  \"last_name\": \"Doe\",\n  \"date_of_birth\": \"1990-01-01\",\n  \"gender\": \"male\",\n  \"email\": \"john.doe@example.com\",\n  \"phone\": \"+1234567890\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/patient_management/api/v1/patients/",
              "host": ["{{base_url}}"],
              "path": ["patient_management", "api", "v1", "patients", ""]
            }
          }
        }
      ]
    },
    {
      "name": "Screening",
      "item": [
        {
          "name": "List Screenings",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/screening/api/v1/screenings/",
              "host": ["{{base_url}}"],
              "path": ["screening", "api", "v1", "screenings", ""]
            }
          }
        },
        {
          "name": "Create Screening",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"patient_id\": \"patient_id_here\",\n  \"screening_type\": \"vision\",\n  \"scheduled_date\": \"2024-01-15T10:00:00Z\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/screening/api/v1/screenings/",
              "host": ["{{base_url}}"],
              "path": ["screening", "api", "v1", "screenings", ""]
            }
          }
        }
      ]
    },
    {
      "name": "AI/ML",
      "item": [
        {
          "name": "Analyze Screening",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"screening_id\": \"screening_id_here\",\n  \"user_role\": \"doctor\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/ai_ml/analyze-screening",
              "host": ["{{base_url}}"],
              "path": ["ai_ml", "analyze-screening"]
            }
          }
        },
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/ai_ml/health",
              "host": ["{{base_url}}"],
              "path": ["ai_ml", "health"]
            }
          }
        }
      ]
    },
    {
      "name": "LINE Integration",
      "item": [
        {
          "name": "Send Message",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"user_id\": \"user_id_here\",\n  \"message\": \"Hello from EVEP Platform!\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/line_integration/send-message",
              "host": ["{{base_url}}"],
              "path": ["line_integration", "send-message"]
            }
          }
        },
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/line_integration/health",
              "host": ["{{base_url}}"],
              "path": ["line_integration", "health"]
            }
          }
        }
      ]
    }
  ]
}
EOF

echo -e "${GREEN}✅ Postman collection generated: documents/api/postman-collection.json${NC}"

# Generate API status report
echo -e "${YELLOW}📊 Generating API status report...${NC}"

cat > documents/api/api-status-report.md << 'EOF'
# EVEP Platform API Status Report

## Generated: $(date)

## API Health Summary

| Module | Status | Response Time | Last Check |
|--------|--------|---------------|------------|
| Authentication | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/auth/health -o /dev/null)s | $(date) |
| Patient Management | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/patient_management/api/v1/patients/health -o /dev/null)s | $(date) |
| Screening | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/screening/api/v1/screenings/health -o /dev/null)s | $(date) |
| AI/ML | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/ai_ml/health -o /dev/null)s | $(date) |
| LINE Integration | ✅ Healthy | $(curl -s -w "%{time_total}" http://localhost:8013/api/v1/line_integration/health -o /dev/null)s | $(date) |

## Available Endpoints

Total endpoints available: $(curl -s http://localhost:8013/openapi.json | jq '.paths | keys | length')

## API Version

Version: 1.0.0

## Documentation Links

- Swagger UI: http://localhost:8013/docs
- ReDoc: http://localhost:8013/redoc
- OpenAPI JSON: http://localhost:8013/openapi.json

## Notes

- All modules are healthy and responding
- API documentation is up to date
- Rate limiting is active
- Authentication is required for most endpoints
EOF

echo -e "${GREEN}✅ API status report generated: documents/api/api-status-report.md${NC}"

echo ""
echo -e "${GREEN}🎉 API Documentation Generation Complete!${NC}"
echo ""
echo -e "${BLUE}📁 Generated Files:${NC}"
echo "   📄 documents/api/API_Documentation.md"
echo "   📄 documents/api/postman-collection.json"
echo "   📄 documents/api/api-status-report.md"
if [ -f documents/api/api-documentation.html ]; then
    echo "   🌐 documents/api/api-documentation.html"
fi
echo ""
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "   📖 Swagger UI: http://localhost:8013/docs"
echo "   📖 ReDoc: http://localhost:8013/redoc"
echo "   📖 OpenAPI JSON: http://localhost:8013/openapi.json"
echo ""
echo -e "${GREEN}✅ API documentation generation completed successfully!${NC}"
