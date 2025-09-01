"""
Standalone Socket.IO Service for Real-time Communication
This service runs independently for external reverse proxy setup
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

import socketio
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import Config
from app.core.database import get_database
from app.socketio_service import SocketIOService, RealTimeEvent

# Initialize Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Create FastAPI app for Socket.IO
app = FastAPI(title="EVEP Socket.IO Service", version="1.0.0")

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Initialize Socket.IO service
socketio_service = SocketIOService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting EVEP Socket.IO Service...")
    
    # Initialize Socket.IO service
    await socketio_service.initialize()
    
    print("✅ Socket.IO Service initialized successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 Shutting down EVEP Socket.IO Service...")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "socketio",
        "timestamp": datetime.now().isoformat(),
        "connected_clients": len(socketio_service.connected_clients)
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "EVEP Socket.IO Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration
    config = Config()
    
    # Run the service
    uvicorn.run(
        "socketio_standalone:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

