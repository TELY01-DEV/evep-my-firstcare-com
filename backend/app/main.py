from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime
import os
import asyncio

from app.core.config import settings
from app.socketio_service import socketio_service, socket_app
from app.api.auth import router as auth_router
from app.api.screenings import router as screenings_router
from app.api.patients import router as patients_router
from app.api.admin import router as admin_router
from app.api.dashboard import router as dashboard_router
from app.api.ai_insights import router as ai_insights_router
from app.api.analytics import router as analytics_router

# Create FastAPI app
app = FastAPI(
    title="EVEP API",
    description="EYE Vision Evaluation Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount Socket.IO app
app.mount("/socket.io", socket_app)

# Include API routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(screenings_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(ai_insights_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3013"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize Socket.IO service
    await socketio_service.initialize()
    print("Socket.IO service initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("Shutting down EVEP API...")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EVEP API - EYE Vision Evaluation Platform",
        "version": "1.0.0",
        "status": "running",
        "timestamp": settings.get_current_timestamp()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": settings.get_current_timestamp(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "v1",
        "status": "operational",
        "services": {
            "database": "connected",
            "redis": "connected",
            "ai_services": "available"
        },
        "timestamp": settings.get_current_timestamp()
    }

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An internal server error occurred",
            "timestamp": settings.get_current_timestamp()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
