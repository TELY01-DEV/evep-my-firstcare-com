#!/bin/bash

# EVEP Platform - Production Deployment Script
# This script deploys the complete EVEP Platform to production

set -e

echo "🚀 EVEP Platform - Production Deployment"
echo "========================================"

# Configuration
ENVIRONMENT="production"
DOMAIN="${1:-evep.my-firstcare.com}"
SSL_EMAIL="${2:-admin@my-firstcare.com}"

echo "📋 Deployment Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Domain: $DOMAIN"
echo "   SSL Email: $SSL_EMAIL"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Create production environment file
echo "📝 Creating production environment configuration..."
cat > .env.production << EOF
# EVEP Platform - Production Environment
ENVIRONMENT=production
DOMAIN=$DOMAIN

# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGO_DATABASE=evep_production
MONGO_REPLICA_SET_NAME=rs0

# Redis Configuration
REDIS_CLUSTER_ENABLED=true

# Security
SECRET_KEY=$(openssl rand -base64 64)
JWT_SECRET_KEY=$(openssl rand -base64 64)

# External Services
OPENAI_API_KEY=${OPENAI_API_KEY:-}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-}
LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN:-}
LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET:-}

# Monitoring
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# SSL Configuration
SSL_EMAIL=$SSL_EMAIL
EOF

echo "✅ Production environment file created"
echo ""

# Create production docker-compose file
echo "🐳 Creating production Docker Compose configuration..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # Nginx Reverse Proxy with SSL
  nginx:
    image: nginx:alpine
    container_name: evep-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/production.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
      - admin-panel
    networks:
      - evep-network
    restart: unless-stopped

  # Backend API Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: evep-backend-prod
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=mongodb://admin:\${MONGO_ROOT_PASSWORD}@mongo-primary:27017/\${MONGO_DATABASE}?authSource=admin
      - REDIS_URL=redis://redis-master-1:6379
      - SECRET_KEY=\${SECRET_KEY}
      - JWT_SECRET_KEY=\${JWT_SECRET_KEY}
    volumes:
      - backend_data:/app/data
      - ./logs/backend:/app/logs
    depends_on:
      - mongo-primary
      - redis-master-1
    networks:
      - evep-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Frontend Web Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: evep-frontend-prod
    environment:
      - REACT_APP_API_URL=https://api.$DOMAIN
      - REACT_APP_ENVIRONMENT=production
    volumes:
      - ./logs/frontend:/var/log/nginx
    networks:
      - evep-network
    restart: unless-stopped

  # Admin Panel
  admin-panel:
    build:
      context: ./admin-panel
      dockerfile: Dockerfile.prod
    container_name: evep-admin-prod
    environment:
      - REACT_APP_API_URL=https://api.$DOMAIN
      - REACT_APP_ENVIRONMENT=production
    volumes:
      - ./logs/admin:/var/log/nginx
    networks:
      - evep-network
    restart: unless-stopped

  # MongoDB Replica Set
  mongo-primary:
    image: mongo:6.0
    container_name: evep-mongo-primary-prod
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=\${MONGO_DATABASE}
    volumes:
      - mongo_primary_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - evep-network
    restart: unless-stopped
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--auth"]

  # Redis Cluster
  redis-master-1:
    image: redis:7-alpine
    container_name: evep-redis-master-1-prod
    volumes:
      - redis_master1_data:/data
    networks:
      - evep-network
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "\${REDIS_PASSWORD}"]

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: evep-prometheus-prod
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - evep-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: evep-grafana-prod
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning:ro
    networks:
      - evep-network
    restart: unless-stopped

  # Logging Stack
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: evep-elasticsearch-prod
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - evep-network
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: evep-kibana-prod
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - evep-network
    restart: unless-stopped

volumes:
  mongo_primary_data:
    driver: local
  redis_master1_data:
    driver: local
  backend_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  elasticsearch_data:
    driver: local

networks:
  evep-network:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.90.0/24
EOF

echo "✅ Production Docker Compose file created"
echo ""

# Create production nginx configuration
echo "🌐 Creating production Nginx configuration..."
mkdir -p nginx
cat > nginx/production.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream servers
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    upstream admin {
        server admin-panel:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN api.$DOMAIN admin.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # Main application
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }

    # API server
    server {
        listen 443 ssl http2;
        server_name api.$DOMAIN;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        # API endpoints
        location / {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }

    # Admin panel
    server {
        listen 443 ssl http2;
        server_name admin.$DOMAIN;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Admin panel
        location / {
            proxy_pass http://admin;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

echo "✅ Production Nginx configuration created"
echo ""

# Create SSL certificates (self-signed for demo)
echo "🔒 Creating SSL certificates..."
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem -out ssl/cert.pem \
    -subj "/C=TH/ST=Bangkok/L=Bangkok/O=MyFirstCare/OU=IT/CN=$DOMAIN"

echo "✅ SSL certificates created"
echo ""

# Create log directories
echo "📝 Creating log directories..."
mkdir -p logs/{nginx,backend,frontend,admin}

echo "✅ Log directories created"
echo ""

# Build and deploy
echo "🏗️ Building production images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "🎉 EVEP Platform Production Deployment Complete!"
echo "================================================"
echo ""
echo "🌐 Application URLs:"
echo "   Main Application: https://$DOMAIN"
echo "   API Documentation: https://api.$DOMAIN/docs"
echo "   Admin Panel: https://admin.$DOMAIN"
echo ""
echo "📊 Monitoring URLs:"
echo "   Grafana: https://$DOMAIN:3001 (admin/\${GRAFANA_PASSWORD})"
echo "   Prometheus: https://$DOMAIN:9090"
echo "   Kibana: https://$DOMAIN:5601"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure DNS records to point to this server"
echo "   2. Replace self-signed SSL with Let's Encrypt certificates"
echo "   3. Set up automated backups"
echo "   4. Configure monitoring alerts"
echo "   5. Set up CI/CD pipeline"
echo ""
echo "✅ Deployment completed successfully!"
