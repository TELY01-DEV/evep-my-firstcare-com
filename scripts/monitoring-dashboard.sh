#!/bin/bash

# EVEP Platform Advanced Monitoring Dashboard
# Provides real-time system insights and performance metrics

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to clear screen
clear_screen() {
    clear
}

# Function to get system metrics
get_system_metrics() {
    echo -e "${BLUE}🖥️  SYSTEM METRICS${NC}"
    echo "=================="
    
    # CPU Usage
    CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo -e "CPU Usage: ${YELLOW}${CPU_USAGE}%${NC}"
    
    # Memory Usage
    MEMORY_INFO=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    MEMORY_USAGE=$(echo "scale=2; 100 - (${MEMORY_INFO} * 4096 / 1024 / 1024 / 1024)" | bc -l 2>/dev/null || echo "N/A")
    echo -e "Memory Usage: ${YELLOW}${MEMORY_USAGE}%${NC}"
    
    # Disk Usage
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo -e "Disk Usage: ${YELLOW}${DISK_USAGE}%${NC}"
    
    # Network
    NETWORK_INTERFACES=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    echo -e "Network IP: ${YELLOW}${NETWORK_INTERFACES}${NC}"
    
    echo ""
}

# Function to get Docker metrics
get_docker_metrics() {
    echo -e "${BLUE}🐳 DOCKER METRICS${NC}"
    echo "=================="
    
    # Container count
    CONTAINER_COUNT=$(docker-compose ps -q | wc -l)
    echo -e "Running Containers: ${GREEN}${CONTAINER_COUNT}${NC}"
    
    # Container status
    echo -e "${CYAN}Container Status:${NC}"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | head -10
    
    # Resource usage
    echo -e "\n${CYAN}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -10
    
    echo ""
}

# Function to get API health
get_api_health() {
    echo -e "${BLUE}🔌 API HEALTH${NC}"
    echo "============="
    
    # Check each module
    MODULES=("auth" "patient_management/api/v1/patients" "screening/api/v1/screenings" "ai_ml" "line_integration")
    MODULE_NAMES=("Authentication" "Patient Management" "Screening" "AI/ML" "LINE Integration")
    
    for i in "${!MODULES[@]}"; do
        MODULE=${MODULES[$i]}
        NAME=${MODULE_NAMES[$i]}
        
        if curl -s "http://localhost:8013/api/v1/${MODULE}/health" > /dev/null 2>&1; then
            RESPONSE_TIME=$(curl -s -w "%{time_total}" "http://localhost:8013/api/v1/${MODULE}/health" -o /dev/null)
            echo -e "${NAME}: ${GREEN}✅ Healthy${NC} (${RESPONSE_TIME}s)"
        else
            echo -e "${NAME}: ${RED}❌ Unhealthy${NC}"
        fi
    done
    
    echo ""
}

# Function to get database metrics
get_database_metrics() {
    echo -e "${BLUE}🗄️  DATABASE METRICS${NC}"
    echo "====================="
    
    # MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        echo -e "MongoDB: ${GREEN}✅ Connected${NC}"
        
        # Get collection counts
        PATIENT_COUNT=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.patients.countDocuments()" 2>/dev/null || echo "N/A")
        SCREENING_COUNT=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.screenings.countDocuments()" 2>/dev/null || echo "N/A")
        USER_COUNT=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "N/A")
        
        echo -e "  Patients: ${YELLOW}${PATIENT_COUNT}${NC}"
        echo -e "  Screenings: ${YELLOW}${SCREENING_COUNT}${NC}"
        echo -e "  Users: ${YELLOW}${USER_COUNT}${NC}"
    else
        echo -e "MongoDB: ${RED}❌ Disconnected${NC}"
    fi
    
    # Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "Redis: ${GREEN}✅ Connected${NC}"
        
        # Get Redis info
        REDIS_KEYS=$(docker-compose exec -T redis redis-cli dbsize 2>/dev/null || echo "N/A")
        echo -e "  Keys: ${YELLOW}${REDIS_KEYS}${NC}"
    else
        echo -e "Redis: ${RED}❌ Disconnected${NC}"
    fi
    
    echo ""
}

# Function to get monitoring metrics
get_monitoring_metrics() {
    echo -e "${BLUE}📊 MONITORING METRICS${NC}"
    echo "======================="
    
    # Prometheus
    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo -e "Prometheus: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:9090${NC}"
    else
        echo -e "Prometheus: ${RED}❌ Not Running${NC}"
    fi
    
    # Grafana
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "Grafana: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:3000${NC}"
    else
        echo -e "Grafana: ${RED}❌ Not Running${NC}"
    fi
    
    # Elasticsearch
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e "Elasticsearch: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:9200${NC}"
    else
        echo -e "Elasticsearch: ${RED}❌ Not Running${NC}"
    fi
    
    # Kibana
    if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
        echo -e "Kibana: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:5601${NC}"
    else
        echo -e "Kibana: ${RED}❌ Not Running${NC}"
    fi
    
    echo ""
}

