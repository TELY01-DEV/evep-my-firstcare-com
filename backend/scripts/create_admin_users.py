#!/usr/bin/env python3
"""
Create separate admin users for Medical Portal and Admin Panel
"""

import sys
import os
import asyncio
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_admin_users_collection
from app.core.security import hash_password

async def create_admin_users():
    """Create separate admin users for different panels"""
    admin_users_collection = get_admin_users_collection()
    
    # Medical Portal Admin (Limited Access)
    medical_admin = {
        "email": "medical@evep.com",
        "password_hash": hash_password("medical123"),
        "first_name": "Medical",
        "last_name": "Admin",
        "role": "medical_admin",
        "permissions": [
            "view_patients",
            "manage_screenings", 
            "view_reports",
            "manage_glasses_inventory",
            "view_medical_staff",
            "access_medical_portal"
        ],
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
        "login_attempts": 0,
        "locked_until": None,
        "portal_access": "medical"
    }
    
    # Admin Panel Admin (Full System Access)
    system_admin = {
        "email": "admin@evep.com",
        "password_hash": hash_password("admin123"),
        "first_name": "System",
        "last_name": "Admin",
        "role": "system_admin",
        "permissions": [
            "full_access",
            "manage_users",
            "manage_system_settings",
            "view_all_data",
            "manage_security",
            "access_admin_panel",
            "access_medical_portal"
        ],
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
        "login_attempts": 0,
        "locked_until": None,
        "portal_access": "both"
    }
    
    # Check and create Medical Portal Admin
    existing_medical = await admin_users_collection.find_one({"email": "medical@evep.com"})
    if existing_medical:
        print("✅ Medical Portal Admin already exists")
    else:
        result = await admin_users_collection.insert_one(medical_admin)
        print(f"✅ Medical Portal Admin created with ID: {result.inserted_id}")
        print("📧 Email: medical@evep.com")
        print("🔑 Password: medical123")
        print("🎯 Role: Medical Portal Admin (Limited Access)")
    
    # Check and create System Admin
    existing_system = await admin_users_collection.find_one({"email": "admin@evep.com"})
    if existing_system:
        print("✅ System Admin already exists")
    else:
        result = await admin_users_collection.insert_one(system_admin)
        print(f"✅ System Admin created with ID: {result.inserted_id}")
        print("📧 Email: admin@evep.com")
        print("🔑 Password: admin123")
        print("🎯 Role: System Admin (Full Access)")
    
    print("\n📋 Access Summary:")
    print("🏥 Medical Portal Admin (medical@evep.com):")
    print("   - Access to Medical Portal only")
    print("   - Patient management, screenings, reports")
    print("   - Glasses inventory and medical staff")
    print("   - Cannot access Admin Panel features")
    
    print("\n⚙️ System Admin (admin@evep.com):")
    print("   - Access to both Medical Portal and Admin Panel")
    print("   - Full system administration")
    print("   - User management and system settings")
    print("   - Security and audit features")

if __name__ == "__main__":
    asyncio.run(create_admin_users())
