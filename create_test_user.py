#!/usr/bin/env python3
"""
Create a test user with known password for testing authentication
"""
import asyncio
import sys
import os
sys.path.append('/app')

from app.core.database import get_database
from app.core.security import hash_password
from bson import ObjectId

async def create_test_user():
    try:
        db_client = get_database()
        db = db_client.evep
        
        # Create test user with known password
        test_password = "testpassword123"
        hashed_password = hash_password(test_password)
        
        test_user = {
            "_id": ObjectId(),
            "email": "test@evep.com",
            "password": hashed_password,
            "first_name": "Test",
            "last_name": "User",
            "role": "doctor",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        # Try to insert (will fail if exists)
        try:
            result = await db.users.insert_one(test_user)
            print(f"Created test user with ID: {result.inserted_id}")
        except Exception as insert_error:
            print(f"User might already exist: {insert_error}")
        
        print(f"Test user credentials:")
        print(f"Email: test@evep.com")
        print(f"Password: {test_password}")
        print(f"Hashed password: {hashed_password}")
        
        # Also try to see if we can find existing user patterns
        admin_user = await db.users.find_one({"email": "admin@evep.com"})
        if admin_user:
            print(f"\nFound admin user: {admin_user.get('email')}")
            print(f"Admin password hash: {admin_user.get('password', 'NO PASSWORD')}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_test_user())