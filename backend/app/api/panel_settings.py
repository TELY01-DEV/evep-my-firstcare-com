from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

from app.api.auth import get_current_user

router = APIRouter()

# Pydantic models for panel settings
class PanelSettings(BaseModel):
    # General Settings
    panelName: str = "EVEP Medical Professional Panel"
    panelDescription: str = "Comprehensive vision screening and patient management system"
    timezone: str = "Asia/Bangkok"
    dateFormat: str = "DD/MM/YYYY"
    timeFormat: str = "HH:mm:ss"
    language: str = "th"
    showLiveClock: bool = True
    clockFormat: str = "24h"
    
    # Display Settings
    theme: str = "light"
    compactMode: bool = False
    showAnimations: bool = True
    autoRefresh: bool = True
    refreshInterval: int = 30
    
    # Notification Settings
    emailNotifications: bool = True
    pushNotifications: bool = True
    screeningAlerts: bool = True
    appointmentReminders: bool = True
    systemUpdates: bool = False
    
    # Security Settings
    sessionTimeout: int = 30
    requirePasswordChange: bool = False
    twoFactorAuth: bool = False
    auditLogging: bool = True
    
    # Medical Settings
    defaultScreeningType: str = "standard"
    autoSaveScreeningData: bool = True
    patientDataRetention: int = 7
    medicalAlerts: bool = True



# File path for storing panel settings
SETTINGS_FILE = "panel_settings.json"

def load_settings() -> PanelSettings:
    """Load panel settings from file"""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return PanelSettings(**data)
        else:
            # Return default settings if file doesn't exist
            return PanelSettings()
    except Exception as e:
        print(f"Error loading settings: {e}")
        return PanelSettings()

def save_settings(settings: PanelSettings) -> bool:
    """Save panel settings to file"""
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings.dict(), f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False

@router.get("/")
async def get_panel_settings(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current panel settings"""
    try:
        settings = load_settings()
        return {
            "success": True,
            "settings": settings.dict(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load panel settings: {str(e)}"
        )

@router.put("/")
async def update_panel_settings(
    settings: PanelSettings,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update panel settings"""
    try:
        # Save settings
        if save_settings(settings):
            return {
                "success": True,
                "message": "Panel settings updated successfully",
                "settings": settings.dict(),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save panel settings"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update panel settings: {str(e)}"
        )

@router.post("/reset")
async def reset_panel_settings(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Reset panel settings to defaults"""
    try:
        default_settings = PanelSettings()
        if save_settings(default_settings):
            return {
                "success": True,
                "message": "Panel settings reset to defaults",
                "settings": default_settings.dict(),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset panel settings"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset panel settings: {str(e)}"
        )

@router.get("/timezone-options")
async def get_timezone_options():
    """Get available timezone options"""
    timezones = [
        {"value": "Asia/Bangkok", "label": "Asia/Bangkok (GMT+7)", "offset": "+07:00"},
        {"value": "Asia/Singapore", "label": "Asia/Singapore (GMT+8)", "offset": "+08:00"},
        {"value": "Asia/Tokyo", "label": "Asia/Tokyo (GMT+9)", "offset": "+09:00"},
        {"value": "Asia/Seoul", "label": "Asia/Seoul (GMT+9)", "offset": "+09:00"},
        {"value": "Asia/Shanghai", "label": "Asia/Shanghai (GMT+8)", "offset": "+08:00"},
        {"value": "UTC", "label": "UTC (GMT+0)", "offset": "+00:00"},
        {"value": "America/New_York", "label": "America/New_York (GMT-5)", "offset": "-05:00"},
        {"value": "America/Los_Angeles", "label": "America/Los_Angeles (GMT-8)", "offset": "-08:00"},
        {"value": "Europe/London", "label": "Europe/London (GMT+0)", "offset": "+00:00"},
        {"value": "Europe/Paris", "label": "Europe/Paris (GMT+1)", "offset": "+01:00"},
    ]
    
    return {
        "success": True,
        "timezones": timezones
    }

@router.get("/language-options")
async def get_language_options():
    """Get available language options"""
    languages = [
        {"value": "th", "label": "ไทย (Thai)", "native": "ไทย"},
        {"value": "en", "label": "English", "native": "English"},
        {"value": "zh", "label": "中文 (Chinese)", "native": "中文"},
        {"value": "ja", "label": "日本語 (Japanese)", "native": "日本語"},
        {"value": "ko", "label": "한국어 (Korean)", "native": "한국어"},
    ]
    
    return {
        "success": True,
        "languages": languages
    }

@router.get("/date-format-options")
async def get_date_format_options():
    """Get available date format options"""
    formats = [
        {"value": "DD/MM/YYYY", "label": "DD/MM/YYYY", "example": "31/12/2024"},
        {"value": "MM/DD/YYYY", "label": "MM/DD/YYYY", "example": "12/31/2024"},
        {"value": "YYYY-MM-DD", "label": "YYYY-MM-DD", "example": "2024-12-31"},
        {"value": "DD-MM-YYYY", "label": "DD-MM-YYYY", "example": "31-12-2024"},
    ]
    
    return {
        "success": True,
        "formats": formats
    }

@router.get("/time-format-options")
async def get_time_format_options():
    """Get available time format options"""
    formats = [
        {"value": "HH:mm:ss", "label": "24-hour", "example": "14:30:25"},
        {"value": "hh:mm:ss A", "label": "12-hour", "example": "02:30:25 PM"},
        {"value": "HH:mm", "label": "24-hour short", "example": "14:30"},
        {"value": "hh:mm A", "label": "12-hour short", "example": "02:30 PM"},
    ]
    
    return {
        "success": True,
        "formats": formats
    }

@router.get("/current-time")
async def get_current_time(
    timezone: str = "Asia/Bangkok"
):
    """Get current time in specified timezone"""
    try:
        from datetime import datetime
        import pytz
        
        tz = pytz.timezone(timezone)
        current_time = datetime.now(tz)
        
        return {
            "success": True,
            "timezone": timezone,
            "current_time": current_time.isoformat(),
            "formatted_time": current_time.strftime("%H:%M:%S"),
            "formatted_date": current_time.strftime("%Y-%m-%d"),
            "day_of_week": current_time.strftime("%A"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timezone: {str(e)}"
        )
