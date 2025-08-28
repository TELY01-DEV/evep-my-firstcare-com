#!/bin/bash

# EVEP Local Data Restore Script
# This script restores data from backup to local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if Docker containers are running
print_status "Checking if local containers are running..."

if ! docker-compose ps | grep -q "Up"; then
    print_status "Starting local containers..."
    docker-compose up -d
    sleep 10
fi

# Find the latest backup files
MONGODB_BACKUP=$(ls -t evep_mongodb_backup_*.gz 2>/dev/null | head -1)
REDIS_BACKUP=$(ls -t evep_redis_backup_*.rdb 2>/dev/null | head -1)
ENV_BACKUP=$(ls -t evep_env_backup_*.env 2>/dev/null | head -1)

if [ -z "$MONGODB_BACKUP" ]; then
    print_error "No MongoDB backup found"
    exit 1
fi

# Restore MongoDB data
print_status "Restoring MongoDB data from $MONGODB_BACKUP..."

# Copy backup to container
docker cp "$MONGODB_BACKUP" evep-mongo-primary:/tmp/mongodb_backup.gz

# Restore data
docker exec evep-mongo-primary mongorestore --gzip --archive=/tmp/mongodb_backup.gz --drop

print_success "MongoDB data restored successfully"

# Restore Redis data (if available)
if [ -n "$REDIS_BACKUP" ]; then
    print_status "Restoring Redis data from $REDIS_BACKUP..."
    
    # Stop Redis to ensure clean restore
    docker-compose stop redis-master-1
    
    # Copy backup to container
    docker cp "$REDIS_BACKUP" evep-redis-master-1:/data/dump.rdb
    
    # Start Redis
    docker-compose start redis-master-1
    
    print_success "Redis data restored successfully"
else
    print_warning "No Redis backup found, skipping Redis restore"
fi

# Restore environment configuration (if available)
if [ -n "$ENV_BACKUP" ]; then
    print_status "Restoring environment configuration from $ENV_BACKUP..."
    cp "$ENV_BACKUP" ../../.env
    print_success "Environment configuration restored"
else
    print_warning "No environment backup found, using default configuration"
fi

print_success "Data restore completed successfully!"
print_status "You can now start your local development environment with: docker-compose up -d"
