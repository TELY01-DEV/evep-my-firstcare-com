"""
Timezone utilities for EVEP Platform
Handles timestamp formatting and conversion for GMT+7 (Thailand timezone)
"""

from datetime import datetime, timedelta
import pytz
from typing import Optional, Union

def get_thailand_timezone():
    """Get Thailand timezone (GMT+7)"""
    return pytz.timezone('Asia/Bangkok')

def get_current_thailand_time() -> datetime:
    """Get current time in Thailand timezone"""
    thailand_tz = get_thailand_timezone()
    return datetime.now(thailand_tz)

def format_timestamp_for_frontend(timestamp: Union[str, datetime], format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format timestamp for frontend display in GMT+7
    
    Args:
        timestamp: ISO string or datetime object
        format_str: Format string for display
    
    Returns:
        Formatted timestamp string in GMT+7
    """
    thailand_tz = get_thailand_timezone()
    
    if isinstance(timestamp, str):
        # Parse ISO string
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            # Try parsing without timezone info
            dt = datetime.fromisoformat(timestamp)
    else:
        dt = timestamp
    
    # If datetime is naive (no timezone), assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    
    # Convert to Thailand timezone
    thailand_time = dt.astimezone(thailand_tz)
    
    return thailand_time.strftime(format_str)

def format_date_for_frontend(timestamp: Union[str, datetime]) -> str:
    """Format date for frontend display (YYYY-MM-DD)"""
    return format_timestamp_for_frontend(timestamp, "%Y-%m-%d")

def format_datetime_for_frontend(timestamp: Union[str, datetime]) -> str:
    """Format datetime for frontend display (YYYY-MM-DD HH:MM:SS)"""
    return format_timestamp_for_frontend(timestamp, "%Y-%m-%d %H:%M:%S")

def format_time_for_frontend(timestamp: Union[str, datetime]) -> str:
    """Format time for frontend display (HH:MM:SS)"""
    return format_timestamp_for_frontend(timestamp, "%H:%M:%S")

def get_relative_time(timestamp: Union[str, datetime]) -> str:
    """
    Get relative time string (e.g., "2 hours ago", "yesterday")
    
    Args:
        timestamp: ISO string or datetime object
    
    Returns:
        Relative time string
    """
    thailand_tz = get_thailand_timezone()
    now = datetime.now(thailand_tz)
    
    if isinstance(timestamp, str):
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            dt = datetime.fromisoformat(timestamp)
    else:
        dt = timestamp
    
    # If datetime is naive, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    
    # Convert to Thailand timezone
    thailand_time = dt.astimezone(thailand_tz)
    
    # Calculate time difference
    diff = now - thailand_time
    
    if diff.days > 0:
        if diff.days == 1:
            return "yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        else:
            return format_date_for_frontend(thailand_time)
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        if hours == 1:
            return "1 hour ago"
        else:
            return f"{hours} hours ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        if minutes == 1:
            return "1 minute ago"
        else:
            return f"{minutes} minutes ago"
    else:
        return "just now"

def convert_utc_to_thailand(utc_timestamp: Union[str, datetime]) -> str:
    """
    Convert UTC timestamp to Thailand timezone string
    
    Args:
        utc_timestamp: UTC timestamp as string or datetime
    
    Returns:
        Thailand timezone timestamp as ISO string
    """
    if isinstance(utc_timestamp, str):
        dt = datetime.fromisoformat(utc_timestamp.replace('Z', '+00:00'))
    else:
        dt = utc_timestamp
    
    # If datetime is naive, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    
    # Convert to Thailand timezone
    thailand_tz = get_thailand_timezone()
    thailand_time = dt.astimezone(thailand_tz)
    
    return thailand_time.isoformat()

def get_thailand_time_range(hours: int = 24) -> tuple[str, str]:
    """
    Get time range in Thailand timezone
    
    Args:
        hours: Number of hours to look back
    
    Returns:
        Tuple of (start_time, end_time) in ISO format
    """
    thailand_tz = get_thailand_timezone()
    now = datetime.now(thailand_tz)
    start_time = now - timedelta(hours=hours)
    
    return start_time.isoformat(), now.isoformat()
