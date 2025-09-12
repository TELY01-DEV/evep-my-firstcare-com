#!/bin/bash

# EVEP Server Data Backup Script
# This script backs up data from the production server to local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="103.22.182.146"
SERVER_PORT="2222"
SERVER_USER="root"
SSH_KEY="~/.ssh/id_ed25519"
REMOTE_PATH="/www/dk_project/evep-my-firstcare-com"
LOCAL_BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists ssh; then
    print_error "SSH is not installed. Please install SSH client."
    exit 1
fi

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

print_success "Prerequisites check passed"

# Create backup directory
print_status "Creating backup directory..."
mkdir -p "$LOCAL_BACKUP_DIR"
print_success "Backup directory created: $LOCAL_BACKUP_DIR"

# Test SSH connection
print_status "Testing SSH connection to server..."
if ! ssh -i "$SSH_KEY" -p "$SERVER_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    print_error "SSH connection failed. Please check your SSH key and server configuration."
    exit 1
fi
print_success "SSH connection established"

# Backup MongoDB data
print_status "Backing up MongoDB data..."
BACKUP_FILE="evep_mongodb_backup_$DATE.gz"

ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << 'EOF'
    cd /www/dk_project/evep-my-firstcare-com
    
    # Create MongoDB backup
    docker exec evep-mongo-primary mongodump --gzip --archive=/tmp/mongodb_backup.gz --db=evep_db
    
    # Copy backup to host
    docker cp evep-mongo-primary:/tmp/mongodb_backup.gz /tmp/mongodb_backup.gz
    
    echo "MongoDB backup created successfully"
EOF

# Download MongoDB backup
print_status "Downloading MongoDB backup..."
scp -i "$SSH_KEY" -P "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST:/tmp/mongodb_backup.gz" "$LOCAL_BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "MongoDB backup downloaded: $LOCAL_BACKUP_DIR/$BACKUP_FILE"
else
    print_error "Failed to download MongoDB backup"
    exit 1
fi

# Backup Redis data (if needed)
print_status "Backing up Redis data..."
REDIS_BACKUP_FILE="evep_redis_backup_$DATE.rdb"

ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << 'EOF'
    cd /www/dk_project/evep-my-firstcare-com
    
    # Create Redis backup
    docker exec evep-redis-master-1 redis-cli BGSAVE
    
    # Wait for backup to complete
    sleep 5
    
    # Copy backup to host
    docker cp evep-redis-master-1:/data/dump.rdb /tmp/redis_backup.rdb
    
    echo "Redis backup created successfully"
EOF

# Download Redis backup
scp -i "$SSH_KEY" -P "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST:/tmp/redis_backup.rdb" "$LOCAL_BACKUP_DIR/$REDIS_BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "Redis backup downloaded: $LOCAL_BACKUP_DIR/$REDIS_BACKUP_FILE"
else
    print_warning "Failed to download Redis backup (this is optional)"
fi

# Backup environment configuration
print_status "Backing up environment configuration..."
ENV_BACKUP_FILE="evep_env_backup_$DATE.env"

ssh -i "$SSH_KEY" -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << 'EOF'
    cd /www/dk_project/evep-my-firstcare-com
    
    # Copy .env file if it exists
    if [ -f .env ]; then
        cp .env /tmp/evep_env_backup.env
        echo "Environment file backed up"
    else
        echo "No .env file found"
    fi
EOF

# Download environment backup
scp -i "$SSH_KEY" -P "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST:/tmp/evep_env_backup.env" "$LOCAL_BACKUP_DIR/$ENV_BACKUP_FILE" 2>/dev/null || print_warning "No environment file to backup"

# Create restore script
print_status "Creating restore script..."
cat > "$LOCAL_BACKUP_DIR/restore_local.sh" << 'EOF'
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
EOF

chmod +x "$LOCAL_BACKUP_DIR/restore_local.sh"

# Create summary
print_status "Creating backup summary..."
cat > "$LOCAL_BACKUP_DIR/backup_summary.txt" << EOF
EVEP Server Data Backup Summary
Generated: $(date)
Backup Directory: $LOCAL_BACKUP_DIR

Files Created:
- $BACKUP_FILE (MongoDB backup)
- $REDIS_BACKUP_FILE (Redis backup)
- $ENV_BACKUP_FILE (Environment backup)
- restore_local.sh (Restore script)

To restore data to local environment:
1. Navigate to the backup directory: cd $LOCAL_BACKUP_DIR
2. Run the restore script: ./restore_local.sh
3. Start local development: docker-compose up -d

Server Information:
- Host: $SERVER_HOST
- Port: $SERVER_PORT
- User: $SERVER_USER
- Remote Path: $REMOTE_PATH
EOF

print_success "Backup completed successfully!"
print_status "Backup files saved to: $LOCAL_BACKUP_DIR"
print_status "To restore data locally, run: cd $LOCAL_BACKUP_DIR && ./restore_local.sh"

echo ""
echo "📋 Backup Summary:"
echo "=================="
echo "MongoDB Backup: $BACKUP_FILE"
echo "Redis Backup: $REDIS_BACKUP_FILE"
echo "Environment Backup: $ENV_BACKUP_FILE"
echo "Restore Script: restore_local.sh"
echo ""
echo "🚀 Next Steps:"
echo "1. cd $LOCAL_BACKUP_DIR"
echo "2. ./restore_local.sh"
echo "3. cd ../.."
echo "4. docker-compose up -d"
echo ""
