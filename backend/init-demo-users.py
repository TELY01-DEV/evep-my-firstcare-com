#!/usr/bin/env python3
"""
Initialize demo users for EVEP Platform
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import hash_password
from app.core.config import settings
from datetime import datetime

async def init_demo_users():
    """Initialize demo users in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    # Demo users data
    demo_users = [
        {
            "email": "doctor@evep.com",
            "password_hash": hash_password("demo123"),
            "first_name": "Dr. Sarah",
            "last_name": "Johnson",
            "role": "doctor",
            "organization": "Bangkok Medical Center",
            "phone": "+66-2-123-4567",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "login_attempts": 0,
            "locked_until": None
        },
        {
            "email": "nurse@evep.com",
            "password_hash": hash_password("demo123"),
            "first_name": "Nurse",
            "last_name": "Maria",
            "role": "nurse",
            "organization": "Bangkok Medical Center",
            "phone": "+66-2-123-4568",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "login_attempts": 0,
            "locked_until": None
        },
        {
            "email": "admin@evep.com",
            "password_hash": hash_password("demo123"),
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "organization": "EVEP Platform",
            "phone": "+66-2-123-4569",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "login_attempts": 0,
            "locked_until": None
        }
    ]
    
    try:
        # Clear existing demo users
        await db.users.delete_many({"email": {"$in": [user["email"] for user in demo_users]}})
        print("✅ Cleared existing demo users")
        
        # Insert demo users
        result = await db.users.insert_many(demo_users)
        print(f"✅ Created {len(result.inserted_ids)} demo users")
        
        # Print created users
        for user in demo_users:
            print(f"   - {user['email']} ({user['role']})")
        
        print("\n🎉 Demo users initialized successfully!")
        print("\n📋 Login Credentials:")
        print("   Doctor: doctor@evep.com / demo123")
        print("   Nurse:  nurse@evep.com  / demo123")
        print("   Admin:  admin@evep.com  / demo123")
        
    except Exception as e:
        print(f"❌ Error initializing demo users: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_demo_users())
