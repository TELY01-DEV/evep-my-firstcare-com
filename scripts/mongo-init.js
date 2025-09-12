// MongoDB Replica Set Initialization Script for EVEP Platform

// Wait for MongoDB to be ready
print("Starting MongoDB replica set initialization...");

// Initialize the replica set
rs.initiate({
    _id: "rs0",
    members: [
        {
            _id: 0,
            host: "mongo-primary:27017",
            priority: 2
        },
        {
            _id: 1,
            host: "mongo-secondary-1:27017",
            priority: 1
        },
        {
            _id: 2,
            host: "mongo-secondary-2:27017",
            priority: 1
        },
        {
            _id: 3,
            host: "mongo-arbiter:27017",
            arbiterOnly: true
        }
    ]
});

// Wait for replica set to be ready
while (rs.status().ok !== 1) {
    print("Waiting for replica set to be ready...");
    sleep(1000);
}

print("Replica set initialized successfully!");

// Create EVEP database and collections
db = db.getSiblingDB('evep');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('patients');
db.createCollection('screenings');
db.createCollection('ai_insights');
db.createCollection('analytics_data');
db.createCollection('audit_logs');
db.createCollection('vector_embeddings');
db.createCollection('prompt_templates');
db.createCollection('conversation_history');
db.createCollection('files');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "created_at": -1 });

db.patients.createIndex({ "patient_id": 1 }, { unique: true });
db.patients.createIndex({ "parent_id": 1 });
db.patients.createIndex({ "school_id": 1 });
db.patients.createIndex({ "created_at": -1 });

db.screenings.createIndex({ "screening_id": 1 }, { unique: true });
db.screenings.createIndex({ "patient_id": 1 });
db.screenings.createIndex({ "doctor_id": 1 });
db.screenings.createIndex({ "status": 1 });
db.screenings.createIndex({ "created_at": -1 });

db.ai_insights.createIndex({ "screening_id": 1 });
db.ai_insights.createIndex({ "user_id": 1 });
db.ai_insights.createIndex({ "created_at": -1 });

db.analytics_data.createIndex({ "date": 1 });
db.analytics_data.createIndex({ "type": 1 });

db.audit_logs.createIndex({ "user_id": 1 });
db.audit_logs.createIndex({ "action": 1 });
db.audit_logs.createIndex({ "timestamp": -1 });

db.files.createIndex({ "file_id": 1 }, { unique: true });
db.files.createIndex({ "uploaded_by": 1 });
db.files.createIndex({ "upload_date": -1 });

print("Database and collections created successfully!");

// Create admin user for the application
db.createUser({
    user: process.env.MONGO_ROOT_USERNAME || "admin",
    pwd: process.env.MONGO_ROOT_PASSWORD || "password",
    roles: [
        {
            role: "readWrite",
            db: "evep"
        },
        {
            role: "dbAdmin",
            db: "evep"
        }
    ]
});

print("Admin user created successfully!");

print("MongoDB initialization completed!");
