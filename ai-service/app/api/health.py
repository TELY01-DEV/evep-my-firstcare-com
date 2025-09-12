"""
Health check endpoints for AI/ML Service
"""

from fastapi import APIRouter, Request
from datetime import datetime
import structlog

logger = structlog.get_logger()

router = APIRouter()

@router.get("/")
async def health_check(request: Request):
    """Basic health check"""
    ai_manager = request.app.state.ai_manager
    
    if not ai_manager:
        return {
            "status": "unhealthy",
            "reason": "AI Manager not available",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    health_status = await ai_manager.health_check()
    return health_status

@router.get("/ready")
async def readiness_check(request: Request):
    """Readiness check for Kubernetes"""
    ai_manager = request.app.state.ai_manager
    
    if not ai_manager or not ai_manager.is_initialized():
        return {
            "status": "not_ready",
            "reason": "AI Manager not initialized",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }
