#!/usr/bin/env python3
"""
Test password verification
"""
import asyncio
import sys
import os
sys.path.append('/app')

from app.core.database import get_database
from app.core.security import hash_password, verify_password

async def test_password_verification():
    try:
        # Test the password hashing and verification
        test_password = "testpassword123"
        
        # Get the user we created
        db_client = get_database()
        db = db_client.evep
        user = await db.users.find_one({"email": "test@evep.com"})
        
        if user:
            stored_password = user.get('password')
            print(f"User found: {user.get('email')}")
            print(f"Stored password hash: {stored_password}")
            
            # Test verification
            is_valid = verify_password(test_password, stored_password)
            print(f"Password verification result: {is_valid}")
            
            # Create a new hash and test
            new_hash = hash_password(test_password)
            print(f"New hash: {new_hash}")
            
            is_new_valid = verify_password(test_password, new_hash)
            print(f"New hash verification: {is_new_valid}")
            
            # Update user with new hash if needed
            if not is_valid:
                await db.users.update_one(
                    {"email": "test@evep.com"},
                    {"$set": {"password": new_hash}}
                )
                print("Updated user with new password hash")
        else:
            print("User not found")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_password_verification())