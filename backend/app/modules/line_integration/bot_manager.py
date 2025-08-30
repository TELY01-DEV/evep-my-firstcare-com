"""
Simplified Bot Manager for EVEP Platform
Adapted from DiaCare Buddy project
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, UploadFile, File, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import json
import logging
import asyncio

from app.core.database import get_database
from app.modules.auth.services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", tags=["Bot Manager"])

# Database adapter
async def get_db():
    return get_database().evep

# Simple admin verification (placeholder)
async def verify_admin_token():
    """Simple admin verification - placeholder for now"""
    return True

def serialize_mongo_doc(doc):
    """Serialize MongoDB document, converting ObjectId to string, datetime to ISO format."""
    if doc is None:
        return None
    
    try:
        from bson import ObjectId
        if isinstance(doc, ObjectId):
            return str(doc)
        elif isinstance(doc, datetime):
            return doc.isoformat()
        elif isinstance(doc, dict):
            serialized = {}
            for key, value in doc.items():
                try:
                    if isinstance(value, ObjectId):
                        serialized[key] = str(value)
                    elif isinstance(value, dict):
                        serialized[key] = serialize_mongo_doc(value)
                    elif isinstance(value, list):
                        serialized[key] = [serialize_mongo_doc(item) for item in value]
                    elif isinstance(value, datetime):
                        serialized[key] = value.isoformat()
                    else:
                        serialized[key] = value
                except Exception as e:
                    logger.error(f"Error serializing key '{key}': {str(e)}")
                    serialized[key] = str(value) if hasattr(value, '__str__') else f"<{type(value).__name__}>"
            return serialized
        elif isinstance(doc, list):
            return [serialize_mongo_doc(item) for item in doc]
        else:
            return str(doc) if hasattr(doc, '__str__') else f"<{type(doc).__name__}>"
    except Exception as e:
        logger.error(f"Error serializing MongoDB document: {str(e)}")
        return str(doc) if hasattr(doc, '__str__') else f"<{type(doc).__name__}>"

# Pydantic models
class BotSettings(BaseModel):
    channel_id: str
    channel_access_token: str
    channel_secret: str
    webhook_url: str
    display_name: str
    status_message: Optional[str] = None
    is_production: bool = False
    rate_limit_per_second: int = 1000
    monthly_message_limit: int = 1000000

class KeywordReply(BaseModel):
    keywords: List[str]
    message_type: str = "text"
    content: Dict[str, Any]
    priority: int = 1
    is_active: bool = True

class FlexMessage(BaseModel):
    name: str
    purpose: str
    content: Dict[str, Any]
    is_active: bool = True

class RichMenu(BaseModel):
    name: str
    size: str = "full"
    selected: bool = False
    chat_bar_text: str = "Menu"
    areas: List[Dict[str, Any]]

# Bot Settings Endpoints
@router.get("/settings")
async def get_bot_settings():
    """Get LINE Bot settings"""
    try:
        db = await get_db()
        settings = await db.bot_settings.find_one({})
        if settings:
            return {
                "status": "success",
                "data": serialize_mongo_doc(settings)
            }
        else:
            return {
                "status": "success",
                "data": {
                "channel_id": "",
                "channel_access_token": "",
                    "channel_secret": "",
                "webhook_url": "",
                "display_name": "",
                    "status_message": "",
                "is_production": False,
                    "rate_limit_per_second": 1000,
                    "monthly_message_limit": 1000000
                }
            }
    except Exception as e:
        logger.error(f"Error getting bot settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
async def update_bot_settings(settings: BotSettings):
    """Update LINE Bot settings"""
    try:
        db = await get_db()
        settings_dict = settings.dict()
        settings_dict["updated_at"] = datetime.utcnow()
        
                    await db.bot_settings.update_one(
                        {},
            {"$set": settings_dict},
                        upsert=True
                    )
        
        return {
            "status": "success",
            "message": "Bot settings updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating bot settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Keyword Reply Endpoints
@router.get("/keyword-replies")
async def get_keyword_replies():
    """Get all keyword replies"""
    try:
        db = await get_db()
        keywords = await db.keyword_replies.find().sort("priority", -1).to_list(None)
            return {
            "status": "success",
            "data": [serialize_mongo_doc(kw) for kw in keywords]
        }
    except Exception as e:
        logger.error(f"Error getting keyword replies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/keyword-replies")
async def create_keyword_reply(keyword: KeywordReply):
    """Create new keyword reply"""
    try:
        db = await get_db()
        keyword_dict = keyword.dict()
        keyword_dict["created_at"] = datetime.utcnow()
        keyword_dict["updated_at"] = datetime.utcnow()
        
        result = await db.keyword_replies.insert_one(keyword_dict)
        
        return {
            "status": "success",
            "data": {
                "id": str(result.inserted_id),
                **keyword_dict
            }
                }
        except Exception as e:
        logger.error(f"Error creating keyword reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/keyword-replies/{keyword_id}")
async def update_keyword_reply(
    keyword_id: str,
    keyword: KeywordReply,
    
):
    """Update keyword reply"""
    try:
        from bson import ObjectId
        db = await get_db()
        
        keyword_dict = keyword.dict()
        keyword_dict["updated_at"] = datetime.utcnow()
        
        result = await db.keyword_replies.update_one(
            {"_id": ObjectId(keyword_id)},
            {"$set": keyword_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Keyword reply not found")
        
        return {
            "status": "success",
            "message": "Keyword reply updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating keyword reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/keyword-replies/{keyword_id}")
async def delete_keyword_reply(
    keyword_id: str,
    
):
    """Delete keyword reply"""
    try:
        from bson import ObjectId
        db = await get_db()
        
        result = await db.keyword_replies.delete_one({"_id": ObjectId(keyword_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Keyword reply not found")
        
        return {
            "status": "success",
            "message": "Keyword reply deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting keyword reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Flex Message Endpoints
@router.get("/flex-messages")
async def get_flex_messages():
    """Get all Flex Messages"""
    try:
        db = await get_db()
        messages = await db.system_flex_messages.find().sort("created_at", -1).to_list(None)
        return {
            "status": "success",
            "data": [serialize_mongo_doc(msg) for msg in messages]
        }
    except Exception as e:
        logger.error(f"Error getting flex messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flex-messages")
async def create_flex_message(
    message: FlexMessage,
    
):
    """Create new Flex Message"""
    try:
        db = await get_db()
        message_dict = message.dict()
        message_dict["created_at"] = datetime.utcnow()
        message_dict["updated_at"] = datetime.utcnow()
        
        result = await db.system_flex_messages.insert_one(message_dict)
        
        return {
            "status": "success",
            "data": {
                "id": str(result.inserted_id),
                **message_dict
            }
        }
        except Exception as e:
        logger.error(f"Error creating flex message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/flex-messages/{message_id}")
async def update_flex_message(
    message_id: str,
    message: FlexMessage,
    
):
    """Update Flex Message"""
    try:
        from bson import ObjectId
        db = await get_db()
        
        message_dict = message.dict()
        message_dict["updated_at"] = datetime.utcnow()
        
        result = await db.system_flex_messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": message_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Flex message not found")
        
        return {
            "status": "success",
            "message": "Flex message updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating flex message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/flex-messages/{message_id}")
async def delete_flex_message(
    message_id: str,
    
):
    """Delete Flex Message"""
    try:
            from bson import ObjectId
        db = await get_db()
        
        result = await db.system_flex_messages.delete_one({"_id": ObjectId(message_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Flex message not found")
        
        return {
            "status": "success",
            "message": "Flex message deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting flex message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rich Menu Endpoints
@router.get("/rich-menus")
async def get_rich_menus():
    """Get all Rich Menus"""
    try:
        db = await get_db()
        menus = await db.rich_menus.find().sort("created_at", -1).to_list(None)
        return {
            "status": "success",
            "data": [serialize_mongo_doc(menu) for menu in menus]
        }
    except Exception as e:
        logger.error(f"Error getting rich menus: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rich-menus")
async def create_rich_menu(
    menu: RichMenu,
    
):
    """Create new Rich Menu"""
    try:
        db = await get_db()
        menu_dict = menu.dict()
        menu_dict["created_at"] = datetime.utcnow()
        menu_dict["updated_at"] = datetime.utcnow()
        menu_dict["status"] = "active"
        
        result = await db.rich_menus.insert_one(menu_dict)
        
        return {
            "status": "success",
            "data": {
                "id": str(result.inserted_id),
                **menu_dict
            }
        }
    except Exception as e:
        logger.error(f"Error creating rich menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rich-menus/{menu_id}")
async def delete_rich_menu(
    menu_id: str,
    
):
    """Delete Rich Menu"""
    try:
        from bson import ObjectId
        db = await get_db()
        
        result = await db.rich_menus.delete_one({"_id": ObjectId(menu_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Rich menu not found")
        
        return {
            "status": "success",
            "message": "Rich menu deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting rich menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints
@router.get("/analytics")
async def get_bot_analytics(
    time_period: str = "30d",
    
):
    """Get bot analytics"""
    try:
        db = await get_db()
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_period == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_period == "30d":
            start_date = end_date - timedelta(days=30)
        elif time_period == "90d":
            start_date = end_date - timedelta(days=90)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get message statistics
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        message_stats = await db.line_messages.aggregate(pipeline).to_list(None)
        
        # Get user statistics
        total_users = await db.line_users.count_documents({})
        active_users = await db.line_users.count_documents({
            "last_activity": {"$gte": start_date}
        })
            
            return {
            "status": "success",
            "data": {
                "time_period": time_period,
                "total_users": total_users,
                "active_users": active_users,
                "messages_by_type": {stat["_id"]: stat["count"] for stat in message_stats},
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoints
@router.post("/test-webhook")
async def test_webhook():
    """Test webhook connection"""
    try:
        return {
            "status": "success",
            "message": "Webhook test endpoint - implement actual LINE API test here"
        }
    except Exception as e:
        logger.error(f"Error testing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bot-profile")
async def get_bot_profile():
    """Get bot profile information"""
    try:
        return {
            "status": "success",
            "data": {
                "display_name": "EVEP Bot",
                "picture_url": "",
                "status_message": "Vision screening assistant",
                "chat_mode": "chat",
                "mark_as_read_mode": "auto"
            }
        }
    except Exception as e:
        logger.error(f"Error getting bot profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
