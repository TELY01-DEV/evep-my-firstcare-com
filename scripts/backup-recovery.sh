#!/bin/bash

# EVEP Platform Backup and Recovery Script
# This script provides comprehensive backup and recovery functionality

set -e

echo "💾 EVEP Platform Backup and Recovery"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="evep_backup_$TIMESTAMP"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  backup              Create a full backup of the platform"
    echo "  restore <backup>    Restore from a specific backup"
    echo "  list                List available backups"
    echo "  cleanup             Clean up old backups (keep last 7 days)"
    echo "  health              Check backup health"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore evep_backup_20231201_143022"
    echo "  $0 list"
    echo "  $0 cleanup"
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}📦 Creating EVEP Platform Backup...${NC}"
    echo "----------------------------------------"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    echo "   Creating backup: $BACKUP_NAME"
    echo "   Backup location: $BACKUP_DIR/$BACKUP_NAME"
    echo ""
    
    # 1. Backup MongoDB data
    echo -e "${BLUE}🗄️  Backing up MongoDB data...${NC}"
    docker exec evep-mongo-primary mongodump --out /tmp/mongodb_backup
    docker cp evep-mongo-primary:/tmp/mongodb_backup "$BACKUP_DIR/$BACKUP_NAME/mongodb"
    echo "   ✅ MongoDB backup completed"
    
    # 2. Backup Redis data
    echo -e "${BLUE}🔴 Backing up Redis data...${NC}"
    docker exec evep-redis-master-1 redis-cli BGSAVE
    sleep 5
    docker cp evep-redis-master-1:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"
    echo "   ✅ Redis backup completed"
    
    # 3. Backup configuration files
    echo -e "${BLUE}⚙️  Backing up configuration files...${NC}"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/config"
    
    # Backup environment files
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    if [ -f ".env.production" ]; then
        cp .env.production "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup docker-compose files
    cp docker-compose.yml "$BACKUP_DIR/$BACKUP_NAME/config/"
    
    # Backup scripts
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/scripts"
    cp -r scripts/ "$BACKUP_DIR/$BACKUP_NAME/scripts/"
    
    # Backup documentation
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/docs"
    cp -r documents/ "$BACKUP_DIR/$BACKUP_NAME/docs/"
    
    echo "   ✅ Configuration backup completed"
    
    # 4. Backup application data
    echo -e "${BLUE}📱 Backing up application data...${NC}"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/app_data"
    
    # Backup uploads if they exist
    if [ -d "uploads" ]; then
        cp -r uploads/ "$BACKUP_DIR/$BACKUP_NAME/app_data/"
    fi
    
    # Backup logs
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/logs"
    docker logs evep-backend > "$BACKUP_DIR/$BACKUP_NAME/logs/backend.log" 2>&1 || true
    docker logs evep-frontend > "$BACKUP_DIR/$BACKUP_NAME/logs/frontend.log" 2>&1 || true
    docker logs evep-admin-panel > "$BACKUP_DIR/$BACKUP_NAME/logs/admin-panel.log" 2>&1 || true
    
    echo "   ✅ Application data backup completed"
    
    # 5. Create backup manifest
    echo -e "${BLUE}📋 Creating backup manifest...${NC}"
    cat > "$BACKUP_DIR/$BACKUP_NAME/manifest.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "platform_version": "1.0.0",
    "components": {
        "mongodb": true,
        "redis": true,
        "config": true,
        "scripts": true,
        "docs": true,
        "app_data": true,
        "logs": true
    },
    "backup_size": "$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)",
    "checksum": "$(find "$BACKUP_DIR/$BACKUP_NAME" -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1)"
}
EOF
    
    echo "   ✅ Backup manifest created"
    
    # 6. Compress backup
    echo -e "${BLUE}🗜️  Compressing backup...${NC}"
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    cd - > /dev/null
    
    echo "   ✅ Backup compressed: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    
    # 7. Verify backup
    echo -e "${BLUE}🔍 Verifying backup...${NC}"
    if tar -tzf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" > /dev/null 2>&1; then
        echo "   ✅ Backup verification successful"
    else
        echo -e "   ${RED}❌ Backup verification failed${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo "   Backup file: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    echo "   Size: $(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
    echo ""
}

# Function to list backups
list_backups() {
    echo -e "${BLUE}📋 Available Backups${NC}"
    echo "----------------------"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "   No backups found"
        return
    fi
    
    echo "   Backups in $BACKUP_DIR:"
    echo ""
    
    for backup in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup" ]; then
            filename=$(basename "$backup")
            size=$(du -h "$backup" | cut -f1)
            date=$(stat -f "%Sm" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null)
            echo "   📦 $filename"
            echo "      Size: $size"
            echo "      Date: $date"
            echo ""
        fi
    done
}

