"""
MongoDB-based Settings Manager for EVEP Platform
================================================

This module provides a flexible settings management system that stores
dynamic configuration in MongoDB while keeping sensitive data in environment variables.
"""

from typing import Any, Dict, Optional, List
from datetime import datetime
import json
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.core.database import get_database
from app.core.config import settings

class SettingsManager:
    """MongoDB-based settings manager for dynamic configuration"""
    
    def __init__(self):
        self.collection_name = "system_settings"
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
    
    def get_collection(self):
        """Get the settings collection"""
        return get_database().evep[self.collection_name]
    
    async def get_setting(self, key: str, default: Any = None) -> Any:
        """Get a setting value from MongoDB"""
        try:
            # Check cache first
            if key in self.cache:
                cached_item = self.cache[key]
                if datetime.now().timestamp() - cached_item['timestamp'] < self.cache_ttl:
                    return cached_item['value']
            
            collection = self.get_collection()
            doc = await collection.find_one({"key": key})
            
            if doc:
                value = doc.get("value", default)
                # Update cache
                self.cache[key] = {
                    'value': value,
                    'timestamp': datetime.now().timestamp()
                }
                return value
            
            return default
            
        except Exception as e:
            print(f"Error getting setting {key}: {e}")
            return default
    
    async def set_setting(self, key: str, value: Any, category: str = "general", description: str = "") -> bool:
        """Set a setting value in MongoDB"""
        try:
            collection = self.get_collection()
            
            # Prepare the document
            doc = {
                "key": key,
                "value": value,
                "category": category,
                "description": description,
                "updated_at": datetime.now(),
                "updated_by": "system"  # TODO: Get from current user
            }
            
            # Upsert the setting
            result = await collection.update_one(
                {"key": key},
                {"$set": doc},
                upsert=True
            )
            
            # Update cache
            self.cache[key] = {
                'value': value,
                'timestamp': datetime.now().timestamp()
            }
            
            return result.acknowledged
            
        except Exception as e:
            print(f"Error setting {key}: {e}")
            return False
    
    async def delete_setting(self, key: str) -> bool:
        """Delete a setting from MongoDB"""
        try:
            collection = self.get_collection()
            result = await collection.delete_one({"key": key})
            
            # Remove from cache
            if key in self.cache:
                del self.cache[key]
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting setting {key}: {e}")
            return False
    
    async def get_settings_by_category(self, category: str) -> Dict[str, Any]:
        """Get all settings for a specific category"""
        try:
            collection = self.get_collection()
            cursor = collection.find({"category": category})
            settings = {}
            
            async for doc in cursor:
                settings[doc["key"]] = doc["value"]
            
            return settings
            
        except Exception as e:
            print(f"Error getting settings for category {category}: {e}")
            return {}
    
    async def get_all_settings(self) -> Dict[str, Any]:
        """Get all settings from MongoDB"""
        try:
            collection = self.get_collection()
            cursor = collection.find({})
            settings = {}
            
            async for doc in cursor:
                settings[doc["key"]] = {
                    "value": doc["value"],
                    "category": doc.get("category", "general"),
                    "description": doc.get("description", ""),
                    "updated_at": doc.get("updated_at"),
                    "updated_by": doc.get("updated_by", "system")
                }
            
            return settings
            
        except Exception as e:
            print(f"Error getting all settings: {e}")
            return {}
    
    async def initialize_default_settings(self):
        """Initialize default settings in MongoDB"""
        default_settings = {
            # System Settings
            "system.maintenance_mode": {
                "value": False,
                "category": "system",
                "description": "Enable/disable maintenance mode"
            },
            "system.debug_mode": {
                "value": settings.DEBUG,
                "category": "system",
                "description": "Enable/disable debug mode"
            },
            "system.timezone": {
                "value": "Asia/Bangkok",
                "category": "system",
                "description": "System timezone"
            },
            
            # User Management Settings
            "user.registration_enabled": {
                "value": True,
                "category": "user",
                "description": "Enable/disable user registration"
            },
            "user.email_verification_required": {
                "value": True,
                "category": "user",
                "description": "Require email verification for new users"
            },
            "user.max_login_attempts": {
                "value": 5,
                "category": "user",
                "description": "Maximum failed login attempts before lockout"
            },
            "user.lockout_duration_minutes": {
                "value": 30,
                "category": "user",
                "description": "Account lockout duration in minutes"
            },
            
            # Security Settings
            "security.password_min_length": {
                "value": 8,
                "category": "security",
                "description": "Minimum password length"
            },
            "security.password_require_special": {
                "value": True,
                "category": "security",
                "description": "Require special characters in passwords"
            },
            "security.session_timeout_hours": {
                "value": 24,
                "category": "security",
                "description": "Session timeout in hours"
            },
            "security.rate_limit_requests": {
                "value": 100,
                "category": "security",
                "description": "Rate limit requests per minute"
            },
            
            # Email Settings
            "email.smtp_host": {
                "value": "smtp.gmail.com",
                "category": "email",
                "description": "SMTP server host"
            },
            "email.smtp_port": {
                "value": 587,
                "category": "email",
                "description": "SMTP server port"
            },
            "email.from_address": {
                "value": "noreply@evep.my-firstcare.com",
                "category": "email",
                "description": "Default from email address"
            },
            "email.from_name": {
                "value": "EVEP Platform",
                "category": "email",
                "description": "Default from name"
            },
            
            # Notification Settings
            "notification.email_enabled": {
                "value": True,
                "category": "notification",
                "description": "Enable email notifications"
            },
            "notification.sms_enabled": {
                "value": False,
                "category": "notification",
                "description": "Enable SMS notifications"
            },
            "notification.push_enabled": {
                "value": False,
                "category": "notification",
                "description": "Enable push notifications"
            },
            
            # File Storage Settings
            "storage.max_file_size_mb": {
                "value": 10,
                "category": "storage",
                "description": "Maximum file size in MB"
            },
            "storage.allowed_file_types": {
                "value": ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
                "category": "storage",
                "description": "Allowed file types for upload"
            },
            "storage.auto_cleanup_days": {
                "value": 30,
                "category": "storage",
                "description": "Auto cleanup old files after days"
            },
            
            # Analytics Settings
            "analytics.enabled": {
                "value": True,
                "category": "analytics",
                "description": "Enable analytics tracking"
            },
            "analytics.retention_days": {
                "value": 365,
                "category": "analytics",
                "description": "Analytics data retention in days"
            },
            "analytics.privacy_mode": {
                "value": False,
                "category": "analytics",
                "description": "Enable privacy mode (no personal data)"
            }
        }
        
        # Initialize each setting
        for key, config in default_settings.items():
            await self.set_setting(
                key=key,
                value=config["value"],
                category=config["category"],
                description=config["description"]
            )
        
        print(f"✅ Initialized {len(default_settings)} default settings")
    
    async def get_combined_config(self) -> Dict[str, Any]:
        """Get combined configuration from environment and MongoDB"""
        # Start with environment-based settings
        combined_config = {
            "app_name": settings.APP_NAME,
            "app_version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "database_url": settings.DATABASE_URL,
            "redis_url": settings.REDIS_URL,
            "cors_origins": settings.CORS_ORIGINS,
            "jwt_expiration_hours": settings.JWT_EXPIRATION_HOURS,
        }
        
        # Add MongoDB-based settings
        mongo_settings = await self.get_all_settings()
        for key, value in mongo_settings.items():
            if isinstance(value, dict):
                combined_config[key] = value["value"]
            else:
                combined_config[key] = value
        
        return combined_config

# Create global settings manager instance
settings_manager = SettingsManager()



