#!/usr/bin/env python3
"""
EVEP Platform - Demo User Initialization Script
Creates demo users for both admin panel and medical portal
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database
from app.modules.auth.services.auth_service import AuthService
from app.shared.models.user import UserCreate, UserRole

async def create_demo_users():
    """Create demo users for the EVEP Platform"""
    
    print("🚀 EVEP Platform - Demo User Initialization")
    print("=" * 50)
    
    # Initialize database connection
    db_client = get_database()
    db = db_client.evep
    auth_service = AuthService()
    
    # Demo user data
    admin_users = [
        {
            "email": "admin@evep.com",
            "password": "EvepAdmin2025!",
            "name": "Super Administrator",
            "role": UserRole.SUPER_ADMIN,
            "organization": "EVEP Platform",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "admin2@evep.com",
            "password": "EvepAdmin2_2025!",
            "name": "System Administrator",
            "role": UserRole.ADMIN,
            "organization": "EVEP Platform",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    medical_users = [
        {
            "email": "doctor@evep.com",
            "password": "EvepDoctor2025!",
            "name": "Dr. Sarah Johnson",
            "role": UserRole.DOCTOR,
            "organization": "Bangkok Medical Center",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "nurse@evep.com",
            "password": "EvepNurse2025!",
            "name": "Nurse Michael Chen",
            "role": UserRole.NURSE,
            "organization": "Bangkok Medical Center",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "teacher@evep.com",
            "password": "EvepTeacher2025!",
            "name": "Teacher Emily Davis",
            "role": UserRole.TEACHER,
            "organization": "Bangkok International School",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "parent@evep.com",
            "password": "EvepParent2025!",
            "name": "Parent John Smith",
            "role": UserRole.PARENT,
            "organization": "Parent Community",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    try:
        # Create admin users
        print("🔐 Creating Admin Panel Users...")
        admin_collection = db["admin_users"]
        
        for user_data in admin_users:
            # Check if user already exists
            existing_user = await admin_collection.find_one({"email": user_data["email"]})
            if existing_user:
                print(f"   ⚠️  Admin user {user_data['email']} already exists, skipping...")
                continue
            
            # Hash password
            hashed_password = auth_service.hash_password(user_data["password"])
            
            # Create user document
            user_doc = {
                "email": user_data["email"],
                "password_hash": hashed_password,
                "name": user_data["name"],
                "role": user_data["role"],
                "organization": user_data["organization"],
                "is_active": user_data["is_active"],
                "created_at": user_data["created_at"],
                "updated_at": user_data["updated_at"]
            }
            
            # Insert user
            result = await admin_collection.insert_one(user_doc)
            print(f"   ✅ Created admin user: {user_data['email']} (ID: {result.inserted_id})")
        
        # Create medical users
        print("\n🏥 Creating Medical Portal Users...")
        medical_collection = db["users"]
        
        for user_data in medical_users:
            # Check if user already exists
            existing_user = await medical_collection.find_one({"email": user_data["email"]})
            if existing_user:
                print(f"   ⚠️  Medical user {user_data['email']} already exists, skipping...")
                continue
            
            # Hash password
            hashed_password = auth_service.hash_password(user_data["password"])
            
            # Create user document
            user_doc = {
                "email": user_data["email"],
                "password_hash": hashed_password,
                "name": user_data["name"],
                "role": user_data["role"],
                "organization": user_data["organization"],
                "is_active": user_data["is_active"],
                "created_at": user_data["created_at"],
                "updated_at": user_data["updated_at"]
            }
            
            # Insert user
            result = await medical_collection.insert_one(user_doc)
            print(f"   ✅ Created medical user: {user_data['email']} (ID: {result.inserted_id})")
        
        print("\n🎉 Demo User Initialization Complete!")
        print("=" * 50)
        print("\n📋 Available Users:")
        print("\n🔐 Admin Panel Users:")
        for user in admin_users:
            print(f"   Email: {user['email']}")
            print(f"   Password: {user['password']}")
            print(f"   Role: {user['role']}")
            print()
        
        print("🏥 Medical Portal Users:")
        for user in medical_users:
            print(f"   Email: {user['email']}")
            print(f"   Password: {user['password']}")
            print(f"   Role: {user['role']}")
            print()
        
        print("🌐 Access URLs:")
        print("   Admin Panel: http://localhost:3015/login")
        print("   Medical Portal: http://localhost:3013/login")
        print("   API Documentation: http://localhost:8013/docs")
        
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(create_demo_users())
