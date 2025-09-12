"""
AI/ML Service for EVEP Platform

This service provides AI/ML capabilities including:
- LLM integration (OpenAI, Claude)
- Vector embeddings and similarity search
- AI insight generation
- Background processing
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.insights import router as insights_router
from app.api.health import router as health_router
from app.api.monitoring import router as monitoring_router
from app.modules.ai_manager import AIManager

# Setup logging
setup_logging()
logger = structlog.get_logger()

# Global AI Manager instance
ai_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ai_manager
    
    # Startup
    logger.info("Starting AI/ML Service...")
    
    try:
        # Initialize AI Manager
        ai_manager = AIManager()
        await ai_manager.initialize()
        logger.info("AI Manager initialized successfully")
        
        # Set global instance
        app.state.ai_manager = ai_manager
        
    except Exception as e:
        logger.error(f"Failed to initialize AI Manager: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI/ML Service...")
    if ai_manager:
        await ai_manager.cleanup()

# Create FastAPI app
app = FastAPI(
    title="EVEP AI/ML Service",
    description="AI/ML capabilities for the EVEP Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(insights_router, prefix="/api/v1/insights", tags=["insights"])
app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["monitoring"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "EVEP AI/ML Service",
        "version": "1.0.0",
        "status": "running",
        "ai_enabled": ai_manager.is_initialized() if ai_manager else False
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
