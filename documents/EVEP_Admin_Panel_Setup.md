# EVEP Admin Panel Setup Guide

## Overview

The EVEP platform now includes a dedicated **Admin Panel** service that runs on port **3015**, completely separate from the main medical professional portal (port 3013). This provides a clean separation between administrative functions and medical professional workflows.

## 🚀 **Docker Services Configuration**

### **Service Architecture**

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| **Medical Portal** | 3013 | Medical professional interface | `http://localhost:3013` |
| **Admin Panel** | 3015 | Administrative control panel | `http://localhost:3015` |
| **Backend API** | 8013 | FastAPI backend services | `http://localhost:8013` |
| **API Documentation** | 3014 | Swagger/ReDoc docs | `http://localhost:3014` |
| **CDN Service** | 8014 | File storage service | `http://localhost:8014` |

### **Docker Compose Configuration**

```yaml
# Medical Professional Portal (Port 3013)
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: evep-frontend
  ports:
    - "3013:3000"
  environment:
    - REACT_APP_API_URL=https://admin.evep.my-firstcare.com
    - REACT_APP_ENVIRONMENT=production
    - REACT_APP_PORTAL_TYPE=medical
  volumes:
    - ./frontend:/app
    - /app/node_modules
  depends_on:
    - backend
  networks:
    - evep-network
  restart: unless-stopped

# Admin Panel (Port 3015)
admin-panel:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: evep-admin-panel
  ports:
    - "3015:3000"
  environment:
    - REACT_APP_API_URL=https://admin.evep.my-firstcare.com
    - REACT_APP_ENVIRONMENT=production
    - REACT_APP_PORTAL_TYPE=admin
    - REACT_APP_ADMIN_ONLY=true
  volumes:
    - ./frontend:/app
    - /app/node_modules
  depends_on:
    - backend
  networks:
    - evep-network
  restart: unless-stopped
```

## 🔧 **Portal Configuration System**

### **Environment Variables**

The frontend application detects the portal type through environment variables:

```bash
# Medical Portal (Port 3013)
REACT_APP_PORTAL_TYPE=medical
REACT_APP_ADMIN_ONLY=false

# Admin Panel (Port 3015)
REACT_APP_PORTAL_TYPE=admin
REACT_APP_ADMIN_ONLY=true
```

### **Portal Configuration Utility**

The system uses a portal configuration utility (`frontend/src/utils/portalConfig.ts`) to determine:

- **Portal Type**: `medical` or `admin`
- **Interface Theme**: Medical professional or administrative
- **Available Routes**: Different navigation based on portal type
- **Title & Description**: Portal-specific branding

## 🎯 **Admin Panel Features**

### **Dedicated Admin Interface**

When accessing `http://localhost:3015`:

- ✅ **Admin-Only Routes**: Only administrative functions available
- ✅ **Admin Dashboard**: Direct access to system overview
- ✅ **User Management**: Complete user lifecycle management
- ✅ **System Settings**: Comprehensive system configuration
- ✅ **Security Audit**: Real-time security monitoring
- ✅ **Professional Admin Theme**: Administrative interface design

### **Medical Portal Features**

When accessing `http://localhost:3013`:

- ✅ **Medical Professional Interface**: Patient management, screenings, reports
- ✅ **Admin Access**: Medical professionals with admin role can access `/admin` routes
- ✅ **Medical Theme**: Healthcare-focused design and branding
- ✅ **Patient Workflows**: Complete patient care management

## 🚀 **Quick Start Guide**

### **1. Start All Services**

```bash
# Start all services including admin panel
docker-compose up -d

# Or start specific services
docker-compose up -d backend frontend admin-panel
```

### **2. Access Different Portals**

```bash
# Medical Professional Portal
open http://localhost:3013

# Admin Panel
open http://localhost:3015

# API Documentation
open http://localhost:3014
```

### **3. Admin Login**

**Admin Panel (Port 3015):**
```
Email: admin@evep.com
Password: demo123
```

**Medical Portal (Port 3013) - Admin Access:**
```
Email: admin@evep.com
Password: demo123
```
Then navigate to: `http://localhost:3013/admin`

