#!/usr/bin/env python3
"""
EVEP Platform - Demo Users Initialization Script
================================================

This script initializes demo users for both:
1. Admin Panel Users (admin_users collection)
2. Medical Portal Users (users collection)

Usage:
    python scripts/init-demo-users.py
"""

import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import bcrypt
import secrets

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.config import settings

# Secure passwords for demo users
DEMO_PASSWORDS = {
    # Admin Panel Users
    'admin@evep.com': 'EvepAdmin2025!',
    'admin2@evep.com': 'EvepAdmin2_2025!',
    
    # Medical Portal Users
    'doctor@evep.com': 'EvepDoctor2025!',
    'nurse@evep.com': 'EvepNurse2025!',
    'teacher@evep.com': 'EvepTeacher2025!',
    'parent@evep.com': 'EvepParent2025!',
}

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def init_demo_users():
    """Initialize demo users for both admin panel and medical portal"""
    
    # Database connection
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    print("🚀 Initializing EVEP Platform Demo Users...")
    print("=" * 50)
    
    # 1. Initialize Admin Panel Users
    print("\n📋 Initializing Admin Panel Users...")
    admin_users_collection = db.admin_users
    
    # Clear existing admin users
    await admin_users_collection.delete_many({})
    print("✅ Cleared existing admin panel users")
    
    # Create admin panel users
    admin_panel_users = [
        {
            "email": "admin@evep.com",
            "first_name": "System",
            "last_name": "Administrator",
            "password_hash": hash_password(DEMO_PASSWORDS['admin@evep.com']),
            "role": "super_admin",
            "organization": "EVEP Platform",
            "phone": "+66-2-123-4567",
            "location": "Bangkok, Thailand",
            "admin_level": "system",
            "access_level": "full",
            "permissions": ["all"],
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "email": "admin2@evep.com",
            "first_name": "John",
            "last_name": "Smith",
            "password_hash": hash_password(DEMO_PASSWORDS['admin2@evep.com']),
            "role": "admin",
            "organization": "EVEP Platform",
            "phone": "+66-2-234-5678",
            "location": "Bangkok, Thailand",
            "admin_level": "organization",
            "access_level": "limited",
            "permissions": ["user_management", "system_settings", "security_audit"],
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    ]
    
    # Insert admin panel users
    result = await admin_users_collection.insert_many(admin_panel_users)
    print(f"✅ Created {len(result.inserted_ids)} admin panel users")
    
    # 2. Initialize Medical Portal Users
    print("\n📋 Initializing Medical Portal Users...")
    users_collection = db.users
    
    # Clear existing medical portal users
    await users_collection.delete_many({})
    print("✅ Cleared existing medical portal users")
    
    # Create medical portal users
    medical_portal_users = [
        {
            "email": "doctor@evep.com",
            "first_name": "Dr. Sarah",
            "last_name": "Johnson",
            "password_hash": hash_password(DEMO_PASSWORDS['doctor@evep.com']),
            "role": "doctor",
            "organization": "Bangkok Medical Center",
            "phone": "+66-2-345-6789",
            "location": "Bangkok, Thailand",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "email": "nurse@evep.com",
            "first_name": "Nurse",
            "last_name": "Maria",
            "password_hash": hash_password(DEMO_PASSWORDS['nurse@evep.com']),
            "role": "nurse",
            "organization": "Bangkok Medical Center",
            "phone": "+66-2-456-7890",
            "location": "Bangkok, Thailand",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "email": "teacher@evep.com",
            "first_name": "Teacher",
            "last_name": "David",
            "password_hash": hash_password(DEMO_PASSWORDS['teacher@evep.com']),
            "role": "teacher",
            "organization": "Bangkok International School",
            "phone": "+66-2-567-8901",
            "location": "Bangkok, Thailand",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "email": "parent@evep.com",
            "first_name": "Parent",
            "last_name": "Lisa",
            "password_hash": hash_password(DEMO_PASSWORDS['parent@evep.com']),
            "role": "parent",
            "organization": "Parent Community",
            "phone": "+66-2-678-9012",
            "location": "Bangkok, Thailand",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    ]
    
    # Insert medical portal users
    result = await users_collection.insert_many(medical_portal_users)
    print(f"✅ Created {len(result.inserted_ids)} medical portal users")
    
    # Close database connection
    client.close()
    
    print("\n🎉 Demo users initialized successfully!")
    print("=" * 50)
    
    print("\n📋 Login Credentials:")
    print("-" * 30)
    
    print("\n🔐 Admin Panel Users:")
    print("   Super Admin: admin@evep.com / EvepAdmin2025!")
    print("   Admin:       admin2@evep.com / EvepAdmin2_2025!")
    
    print("\n🏥 Medical Portal Users:")
    print("   Doctor:      doctor@evep.com / EvepDoctor2025!")
    print("   Nurse:       nurse@evep.com / EvepNurse2025!")
    print("   Teacher:     teacher@evep.com / EvepTeacher2025!")
    print("   Parent:      parent@evep.com / EvepParent2025!")
    
    print("\n🌐 Access URLs:")
    print("-" * 30)
    print("   Admin Panel:     http://localhost:3015/auth")
    print("   Medical Portal:  http://localhost:3013/auth")
    
    print("\n⚠️  Security Notes:")
    print("-" * 30)
    print("   • These are demo passwords for development only")
    print("   • Change passwords in production environment")
    print("   • Admin panel and medical portal users are separate")
    print("   • Each system has its own user management")

if __name__ == "__main__":
    asyncio.run(init_demo_users())
