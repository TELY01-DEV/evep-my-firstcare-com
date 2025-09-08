"""
Database connection and utilities for EVEP Platform
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional

from app.core.config import Config

# Global database client
_database: Optional[AsyncIOMotorClient] = None

def get_database() -> AsyncIOMotorClient:
    """Get the database client instance with authentication"""
    global _database
    if _database is None:
        # Use connection string from environment variable
        import os
        
        # Get MongoDB URL from environment variable
        connection_string = os.getenv("MONGODB_URL", "mongodb://mongo-primary:27017/evep")
        
        _database = AsyncIOMotorClient(
            connection_string, 
            serverSelectionTimeoutMS=5000,
            # Add security options
            ssl=False,  # Set to True in production with SSL certificates
            retryWrites=True,
            w='majority'  # Write concern for data consistency
        )
    return _database

def get_sync_database() -> MongoClient:
    """Get a synchronous database client with authentication"""
    import os
    
    # Get MongoDB URL from environment variable
    connection_string = os.getenv("MONGODB_URL", "mongodb://mongo-primary:27017/evep")
    
    return MongoClient(
        connection_string, 
        serverSelectionTimeoutMS=5000,
        ssl=False,  # Set to True in production with SSL certificates
        retryWrites=True,
        w='majority'  # Write concern for data consistency
    )

async def close_database():
    """Close the database connection"""
    global _database
    if _database:
        _database.close()
        _database = None

# RBAC Collection getters
def get_rbac_roles_collection():
    """Get RBAC roles collection"""
    db = get_database()
    return db.rbac_roles

def get_rbac_permissions_collection():
    """Get RBAC permissions collection"""
    db = get_database()
    return db.rbac_permissions

def get_rbac_user_roles_collection():
    """Get RBAC user roles collection"""
    db = get_database()
    return db.rbac_user_roles

# Database collections
def get_users_collection():
    """Get the users collection"""
    return get_database().evep.users

def get_admin_users_collection():
    """Get the admin users collection"""
    return get_database().evep.admin_users

def get_patients_collection():
    """Get the patients collection"""
    return get_database().evep.patients

def get_screenings_collection():
    """Get the screenings collection"""
    return get_database().evep.screenings

def get_ai_insights_collection():
    """Get the AI insights collection"""
    return get_database().evep.ai_insights

def get_analytics_data_collection():
    """Get the analytics data collection"""
    return get_database().evep.analytics_data

def get_audit_logs_collection():
    """Get the audit logs collection"""
    return get_database().evep.audit_logs

def get_vector_embeddings_collection():
    """Get the vector embeddings collection"""
    return get_database().evep.vector_embeddings

def get_prompt_templates_collection():
    """Get the prompt templates collection"""
    return get_database().evep.prompt_templates

def get_conversation_history_collection():
    """Get the conversation history collection"""
    return get_database().evep.conversation_history

def get_files_collection():
    """Get the files collection"""
    return get_database().evep.files
