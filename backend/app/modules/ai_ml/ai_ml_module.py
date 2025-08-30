"""
AI/ML Module for EVEP Platform
Handles LLM integration, vector embeddings, AI insights, and predictive analytics
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.base_module import BaseModule
from app.core.event_bus import event_bus
from app.modules.ai_ml.services.ai_service import AIService
from app.modules.ai_ml.services.vector_service import VectorService
from app.modules.ai_ml.services.insight_service import InsightService
from app.modules.ai_ml.services.prompt_service import PromptService

class AIMLModule(BaseModule):
    """AI/ML Module for EVEP Platform"""
    
    def __init__(self):
        super().__init__("ai_ml", {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database", "patient_management", "screening"],
            "config": {
                "llm_provider": "openai",  # openai, anthropic
                "model_name": "gpt-4",
                "vector_dimensions": 1536,
                "max_tokens": 2000,
                "temperature": 0.7,
                "insight_generation": True,
                "predictive_analytics": True,
                "role_based_insights": True
            }
        })
        
        # Initialize services
        self.ai_service = AIService()
        self.vector_service = VectorService()
        self.insight_service = InsightService()
        self.prompt_service = PromptService()
        
        # Setup routes
        self._setup_routes()
    
    def get_router(self) -> APIRouter:
        """Get the module's router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get the module's event subscriptions"""
        return [
            "screening.completed",
            "patient.updated", 
            "insight.requested",
            "analytics.updated"
        ]
    
    async def initialize(self) -> None:
        """Initialize the AI/ML module"""
        print(f"🔧 Initializing AI/ML module v{self.config['version']}")
        
        # Initialize services
        await self.ai_service.initialize()
        await self.vector_service.initialize()
        await self.insight_service.initialize()
        await self.prompt_service.initialize()
        
        print(f"🔧 AI service initialized")
        print(f"🔧 Vector service initialized")
        print(f"🔧 Insight service initialized")
        print(f"🔧 Prompt service initialized")
        
        # Subscribe to events
        event_bus.subscribe("screening.completed", self._handle_screening_completed)
        event_bus.subscribe("patient.updated", self._handle_patient_updated)
        event_bus.subscribe("insight.requested", self._handle_insight_requested)
        event_bus.subscribe("analytics.updated", self._handle_analytics_updated)
        
        print(f"✅ {self.module_name} module initialized successfully")
    
    def _setup_routes(self) -> None:
        """Setup API routes"""
        
        @self.router.get("/health")
        async def health_check():
            """Health check endpoint for AI/ML module"""
            return {
                "status": "healthy",
                "module": "ai_ml",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # AI Analysis routes
        @self.router.post("/analyze-screening")
        async def analyze_screening(screening_id: str, user_role: str = "doctor"):
            """Analyze screening results with AI"""
            return await self._analyze_screening(screening_id, user_role)
        
        @self.router.post("/generate-insights")
        async def generate_insights(data: Dict[str, Any], user_role: str = "doctor"):
            """Generate AI insights for given data"""
            return await self._generate_insights(data, user_role)
        
        @self.router.post("/predict-risk")
        async def predict_risk(patient_id: str, screening_data: Dict[str, Any]):
            """Predict risk assessment for patient"""
            return await self._predict_risk(patient_id, screening_data)
        
        # Vector operations
        @self.router.post("/embed")
        async def create_embedding(data: Dict[str, Any]):
            """Create vector embedding for text"""
            text = data.get("text", "")
            return await self._create_embedding(text)
        
        @self.router.post("/search-similar")
        async def search_similar(data: Dict[str, Any]):
            """Search for similar content using vector similarity"""
            query = data.get("query", "")
            limit = data.get("limit", 10)
            return await self._search_similar(query, limit)
        
        # Prompt management
        @self.router.get("/prompts")
        async def get_prompts(role: Optional[str] = None):
            """Get available prompt templates"""
            return await self._get_prompts(role)
        
        @self.router.post("/prompts")
        async def create_prompt(prompt_data: Dict[str, Any]):
            """Create new prompt template"""
            return await self._create_prompt(prompt_data)
        
        # Conversation management
        @self.router.post("/conversations")
        async def start_conversation(user_id: str, context: Dict[str, Any]):
            """Start AI conversation"""
            return await self._start_conversation(user_id, context)
        
        @self.router.post("/conversations/{conversation_id}/messages")
        async def send_message(conversation_id: str, message: str):
            """Send message to AI conversation"""
            return await self._send_message(conversation_id, message)
        
        # Analytics and reporting
        @self.router.get("/analytics/insights")
        async def get_insights_analytics(time_period: str = "30d"):
            """Get AI insights analytics"""
            return await self._get_insights_analytics(time_period)
        
        @self.router.get("/analytics/performance")
        async def get_ai_performance():
            """Get AI model performance metrics"""
            return await self._get_ai_performance()
    
    # Event handlers
    async def _handle_screening_completed(self, data: Dict[str, Any]) -> None:
        """Handle screening completion event"""
        try:
            screening_id = data.get("screening_id")
            if screening_id:
                # Generate AI analysis for completed screening
                analysis = await self.ai_service.analyze_screening_results(screening_id)
                await event_bus.emit("ai.analysis.completed", {
                    "screening_id": screening_id,
                    "analysis": analysis
                })
        except Exception as e:
            print(f"Error handling screening completion: {e}")
    
    async def _handle_patient_updated(self, data: Dict[str, Any]) -> None:
        """Handle patient update event"""
        try:
            patient_id = data.get("patient_id")
            if patient_id:
                # Update patient embeddings
                await self.vector_service.update_patient_embedding(patient_id)
        except Exception as e:
            print(f"Error handling patient update: {e}")
    
    async def _handle_insight_requested(self, data: Dict[str, Any]) -> None:
        """Handle insight request event"""
        try:
            user_id = data.get("user_id")
            context = data.get("context", {})
            user_role = data.get("user_role", "doctor")
            
            # Generate role-based insights
            insights = await self.insight_service.generate_role_based_insights(
                user_id, context, user_role
            )
            
            await event_bus.emit("insight.generated", {
                "user_id": user_id,
                "insights": insights
            })
        except Exception as e:
            print(f"Error handling insight request: {e}")
    
    async def _handle_analytics_updated(self, data: Dict[str, Any]) -> None:
        """Handle analytics update event"""
        try:
            # Update AI performance metrics
            await self.ai_service.update_performance_metrics()
        except Exception as e:
            print(f"Error handling analytics update: {e}")
    
    # API endpoint handlers
    async def _analyze_screening(self, screening_id: str, user_role: str) -> Dict[str, Any]:
        """Analyze screening results with AI"""
        try:
            analysis = await self.ai_service.analyze_screening_results(screening_id)
            insights = await self.insight_service.generate_role_based_insights(
                None, {"screening_id": screening_id}, user_role
            )
            
            return {
                "status": "success",
                "data": {
                    "analysis": analysis,
                    "insights": insights,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    async def _generate_insights(self, data: Dict[str, Any], user_role: str) -> Dict[str, Any]:
        """Generate AI insights for given data"""
        try:
            insights = await self.insight_service.generate_insights(data, user_role)
            
            return {
                "status": "success",
                "data": {
                    "insights": insights,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(e)}")
    
    async def _predict_risk(self, patient_id: str, screening_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict risk assessment for patient"""
        try:
            risk_assessment = await self.ai_service.predict_risk(patient_id, screening_data)
            
            return {
                "status": "success",
                "data": {
                    "risk_assessment": risk_assessment,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Risk prediction failed: {str(e)}")
    
    async def _create_embedding(self, text: str) -> Dict[str, Any]:
        """Create vector embedding for text"""
        try:
            embedding = await self.vector_service.create_embedding(text)
            
            return {
                "status": "success",
                "data": {
                    "embedding": embedding,
                    "dimensions": len(embedding),
                    "created_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Embedding creation failed: {str(e)}")
    
    async def _search_similar(self, query: str, limit: int) -> Dict[str, Any]:
        """Search for similar content using vector similarity"""
        try:
            results = await self.vector_service.search_similar(query, limit)
            
            return {
                "status": "success",
                "data": {
                    "results": results,
                    "query": query,
                    "limit": limit,
                    "searched_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Similarity search failed: {str(e)}")
    
    async def _get_prompts(self, role: Optional[str]) -> Dict[str, Any]:
        """Get available prompt templates"""
        try:
            prompts = await self.prompt_service.get_prompts(role)
            
            return {
                "status": "success",
                "data": {
                    "prompts": prompts,
                    "total": len(prompts)
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get prompts: {str(e)}")
    
    async def _create_prompt(self, prompt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new prompt template"""
        try:
            prompt = await self.prompt_service.create_prompt(prompt_data)
            
            return {
                "status": "success",
                "data": {
                    "prompt": prompt,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create prompt: {str(e)}")
    
    async def _start_conversation(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Start AI conversation"""
        try:
            conversation = await self.ai_service.start_conversation(user_id, context)
            
            return {
                "status": "success",
                "data": {
                    "conversation": conversation,
                    "started_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")
    
    async def _send_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Send message to AI conversation"""
        try:
            response = await self.ai_service.send_message(conversation_id, message)
            
            return {
                "status": "success",
                "data": {
                    "response": response,
                    "sent_at": datetime.utcnow().isoformat()
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
    async def _get_insights_analytics(self, time_period: str) -> Dict[str, Any]:
        """Get AI insights analytics"""
        try:
            analytics = await self.insight_service.get_analytics(time_period)
            
            return {
                "status": "success",
                "data": analytics
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
    
    async def _get_ai_performance(self) -> Dict[str, Any]:
        """Get AI model performance metrics"""
        try:
            performance = await self.ai_service.get_performance_metrics()
            
            return {
                "status": "success",
                "data": performance
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get performance: {str(e)}")
