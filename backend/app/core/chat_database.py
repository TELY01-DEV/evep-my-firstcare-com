"""
Database models and operations for Chat Bot system

This module provides database operations for:
- Chat conversations storage
- LLM suggestions and predefined messages
- Intent patterns and response templates
- AI/ML learning data
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database

# Collection names
CHAT_CONVERSATIONS_COLLECTION = "chat_conversations"
CHAT_SUGGESTIONS_COLLECTION = "chat_suggestions"
CHAT_INTENT_PATTERNS_COLLECTION = "chat_intent_patterns"
CHAT_RESPONSE_TEMPLATES_COLLECTION = "chat_response_templates"
CHAT_LEARNING_DATA_COLLECTION = "chat_learning_data"
AI_AGENT_CONFIGS_COLLECTION = "ai_agent_configs"

class ChatDatabase:
    """Database operations for chat bot system"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.conversations = db[CHAT_CONVERSATIONS_COLLECTION]
        self.suggestions = db[CHAT_SUGGESTIONS_COLLECTION]
        self.intent_patterns = db[CHAT_INTENT_PATTERNS_COLLECTION]
        self.response_templates = db[CHAT_RESPONSE_TEMPLATES_COLLECTION]
        self.learning_data = db[CHAT_LEARNING_DATA_COLLECTION]
        self.ai_agent_configs = db[AI_AGENT_CONFIGS_COLLECTION]

    # Conversation Management
    async def create_conversation(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """Create a new conversation"""
        conversation = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": {
                "total_messages": 0,
                "user_role": None,
                "intents_used": [],
                "satisfaction_score": None
            }
        }
        
        result = await self.conversations.insert_one(conversation)
        conversation["_id"] = result.inserted_id
        return conversation

    async def add_message_to_conversation(
        self, 
        conversation_id: str, 
        message: str, 
        is_user: bool, 
        intent: Optional[str] = None,
        confidence: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a message to an existing conversation"""
        message_data = {
            "message": message,
            "is_user": is_user,
            "timestamp": datetime.utcnow(),
            "intent": intent,
            "confidence": confidence,
            "metadata": metadata or {}
        }
        
        result = await self.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {"messages": message_data},
                "$set": {"updated_at": datetime.utcnow()},
                "$inc": {"metadata.total_messages": 1}
            }
        )
        
        # Update intent tracking
        if intent:
            await self.conversations.update_one(
                {"conversation_id": conversation_id},
                {"$addToSet": {"metadata.intents_used": intent}}
            )
        
        return result.modified_count > 0

    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        return await self.conversations.find_one({"conversation_id": conversation_id})

    async def get_user_conversations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's recent conversations"""
        cursor = self.conversations.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit)
        
        conversations = []
        async for conv in cursor:
            conversations.append(conv)
        return conversations

    async def update_conversation_metadata(
        self, 
        conversation_id: str, 
        metadata: Dict[str, Any]
    ) -> bool:
        """Update conversation metadata"""
        result = await self.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$set": {
                    "metadata": metadata,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    # Suggestions Management
    async def get_suggestions_by_role(self, user_role: str) -> List[Dict[str, Any]]:
        """Get suggestions based on user role"""
        cursor = self.suggestions.find(
            {
                "$or": [
                    {"target_roles": user_role},
                    {"target_roles": "all"},
                    {"target_roles": {"$exists": False}}
                ],
                "is_active": True
            }
        ).sort("priority", 1)
        
        suggestions = []
        async for suggestion in cursor:
            suggestions.append(suggestion)
        return suggestions

    async def create_suggestion(
        self, 
        text: str, 
        target_roles: List[str], 
        category: str,
        priority: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new suggestion"""
        suggestion = {
            "text": text,
            "target_roles": target_roles,
            "category": category,
            "priority": priority,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "usage_count": 0,
            "metadata": metadata or {}
        }
        
        result = await self.suggestions.insert_one(suggestion)
        return str(result.inserted_id)

    async def increment_suggestion_usage(self, suggestion_id: str) -> bool:
        """Increment usage count for a suggestion"""
        result = await self.suggestions.update_one(
            {"_id": ObjectId(suggestion_id)},
            {"$inc": {"usage_count": 1}}
        )
        return result.modified_count > 0

    # Intent Patterns Management
    async def get_intent_patterns(self) -> Dict[str, List[str]]:
        """Get all intent patterns from database"""
        cursor = self.intent_patterns.find({"is_active": True})
        
        patterns = {}
        async for pattern in cursor:
            intent_name = pattern["intent_name"]
            if intent_name not in patterns:
                patterns[intent_name] = []
            patterns[intent_name].extend(pattern["patterns"])
        
        return patterns

    async def create_intent_pattern(
        self, 
        intent_name: str, 
        patterns: List[str],
        description: Optional[str] = None
    ) -> str:
        """Create or update intent patterns"""
        pattern_doc = {
            "intent_name": intent_name,
            "patterns": patterns,
            "description": description,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.intent_patterns.replace_one(
            {"intent_name": intent_name},
            pattern_doc,
            upsert=True
        )
        
        if result.upserted_id:
            return str(result.upserted_id)
        else:
            # Find the existing document
            doc = await self.intent_patterns.find_one({"intent_name": intent_name})
            return str(doc["_id"])

    # Response Templates Management
    async def get_response_template(self, intent_name: str) -> Optional[Dict[str, Any]]:
        """Get response template for an intent"""
        return await self.response_templates.find_one({
            "intent_name": intent_name,
            "is_active": True
        })

    async def create_response_template(
        self, 
        intent_name: str, 
        response: str,
        suggestions: List[str],
        quick_actions: List[Dict[str, Any]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create or update response template"""
        template = {
            "intent_name": intent_name,
            "response": response,
            "suggestions": suggestions,
            "quick_actions": quick_actions,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        result = await self.response_templates.replace_one(
            {"intent_name": intent_name},
            template,
            upsert=True
        )
        
        if result.upserted_id:
            return str(result.upserted_id)
        else:
            doc = await self.response_templates.find_one({"intent_name": intent_name})
            return str(doc["_id"])

    # Learning Data Management
    async def store_learning_data(
        self, 
        user_id: str, 
        conversation_id: str,
        message: str,
        intent: str,
        confidence: float,
        response: str,
        user_feedback: Optional[str] = None
    ) -> str:
        """Store data for AI/ML learning"""
        learning_record = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "message": message,
            "intent": intent,
            "confidence": confidence,
            "response": response,
            "user_feedback": user_feedback,
            "timestamp": datetime.utcnow(),
            "metadata": {
                "user_role": None,  # Will be populated from user data
                "session_context": None,
                "response_time": None
            }
        }
        
        result = await self.learning_data.insert_one(learning_record)
        return str(result.inserted_id)

    async def get_learning_data(
        self, 
        user_id: Optional[str] = None,
        intent: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get learning data for analysis"""
        query = {}
        if user_id:
            query["user_id"] = user_id
        if intent:
            query["intent"] = intent
        
        cursor = self.learning_data.find(query).sort("timestamp", -1).limit(limit)
        
        data = []
        async for record in cursor:
            data.append(record)
        return data

    async def update_user_feedback(
        self, 
        learning_id: str, 
        feedback: str,
        satisfaction_score: Optional[int] = None
    ) -> bool:
        """Update user feedback for learning data"""
        update_data = {"user_feedback": feedback}
        if satisfaction_score is not None:
            update_data["satisfaction_score"] = satisfaction_score
        
        result = await self.learning_data.update_one(
            {"_id": ObjectId(learning_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    # Analytics and Insights
    async def get_conversation_analytics(
        self, 
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get conversation analytics"""
        pipeline = []
        
        # Match stage
        match_stage = {}
        if user_id:
            match_stage["user_id"] = user_id
        if start_date or end_date:
            match_stage["created_at"] = {}
            if start_date:
                match_stage["created_at"]["$gte"] = start_date
            if end_date:
                match_stage["created_at"]["$lte"] = end_date
        
        if match_stage:
            pipeline.append({"$match": match_stage})
        
        # Group stage
        pipeline.extend([
            {
                "$group": {
                    "_id": None,
                    "total_conversations": {"$sum": 1},
                    "total_messages": {"$sum": "$metadata.total_messages"},
                    "avg_messages_per_conversation": {"$avg": "$metadata.total_messages"},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "total_conversations": 1,
                    "total_messages": 1,
                    "avg_messages_per_conversation": {"$round": ["$avg_messages_per_conversation", 2]},
                    "unique_user_count": {"$size": "$unique_users"}
                }
            }
        ])
        
        result = await self.conversations.aggregate(pipeline).to_list(1)
        return result[0] if result else {}

    async def get_intent_usage_stats(self) -> List[Dict[str, Any]]:
        """Get intent usage statistics"""
        pipeline = [
            {"$unwind": "$metadata.intents_used"},
            {
                "$group": {
                    "_id": "$metadata.intents_used",
                    "usage_count": {"$sum": 1},
                    "unique_conversations": {"$addToSet": "$conversation_id"}
                }
            },
            {
                "$project": {
                    "intent": "$_id",
                    "usage_count": 1,
                    "unique_conversation_count": {"$size": "$unique_conversations"}
                }
            },
            {"$sort": {"usage_count": -1}}
        ]
        
        results = []
        async for result in self.conversations.aggregate(pipeline):
            results.append(result)
        return results

    # Learning Data Management
    async def store_learning_data(self, user_id: str, message: str, response: str, intent: str, confidence: float, agent_type: str = None):
        """Store learning data for AI improvement"""
        try:
            learning_data = {
                "user_id": user_id,
                "message": message,
                "response": response,
                "intent": intent,
                "confidence": confidence,
                "agent_type": agent_type,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            result = await self.learning_data.insert_one(learning_data)
            return result.inserted_id
        except Exception as e:
            print(f"Error storing learning data: {e}")
            return None
    
    async def store_conversation_turn(self, conversation_id: str, user_id: str, user_message: str, bot_response: str, agent_type: str = None, intent: str = None, confidence: float = None):
        """Store individual conversation turn for learning"""
        try:
            turn_data = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "user_message": user_message,
                "bot_response": bot_response,
                "agent_type": agent_type,
                "intent": intent,
                "confidence": confidence,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            result = await self.learning_data.insert_one(turn_data)
            return result.inserted_id
        except Exception as e:
            print(f"Error storing conversation turn: {e}")
            return None
    
    async def get_conversation_analytics(self, user_id: str = None, agent_type: str = None, days: int = 30):
        """Get conversation analytics for learning insights"""
        try:
            from datetime import timedelta
            
            query = {}
            if user_id:
                query["user_id"] = user_id
            if agent_type:
                query["agent_type"] = agent_type
            
            # Add date filter
            start_date = datetime.utcnow() - timedelta(days=days)
            query["timestamp"] = {"$gte": start_date}
            
            # Get conversation counts
            total_conversations = await self.learning_data.count_documents(query)
            
            # Get intent distribution
            intent_pipeline = [
                {"$match": query},
                {"$group": {"_id": "$intent", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            intent_distribution = await self.learning_data.aggregate(intent_pipeline).to_list(None)
            
            # Get agent type distribution
            agent_pipeline = [
                {"$match": query},
                {"$group": {"_id": "$agent_type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            agent_distribution = await self.learning_data.aggregate(agent_pipeline).to_list(None)
            
            # Get average confidence
            confidence_pipeline = [
                {"$match": {**query, "confidence": {"$exists": True}}},
                {"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence"}}}
            ]
            confidence_result = await self.learning_data.aggregate(confidence_pipeline).to_list(None)
            avg_confidence = confidence_result[0]["avg_confidence"] if confidence_result else 0
            
            return {
                "total_conversations": total_conversations,
                "intent_distribution": intent_distribution,
                "agent_distribution": agent_distribution,
                "average_confidence": avg_confidence,
                "period_days": days
            }
        except Exception as e:
            print(f"Error getting conversation analytics: {e}")
            return None

    # AI Agent Configuration Management
    async def get_agent_config(self, agent_type: str) -> Optional[Dict[str, Any]]:
        """Get AI agent configuration from database"""
        try:
            config = await self.ai_agent_configs.find_one({"agent_type": agent_type})
            return config
        except Exception as e:
            print(f"Error getting agent config: {e}")
            return None
    
    async def get_all_agent_configs(self) -> List[Dict[str, Any]]:
        """Get all AI agent configurations"""
        try:
            configs = []
            async for config in self.ai_agent_configs.find({}):
                configs.append(config)
            return configs
        except Exception as e:
            print(f"Error getting all agent configs: {e}")
            return []
    
    async def update_agent_config(self, agent_type: str, config_data: Dict[str, Any]) -> bool:
        """Update AI agent configuration"""
        try:
            config_data["updated_at"] = datetime.utcnow()
            result = await self.ai_agent_configs.update_one(
                {"agent_type": agent_type},
                {"$set": config_data},
                upsert=True
            )
            return result.acknowledged
        except Exception as e:
            print(f"Error updating agent config: {e}")
            return False
    
    async def create_agent_config(self, agent_type: str, system_prompt: str, capabilities: List[str], 
                                 fallback_response: str, user_type: str) -> bool:
        """Create new AI agent configuration"""
        try:
            config = {
                "agent_type": agent_type,
                "user_type": user_type,
                "system_prompt": system_prompt,
                "capabilities": capabilities,
                "fallback_response": fallback_response,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await self.ai_agent_configs.insert_one(config)
            return result.acknowledged
        except Exception as e:
            print(f"Error creating agent config: {e}")
            return False
    
    async def delete_agent_config(self, agent_type: str) -> bool:
        """Delete AI agent configuration"""
        try:
            result = await self.ai_agent_configs.delete_one({"agent_type": agent_type})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting agent config: {e}")
            return False
    
    async def get_agent_configs_by_user_type(self, user_type: str) -> List[Dict[str, Any]]:
        """Get AI agent configurations by user type"""
        try:
            configs = []
            async for config in self.ai_agent_configs.find({"user_type": user_type, "is_active": True}):
                configs.append(config)
            return configs
        except Exception as e:
            print(f"Error getting agent configs by user type: {e}")
            return []

# Database instance
def get_chat_database() -> ChatDatabase:
    """Get chat database instance"""
    from app.core.database import get_database
    import asyncio
    
    # Get the database instance
    try:
        # Try to get the existing database instance
        from app.core.database import _database
        if _database is not None:
            return ChatDatabase(_database)
    except:
        pass
    
    # Fallback: create a new database connection
    try:
        db = asyncio.get_event_loop().run_until_complete(get_database())
        return ChatDatabase(db)
    except:
        # If all else fails, return None and let the API handle it
        return None
