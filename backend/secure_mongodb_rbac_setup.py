#!/usr/bin/env python3
"""
Secure MongoDB RBAC Setup Script
Creates RBAC collections with comprehensive master data using authenticated connection
"""

import sys
import os
import asyncio
from datetime import datetime

# Add app path
sys.path.append('/app')

from app.core.database import get_database
from app.utils.comprehensivePermissions import COMPREHENSIVE_PERMISSIONS

async def setup_secure_mongodb_rbac():
    """Setup RBAC collections in secured MongoDB"""
    print("🔒 Setting up RBAC in Secured MongoDB...")
    print("=" * 50)
    
    try:
        # Get authenticated database connection
        db = get_database()
        
        # Test authentication
        print("\n1. 🔐 Testing MongoDB Authentication...")
        try:
            ping_result = await db.admin.command("ping")
            if ping_result.get("ok") == 1:
                print("   ✅ Authenticated connection successful")
            else:
                print("   ❌ Authentication failed")
                return False
        except Exception as e:
            print(f"   ❌ Connection error: {e}")
            return False
        
        # 2. Create and populate permissions collection
        print("\n2. 📋 Creating RBAC Permissions Collection...")
        permissions_collection = db.rbac_permissions
        
        # Clear existing permissions
        await permissions_collection.delete_many({})
        
        # Insert comprehensive permissions
        permissions_data = []
        for perm in COMPREHENSIVE_PERMISSIONS:
            perm_doc = perm.copy()
            perm_doc['_id'] = perm['id']  # Use permission ID as MongoDB _id
            permissions_data.append(perm_doc)
        
        if permissions_data:
            result = await permissions_collection.insert_many(permissions_data)
            print(f"   ✅ Inserted {len(result.inserted_ids)} permissions")
            
            # Show categories
            pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            categories = await permissions_collection.aggregate(pipeline).to_list(length=None)
            
            print("   📂 Permission Categories:")
            for cat in categories:
                print(f"     • {cat['_id']}: {cat['count']} permissions")
        
        # 3. Create and populate roles collection
        print("\n3. 🎭 Creating RBAC Roles Collection...")
        roles_collection = db.rbac_roles
        
        # Clear existing roles
        await roles_collection.delete_many({})
        
        # Create comprehensive roles with proper permissions
        now = datetime.now().isoformat()
        comprehensive_roles = [
            {
                "_id": "super_admin",
                "id": "super_admin",
                "name": "Super Administrator",
                "description": "Ultimate system access with full control over all operations",
                "permissions": ["*"],  # All permissions
                "is_system": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "admin",
                "id": "admin",
                "name": "Administrator", 
                "description": "Administrative access to system management",
                "permissions": [
                    "dashboard_view", "analytics_view",
                    "menu_user_management", "menu_medical_staff", "menu_panel_settings",
                    "users_view", "users_create", "users_edit", "users_delete",
                    "patients_view", "screenings_view"
                ],
                "is_system": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "medical_admin",
                "id": "medical_admin", 
                "name": "Medical Administrator",
                "description": "Medical staff with administrative privileges",
                "permissions": [
                    "dashboard_view", "analytics_view",
                    "menu_medical_screening", "menu_medical_staff",
                    "patients_view", "patients_create", "patients_edit",
                    "screenings_view", "screenings_create", "screenings_manage",
                    "screening_form_enhanced", "screening_form_va", "screening_form_diagnosis"
                ],
                "is_system": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "doctor",
                "id": "doctor",
                "name": "Doctor",
                "description": "Medical doctor with full patient and diagnostic access",
                "permissions": [
                    "dashboard_view",
                    "menu_medical_screening",
                    "patients_view", "patients_create", "patients_edit",
                    "screenings_view", "screenings_create", "screenings_manage",
                    "screening_form_standard", "screening_form_enhanced", "screening_form_va", "screening_form_diagnosis"
                ],
                "is_system": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "nurse",
                "id": "nurse",
                "name": "Nurse",
                "description": "Nursing staff with patient care access",
                "permissions": [
                    "dashboard_view",
                    "menu_medical_screening",
                    "patients_view", "patients_create",
                    "screenings_view", "screenings_create",
                    "screening_form_standard", "screening_form_mobile"
                ],
                "is_system": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "teacher",
                "id": "teacher",
                "name": "Teacher",
                "description": "School teacher with basic screening access",
                "permissions": [
                    "dashboard_view",
                    "menu_school_management",
                    "submenu_students",
                    "patients_view",
                    "screenings_view",
                    "screening_form_mobile"
                ],
                "is_system": True,
                "created_at": now,
                "updated_at": now
            }
        ]
        
        result = await roles_collection.insert_many(comprehensive_roles)
        print(f"   ✅ Inserted {len(result.inserted_ids)} roles")
        
        # 4. Create user roles collection and migrate existing data
        print("\n4. 👥 Creating User Roles Collection...")
        user_roles_collection = db.rbac_user_roles
        
        # Clear existing user roles
        await user_roles_collection.delete_many({})
        
        # Migrate from file if exists
        user_roles_file = "./rbac_data/rbac_user_roles.json"
        if os.path.exists(user_roles_file):
            import json
            with open(user_roles_file, 'r') as f:
                user_roles_data = json.load(f)
            
            user_roles = user_roles_data.get('user_roles', [])
            if user_roles:
                for user_role in user_roles:
                    user_role['_id'] = f"{user_role['user_id']}_{user_role['role_id']}"
                
                result = await user_roles_collection.insert_many(user_roles)
                print(f"   ✅ Migrated {len(result.inserted_ids)} user role assignments")
            else:
                print("   ⚠️  No user roles to migrate")
        else:
            print("   ⚠️  No user roles file found")
        
        # 5. Create indexes for performance and security
        print("\n5. 🔧 Creating Database Indexes...")
        
        # Permissions indexes
        await permissions_collection.create_index("category")
        await permissions_collection.create_index("resource")
        print("   ✅ Permissions indexes created")
        
        # Roles indexes
        await roles_collection.create_index("name", unique=True)
        await roles_collection.create_index("is_system")
        print("   ✅ Roles indexes created")
        
        # User roles indexes
        await user_roles_collection.create_index([("user_id", 1), ("role_id", 1)], unique=True)
        await user_roles_collection.create_index("user_id")
        await user_roles_collection.create_index("role_id")
        print("   ✅ User roles indexes created")
        
        # 6. Final verification
        print("\n6. ✅ Final Verification...")
        permissions_count = await permissions_collection.count_documents({})
        roles_count = await roles_collection.count_documents({})
        user_roles_count = await user_roles_collection.count_documents({})
        
        print(f"   📊 RBAC Collections Created:")
        print(f"     • rbac_permissions: {permissions_count} documents")
        print(f"     • rbac_roles: {roles_count} documents") 
        print(f"     • rbac_user_roles: {user_roles_count} documents")
        
        # Show permission categories
        if permissions_count > 0:
            pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            categories = await permissions_collection.aggregate(pipeline).to_list(length=None)
            
            print(f"\n   📂 Permission Categories in Secured MongoDB:")
            for cat in categories:
                print(f"     • {cat['_id']}: {cat['count']} permissions")
        
        print(f"\n🎉 RBAC Master Data successfully created in Secured MongoDB!")
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(setup_secure_mongodb_rbac())
    if result:
        print("\n✅ Secured MongoDB RBAC setup completed!")
    else:
        print("\n❌ Setup failed - check errors above")
