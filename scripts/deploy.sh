#!/bin/bash

# EVEP Production Deployment Script
# This script handles deployment to production environment

set -e  # Exit on any error

# Configuration
PROJECT_NAME="evep-my-firstcare-com"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/backup/evep"
LOG_FILE="/var/log/evep/deploy.log"
HEALTH_CHECK_URL="http://localhost:8013/health"
ROLLBACK_TIMEOUT=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "/var/log/evep"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup docker-compose file
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        cp "$DOCKER_COMPOSE_FILE" "$backup_path/"
    fi
    
    # Backup environment file
    if [[ -f ".env" ]]; then
        cp ".env" "$backup_path/"
    fi
    
    # Backup logs
    if [[ -d "/var/log/evep" ]]; then
        cp -r /var/log/evep "$backup_path/"
    fi
    
    # Create backup marker
    echo "$backup_name" > "$BACKUP_DIR/latest_backup"
    
    success "Backup created: $backup_name"
}

# Health check function
health_check() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    log "Performing health check for $service..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            success "$service is healthy"
            return 0
        fi
        
        warning "Health check attempt $attempt/$max_attempts failed for $service"
        sleep 10
        ((attempt++))
    done
    
    error "$service health check failed after $max_attempts attempts"
    return 1
}

# Stop services gracefully
stop_services() {
    log "Stopping services gracefully..."
    
    # Stop services with timeout
    timeout 60 docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30 || {
        warning "Graceful shutdown failed, forcing stop..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 10 --remove-orphans
    }
    
    success "Services stopped"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    success "Services started"
}

# Perform health checks
perform_health_checks() {
    log "Performing comprehensive health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if ! health_check "backend"; then
        error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if ! curl -f -s "http://localhost:3013" > /dev/null; then
        error "Frontend health check failed"
        return 1
    fi
    
    # Check database connectivity
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -c "
import asyncio
from app.core.database import get_database
async def test_db():
    try:
        db = await get_database()
        await db.command('ping')
        print('Database connection successful')
    except Exception as e:
        print(f'Database connection failed: {e}')
        exit(1)
asyncio.run(test_db())
"; then
        error "Database health check failed"
        return 1
    fi
    
    # Check Redis connectivity
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        error "Redis health check failed"
        return 1
    fi
    
    success "All health checks passed"
    return 0
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    local latest_backup=$(cat "$BACKUP_DIR/latest_backup" 2>/dev/null || echo "")
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found for rollback"
        return 1
    fi
    
    log "Rolling back to backup: $latest_backup"
    
    # Stop current services
    stop_services
    
    # Restore from backup
    local backup_path="$BACKUP_DIR/$latest_backup"
    if [[ -f "$backup_path/docker-compose.yml" ]]; then
        cp "$backup_path/docker-compose.yml" "$DOCKER_COMPOSE_FILE"
    fi
    
    if [[ -f "$backup_path/.env" ]]; then
        cp "$backup_path/.env" ".env"
    fi
    
    # Start services with backup configuration
    start_services
    
    # Health check rollback
    if perform_health_checks; then
        success "Rollback completed successfully"
        return 0
    else
        error "Rollback health checks failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    local backup_count=$(ls -1 "$BACKUP_DIR" | grep "^backup_" | wc -l)
    
    if [[ $backup_count -gt 5 ]]; then
        local to_delete=$((backup_count - 5))
        ls -1t "$BACKUP_DIR" | grep "^backup_" | tail -n "$to_delete" | xargs -I {} rm -rf "$BACKUP_DIR/{}"
        log "Removed $to_delete old backups"
    fi
}

# Main deployment function
deploy() {
    log "Starting EVEP production deployment..."
    
    # Pre-deployment checks
    check_root
    setup_directories
    
    # Check if docker-compose file exists
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        error "Environment file not found: .env"
        exit 1
    fi
    
    # Create backup
    backup_current
    
    # Stop current services
    stop_services
    
    # Start services with new configuration
    start_services
    
    # Perform health checks
    if perform_health_checks; then
        success "Deployment completed successfully"
        cleanup_backups
        log "Deployment finished at $(date)"
        exit 0
    else
        error "Health checks failed, rolling back..."
        if rollback; then
            error "Deployment failed but rollback was successful"
            exit 1
        else
            error "Deployment failed and rollback also failed"
            exit 1
        fi
    fi
}

# Show deployment status
status() {
    log "Checking deployment status..."
    
    echo "=== EVEP Deployment Status ==="
    echo "Timestamp: $(date)"
    echo ""
    
    # Docker services status
    echo "=== Docker Services ==="
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    echo "=== Health Checks ==="
    
    # Backend health
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
        echo -e "${GREEN}✓ Backend: Healthy${NC}"
    else
        echo -e "${RED}✗ Backend: Unhealthy${NC}"
    fi
    
    # Frontend health
    if curl -f -s "http://localhost:3013" > /dev/null; then
        echo -e "${GREEN}✓ Frontend: Healthy${NC}"
    else
        echo -e "${RED}✗ Frontend: Unhealthy${NC}"
    fi
    
    # Database health
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -c "
import asyncio
from app.core.database import get_database
async def test_db():
    try:
        db = await get_database()
        await db.command('ping')
        print('OK')
    except:
        print('FAIL')
        exit(1)
asyncio.run(test_db())
" 2>/dev/null | grep -q "OK"; then
        echo -e "${GREEN}✓ Database: Healthy${NC}"
    else
        echo -e "${RED}✗ Database: Unhealthy${NC}"
    fi
    
    # Redis health
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis: Healthy${NC}"
    else
        echo -e "${RED}✗ Redis: Unhealthy${NC}"
    fi
    
    echo ""
    echo "=== Recent Backups ==="
    ls -1t "$BACKUP_DIR" | grep "^backup_" | head -5 | while read backup; do
        echo "- $backup"
    done
}

# Show usage
usage() {
    echo "EVEP Production Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the application to production"
    echo "  status    Show current deployment status"
    echo "  rollback  Rollback to previous deployment"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 rollback"
}

# Main script logic
case "${1:-}" in
    deploy)
        deploy
        ;;
    status)
        status
        ;;
    rollback)
        check_root
        setup_directories
        rollback
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac
