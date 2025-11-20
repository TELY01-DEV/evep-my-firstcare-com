#!/bin/bash

# EVEP Master Deployment Script
# Deploy all components or specific components

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

show_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║      EVEP Platform Deployment Tool        ║${NC}"
    echo -e "${CYAN}║    Build locally, deploy to production    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

show_usage() {
    echo "Usage: ./deploy.sh [COMPONENT]"
    echo ""
    echo "Components:"
    echo "  backend    - Deploy backend (Python/FastAPI)"
    echo "  frontend   - Deploy frontend portal (React)"
    echo "  admin      - Deploy admin panel (React)"
    echo "  all        - Deploy all components"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh backend    # Deploy only backend"
    echo "  ./deploy.sh frontend   # Deploy only frontend"
    echo "  ./deploy.sh all        # Deploy everything"
    echo ""
}

check_scripts() {
    local scripts=(
        "scripts/deploy-backend.sh"
        "scripts/deploy-frontend.sh"
        "scripts/deploy-admin.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ ! -f "$script" ]; then
            error "Required script not found: $script"
        fi
        chmod +x "$script"
    done
}

deploy_backend() {
    info "Deploying Backend..."
    ./scripts/deploy-backend.sh
}

deploy_frontend() {
    info "Deploying Frontend Portal..."
    ./scripts/deploy-frontend.sh
}

deploy_admin() {
    info "Deploying Admin Panel..."
    ./scripts/deploy-admin.sh
}

deploy_all() {
    log "Starting full deployment..."
    echo ""
    
    # Deploy backend first
    info "Step 1/3: Backend"
    deploy_backend
    echo ""
    
    # Deploy frontend
    info "Step 2/3: Frontend Portal"
    deploy_frontend
    echo ""
    
    # Deploy admin
    info "Step 3/3: Admin Panel"
    deploy_admin
    echo ""
    
    success "All components deployed successfully!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Portal:      https://portal.evep.my-firstcare.com"
    echo "   Admin:       https://admin.evep.my-firstcare.com"
    echo "   API:         https://stardust.evep.my-firstcare.com"
    echo "   API Docs:    https://stardust.evep.my-firstcare.com/docs"
    echo ""
}

# Main
show_banner

# Check if scripts directory exists
if [ ! -d "scripts" ]; then
    error "scripts directory not found. Please run from project root."
fi

# Check all required scripts exist
check_scripts

# Parse command
COMPONENT="${1:-help}"

case "$COMPONENT" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    admin)
        deploy_admin
        ;;
    all)
        deploy_all
        ;;
    help|--help|-h)
        show_usage
        exit 0
        ;;
    *)
        error "Unknown component: $COMPONENT"
        show_usage
        exit 1
        ;;
esac

exit 0