# Function to restore backup
restore_backup() {
    local backup_name=$1
    
    if [ -z "$backup_name" ]; then
        echo -e "${RED}❌ Backup name is required${NC}"
        echo "Usage: $0 restore <backup_name>"
        exit 1
    fi
    
    local backup_file="$BACKUP_DIR/${backup_name}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Restoring EVEP Platform from backup...${NC}"
    echo "---------------------------------------------"
    echo "   Backup: $backup_name"
    echo "   File: $backup_file"
    echo ""
    
    # Confirm restoration
    read -p "⚠️  This will overwrite current data. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Restoration cancelled"
        exit 0
    fi
    
    # Stop services
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    docker-compose down
    
    # Extract backup
    echo -e "${BLUE}📦 Extracting backup...${NC}"
    cd "$BACKUP_DIR"
    tar -xzf "${backup_name}.tar.gz"
    cd - > /dev/null
    
    local extracted_dir="$BACKUP_DIR/$backup_name"
    
    # Restore MongoDB
    echo -e "${BLUE}🗄️  Restoring MongoDB data...${NC}"
    docker-compose up -d mongo-primary mongo-secondary-1 mongo-secondary-2
    sleep 10
    docker cp "$extracted_dir/mongodb" evep-mongo-primary:/tmp/
    docker exec evep-mongo-primary mongorestore --drop /tmp/mongodb
    echo "   ✅ MongoDB restored"
    
    # Restore Redis
    echo -e "${BLUE}🔴 Restoring Redis data...${NC}"
    docker-compose up -d redis-master-1 redis-master-2 redis-master-3
    sleep 5
    docker cp "$extracted_dir/redis_dump.rdb" evep-redis-master-1:/data/
    docker exec evep-redis-master-1 redis-cli BGREWRITEAOF
    echo "   ✅ Redis restored"
    
    # Restore configuration
    echo -e "${BLUE}⚙️  Restoring configuration...${NC}"
    if [ -f "$extracted_dir/config/.env" ]; then
        cp "$extracted_dir/config/.env" ./
    fi
    if [ -f "$extracted_dir/config/.env.production" ]; then
        cp "$extracted_dir/config/.env.production" ./
    fi
    echo "   ✅ Configuration restored"
    
    # Restore application data
    echo -e "${BLUE}📱 Restoring application data...${NC}"
    if [ -d "$extracted_dir/app_data/uploads" ]; then
        mkdir -p uploads
        cp -r "$extracted_dir/app_data/uploads/"* uploads/ 2>/dev/null || true
    fi
    echo "   ✅ Application data restored"
    
    # Start services
    echo -e "${BLUE}🚀 Starting services...${NC}"
    docker-compose up -d
    
    # Wait for services to be ready
    echo "   Waiting for services to be ready..."
    sleep 30
    
    # Verify restoration
    echo -e "${BLUE}🔍 Verifying restoration...${NC}"
    if curl -f http://localhost:8013/health > /dev/null 2>&1; then
        echo "   ✅ Backend API is healthy"
    else
        echo -e "   ${RED}❌ Backend API health check failed${NC}"
    fi
    
    if curl -f http://localhost:3013 > /dev/null 2>&1; then
        echo "   ✅ Frontend is healthy"
    else
        echo -e "   ${RED}❌ Frontend health check failed${NC}"
    fi
    
    if curl -f http://localhost:3015 > /dev/null 2>&1; then
        echo "   ✅ Admin Panel is healthy"
    else
        echo -e "   ${RED}❌ Admin Panel health check failed${NC}"
    fi
    
    # Cleanup
    rm -rf "$extracted_dir"
    
    echo ""
    echo -e "${GREEN}🎉 Restoration completed successfully!${NC}"
    echo ""
}

# Function to cleanup old backups
cleanup_backups() {
    echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
    echo "--------------------------------"
    
    # Keep backups from last 7 days
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    echo "   ✅ Old backups cleaned up (kept last 7 days)"
    echo ""
}

# Function to check backup health
check_backup_health() {
    echo -e "${BLUE}🏥 Checking backup health...${NC}"
    echo "----------------------------"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "   No backup directory found"
        return
    fi
    
    local total_backups=0
    local healthy_backups=0
    
    for backup in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup" ]; then
            total_backups=$((total_backups + 1))
            
            echo -n "   Checking $(basename "$backup")... "
            
            if tar -tzf "$backup" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Healthy${NC}"
                healthy_backups=$((healthy_backups + 1))
            else
                echo -e "${RED}❌ Corrupted${NC}"
            fi
        fi
    done
    
    echo ""
    echo "   Summary:"
    echo "   Total backups: $total_backups"
    echo "   Healthy backups: $healthy_backups"
    echo "   Corrupted backups: $((total_backups - healthy_backups))"
    
    if [ $total_backups -eq 0 ]; then
        echo -e "   ${YELLOW}⚠️  No backups found${NC}"
    elif [ $healthy_backups -eq $total_backups ]; then
        echo -e "   ${GREEN}✅ All backups are healthy${NC}"
    else
        echo -e "   ${RED}❌ Some backups are corrupted${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    case "${1:-}" in
        "backup")
            create_backup
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups
            ;;
        "health")
            check_backup_health
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
