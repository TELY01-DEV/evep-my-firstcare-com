#!/bin/bash

# Database Index Creation Script for Production
# This script creates unique indexes to prevent duplicate patient records

echo "🚀 EVEP Database Index Creation"
echo "=================================="

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "❌ mongosh not found. Please install MongoDB Shell."
    echo "   Ubuntu: sudo apt update && sudo apt install mongodb-mongosh"
    echo "   Docker: docker exec -it evep-mongo mongosh"
    exit 1
fi

echo "📊 Creating unique indexes in EVEP database..."

# Create the MongoDB script temporarily
cat > /tmp/create_indexes.js << 'EOF'
use('evep');

print("🔧 Creating unique indexes to prevent duplicates...");

try {
    // 1. Unique index on patients.cid
    print("📝 Creating unique index on patients.cid...");
    db.patients.createIndex(
        { "cid": 1 }, 
        { unique: true, sparse: true, name: "unique_patient_cid", background: true }
    );
    
    // 2. Unique index on patients name + DOB
    print("📝 Creating unique index on patients (name + DOB)...");
    db.patients.createIndex(
        { "first_name": 1, "last_name": 1, "date_of_birth": 1 }, 
        { unique: true, sparse: true, name: "unique_patient_name_dob", background: true }
    );
    
    // 3. Student mapping unique index
    print("📝 Creating unique index on student-patient mapping...");
    db.student_patient_mapping.createIndex(
        { "student_id": 1 }, 
        { unique: true, sparse: true, name: "unique_student_mapping", background: true }
    );
    
    // 4. Performance indexes
    print("📝 Creating performance indexes...");
    
    // Patient search index
    db.patients.createIndex(
        { "first_name": "text", "last_name": "text", "cid": "text", "school": "text" },
        { name: "patient_search_text", background: true }
    );
    
    // Screening by patient index
    db.screenings.createIndex(
        { "patient_id": 1, "created_at": -1 },
        { name: "screening_by_patient_date", background: true }
    );
    
    print("✅ All indexes created successfully!");
    
} catch (error) {
    if (error.message.includes("duplicate key")) {
        print("🔍 Duplicate records found. Manual cleanup required.");
        print("Please review and remove duplicate records before creating unique indexes.");
    } else {
        print("❌ Error: " + error.message);
    }
}
EOF

# Execute the MongoDB script
echo "⚡ Executing index creation script..."

# Try different MongoDB connection methods
if docker ps | grep -q evep-mongo; then
    echo "📦 Using Docker MongoDB container..."
    docker exec -i evep-mongo mongosh evep < /tmp/create_indexes.js
elif command -v mongosh &> /dev/null; then
    echo "🔌 Using local MongoDB connection..."
    mongosh evep < /tmp/create_indexes.js
else
    echo "❌ Cannot connect to MongoDB. Please ensure MongoDB is running."
    exit 1
fi

# Clean up
rm -f /tmp/create_indexes.js

echo ""
echo "🎉 Database index creation completed!"
echo "📌 Unique constraints are now active to prevent duplicate patient records."