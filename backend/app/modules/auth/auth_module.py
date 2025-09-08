from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.base_module import BaseModule
from app.core.event_bus import event_bus
from app.core.config import Config
from app.shared.models.user import User, UserCreate, UserUpdate, UserRole, UserStatus
from .services.auth_service import AuthService
from .services.user_service import UserService
from .services.token_service import TokenService
from datetime import datetime

class AuthModule(BaseModule):
    def __init__(self):
        config = Config.get_module_config("auth")
        super().__init__("auth", config)
        
        # Initialize services
        self.auth_service = AuthService()
        self.user_service = UserService()
        self.token_service = TokenService()
        
        # Setup routes
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the module"""
        # Initialize services
        await self.auth_service.initialize()
        await self.user_service.initialize()
        await self.token_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("user.created", self._handle_user_created)
        event_bus.subscribe("user.updated", self._handle_user_updated)
        event_bus.subscribe("user.deleted", self._handle_user_deleted)
        event_bus.subscribe("user.login", self._handle_user_login)
        event_bus.subscribe("user.logout", self._handle_user_logout)
    
    def get_router(self) -> APIRouter:
        """Get the module's API router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get list of events this module emits"""
        return [
            "user.created",
            "user.updated", 
            "user.deleted",
            "user.login",
            "user.logout",
            "auth.failed",
            "token.created",
            "token.revoked"
        ]
    
    def _setup_routes(self) -> None:
        """Setup API routes"""
        
        @self.router.get("/health")
        async def health_check():
            """Health check endpoint for auth module"""
            return {
                "status": "healthy",
                "module": "auth",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Authentication routes
        @self.router.post("/login")
        async def login(credentials: Dict[str, str]):
            return await self._login(credentials)
        
        @self.router.post("/logout")
        async def logout(token: str = Depends(HTTPBearer())):
            return await self._logout(token)
        
        @self.router.post("/refresh")
        async def refresh(refresh_token: str):
            return await self._refresh_token(refresh_token)
        
        @self.router.post("/verify")
        async def verify(token: str = Depends(HTTPBearer())):
            return await self._verify_token(token)
        
        @self.router.get("/me")
        async def get_current_user(token: str = Depends(HTTPBearer())):
            return await self._get_current_user(token)
        
        @self.router.put("/profile/avatar")
        async def update_avatar(avatar_data: dict, token: str = Depends(HTTPBearer())):
            return await self._update_avatar(avatar_data, token)
        
        # User management routes
        @self.router.get("/users")
        async def get_users(skip: int = 0, limit: int = 100):
            return await self._get_all_users(skip, limit)
        
        @self.router.post("/users")
        async def create_user(user: UserCreate):
            return await self._create_user(user)
        
        @self.router.get("/users/{user_id}")
        async def get_user(user_id: str):
            return await self._get_user(user_id)
        
        @self.router.put("/users/{user_id}")
        async def update_user(user_id: str, user: UserUpdate):
            return await self._update_user(user_id, user)
        
        @self.router.delete("/users/{user_id}")
        async def delete_user(user_id: str):
            return await self._delete_user(user_id)
        
        # Admin user routes
        @self.router.get("/admin-users")
        async def get_admin_users(skip: int = 0, limit: int = 100):
            return await self._get_all_admin_users(skip, limit)
        
        @self.router.post("/admin-users")
        async def create_admin_user(user: UserCreate):
            return await self._create_admin_user(user)
        
        @self.router.get("/admin-users/{user_id}")
        async def get_admin_user(user_id: str):
            return await self._get_admin_user(user_id)
        
        @self.router.put("/admin-users/{user_id}")
        async def update_admin_user(user_id: str, user: UserUpdate):
            return await self._update_admin_user(user_id, user)
        
        @self.router.delete("/admin-users/{user_id}")
        async def delete_admin_user(user_id: str):
            return await self._delete_admin_user(user_id)
        
        # Medical staff user routes
        @self.router.get("/medical-staff-users")
        async def get_medical_staff_users(skip: int = 0, limit: int = 100):
            return await self._get_all_medical_staff_users(skip, limit)
        
        @self.router.post("/medical-staff-users")
        async def create_medical_staff_user(user: UserCreate):
            return await self._create_medical_staff_user(user)
        
        @self.router.get("/medical-staff-users/{user_id}")
        async def get_medical_staff_user(user_id: str):
            return await self._get_medical_staff_user(user_id)
        
        @self.router.put("/medical-staff-users/{user_id}")
        async def update_medical_staff_user(user_id: str, user: UserUpdate):
            return await self._update_medical_staff_user(user_id, user)
        
        @self.router.delete("/medical-staff-users/{user_id}")
        async def delete_medical_staff_user(user_id: str):
            return await self._delete_medical_staff_user(user_id)
    

    
    # Authentication endpoints
    async def _login(self, credentials: Dict[str, str]):
        """User login endpoint"""
        try:
            result = await self.auth_service.login(credentials["email"], credentials["password"])
            await event_bus.emit("user.login", result)
            return result
        except Exception as e:
            identifier = credentials.get("email") or credentials.get("username", "unknown")
            await event_bus.emit("auth.failed", {"email": identifier, "error": str(e)})
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    async def _logout(self, token: str = Depends(HTTPBearer())):
        """User logout endpoint"""
        try:
            result = await self.auth_service.logout(token.credentials)
            await event_bus.emit("user.logout", result)
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    async def _refresh_token(self, refresh_token: str):
        """Refresh access token endpoint"""
        try:
            result = await self.token_service.refresh_token(refresh_token)
            await event_bus.emit("token.created", result)
            return result
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    async def _verify_token(self, token: str = Depends(HTTPBearer())):
        """Verify token endpoint"""
        try:
            result = await self.token_service.verify_token(token.credentials)
            return result
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    async def _get_current_user(self, token: str = Depends(HTTPBearer())):
        """Get current user endpoint"""
        try:
            # Verify the token and get user data
            payload = self.auth_service.verify_jwt_token(token.credentials)
            if not payload:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            user_id = payload.get("user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            
            # Try to find user in admin_users collection first
            from bson import ObjectId
            try:
                admin_user = await self.auth_service.db.admin_users.find_one({"_id": ObjectId(user_id)})
                if admin_user:
                    return {
                        "id": str(admin_user["_id"]),
                        "email": admin_user["email"],
                        "first_name": admin_user.get("first_name", ""),
                        "last_name": admin_user.get("last_name", ""),
                        "avatar": admin_user.get("avatar"),
                        "name": admin_user.get("name", ""),
                        "role": admin_user["role"],
                        "status": "active" if admin_user.get("is_active", True) else "inactive"
                    }
            except:
                pass
            
            # If not found in admin_users, try users collection
            try:
                user = await self.auth_service.db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    name = user.get("name")
                    if not name:
                        first_name = user.get("first_name", "")
                        last_name = user.get("last_name", "")
                        name = f"{first_name} {last_name}".strip()
                    
                    return {
                        "id": str(user["_id"]),
                        "email": user["email"],
                        "first_name": user.get("first_name", ""),
                        "last_name": user.get("last_name", ""),
                        "avatar": user.get("avatar"),
                        "name": name,
                        "role": user["role"],
                        "status": "active" if user.get("is_active", True) else "inactive"
                    }
            except:
                pass
            
            raise HTTPException(status_code=404, detail="User not found")
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")
    
    async def _update_avatar(self, avatar_data: dict, token: str):
        """Update user avatar"""
        try:
            # Verify the token and get user data
            payload = self.auth_service.verify_jwt_token(token.credentials)
            if not payload:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            user_id = payload.get("user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            
            avatar_url = avatar_data.get("avatar_url", "")
            
            # Try to update in admin_users collection first
            from bson import ObjectId
            from datetime import datetime
            
            try:
                result = await self.auth_service.db.admin_users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"avatar": avatar_url, "updated_at": datetime.now().isoformat()}}
                )
                if result.matched_count > 0:
                    return {"success": True, "message": "Avatar updated successfully", "avatar_url": avatar_url}
            except:
                pass
            
            # If not found in admin_users, try users collection
            try:
                result = await self.auth_service.db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"avatar": avatar_url, "updated_at": datetime.now().isoformat()}}
                )
                if result.matched_count > 0:
                    return {"success": True, "message": "Avatar updated successfully", "avatar_url": avatar_url}
            except:
                pass
            
            raise HTTPException(status_code=404, detail="User not found")
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    # User management endpoints
    async def _get_all_users(self, skip: int = 0, limit: int = 100):
        """Get all users endpoint"""
        users = await self.user_service.get_all_users(skip, limit)
        return users
    
    async def _create_user(self, user: UserCreate):
        """Create user endpoint"""
        created_user = await self.auth_service.create_user(user)
        await event_bus.emit("user.created", created_user)
        return created_user
    
    async def _get_user(self, user_id: str):
        """Get user endpoint"""
        user = await self.user_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    
    async def _update_user(self, user_id: str, user: UserUpdate):
        """Update user endpoint"""
        updated_user = await self.user_service.update_user(user_id, user)
        await event_bus.emit("user.updated", updated_user)
        return updated_user
    
    async def _delete_user(self, user_id: str):
        """Delete user endpoint"""
        await self.user_service.delete_user(user_id)
        await event_bus.emit("user.deleted", {"user_id": user_id})
        return {"message": "User deleted"}
    
    # Admin user endpoints
    async def _get_all_admin_users(self, skip: int = 0, limit: int = 100):
        """Get all admin users endpoint"""
        users = await self.user_service.get_all_admin_users(skip, limit)
        return users
    
    async def _create_admin_user(self, user: UserCreate):
        """Create admin user endpoint"""
        if user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(status_code=400, detail="Invalid role for admin user")
        created_user = await self.auth_service.create_user(user)
        await event_bus.emit("user.created", created_user)
        return created_user
    
    async def _get_admin_user(self, user_id: str):
        """Get admin user endpoint"""
        user = await self.user_service.get_admin_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Admin user not found")
        return user
    
    async def _update_admin_user(self, user_id: str, user: UserUpdate):
        """Update admin user endpoint"""
        updated_user = await self.user_service.update_admin_user(user_id, user)
        await event_bus.emit("user.updated", updated_user)
        return updated_user
    
    async def _delete_admin_user(self, user_id: str):
        """Delete admin user endpoint"""
        await self.user_service.delete_admin_user(user_id)
        await event_bus.emit("user.deleted", {"user_id": user_id})
        return {"message": "Admin user deleted"}
    
    # Medical staff user endpoints
    async def _get_all_medical_staff_users(self, skip: int = 0, limit: int = 100):
        """Get all medical staff users endpoint"""
        users = await self.user_service.get_all_medical_staff_users(skip, limit)
        return users
    
    async def _create_medical_staff_user(self, user: UserCreate):
        """Create medical staff user endpoint"""
        if user.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.MEDICAL_STAFF, UserRole.EXCLUSIVE_HOSPITAL]:
            raise HTTPException(status_code=400, detail="Invalid role for medical staff user")
        created_user = await self.user_service.create_medical_staff_user(user)
        await event_bus.emit("user.created", created_user)
        return created_user
    
    async def _get_medical_staff_user(self, user_id: str):
        """Get medical staff user endpoint"""
        user = await self.user_service.get_medical_staff_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Medical staff user not found")
        return user
    
    async def _update_medical_staff_user(self, user_id: str, user: UserUpdate):
        """Update medical staff user endpoint"""
        updated_user = await self.user_service.update_medical_staff_user(user_id, user)
        await event_bus.emit("user.updated", updated_user)
        return updated_user
    
    async def _delete_medical_staff_user(self, user_id: str):
        """Delete medical staff user endpoint"""
        await self.user_service.delete_medical_staff_user(user_id)
        await event_bus.emit("user.deleted", {"user_id": user_id})
        return {"message": "Medical staff user deleted"}
    
    # Event handlers
    async def _handle_user_created(self, user: User) -> None:
        """Handle user created event"""
        # Log the event
        print(f"User created: {user.id}")
        
        # Trigger notifications
        await event_bus.emit("notification.send", {
            "type": "user_created",
            "data": user
        })
    
    async def _handle_user_updated(self, user: User) -> None:
        """Handle user updated event"""
        print(f"User updated: {user.id}")
        
        # Update audit log
        await event_bus.emit("audit.log", {
            "type": "user_updated",
            "data": user
        })
    
    async def _handle_user_deleted(self, data: Dict[str, Any]) -> None:
        """Handle user deleted event"""
        print(f"User deleted: {data['user_id']}")
        
        # Clean up related data
        await event_bus.emit("data.cleanup", {
            "type": "user_deleted",
            "user_id": data["user_id"]
        })
    
    async def _handle_user_login(self, data: Dict[str, Any]) -> None:
        """Handle user login event"""
        print(f"User login: {data.get('user_id')}")
        
        # Update last login
        await event_bus.emit("user.update_last_login", {
            "user_id": data.get("user_id"),
            "timestamp": data.get("timestamp")
        })
    
    async def _handle_user_logout(self, data: Dict[str, Any]) -> None:
        """Handle user logout event"""
        print(f"User logout: {data.get('user_id')}")
        
        # Revoke tokens
        await event_bus.emit("token.revoke", {
            "user_id": data.get("user_id")
        })



