#!/usr/bin/env python3
"""
Test password verification
"""

import asyncio
import sys
import os
import bcrypt

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database
from app.modules.auth.services.auth_service import AuthService

async def test_password():
    """Test password verification"""
    
    print("🔐 Testing password verification...")
    
    # Initialize database connection and auth service
    db_client = get_database()
    db = db_client.evep
    auth_service = AuthService()
    
    # Test different passwords
    test_passwords = [
        "EvepAdmin2025!",
        "demo123",
        "admin123",
        "password",
        "EvepAdmin2025",
        "EvepAdmin2025!!"
    ]
    
    # Get admin user
    admin_user = await db.admin_users.find_one({"email": "admin@evep.com"})
    if not admin_user:
        print("❌ Admin user not found")
        return
    
    print(f"✅ Found admin user: {admin_user['email']}")
    print(f"   Stored password hash: {admin_user['password_hash']}")
    print()
    
    # Test each password
    for password in test_passwords:
        try:
            is_valid = auth_service.verify_password(password, admin_user['password_hash'])
            print(f"   Password '{password}': {'✅ VALID' if is_valid else '❌ INVALID'}")
        except Exception as e:
            print(f"   Password '{password}': ❌ ERROR - {e}")
    
    print()
    print("🔍 Testing bcrypt directly...")
    
    # Test bcrypt directly
    stored_hash = admin_user['password_hash']
    for password in test_passwords:
        try:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"   bcrypt '{password}': {'✅ VALID' if is_valid else '❌ INVALID'}")
        except Exception as e:
            print(f"   bcrypt '{password}': ❌ ERROR - {e}")

if __name__ == "__main__":
    asyncio.run(test_password())