## 🔐 **Security & Access Control**

### **Role-Based Access**

- **Admin Panel (Port 3015)**: Only users with `admin` role can access
- **Medical Portal (Port 3013)**: All authenticated users can access, admin routes require admin role
- **API Endpoints**: All admin endpoints require admin authentication

### **Authentication Flow**

1. **Admin Panel**: Direct redirect to admin dashboard after login
2. **Medical Portal**: Redirect to medical dashboard, admin routes available via `/admin`

## 📊 **Service Monitoring**

### **Check Service Status**

```bash
# View all running services
docker-compose ps

# Check specific service logs
docker-compose logs admin-panel
docker-compose logs frontend
docker-compose logs backend
```

### **Health Checks**

```bash
# Admin Panel Health
curl -I http://localhost:3015

# Medical Portal Health
curl -I http://localhost:3013

# Backend API Health
curl http://localhost:8013/health
```

## 🎨 **Interface Differences**

### **Admin Panel (Port 3015)**
- **Title**: "EVEP Admin Panel"
- **Description**: "EYE Vision Evaluation Platform - Administrative Control Panel"
- **Theme**: Administrative interface
- **Navigation**: Admin-focused menu items
- **Default Route**: `/admin` (admin dashboard)

### **Medical Portal (Port 3013)**
- **Title**: "EVEP Platform"
- **Description**: "EYE Vision Evaluation Platform - Medical Professional Portal"
- **Theme**: Medical professional interface
- **Navigation**: Patient care focused menu items
- **Default Route**: `/dashboard` (medical dashboard)

## 🔧 **Development & Deployment**

### **Local Development**

```bash
# Start admin panel only
docker-compose up -d admin-panel

# Rebuild admin panel after changes
docker-compose build admin-panel
docker-compose restart admin-panel
```

### **Production Deployment**

```bash
# Deploy all services
docker-compose -f docker-compose.yml up -d

# Deploy specific services
docker-compose up -d backend frontend admin-panel
```

## 📋 **Troubleshooting**

### **Common Issues**

1. **Admin Panel Not Loading**
   ```bash
   # Check if service is running
   docker-compose ps admin-panel
   
   # Check logs
   docker-compose logs admin-panel
   ```

2. **Port Conflicts**
   ```bash
   # Check if port 3015 is in use
   lsof -i :3015
   
   # Stop conflicting service
   docker-compose stop admin-panel
   ```

3. **Authentication Issues**
   ```bash
   # Verify admin user exists
   curl -X POST http://localhost:8013/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@evep.com","password":"demo123"}'
   ```

### **Reset Admin Panel**

```bash
# Complete reset
docker-compose down
docker-compose up -d admin-panel

# Rebuild from scratch
docker-compose build --no-cache admin-panel
docker-compose up -d admin-panel
```

## 🎉 **Benefits of Separate Admin Panel**

### **Security Benefits**
- ✅ **Isolated Access**: Admin functions completely separate from medical workflows
- ✅ **Reduced Attack Surface**: Admin interface not accessible from medical portal
- ✅ **Audit Trail**: Clear separation of admin vs medical activities

### **User Experience Benefits**
- ✅ **Focused Interface**: Each portal optimized for its specific use case
- ✅ **Clean Navigation**: No confusion between medical and admin functions
- ✅ **Professional Branding**: Appropriate theming for each user type

### **Operational Benefits**
- ✅ **Independent Scaling**: Can scale admin panel separately from medical portal
- ✅ **Maintenance**: Update admin features without affecting medical workflows
- ✅ **Monitoring**: Separate metrics and monitoring for each portal

## 🚀 **Next Steps**

The EVEP Admin Panel is now fully operational with:

- ✅ **Dedicated Service**: Running on port 3015
- ✅ **Complete Separation**: From medical professional portal
- ✅ **Full Admin Features**: User management, system settings, security audit
- ✅ **Professional Interface**: Administrative design and branding
- ✅ **Production Ready**: Scalable and maintainable architecture

**Access your dedicated admin panel at: `http://localhost:3015`**
