// Delete any existing admin users
db.admin_users.deleteMany({email: "admin@evep.com"});
db.users.deleteMany({email: "admin@evep.com"});

// Create admin user with hashed password (admin123)
db.admin_users.insertOne({
  email: "admin@evep.com",
  name: "Admin User",
  role: "admin",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO",
  is_active: true,
  profile: {},
  permissions: [],
  created_at: new Date(),
  updated_at: new Date()
});

print("Admin user created successfully!");
