#!/bin/bash

# EVEP Backend Deployment Script
# Deploys backend Python code to production server without rebuilding Docker

set -e

# Configuration
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com/backend"
CONTAINER_NAME="evep-stardust"

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

echo "🚀 EVEP Backend Deployment"
echo "=========================="
echo "Server: $SERVER_HOST:$SERVER_PORT"
echo "Container: $CONTAINER_NAME"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    error "backend directory not found. Please run from project root."
fi

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
    tar -czf ../backups/backend_\$timestamp.tar.gz app/ 2>/dev/null || true
    echo "Backup created: backend_\$timestamp.tar.gz"
EOF
success "Backup created"

# Transfer backend files
log "Transferring backend files..."

# Transfer app directory (Python code)
rsync -avz --delete \
    -e "ssh -p $SERVER_PORT" \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.pyo' \
    --exclude='.pytest_cache' \
    --exclude='venv' \
    --exclude='.env' \
    --exclude='logs/*' \
    backend/app/ "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/app/"

# Transfer requirements.txt if changed
if [ -f "backend/requirements.txt" ]; then
    scp -P "$SERVER_PORT" backend/requirements.txt "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"
fi

success "Files transferred"

# Restart container
log "Restarting backend container..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
    cd /www/dk_project/evep-my-firstcare-com
    docker-compose restart $CONTAINER_NAME
    echo "Container restarted"
EOF

# Wait for service to start
log "Waiting for service to start..."
sleep 5

# Health check
log "Performing health check..."
for i in {1..10}; do
    if ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "curl -sf http://localhost:8013/health" &>/dev/null; then
        success "Backend is healthy ✓"
        
        # Show recent logs
        log "Recent logs:"
        ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "docker logs $CONTAINER_NAME --tail 20"
        
        echo ""
        success "Backend deployment completed successfully!"
        echo ""
        echo "📊 Service URLs:"
        echo "   API: https://stardust.evep.my-firstcare.com"
        echo "   Health: https://stardust.evep.my-firstcare.com/health"
        echo "   Docs: https://stardust.evep.my-firstcare.com/docs"
        exit 0
    fi
    warning "Health check attempt $i/10 failed, retrying..."
    sleep 3
done

error "Health check failed - backend may not be running properly"
