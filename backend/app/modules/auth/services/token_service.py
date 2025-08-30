import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from app.core.config import Config

class TokenService:
    def __init__(self):
        self.config = Config.get_module_config("auth")
        self.jwt_secret = self.config.get("config", {}).get("jwt_secret", "hardcoded_secret_key")
        self.jwt_expires_in = self.config.get("config", {}).get("jwt_expires_in", "24h")
        self.refresh_expires_in = self.config.get("config", {}).get("refresh_expires_in", "7d")
        
        # In-memory token storage (in production, use Redis or database)
        self.access_tokens = {}
        self.refresh_tokens = {}
        self.revoked_tokens = set()
    
    async def initialize(self) -> None:
        """Initialize the token service"""
        # This would typically connect to Redis or database for token storage
        pass
    
    def create_access_token(self, user_data: Dict[str, Any]) -> str:
        """Create an access token"""
        payload = {
            "user_id": user_data["id"],
            "email": user_data["email"],
            "role": user_data["role"],
            "token_type": "access",
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm="HS256")
        
        # Store token metadata
        self.access_tokens[token] = {
            "user_id": user_data["id"],
            "created_at": datetime.utcnow(),
            "expires_at": payload["exp"]
        }
        
        return token
    
    def create_refresh_token(self, user_data: Dict[str, Any]) -> str:
        """Create a refresh token"""
        payload = {
            "user_id": user_data["id"],
            "email": user_data["email"],
            "role": user_data["role"],
            "token_type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm="HS256")
        
        # Store token metadata
        self.refresh_tokens[token] = {
            "user_id": user_data["id"],
            "created_at": datetime.utcnow(),
            "expires_at": payload["exp"]
        }
        
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a token"""
        try:
            # Check if token is revoked
            if token in self.revoked_tokens:
                return None
            
            # Decode token
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            
            # Check if token is expired
            if datetime.utcnow() > datetime.fromtimestamp(payload["exp"]):
                return None
            
            # Verify token type
            if payload.get("token_type") not in ["access", "refresh"]:
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh an access token using a refresh token"""
        # Verify refresh token
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("token_type") != "refresh":
            return None
        
        # Get user data from refresh token
        user_data = {
            "id": payload["user_id"],
            "email": payload["email"],
            "role": payload["role"]
        }
        
        # Create new access token
        new_access_token = self.create_access_token(user_data)
        
        # Optionally create new refresh token
        new_refresh_token = self.create_refresh_token(user_data)
        
        # Revoke old refresh token
        self.revoke_token(refresh_token)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": 86400  # 24 hours
        }
    
    def revoke_token(self, token: str) -> bool:
        """Revoke a token"""
        # Add to revoked tokens set
        self.revoked_tokens.add(token)
        
        # Remove from active tokens
        if token in self.access_tokens:
            del self.access_tokens[token]
        if token in self.refresh_tokens:
            del self.refresh_tokens[token]
        
        return True
    
    def revoke_user_tokens(self, user_id: str) -> int:
        """Revoke all tokens for a specific user"""
        revoked_count = 0
        
        # Revoke access tokens
        tokens_to_revoke = []
        for token, metadata in self.access_tokens.items():
            if metadata["user_id"] == user_id:
                tokens_to_revoke.append(token)
        
        for token in tokens_to_revoke:
            self.revoke_token(token)
            revoked_count += 1
        
        # Revoke refresh tokens
        tokens_to_revoke = []
        for token, metadata in self.refresh_tokens.items():
            if metadata["user_id"] == user_id:
                tokens_to_revoke.append(token)
        
        for token in tokens_to_revoke:
            self.revoke_token(token)
            revoked_count += 1
        
        return revoked_count
    
    def get_token_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Get information about a token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        token_type = payload.get("token_type")
        if token_type == "access" and token in self.access_tokens:
            metadata = self.access_tokens[token]
            return {
                "user_id": metadata["user_id"],
                "token_type": token_type,
                "created_at": metadata["created_at"],
                "expires_at": metadata["expires_at"],
                "is_revoked": token in self.revoked_tokens
            }
        elif token_type == "refresh" and token in self.refresh_tokens:
            metadata = self.refresh_tokens[token]
            return {
                "user_id": metadata["user_id"],
                "token_type": token_type,
                "created_at": metadata["created_at"],
                "expires_at": metadata["expires_at"],
                "is_revoked": token in self.revoked_tokens
            }
        
        return None
    
    def get_user_tokens(self, user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get all tokens for a specific user"""
        access_tokens = []
        refresh_tokens = []
        
        # Get access tokens
        for token, metadata in self.access_tokens.items():
            if metadata["user_id"] == user_id:
                access_tokens.append({
                    "token": token[:20] + "...",  # Truncate for security
                    "created_at": metadata["created_at"],
                    "expires_at": metadata["expires_at"],
                    "is_revoked": token in self.revoked_tokens
                })
        
        # Get refresh tokens
        for token, metadata in self.refresh_tokens.items():
            if metadata["user_id"] == user_id:
                refresh_tokens.append({
                    "token": token[:20] + "...",  # Truncate for security
                    "created_at": metadata["created_at"],
                    "expires_at": metadata["expires_at"],
                    "is_revoked": token in self.revoked_tokens
                })
        
        return {
            "access_tokens": access_tokens,
            "refresh_tokens": refresh_tokens
        }
    
    def cleanup_expired_tokens(self) -> int:
        """Clean up expired tokens"""
        cleaned_count = 0
        now = datetime.utcnow()
        
        # Clean up expired access tokens
        tokens_to_remove = []
        for token, metadata in self.access_tokens.items():
            if now > metadata["expires_at"]:
                tokens_to_remove.append(token)
        
        for token in tokens_to_remove:
            del self.access_tokens[token]
            cleaned_count += 1
        
        # Clean up expired refresh tokens
        tokens_to_remove = []
        for token, metadata in self.refresh_tokens.items():
            if now > metadata["expires_at"]:
                tokens_to_remove.append(token)
        
        for token in tokens_to_remove:
            del self.refresh_tokens[token]
            cleaned_count += 1
        
        return cleaned_count
    
    def get_token_statistics(self) -> Dict[str, Any]:
        """Get token statistics"""
        now = datetime.utcnow()
        
        active_access_tokens = len(self.access_tokens)
        active_refresh_tokens = len(self.refresh_tokens)
        revoked_tokens = len(self.revoked_tokens)
        
        expired_access_tokens = 0
        expired_refresh_tokens = 0
        
        for metadata in self.access_tokens.values():
            if now > metadata["expires_at"]:
                expired_access_tokens += 1
        
        for metadata in self.refresh_tokens.values():
            if now > metadata["expires_at"]:
                expired_refresh_tokens += 1
        
        return {
            "active_access_tokens": active_access_tokens,
            "active_refresh_tokens": active_refresh_tokens,
            "revoked_tokens": revoked_tokens,
            "expired_access_tokens": expired_access_tokens,
            "expired_refresh_tokens": expired_refresh_tokens,
            "total_tokens": active_access_tokens + active_refresh_tokens + revoked_tokens
        }



