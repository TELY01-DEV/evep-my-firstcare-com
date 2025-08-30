"""
AI Manager for EVEP Platform

This module provides a centralized manager for all AI/ML capabilities
including LLM integration, vector embeddings, and insight generation.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog

from app.core.config import settings
from app.modules.llm_service import LLMService
from app.modules.vector_store import VectorStore
from app.modules.prompt_manager import PromptManager
from app.modules.insight_generator import InsightGenerator

logger = structlog.get_logger()

class AIManager:
    """Centralized AI/ML Manager"""
    
    def __init__(self):
        self.llm_service: Optional[LLMService] = None
        self.vector_store: Optional[VectorStore] = None
        self.prompt_manager: Optional[PromptManager] = None
        self.insight_generator: Optional[InsightGenerator] = None
        self._initialized = False
        self._initialization_lock = asyncio.Lock()
    
    async def initialize(self):
        """Initialize all AI/ML components"""
        async with self._initialization_lock:
            if self._initialized:
                return
            
            logger.info("Initializing AI Manager...")
            
            try:
                # Initialize components
                await self._initialize_components()
                
                # Test components
                await self._test_components()
                
                self._initialized = True
                logger.info("AI Manager initialized successfully")
                
            except Exception as e:
                logger.error(f"Failed to initialize AI Manager: {e}")
                await self.cleanup()
                raise
    
    async def _initialize_components(self):
        """Initialize individual AI components"""
        
        # Initialize LLM Service
        logger.info("Initializing LLM Service...")
        self.llm_service = LLMService()
        await self.llm_service.initialize()
        
        # Initialize Vector Store
        logger.info("Initializing Vector Store...")
        self.vector_store = VectorStore()
        await self.vector_store.initialize()
        
        # Initialize Prompt Manager
        logger.info("Initializing Prompt Manager...")
        self.prompt_manager = PromptManager()
        await self.prompt_manager.initialize()
        
        # Initialize Insight Generator
        logger.info("Initializing Insight Generator...")
        self.insight_generator = InsightGenerator(
            llm_service=self.llm_service,
            vector_store=self.vector_store,
            prompt_manager=self.prompt_manager
        )
        await self.insight_generator.initialize()
    
    async def _test_components(self):
        """Test all components to ensure they're working"""
        logger.info("Testing AI components...")
        
        # Test LLM Service
        if not await self.llm_service.test_connection():
            raise RuntimeError("LLM Service connection test failed")
        
        # Test Vector Store
        if not await self.vector_store.test_connection():
            raise RuntimeError("Vector Store connection test failed")
        
        # Test Prompt Manager
        if not await self.prompt_manager.test_templates():
            raise RuntimeError("Prompt Manager test failed")
        
        logger.info("All AI components tested successfully")
    
    async def cleanup(self):
        """Cleanup AI components"""
        logger.info("Cleaning up AI Manager...")
        
        try:
            if self.insight_generator:
                await self.insight_generator.cleanup()
            
            if self.vector_store:
                await self.vector_store.cleanup()
            
            if self.llm_service:
                await self.llm_service.cleanup()
            
            if self.prompt_manager:
                await self.prompt_manager.cleanup()
                
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
        
        self._initialized = False
        logger.info("AI Manager cleanup completed")
    
    def is_initialized(self) -> bool:
        """Check if AI Manager is initialized"""
        return self._initialized
    
    async def generate_insight(
        self,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None,
        role: str = "doctor",
        insight_type: str = "screening_analysis"
    ) -> Dict[str, Any]:
        """Generate AI insight"""
        
        if not self._initialized:
            raise RuntimeError("AI Manager not initialized")
        
        try:
            logger.info(
                "Generating insight",
                role=role,
                insight_type=insight_type,
                has_patient_info=patient_info is not None
            )
            
            start_time = datetime.utcnow()
            
            # Generate insight
            insight = await self.insight_generator.generate_screening_insight(
                screening_data=screening_data,
                patient_info=patient_info,
                role=role,
                insight_type=insight_type
            )
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Add metadata
            insight["processing_time"] = processing_time
            insight["generated_at"] = datetime.utcnow().isoformat()
            
            logger.info(
                "Insight generated successfully",
                processing_time=processing_time,
                insight_id=insight.get("insight_id")
            )
            
            return insight
            
        except Exception as e:
            logger.error(f"Error generating insight: {e}")
            raise
    
    async def search_insights(
        self,
        query: str,
        role: Optional[str] = None,
        insight_type: Optional[str] = None,
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Search existing insights"""
        
        if not self._initialized:
            raise RuntimeError("AI Manager not initialized")
        
        try:
            logger.info(
                "Searching insights",
                query=query,
                role=role,
                insight_type=insight_type,
                n_results=n_results
            )
            
            results = await self.insight_generator.search_insights(
                query=query,
                role=role,
                insight_type=insight_type,
                n_results=n_results
            )
            
            logger.info(f"Found {len(results)} insights")
            return results
            
        except Exception as e:
            logger.error(f"Error searching insights: {e}")
            raise
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get AI service statistics"""
        
        if not self._initialized:
            return {"error": "AI Manager not initialized"}
        
        try:
            stats = {
                "service_status": "running",
                "initialized": self._initialized,
                "components": {
                    "llm_service": self.llm_service.is_healthy() if self.llm_service else False,
                    "vector_store": self.vector_store.is_healthy() if self.vector_store else False,
                    "prompt_manager": self.prompt_manager.is_healthy() if self.prompt_manager else False,
                    "insight_generator": self.insight_generator.is_healthy() if self.insight_generator else False
                },
                "vector_store_stats": await self.vector_store.get_statistics() if self.vector_store else {},
                "prompt_template_stats": await self.prompt_manager.get_statistics() if self.prompt_manager else {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for AI service"""
        
        if not self._initialized:
            return {
                "status": "unhealthy",
                "reason": "AI Manager not initialized",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        try:
            # Check component health
            llm_healthy = await self.llm_service.health_check() if self.llm_service else False
            vector_healthy = await self.vector_store.health_check() if self.vector_store else False
            
            overall_healthy = llm_healthy and vector_healthy
            
            return {
                "status": "healthy" if overall_healthy else "unhealthy",
                "components": {
                    "llm_service": llm_healthy,
                    "vector_store": vector_healthy
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
