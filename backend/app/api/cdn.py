"""
CDN File Upload API Router
Handles file uploads for avatars and other media files
"""

import os
import hashlib
import mimetypes
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
import aiofiles

from app.core.config import settings
from app.api.auth import get_current_user
from app.core.database import get_database

router = APIRouter()

# Models
class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    download_url: str
    expires_at: Optional[datetime] = None

# Storage configuration - use /app/storage where files are actually saved
STORAGE_PATH = Path(getattr(settings, 'FILE_STORAGE_PATH', '/app/storage'))

# Create storage directory if it doesn't exist (with error handling)
try:
    STORAGE_PATH.mkdir(parents=True, exist_ok=True)
except PermissionError:
    # Directory will be created by Docker or runtime
    print(f"Warning: Could not create storage directory {STORAGE_PATH}. Ensure it exists.")
    pass

# Allowed file types for security (focusing on images for avatars)
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'
}

# Maximum file size (5MB for avatars)
MAX_FILE_SIZE = 5 * 1024 * 1024

def get_file_path(file_id: str) -> Path:
    """Get the file path for a given file ID"""
    return STORAGE_PATH / f"{file_id}"

def generate_file_id(filename: str, content: bytes) -> str:
    """Generate a unique file ID based on filename and content hash"""
    content_hash = hashlib.sha256(content).hexdigest()[:16]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name_part = "".join(c for c in filename.split('.')[0] if c.isalnum())[:10]
    extension = filename.split('.')[-1] if '.' in filename else 'bin'
    return f"{timestamp}_{name_part}_{content_hash}.{extension}"

def is_file_allowed(content_type: str) -> bool:
    """Check if file type is allowed"""
    return content_type.lower() in ALLOWED_MIME_TYPES

@router.get("/health")
async def health_check():
    """CDN service health check"""
    return {"status": "healthy", "service": "cdn", "timestamp": datetime.now()}

@router.get("/test-public")
async def test_public():
    """Test public endpoint without authentication"""
    return {"message": "Public endpoint working", "timestamp": datetime.now()}

@router.get("/public/{file_id}")
async def serve_public_file(file_id: str):
    """Serve public files without authentication (for avatars)"""
    file_path = get_file_path(file_id)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type
    media_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
    
    return FileResponse(
        path=str(file_path),
        filename=file_id,
        media_type=media_type
    )

@router.options("/upload")
async def upload_options(response: Response):
    """Handle CORS preflight for upload endpoint"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "authorization, content-type"
    response.headers["Access-Control-Max-Age"] = "86400"
    return {"message": "OK"}

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    is_public: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """Upload a file to the CDN"""
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")
    
    # Validate file type
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
    if not is_file_allowed(content_type):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Supported types: {', '.join(ALLOWED_MIME_TYPES)}"
        )
    
    # Generate file ID
    file_id = generate_file_id(file.filename or 'upload', content)
    file_path = get_file_path(file_id)
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Store file metadata in database (optional for avatars)
    try:
        db = get_database()
        files_collection = db.files
        file_doc = {
            "file_id": file_id,
            "filename": file.filename,
            "file_size": len(content),
            "mime_type": content_type,
            "upload_date": datetime.utcnow(),
            "expires_at": None,  # No expiration for avatar files
            "access_count": 0,
            "is_public": is_public,
            "uploaded_by": current_user.get("user_id") or current_user.get("id")
        }
        
        await files_collection.insert_one(file_doc)
    except Exception as e:
        # If database fails, still return success since file is saved
        print(f"Warning: Failed to save file metadata: {e}")
    
    # Generate download URL (use public endpoint for avatars)
    download_url = f"/files/{file_id}"
    
    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename or 'upload',
        file_size=len(content),
        download_url=download_url,
        expires_at=None
    )

@router.options("/files/{file_id}")
async def download_options(file_id: str, response: Response):
    """Handle CORS preflight for download endpoint"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "authorization, content-type"
    response.headers["Access-Control-Max-Age"] = "86400"
    return {"message": "OK"}

@router.get("/files/{file_id}")
async def download_file(file_id: str):
    """Download a file by file ID"""
    file_path = get_file_path(file_id)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get file info from database (optional for backward compatibility)
    try:
        db = get_database()
        file_doc = await db.files.find_one({"file_id": file_id})
        
        if file_doc:
            # For now, allow all files to be accessed publicly (avatars)
            # In the future, we can add authentication for private files
            
            # Increment access count
            await db.files.update_one(
                {"file_id": file_id},
                {"$inc": {"access_count": 1}}
            )
            
            # Check if file is expired
            if file_doc.get("expires_at") and file_doc["expires_at"] < datetime.utcnow():
                raise HTTPException(status_code=410, detail="File has expired")
        else:
            # File exists on disk but not in database - allow public access for avatars
            print(f"File {file_id} exists on disk but not in database - allowing public access")
    except Exception as e:
        print(f"Warning: Failed to access file metadata: {e}")
        # Continue with file serving even if database fails
    
    # Return file
    return FileResponse(
        path=str(file_path),
        filename=file_id,
        media_type='application/octet-stream'
    )

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file by file ID"""
    
    # Check if user owns the file or is admin
    db = get_database()
    file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    user_id = current_user.get("user_id") or current_user.get("id")
    user_role = current_user.get("role", "")
    
    # Check permissions
    if (file_doc.get("uploaded_by") != user_id and 
        user_role not in ["admin", "super_admin", "system_admin"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete file")
    
    # Delete file from filesystem
    file_path = get_file_path(file_id)
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
    
    # Delete file metadata from database
    try:
        await db.files.delete_one({"file_id": file_id})
    except Exception as e:
        print(f"Warning: Failed to delete file metadata: {e}")
    
    return {"message": "File deleted successfully", "file_id": file_id}
