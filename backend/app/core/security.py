"""
Security utilities for EVEP Platform
Handles JWT token verification and other security functions
"""

import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Request

from app.core.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=int(os.getenv("JWT_EXPIRATION_HOURS", "24")))
    
    # Convert datetime to timestamp for JWT compatibility
    now = datetime.utcnow()
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),  # Add issued at timestamp
        "nbf": int(now.timestamp())   # Add not before timestamp
    })
    
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    
    encoded_jwt = jwt.encode(to_encode, jwt_secret, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token - DEPRECATED: Use jwt_service instead"""
    from app.core.jwt_service import verify_jwt_token
    return verify_jwt_token(token)

def get_current_user(token: str) -> Optional[Dict[str, Any]]:
    """Get current user from token"""
    payload = verify_token(token)
    if payload is None:
        return None
    return payload

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    import bcrypt
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_blockchain_hash(data: str) -> str:
    """Generate a blockchain-style hash for audit purposes"""
    import hashlib
    timestamp = datetime.utcnow().isoformat()
    
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    
    content = f"{data}:{timestamp}:{jwt_secret}"
    return hashlib.sha256(content.encode()).hexdigest()

def log_security_event(request: Request, event_type: str, description: str, portal: str = "admin"):
    """Log security events for audit purposes"""
    try:
        from app.core.database import get_database
        from app.core.config import settings
        
        db = get_database()
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get user agent
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Create audit log entry
        audit_log = {
            "timestamp": datetime.utcnow(),
            "event_type": event_type,
            "description": description,
            "portal": portal,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "audit_hash": generate_blockchain_hash(f"{event_type}:{description}:{client_ip}")
        }
        
        # Insert into audit_logs collection
        db.evep.audit_logs.insert_one(audit_log)
        
    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Error logging security event: {e}")
