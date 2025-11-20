#!/bin/bash

# EVEP Frontend (Portal Panel) Deployment Script
# Builds React app locally and transfers only build files to production

set -e

# Configuration
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com/frontend"
SERVICE_NAME="frontend"
CONTAINER_NAME="evep-frontend"
LOCAL_BUILD_DIR="frontend/build"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo "🚀 EVEP Frontend (Portal Panel) Deployment"
echo "=========================================="
echo "Server: $SERVER_HOST:$SERVER_PORT"
echo "Service: $SERVICE_NAME (container: $CONTAINER_NAME)"
echo ""

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    error "frontend directory not found. Please run from project root."
fi

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Build React app locally
log "Building React app locally..."
echo "This may take a few minutes..."

# Clean previous build
rm -rf build

# Build for production
if npm run build; then
    success "Build completed successfully"
else
    error "Build failed"
fi

# Check if build directory exists
if [ ! -d "build" ]; then
    error "Build directory not found after build"
fi

cd ..

# Test SSH connection
log "Testing SSH connection..."
if ! ssh -p "$SERVER_PORT" -o ConnectTimeout=5 "$SERVER_USER@$SERVER_HOST" "echo 'Connected'" &>/dev/null; then
    error "Cannot connect to server"
fi
success "SSH connection OK"

# Create backup
log "Creating backup on server..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
    cd $REMOTE_PATH
    timestamp=\$(date +%Y%m%d_%H%M%S)
    if [ -d "build" ]; then
        tar -czf ../backups/frontend_build_\$timestamp.tar.gz build/ 2>/dev/null || true
        echo "Backup created: frontend_build_\$timestamp.tar.gz"
    fi
EOF
success "Backup created"

# Transfer build files only
log "Transferring build files to server..."

# Create build directory on server if not exists
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_PATH/build"

# Transfer build files using rsync for efficiency
rsync -avz --delete \
    -e "ssh -p $SERVER_PORT" \
    --progress \
    $LOCAL_BUILD_DIR/ "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/build/"

success "Build files transferred"

# Restart container
log "Restarting frontend service..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
    cd /www/dk_project/evep-my-firstcare-com
    docker-compose restart $SERVICE_NAME
    echo "Service restarted successfully"
EOF

# Wait for service to start
log "Waiting for service to start..."
sleep 5

# Health check
log "Performing health check..."
for i in {1..10}; do
    if ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "curl -sf http://localhost:3013" &>/dev/null; then
        success "Frontend is accessible ✓"
        
        # Show container status
        log "Container status:"
        ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "docker ps | grep $CONTAINER_NAME"
        
        echo ""
        success "Frontend deployment completed successfully!"
        echo ""
        echo "📊 Service URLs:"
        echo "   Portal: https://portal.evep.my-firstcare.com"
        echo ""
        echo "💡 Tips:"
        echo "   - Clear browser cache if changes don't appear"
        echo "   - Check build size: $(du -sh $LOCAL_BUILD_DIR | cut -f1)"
        exit 0
    fi
    warning "Health check attempt $i/10 failed, retrying..."
    sleep 3
done

error "Health check failed - frontend may not be running properly"
