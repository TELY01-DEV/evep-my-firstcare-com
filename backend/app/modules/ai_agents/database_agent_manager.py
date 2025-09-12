"""
Database-based AI Agent Manager

This module provides a database-driven approach to AI agent management,
allowing dynamic configuration of agents without code changes.
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from enum import Enum
import hashlib
import asyncio

from app.core.chat_database import get_chat_database
from app.modules.ai_agents.vector_learning import vector_learning_system

class UserType(Enum):
    PARENT = "parent"
    TEACHER = "teacher"
    DOCTOR = "doctor"
    NURSE = "nurse"
    OPTOMETRIST = "optometrist"
    MEDICAL_STAFF = "medical_staff"
    HOSPITAL_STAFF = "hospital_staff"
    HOSPITAL_EXCLUSIVE = "hospital_exclusive"
    MEDICAL_ADMIN = "medical_admin"
    SYSTEM_ADMIN = "system_admin"
    SUPER_ADMIN = "super_admin"
    EXECUTIVE = "executive"

class DatabaseAgentManager:
    """Database-driven AI Agent Manager"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseAgentManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.openai_client = None
            self.agent_configs = {}
            self.vector_learning = None
            self._initialize_openai()
            
            # Initialize caching system
            self.response_cache = {}
            self.cache_ttl = timedelta(hours=1)
            self.max_cache_size = 1000
            self._cache_hits = 0
            self._total_requests = 0
            
            DatabaseAgentManager._initialized = True
    
    def _initialize_openai(self):
        """Initialize OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your-openai-api-key-here":
            self.openai_client = AsyncOpenAI(api_key=api_key)
            print("✅ OpenAI client initialized successfully")
        else:
            print("⚠️ OpenAI API key not configured, using fallback responses")
    
    async def load_agent_configs(self):
        """Load agent configurations from database with enhanced error handling"""
        try:
            chat_db = get_chat_database()
            if chat_db is None:
                print("⚠️ Database not available, using fallback configurations")
                await self._load_fallback_configs()
                return False
            
            configs = await chat_db.get_all_agent_configs()
            self.agent_configs = {}
            
            for config in configs:
                try:
                    if config.get("is_active", True):
                        # Validate configuration structure
                        if self._validate_agent_config(config):
                            self.agent_configs[config["agent_type"]] = config
                        else:
                            print(f"⚠️ Invalid configuration for {config.get('agent_type', 'unknown')}")
                except Exception as e:
                    print(f"⚠️ Error processing config {config.get('agent_type', 'unknown')}: {e}")
                    continue
            
            if not self.agent_configs:
                print("⚠️ No valid configurations found, loading fallback configurations")
                await self._load_fallback_configs()
                return False
            
            # Initialize vector learning system
            if not self.vector_learning:
                try:
                    self.vector_learning = vector_learning_system
                    await self.vector_learning.initialize()
                    print("✅ Vector learning system initialized")
                except Exception as e:
                    print(f"⚠️ Vector learning system not available: {e}")
                    self.vector_learning = None
            
            print(f"✅ Loaded {len(self.agent_configs)} agent configurations from database")
            return True
        except Exception as e:
            print(f"❌ Error loading agent configs: {e}")
            await self._load_fallback_configs()
            return False
    
    def _validate_agent_config(self, config: Dict[str, Any]) -> bool:
        """Validate agent configuration structure"""
        required_fields = ["agent_type", "user_type", "system_prompt", "fallback_response"]
        return all(field in config for field in required_fields)
    
    async def _load_fallback_configs(self):
        """Load fallback configurations when database is unavailable"""
        fallback_configs = {
            "super_admin_agent": {
                "agent_type": "super_admin_agent",
                "user_type": "super_admin",
                "system_prompt": "You are a super administrator assistant for the EVEP Medical Portal system.",
                "fallback_response": "I'm your super administrative assistant. I can help you with system usage, data querying, and analytics. Please try again later for more detailed assistance.",
                "capabilities": ["System guidance", "Data querying", "Analytics access"],
                "is_active": True
            },
            "doctor_agent": {
                "agent_type": "doctor_agent", 
                "user_type": "doctor",
                "system_prompt": "You are a doctor assistant for the EVEP Medical Portal system.",
                "fallback_response": "I'm your clinical assistant. I can help you with patient data, medical analytics, and clinical workflows. Please try again later for more detailed assistance.",
                "capabilities": ["Clinical guidance", "Patient data", "Medical analytics"],
                "is_active": True
            }
        }
        
        self.agent_configs = fallback_configs
        print("✅ Loaded fallback agent configurations")
    
    def _generate_cache_key(self, user_type: UserType, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a cache key for the request"""
        cache_data = {
            "user_type": user_type.value,
            "message": message.lower().strip(),
            "context": context or {}
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached response if available and not expired"""
        if cache_key in self.response_cache:
            cached_data = self.response_cache[cache_key]
            if datetime.utcnow() - cached_data["timestamp"] < self.cache_ttl:
                return cached_data["response"]
            else:
                del self.response_cache[cache_key]
        return None
    
    def _cache_response(self, cache_key: str, response: Dict[str, Any]):
        """Cache the response"""
        if len(self.response_cache) >= self.max_cache_size:
            oldest_keys = sorted(
                self.response_cache.keys(),
                key=lambda k: self.response_cache[k]["timestamp"]
            )[:len(self.response_cache) - self.max_cache_size + 1]
            for key in oldest_keys:
                del self.response_cache[key]
        
        self.response_cache[cache_key] = {
            "response": response,
            "timestamp": datetime.utcnow()
        }
    
    async def get_agent_response(
        self, 
        user_type: UserType, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Get response from database-configured agent with enhanced error handling"""
        
        try:
            # Track total requests
            self._total_requests += 1
            
            # Validate input parameters
            if not message or not message.strip():
                return self._get_error_response("Empty message provided", user_type)
            
            # Generate cache key
            cache_key = self._generate_cache_key(user_type, message, context)
            
            # Check cache first
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                self._cache_hits += 1
                cached_response["cached"] = True
                return cached_response
            
            # Load agent configs if not loaded
            if not self.agent_configs:
                await self.load_agent_configs()
            
            # Get agent configuration
            agent_type = f"{user_type.value}_agent"
            agent_config = self.agent_configs.get(agent_type)
            
            if not agent_config:
                # Fallback to default response
                response = {
                    "response": f"I'm sorry, I don't have a specialized agent configured for {user_type.value}. Please contact support.",
                    "agent_type": "fallback",
                    "confidence": 0.0,
                    "cached": False,
                    "error": "agent_not_configured"
                }
                return response
            
            # Use OpenAI if available, otherwise use fallback
            if self.openai_client and agent_config.get("system_prompt"):
                try:
                    response = await self._get_openai_response(
                        agent_config, message, context, conversation_history
                    )
                except Exception as e:
                    print(f"OpenAI error: {e}")
                    response = await self._get_fallback_response(agent_config, message, context)
                    response["error"] = "openai_error"
            else:
                response = await self._get_fallback_response(agent_config, message, context)
            
            # Add cache flag and cache the response
            response["cached"] = False
            self._cache_response(cache_key, response)
            
            # Learn from interaction if vector learning is available
            if self.vector_learning:
                try:
                    await self.vector_learning.learn_from_interaction(
                        user_id=context.get("user_id", "unknown") if context else "unknown",
                        user_type=user_type.value,
                        message=message,
                        response=response["response"],
                        agent_type=response.get("agent_type", "unknown"),
                        context=context
                    )
                except Exception as e:
                    print(f"⚠️ Vector learning error: {e}")
            
            return response
            
        except Exception as e:
            print(f"❌ Critical error in get_agent_response: {e}")
            return self._get_error_response(f"System error: {str(e)}", user_type)
    
    def _get_error_response(self, error_message: str, user_type: UserType) -> Dict[str, Any]:
        """Generate standardized error response"""
        return {
            "response": f"I'm sorry, I'm experiencing technical difficulties. Please try again later. ({error_message})",
            "agent_type": "error",
            "confidence": 0.0,
            "cached": False,
            "error": error_message,
            "user_type": user_type.value,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _get_openai_response(
        self, 
        agent_config: Dict[str, Any], 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Get response from OpenAI using database configuration"""
        
        system_prompt = agent_config.get("system_prompt", "")
        
        # Build messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages
                messages.append({
                    "role": "user" if msg.get("is_user") else "assistant",
                    "content": msg.get("message", "")
                })
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return {
            "response": response.choices[0].message.content,
            "agent_type": agent_config.get("agent_type", "unknown"),
            "confidence": 0.9,
            "model": "gpt-4",
            "fallback_mode": False,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _get_fallback_response(
        self, 
        agent_config: Dict[str, Any], 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get fallback response using database configuration"""
        
        fallback_response = agent_config.get("fallback_response", 
            "I'm sorry, I'm having trouble processing your request. Please try again.")
        
        return {
            "response": fallback_response,
            "agent_type": agent_config.get("agent_type", "unknown"),
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        return {
            "cache_size": len(self.response_cache),
            "max_cache_size": self.max_cache_size,
            "cache_ttl_hours": self.cache_ttl.total_seconds() / 3600,
            "cache_hit_ratio": self._cache_hits / max(self._total_requests, 1)
        }
    
    def clear_cache(self):
        """Clear the response cache"""
        self.response_cache.clear()
        print("✅ Database Agent Manager response cache cleared")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for monitoring"""
        metrics = {
            "total_agents": len(self.agent_configs),
            "openai_configured": self.openai_client is not None,
            "cache_stats": self.get_cache_stats(),
            "available_agents": list(self.agent_configs.keys()),
            "database_driven": True,
            "vector_learning_enabled": self.vector_learning is not None
        }
        
        # Add vector learning metrics if available
        if self.vector_learning:
            try:
                # This would be async in a real implementation
                metrics["vector_learning"] = {
                    "status": "initialized",
                    "collections": list(self.vector_learning.vector_store.collections.keys()) if self.vector_learning.vector_store else [],
                    "learning_enabled": True
                }
            except Exception as e:
                metrics["vector_learning"] = {
                    "status": "error",
                    "error": str(e),
                    "learning_enabled": False
                }
        else:
            metrics["vector_learning"] = {
                "status": "not_initialized",
                "learning_enabled": False
            }
        
        return metrics
    
    async def reload_agent_configs(self):
        """Reload agent configurations from database"""
        await self.load_agent_configs()
        print("✅ Agent configurations reloaded from database")

# Global instance
database_agent_manager = DatabaseAgentManager()
