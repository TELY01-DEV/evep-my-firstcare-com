#!/bin/bash

# EVEP Production Deployment Script
# Transfers all files to production server and rebuilds Docker containers

set -e  # Exit on any error

# Configuration
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com"
PROJECT_NAME="evep-my-firstcare-com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if SSH key exists
    if [[ ! -f "$SSH_KEY" ]]; then
        error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    # Check if scp is available
    if ! command -v scp &> /dev/null; then
        error "scp command not found"
        exit 1
    fi
    
    # Check if ssh is available
    if ! command -v ssh &> /dev/null; then
        error "ssh command not found"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Test SSH connection
test_ssh_connection() {
    log "Testing SSH connection to server..."
    
    if ssh -i "$SSH_KEY" -p "$SERVER_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        success "SSH connection established"
    else
        error "Failed to establish SSH connection"
        exit 1
    fi
}

# Create backup on server
create_server_backup() {
    log "Creating backup on server..."
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$REMOTE_PATH/backups/$backup_name"
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        mkdir -p "$REMOTE_PATH/backups"
        if [ -d "$REMOTE_PATH" ]; then
            cp -r "$REMOTE_PATH" "$backup_path" 2>/dev/null || true
            echo "Backup created: $backup_name"
        else
            echo "No existing deployment found, skipping backup"
        fi
EOF
    
    success "Server backup completed"
}

# Transfer files to server
transfer_files() {
    log "Transferring files to server..."
    
    # Create remote directory structure
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_PATH"
    
    # Transfer all project files (excluding .git, node_modules, etc.)
    log "Transferring project files..."
    
    # Create a temporary tar file for efficient transfer
    local temp_tar="temp_deploy.tar.gz"
    
    # Create tar with all necessary files, excluding unnecessary ones
    tar --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        --exclude='*.log' \
        --exclude='logs/*' \
        --exclude='uploads/*' \
        --exclude='backups/*' \
        --exclude='temp_deploy.tar.gz' \
        -czf "$temp_tar" .
    
    # Transfer the tar file
    scp -i "$SSH_KEY" -P "$SERVER_PORT" "$temp_tar" "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"
    
    # Extract on server
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd "$REMOTE_PATH"
        tar -xzf "$temp_tar"
        rm "$temp_tar"
        echo "Files extracted successfully"
EOF
    
    # Clean up local tar file
    rm -f "$temp_tar"
    
    success "Files transferred successfully"
}

# Setup environment on server
setup_environment() {
    log "Setting up environment on server..."
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd "$REMOTE_PATH"
        
        # Ensure .env file exists (should be copied from local)
        if [ -f ".env" ]; then
            echo "Environment file found"
        else
            echo "Warning: .env file not found - please ensure it's copied from local"
        fi
        
        # Set production environment variables
        echo "ENVIRONMENT=production" >> .env
        echo "NODE_ENV=production" >> .env
        echo "DEBUG=false" >> .env
        
        # Create necessary directories
        mkdir -p logs uploads backups
        
        # Set proper permissions
        chmod 755 .
        chmod 644 .env
        chmod -R 755 logs uploads backups
        
        echo "Environment setup completed"
EOF
    
    success "Environment setup completed"
}

# Stop existing containers
stop_containers() {
    log "Stopping existing containers..."
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd "$REMOTE_PATH"
        
        if [ -f "docker-compose.yml" ]; then
            docker-compose down --remove-orphans || true
            echo "Existing containers stopped"
        else
            echo "No docker-compose.yml found, skipping container stop"
        fi
EOF
    
    success "Containers stopped"
}

# Clean up Docker resources
cleanup_docker() {
    log "Cleaning up Docker resources..."
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        # Remove unused containers, networks, and images
        docker system prune -f || true
        
        # Remove dangling images
        docker image prune -f || true
        
        echo "Docker cleanup completed"
EOF
    
    success "Docker cleanup completed"
}

# Build and start containers
build_and_start() {
    log "Building and starting containers..."
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd "$REMOTE_PATH"
        
        # Set production environment
        export ENVIRONMENT=production
        export NODE_ENV=production
        export DEBUG=false
        
        # Stop and remove all containers
        docker-compose down
        
        # Clear Docker build cache to ensure fresh build
        docker system prune -f
        docker builder prune -f
        docker image prune -f
        
        # Remove all images related to this project
        docker images | grep evep | awk '{print \$3}' | xargs -r docker rmi -f
        
        # Build and start all services
        docker-compose up -d --build --force-recreate --no-cache
        
        echo "Containers built and started"
EOF
    
    success "Containers built and started"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "curl -f -s http://localhost:8014/health > /dev/null" 2>/dev/null; then
            success "Health check passed - Backend is responding"
            return 0
        fi
        
        warning "Health check attempt $attempt/$max_attempts failed"
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Show container status
show_status() {
    log "Container status:"
    
    ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd "$REMOTE_PATH"
        docker-compose ps
        echo ""
        echo "Recent logs:"
        docker-compose logs --tail=20
EOF
}

# Main deployment function
main() {
    echo "🚀 EVEP Production Deployment"
    echo "=============================="
    echo "Server: $SERVER_HOST:$SERVER_PORT"
    echo "Remote Path: $REMOTE_PATH"
    echo ""
    
    check_prerequisites
    test_ssh_connection
    create_server_backup
    transfer_files
    setup_environment
    stop_containers
    cleanup_docker
    build_and_start
    
    # Wait a bit for containers to start
    log "Waiting for containers to start..."
    sleep 30
    
    if health_check; then
        success "Deployment completed successfully!"
        show_status
    else
        error "Deployment completed but health check failed"
        show_status
        exit 1
    fi
}

# Run main function
main "$@"
