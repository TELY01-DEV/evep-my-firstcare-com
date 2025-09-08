// MongoDB Authentication Initialization Script
// This script creates the admin user and enables authentication

print('🔧 MongoDB Authentication Initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

try {
    // Create admin user with full privileges
    db.createUser({
        user: 'admin',
        pwd: 'Sim!44335599',
        roles: [
            'root',
            'readWriteAnyDatabase',
            'dbAdminAnyDatabase', 
            'userAdminAnyDatabase',
            'clusterAdmin',
            'clusterManager',
            'clusterMonitor'
        ]
    });
    print('✅ Admin user created successfully');
} catch (e) {
    if (e.code === 11000) {
        print('✅ Admin user already exists');
    } else {
        print('❌ Error creating admin user: ' + e.message);
    }
}

// Switch to evep database and create RBAC user
db = db.getSiblingDB('evep');

try {
    // Create RBAC-specific user
    db.createUser({
        user: 'rbac_admin',
        pwd: 'Sim!44335599',
        roles: [
            { role: 'readWrite', db: 'evep' },
            { role: 'dbAdmin', db: 'evep' }
        ]
    });
    print('✅ RBAC admin user created');
} catch (e) {
    if (e.code === 11000) {
        print('✅ RBAC admin user already exists');
    } else {
        print('❌ Error creating RBAC user: ' + e.message);
    }
}

// Create RBAC collections with sample data
print('🔧 Creating RBAC collections...');

// Create rbac_permissions collection
db.rbac_permissions.insertOne({
    _id: 'auth_test_permission',
    id: 'auth_test_permission',
    name: 'Authentication Test Permission',
    description: 'Test permission to verify authenticated access',
    category: 'test',
    resource: 'auth_test',
    action: 'test'
});
print('✅ rbac_permissions collection created');

// Create rbac_roles collection  
db.rbac_roles.insertOne({
    _id: 'auth_test_role',
    id: 'auth_test_role',
    name: 'Authentication Test Role',
    description: 'Test role to verify authenticated access',
    permissions: ['auth_test_permission'],
    is_system: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
});
print('✅ rbac_roles collection created');

// Create rbac_user_roles collection
db.rbac_user_roles.insertOne({
    _id: 'auth_test_user_auth_test_role',
    user_id: 'auth_test_user',
    user_name: 'Authentication Test User',
    user_email: 'auth_test@example.com',
    role_id: 'auth_test_role',
    role_name: 'Authentication Test Role',
    assigned_at: new Date().toISOString()
});
print('✅ rbac_user_roles collection created');

print('🎉 MongoDB authentication and RBAC collections initialized successfully!');
