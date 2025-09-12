#!/bin/bash

# Server Transfer Script
# Usage: ./transfer_to_server.sh YOUR_SERVER_IP

if [ -z "$1" ]; then
    echo "❌ Please provide your server IP address"
    echo "Usage: ./transfer_to_server.sh YOUR_SERVER_IP"
    echo "Example: ./transfer_to_server.sh 192.168.1.100"
    exit 1
fi

SERVER_IP=$1
echo "🚀 Transferring files to server: $SERVER_IP"

# Transfer App.tsx
echo "📁 Transferring App.tsx..."
scp server_fix_package/App.tsx root@$SERVER_IP:/www/dk_project/evep-my-firstcare-com/frontend/src/App.tsx

if [ $? -eq 0 ]; then
    echo "✅ App.tsx transferred successfully"
else
    echo "❌ Failed to transfer App.tsx"
    exit 1
fi

# Transfer fix script
echo "📁 Transferring fix script..."
scp server_fix_package/fix_server_build.sh root@$SERVER_IP:/www/dk_project/evep-my-firstcare-com/

if [ $? -eq 0 ]; then
    echo "✅ Fix script transferred successfully"
else
    echo "❌ Failed to transfer fix script"
    exit 1
fi

echo "🎉 All files transferred successfully!"
echo ""
echo "📋 Next steps:"
echo "1. SSH into your server: ssh root@$SERVER_IP"
echo "2. Navigate to project: cd /www/dk_project/evep-my-firstcare-com"
echo "3. Run the fix script: ./fix_server_build.sh"
echo "4. Check logs: docker-compose logs frontend"
