from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.shared.models.user import User, UserCreate, UserUpdate, UserRole, UserStatus
from app.core.database import get_users_collection, get_admin_users_collection

class UserService:
    def __init__(self):
        pass
    
    async def initialize(self) -> None:
        """Initialize the user service with database connection"""
        pass
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all users with pagination"""
        users_collection = get_users_collection()
        admin_users_collection = get_admin_users_collection()
        
        # Get users from both collections
        users_cursor = users_collection.find({}).skip(skip).limit(limit)
        admin_users_cursor = admin_users_collection.find({}).skip(skip).limit(limit)
        
        users = await users_cursor.to_list(length=None)
        admin_users = await admin_users_cursor.to_list(length=None)
        
        # Convert to response format
        all_users = []
        for user in users:
            all_users.append({
                "id": str(user["_id"]),
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                "role": user["role"],
                "organization": user.get("organization", ""),
                "phone": user.get("phone", ""),
                "is_active": user.get("is_active", True),
                "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
            })
        
        for user in admin_users:
            all_users.append({
                "id": str(user["_id"]),
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                "role": user["role"],
                "organization": user.get("organization", ""),
                "phone": user.get("phone", ""),
                "is_active": user.get("is_active", True),
                "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
            })
        
        return all_users
    
    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get a user by ID"""
        try:
            admin_users_collection = get_admin_users_collection()
            users_collection = get_users_collection()
            
            # Try admin_users collection first
            admin_user = await admin_users_collection.find_one({"_id": ObjectId(user_id)})
            if admin_user:
                return {
                    "id": str(admin_user["_id"]),
                    "email": admin_user["email"],
                    "first_name": admin_user.get("first_name", ""),
                    "last_name": admin_user.get("last_name", ""),
                    "name": admin_user.get("name") or f"{admin_user.get('first_name', '')} {admin_user.get('last_name', '')}".strip(),
                    "role": admin_user["role"],
                    "organization": admin_user.get("organization", ""),
                    "phone": admin_user.get("phone", ""),
                    "is_active": admin_user.get("is_active", True),
                    "created_at": admin_user.get("created_at", datetime.utcnow()).isoformat(),
                    "last_login": admin_user.get("last_login", "").isoformat() if admin_user.get("last_login") else None
                }
            
            # Try users collection
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    "role": user["role"],
                    "organization": user.get("organization", ""),
                    "phone": user.get("phone", ""),
                    "is_active": user.get("is_active", True),
                    "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                    "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
                }
            
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    async def create_user(self, user_create: UserCreate) -> Dict:
        """Create a new user"""
        users_collection = get_users_collection()
        admin_users_collection = get_admin_users_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_create.email})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        existing_admin = await admin_users_collection.find_one({"email": user_create.email})
        if existing_admin:
            raise ValueError("User with this email already exists")
        
        # Create user document
        user_doc = {
            "email": user_create.email,
            "first_name": user_create.first_name,
            "last_name": user_create.last_name,
            "role": user_create.role,
            "organization": user_create.organization,
            "phone": user_create.phone,
            "is_active": user_create.is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into appropriate collection
        if user_create.role in ["admin", "super_admin"]:
            result = await admin_users_collection.insert_one(user_doc)
        else:
            result = await users_collection.insert_one(user_doc)
        
        user_doc["_id"] = result.inserted_id
        return {
            "id": str(user_doc["_id"]),
            "email": user_doc["email"],
            "first_name": user_doc["first_name"],
            "last_name": user_doc["last_name"],
            "name": f"{user_doc['first_name']} {user_doc['last_name']}".strip(),
            "role": user_doc["role"],
            "organization": user_doc["organization"],
            "phone": user_doc["phone"],
            "is_active": user_doc["is_active"],
            "created_at": user_doc["created_at"].isoformat(),
            "last_login": None
        }
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[Dict]:
        """Update a user"""
        try:
            admin_users_collection = get_admin_users_collection()
            users_collection = get_users_collection()
            
            update_data = {"updated_at": datetime.utcnow()}
            
            if user_update.email is not None:
                update_data["email"] = user_update.email
            if user_update.first_name is not None:
                update_data["first_name"] = user_update.first_name
            if user_update.last_name is not None:
                update_data["last_name"] = user_update.last_name
            if user_update.role is not None:
                update_data["role"] = user_update.role
            if user_update.organization is not None:
                update_data["organization"] = user_update.organization
            if user_update.phone is not None:
                update_data["phone"] = user_update.phone
            if user_update.is_active is not None:
                update_data["is_active"] = user_update.is_active
            
            # Try to update in admin_users collection
            result = await admin_users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                # Try users collection
                result = await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": update_data}
                )
            
            if result.matched_count > 0:
                return await self.get_user(user_id)
            
            return None
        except Exception as e:
            print(f"Error updating user: {e}")
            return None
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete a user"""
        try:
            admin_users_collection = get_admin_users_collection()
            users_collection = get_users_collection()
            
            # Try to delete from admin_users collection
            result = await admin_users_collection.delete_one({"_id": ObjectId(user_id)})
            
            if result.deleted_count == 0:
                # Try users collection
                result = await users_collection.delete_one({"_id": ObjectId(user_id)})
            
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    # Admin user methods
    async def get_all_admin_users(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all admin users"""
        admin_users_collection = get_admin_users_collection()
        cursor = admin_users_collection.find({}).skip(skip).limit(limit)
        admin_users = await cursor.to_list(length=None)
        
        return [{
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "role": user["role"],
            "organization": user.get("organization", ""),
            "phone": user.get("phone", ""),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
            "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
        } for user in admin_users]
    
    async def get_admin_user(self, user_id: str) -> Optional[Dict]:
        """Get an admin user by ID"""
        try:
            admin_users_collection = get_admin_users_collection()
            user = await admin_users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    "role": user["role"],
                    "organization": user.get("organization", ""),
                    "phone": user.get("phone", ""),
                    "is_active": user.get("is_active", True),
                    "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                    "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
                }
            return None
        except Exception as e:
            print(f"Error getting admin user: {e}")
            return None
    
    async def create_admin_user(self, user_create: UserCreate) -> Dict:
        """Create a new admin user"""
        if user_create.role not in ["admin", "super_admin"]:
            raise ValueError("Invalid role for admin user")
        
        return await self.create_user(user_create)
    
    async def update_admin_user(self, user_id: str, user_update: UserUpdate) -> Optional[Dict]:
        """Update an admin user"""
        try:
            admin_users_collection = get_admin_users_collection()
            
            update_data = {"updated_at": datetime.utcnow()}
            
            if user_update.email is not None:
                update_data["email"] = user_update.email
            if user_update.first_name is not None:
                update_data["first_name"] = user_update.first_name
            if user_update.last_name is not None:
                update_data["last_name"] = user_update.last_name
            if user_update.role is not None:
                update_data["role"] = user_update.role
            if user_update.organization is not None:
                update_data["organization"] = user_update.organization
            if user_update.phone is not None:
                update_data["phone"] = user_update.phone
            if user_update.is_active is not None:
                update_data["is_active"] = user_update.is_active
            
            result = await admin_users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                return await self.get_admin_user(user_id)
            
            return None
        except Exception as e:
            print(f"Error updating admin user: {e}")
            return None
    
    async def delete_admin_user(self, user_id: str) -> bool:
        """Delete an admin user"""
        try:
            admin_users_collection = get_admin_users_collection()
            result = await admin_users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting admin user: {e}")
            return False
    
    # Medical staff user methods
    async def get_all_medical_staff_users(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all medical staff users"""
        users_collection = get_users_collection()
        cursor = users_collection.find({}).skip(skip).limit(limit)
        users = await cursor.to_list(length=None)
        
        return [{
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "role": user["role"],
            "organization": user.get("organization", ""),
            "phone": user.get("phone", ""),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
            "last_login": user.get("last_login", "").isoformat() if isinstance(user.get("last_login"), datetime) else str(user.get("last_login", ""))
        } for user in users]
    
    async def get_medical_staff_user(self, user_id: str) -> Optional[Dict]:
        """Get a medical staff user by ID"""
        try:
            users_collection = get_users_collection()
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    "role": user["role"],
                    "organization": user.get("organization", ""),
                    "phone": user.get("phone", ""),
                    "is_active": user.get("is_active", True),
                    "created_at": user.get("created_at", datetime.utcnow()).isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
                    "last_login": user.get("last_login", "").isoformat() if isinstance(user.get("last_login"), datetime) else str(user.get("last_login", ""))
                }
            return None
        except Exception as e:
            print(f"Error getting medical staff user: {e}")
            return None
    
    async def create_medical_staff_user(self, user_create: UserCreate) -> Dict:
        """Create a new medical staff user"""
        if user_create.role not in ["doctor", "nurse", "teacher", "parent", "medical_staff", "exclusive_hospital"]:
            raise ValueError("Invalid role for medical staff user")
        
        return await self.create_user(user_create)
    
    async def update_medical_staff_user(self, user_id: str, user_update: UserUpdate) -> Optional[Dict]:
        """Update a medical staff user"""
        try:
            users_collection = get_users_collection()
            
            update_data = {"updated_at": datetime.utcnow()}
            
            if user_update.email is not None:
                update_data["email"] = user_update.email
            if user_update.first_name is not None:
                update_data["first_name"] = user_update.first_name
            if user_update.last_name is not None:
                update_data["last_name"] = user_update.last_name
            if user_update.role is not None:
                update_data["role"] = user_update.role
            if user_update.organization is not None:
                update_data["organization"] = user_update.organization
            if user_update.phone is not None:
                update_data["phone"] = user_update.phone
            if user_update.is_active is not None:
                update_data["is_active"] = user_update.is_active
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                return await self.get_medical_staff_user(user_id)
            
            return None
        except Exception as e:
            print(f"Error updating medical staff user: {e}")
            return None
    
    async def delete_medical_staff_user(self, user_id: str) -> bool:
        """Delete a medical staff user"""
        try:
            users_collection = get_users_collection()
            result = await users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting medical staff user: {e}")
            return False
    
    # Utility methods
    async def get_users_by_role(self, role: str) -> List[Dict]:
        """Get all users with a specific role"""
        admin_users_collection = get_admin_users_collection()
        users_collection = get_users_collection()
        
        admin_cursor = admin_users_collection.find({"role": role})
        users_cursor = users_collection.find({"role": role})
        
        admin_users = await admin_cursor.to_list(length=None)
        users = await users_cursor.to_list(length=None)
        
        all_users = admin_users + users
        
        return [{
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "role": user["role"],
            "organization": user.get("organization", ""),
            "phone": user.get("phone", ""),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
            "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
        } for user in all_users]
    
    async def get_active_users(self) -> List[Dict]:
        """Get all active users"""
        admin_users_collection = get_admin_users_collection()
        users_collection = get_users_collection()
        
        admin_cursor = admin_users_collection.find({"is_active": True})
        users_cursor = users_collection.find({"is_active": True})
        
        admin_users = await admin_cursor.to_list(length=None)
        users = await users_cursor.to_list(length=None)
        
        all_users = admin_users + users
        
        return [{
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "role": user["role"],
            "organization": user.get("organization", ""),
            "phone": user.get("phone", ""),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
            "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
        } for user in all_users]
    
    async def search_users(self, query: str) -> List[Dict]:
        """Search users by name or email"""
        admin_users_collection = get_admin_users_collection()
        users_collection = get_users_collection()
        
        query_lower = query.lower()
        
        # Search in admin_users collection
        admin_cursor = admin_users_collection.find({
            "$or": [
                {"email": {"$regex": query_lower, "$options": "i"}},
                {"first_name": {"$regex": query_lower, "$options": "i"}},
                {"last_name": {"$regex": query_lower, "$options": "i"}},
                {"name": {"$regex": query_lower, "$options": "i"}}
            ]
        })
        
        # Search in users collection
        users_cursor = users_collection.find({
            "$or": [
                {"email": {"$regex": query_lower, "$options": "i"}},
                {"first_name": {"$regex": query_lower, "$options": "i"}},
                {"last_name": {"$regex": query_lower, "$options": "i"}},
                {"name": {"$regex": query_lower, "$options": "i"}}
            ]
        })
        
        admin_users = await admin_cursor.to_list(length=None)
        users = await users_cursor.to_list(length=None)
        
        all_users = admin_users + users
        
        return [{
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "name": user.get("name") or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "role": user["role"],
            "organization": user.get("organization", ""),
            "phone": user.get("phone", ""),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
            "last_login": user.get("last_login", "").isoformat() if user.get("last_login") else None
        } for user in all_users]
    
    async def get_user_statistics(self) -> Dict[str, Any]:
        """Get user statistics"""
        admin_users_collection = get_admin_users_collection()
        users_collection = get_users_collection()
        
        admin_count = await admin_users_collection.count_documents({})
        users_count = await users_collection.count_documents({})
        active_admin_count = await admin_users_collection.count_documents({"is_active": True})
        active_users_count = await users_collection.count_documents({"is_active": True})
        
        total_users = admin_count + users_count
        active_users = active_admin_count + active_users_count
        
        # Get role distribution
        admin_roles_cursor = admin_users_collection.aggregate([
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ])
        
        user_roles_cursor = users_collection.aggregate([
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ])
        
        admin_roles = await admin_roles_cursor.to_list(length=None)
        user_roles = await user_roles_cursor.to_list(length=None)
        
        role_counts = {}
        for role_data in admin_roles + user_roles:
            role = role_data["_id"]
            count = role_data["count"]
            role_counts[role] = role_counts.get(role, 0) + count
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_count,
            "medical_staff_users": users_count,
            "role_distribution": role_counts
        }



