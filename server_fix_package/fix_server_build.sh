#!/bin/bash

# Server Build Fix Script
# This script fixes the Docker build error by removing problematic files and imports

echo "🔧 Starting server build fix..."

# Navigate to project directory
cd /www/dk_project/evep-my-firstcare-com

# 1. Remove problematic utility files if they exist
echo "🗑️  Removing problematic utility files..."
rm -f frontend/src/utils/objectRendererInterceptor.ts
rm -f frontend/src/utils/globalObjectRenderer.ts
rm -f frontend/src/utils/runtimeObjectInspector.ts

# 2. Fix App.tsx by removing any problematic imports
echo "🔧 Fixing App.tsx imports..."
sed -i '/objectRendererInterceptor\|globalObjectRenderer\|runtimeObjectInspector/d' frontend/src/App.tsx

# 3. Verify the fix
echo "✅ Verifying fix..."
if grep -q "objectRendererInterceptor\|globalObjectRenderer\|runtimeObjectInspector" frontend/src/App.tsx; then
    echo "❌ App.tsx still contains problematic imports"
    exit 1
else
    echo "✅ App.tsx is clean"
fi

# 4. Check if problematic files are gone
if [ -f "frontend/src/utils/objectRendererInterceptor.ts" ] || [ -f "frontend/src/utils/globalObjectRenderer.ts" ] || [ -f "frontend/src/utils/runtimeObjectInspector.ts" ]; then
    echo "❌ Problematic files still exist"
    exit 1
else
    echo "✅ Problematic files removed"
fi

# 5. Stop Docker services
echo "🛑 Stopping Docker services..."
docker-compose down

# 6. Clean Docker cache
echo "🧹 Cleaning Docker cache..."
docker system prune -a -f

# 7. Rebuild frontend
echo "🔨 Rebuilding frontend..."
docker-compose build --no-cache frontend

# 8. Start services
echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Server build fix completed!"
echo "📋 Check the build with: docker-compose logs frontend"
