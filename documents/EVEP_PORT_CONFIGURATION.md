# EVEP System Port Configuration & Service Architecture

## 📋 Overview

The EVEP (Enhanced Vision Examination Platform) system is a comprehensive medical platform for vision screening and patient management. This document outlines the complete port configuration and service architecture.

## 🌐 Port Configuration Summary

### Core Services
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **Backend API** | 8014 | `http://localhost:8014` | Main FastAPI backend | ✅ Running |
| **Frontend** | 3013 | `http://localhost:3013` | Medical Professional Portal | ✅ Running |
| **Admin Panel** | 3015 | `http://localhost:3015` | Administrative Interface | ✅ Running |
| **CDN Service** | 3014 | `http://localhost:3014` | File storage & delivery | ✅ Running |
| **Socket.IO** | 9014 | `http://localhost:9014` | Real-time communication | ✅ Running |

### Documentation & Development
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **Stardust** | 8013 | `http://localhost:8013` | API Documentation (Swagger) | ✅ Running |

### AI/ML Services (Optional)
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **AI Service** | 8015 | `http://localhost:8015` | AI/ML processing service | ⚠️ Configured |
| **AI Monitor** | 8016 | `http://localhost:8016` | AI service monitoring | ⚠️ Configured |

### Database Services
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **MongoDB Primary** | 27030 | `localhost:27030` | Main database | ✅ Running |
| **MongoDB Secondary 1** | 27031 | `localhost:27031` | Replica set member | ✅ Running |
| **MongoDB Secondary 2** | 27032 | `localhost:27032` | Replica set member | ✅ Running |
| **MongoDB Arbiter** | 27033 | `localhost:27033` | Replica set arbiter | ✅ Running |

### Cache Services (Redis Cluster)
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **Redis Master 1** | 6395 | `localhost:6395` | Cache cluster master | ✅ Running |
| **Redis Master 2** | 6396 | `localhost:6396` | Cache cluster master | ✅ Running |
| **Redis Master 3** | 6397 | `localhost:6397` | Cache cluster master | ✅ Running |
| **Redis Replica 1** | 6398 | `localhost:6398` | Cache cluster replica | ✅ Running |
| **Redis Replica 2** | 6399 | `localhost:6399` | Cache cluster replica | ✅ Running |
| **Redis Replica 3** | 6400 | `localhost:6400` | Cache cluster replica | ✅ Running |

### Monitoring & Observability
| Service | Port | URL | Description | Status |
|---------|------|-----|-------------|---------|
| **Prometheus** | 9090 | `http://localhost:9090` | Metrics collection | ✅ Running |
| **Grafana** | 3001 | `http://localhost:3001` | Monitoring dashboard | ✅ Running |
| **Elasticsearch** | 9200 | `http://localhost:9200` | Log storage | ✅ Running |
| **Kibana** | 5601 | `http://localhost:5601` | Log visualization | ✅ Running |

## 🏗️ Service Architecture

### Core Application Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Admin Panel    │    │   CDN Service   │
│   (Port 3013)   │    │  (Port 3015)    │    │  (Port 3014)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Backend API           │
                    │     (Port 8014)           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Socket.IO             │
                    │     (Port 9014)           │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│   MongoDB Cluster │    │  Redis Cluster  │    │   File Storage  │
│   (Ports 27030-33)│    │ (Ports 6395-00) │    │   (Volumes)     │
└───────────────────┘    └─────────────────┘    └─────────────────┘
```

### AI/ML Service Stack (Optional)
```
┌─────────────────┐    ┌─────────────────┐
│   AI Service    │    │  AI Monitor     │
│   (Port 8015)   │    │  (Port 8016)    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┼──────────────────────┐
                                 │                      │
                    ┌─────────────▼─────────────┐    ┌──▼─────────────┐
                    │     Backend API           │    │   Monitoring   │
                    │     (Port 8014)           │    │   (Prometheus) │
                    └───────────────────────────┘    └─────────────────┘
```

## 🚀 Service Startup Commands

### Start All Core Services
```bash
docker-compose up -d
```

### Start AI Services (Optional)
```bash
docker-compose --profile ai up -d ai-service ai-monitor
```

### Start Specific Services
```bash
# Start only backend and database
docker-compose up -d backend mongo-primary redis-master-1

# Start only frontend applications
docker-compose up -d frontend admin-panel

# Start monitoring stack
docker-compose up -d prometheus grafana elasticsearch kibana
```

## 🔧 Service Dependencies

### Backend Dependencies
- **MongoDB Cluster**: Primary, Secondary 1, Secondary 2, Arbiter
- **Redis Cluster**: Master 1, Master 2, Master 3, Replica 1, Replica 2, Replica 3
- **File Storage**: Local volumes for uploads and logs

### Frontend Dependencies
- **Backend API**: For all data operations
- **Socket.IO**: For real-time features
- **CDN Service**: For file access

### AI Services Dependencies
- **Backend API**: For data access
- **Redis**: For caching and job queues
- **File Storage**: For model storage and data processing

## 📊 Health Check Endpoints

### Core Services
- **Backend Health**: `http://localhost:8014/health`
- **Frontend**: `http://localhost:3013` (React app)
- **Admin Panel**: `http://localhost:3015` (React app)
- **CDN Service**: `http://localhost:3014/health`
- **Socket.IO**: `http://localhost:9014/health`

### Documentation
- **API Docs**: `http://localhost:8013/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8013/redoc` (Alternative docs)

### Monitoring
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin/admin)
- **Elasticsearch**: `http://localhost:9200/_cluster/health`
- **Kibana**: `http://localhost:5601`

## 🔒 Security Considerations

### Network Isolation
- All services run on isolated Docker network (`evep-network`)
- External access only through defined ports
- Internal communication via service names

### Authentication
- JWT-based authentication for API access
- Session management via Redis
- Role-based access control (RBAC)

### Data Protection
- MongoDB replica set for data redundancy
- Redis cluster for high availability
- Encrypted communication between services
- Secure file storage with access controls

## 📈 Scalability Features

### Horizontal Scaling
- **MongoDB**: Replica set with 3 nodes + arbiter
- **Redis**: 6-node cluster (3 masters + 3 replicas)
- **Backend**: Can be scaled horizontally
- **Frontend**: Stateless, can be load balanced

### Vertical Scaling
- **AI Services**: Configurable resource limits
- **Database**: Configurable memory and CPU limits
- **Monitoring**: Separate resource allocation

## 🛠️ Development Workflow

### Local Development
1. **Start Core Services**: `docker-compose up -d`
2. **Access Frontend**: `http://localhost:3013`
3. **Access Admin Panel**: `http://localhost:3015`
4. **API Documentation**: `http://localhost:8013/docs`
5. **Monitoring**: `http://localhost:3001` (Grafana)

### Production Deployment
1. **Environment Variables**: Configure all required env vars
2. **SSL/TLS**: Configure reverse proxy with SSL termination
3. **Monitoring**: Enable all monitoring services
4. **Backup**: Configure automated backups for MongoDB and Redis
5. **Logging**: Configure centralized logging with ELK stack

## 📝 Environment Variables

### Required Variables
```bash
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password
MONGO_DATABASE=evep
MONGO_REPLICA_SET_NAME=rs0

# Redis
REDIS_CLUSTER_ENABLED=true

# Security
SECRET_KEY=your_secret_key_here

# AI Services (Optional)
AI_SERVICE_ENABLED=false
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Optional Variables
```bash
# Monitoring
GRAFANA_PASSWORD=admin

# External Services
TELEGRAM_BOT_TOKEN=your_telegram_token
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

## 🔍 Troubleshooting

### Common Issues
1. **Port Conflicts**: Check if ports are already in use
2. **Service Dependencies**: Ensure all required services are running
3. **Network Issues**: Verify Docker network connectivity
4. **Resource Limits**: Check system resources for AI services

### Debug Commands
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Check network connectivity
docker network inspect evep-network

# Monitor resource usage
docker stats
```

## 📚 Additional Resources

- **API Documentation**: `http://localhost:8013/docs`
- **System Architecture**: See architecture diagrams above
- **Deployment Guide**: `documents/Production_Deployment_Guide.md`
- **Development Setup**: `documents/LOCAL_DEVELOPMENT_SETUP.md`

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: EVEP Development Team
