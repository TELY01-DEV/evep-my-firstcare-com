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
    cors_allowed_origins=[
        "https://portal.evep.my-firstcare.com",
        "https://evep.my-firstcare.com",
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    logger=True,
    engineio_logger=True
)

# Create FastAPI app for Socket.IO
app = FastAPI(title="EVEP Socket.IO Service", version="1.0.0")

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Initialize Socket.IO service
socketio_service = SocketIOService()

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    try:
        print(f"🔗 Client {sid} connected")
        
        # Extract connection parameters
        query_params = environ.get('QUERY_STRING', '')
        params = {}
        for param in query_params.split('&'):
            if '=' in param:
                key, value = param.split('=', 1)
                params[key] = value
        
        # Handle connection with socketio_service
        await socketio_service.handle_connect(sid, params)
        
        print(f"✅ Client {sid} connected successfully")
        return True
        
    except Exception as e:
        print(f"❌ Connection error for {sid}: {e}")
        return False

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    try:
        print(f"🔌 Client {sid} disconnected")
        await socketio_service.handle_disconnect(sid)
        print(f"✅ Client {sid} disconnected successfully")
    except Exception as e:
        print(f"❌ Disconnection error for {sid}: {e}")

@sio.event
async def join_patient_room(sid, data):
    """Handle joining a patient room for collaboration"""
    try:
        return await socketio_service.handle_join_patient_room(sid, data)
    except Exception as e:
        print(f"❌ Join patient room error: {e}")
        return {"status": "error", "message": str(e)}

@sio.event
async def leave_patient_room(sid, data):
    """Handle leaving a patient room"""
    try:
        return await socketio_service.handle_leave_patient_room(sid, data)
    except Exception as e:
        print(f"❌ Leave patient room error: {e}")
        return {"status": "error", "message": str(e)}

@sio.event
async def field_update(sid, data):
    """Handle field updates"""
    try:
        return await socketio_service.handle_field_update(sid, data)
    except Exception as e:
        print(f"❌ Field update error: {e}")
        return {"status": "error", "message": str(e)}

@sio.event
async def step_update(sid, data):
    """Handle step updates"""
    try:
        return await socketio_service.handle_step_update(sid, data)
    except Exception as e:
        print(f"❌ Step update error: {e}")
        return {"status": "error", "message": str(e)}

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
    
    # Run the Socket.IO service (use socket_app not app)
    uvicorn.run(
        "socketio_standalone:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

