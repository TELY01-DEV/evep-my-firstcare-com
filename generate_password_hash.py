#!/usr/bin/env python3
"""
Generate password hash for admin user
"""

import bcrypt

def generate_password_hash(password: str) -> str:
    """Generate a bcrypt hash for a password"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

if __name__ == "__main__":
    password = "admin123"
    hashed = generate_password_hash(password)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    
    # Verify the hash
    if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
        print("✅ Hash verification successful!")
    else:
        print("❌ Hash verification failed!")
