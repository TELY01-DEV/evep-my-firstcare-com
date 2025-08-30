"""
Settings Management API for EVEP Platform
=========================================

This module provides API endpoints for managing system settings
stored in MongoDB, allowing dynamic configuration changes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.api.auth import get_current_user
from app.core.settings_manager import settings_manager

router = APIRouter()

# Pydantic Models
class SettingCreate(BaseModel):
    key: str
    value: Any
    category: str = "general"
    description: str = ""

class SettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None

class SettingResponse(BaseModel):
    key: str
    value: Any
    category: str
    description: str
    updated_at: Optional[datetime]
    updated_by: str

@router.get("/settings")
async def get_all_settings(current_user: dict = Depends(get_current_user)):
    """Get all system settings"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        settings = await settings_manager.get_all_settings()
        return {"settings": settings}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings: {str(e)}"
        )

@router.get("/settings/{category}")
async def get_settings_by_category(category: str, current_user: dict = Depends(get_current_user)):
    """Get settings by category"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        settings = await settings_manager.get_settings_by_category(category)
        return {"category": category, "settings": settings}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings for category {category}: {str(e)}"
        )

@router.get("/settings/key/{key}")
async def get_setting(key: str, current_user: dict = Depends(get_current_user)):
    """Get a specific setting by key"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        value = await settings_manager.get_setting(key)
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Setting '{key}' not found"
            )
        
        return {"key": key, "value": value}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get setting {key}: {str(e)}"
        )

@router.post("/settings")
async def create_setting(setting_data: SettingCreate, current_user: dict = Depends(get_current_user)):
    """Create a new setting"""
    
    # Check if user has super admin permissions
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        success = await settings_manager.set_setting(
            key=setting_data.key,
            value=setting_data.value,
            category=setting_data.category,
            description=setting_data.description
        )
        
        if success:
            return {"message": f"Setting '{setting_data.key}' created successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create setting"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create setting: {str(e)}"
        )

@router.put("/settings/{key}")
async def update_setting(key: str, setting_data: SettingUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing setting"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Check if setting exists
        existing_value = await settings_manager.get_setting(key)
        if existing_value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Setting '{key}' not found"
            )
        
        success = await settings_manager.set_setting(
            key=key,
            value=setting_data.value,
            description=setting_data.description or ""
        )
        
        if success:
            return {"message": f"Setting '{key}' updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update setting"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update setting: {str(e)}"
        )

@router.delete("/settings/{key}")
async def delete_setting(key: str, current_user: dict = Depends(get_current_user)):
    """Delete a setting"""
    
    # Check if user has super admin permissions
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        success = await settings_manager.delete_setting(key)
        
        if success:
            return {"message": f"Setting '{key}' deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Setting '{key}' not found"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete setting: {str(e)}"
        )

@router.post("/settings/initialize")
async def initialize_settings(current_user: dict = Depends(get_current_user)):
    """Initialize default settings"""
    
    # Check if user has super admin permissions
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        await settings_manager.initialize_default_settings()
        return {"message": "Default settings initialized successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize settings: {str(e)}"
        )

@router.get("/settings/config/combined")
async def get_combined_config(current_user: dict = Depends(get_current_user)):
    """Get combined configuration from environment and MongoDB"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        config = await settings_manager.get_combined_config()
        return {"config": config}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get combined config: {str(e)}"
        )

@router.get("/settings/categories")
async def get_setting_categories(current_user: dict = Depends(get_current_user)):
    """Get all available setting categories"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        settings = await settings_manager.get_all_settings()
        categories = set()
        
        for setting in settings.values():
            if isinstance(setting, dict) and "category" in setting:
                categories.add(setting["category"])
        
        return {"categories": list(categories)}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get categories: {str(e)}"
        )
