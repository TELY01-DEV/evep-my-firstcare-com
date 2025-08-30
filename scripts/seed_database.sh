#!/bin/bash

# Database Seeding Script for EVEP System
# This script populates the database with Thai mock data

echo "🌱 Starting EVEP Database Seeding..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Error: Backend container is not running. Please start the services first:"
    echo "   docker-compose up -d"
    exit 1
fi

echo "📦 Running database seeding script..."

# Run the seeding script inside the backend container
docker-compose exec backend python scripts/seed_mock_data.py

if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "📊 Seeded data includes:"
    echo "   - 5 Thai patients with realistic information"
    echo "   - 3 International schools in Bangkok"
    echo "   - 3 Teachers/medical staff"
    echo "   - 5 Glasses inventory items"
    echo "   - 2 Sample screening sessions"
    echo ""
    echo "🎉 You can now use the application with Thai mock data!"
else
    echo "❌ Database seeding failed!"
    exit 1
fi
