#!/usr/bin/env python3
import asyncio
import sys
import os

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import hash_password
from datetime import datetime

async def check_and_init_users():
    """Check database and initialize demo users if needed"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://mongo-primary:27017")
    db = client.evep
    
    try:
        # Check if users exist
        user_count = await db.users.count_documents({})
        print(f"Found {user_count} users in database")
        
        if user_count == 0:
            print("No users found. Initializing demo users...")
            
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
            
            # Insert demo users
            result = await db.users.insert_many(demo_users)
            print(f"✅ Created {len(result.inserted_ids)} demo users")
            
            print("\n📋 Login Credentials:")
            print("   Doctor: doctor@evep.com / demo123")
            print("   Admin:  admin@evep.com  / demo123")
        else:
            # Show existing users
            users = await db.users.find({}, {"email": 1, "role": 1}).to_list(length=10)
            print("Existing users:")
            for user in users:
                print(f"   - {user['email']} ({user.get('role', 'unknown')})")
                
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_and_init_users())
