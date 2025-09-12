"""
JWT Service for EVEP Platform
Handles JWT token creation, verification, and management
"""

import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_jwt_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token with the given data
    
    Args:
        data: Dictionary containing the data to encode in the token
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        Encoded JWT token string
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Error creating JWT token: {e}")
        raise

def create_jwt_token_pair(user_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user_data: Dictionary containing user data
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    try:
        # Create access token (short-lived)
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_jwt_token(
            data=user_data,
            expires_delta=access_token_expires
        )
        
        # Create refresh token (long-lived)
        refresh_token_expires = timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_jwt_token(
            data={**user_data, "type": "refresh"},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds
        }
        
    except Exception as e:
        logger.error(f"Error creating JWT token pair: {e}")
        raise

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying JWT token: {e}")
        return None

def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Expiration datetime if valid, None if invalid
    """
    try:
        payload = verify_jwt_token(token)
        if payload and "exp" in payload:
            return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        return None
    except Exception as e:
        logger.error(f"Error getting token expiration: {e}")
        return None

def is_token_expired(token: str) -> bool:
    """
    Check if a JWT token is expired
    
    Args:
        token: JWT token string
        
    Returns:
        True if expired, False if still valid
    """
    try:
        payload = verify_jwt_token(token)
        return payload is None
    except Exception as e:
        logger.error(f"Error checking token expiration: {e}")
        return True

def refresh_access_token(refresh_token: str) -> Optional[Dict[str, str]]:
    """
    Create a new access token using a valid refresh token
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        New token pair if refresh token is valid, None otherwise
    """
    try:
        payload = verify_jwt_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            logger.warning("Invalid refresh token")
            return None
        
        # Remove the type field and create new tokens
        user_data = {k: v for k, v in payload.items() if k not in ["exp", "iat", "type"]}
        
        return create_jwt_token_pair(user_data)
        
    except Exception as e:
        logger.error(f"Error refreshing access token: {e}")
        return None