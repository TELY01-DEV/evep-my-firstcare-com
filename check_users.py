#!/usr/bin/env python3
"""
Quick script to check authentication status and users
"""
import asyncio
import sys
import os
sys.path.append('/app')

from app.core.database import get_database

async def check_users():
    try:
        db_client = get_database()
        db = db_client.evep
        users = await db.users.find({}).to_list(None)
        print(f"Total users found: {len(users)}")
        for user in users:
            print(f"User: {user.get('email', user.get('username', 'no_email_or_username'))}")
            print(f"  ID: {user.get('_id')}")
            print(f"  Role: {user.get('role', 'no_role')}")
            print(f"  Active: {user.get('is_active', 'unknown')}")
            print("---")
        
        # Also check medical_staff collection
        medical_staff = await db.medical_staff.find({}).to_list(None)
        print(f"\nMedical staff found: {len(medical_staff)}")
        for staff in medical_staff:
            print(f"Staff: {staff.get('email', staff.get('username', 'no_email_or_username'))}")
            print(f"  ID: {staff.get('_id')}")
            print(f"  Role: {staff.get('role', 'no_role')}")
            print("---")
            
    except Exception as e:
        print(f"Error checking users: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_users())