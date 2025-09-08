"""
Vector Learning System for AI Agents

This module provides vector database integration for AI Agent learning,
storing user chat data, behavior patterns, and conversation context
for intelligent, personalized responses.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import hashlib

from app.core.chat_database import get_chat_database
from app.modules.ai_insights.vector_store import VectorStore

logger = logging.getLogger(__name__)

class VectorLearningSystem:
    """Vector learning system for AI Agent intelligence and personalization"""
    
    def __init__(self):
        self.vector_store = None
        self.chat_db = None
        self._initialized = False
        
    async def initialize(self):
        """Initialize the vector learning system"""
        try:
            # Initialize vector store
            self.vector_store = VectorStore()
            logger.info("✅ Vector Store initialized for AI Agent learning")
            
            # Initialize chat database
            self.chat_db = get_chat_database()
            if self.chat_db:
                logger.info("✅ Chat Database initialized for AI Agent learning")
            else:
                logger.warning("⚠️ Chat Database not available for AI Agent learning")
            
            # Create AI Agent specific collections
            await self._create_agent_collections()
            
            self._initialized = True
            logger.info("✅ Vector Learning System initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Vector Learning System: {e}")
            raise
    
    async def _create_agent_collections(self):
        """Create AI Agent specific vector collections"""
        try:
            # Create collections for AI Agent learning
            agent_collections = [
                "user_chat_behavior",
                "conversation_patterns", 
                "user_preferences",
                "response_effectiveness",
                "intent_learning",
                "personalization_data"
            ]
            
            for collection_name in agent_collections:
                try:
                    # Get or create collection
                    collection = self.vector_store.chroma_client.get_or_create_collection(
                        name=collection_name,
                        metadata={
                            "description": f"AI Agent learning collection for {collection_name}",
                            "created_at": datetime.utcnow().isoformat(),
                            "purpose": "ai_agent_learning"
                        }
                    )
                    self.vector_store.collections[collection_name] = collection
                    logger.info(f"✅ Created AI Agent collection: {collection_name}")
                except Exception as e:
                    logger.error(f"❌ Error creating collection {collection_name}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Error creating AI Agent collections: {e}")
    
    async def store_user_chat_behavior(
        self,
        user_id: str,
        user_type: str,
        message: str,
        response: str,
        agent_type: str,
        context: Optional[Dict[str, Any]] = None,
        satisfaction_score: Optional[float] = None
    ) -> bool:
        """Store user chat behavior for learning and personalization"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Create behavior document
            behavior_doc = {
                "user_id": user_id,
                "user_type": user_type,
                "message": message,
                "response": response,
                "agent_type": agent_type,
                "context": context or {},
                "satisfaction_score": satisfaction_score,
                "timestamp": datetime.utcnow().isoformat(),
                "interaction_id": f"{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            }
            
            # Generate document ID
            doc_id = f"behavior_{user_id}_{hashlib.md5(message.encode()).hexdigest()[:8]}"
            
            # Create text for embedding (combine message and context)
            embedding_text = f"User: {message}\nContext: {json.dumps(context or {})}\nUserType: {user_type}"
            
            # Store in vector database
            success = self.vector_store.add_document(
                collection_name="user_chat_behavior",
                document_id=doc_id,
                text=embedding_text,
                metadata=behavior_doc
            )
            
            if success:
                logger.info(f"✅ Stored user chat behavior for user {user_id}")
                
                # Also store in MongoDB for detailed analysis
                if self.chat_db:
                    await self.chat_db.store_learning_data(
                        user_id=user_id,
                        message=message,
                        response=response,
                        intent="user_behavior_learning",
                        confidence=1.0,
                        agent_type=agent_type
                    )
                
                return True
            else:
                logger.error(f"❌ Failed to store user chat behavior for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error storing user chat behavior: {e}")
            return False
    
    async def store_conversation_pattern(
        self,
        conversation_id: str,
        user_id: str,
        conversation_turns: List[Dict[str, Any]],
        outcome: str,
        effectiveness_score: Optional[float] = None
    ) -> bool:
        """Store conversation patterns for learning"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Create pattern document
            pattern_doc = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "turn_count": len(conversation_turns),
                "outcome": outcome,
                "effectiveness_score": effectiveness_score,
                "timestamp": datetime.utcnow().isoformat(),
                "turns": conversation_turns
            }
            
            # Generate document ID
            doc_id = f"pattern_{conversation_id}_{hashlib.md5(conversation_id.encode()).hexdigest()[:8]}"
            
            # Create text for embedding (summarize conversation)
            conversation_summary = self._summarize_conversation(conversation_turns)
            embedding_text = f"Conversation: {conversation_summary}\nOutcome: {outcome}"
            
            # Store in vector database
            success = self.vector_store.add_document(
                collection_name="conversation_patterns",
                document_id=doc_id,
                text=embedding_text,
                metadata=pattern_doc
            )
            
            if success:
                logger.info(f"✅ Stored conversation pattern for conversation {conversation_id}")
                return True
            else:
                logger.error(f"❌ Failed to store conversation pattern for conversation {conversation_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error storing conversation pattern: {e}")
            return False
    
    async def store_user_preferences(
        self,
        user_id: str,
        user_type: str,
        preferences: Dict[str, Any],
        interaction_history: List[Dict[str, Any]]
    ) -> bool:
        """Store user preferences for personalization"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Create preferences document
            preferences_doc = {
                "user_id": user_id,
                "user_type": user_type,
                "preferences": preferences,
                "interaction_count": len(interaction_history),
                "last_updated": datetime.utcnow().isoformat(),
                "interaction_history": interaction_history[-10:]  # Last 10 interactions
            }
            
            # Generate document ID
            doc_id = f"preferences_{user_id}_{user_type}"
            
            # Create text for embedding
            embedding_text = f"UserType: {user_type}\nPreferences: {json.dumps(preferences)}\nHistory: {len(interaction_history)} interactions"
            
            # Store in vector database
            success = self.vector_store.add_document(
                collection_name="user_preferences",
                document_id=doc_id,
                text=embedding_text,
                metadata=preferences_doc
            )
            
            if success:
                logger.info(f"✅ Stored user preferences for user {user_id}")
                return True
            else:
                logger.error(f"❌ Failed to store user preferences for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error storing user preferences: {e}")
            return False
    
    async def store_response_effectiveness(
        self,
        user_id: str,
        message: str,
        response: str,
        agent_type: str,
        effectiveness_metrics: Dict[str, Any]
    ) -> bool:
        """Store response effectiveness for learning"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Create effectiveness document
            effectiveness_doc = {
                "user_id": user_id,
                "message": message,
                "response": response,
                "agent_type": agent_type,
                "metrics": effectiveness_metrics,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Generate document ID
            doc_id = f"effectiveness_{user_id}_{hashlib.md5(message.encode()).hexdigest()[:8]}"
            
            # Create text for embedding
            embedding_text = f"Message: {message}\nResponse: {response}\nAgent: {agent_type}\nMetrics: {json.dumps(effectiveness_metrics)}"
            
            # Store in vector database
            success = self.vector_store.add_document(
                collection_name="response_effectiveness",
                document_id=doc_id,
                text=embedding_text,
                metadata=effectiveness_doc
            )
            
            if success:
                logger.info(f"✅ Stored response effectiveness for user {user_id}")
                return True
            else:
                logger.error(f"❌ Failed to store response effectiveness for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error storing response effectiveness: {e}")
            return False
    
    async def get_similar_user_behavior(
        self,
        user_type: str,
        message: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Get similar user behavior patterns for learning"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Search for similar behavior
            similar_behaviors = self.vector_store.search_similar(
                collection_name="user_chat_behavior",
                query=f"UserType: {user_type}\nMessage: {message}",
                n_results=n_results,
                filter_metadata={"user_type": user_type}
            )
            
            logger.info(f"✅ Found {len(similar_behaviors)} similar user behaviors")
            return similar_behaviors
            
        except Exception as e:
            logger.error(f"❌ Error getting similar user behavior: {e}")
            return []
    
    async def get_user_preferences(
        self,
        user_id: str,
        user_type: str
    ) -> Optional[Dict[str, Any]]:
        """Get user preferences for personalization"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Search for user preferences
            preferences = self.vector_store.search_similar(
                collection_name="user_preferences",
                query=f"UserID: {user_id}\nUserType: {user_type}",
                n_results=1,
                filter_metadata={"user_id": user_id, "user_type": user_type}
            )
            
            if preferences:
                logger.info(f"✅ Found user preferences for user {user_id}")
                return preferences[0]["metadata"]
            else:
                logger.info(f"ℹ️ No preferences found for user {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error getting user preferences: {e}")
            return None
    
    async def get_effective_responses(
        self,
        user_type: str,
        message: str,
        n_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Get effective responses for similar messages"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Search for effective responses
            effective_responses = self.vector_store.search_similar(
                collection_name="response_effectiveness",
                query=f"UserType: {user_type}\nMessage: {message}",
                n_results=n_results,
                filter_metadata={"user_type": user_type}
            )
            
            logger.info(f"✅ Found {len(effective_responses)} effective responses")
            return effective_responses
            
        except Exception as e:
            logger.error(f"❌ Error getting effective responses: {e}")
            return []
    
    async def learn_from_interaction(
        self,
        user_id: str,
        user_type: str,
        message: str,
        response: str,
        agent_type: str,
        context: Optional[Dict[str, Any]] = None,
        feedback: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Learn from user interaction and store in vector database"""
        try:
            if not self._initialized:
                await self.initialize()
            
            # Store user chat behavior
            await self.store_user_chat_behavior(
                user_id=user_id,
                user_type=user_type,
                message=message,
                response=response,
                agent_type=agent_type,
                context=context,
                satisfaction_score=feedback.get("satisfaction") if feedback else None
            )
            
            # Store response effectiveness if feedback available
            if feedback:
                effectiveness_metrics = {
                    "satisfaction_score": feedback.get("satisfaction"),
                    "response_time": feedback.get("response_time"),
                    "helpfulness": feedback.get("helpfulness"),
                    "clarity": feedback.get("clarity")
                }
                
                await self.store_response_effectiveness(
                    user_id=user_id,
                    message=message,
                    response=response,
                    agent_type=agent_type,
                    effectiveness_metrics=effectiveness_metrics
                )
            
            logger.info(f"✅ Learned from interaction for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error learning from interaction: {e}")
            return False
    
    def _summarize_conversation(self, conversation_turns: List[Dict[str, Any]]) -> str:
        """Summarize conversation for embedding"""
        try:
            summary_parts = []
            for turn in conversation_turns[-5:]:  # Last 5 turns
                if turn.get("is_user"):
                    summary_parts.append(f"User: {turn.get('message', '')[:100]}")
                else:
                    summary_parts.append(f"Bot: {turn.get('message', '')[:100]}")
            
            return " | ".join(summary_parts)
        except Exception as e:
            logger.error(f"❌ Error summarizing conversation: {e}")
            return "Conversation summary unavailable"
    
    async def get_learning_analytics(
        self,
        user_id: Optional[str] = None,
        user_type: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get learning analytics from vector database"""
        try:
            if not self._initialized:
                await self.initialize()
            
            analytics = {
                "total_interactions": 0,
                "user_types": {},
                "agent_types": {},
                "effectiveness_scores": [],
                "common_patterns": [],
                "learning_insights": []
            }
            
            # Get behavior analytics
            if user_id:
                # User-specific analytics
                user_behaviors = self.vector_store.search_similar(
                    collection_name="user_chat_behavior",
                    query=f"UserID: {user_id}",
                    n_results=100,
                    filter_metadata={"user_id": user_id}
                )
                analytics["total_interactions"] = len(user_behaviors)
            else:
                # System-wide analytics
                # This would require more complex queries in a real implementation
                analytics["total_interactions"] = 0
            
            logger.info(f"✅ Generated learning analytics")
            return analytics
            
        except Exception as e:
            logger.error(f"❌ Error getting learning analytics: {e}")
            return {"error": str(e)}

# Global instance
vector_learning_system = VectorLearningSystem()
