"""
CDN External Secure File Access Service
Handles secure file upload, download, and access for the EVEP platform
"""

import os
import hashlib
import mimetypes
from datetime import datetime, timedelta
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, Header
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import aiofiles
import magic

from app.core.config import settings
from app.core.security import verify_token
from app.core.database import get_database

# Initialize FastAPI app
app = FastAPI(
    title="EVEP CDN Service",
    description="External Secure File Access Service for EVEP Platform",
    version="1.0.0",
    docs_url="/docs" if settings.CDN_ENABLED else None,
    redoc_url="/redoc" if settings.CDN_ENABLED else None,
)

# Security
security = HTTPBearer()

# Models
class FileInfo(BaseModel):
    file_id: str
    filename: str
    file_size: int
    mime_type: str
    upload_date: datetime
    expires_at: Optional[datetime]
    access_count: int
    is_public: bool

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    download_url: str
    expires_at: Optional[datetime]

# Storage configuration - use /app/storage where files are actually stored
STORAGE_PATH = Path(getattr(settings, 'FILE_STORAGE_PATH', '/app/storage'))
STORAGE_PATH.mkdir(parents=True, exist_ok=True)

# Allowed file types for security
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
}

# Maximum file size (100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024

def get_file_path(file_id: str) -> Path:
    """Get the file path for a given file ID"""
    return STORAGE_PATH / f"{file_id}"

def generate_file_id(filename: str, content: bytes) -> str:
    """Generate a unique file ID based on filename and content hash"""
    content_hash = hashlib.sha256(content).hexdigest()[:16]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{content_hash}"

def is_file_allowed(mime_type: str) -> bool:
    """Check if the file type is allowed"""
    return mime_type in ALLOWED_MIME_TYPES

async def verify_file_access(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify user has access to files"""
    if not settings.SECURE_FILE_ACCESS:
        return True
    
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cdn", "timestamp": datetime.now()}

@app.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    expires_in_days: Optional[int] = Query(None, ge=1, le=365),
    is_public: bool = Query(False),
    user = Depends(verify_file_access)
):
    """Upload a file to the CDN"""
    
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Read file content
    content = await file.read()
    
    # Validate file type
    mime_type = magic.from_buffer(content, mime=True)
    if not is_file_allowed(mime_type):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Generate file ID
    file_id = generate_file_id(file.filename, content)
    file_path = get_file_path(file_id)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Calculate expiration
    expires_at = None
    if expires_in_days:
        expires_at = datetime.now() + timedelta(days=expires_in_days)
    
    # Store file metadata in database
    db = get_database()
    file_doc = {
        "file_id": file_id,
        "filename": file.filename,
        "file_size": len(content),
        "mime_type": mime_type,
        "upload_date": datetime.now(),
        "expires_at": expires_at,
        "access_count": 0,
        "is_public": is_public,
        "uploaded_by": user.get("user_id") if user else None
    }
    
    await db.files.insert_one(file_doc)
    
    # Generate download URL
    download_url = f"/files/{file_id}"
    
    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename,
        file_size=len(content),
        download_url=download_url,
        expires_at=expires_at
    )

@app.get("/files/{file_id}")
async def download_file(file_id: str):
    """Download a file from the CDN"""
    
    file_path = get_file_path(file_id)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # If SECURE_FILE_ACCESS is disabled, serve files directly without database checks
    if not settings.SECURE_FILE_ACCESS:
        mime_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
        return FileResponse(
            path=str(file_path),
            filename=file_id,
            media_type=mime_type
        )
    
    # Get file metadata from database (for secure access)
    db = get_database()
    file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        # If no metadata but file exists and secure access is disabled, serve it
        mime_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
        return FileResponse(
            path=str(file_path),
            filename=file_id,
            media_type=mime_type
        )
    
    # Check if file is expired
    if file_doc.get("expires_at") and datetime.now() > file_doc["expires_at"]:
        raise HTTPException(status_code=410, detail="File has expired")
    
    # For public files, no authentication required
    if file_doc.get("is_public", False):
        pass  # Allow access
    else:
        # For private files, require authentication (but we'll skip this for now)
        pass  # TODO: Add authentication check for private files
    
    # Update access count
    await db.files.update_one(
        {"file_id": file_id},
        {"$inc": {"access_count": 1}}
    )
    
    # Return file
    return FileResponse(
        path=file_path,
        filename=file_doc["filename"],
        media_type=file_doc["mime_type"]
    )

@app.get("/files/{file_id}/info", response_model=FileInfo)
async def get_file_info(
    file_id: str,
    user = Depends(verify_file_access)
):
    """Get file information"""
    
    db = get_database()
    file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check access permissions
    if not file_doc.get("is_public", False):
        if not user:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return FileInfo(**file_doc)

@app.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    user = Depends(verify_file_access)
):
    """Delete a file from the CDN"""
    
    if not user:
        raise HTTPException(status_code=403, detail="Authentication required")
    
    file_path = get_file_path(file_id)
    
    # Get file metadata
    db = get_database()
    file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check ownership (only file owner or admin can delete)
    if file_doc.get("uploaded_by") != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete file from storage
    if file_path.exists():
        file_path.unlink()
    
    # Delete metadata from database
    await db.files.delete_one({"file_id": file_id})
    
    return {"message": "File deleted successfully"}

@app.get("/files", response_model=List[FileInfo])
async def list_files(
    user = Depends(verify_file_access),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List files (admin only)"""
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_database()
    cursor = db.files.find().skip(offset).limit(limit)
    files = await cursor.to_list(length=limit)
    
    return [FileInfo(**file) for file in files]

@app.get("/stats")
async def get_stats(user = Depends(verify_file_access)):
    """Get CDN statistics (admin only)"""
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_database()
    
    # Get total files
    total_files = await db.files.count_documents({})
    
    # Get total storage used
    pipeline = [
        {"$group": {"_id": None, "total_size": {"$sum": "$file_size"}}}
    ]
    result = await db.files.aggregate(pipeline).to_list(1)
    total_size = result[0]["total_size"] if result else 0
    
    # Get files by type
    pipeline = [
        {"$group": {"_id": "$mime_type", "count": {"$sum": 1}}}
    ]
    files_by_type = await db.files.aggregate(pipeline).to_list(None)
    
    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "files_by_type": files_by_type
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
