#!/bin/bash

# EVEP Platform Production Deployment Script with LINE Bot Integration
# This script deploys the complete EVEP Platform including LINE Bot management

set -e

echo "🚀 EVEP Platform Production Deployment with LINE Bot Integration"
echo "=================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"evep.my-firstcare.com"}
LINE_CHANNEL_ACCESS_TOKEN=${2:-""}
LINE_CHANNEL_SECRET=${3:-""}
LINE_CHANNEL_ID=${4:-""}

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   LINE Channel Access Token: ${LINE_CHANNEL_ACCESS_TOKEN:0:10}..."
echo "   LINE Channel Secret: ${LINE_CHANNEL_SECRET:0:10}..."
echo "   LINE Channel ID: $LINE_CHANNEL_ID"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking Prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx not found - will install${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Create production environment file
echo -e "${BLUE}📝 Creating Production Environment...${NC}"

cat > .env.production << EOF
# EVEP Platform Production Environment
NODE_ENV=production
DOMAIN=$DOMAIN

# Database Configuration
MONGO_URI=mongodb://mongo-primary:27017,mongo-secondary-1:27017,mongo-secondary-2:27017/evep?replicaSet=rs0
REDIS_URL=redis://redis-master-1:6379,redis-master-2:6379,redis-master-3:6379

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=24h

# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=$LINE_CHANNEL_SECRET
LINE_CHANNEL_ID=$LINE_CHANNEL_ID
LINE_WEBHOOK_URL=https://$DOMAIN/api/v1/line_integration/webhook

# AI/ML Configuration
OPENAI_API_KEY=${OPENAI_API_KEY:-""}
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000

# Monitoring Configuration
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELASTICSEARCH_ENABLED=true
KIBANA_ENABLED=true

# Security Configuration
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Email Configuration (if needed)
SMTP_HOST=${SMTP_HOST:-""}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER:-""}
SMTP_PASS=${SMTP_PASS:-""}

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
EOF

echo -e "${GREEN}✅ Production environment created${NC}"
echo ""

# Build and deploy services
echo -e "${BLUE}🏗️  Building and Deploying Services...${NC}"

# Stop existing services
echo "   Stopping existing services..."
docker-compose down --remove-orphans

# Build images
echo "   Building Docker images..."
docker-compose build --no-cache

# Start services
echo "   Starting services..."
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "   Waiting for services to be ready..."
sleep 30

echo -e "${GREEN}✅ Services deployed successfully${NC}"
echo ""

# Setup Nginx configuration
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"

sudo tee /etc/nginx/sites-available/evep << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8013;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
    }
    
    # Monitoring endpoints
    location /monitoring {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /logs {
        proxy_pass http://localhost:5601;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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

echo -e "${GREEN}✅ Nginx configured successfully${NC}"
echo ""

# Setup SSL certificate
echo -e "${BLUE}🔒 Setting up SSL Certificate...${NC}"

if ! command -v certbot &> /dev/null; then
    echo "   Installing Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Request SSL certificate
echo "   Requesting SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo -e "${GREEN}✅ SSL certificate configured${NC}"
echo ""

# Initialize LINE Bot settings
echo -e "${BLUE}🤖 Initializing LINE Bot Settings...${NC}"

if [ ! -z "$LINE_CHANNEL_ACCESS_TOKEN" ] && [ ! -z "$LINE_CHANNEL_SECRET" ]; then
    echo "   Configuring LINE Bot settings..."
    
    # Wait for backend to be ready
    sleep 10
    
    # Initialize bot settings
    curl -X POST http://localhost:8013/api/v1/line_integration/bot/bot/settings \
        -H "Content-Type: application/json" \
        -d "{
            \"channel_id\": \"$LINE_CHANNEL_ID\",
            \"channel_access_token\": \"$LINE_CHANNEL_ACCESS_TOKEN\",
            \"channel_secret\": \"$LINE_CHANNEL_SECRET\",
            \"webhook_url\": \"https://$DOMAIN/api/v1/line_integration/webhook\",
            \"display_name\": \"EVEP Vision Screening Bot\",
            \"status_message\": \"Vision screening assistant for children\",
            \"is_production\": true,
            \"rate_limit_per_second\": 1000,
            \"monthly_message_limit\": 1000000
        }" || echo "   Warning: Could not initialize LINE Bot settings"
    
    echo -e "${GREEN}✅ LINE Bot settings initialized${NC}"
else
    echo -e "${YELLOW}⚠️  LINE Bot credentials not provided - skipping initialization${NC}"
fi

echo ""

# Health check
echo -e "${BLUE}🏥 Performing Health Check...${NC}"

# Check backend
if curl -f http://localhost:8013/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API health check failed${NC}"
fi

# Check frontend
if curl -f http://localhost:3013 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Check admin panel
if curl -f http://localhost:3015 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin Panel is healthy${NC}"
else
    echo -e "${RED}❌ Admin Panel health check failed${NC}"
fi

# Check monitoring
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Grafana monitoring is healthy${NC}"
else
    echo -e "${RED}❌ Grafana monitoring health check failed${NC}"
fi

echo ""

# Create admin user
echo -e "${BLUE}👤 Creating Admin User...${NC}"

ADMIN_PASSWORD=$(openssl rand -base64 12)
echo "   Admin Password: $ADMIN_PASSWORD"

# Create admin user via API
curl -X POST http://localhost:8013/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"admin\",
        \"email\": \"admin@$DOMAIN\",
        \"password\": \"$ADMIN_PASSWORD\",
        \"role\": \"admin\",
        \"full_name\": \"System Administrator\"
    }" || echo "   Warning: Could not create admin user"

echo -e "${GREEN}✅ Admin user created${NC}"
echo ""

# Final status
echo -e "${GREEN}🎉 EVEP Platform Production Deployment Complete!${NC}"
echo "=================================================================="
echo ""
echo -e "${BLUE}📱 Access URLs:${NC}"
echo "   Frontend: https://$DOMAIN"
echo "   Admin Panel: https://$DOMAIN/admin"
echo "   API Documentation: https://$DOMAIN/api/docs"
echo "   Monitoring: https://$DOMAIN/monitoring"
echo "   Logs: https://$DOMAIN/logs"
echo ""
echo -e "${BLUE}🔐 Admin Credentials:${NC}"
echo "   Username: admin"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo -e "${BLUE}🤖 LINE Bot Management:${NC}"
echo "   Access via Admin Panel: https://$DOMAIN/admin"
echo "   Navigate to: LINE Bot Manager"
echo "   Features: Bot Settings, Rich Menus, Keyword Replies, Flex Messages"
echo ""
echo -e "${BLUE}📊 Monitoring & Analytics:${NC}"
echo "   Grafana: https://$DOMAIN/monitoring"
echo "   Kibana: https://$DOMAIN/logs"
echo "   Prometheus: http://localhost:9090"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "   - Change admin password after first login"
echo "   - Configure LINE Bot webhook URL in LINE Developer Console"
echo "   - Set up backup and monitoring alerts"
echo "   - Review security settings and firewall rules"
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "For support and documentation, visit: https://github.com/your-repo/evep-platform"
