from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import hashlib
import json

# Import database functions
from app.core.database import get_audit_logs_collection
from app.api.auth import get_current_user

# Security scheme
security = HTTPBearer()

def get_client_ip(request: Request) -> str:
    """Get the real client IP address from the request"""
    # Check for forwarded headers first (for proxy/load balancer scenarios)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to client host
    return request.client.host if request.client else "unknown"

async def log_medical_security_event(
    request: Request,
    current_user: dict,
    event_type: str,
    action: str,
    resource: str,
    patient_id: Optional[str] = None,
    screening_id: Optional[str] = None,
    status: str = "success",
    details: str = "",
    severity: str = "low"
):
    """Log a medical portal security event to the audit database"""
    try:
        audit_logs_collection = get_audit_logs_collection()
        
        # Get client information
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "Unknown")
        
        # Create medical security event
        security_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "portal": "medical",  # Distinguish from admin portal
            "user_id": current_user.get("id", "unknown"),
            "user_email": current_user.get("email", "unknown@example.com"),
            "user_role": current_user.get("role", "unknown"),
            "ip_address": client_ip,
            "user_agent": user_agent,
            "resource": resource,
            "action": action,
            "patient_id": patient_id,
            "screening_id": screening_id,
            "status": status,
            "details": details,
            "severity": severity,
            "audit_hash": f"medical_{event_type}_{current_user.get('id', 'unknown')}_{client_ip}_{int(datetime.utcnow().timestamp())}"
        }
        
        # Save to database - REAL IMPLEMENTATION
        await audit_logs_collection.insert_one(security_event)
        
        # Log to console for debugging
        print(f"🏥 MEDICAL SECURITY EVENT: {event_type} - {action} from {client_ip} by {current_user.get('email', 'unknown')}")
        if patient_id:
            print(f"   📋 Patient ID: {patient_id}")
        if screening_id:
            print(f"   👁️ Screening ID: {screening_id}")
        
        return security_event
        
    except Exception as e:
        print(f"Error logging medical security event: {str(e)}")
        return None

async def get_medical_security_events(
    request: Request,
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    event_type: Optional[str] = None,
    patient_id: Optional[str] = None
):
    """Get medical portal security events - Role-based access control"""
    
    # Check if user has medical portal access
    allowed_roles = ["admin", "doctor", "nurse", "teacher", "parent", "medical_staff"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Medical portal access required"
        )
    """Get medical portal security events"""
    try:
        # Log this security events access
        await log_medical_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Medical security events accessed",
            resource="/api/v1/medical/security/events",
            details="Medical staff accessed security audit logs"
        )
        
        # Get real security events from database
        audit_logs_collection = get_audit_logs_collection()
        
        # Build query filter
        query = {"portal": "medical"}
        
        # Role-based filtering: Non-admin users only see their own events
        if current_user["role"] not in ["admin", "super_admin"]:
            query["user_id"] = current_user.get("id")
        
        if event_type:
            query["event_type"] = event_type
        if patient_id:
            query["patient_id"] = patient_id
        
        # Fetch real events from database
        cursor = audit_logs_collection.find(query).sort("timestamp", -1).limit(limit)
        db_events = await cursor.to_list(length=limit)
        
        # Convert database events to response format
        events = []
        for i, event in enumerate(db_events):
            events.append({
                "id": str(event.get("_id", i + 1)),
                "timestamp": event.get("timestamp", ""),
                "event_type": event.get("event_type", ""),
                "portal": event.get("portal", "medical"),  # Include portal field
                "user_id": event.get("user_id", ""),
                "user_email": event.get("user_email", ""),
                "user_role": event.get("user_role", ""),
                "ip_address": event.get("ip_address", ""),
                "user_agent": event.get("user_agent", ""),
                "resource": event.get("resource", ""),
                "action": event.get("action", ""),
                "patient_id": event.get("patient_id", ""),
                "screening_id": event.get("screening_id", ""),
                "status": event.get("status", ""),
                "details": event.get("details", ""),
                "severity": event.get("severity", "low")
            })
        
        return {"events": events}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get medical security events: {str(e)}"
        )

async def get_medical_security_stats(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get medical portal security statistics - Role-based access control"""
    
    # Check if user has medical portal access
    allowed_roles = ["admin", "doctor", "nurse", "teacher", "parent", "medical_staff"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Medical portal access required"
        )
    """Get medical portal security statistics"""
    try:
        # Log this security stats access
        await log_medical_security_event(
            request=request,
            current_user=current_user,
            event_type="access",
            action="Medical security stats accessed",
            resource="/api/v1/medical/security/stats",
            details="Medical staff accessed security statistics"
        )
        
        # Get current client IP
        current_ip = get_client_ip(request)
        
        # Get real security stats from database
        audit_logs_collection = get_audit_logs_collection()
        
        # Calculate real statistics from database (medical portal only)
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Medical portal specific queries
        medical_query = {"portal": "medical"}
        
        # Role-based filtering: Non-admin users only see their own events
        if current_user["role"] not in ["admin", "super_admin"]:
            medical_query["user_id"] = current_user.get("id")
        
        # Total events
        total_events = await audit_logs_collection.count_documents(medical_query)
        
        # Patient data access events
        patient_access_events = await audit_logs_collection.count_documents({
            **medical_query,
            "event_type": "patient_access"
        })
        
        # Screening events
        screening_events = await audit_logs_collection.count_documents({
            **medical_query,
            "event_type": "screening_access"
        })
        
        # Medical record updates
        record_updates = await audit_logs_collection.count_documents({
            **medical_query,
            "event_type": "record_update"
        })
        
        # Failed access attempts
        failed_access = await audit_logs_collection.count_documents({
            **medical_query,
            "status": "failed"
        })
        
        # Last 24h events
        last_24h_events = await audit_logs_collection.count_documents({
            **medical_query,
            "timestamp": {"$gte": yesterday.isoformat()}
        })
        
        # Last 7 days events
        last_7d_events = await audit_logs_collection.count_documents({
            **medical_query,
            "timestamp": {"$gte": week_ago.isoformat()}
        })
        
        # Last 30 days events
        last_30d_events = await audit_logs_collection.count_documents({
            **medical_query,
            "timestamp": {"$gte": month_ago.isoformat()}
        })
        
        # Real medical security stats
        stats = {
            "total_events": total_events,
            "patient_access_events": patient_access_events,
            "screening_events": screening_events,
            "record_updates": record_updates,
            "failed_access": failed_access,
            "last_24h_events": last_24h_events,
            "last_7d_events": last_7d_events,
            "last_30d_events": last_30d_events,
            "current_client_ip": current_ip,
            "current_user_agent": request.headers.get("User-Agent", "Unknown"),
            "last_activity": datetime.utcnow().isoformat()
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get medical security stats: {str(e)}"
        )
