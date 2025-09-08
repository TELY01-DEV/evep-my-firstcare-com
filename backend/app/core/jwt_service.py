"""
Centralized JWT Service for EVEP Platform with Blockchain Hash Security
Ensures consistent JWT token creation and validation across all services
"""

import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.security import generate_blockchain_hash


class JWTService:
    """Centralized JWT service for token creation and validation"""
    
    def __init__(self):
        # Use environment variable for JWT secret
        jwt_secret = os.getenv("JWT_SECRET_KEY")
        if not jwt_secret:
            raise ValueError("JWT_SECRET_KEY environment variable is required")
        self.jwt_secret = jwt_secret
        self.algorithm = "HS256"
        self.expiration_hours = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
        self.refresh_expiration_days = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "7"))
        
        print(f"🔐 Enhanced JWT Service initialized - Token: {self.expiration_hours}h, Refresh: {self.refresh_expiration_days}d")
    
    def create_token(self, user_data: Dict[str, Any], token_type: str = "access", ip_address: str = "127.0.0.1") -> str:
        """Create a JWT token for a user with blockchain hash security"""
        try:
            # Handle MongoDB ObjectId
            user_id = user_data.get("id") or str(user_data.get("_id"))
            current_time = datetime.utcnow()
            
            # Set expiration based on token type
            if token_type == "refresh":
                exp_time = current_time + timedelta(days=self.refresh_expiration_days)
            else:
                exp_time = current_time + timedelta(hours=self.expiration_hours)
            
            # Generate unique token ID with timestamp
            jti = f"{user_id}_{int(current_time.timestamp())}"
            
            # Create blockchain hash for token integrity
            hash_data = f"token_creation:{user_data['email']}:{token_type}:{jti}:{ip_address}"
            blockchain_hash = generate_blockchain_hash(hash_data)
            
            # Create payload with blockchain security
            payload = {
                "user_id": user_id,
                "email": user_data["email"],
                "role": user_data["role"],
                "name": user_data.get("name", ""),
                "token_type": token_type,
                "exp": int(exp_time.timestamp()),
                "iat": int(current_time.timestamp()),
                "jti": jti,
                "blockchain_hash": blockchain_hash,
                "ip_address": ip_address,
                "security_level": "blockchain_verified"
            }
            
            # Create token
            token = jwt.encode(payload, self.jwt_secret, algorithm=self.algorithm)
            print(f"🔐 JWT {token_type} token created with blockchain hash for user: {user_data['email']} (role: {user_data['role']})")
            print(f"🔗 Blockchain hash: {blockchain_hash[:16]}...")
            
            return token
            
        except Exception as e:
            print(f"❌ JWT token creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token creation failed"
            )
    
    def create_token_pair(self, user_data: Dict[str, Any], ip_address: str = "127.0.0.1") -> Dict[str, str]:
        """Create both access and refresh tokens with blockchain hash"""
        access_token = self.create_token(user_data, "access", ip_address)
        refresh_token = self.create_token(user_data, "refresh", ip_address)
        
        # Generate session blockchain hash
        session_hash_data = f"session_creation:{user_data['email']}:{ip_address}:{int(datetime.utcnow().timestamp())}"
        session_hash = generate_blockchain_hash(session_hash_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.expiration_hours * 3600,  # seconds
            "session_hash": session_hash,
            "security_level": "blockchain_verified"
        }
    
    def verify_token(self, token: str, token_type: str = "access", validate_blockchain: bool = True) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token with blockchain hash validation"""
        try:
            # Decode token
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.algorithm])
            
            # Validate token structure (backward compatibility)
            core_required_fields = ["user_id", "email", "role", "exp", "iat"]
            optional_fields = ["token_type", "jti"]  # These might not exist in legacy tokens
            blockchain_fields = ["blockchain_hash", "ip_address", "security_level"]
            
            # Check core required fields
            for field in core_required_fields:
                if field not in payload:
                    print(f"❌ JWT token missing required field: {field}")
                    return None
            
            # Set defaults for optional fields if missing (legacy compatibility)
            if "token_type" not in payload:
                payload["token_type"] = token_type  # Assume the requested type
            if "jti" not in payload:
                payload["jti"] = f"{payload['user_id']}_{payload.get('iat', 0)}"  # Generate a fallback JTI
            
            # Check for blockchain security fields (backward compatibility)
            has_blockchain_fields = all(field in payload for field in blockchain_fields)
            
            if validate_blockchain and has_blockchain_fields:
                # Validate blockchain hash integrity for new tokens
                hash_data = f"token_creation:{payload['email']}:{payload['token_type']}:{payload['jti']}:{payload['ip_address']}"
                expected_hash = generate_blockchain_hash(hash_data)
                
                if payload.get("blockchain_hash") != expected_hash:
                    print(f"❌ JWT token blockchain hash validation failed")
                    print(f"   Expected: {expected_hash[:16]}...")
                    print(f"   Got: {payload.get('blockchain_hash', 'None')[:16]}...")
                    return None
                
                # Check security level for new tokens
                if payload.get("security_level") != "blockchain_verified":
                    print(f"❌ JWT token insufficient security level: {payload.get('security_level')}")
                    return None
                    
                print(f"🔐 JWT {token_type} token verified with blockchain hash for user: {payload['email']} (role: {payload['role']})")
                print(f"🔗 Blockchain hash validated: {payload['blockchain_hash'][:16]}...")
            elif has_blockchain_fields:
                # Token has blockchain fields but validation is disabled
                print(f"🔐 JWT {token_type} token verified (blockchain validation disabled) for user: {payload['email']} (role: {payload['role']})")
            else:
                # Legacy token without blockchain fields
                print(f"⚠️ JWT {token_type} legacy token verified for user: {payload['email']} (role: {payload['role']}) - consider re-login for enhanced security")
            
            # Check token type
            if payload.get("token_type") != token_type:
                print(f"❌ JWT token type mismatch: expected {token_type}, got {payload.get('token_type')}")
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            print(f"❌ JWT {token_type} token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"❌ JWT {token_type} token invalid: {e}")
            return None
        except Exception as e:
            print(f"❌ JWT {token_type} token verification error: {e}")
            return None
    
    def refresh_access_token(self, refresh_token: str, ip_address: str = "127.0.0.1") -> Optional[Dict[str, str]]:
        """Create new access token from refresh token with blockchain validation"""
        try:
            # Verify refresh token with blockchain validation
            payload = self.verify_token(refresh_token, "refresh", validate_blockchain=True)
            if not payload:
                return None
            
            # Create new access token with same user data and IP
            user_data = {
                "id": payload["user_id"],
                "email": payload["email"],
                "role": payload["role"],
                "name": payload.get("name", "")
            }
            
            new_access_token = self.create_token(user_data, "access", ip_address)
            
            # Generate refresh audit hash
            refresh_hash_data = f"token_refresh:{payload['email']}:{payload['jti']}:{ip_address}:{int(datetime.utcnow().timestamp())}"
            refresh_audit_hash = generate_blockchain_hash(refresh_hash_data)
            
            print(f"🔄 Token refreshed with blockchain audit: {refresh_audit_hash[:16]}...")
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": self.expiration_hours * 3600,
                "refresh_audit_hash": refresh_audit_hash,
                "security_level": "blockchain_verified"
            }
            
        except Exception as e:
            print(f"❌ Token refresh failed: {e}")
            return None
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Extract user information from token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        return {
            "user_id": payload["user_id"],
            "email": payload["email"],
            "role": payload["role"],
            "token_type": payload["token_type"]
        }


# Global JWT service instance
_jwt_service: Optional[JWTService] = None


def get_jwt_service() -> JWTService:
    """Get the global JWT service instance"""
    global _jwt_service
    if _jwt_service is None:
        _jwt_service = JWTService()
    return _jwt_service


# Enhanced convenience functions with blockchain support
def create_jwt_token(user_data: Dict[str, Any], ip_address: str = "127.0.0.1") -> str:
    """Create a JWT token using the centralized service with blockchain hash"""
    return get_jwt_service().create_token(user_data, "access", ip_address)


def create_jwt_token_pair(user_data: Dict[str, Any], ip_address: str = "127.0.0.1") -> Dict[str, str]:
    """Create JWT token pair using the centralized service with blockchain hash"""
    return get_jwt_service().create_token_pair(user_data, ip_address)


def verify_jwt_token(token: str, validate_blockchain: bool = True) -> Optional[Dict[str, Any]]:
    """Verify a JWT token using the centralized service with blockchain validation"""
    return get_jwt_service().verify_token(token, "access", validate_blockchain)


def refresh_jwt_token(refresh_token: str, ip_address: str = "127.0.0.1") -> Optional[Dict[str, str]]:
    """Refresh JWT token using the centralized service with blockchain audit"""
    return get_jwt_service().refresh_access_token(refresh_token, ip_address)


def get_user_from_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Get user data from JWT token using the centralized service"""
    return get_jwt_service().get_user_from_token(token)
