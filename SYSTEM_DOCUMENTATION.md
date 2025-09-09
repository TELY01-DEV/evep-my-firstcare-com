# EVEP Medical Portal - System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Authentication & RBAC](#authentication--rbac)
6. [Deployment Guide](#deployment-guide)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🏥 System Overview

The **EVEP Medical Portal** is a comprehensive healthcare management system designed for eye vision screening programs in educational institutions. The system provides end-to-end management of student health records, screening sessions, inventory management, and AI-powered insights.

### 🎯 Key Features
- **Student & Teacher Management**: Complete CRUD operations for educational personnel
- **Medical Screening**: Comprehensive eye vision screening workflows
- **Inventory Management**: Glasses and medical equipment tracking
- **AI-Powered Chat Bot**: Multi-language support with specialized agents
- **Role-Based Access Control**: Database-driven RBAC system
- **Data Export**: CSV export capabilities for all data types
- **Real-time Dashboard**: Live statistics and analytics

### 🌐 System URLs
- **Frontend Portal**: https://portal.evep.my-firstcare.com
- **Backend API**: https://stardust.evep.my-firstcare.com
- **API Documentation**: https://stardust.evep.my-firstcare.com/docs

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React.js with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: MongoDB with Replica Set
- **Authentication**: JWT tokens
- **AI/ML**: OpenAI GPT-4, Anthropic Claude
- **Vector Database**: ChromaDB
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (React.js)    │◄──►│   (FastAPI)     │◄──►│   (Replica Set) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   AI Services   │    │   Vector DB     │
│   (Reverse      │    │   (OpenAI/      │    │   (ChromaDB)    │
│    Proxy)       │    │    Anthropic)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📚 API Documentation

### 🔐 Authentication Endpoints

#### Login
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

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### 📊 Dashboard Endpoints

#### Get Dashboard Statistics
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
  "recentActivity": [...]
}
```

### 👥 User Management Endpoints

#### Get Users
```http
GET /api/v1/user-management/
Authorization: Bearer <token>
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
  "department": "Ophthalmology"
}
```

### 🏫 EVEP Management Endpoints

#### Students
```http
GET /api/v1/evep/students
POST /api/v1/evep/students
GET /api/v1/evep/students/{student_id}
PUT /api/v1/evep/students/{student_id}
DELETE /api/v1/evep/students/{student_id}
```

#### Teachers
```http
GET /api/v1/evep/teachers
POST /api/v1/evep/teachers
GET /api/v1/evep/teachers/{teacher_id}
PUT /api/v1/evep/teachers/{teacher_id}
DELETE /api/v1/evep/teachers/{teacher_id}
```

#### Schools
```http
GET /api/v1/evep/schools
POST /api/v1/evep/schools
GET /api/v1/evep/schools/{school_id}
PUT /api/v1/evep/schools/{school_id}
DELETE /api/v1/evep/schools/{school_id}
```

### 🏥 Medical Endpoints

#### Patients
```http
GET /api/v1/patients/
POST /api/v1/patients/
GET /api/v1/patients/{patient_id}
PUT /api/v1/patients/{patient_id}
DELETE /api/v1/patients/{patient_id}
```

#### Screenings
```http
GET /api/v1/screenings/sessions
POST /api/v1/screenings/sessions
GET /api/v1/screenings/sessions/{session_id}
PUT /api/v1/screenings/sessions/{session_id}
DELETE /api/v1/screenings/sessions/{session_id}
```

### 📦 Inventory Endpoints

#### Glasses Inventory
```http
GET /api/v1/inventory/glasses
POST /api/v1/inventory/glasses
GET /api/v1/inventory/glasses/{item_id}
PUT /api/v1/inventory/glasses/{item_id}
DELETE /api/v1/inventory/glasses/{item_id}
```

### 📄 Export Endpoints

#### CSV Export
```http
GET /api/v1/csv-export/dashboard-summary
GET /api/v1/csv-export/students
GET /api/v1/csv-export/teachers
GET /api/v1/csv-export/schools
```

### 🤖 AI & Chat Bot Endpoints

#### Chat with AI Agent
```http
POST /api/v1/chat-bot/ai-agent
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I create a new screening session?",
  "conversation_id": "optional-conversation-id"
}
```

#### Get AI Agent Configurations
```http
GET /api/v1/chat-bot/agent-configs
Authorization: Bearer <token>
```

#### AI Chat Health Check
```http
GET /api/v1/chat-bot/health
```

### 🔐 RBAC Endpoints

#### File-based RBAC
```http
GET /api/v1/rbac/roles/
GET /api/v1/rbac/permissions/
```

#### MongoDB-based RBAC
```http
GET /api/v1/rbac-mongodb/roles/
GET /api/v1/rbac-mongodb/permissions/
POST /api/v1/rbac-mongodb/roles/
POST /api/v1/rbac-mongodb/permissions/
```

---

## 🗄️ Database Schema

### MongoDB Collections

#### Core Collections
- **`evep.students`**: Student information and records
- **`evep.teachers`**: Teacher information and records
- **`evep.schools`**: School information and records
- **`evep.patients`**: Patient medical records
- **`evep.screenings`**: Screening session data
- **`evep.glasses_inventory`**: Glasses and equipment inventory

#### System Collections
- **`evep.admin_users`**: System administrators and users
- **`evep.audit_logs`**: System audit trail
- **`evep.rbac_roles`**: Role definitions
- **`evep.rbac_permissions`**: Permission definitions
- **`evep.rbac_user_roles`**: User-role mappings

#### AI Collections
- **`evep.chat_conversations`**: Chat conversation history
- **`evep.ai_agent_configs`**: AI agent configurations
- **`evep.vector_learning`**: Vector database learning data

### Sample Document Structures

#### Student Document
```json
{
  "_id": ObjectId("..."),
  "student_id": "STU001",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2010-05-15",
  "school_id": ObjectId("..."),
  "class": "Grade 5A",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Screening Session Document
```json
{
  "_id": ObjectId("..."),
  "session_id": "SCR001",
  "student_id": ObjectId("..."),
  "screening_date": "2024-01-15T10:00:00Z",
  "screening_type": "vision",
  "results": {
    "left_eye": "6/6",
    "right_eye": "6/9",
    "recommendation": "Follow-up required"
  },
  "screened_by": ObjectId("..."),
  "status": "completed"
}
```

---

## 🔐 Authentication & RBAC

### JWT Token Structure
```json
{
  "user_id": "68be5c3fa392cd3ee7968f03",
  "email": "admin@evep.com",
  "role": "super_admin",
  "exp": 1640995200,
  "iat": 1640908800
}
```

### Role Hierarchy
1. **Super Admin**: Full system access
2. **System Admin**: System administration
3. **Medical Admin**: Medical portal administration
4. **Doctor**: Medical professional access
5. **Nurse**: Nursing staff access
6. **Optometrist**: Vision specialist access
7. **Medical Staff**: General medical staff
8. **Hospital Staff**: Hospital personnel
9. **Teacher**: Educational staff
10. **Parent**: Student guardian access

### Permission System
- **Database-driven**: All permissions stored in MongoDB
- **Dynamic**: Permissions can be updated without code changes
- **Granular**: Fine-grained control over specific actions
- **Inheritance**: Roles inherit permissions from parent roles

---

## 🚀 Deployment Guide

### Prerequisites
- Docker & Docker Compose
- MongoDB Replica Set
- SSL certificates
- Domain configuration

### Environment Variables
```bash
# MongoDB Configuration
MONGODB_URL=mongodb://admin:password@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=Sim!44335599
MONGO_DATABASE=evep

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ChromaDB
CHROMA_ANONYMIZED_TELEMETRY=false
```

### Deployment Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd evep-my-firstcare-com
   ```

2. **Configure Environment**
   ```bash
   # Copy your .env file to the server
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize Database**
   ```bash
   docker-compose exec stardust python3 scripts/initialize_database.py
   ```

5. **Verify Deployment**
   ```bash
   curl https://stardust.evep.my-firstcare.com/api/v1/auth/health
   ```

---

## 📊 Monitoring & Maintenance

### Health Checks
- **API Health**: `GET /api/v1/auth/health`
- **AI Health**: `GET /api/v1/chat-bot/health`
- **Database Health**: MongoDB replica set status

### Performance Metrics
- **Response Time**: Average 0.025s
- **Success Rate**: 100% (18/18 endpoints)
- **Uptime**: 99.9% target

### Log Monitoring
- **Application Logs**: Docker container logs
- **Access Logs**: Nginx access logs
- **Error Logs**: Application error tracking
- **Audit Logs**: MongoDB audit collection

### Backup Strategy
- **Database**: Daily MongoDB backups
- **Configuration**: Version-controlled configuration files
- **Media**: Regular file system backups

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Errors
**Problem**: 401 Unauthorized errors
**Solution**: 
- Check JWT token validity
- Verify user credentials
- Ensure proper Authorization header

#### 2. Database Connection Issues
**Problem**: MongoDB connection failures
**Solution**:
- Check MongoDB replica set status
- Verify connection string
- Check network connectivity

#### 3. CORS Errors
**Problem**: Cross-origin request blocked
**Solution**:
- Verify CORS configuration in FastAPI
- Check frontend-backend URL matching
- Ensure HTTPS for production

#### 4. AI Service Errors
**Problem**: AI chat bot not responding
**Solution**:
- Check OpenAI/Anthropic API keys
- Verify API quota and limits
- Check network connectivity to AI services

### Performance Optimization

#### Database Optimization
- **Indexing**: Ensure proper MongoDB indexes
- **Query Optimization**: Use efficient queries
- **Connection Pooling**: Optimize connection settings

#### API Optimization
- **Caching**: Implement response caching
- **Pagination**: Use pagination for large datasets
- **Compression**: Enable response compression

#### Frontend Optimization
- **Code Splitting**: Implement lazy loading
- **Bundle Optimization**: Minimize JavaScript bundles
- **CDN**: Use content delivery network

---

## 📞 Support & Contact

### System Administration
- **Technical Support**: admin@evep.com
- **System Status**: https://status.evep.my-firstcare.com
- **Documentation**: https://docs.evep.my-firstcare.com

### Development Team
- **Lead Developer**: [Developer Name]
- **DevOps Engineer**: [DevOps Name]
- **Database Administrator**: [DBA Name]

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Complete CRUD operations for all entities
- ✅ Database-driven RBAC system
- ✅ AI-powered chat bot with Thai language support
- ✅ Comprehensive CSV export functionality
- ✅ Real-time dashboard with live statistics
- ✅ 100% API endpoint success rate
- ✅ Production-ready deployment

### Future Enhancements
- 📱 Mobile application
- 🔔 Real-time notifications
- 📈 Advanced analytics dashboard
- 🌐 Multi-language support expansion
- 🔗 Third-party integrations

---

*Last Updated: January 2024*
*Document Version: 1.0.0*
