# EVEP System - Quick Reference Card

## 🚀 Quick Start

```bash
# Start all services
docker-compose up -d

# Start with AI services
docker-compose --profile ai up -d

# Check status
docker-compose ps
```

## 🌐 Core Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 3013 | `http://localhost:3013` | Medical Portal |
| **Admin Panel** | 3015 | `http://localhost:3015` | Admin Interface |
| **Backend API** | 8014 | `http://localhost:8014` | Main API |
| **CDN** | 3014 | `http://localhost:3014` | File Storage |
| **Socket.IO** | 9014 | `http://localhost:9014` | Real-time |

## 📚 Documentation & Tools

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API Docs** | 8013 | `http://localhost:8013/docs` | Swagger UI |
| **Grafana** | 3001 | `http://localhost:3001` | Monitoring |
| **Prometheus** | 9090 | `http://localhost:9090` | Metrics |
| **Kibana** | 5601 | `http://localhost:5601` | Logs |

## 🗄️ Database & Cache

| Service | Port | Purpose |
|---------|------|---------|
| **MongoDB Primary** | 27030 | Main Database |
| **MongoDB Secondary 1** | 27031 | Replica |
| **MongoDB Secondary 2** | 27032 | Replica |
| **MongoDB Arbiter** | 27033 | Arbiter |
| **Redis Master 1** | 6395 | Cache |
| **Redis Master 2** | 6396 | Cache |
| **Redis Master 3** | 6397 | Cache |
| **Redis Replica 1** | 6398 | Cache Replica |
| **Redis Replica 2** | 6399 | Cache Replica |
| **Redis Replica 3** | 6400 | Cache Replica |

## 🤖 AI Services (Optional)

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **AI Service** | 8015 | `http://localhost:8015` | AI Processing |
| **AI Monitor** | 8016 | `http://localhost:8016` | AI Monitoring |

## 🔧 Common Commands

```bash
# Restart specific service
docker-compose restart [service-name]

# View logs
docker-compose logs [service-name]

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## 🏥 Medical Portal Features

### Main Workflows
- **Hospital Mobile Unit**: Vision screening workflow
- **Standard Vision Screening**: Comprehensive eye examination
- **Enhanced Vision Screening**: Advanced diagnostic tools
- **School-based Screening**: Mass screening management

### Management Modules
- **School Management**: Students, Parents, Teachers, Schools
- **Patient Management**: Patient records and history
- **Glasses Management**: Inventory and delivery tracking
- **Medical Staff**: Staff directory and management

## 🔐 Default Credentials

- **Grafana**: `admin/admin`
- **MongoDB**: Configured via environment variables
- **API**: JWT-based authentication

## 📞 Health Checks

```bash
# Backend health
curl http://localhost:8014/health

# API documentation
curl http://localhost:8013/docs

# Frontend status
curl http://localhost:3013
```

## 🚨 Emergency Commands

```bash
# Force restart all services
docker-compose down && docker-compose up -d

# Clear all data (⚠️ DANGEROUS)
docker-compose down -v && docker-compose up -d

# Check resource usage
docker stats

# View network
docker network inspect evep-network
```

---

**📖 Full Documentation**: `documents/EVEP_PORT_CONFIGURATION.md`  
**🔄 Last Updated**: January 2025
