from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from typing import Dict, Any
from datetime import datetime

# Import API routers (only the ones that exist on server)
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.screenings import router as screenings_router
from app.api.medical_staff import router as medical_staff_router

# Import auth function
from app.api.auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EVEP Platform API",
    description="EVEP Platform API with Medical Staff Management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Starting EVEP Platform API...")
    
    # Include auth API router
    app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
    logger.info("Auth API router included successfully!")
    
    # Include patients API router
    app.include_router(patients_router, prefix="/api/v1", tags=["patients"])
    logger.info("Patients API router included successfully!")
    
    # Include screenings API router
    app.include_router(screenings_router, prefix="/api/v1", tags=["screenings"])
    logger.info("Screenings API router included successfully!")
    
    # Include medical staff management API router
    app.include_router(medical_staff_router, prefix="/api/v1", tags=["medical_staff"])
    logger.info("Medical Staff Management API router included successfully!")
    
    logger.info("EVEP Platform API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Shutting down EVEP Platform API...")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "auth": "active",
            "patients": "active",
            "screenings": "active",
            "medical_staff": "active"
        }
    }

# Module information endpoint
@app.get("/modules")
async def get_modules():
    """Get all modules information"""
    return {
        "modules": {
            "auth": {"status": "active", "version": "1.0.0"},
            "patients": {"status": "active", "version": "1.0.0"},
            "screenings": {"status": "active", "version": "1.0.0"},
            "medical_staff": {"status": "active", "version": "1.0.0"}
        },
        "total_modules": 4,
        "enabled_modules": ["auth", "patients", "screenings", "medical_staff"]
    }

# Feature flags endpoint
@app.get("/features")
async def get_features():
    """Get feature flags"""
    return {
        "features": {
            "medical_staff_management": True,
            "patient_management": True,
            "screening_management": True
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EVEP Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
