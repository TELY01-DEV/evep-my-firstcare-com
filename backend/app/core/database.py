"""
Database connection and utilities for EVEP Platform
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional

from app.core.config import settings

# Global database client
_database: Optional[AsyncIOMotorClient] = None

def get_database() -> AsyncIOMotorClient:
    """Get the database client instance"""
    global _database
    if _database is None:
        _database = AsyncIOMotorClient(settings.DATABASE_URL)
    return _database

def get_sync_database() -> MongoClient:
    """Get a synchronous database client for operations that require it"""
    return MongoClient(settings.DATABASE_URL)

async def close_database():
    """Close the database connection"""
    global _database
    if _database:
        _database.close()
        _database = None

# Database collections
def get_users_collection():
    """Get the users collection"""
    return get_database().evep.users

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
