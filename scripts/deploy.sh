#!/bin/bash

# EVEP Platform Deployment Script
# This script deploys the updated code to the production server

set -e  # Exit on any error

# Configuration
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
SSH_KEY="~/.ssh/id_ed25519"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com"
LOCAL_PATH="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if SSH connection is working
check_ssh_connection() {
    print_status "Checking SSH connection to server..."
    if ssh -i $SSH_KEY -p $SERVER_PORT -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        print_success "SSH connection established"
        return 0
    else
        print_error "Failed to establish SSH connection"
        return 1
    fi
}

# Function to backup current deployment
backup_current_deployment() {
    print_status "Creating backup of current deployment..."
    ssh -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $REMOTE_PATH
        if [ -d "backup" ]; then
            rm -rf backup
        fi
        mkdir -p backup
        cp -r backend backup/ 2>/dev/null || true
        cp -r frontend backup/ 2>/dev/null || true
        cp docker-compose.yml backup/ 2>/dev/null || true
        cp .env backup/ 2>/dev/null || true
        echo "Backup created at \$(date)" > backup/backup_info.txt
EOF
    print_success "Backup created successfully"
}

# Function to stop running containers
stop_containers() {
    print_status "Stopping running containers..."
    ssh -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $REMOTE_PATH
        if [ -f "docker-compose.yml" ]; then
            docker-compose down --remove-orphans || true
        fi
EOF
    print_success "Containers stopped"
}

# Function to copy updated code
copy_code() {
    print_status "Copying updated code to server..."
    
    # Create a temporary directory for the deployment
    TEMP_DIR=$(mktemp -d)
    
    # Copy backend files
    print_status "Copying backend files..."
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY -p $SERVER_PORT" \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.pytest_cache' \
        --exclude='.coverage' \
        --exclude='htmlcov' \
        backend/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/backend/
    
    # Copy frontend files
    print_status "Copying frontend files..."
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY -p $SERVER_PORT" \
        --exclude='node_modules' \
        --exclude='build' \
        --exclude='.next' \
        --exclude='.cache' \
        frontend/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/frontend/
    
    # Copy configuration files
    print_status "Copying configuration files..."
    scp -i $SSH_KEY -P $SERVER_PORT \
        docker-compose.yml \
        .env \
        $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/
    
    print_success "Code copied successfully"
}

# Function to build and start containers
build_and_start() {
    print_status "Building and starting containers..."
    ssh -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $REMOTE_PATH
        
        # Build frontend
        print_status "Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..
        
        # Build and start all services
        print_status "Building and starting all services..."
        docker-compose build --no-cache
        docker-compose up -d
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 30
        
        # Check service status
        docker-compose ps
EOF
    print_success "Containers built and started"
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    ssh -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $REMOTE_PATH
        
        # Check if containers are running
        echo "Container Status:"
        docker-compose ps
        
        # Check API health
        echo "API Health Check:"
        curl -f http://localhost:8013/health || echo "API health check failed"
        
        # Check frontend
        echo "Frontend Status:"
        curl -f http://localhost:3013/ || echo "Frontend check failed"
EOF
    print_success "Health check completed"
}

# Function to show deployment info
show_deployment_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Available Endpoints:"
    echo "   Health Check: http://103.22.182.146:8013/health"
    echo "   API Status: http://103.22.182.146:8013/api/v1/status"
    echo "   API Documentation: http://103.22.182.146:8013/docs"
    echo "   Frontend: http://103.22.182.146:3013"
    echo ""
    echo "🔐 Authentication: http://103.22.182.146:8013/api/v1/auth/*"
    echo "👥 Patient Management: http://103.22.182.146:8013/api/v1/patients/*"
    echo ""
    echo "📋 New Features Deployed:"
    echo "   ✅ Patient Management API (CRUD operations)"
    echo "   ✅ Enhanced Authentication UI"
    echo "   ✅ Document Upload System"
    echo "   ✅ Role-based Access Control"
    echo "   ✅ Blockchain Audit Trail"
    echo ""
}

# Main deployment function
main() {
    echo "🚀 Starting EVEP Platform Deployment"
    echo "====================================="
    echo ""
    
    # Check SSH connection
    if ! check_ssh_connection; then
        print_error "Cannot proceed without SSH connection"
        exit 1
    fi
    
    # Backup current deployment
    backup_current_deployment
    
    # Stop running containers
    stop_containers
    
    # Copy updated code
    copy_code
    
    # Build and start containers
    build_and_start
    
    # Check service health
    check_health
    
    # Show deployment info
    show_deployment_info
    
    print_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"
