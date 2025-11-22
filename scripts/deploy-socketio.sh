#!/bin/bash

# Socket.IO Service Deployment Script
# Deploys the Socket.IO service for real-time collaboration features

set -e

echo "🔌 EVEP Socket.IO Service - Deployment"
echo "======================================"

# Configuration
SERVICE_NAME="evep-socketio"
PORT="9014"
INTERNAL_PORT="8000"

echo "📋 Socket.IO Service Configuration:"
echo "   Service Name: $SERVICE_NAME"
echo "   External Port: $PORT"
echo "   Internal Port: $INTERNAL_PORT"
echo "   Domain: socketio.evep.my-firstcare.com"
echo ""

# Function to check if service is running
check_service_status() {
    if docker ps | grep -q $SERVICE_NAME; then
        echo "✅ Socket.IO service is running"
        return 0
    else
        echo "❌ Socket.IO service is not running"
        return 1
    fi
}

# Function to deploy service
deploy_service() {
    echo "📦 Building and deploying Socket.IO service..."
    
    # Stop existing service if running
    echo "🛑 Stopping existing Socket.IO service..."
    docker-compose stop socketio || true
    docker-compose rm -f socketio || true
    
    # Build and start the service
    echo "🚀 Building and starting Socket.IO service..."
    docker-compose up -d --build socketio
    
    # Wait for service to be ready
    echo "⏳ Waiting for service to be ready..."
    sleep 10
    
    # Check if service is healthy
    for i in {1..30}; do
        if curl -f -s http://localhost:$PORT/health >/dev/null 2>&1; then
            echo "✅ Socket.IO service is healthy and ready!"
            return 0
        fi
        echo "⏳ Waiting for service to be ready... (attempt $i/30)"
        sleep 2
    done
    
    echo "❌ Service failed to become ready within timeout"
    return 1
}

# Function to create nginx configuration
create_nginx_config() {
    echo "🔧 Creating nginx configuration for Socket.IO proxy..."
    
    # Create nginx configuration for Socket.IO subdomain
    cat > /tmp/socketio-nginx.conf << 'EOF'
server {
    listen 80;
    server_name socketio.evep.my-firstcare.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name socketio.evep.my-firstcare.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/evep.my-firstcare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/evep.my-firstcare.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # CORS headers for Socket.IO
    add_header 'Access-Control-Allow-Origin' 'https://portal.evep.my-firstcare.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://portal.evep.my-firstcare.com';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Proxy to Socket.IO service
    location / {
        proxy_pass http://localhost:9014;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Socket.IO specific settings
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:9014/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging
    access_log /var/log/nginx/socketio.access.log;
    error_log /var/log/nginx/socketio.error.log;
}
EOF

    echo "📁 Nginx configuration created at /tmp/socketio-nginx.conf"
    echo ""
    echo "🔧 To apply the nginx configuration, run these commands on your server:"
    echo "   sudo cp /tmp/socketio-nginx.conf /etc/nginx/sites-available/socketio.evep.my-firstcare.com"
    echo "   sudo ln -sf /etc/nginx/sites-available/socketio.evep.my-firstcare.com /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
}

# Function to show service logs
show_logs() {
    echo "📋 Socket.IO Service Logs:"
    echo "=========================="
    docker-compose logs --tail=50 socketio
}

# Main deployment process
main() {
    echo "🚀 Starting Socket.IO service deployment..."
    echo ""
    
    # Deploy the service
    if deploy_service; then
        echo ""
        echo "✅ Socket.IO service deployed successfully!"
        
        # Create nginx configuration
        create_nginx_config
        
        # Show service status
        echo "📊 Service Status:"
        echo "=================="
        docker-compose ps socketio
        echo ""
        
        # Show health check
        echo "🏥 Health Check:"
        echo "================"
        if curl -f -s http://localhost:$PORT/health; then
            echo ""
            echo "✅ Service is healthy!"
        else
            echo "❌ Health check failed"
        fi
        echo ""
        
        echo "🎉 Socket.IO Deployment Complete!"
        echo ""
        echo "📝 Next Steps:"
        echo "1. Apply the nginx configuration on your server (see commands above)"
        echo "2. Ensure DNS points socketio.evep.my-firstcare.com to your server"
        echo "3. Test the service at https://socketio.evep.my-firstcare.com/health"
        echo ""
        
        # Show logs
        show_logs
        
    else
        echo "❌ Socket.IO service deployment failed!"
        echo ""
        echo "📋 Checking logs..."
        show_logs
        exit 1
    fi
}

# Run main function
main "$@"