# Function to get application metrics
get_application_metrics() {
    echo -e "${BLUE}📱 APPLICATION METRICS${NC}"
    echo "========================"
    
    # Frontend
    if curl -s http://localhost:3015 > /dev/null 2>&1; then
        echo -e "Frontend: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:3015${NC}"
    else
        echo -e "Frontend: ${RED}❌ Not Running${NC}"
    fi
    
    # Admin Panel
    if curl -s http://localhost:3016 > /dev/null 2>&1; then
        echo -e "Admin Panel: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:3016${NC}"
    else
        echo -e "Admin Panel: ${RED}❌ Not Running${NC}"
    fi
    
    # Backend API
    if curl -s http://localhost:8013/health > /dev/null 2>&1; then
        echo -e "Backend API: ${GREEN}✅ Running${NC}"
        echo -e "  URL: ${YELLOW}http://localhost:8013${NC}"
        echo -e "  Docs: ${YELLOW}http://localhost:8013/docs${NC}"
    else
        echo -e "Backend API: ${RED}❌ Not Running${NC}"
    fi
    
    echo ""
}

# Function to get recent logs
get_recent_logs() {
    echo -e "${BLUE}📋 RECENT LOGS${NC}"
    echo "==============="
    
    # Get recent backend logs
    echo -e "${CYAN}Backend Logs (last 5 lines):${NC}"
    docker-compose logs --tail=5 backend 2>/dev/null || echo "No logs available"
    
    echo ""
}

# Function to get performance alerts
get_performance_alerts() {
    echo -e "${BLUE}🚨 PERFORMANCE ALERTS${NC}"
    echo "======================"
    
    ALERTS=()
    
    # Check CPU usage
    CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        ALERTS+=("High CPU usage: ${CPU_USAGE}%")
    fi
    
    # Check memory usage
    if [ "$MEMORY_USAGE" != "N/A" ]; then
        if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
            ALERTS+=("High memory usage: ${MEMORY_USAGE}%")
        fi
    fi
    
    # Check disk usage
    if [ "$DISK_USAGE" -gt 80 ]; then
        ALERTS+=("High disk usage: ${DISK_USAGE}%")
    fi
    
    # Check container count
    if [ "$CONTAINER_COUNT" -lt 10 ]; then
        ALERTS+=("Low container count: ${CONTAINER_COUNT}/13")
    fi
    
    if [ ${#ALERTS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ No performance alerts${NC}"
    else
        for alert in "${ALERTS[@]}"; do
            echo -e "${RED}⚠️  ${alert}${NC}"
        done
    fi
    
    echo ""
}

# Function to get quick actions
get_quick_actions() {
    echo -e "${BLUE}⚡ QUICK ACTIONS${NC}"
    echo "================"
    echo -e "${CYAN}1.${NC} Restart Backend: ${YELLOW}docker-compose restart backend${NC}"
    echo -e "${CYAN}2.${NC} View Logs: ${YELLOW}docker-compose logs -f backend${NC}"
    echo -e "${CYAN}3.${NC} Check Health: ${YELLOW}./scripts/production-readiness-checklist.sh${NC}"
    echo -e "${CYAN}4.${NC} Load Test: ${YELLOW}./scripts/load-test.sh${NC}"
    echo -e "${CYAN}5.${NC} Backup: ${YELLOW}./scripts/backup-recovery.sh backup${NC}"
    echo -e "${CYAN}6.${NC} Open Grafana: ${YELLOW}open http://localhost:3000${NC}"
    echo -e "${CYAN}7.${NC} Open API Docs: ${YELLOW}open http://localhost:8013/docs${NC}"
    echo -e "${CYAN}8.${NC} Open Frontend: ${YELLOW}open http://localhost:3015${NC}"
    echo ""
}

# Main dashboard function
show_dashboard() {
    clear_screen
    
    echo -e "${PURPLE}🎯 EVEP PLATFORM - ADVANCED MONITORING DASHBOARD${NC}"
    echo -e "${PURPLE}================================================${NC}"
    echo -e "Generated: ${YELLOW}$(date)${NC}"
    echo ""
    
    get_system_metrics
    get_docker_metrics
    get_api_health
    get_database_metrics
    get_monitoring_metrics
    get_application_metrics
    get_performance_alerts
    get_recent_logs
    get_quick_actions
    
    echo -e "${GREEN}✅ Dashboard refresh complete!${NC}"
    echo -e "${CYAN}Press Ctrl+C to exit or wait 30 seconds for auto-refresh...${NC}"
}

# Auto-refresh function
auto_refresh() {
    while true; do
        show_dashboard
        sleep 30
    done
}

# Main execution
if [ "$1" = "--auto-refresh" ]; then
    echo -e "${BLUE}🔄 Starting auto-refresh mode (30s intervals)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    auto_refresh
else
    show_dashboard
fi
