# EVEP System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Components](#system-components)
4. [Technology Stack](#technology-stack)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Integration Architecture](#integration-architecture)
9. [Performance Architecture](#performance-architecture)
10. [Scalability Architecture](#scalability-architecture)
11. [Monitoring and Observability](#monitoring-and-observability)
12. [Disaster Recovery](#disaster-recovery)

## Overview

The EVEP (EYE Vision Evaluation Platform) is built using a modern, scalable, microservices-based architecture designed for high availability, security, and performance. The system follows cloud-native principles and is optimized for pediatric vision screening operations.

### Architecture Goals

- **Scalability**: Handle growing user base and data volume
- **Reliability**: 99.9% uptime with fault tolerance
- **Security**: HIPAA/GDPR compliant with end-to-end encryption
- **Performance**: Sub-second response times for critical operations
- **Maintainability**: Modular design with clear separation of concerns
- **Observability**: Comprehensive monitoring and logging

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis Cache   │    │   File Storage  │
│   (Nginx)       │    │   (Clustered)   │    │   (Internal)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Architecture Principles

### 1. Microservices Architecture

- **Service Decomposition**: Each major function is a separate service
- **Independent Deployment**: Services can be deployed independently
- **Technology Diversity**: Each service can use optimal technology
- **Fault Isolation**: Service failures don't cascade

### 2. Event-Driven Architecture

- **Asynchronous Processing**: Non-blocking operations
- **Loose Coupling**: Services communicate via events
- **Scalability**: Easy to scale individual components
- **Resilience**: Better fault tolerance

### 3. API-First Design

- **RESTful APIs**: Standard HTTP-based interfaces
- **OpenAPI Specification**: Self-documenting APIs
- **Versioning**: Backward-compatible API versions
- **Rate Limiting**: Protection against abuse

### 4. Security by Design

- **Zero Trust**: Verify every request
- **Defense in Depth**: Multiple security layers
- **Principle of Least Privilege**: Minimal required access
- **Audit Trail**: Complete activity logging

## System Components

### Frontend Layer

#### React Application
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Package Manager**: npm

#### Key Features
- **Responsive Design**: Mobile-first approach
- **Progressive Web App**: Offline capabilities
- **Real-time Updates**: WebSocket integration
- **Accessibility**: WCAG 2.1 AA compliant

#### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── services/           # API services
├── utils/              # Utility functions
└── types/              # TypeScript types
```

### Backend Layer

#### FastAPI Application
- **Framework**: FastAPI with Python 3.11+
- **Async Support**: Full async/await support
- **Auto Documentation**: OpenAPI/Swagger
- **Validation**: Pydantic models
- **Dependency Injection**: Built-in DI system

#### Service Architecture
```
app/
├── api/                # API endpoints
│   ├── auth.py        # Authentication
│   ├── patients.py    # Patient management
│   ├── screenings.py  # Screening management
│   ├── ai_insights.py # AI insights
│   ├── analytics.py   # Analytics
│   └── admin.py       # Admin functions
├── core/              # Core functionality
│   ├── config.py      # Configuration
│   ├── database.py    # Database connection
│   ├── auth.py        # Auth utilities
│   └── security.py    # Security utilities
├── models/            # Data models
├── services/          # Business logic
├── utils/             # Utility functions
└── tests/             # Test suite
```

#### Key Services
- **Authentication Service**: JWT-based auth
- **Patient Service**: Patient CRUD operations
- **Screening Service**: Screening workflow
- **AI Service**: Machine learning insights
- **Analytics Service**: Data analysis
- **Admin Service**: System administration

### Data Layer

#### MongoDB Database
- **Database**: MongoDB 6.0+ (Clustered)
- **Driver**: Motor (async)
- **Schema**: Flexible document-based
- **Indexing**: Optimized for queries
- **Backup**: Automated daily backups

#### Collections Structure
```javascript
// Users Collection
{
  "_id": ObjectId,
  "user_id": "string",
  "email": "string",
  "password_hash": "string",
  "role": "string",
  "organization": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}

// Patients Collection
{
  "_id": ObjectId,
  "patient_id": "string",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "date",
  "gender": "string",
  "school": "string",
  "grade": "string",
  "parent_info": {
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "medical_history": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}

// Screenings Collection
{
  "_id": ObjectId,
  "session_id": "string",
  "patient_id": "string",
  "examiner_id": "string",
  "screening_type": "string",
  "status": "string",
  "results": {
    "left_eye_distance": "string",
    "right_eye_distance": "string",
    "left_eye_near": "string",
    "right_eye_near": "string",
    "color_vision": "string",
    "depth_perception": "string"
  },
  "created_at": "datetime",
  "completed_at": "datetime"
}

// AI Insights Collection
{
  "_id": ObjectId,
  "insight_id": "string",
  "insight_type": "string",
  "user_id": "string",
  "patient_id": "string",
  "title": "string",
  "description": "string",
  "confidence_score": "float",
  "recommendations": ["string"],
  "risk_level": "string",
  "data_points": "object",
  "generated_at": "datetime"
}
```

#### Redis Cache
- **Cache**: Redis 7.0+ (Clustered)
- **Use Cases**: Session storage, API caching, rate limiting
- **Persistence**: RDB + AOF
- **Clustering**: 3 master + 3 replica nodes

### Infrastructure Layer

#### Container Orchestration
- **Platform**: Docker + Docker Compose
- **Orchestration**: Docker Swarm (production)
- **Service Discovery**: Built-in DNS
- **Load Balancing**: Nginx reverse proxy

#### Network Architecture
```
Internet
    │
    ▼
┌─────────────────┐
│   Load Balancer │
│   (Nginx)       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Frontend      │
│   (Port 3013)   │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Backend API   │
│   (Port 8013)   │
└─────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   Redis         │
│   (Port 27017)  │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend Technologies
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Axios**: HTTP client
- **Socket.IO**: Real-time communication

### Backend Technologies
- **FastAPI**: Web framework
- **Python 3.11+**: Programming language
- **Pydantic**: Data validation
- **Motor**: MongoDB async driver
- **Redis**: Caching and sessions
- **JWT**: Authentication
- **bcrypt**: Password hashing

### Database Technologies
- **MongoDB 6.0+**: Primary database
- **Redis 7.0+**: Caching and sessions
- **MongoDB Compass**: Database management

### Infrastructure Technologies
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **Git**: Version control
- **GitHub Actions**: CI/CD pipeline

### Monitoring Technologies
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Logging
- **Health Checks**: Service monitoring

## Data Architecture

### Data Flow

```
User Input → Frontend → API Gateway → Backend Service → Database
    │           │           │              │              │
    ▼           ▼           ▼              ▼              ▼
Validation → Processing → Authentication → Business Logic → Persistence
    │           │           │              │              │
    ▼           ▼           ▼              ▼              ▼
Response ← Frontend ← API Gateway ← Backend Service ← Database
```

### Data Models

#### User Model
```python
class User(BaseModel):
    user_id: str
    email: EmailStr
    password_hash: str
    first_name: str
    last_name: str
    role: UserRole
    organization: Optional[str]
    phone: Optional[str]
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    failed_attempts: int = 0
    locked_until: Optional[datetime]
```

#### Patient Model
```python
class Patient(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    school: str
    grade: str
    parent_name: str
    parent_phone: str
    parent_email: EmailStr
    address: Optional[str]
    medical_history: Optional[str]
    allergies: Optional[str]
    emergency_contact: Optional[str]
    status: PatientStatus = PatientStatus.active
    created_at: datetime
    updated_at: datetime
```

#### Screening Model
```python
class ScreeningSession(BaseModel):
    session_id: str
    patient_id: str
    examiner_id: str
    screening_type: ScreeningType
    equipment_used: str
    examiner_notes: Optional[str]
    status: ScreeningStatus
    results: Optional[ScreeningResults]
    created_at: datetime
    completed_at: Optional[datetime]
    blockchain_hash: Optional[str]
```

### Data Relationships

#### One-to-Many Relationships
- User → Screenings (examiner)
- Patient → Screenings
- User → AI Insights

#### Many-to-Many Relationships
- Users ↔ Organizations (through roles)
- Patients ↔ Schools (through enrollment)

### Data Validation

#### Input Validation
- **Pydantic Models**: Automatic validation
- **Custom Validators**: Business rule validation
- **Sanitization**: Input cleaning
- **Type Checking**: Runtime type validation

#### Business Rules
- **Patient Age**: Must be 6-12 years old
- **Vision Scores**: Must be valid Snellen notation
- **Email Format**: Must be valid email format
- **Phone Format**: Must be valid phone format

## Security Architecture

### Authentication & Authorization

#### JWT Authentication
```python
# Token Structure
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "doctor",
  "org": "hospital_id",
  "iat": 1642234567,
  "exp": 1642320967
}
```

#### Role-Based Access Control (RBAC)
```python
class UserRole(str, Enum):
    admin = "admin"
    doctor = "doctor"
    teacher = "teacher"
    parent = "parent"

class Permission(str, Enum):
    read_patients = "read_patients"
    write_patients = "write_patients"
    delete_patients = "delete_patients"
    conduct_screenings = "conduct_screenings"
    view_analytics = "view_analytics"
    manage_users = "manage_users"
```

#### Permission Matrix
| Role | Patients | Screenings | Analytics | Admin |
|------|----------|------------|-----------|-------|
| Admin | Full | Full | Full | Full |
| Doctor | Full | Full | Full | None |
| Teacher | Read | Limited | Basic | None |
| Parent | Own Children | None | Own Children | None |

### Data Security

#### Encryption
- **At Rest**: AES-256 encryption
- **In Transit**: TLS 1.3
- **Passwords**: bcrypt with salt
- **Sensitive Data**: Field-level encryption

#### Data Protection
- **PII Masking**: Automatic data masking
- **Audit Logging**: Complete activity tracking
- **Data Retention**: Configurable retention policies
- **Backup Encryption**: Encrypted backups

### Network Security

#### Firewall Rules
```bash
# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow SSH (restricted)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow internal services
iptables -A INPUT -p tcp --dport 8013 -j ACCEPT
iptables -A INPUT -p tcp --dport 3013 -j ACCEPT

# Block everything else
iptables -A INPUT -j DROP
```

#### SSL/TLS Configuration
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## Deployment Architecture

### Environment Strategy

#### Development Environment
- **Purpose**: Feature development and testing
- **Infrastructure**: Local Docker Compose
- **Database**: Local MongoDB and Redis
- **Deployment**: Manual deployment
- **Monitoring**: Basic logging

#### Staging Environment
- **Purpose**: Integration testing and QA
- **Infrastructure**: Cloud-based (AWS/GCP)
- **Database**: Clustered MongoDB and Redis
- **Deployment**: Automated CI/CD
- **Monitoring**: Full monitoring stack

#### Production Environment
- **Purpose**: Live user traffic
- **Infrastructure**: Multi-region cloud deployment
- **Database**: High-availability clusters
- **Deployment**: Blue-green deployment
- **Monitoring**: Enterprise monitoring

### Container Strategy

#### Multi-Stage Builds
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Service Discovery
```yaml
# docker-compose.yml
services:
  backend:
    image: evep-backend:latest
    ports:
      - "8013:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017/evep
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
```

### Deployment Pipeline

#### CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml
name: EVEP CI/CD Pipeline
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cd backend
          pytest tests/
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: |
          docker build -t evep-backend ./backend
          docker build -t evep-frontend ./frontend
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deployment logic
```

## Integration Architecture

### API Integration

#### RESTful APIs
```python
# API Endpoints
@router.get("/api/v1/patients")
@router.post("/api/v1/patients")
@router.get("/api/v1/patients/{patient_id}")
@router.put("/api/v1/patients/{patient_id}")
@router.delete("/api/v1/patients/{patient_id}")
```

#### WebSocket Integration
```python
# Real-time communication
@socketio.on('connect')
async def handle_connect(sid, environ):
    await socketio.emit('user_connected', {'user_id': user_id})

@socketio.on('screening_update')
async def handle_screening_update(sid, data):
    await socketio.emit('screening_updated', data)
```

### External Integrations

#### AI/ML Services
- **OpenAI GPT-4**: Natural language processing
- **Custom ML Models**: Vision analysis
- **TensorFlow/PyTorch**: Model training
- **Model Serving**: REST API endpoints

#### Third-Party Services
- **Email Service**: SendGrid/AWS SES
- **SMS Service**: Twilio
- **File Storage**: AWS S3/Google Cloud Storage
- **CDN**: Cloudflare/AWS CloudFront

### Data Integration

#### ETL Pipeline
```python
# Data extraction
async def extract_patient_data():
    patients = await db.patients.find({}).to_list(None)
    return patients

# Data transformation
def transform_screening_data(screenings):
    return [
        {
            'patient_id': s['patient_id'],
            'date': s['created_at'],
            'score': calculate_vision_score(s['results'])
        }
        for s in screenings
    ]

# Data loading
async def load_analytics_data(data):
    await analytics_db.insights.insert_many(data)
```

## Performance Architecture

### Caching Strategy

#### Redis Caching
```python
# Cache configuration
CACHE_CONFIG = {
    'default': {
        'backend': 'redis',
        'location': 'redis://localhost:6379/1',
        'timeout': 300
    }
}

# Cache usage
@cache(expire=300)
async def get_patient_statistics():
    return await calculate_statistics()
```

#### CDN Caching
```nginx
# Nginx caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization

#### Indexing Strategy
```javascript
// MongoDB indexes
db.patients.createIndex({ "school": 1, "grade": 1 })
db.patients.createIndex({ "first_name": 1, "last_name": 1 })
db.screenings.createIndex({ "patient_id": 1, "created_at": -1 })
db.screenings.createIndex({ "examiner_id": 1, "status": 1 })
```

#### Query Optimization
```python
# Optimized queries
async def get_patient_screenings(patient_id: str, limit: int = 10):
    return await db.screenings.find(
        {"patient_id": patient_id}
    ).sort("created_at", -1).limit(limit).to_list(None)
```

### Load Balancing

#### Nginx Load Balancer
```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Scalability Architecture

### Horizontal Scaling

#### Auto-scaling Configuration
```yaml
# Docker Swarm scaling
services:
  backend:
    image: evep-backend:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

#### Database Scaling
```javascript
// MongoDB replica set
rs.initiate({
  _id: "evep-replica-set",
  members: [
    { _id: 0, host: "mongo-primary:27017" },
    { _id: 1, host: "mongo-secondary-1:27017" },
    { _id: 2, host: "mongo-secondary-2:27017" }
  ]
})
```

### Vertical Scaling

#### Resource Allocation
```yaml
# Resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Microservices Scaling

#### Service Decomposition
```
EVEP Platform
├── Auth Service (scales independently)
├── Patient Service (scales independently)
├── Screening Service (scales independently)
├── AI Service (scales independently)
├── Analytics Service (scales independently)
└── Admin Service (scales independently)
```

## Monitoring and Observability

### Metrics Collection

#### Prometheus Metrics
```python
# Custom metrics
from prometheus_client import Counter, Histogram, Gauge

# Counters
screening_requests = Counter('screening_requests_total', 'Total screening requests')
patient_creations = Counter('patient_creations_total', 'Total patient creations')

# Histograms
request_duration = Histogram('request_duration_seconds', 'Request duration')

# Gauges
active_users = Gauge('active_users', 'Number of active users')
```

#### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": await check_database(),
            "redis": await check_redis(),
            "ai_service": await check_ai_service()
        }
    }
```

### Logging Strategy

#### Structured Logging
```python
import structlog

logger = structlog.get_logger()

async def create_patient(patient_data: dict):
    logger.info(
        "Creating patient",
        patient_id=patient_data["patient_id"],
        school=patient_data["school"],
        user_id=current_user["user_id"]
    )
```

#### Log Aggregation
```yaml
# ELK Stack configuration
services:
  elasticsearch:
    image: elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
  
  logstash:
    image: logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  
  kibana:
    image: kibana:8.0.0
    ports:
      - "5601:5601"
```

### Alerting

#### Alert Rules
```yaml
# Prometheus alert rules
groups:
  - name: evep_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

## Disaster Recovery

### Backup Strategy

#### Database Backups
```bash
#!/bin/bash
# MongoDB backup script
mongodump --host localhost --port 27017 --db evep --out /backup/$(date +%Y%m%d)
tar -czf /backup/evep_$(date +%Y%m%d).tar.gz /backup/$(date +%Y%m%d)
aws s3 cp /backup/evep_$(date +%Y%m%d).tar.gz s3://evep-backups/
```

#### Configuration Backups
```yaml
# Backup configuration
backup:
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 30  # Keep 30 days
  encryption: true
  compression: true
```

### Recovery Procedures

#### Database Recovery
```bash
#!/bin/bash
# MongoDB recovery script
aws s3 cp s3://evep-backups/evep_20240115.tar.gz /recovery/
tar -xzf /recovery/evep_20240115.tar.gz
mongorestore --host localhost --port 27017 --db evep /recovery/20240115/evep/
```

#### Service Recovery
```yaml
# Service recovery configuration
services:
  backend:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Business Continuity

#### Multi-Region Deployment
```yaml
# Multi-region configuration
regions:
  primary:
    name: "us-east-1"
    active: true
  secondary:
    name: "us-west-2"
    active: false
    failover: true
```

#### Data Replication
```javascript
// MongoDB cross-region replication
rs.initiate({
  _id: "evep-global-replica-set",
  members: [
    { _id: 0, host: "us-east-1-mongo:27017" },
    { _id: 1, host: "us-west-2-mongo:27017" }
  ]
})
```

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: April 2024
