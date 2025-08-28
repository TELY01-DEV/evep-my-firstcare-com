# EVEP (Early Vision Evaluation Platform)

A comprehensive vision screening platform designed for children aged 6-12 years, featuring AI-powered analysis, multi-platform support, and seamless communication between healthcare providers, parents, and educational institutions.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/evep-platform.git
cd evep-platform
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env file with your actual values
nano .env
```

### 3. Start Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access Services

#### Core Services
- **Frontend**: http://localhost:3013
- **Backend API**: http://localhost:8013
- **API Documentation**: http://localhost:8013/docs
- **Socket.IO Real-time**: http://localhost:8013/socket.io

#### Documentation & File Services
- **FastAPI/Swagger Docs**: http://localhost:3014
- **CDN File Access**: http://localhost:8014

#### Database Services
- **MongoDB Primary**: localhost:27019
- **MongoDB Secondary 1**: localhost:27020
- **MongoDB Secondary 2**: localhost:27021
- **MongoDB Arbiter**: localhost:27022
- **Redis Master 1**: localhost:6389
- **Redis Master 2**: localhost:6390
- **Redis Master 3**: localhost:6391
- **Redis Replica 1**: localhost:6392
- **Redis Replica 2**: localhost:6393
- **Redis Replica 3**: localhost:6394

#### Monitoring Services
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## 🏗️ Project Structure

```
evep-platform/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   └── services/       # Business logic
│   ├── tests/              # Backend tests
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Frontend tests
│   └── Dockerfile          # Frontend container
├── mobile/                 # React Native mobile app
├── documents/              # Project documentation
├── scripts/                # Utility scripts
├── monitoring/             # Monitoring configuration
├── traefik/                # Reverse proxy configuration
├── docker-compose.yml      # Development environment
└── README.md              # This file
```

## 🔧 Development

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run linting
flake8 app/
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Mobile Development
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
# Backend coverage
cd backend && pytest --cov=app

# Frontend coverage
cd frontend && npm run test:coverage
```

## 🚀 Deployment

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Staging Deployment
```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d
```

## 📊 Monitoring

### Access Monitoring Tools
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

### Key Metrics
- API response times
- Error rates
- User activity
- System resource usage

## 🔄 Real-time Features

### Socket.IO Integration
The EVEP platform includes real-time communication capabilities:

- **Real-time Updates**: Live dashboard updates for all user roles
- **Instant Notifications**: Push notifications for important events
- **Live Messaging**: Direct messaging between users
- **Room-based Communication**: Role-specific and screening-specific rooms
- **Health Monitoring**: Connection health checks and automatic reconnection

### Real-time Events
- Screening status updates
- New patient registrations
- AI analysis completions
- System alerts and notifications
- User activity tracking

## 🗄️ Database Clustering

### MongoDB Replica Set
- **Primary Node**: Handles write operations
- **Secondary Nodes**: Handle read operations and provide redundancy
- **Arbiter Node**: Participates in elections but doesn't hold data
- **Automatic Failover**: Seamless failover in case of primary node failure

### Redis Cluster
- **3 Master Nodes**: Handle data distribution
- **3 Replica Nodes**: Provide redundancy and read scaling
- **Automatic Sharding**: Data automatically distributed across masters
- **High Availability**: Automatic failover and recovery

## 🔒 Security

### Environment Variables
Ensure all sensitive data is stored in environment variables:
- API keys
- Database credentials
- JWT secrets
- External service tokens

### Security Features
- JWT authentication with blockchain audit
- Role-based access control
- Data encryption at rest and in transit
- Regular security audits

## 📚 Documentation

### Project Documentation
- [Design Specifications](documents/EVEP_Design_Specifications.md)
- [Work Projects](documents/EVEP_Work_Projects.md)
- [Workflows](documents/EVEP_Workflows.md)
- [Task List](documents/EVEP_Task_List.md)
- [Next Steps](documents/EVEP_Next_Steps.md)

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `develop`
2. Make changes and write tests
3. Run all tests and linting
4. Create pull request
5. Code review and approval
6. Merge to `develop`

### Code Standards
- Follow PEP 8 for Python
- Follow ESLint rules for JavaScript/TypeScript
- Write comprehensive tests
- Update documentation

## 📞 Support

### Getting Help
- Check the [documentation](documents/)
- Review [issues](https://github.com/your-org/evep-platform/issues)
- Contact the development team

### Reporting Issues
- Use GitHub issues
- Include detailed error messages
- Provide steps to reproduce
- Include environment information

## 📄 License

This project is proprietary software. All rights reserved.

## 🎯 Roadmap

### Phase 1: Core Platform (Months 1-3)
- [x] Project infrastructure setup
- [ ] Authentication system
- [ ] Patient management
- [ ] Basic screening tools

### Phase 2: Advanced Features (Months 4-6)
- [ ] AI/ML integration
- [ ] Mobile applications
- [ ] School integration
- [ ] Advanced analytics

### Phase 3: Integration & Optimization (Months 7-9)
- [ ] LINE integration
- [ ] Performance optimization
- [ ] Advanced reporting
- [ ] Security hardening

### Phase 4: Launch & Scale (Months 10-12)
- [ ] Production deployment
- [ ] User training
- [ ] Marketing launch
- [ ] Scale operations

---

**EVEP Platform** - Transforming pediatric vision screening with AI-powered insights.
