#!/usr/bin/env python3
"""
Fix authentication by creating a working admin user
"""
import asyncio
import sys
import os
sys.path.append('/app')

from app.core.database import get_database
from app.core.security import hash_password

async def fix_admin_user():
    try:
        db_client = get_database()
        db = db_client.evep
        
        # Fix the admin user that has no password
        admin_password = "admin123"
        hashed_password = hash_password(admin_password)
        
        result = await db.users.update_one(
            {"email": "admin@evep.com"},
            {"$set": {"password": hashed_password}}
        )
        
        print(f"Updated admin user: {result.modified_count} document(s) modified")
        print(f"Admin credentials:")
        print(f"Email: admin@evep.com")
        print(f"Password: {admin_password}")
        
        # Also create a simple test API user
        simple_user = {
            "email": "api@evep.com",
            "password": hash_password("api123"),
            "first_name": "API",
            "last_name": "User",
            "role": "super_admin",
            "is_active": True
        }
        
        try:
            await db.users.insert_one(simple_user)
            print("Created API user: api@evep.com / api123")
        except Exception as e:
            print(f"API user might already exist: {e}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_admin_user())