# EVEP Quick Start Guide

## 🚀 **Get Started in 10 Minutes**

### **1. Prerequisites Check**
```bash
# Check if you have the required software
git --version
docker --version
node --version
python --version
```

### **2. Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/TELY01-DEV/evep-my-firstcare-com.git
cd evep-my-firstcare-com

# Switch to develop branch
git checkout develop

# Copy environment file
cp env.example .env
```

### **3. Start Services**
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### **4. Verify Setup**
```bash
# Test backend API
curl http://localhost:8013/health

# Test CDN service
curl http://localhost:8014/health

# Test Stardust docs
curl http://localhost:3014/health

# Frontend should be available at
# http://localhost:3013
```

## 📁 **Project Structure**

```
evep-my-firstcare-com/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── core/           # Configuration, database, security
│   │   ├── api/            # API endpoints (to be created)
│   │   ├── models/         # Database models (to be created)
│   │   └── services/       # Business logic (to be created)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── Dockerfile
├── documents/              # Project documentation
├── scripts/                # Database and setup scripts
├── docker-compose.yml      # Service orchestration
└── .env                    # Environment variables
```

## 🔧 **Development Workflow**

### **Backend Development**
```bash
# Navigate to backend
cd backend

# Install dependencies (if developing locally)
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Format code
black .
```

### **Frontend Development**
```bash
# Navigate to frontend
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

### **Database Management**
```bash
# Access MongoDB
docker exec -it evep-mongo-primary mongosh

# Access Redis
docker exec -it evep-redis-master-1 redis-cli

# View database logs
docker-compose logs mongo-primary
docker-compose logs redis-master-1
```

## 📋 **Common Commands**

### **Docker Operations**
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs -f backend

# Rebuild service
docker-compose build backend
```

### **Git Operations**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature-name

# Update from develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop
```

## 🎯 **First Tasks**

### **Backend Developer**
```yaml
Priority 1:
  - [ ] Review existing code in backend/app/
  - [ ] Understand database schema in scripts/mongo-init.js
  - [ ] Set up API routes structure
  - [ ] Implement user authentication endpoints

Priority 2:
  - [ ] Create user management API
  - [ ] Implement role-based access control
  - [ ] Set up testing framework
  - [ ] Add API documentation
```

### **Frontend Developer**
```yaml
Priority 1:
  - [ ] Review existing React components
  - [ ] Understand routing structure
  - [ ] Set up authentication UI
  - [ ] Create user dashboard

Priority 2:
  - [ ] Implement responsive design
  - [ ] Add form validation
  - [ ] Set up state management
  - [ ] Create reusable components
```

### **DevOps Engineer**
```yaml
Priority 1:
  - [ ] Review Docker Compose setup
  - [ ] Set up CI/CD pipeline
  - [ ] Configure monitoring
  - [ ] Set up automated testing

Priority 2:
  - [ ] Configure production deployment
  - [ ] Set up security scanning
  - [ ] Implement backup strategy
  - [ ] Optimize performance
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :8013
lsof -i :3013

# Kill the process or change ports in docker-compose.yml
```

#### **Docker Build Issues**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### **Database Connection Issues**
```bash
# Check if MongoDB is running
docker-compose ps mongo-primary

# Check MongoDB logs
docker-compose logs mongo-primary

# Restart MongoDB services
docker-compose restart mongo-primary mongo-secondary-1 mongo-secondary-2
```

#### **Frontend Build Issues**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 **Getting Help**

### **Team Communication**
- **Slack**: #evep-project channel
- **Daily Standup**: 09:00 AM
- **Weekly Review**: Friday 14:00 PM

### **Documentation**
- **API Docs**: http://localhost:3014/docs
- **Project Docs**: documents/ folder
- **Architecture**: documents/EVEP_Design_Specifications.md

### **Code Review**
- Create pull request for feature branches
- Request review from team members
- Follow coding standards and guidelines

## 🎯 **Success Checklist**

### **Before Starting Development**
- [ ] All services running successfully
- [ ] Can access all endpoints
- [ ] Database connections working
- [ ] Frontend loading properly
- [ ] Environment variables configured
- [ ] Git workflow understood
- [ ] Team communication channels set up

### **First Week Goals**
- [ ] Complete development environment setup
- [ ] Understand project architecture
- [ ] Complete first assigned task
- [ ] Participate in code review
- [ ] Attend daily standups
- [ ] Update project documentation

This quick start guide will help you get up and running with the EVEP project quickly and efficiently!
