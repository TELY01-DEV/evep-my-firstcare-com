# EVEP Medical Portal - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup Strategy](#backup-strategy)
8. [Maintenance](#maintenance)

---

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 100GB SSD
- **CPU**: Minimum 4 cores, Recommended 8 cores
- **Network**: Stable internet connection with static IP

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: Latest version
- **SSL Certificate**: Valid SSL certificate for domain
- **Domain**: Configured domain with DNS pointing to server

### Network Requirements
- **Ports**: 80, 443, 2222 (SSH), 27030 (MongoDB)
- **Firewall**: Configured to allow required ports
- **DNS**: Domain configured with A records

---

## 🌍 Environment Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

### 2. Create Application Directory
```bash
# Create application directory
sudo mkdir -p /www/dk_project
cd /www/dk_project

# Clone repository
git clone <repository-url> evep-my-firstcare-com
cd evep-my-firstcare-com
```

### 3. Environment Configuration
```bash
# Create environment file
# Copy your .env file to the server

# Edit environment variables
nano .env
```

**Environment Variables:**
```bash
# MongoDB Configuration
MONGODB_URL=mongodb://admin:Sim!44335599@mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0&authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=Sim!44335599
MONGO_DATABASE=evep

# AI Services
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ChromaDB
CHROMA_ANONYMIZED_TELEMETRY=false

# Application URLs
FRONTEND_URL=https://portal.evep.my-firstcare.com
BACKEND_URL=https://stardust.evep.my-firstcare.com
```

---

## 🗄️ Database Configuration

### 1. MongoDB Replica Set Setup
The system uses MongoDB with replica set for high availability.

**Key Features:**
- **Primary Node**: mongo-primary
- **Secondary Nodes**: mongo-secondary-1, mongo-secondary-2
- **Authentication**: Enabled with admin user
- **Replica Set**: rs0

### 2. Database Initialization
```bash
# Start MongoDB services
docker-compose up -d mongo-primary mongo-secondary-1 mongo-secondary-2

# Wait for services to be ready
sleep 30

# Initialize replica set
docker-compose exec mongo-primary mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo-primary:27017' },
    { _id: 1, host: 'mongo-secondary-1:27017' },
    { _id: 2, host: 'mongo-secondary-2:27017' }
  ]
})
"

# Create admin user
docker-compose exec mongo-primary mongosh --eval "
use admin
db.createUser({
  user: 'admin',
  pwd: 'Sim!44335599',
  roles: [
    { role: 'root', db: 'admin' }
  ]
})
"
```

### 3. Database Collections Setup
```bash
# Run database initialization scripts
docker-compose exec stardust python3 scripts/initialize_database.py
docker-compose exec stardust python3 scripts/populate_sample_data.py
docker-compose exec stardust python3 scripts/check_and_setup_rbac.py
```

---

## 🚀 Application Deployment

### 1. Build and Start Services
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Verify Deployment
```bash
# Check API health
curl https://stardust.evep.my-firstcare.com/api/v1/auth/health

# Check frontend
curl https://portal.evep.my-firstcare.com

# Check database connection
docker-compose exec stardust python3 scripts/test_database_connection.py
```

### 3. Service Configuration

#### Backend Service (stardust)
- **Port**: 8000 (internal)
- **External Access**: https://stardust.evep.my-firstcare.com
- **Health Check**: `/api/v1/auth/health`

#### Frontend Service (portal)
- **Port**: 3000 (internal)
- **External Access**: https://portal.evep.my-firstcare.com
- **Build**: Production build with optimized assets

#### MongoDB Services
- **Primary**: Port 27030 (external access for Compass)
- **Secondary-1**: Internal only
- **Secondary-2**: Internal only

---

## 🔒 SSL Configuration

### 1. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d portal.evep.my-firstcare.com -d stardust.evep.my-firstcare.com

# Test certificate renewal
sudo certbot renew --dry-run
```

### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/evep-portal
server {
    listen 80;
    server_name portal.evep.my-firstcare.com stardust.evep.my-firstcare.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.evep.my-firstcare.com;
    
    ssl_certificate /etc/letsencrypt/live/portal.evep.my-firstcare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.evep.my-firstcare.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name stardust.evep.my-firstcare.com;
    
    ssl_certificate /etc/letsencrypt/live/stardust.evep.my-firstcare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stardust.evep.my-firstcare.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/evep-portal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring Setup

### 1. Application Monitoring
```bash
# Check service logs
docker-compose logs -f stardust
docker-compose logs -f portal

# Monitor resource usage
docker stats

# Check service health
curl https://stardust.evep.my-firstcare.com/api/v1/auth/health
```

### 2. Database Monitoring
```bash
# Check MongoDB status
docker-compose exec mongo-primary mongosh --eval "rs.status()"

# Check replica set health
docker-compose exec mongo-primary mongosh --eval "rs.printSlaveReplicationInfo()"

# Monitor database performance
docker-compose exec mongo-primary mongosh --eval "db.serverStatus()"
```

### 3. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
iotop
nethogs

# Check disk usage
df -h
du -sh /www/dk_project/evep-my-firstcare-com
```

---

## 💾 Backup Strategy

### 1. Database Backup
```bash
# Create backup script
cat > /www/dk_project/evep-my-firstcare-com/scripts/backup_database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/www/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="evep_backup_$DATE"

mkdir -p $BACKUP_DIR

# Create MongoDB backup
docker-compose exec -T mongo-primary mongodump \
  --uri="mongodb://admin:Sim!44335599@mongo-primary:27017/evep?authSource=admin" \
  --out /tmp/$BACKUP_FILE

# Copy backup to host
docker cp $(docker-compose ps -q mongo-primary):/tmp/$BACKUP_FILE $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR/$BACKUP_FILE.tar.gz -C $BACKUP_DIR $BACKUP_FILE
rm -rf $BACKUP_DIR/$BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "evep_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.tar.gz"
EOF

# Make script executable
chmod +x /www/dk_project/evep-my-firstcare-com/scripts/backup_database.sh

# Add to crontab for daily backups
echo "0 2 * * * /www/dk_project/evep-my-firstcare-com/scripts/backup_database.sh" | crontab -
```

### 2. Application Backup
```bash
# Create application backup script
cat > /www/dk_project/evep-my-firstcare-com/scripts/backup_application.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/www/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="evep_app_$DATE"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/$BACKUP_FILE.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='__pycache__' \
  -C /www/dk_project evep-my-firstcare-com

# Keep only last 7 days of backups
find $BACKUP_DIR -name "evep_app_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: $BACKUP_FILE.tar.gz"
EOF

# Make script executable
chmod +x /www/dk_project/evep-my-firstcare-com/scripts/backup_application.sh

# Add to crontab for weekly backups
echo "0 3 * * 0 /www/dk_project/evep-my-firstcare-com/scripts/backup_application.sh" | crontab -
```

---

## 🔧 Maintenance

### 1. Regular Maintenance Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up unused Docker resources
docker system prune -f

# Check disk space
df -h
du -sh /www/dk_project/evep-my-firstcare-com
```

### 2. Application Updates
```bash
# Pull latest changes
cd /www/dk_project/evep-my-firstcare-com
git pull origin main

# Rebuild and restart services
docker-compose build
docker-compose up -d

# Run database migrations if needed
docker-compose exec stardust python3 scripts/migrate_database.py
```

### 3. Log Management
```bash
# Rotate application logs
docker-compose exec stardust find /app/logs -name "*.log" -mtime +7 -delete

# Monitor log sizes
docker-compose exec stardust du -sh /app/logs/*

# Check system logs
sudo journalctl -u docker -f
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check service logs
docker-compose logs stardust
docker-compose logs portal

# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongo-primary mongosh --eval "rs.status()"

# Check network connectivity
docker-compose exec stardust ping mongo-primary

# Test database connection
docker-compose exec stardust python3 scripts/test_database_connection.py
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect portal.evep.my-firstcare.com:443
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Check system resources
htop
free -h
df -h

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s https://stardust.evep.my-firstcare.com/api/v1/auth/health
```

---

## 📞 Support

### Emergency Contacts
- **System Administrator**: admin@evep.com
- **Technical Support**: support@evep.com
- **Database Administrator**: dba@evep.com

### Monitoring Alerts
- **Uptime Monitoring**: https://uptime.evep.my-firstcare.com
- **System Status**: https://status.evep.my-firstcare.com
- **Error Tracking**: https://errors.evep.my-firstcare.com

### Documentation
- **API Documentation**: https://stardust.evep.my-firstcare.com/docs
- **System Documentation**: [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)
- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

*Last Updated: January 2024*
*Deployment Version: 1.0.0*
