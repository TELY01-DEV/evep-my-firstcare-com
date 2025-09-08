#!/usr/bin/env python3
"""
Migration script to transfer RBAC data from files to MongoDB
This ensures persistent storage and resolves data loss after rebuilds
"""

import sys
import os
sys.path.append('/app')

import json
import asyncio
from datetime import datetime
from app.core.database import get_database
from app.utils.comprehensivePermissions import COMPREHENSIVE_PERMISSIONS

async def migrate_rbac_to_mongodb():
    """Migrate RBAC data from files to MongoDB"""
    print("🔄 Starting RBAC data migration to MongoDB...")
    
    try:
        db = get_database()
        
        # 1. Migrate Roles
        print("\n1. 📂 Migrating Roles...")
        roles_file = "./rbac_data/rbac_roles.json"
        if os.path.exists(roles_file):
            with open(roles_file, 'r') as f:
                roles_data = json.load(f)
            
            roles_collection = db.rbac_roles
            await roles_collection.delete_many({})  # Clear existing
            
            roles = roles_data.get('roles', [])
            for role in roles:
                role['_id'] = role['id']  # Use role ID as MongoDB _id
                await roles_collection.insert_one(role)
            
            print(f"   ✅ Migrated {len(roles)} roles")
        else:
            print("   ⚠️  No roles file found, creating default roles...")
            await create_default_roles(db)
        
        # 2. Migrate Permissions (use comprehensive permissions)
        print("\n2. 📋 Migrating Permissions...")
        permissions_collection = db.rbac_permissions
        await permissions_collection.delete_many({})  # Clear existing
        
        # Use comprehensive permissions
        permissions_data = []
        for perm in COMPREHENSIVE_PERMISSIONS:
            perm_doc = perm.copy()
            perm_doc['_id'] = perm['id']  # Use permission ID as MongoDB _id
            permissions_data.append(perm_doc)
        
        if permissions_data:
            await permissions_collection.insert_many(permissions_data)
            print(f"   ✅ Migrated {len(permissions_data)} comprehensive permissions")
        
        # 3. Migrate User Roles
        print("\n3. 👥 Migrating User Roles...")
        user_roles_file = "./rbac_data/rbac_user_roles.json"
        if os.path.exists(user_roles_file):
            with open(user_roles_file, 'r') as f:
                user_roles_data = json.load(f)
            
            user_roles_collection = db.rbac_user_roles
            await user_roles_collection.delete_many({})  # Clear existing
            
            user_roles = user_roles_data.get('user_roles', [])
            for user_role in user_roles:
                # Create compound _id for user roles
                user_role['_id'] = f"{user_role['user_id']}_{user_role['role_id']}"
                await user_roles_collection.insert_one(user_role)
            
            print(f"   ✅ Migrated {len(user_roles)} user role assignments")
        else:
            print("   ⚠️  No user roles file found")
        
        # 4. Verify migration
        print("\n4. ✅ Verifying Migration...")
        roles_count = await db.rbac_roles.count_documents({})
        permissions_count = await db.rbac_permissions.count_documents({})
        user_roles_count = await db.rbac_user_roles.count_documents({})
        
        print(f"   📊 MongoDB RBAC Data:")
        print(f"     - Roles: {roles_count}")
        print(f"     - Permissions: {permissions_count}")
        print(f"     - User Roles: {user_roles_count}")
        
        # Show permission categories
        if permissions_count > 0:
            pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            categories = await db.rbac_permissions.aggregate(pipeline).to_list(length=None)
            
            print(f"   📂 Permission Categories:")
            for cat in categories:
                print(f"     - {cat['_id']}: {cat['count']}")
        
        print(f"\n🎉 RBAC Migration to MongoDB completed successfully!")
        print(f"   ✅ Data is now persistent across rebuilds")
        print(f"   ✅ Comprehensive permissions available")
        print(f"   ✅ User role assignments preserved")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def create_default_roles(db):
    """Create default system roles"""
    now = datetime.now().isoformat()
    default_roles = [
        {
            "_id": "super_admin",
            "id": "super_admin",
            "name": "Super Administrator",
            "description": "Ultimate system access with full control",
            "permissions": ["*"],
            "is_system": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "admin", 
            "id": "admin",
            "name": "Administrator",
            "description": "Administrative access to system",
            "permissions": ["users_view", "users_create", "users_edit", "patients_view", "screenings_view"],
            "is_system": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "doctor",
            "id": "doctor", 
            "name": "Doctor",
            "description": "Medical doctor with full patient access",
            "permissions": ["patients_view", "patients_create", "patients_edit", "screenings_view", "screenings_create", "screening_form_diagnosis"],
            "is_system": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "nurse",
            "id": "nurse",
            "name": "Nurse", 
            "description": "Nursing staff with patient care access",
            "permissions": ["patients_view", "patients_create", "screenings_view", "screenings_create", "screening_form_standard", "screening_form_mobile"],
            "is_system": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "teacher",
            "id": "teacher",
            "name": "Teacher",
            "description": "School teacher with basic screening access", 
            "permissions": ["patients_view", "screenings_view", "screening_form_mobile", "submenu_students"],
            "is_system": True,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    roles_collection = db.rbac_roles
    await roles_collection.delete_many({})
    await roles_collection.insert_many(default_roles)
    print(f"   ✅ Created {len(default_roles)} default roles")

if __name__ == "__main__":
    result = asyncio.run(migrate_rbac_to_mongodb())
    if result:
        print("\n🚀 Migration completed successfully!")
        print("   The RBAC system now uses persistent MongoDB storage.")
    else:
        print("\n❌ Migration failed!")
        print("   Please check the error messages above.")
