#!/usr/bin/env python3
"""
Check users in the database
"""

import asyncio
import sys
import os

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_database

async def check_users():
    """Check users in the database"""
    
    print("🔍 Checking users in database...")
    
    # Initialize database connection
    db_client = get_database()
    db = db_client.evep
    
    # Check admin users
    print("\n🔐 Admin Users:")
    admin_users = await db.admin_users.find().to_list(10)
    print(f"   Found {len(admin_users)} admin users")
    for user in admin_users:
        print(f"   - {user.get('email', 'no-email')}: {user.get('name', 'no-name')} (Role: {user.get('role', 'unknown')})")
    
    # Check regular users
    print("\n🏥 Medical Users:")
    medical_users = await db.users.find().to_list(10)
    print(f"   Found {len(medical_users)} medical users")
    for user in medical_users:
        print(f"   - {user.get('email', 'no-email')}: {user.get('name', 'no-name')} (Role: {user.get('role', 'unknown')})")
    
    # Check if specific admin user exists
    print("\n🔍 Checking specific admin user...")
    admin_user = await db.admin_users.find_one({"email": "admin@evep.com"})
    if admin_user:
        print(f"   ✅ Found admin@evep.com")
        print(f"   Full user data: {admin_user}")
        print(f"   Role: {admin_user.get('role', 'unknown')}")
        print(f"   Active: {admin_user.get('is_active', True)}")
        print(f"   Has password_hash: {'password_hash' in admin_user}")
    else:
        print("   ❌ admin@evep.com not found in admin_users")
    
    # Check if specific medical user exists
    print("\n🔍 Checking specific medical user...")
    medical_user = await db.users.find_one({"email": "doctor@evep.com"})
    if medical_user:
        print(f"   ✅ Found doctor@evep.com")
        print(f"   Full user data: {medical_user}")
        print(f"   Role: {medical_user.get('role', 'unknown')}")
        print(f"   Active: {medical_user.get('is_active', True)}")
        print(f"   Has password_hash: {'password_hash' in medical_user}")
    else:
        print("   ❌ doctor@evep.com not found in users")

if __name__ == "__main__":
    asyncio.run(check_users())
