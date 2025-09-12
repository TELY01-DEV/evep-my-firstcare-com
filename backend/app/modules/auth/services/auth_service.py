import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.core.config import Config, settings
from app.core.database import get_database
from app.shared.models.user import User, UserCreate, UserRole, UserStatus

class AuthService:
    def __init__(self):
        self.config = Config.get_module_config("auth")
        # Use JWT secret from configuration
        jwt_secret = os.getenv("JWT_SECRET_KEY")
        if not jwt_secret:
            raise ValueError("JWT_SECRET_KEY environment variable is required")
        self.jwt_secret = jwt_secret
        print(f"🔐 AuthService JWT Secret: {self.jwt_secret[:10]}... (from env)")
        self.jwt_expires_in = self.config.get("config", {}).get("jwt_expires_in", "24h")
        self.bcrypt_rounds = self.config.get("config", {}).get("bcrypt_rounds", 12)
        self.db = None
        self.sessions = {}
    
    async def initialize(self) -> None:
        """Initialize the authentication service"""
        # Connect to database
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize sessions storage
        self.sessions = {}
    

    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt(rounds=self.bcrypt_rounds)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_jwt_token(self, user_data: Dict[str, Any]) -> str:
        """Create a JWT token for a user"""
        # Handle MongoDB ObjectId
        user_id = user_data.get("id") or str(user_data.get("_id"))
        
        payload = {
            "user_id": user_id,
            "email": user_data["email"],
            "role": user_data["role"],
            "token_type": "access",
            "exp": int((datetime.utcnow() + timedelta(hours=int(os.getenv("JWT_EXPIRATION_HOURS", "24")))).timestamp()),
            "iat": int(datetime.utcnow().timestamp())
        }
        

        
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate a user and return login response"""
        print(f"🔐 Login attempt for email: {email}")
        
        # First check admin_users collection
        admin_user = await self.db.admin_users.find_one({"email": email})
        if admin_user:
            print(f"✅ Found admin user: {admin_user['email']}")
            # Verify password
            print(f"🔐 Verifying password for admin user...")
            if not self.verify_password(password, admin_user["password_hash"]):
                print(f"❌ Password verification failed for admin user")
                raise ValueError("Invalid credentials")
            print(f"✅ Password verification successful for admin user")
            
            # Check if user is active
            if admin_user.get("is_active", True) is False:
                raise ValueError("User account is not active")
            
            # Create JWT token
            try:
                token = self.create_jwt_token(admin_user)
            except Exception as e:
                raise
            
            # Update last login
            await self.db.admin_users.update_one(
                {"_id": admin_user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            # Store session
            self.sessions[token] = {
                "user_id": str(admin_user["_id"]),
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=24)
            }
            
            # Construct name from first_name and last_name
            name = admin_user.get("name")
            if not name:
                first_name = admin_user.get("first_name", "")
                last_name = admin_user.get("last_name", "")
                name = f"{first_name} {last_name}".strip()
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "expires_in": 86400,  # 24 hours
                "user": {
                    "id": str(admin_user["_id"]),
                    "email": admin_user["email"],
                    "name": name,
                    "role": admin_user["role"],
                    "status": "active" if admin_user.get("is_active", True) else "inactive"
                }
            }
        
        # If not found in admin_users, check users collection
        print(f"🔍 Checking users collection for email: {email}")
        user = await self.db.users.find_one({"email": email})
        if user:
            print(f"✅ Found medical user: {user['email']}")
            # Verify password
            if not self.verify_password(password, user["password_hash"]):
                raise ValueError("Invalid credentials")
            
            # Check if user is active
            if user.get("is_active", True) is False:
                raise ValueError("User account is not active")
            
            # Create JWT token
            print(f"🔐 Creating JWT token for medical user...")
            try:
                token = self.create_jwt_token(user)
                print(f"✅ JWT token created successfully: {token[:50]}...")
            except Exception as e:
                print(f"❌ JWT token creation failed: {e}")
                raise
            
            # Update last login
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            # Store session
            self.sessions[token] = {
                "user_id": str(user["_id"]),
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=24)
            }
            
            # Construct name from first_name and last_name
            name = user.get("name")
            if not name:
                first_name = user.get("first_name", "")
                last_name = user.get("last_name", "")
                name = f"{first_name} {last_name}".strip()
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "expires_in": 86400,  # 24 hours
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": name,
                    "role": user["role"],
                    "status": "active" if user.get("is_active", True) else "inactive"
                }
            }
        
        # If user not found in either collection
        print(f"❌ User not found in either collection: {email}")
        raise ValueError("Invalid credentials")
    
    async def logout(self, token: str) -> Dict[str, str]:
        """Logout a user by invalidating their token"""
        if token in self.sessions:
            del self.sessions[token]
        
        return {"message": "Successfully logged out"}
    
    async def create_user(self, user_create: UserCreate) -> User:
        """Create a new user"""
        # Check if user already exists in either collection
        existing_admin = await self.db.admin_users.find_one({"email": user_create.email})
        existing_user = await self.db.users.find_one({"email": user_create.email})
        
        if existing_admin or existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        password_hash = self.hash_password(user_create.password)
        
        # Create user document
        user_doc = {
            "email": user_create.email,
            "name": user_create.name,
            "role": user_create.role,
            "password_hash": password_hash,
            "is_active": True,
            "profile": user_create.profile or {},
            "permissions": user_create.permissions or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Determine which collection to use based on role
        if user_create.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            result = await self.db.admin_users.insert_one(user_doc)
            collection = "admin_users"
        else:
            result = await self.db.users.insert_one(user_doc)
            collection = "users"
        
        # Create User object for return
        user = User(
            id=str(result.inserted_id),
            email=user_create.email,
            name=user_create.name,
            role=user_create.role,
            status=UserStatus.ACTIVE,
            profile=user_create.profile or {},
            permissions=user_create.permissions or []
        )
        
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        for user_data in self.users.values():
            if user_data["email"] == email:
                return User(**user_data)
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by ID"""
        if user_id in self.users:
            return User(**self.users[user_id])
        return None
    
    async def update_user_last_login(self, user_id: str) -> None:
        """Update user's last login timestamp"""
        if user_id in self.users:
            self.users[user_id]["last_login"] = datetime.utcnow().isoformat()
    
    def is_token_valid(self, token: str) -> bool:
        """Check if a token is valid"""
        if token not in self.sessions:
            return False
        
        session = self.sessions[token]
        if datetime.utcnow() > session["expires_at"]:
            del self.sessions[token]
            return False
        
        return True
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user data from a valid token"""
        if not self.is_token_valid(token):
            return None
        
        session = self.sessions[token]
        user_id = session["user_id"]
        
        if user_id in self.users:
            return self.users[user_id]
        
        return None



