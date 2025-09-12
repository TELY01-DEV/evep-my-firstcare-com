"""
AI Service Client for EVEP Backend

This module provides a client to communicate with the separate AI/ML service.
"""

import aiohttp
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class AIServiceClient:
    """Client for communicating with AI/ML service"""
    
    def __init__(self):
        self.base_url = settings.ai_service_url
        self.timeout = settings.ai_service_timeout
        self.enabled = settings.ai_service_enabled
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session
    
    async def close(self):
        """Close HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check AI service health"""
        if not self.enabled:
            return {
                "status": "disabled",
                "reason": "AI service is disabled",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {
                        "status": "unhealthy",
                        "reason": f"HTTP {response.status}",
                        "timestamp": datetime.utcnow().isoformat()
                    }
        except Exception as e:
            logger.error(f"AI service health check failed: {e}")
            return {
                "status": "unhealthy",
                "reason": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def generate_insight(
        self,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None,
        role: str = "doctor",
        insight_type: str = "screening_analysis"
    ) -> Dict[str, Any]:
        """Generate AI insight"""
        
        if not self.enabled:
            raise RuntimeError("AI service is disabled")
        
        try:
            session = await self._get_session()
            
            payload = {
                "screening_data": screening_data,
                "patient_info": patient_info,
                "role": role,
                "insight_type": insight_type
            }
            
            async with session.post(
                f"{self.base_url}/api/v1/insights/generate",
                json=payload
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        return result.get("insight", {})
                    else:
                        raise RuntimeError(result.get("error", "Unknown error"))
                else:
                    error_text = await response.text()
                    raise RuntimeError(f"AI service error: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Failed to generate insight: {e}")
            raise
    
    async def search_insights(
        self,
        query: str,
        role: Optional[str] = None,
        insight_type: Optional[str] = None,
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Search existing insights"""
        
        if not self.enabled:
            raise RuntimeError("AI service is disabled")
        
        try:
            session = await self._get_session()
            
            payload = {
                "query": query,
                "role": role,
                "insight_type": insight_type,
                "n_results": n_results
            }
            
            async with session.post(
                f"{self.base_url}/api/v1/insights/search",
                json=payload
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        return result.get("results", [])
                    else:
                        raise RuntimeError(result.get("error", "Unknown error"))
                else:
                    error_text = await response.text()
                    raise RuntimeError(f"AI service error: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Failed to search insights: {e}")
            raise
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get AI service statistics"""
        
        if not self.enabled:
            return {
                "status": "disabled",
                "reason": "AI service is disabled"
            }
        
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}/api/v1/insights/statistics") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {
                        "error": f"Failed to get statistics: HTTP {response.status}"
                    }
        except Exception as e:
            logger.error(f"Failed to get AI statistics: {e}")
            return {"error": str(e)}
    
    async def get_templates(self) -> List[Dict[str, Any]]:
        """Get available prompt templates"""
        
        if not self.enabled:
            return []
        
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}/api/v1/insights/templates") as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("templates", [])
                else:
                    logger.error(f"Failed to get templates: HTTP {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Failed to get templates: {e}")
            return []

# Global AI client instance
ai_client = AIServiceClient()

