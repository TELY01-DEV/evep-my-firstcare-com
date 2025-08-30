# EVEP Platform Production Deployment Guide

## 🎯 Overview

This guide provides comprehensive instructions for deploying the EVEP Platform to production, including all necessary configurations, security measures, and monitoring setup.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: Stable internet connection

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Nginx
- Certbot (for SSL)
- Git

## 🚀 Quick Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/evep-platform.git
cd evep-platform

# Set up environment variables
cp .env.example .env.production
```

### 3. Configure Environment

Edit `.env.production` with your production settings:

```bash
# Domain Configuration
DOMAIN=your-domain.com

# Database Configuration
MONGO_URI=mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0
REDIS_URL=redis://redis-master-1:6379,redis-master-2:6379,redis-master-3:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=24h

# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ID=your-line-channel-id
LINE_WEBHOOK_URL=https://your-domain.com/api/v1/line_integration/webhook

# AI/ML Configuration
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000

# Security Configuration
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

### 4. Deploy with LINE Bot Integration

```bash
# Make deployment script executable
chmod +x scripts/deploy-production-with-line-bot.sh

# Deploy to production
./scripts/deploy-production-with-line-bot.sh your-domain.com your-line-channel-access-token your-line-channel-secret your-line-channel-id
```

## 🔧 Manual Deployment Steps

### 1. Build and Start Services

```bash
# Build Docker images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Configure Nginx

Create Nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/evep << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend Application
    location / {
        proxy_pass http://localhost:3013;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8013;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
    }
    
    # Monitoring endpoints
    location /monitoring {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /logs {
        proxy_pass http://localhost:5601;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8013/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/evep /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL Certificate

```bash
# Request SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email admin@your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Initialize LINE Bot

```bash
# Configure LINE Bot settings
curl -X POST http://localhost:8013/api/v1/line_integration/bot/bot/settings \
    -H "Content-Type: application/json" \
    -d '{
        "channel_id": "your-line-channel-id",
        "channel_access_token": "your-line-channel-access-token",
        "channel_secret": "your-line-channel-secret",
        "webhook_url": "https://your-domain.com/api/v1/line_integration/webhook",
        "display_name": "EVEP Vision Screening Bot",
        "status_message": "Vision screening assistant for children",
        "is_production": true,
        "rate_limit_per_second": 1000,
        "monthly_message_limit": 1000000
    }'
```

## 🔒 Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Security Headers

Add to Nginx configuration:

```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
```

### 3. Rate Limiting

Configure rate limiting in Nginx:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    # ... existing configuration
}

location /api/v1/auth/login {
    limit_req zone=login burst=5 nodelay;
    # ... existing configuration
}
```

## 📊 Monitoring Setup

### 1. Grafana Dashboard

Access Grafana at `https://your-domain.com/monitoring`

Default credentials:
- Username: `admin`
- Password: `admin` (change on first login)

### 2. Kibana Logs

Access Kibana at `https://your-domain.com/logs`

### 3. Prometheus Metrics

Access Prometheus at `http://localhost:9090`

### 4. Health Monitoring

Set up health checks:

```bash
# Create health check script
cat > /usr/local/bin/evep-health-check.sh << 'EOF'
#!/bin/bash
curl -f https://your-domain.com/health > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "EVEP Platform health check failed" | mail -s "EVEP Alert" admin@your-domain.com
fi
EOF

chmod +x /usr/local/bin/evep-health-check.sh

# Add to crontab
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/evep-health-check.sh
```

## 🔄 Backup and Recovery

### 1. Automated Backups

```bash
# Create backup script
cat > /usr/local/bin/evep-backup.sh << 'EOF'
#!/bin/bash
cd /path/to/evep-platform
./scripts/backup-recovery.sh backup
EOF

chmod +x /usr/local/bin/evep-backup.sh

# Add to crontab for daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/evep-backup.sh
```

### 2. Backup Verification

```bash
# Check backup health
./scripts/backup-recovery.sh health

# List available backups
./scripts/backup-recovery.sh list
```

## 🧪 Testing and Validation

### 1. Production Readiness Check

```bash
# Run production readiness checklist
./scripts/production-readiness-checklist.sh
```

### 2. Load Testing

```bash
# Run load tests
./scripts/load-test.sh 50 300 30  # 50 users, 5 minutes, 30s ramp-up
```

### 3. Security Testing

```bash
# Test SSL configuration
curl -I https://your-domain.com

# Test security headers
curl -I https://your-domain.com/api/v1/auth/health
```

## 📈 Performance Optimization

### 1. Database Optimization

```bash
# Create database indexes
docker exec evep-backend python -c "
from app.core.database import get_database
db = get_database().evep

# Create indexes for better performance
db.patients.create_index([('user_id', 1)])
db.screenings.create_index([('patient_id', 1), ('created_at', -1)])
db.line_messages.create_index([('user_id', 1), ('created_at', -1)])
"
```

### 2. Caching Configuration

Configure Redis caching:

```python
# In your application code
CACHE_CONFIG = {
    'default': {
        'CACHE_TYPE': 'redis',
        'CACHE_REDIS_URL': 'redis://redis-master-1:6379/0',
        'CACHE_DEFAULT_TIMEOUT': 300
    }
}
```

### 3. CDN Configuration

For static assets, consider using a CDN:

```nginx
# CDN configuration for static assets
location /static/ {
    proxy_pass https://your-cdn.com/;
    proxy_set_header Host your-cdn.com;
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check logs
   docker-compose logs
   
   # Check resource usage
   docker stats
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB status
   docker exec evep-mongo-primary mongo --eval "rs.status()"
   
   # Check Redis status
   docker exec evep-redis-master-1 redis-cli ping
   ```

3. **LINE Bot webhook issues**
   ```bash
   # Test webhook
   curl -X POST https://your-domain.com/api/v1/line_integration/webhook \
       -H "Content-Type: application/json" \
       -d '{"test": "data"}'
   ```

### Performance Issues

1. **High memory usage**
   ```bash
   # Check memory usage
   docker stats --no-stream
   
   # Restart services if needed
   docker-compose restart
   ```

2. **Slow response times**
   ```bash
   # Check database performance
   docker exec evep-backend python -c "
   from app.core.database import get_database
   db = get_database().evep
   print(db.command('dbStats'))
   "
   ```

## 📞 Support and Maintenance

### 1. Regular Maintenance

- **Daily**: Check health status and logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full system audit and optimization

### 2. Monitoring Alerts

Set up alerts for:
- Service downtime
- High resource usage
- Error rate spikes
- Backup failures
- SSL certificate expiration

### 3. Support Contacts

- **Technical Support**: support@your-domain.com
- **Emergency Contact**: emergency@your-domain.com
- **Documentation**: https://your-domain.com/docs

## 🎉 Post-Deployment Checklist

- [ ] All services are running and healthy
- [ ] SSL certificate is valid and auto-renewing
- [ ] LINE Bot is configured and tested
- [ ] Monitoring dashboards are accessible
- [ ] Backup system is working
- [ ] Security measures are in place
- [ ] Performance is acceptable
- [ ] Documentation is updated
- [ ] Team is trained on the system
- [ ] Support procedures are established

---

**Congratulations! Your EVEP Platform is now deployed and ready for production use.** 🚀

For ongoing support and updates, refer to the platform documentation and monitoring dashboards.
