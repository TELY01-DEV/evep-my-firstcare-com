#!/bin/bash

# AI Services Management Script for EVEP Platform
# This script allows you to enable/disable and manage AI services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
AI_PROFILE="ai"
ENV_FILE="ai-service.env"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if AI services are enabled
check_ai_enabled() {
    if grep -q "AI_SERVICE_ENABLED=true" "$ENV_FILE" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to enable AI services
enable_ai() {
    print_header "Enabling AI Services"
    
    # Update environment file
    if [ -f "$ENV_FILE" ]; then
        sed -i.bak 's/AI_SERVICE_ENABLED=false/AI_SERVICE_ENABLED=true/' "$ENV_FILE"
    else
        print_error "AI service environment file not found: $ENV_FILE"
        exit 1
    fi
    
    print_status "AI services enabled in configuration"
    
    # Start AI services
    print_status "Starting AI services..."
    docker-compose --profile "$AI_PROFILE" up -d ai-service ai-worker ai-monitor
    
    print_status "AI services started successfully"
    print_status "You can now use AI features in the EVEP platform"
}

# Function to disable AI services
disable_ai() {
    print_header "Disabling AI Services"
    
    # Stop AI services
    print_status "Stopping AI services..."
    docker-compose --profile "$AI_PROFILE" stop ai-service ai-worker ai-monitor 2>/dev/null || true
    
    # Update environment file
    if [ -f "$ENV_FILE" ]; then
        sed -i.bak 's/AI_SERVICE_ENABLED=true/AI_SERVICE_ENABLED=false/' "$ENV_FILE"
    fi
    
    print_status "AI services disabled and stopped"
    print_warning "AI features will not be available in the EVEP platform"
}

# Function to start AI services
start_ai() {
    print_header "Starting AI Services"
    
    if check_ai_enabled; then
        print_status "Starting AI services..."
        docker-compose --profile "$AI_PROFILE" up -d ai-service ai-worker ai-monitor
        print_status "AI services started successfully"
    else
        print_warning "AI services are disabled. Use 'enable' command first."
        exit 1
    fi
}

# Function to stop AI services
stop_ai() {
    print_header "Stopping AI Services"
    
    print_status "Stopping AI services..."
    docker-compose --profile "$AI_PROFILE" stop ai-service ai-worker ai-monitor
    print_status "AI services stopped"
}

# Function to restart AI services
restart_ai() {
    print_header "Restarting AI Services"
    
    stop_ai
    sleep 2
    start_ai
}

# Function to check AI services status
status_ai() {
    print_header "AI Services Status"
    
    echo "Configuration:"
    if check_ai_enabled; then
        echo -e "  AI Services: ${GREEN}ENABLED${NC}"
    else
        echo -e "  AI Services: ${RED}DISABLED${NC}"
    fi
    
    echo ""
    echo "Container Status:"
    docker-compose --profile "$AI_PROFILE" ps ai-service ai-worker ai-monitor 2>/dev/null || echo "  No AI containers running"
    
    echo ""
    echo "Health Checks:"
    
    # Check AI service health
    if docker-compose ps ai-service | grep -q "Up"; then
        HEALTH_URL="http://localhost:8001/health"
        if command -v curl >/dev/null 2>&1; then
            if curl -s "$HEALTH_URL" >/dev/null 2>&1; then
                echo -e "  AI Service: ${GREEN}HEALTHY${NC}"
            else
                echo -e "  AI Service: ${RED}UNHEALTHY${NC}"
            fi
        else
            echo -e "  AI Service: ${YELLOW}RUNNING (curl not available for health check)${NC}"
        fi
    else
        echo -e "  AI Service: ${RED}NOT RUNNING${NC}"
    fi
}

# Function to show AI service logs
logs_ai() {
    print_header "AI Services Logs"
    
    if [ -n "$1" ]; then
        # Show logs for specific service
        docker-compose --profile "$AI_PROFILE" logs -f "$1"
    else
        # Show logs for all AI services
        docker-compose --profile "$AI_PROFILE" logs -f ai-service ai-worker ai-monitor
    fi
}

# Function to rebuild AI services
rebuild_ai() {
    print_header "Rebuilding AI Services"
    
    print_status "Building AI service image..."
    docker-compose --profile "$AI_PROFILE" build ai-service
    
    print_status "AI service rebuilt successfully"
    
    if check_ai_enabled; then
        print_status "Restarting AI services..."
        restart_ai
    fi
}

# Function to show usage
show_usage() {
    echo "AI Services Management Script for EVEP Platform"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  enable    - Enable AI services and start them"
    echo "  disable   - Disable AI services and stop them"
    echo "  start     - Start AI services (if enabled)"
    echo "  stop      - Stop AI services"
    echo "  restart   - Restart AI services"
    echo "  status    - Show AI services status"
    echo "  logs      - Show AI services logs"
    echo "  logs [service] - Show logs for specific service (ai-service, ai-worker, ai-monitor)"
    echo "  rebuild   - Rebuild AI service image"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 enable     # Enable and start AI services"
    echo "  $0 disable    # Disable and stop AI services"
    echo "  $0 status     # Check AI services status"
    echo "  $0 logs ai-service  # Show AI service logs"
}

# Main script logic
case "${1:-help}" in
    enable)
        enable_ai
        ;;
    disable)
        disable_ai
        ;;
    start)
        start_ai
        ;;
    stop)
        stop_ai
        ;;
    restart)
        restart_ai
        ;;
    status)
        status_ai
        ;;
    logs)
        logs_ai "$2"
        ;;
    rebuild)
        rebuild_ai
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

