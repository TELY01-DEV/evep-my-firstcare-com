# EVEP Local Development Setup

## 🎉 Successfully Set Up Local Development Environment

The EVEP platform has been successfully migrated from the production server to your local development environment. All data has been backed up and restored locally.

## 📋 Current Status

✅ **Backup Completed**: Server data backed up successfully  
✅ **Local Containers**: All Docker containers running  
✅ **Data Restored**: MongoDB and Redis data restored  
✅ **Environment**: Production environment configuration applied  
✅ **Services**: All services healthy and accessible  

## 🌐 Local Access URLs

### Core Services
- **Frontend**: http://localhost:3013
- **Backend API**: http://localhost:8013
- **API Documentation**: http://localhost:8013/docs
- **Health Check**: http://localhost:8013/health

### Additional Services
- **CDN Service**: http://localhost:8014
- **Stardust Service**: http://localhost:3014
- **Grafana Dashboard**: http://localhost:3001
- **Kibana**: http://localhost:5601
- **Prometheus**: http://localhost:9090

### Database Access
- **MongoDB Primary**: localhost:27030
- **MongoDB Secondary 1**: localhost:27031
- **MongoDB Secondary 2**: localhost:27032
- **MongoDB Arbiter**: localhost:27033

### Redis Instances
- **Redis Master 1**: localhost:6395
- **Redis Master 2**: localhost:6396
- **Redis Master 3**: localhost:6397
- **Redis Replica 1**: localhost:6398
- **Redis Replica 2**: localhost:6399
- **Redis Replica 3**: localhost:6400

## 🚀 Getting Started

### 1. Access the Application
Open your browser and navigate to: **http://localhost:3013**

### 2. Login with Demo Accounts
The following demo accounts are available:
- **Doctor**: `doctor@evep.com` / `demo123`
- **Teacher**: `teacher@evep.com` / `demo123`
- **Parent**: `parent@evep.com` / `demo123`
- **Admin**: `admin@evep.com` / `demo123`

### 3. API Testing
- **API Documentation**: http://localhost:8013/docs
- **Health Check**: http://localhost:8013/health
- **API Status**: http://localhost:8013/api/v1/status

## 🛠 Development Commands

### Container Management
```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Database Operations
```bash
# Access MongoDB shell
docker exec -it evep-mongo-primary mongosh

# Access Redis CLI
docker exec -it evep-redis-master-1 redis-cli

# Backup local data
docker exec evep-mongo-primary mongodump --gzip --archive=/tmp/local_backup.gz --db=evep_db
```

### Development Workflow
```bash
# Make changes to frontend
cd frontend
npm install
npm start

# Make changes to backend
cd backend
# Edit files, then restart container
docker-compose restart backend
```

## 📁 Project Structure

```
evep-my-firstcare-com/
├── backend/                 # FastAPI backend
├── frontend/               # React frontend
├── mobile/                 # Mobile app (future)
├── monitoring/             # Monitoring configurations
├── scripts/                # Utility scripts
├── backups/                # Server backups
├── documents/              # Project documentation
├── docker-compose.yml      # Container orchestration
└── .env                    # Environment configuration
```

## 🔧 Configuration Files

### Environment Variables
- **`.env`**: Main environment configuration (restored from server)
- **`env.example`**: Template for environment variables

### Monitoring
- **`monitoring/prometheus.yml`**: Prometheus configuration
- **`monitoring/filebeat.yml`**: Filebeat configuration
- **`monitoring/grafana/`**: Grafana dashboards

## 📊 Monitoring & Observability

### Grafana Dashboards
- **URL**: http://localhost:3001
- **Default Credentials**: admin/admin
- **Dashboards**: EVEP metrics, system performance

### Kibana
- **URL**: http://localhost:5601
- **Purpose**: Log analysis and visualization

### Prometheus
- **URL**: http://localhost:9090
- **Purpose**: Metrics collection and alerting

## 🔄 Backup & Restore

### Backup Scripts
- **`scripts/backup-server-data.sh`**: Backup server data
- **`backups/restore_local.sh`**: Restore data to local environment

### Manual Backup
```bash
# Create new backup
./scripts/backup-server-data.sh

# Restore from backup
cd backups
./restore_local.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   lsof -i :8013
   
   # Stop conflicting services
   docker-compose down
   ```

2. **Container Health Issues**
   ```bash
   # Check container logs
   docker-compose logs [service-name]
   
   # Restart unhealthy containers
   docker-compose restart [service-name]
   ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   docker exec evep-mongo-primary mongosh --eval "db.adminCommand('ping')"
   
   # Check Redis status
   docker exec evep-redis-master-1 redis-cli ping
   ```

### Reset Environment
```bash
# Complete reset
docker-compose down -v
docker system prune -f
./scripts/backup-server-data.sh
cd backups && ./restore_local.sh
cd .. && docker-compose up -d
```

## 📝 Development Notes

### Frontend Development
- **Framework**: React with TypeScript
- **UI Library**: Material-UI
- **State Management**: React hooks
- **API Calls**: Fetch API with localhost endpoints

### Backend Development
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Cache**: Redis
- **Authentication**: JWT tokens

### API Endpoints
- **Authentication**: `/api/v1/auth/*`
- **Patients**: `/api/v1/patients/*`
- **Screenings**: `/api/v1/screenings/*`
- **Health**: `/health`

## 🎯 Next Steps

1. **Explore the Application**: Navigate through all features
2. **Test API Endpoints**: Use the Swagger documentation
3. **Review Code**: Familiarize yourself with the codebase
4. **Start Development**: Begin working on new features
5. **Monitor Performance**: Use Grafana and Prometheus

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs
3. Check the project documentation in `documents/`
4. Refer to the API documentation at http://localhost:8013/docs

---

**🎉 Welcome to EVEP Local Development!**
