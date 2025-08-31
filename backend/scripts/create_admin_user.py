#!/usr/bin/env python3
"""
Create default admin user for EVEP System
"""

import sys
import os
import asyncio
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_admin_users_collection
from app.core.security import hash_password
from app.core.config import settings

async def create_admin_user():
    """Create a default admin user"""
    admin_users_collection = get_admin_users_collection()
    
    # Check if admin user already exists
    existing_admin = await admin_users_collection.find_one({"email": "admin@evep.com"})
    if existing_admin:
        print("✅ Admin user already exists")
        return
    
    # Create admin user
    admin_user = {
        "email": "admin@evep.com",
        "password_hash": hash_password("admin123"),
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "is_active": True,
        "created_at": settings.get_current_timestamp(),
        "last_login": None,
        "login_attempts": 0,
        "locked_until": None
    }
    
    result = await admin_users_collection.insert_one(admin_user)
    print(f"✅ Admin user created with ID: {result.inserted_id}")
    print("📧 Email: admin@evep.com")
    print("🔑 Password: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
