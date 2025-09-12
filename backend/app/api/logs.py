from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.core.logger import logger

router = APIRouter()

class FrontendLogEntry(BaseModel):
    timestamp: str
    level: str
    message: str
    context: Optional[Dict[str, Any]] = None
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    requestId: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None

@router.post("/logs")
async def receive_frontend_log(request: Request, log_entry: FrontendLogEntry):
    """Receive and store frontend logs"""
    try:
        # Log the frontend log entry
        logger.info(
            f"Frontend log: {log_entry.message}",
            frontend_log=True,
            log_level=log_entry.level,
            user_id=log_entry.userId,
            session_id=log_entry.sessionId,
            url=log_entry.url,
            user_agent=log_entry.userAgent,
            context=log_entry.context,
            request_id=getattr(request.state, 'request_id', None)
        )
        
        return {"status": "logged", "timestamp": datetime.utcnow().isoformat()}
        
    except Exception as e:
        logger.error("Failed to process frontend log", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process log")

@router.get("/logs/health")
async def logs_health_check():
    """Health check for logging service"""
    return {
        "status": "healthy",
        "service": "logging",
        "timestamp": datetime.utcnow().isoformat()
    }
