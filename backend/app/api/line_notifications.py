from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi import status as http_status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import log_security_event
from app.api.auth import get_current_user
from app.utils.timezone import get_current_thailand_time

router = APIRouter()

# Models
class LineNotificationCreate(BaseModel):
    student_id: str
    parent_id: str
    appointment_id: str
    notification_type: str = Field(..., description="Type: 'consent_request', 'reminder', 'results', 'follow_up'")
    message_template: str = Field(..., description="Message template to send")
    line_user_id: Optional[str] = None
    scheduled_time: Optional[str] = None

class ConsentRequestCreate(BaseModel):
    student_id: str
    parent_id: str
    appointment_id: str
    consent_type: str = Field(..., description="Type: 'screening', 'treatment', 'data_sharing'")
    consent_details: str = Field(..., description="Detailed consent information")
    expiry_date: Optional[str] = None

class ConsentResponse(BaseModel):
    consent_id: str
    response: str = Field(..., description="Response: 'approved', 'declined'")
    response_notes: Optional[str] = None

class LineNotificationResponse(BaseModel):
    notification_id: str
    student_id: str
    parent_id: str
    appointment_id: str
    notification_type: str
    message_content: str
    line_user_id: Optional[str] = None
    status: str
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    read_at: Optional[str] = None
    response_received: bool = False
    response_content: Optional[str] = None
    created_at: str
    updated_at: str

class ConsentRequestResponse(BaseModel):
    consent_id: str
    student_id: str
    parent_id: str
    appointment_id: str
    consent_type: str
    consent_details: str
    consent_status: str
    response: Optional[str] = None
    response_notes: Optional[str] = None
    response_date: Optional[str] = None
    expiry_date: Optional[str] = None
    created_at: str
    updated_at: str

class NotificationTemplate(BaseModel):
    template_id: str
    template_name: str
    template_type: str
    subject: str
    message_template: str
    variables: List[str] = Field(default_factory=list, description="Template variables")
    is_active: bool = True
    created_at: str
    updated_at: str

# LINE Notification Endpoints
@router.post("/notifications/line/send", response_model=LineNotificationResponse)
async def send_line_notification(
    notification_data: LineNotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a LINE notification to a parent"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "teacher", "admin", "super_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to send LINE notifications"
        )
    
    # Validate student exists
    student = await db.evep.students.find_one({"_id": ObjectId(notification_data.student_id)})
    if not student:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate parent exists
    parent = await db.evep.parents.find_one({"_id": ObjectId(notification_data.parent_id)})
    if not parent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    # Validate appointment exists
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(notification_data.appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Get LINE user ID from parent data or use provided one
    line_user_id = notification_data.line_user_id or parent.get("line_user_id")
    if not line_user_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Parent does not have LINE user ID configured"
        )
    
    # Create notification document
    notification_doc = {
        "student_id": ObjectId(notification_data.student_id),
        "parent_id": ObjectId(notification_data.parent_id),
        "appointment_id": ObjectId(notification_data.appointment_id),
        "notification_type": notification_data.notification_type,
        "message_content": notification_data.message_template,
        "line_user_id": line_user_id,
        "status": "pending",
        "scheduled_time": notification_data.scheduled_time,
        "response_received": False,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.line_notifications.insert_one(notification_doc)
    
    # TODO: Integrate with actual LINE Bot API
    # For now, simulate sending
    try:
        # Simulate LINE Bot API call
        # line_bot_api.push_message(line_user_id, TextSendMessage(text=notification_data.message_template))
        
        # Update status to sent
        await db.evep.line_notifications.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": get_current_thailand_time(),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
        
        notification_doc["status"] = "sent"
        notification_doc["sent_at"] = get_current_thailand_time()
        
    except Exception as e:
        # Update status to failed
        await db.evep.line_notifications.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
        
        notification_doc["status"] = "failed"
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="send_line_notification",
        details=f"Sent LINE notification to parent {notification_data.parent_id} for student {notification_data.student_id}",
        ip_address="system"
    )
    
    return LineNotificationResponse(
        notification_id=str(result.inserted_id),
        student_id=notification_data.student_id,
        parent_id=notification_data.parent_id,
        appointment_id=notification_data.appointment_id,
        notification_type=notification_data.notification_type,
        message_content=notification_data.message_template,
        line_user_id=line_user_id,
        status=notification_doc["status"],
        sent_at=notification_doc.get("sent_at").isoformat() if notification_doc.get("sent_at") else None,
        created_at=notification_doc["created_at"].isoformat(),
        updated_at=notification_doc["updated_at"].isoformat()
    )


@router.post("/notifications/line/send-consent", response_model=LineNotificationResponse)
async def send_consent_notification(
    consent_data: ConsentRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send consent request notification via LINE"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "teacher", "admin", "super_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to send consent notifications"
        )
    
    # Validate student exists
    student = await db.evep.students.find_one({"_id": ObjectId(consent_data.student_id)})
    if not student:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate parent exists
    parent = await db.evep.parents.find_one({"_id": ObjectId(consent_data.parent_id)})
    if not parent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    # Validate appointment exists
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(consent_data.appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Create consent request
    consent_doc = {
        "student_id": ObjectId(consent_data.student_id),
        "parent_id": ObjectId(consent_data.parent_id),
        "appointment_id": ObjectId(consent_data.appointment_id),
        "consent_type": consent_data.consent_type,
        "consent_details": consent_data.consent_details,
        "status": "pending",
        "expiry_date": consent_data.expiry_date,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    consent_result = await db.evep.consent_requests.insert_one(consent_doc)
    
    # Get LINE user ID from parent
    line_user_id = parent.get("line_user_id")
    if not line_user_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Parent does not have LINE user ID configured"
        )
    
    # Create consent message
    consent_message = f"""
🔔 Consent Request for {student.get('first_name', 'Student')} {student.get('last_name', '')}

Type: {consent_data.consent_type.replace('_', ' ').title()}
Details: {consent_data.consent_details}

Please respond with:
✅ APPROVE - to give consent
❌ DECLINE - to decline consent

Reply with your choice to proceed.
    """.strip()
    
    # Create notification
    notification_doc = {
        "student_id": ObjectId(consent_data.student_id),
        "parent_id": ObjectId(consent_data.parent_id),
        "appointment_id": ObjectId(consent_data.appointment_id),
        "notification_type": "consent_request",
        "message_content": consent_message,
        "line_user_id": line_user_id,
        "status": "pending",
        "consent_request_id": consent_result.inserted_id,
        "response_received": False,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    notification_result = await db.evep.line_notifications.insert_one(notification_doc)
    
    # TODO: Integrate with actual LINE Bot API
    try:
        # Simulate LINE Bot API call
        # line_bot_api.push_message(line_user_id, TextSendMessage(text=consent_message))
        
        # Update status to sent
        await db.evep.line_notifications.update_one(
            {"_id": notification_result.inserted_id},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": get_current_thailand_time(),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
        
        notification_doc["status"] = "sent"
        notification_doc["sent_at"] = get_current_thailand_time()
        
    except Exception as e:
        # Update status to failed
        await db.evep.line_notifications.update_one(
            {"_id": notification_result.inserted_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "updated_at": get_current_thailand_time()
                }
            }
        )
        
        notification_doc["status"] = "failed"
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="send_consent_notification",
        details=f"Sent consent request to parent {consent_data.parent_id} for student {consent_data.student_id}",
        ip_address="system"
    )
    
    return LineNotificationResponse(
        notification_id=str(notification_result.inserted_id),
        student_id=consent_data.student_id,
        parent_id=consent_data.parent_id,
        appointment_id=consent_data.appointment_id,
        notification_type="consent_request",
        message_content=consent_message,
        line_user_id=line_user_id,
        status=notification_doc["status"],
        sent_at=notification_doc.get("sent_at").isoformat() if notification_doc.get("sent_at") else None,
        created_at=notification_doc["created_at"].isoformat(),
        updated_at=notification_doc["updated_at"].isoformat()
    )


@router.get("/notifications/line/status/{notification_id}", response_model=LineNotificationResponse)
async def get_notification_status(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the status of a LINE notification"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "teacher", "admin", "super_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view notification status"
        )
    
    # Get notification
    notification = await db.evep.line_notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return LineNotificationResponse(
        notification_id=str(notification["_id"]),
        student_id=str(notification["student_id"]),
        parent_id=str(notification["parent_id"]),
        appointment_id=str(notification["appointment_id"]),
        notification_type=notification["notification_type"],
        message_content=notification["message_content"],
        line_user_id=notification.get("line_user_id"),
        status=notification["status"],
        sent_at=notification.get("sent_at").isoformat() if notification.get("sent_at") else None,
        delivered_at=notification.get("delivered_at").isoformat() if notification.get("delivered_at") else None,
        read_at=notification.get("read_at").isoformat() if notification.get("read_at") else None,
        response_received=notification.get("response_received", False),
        response_content=notification.get("response_content"),
        created_at=notification["created_at"].isoformat(),
        updated_at=notification["updated_at"].isoformat()
    )


@router.get("/consent/requests", response_model=List[ConsentRequestResponse])
async def get_consent_requests(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    parent_id: Optional[str] = Query(None, description="Filter by parent ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Get consent requests with optional filtering"""
    try:
        db = get_database()
        
        # Check permissions
        if current_user["role"] not in ["medical_staff", "doctor", "teacher", "admin", "super_admin"]:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view consent requests"
            )
        
        # Build query
        query = {}
        
        if student_id:
            try:
                query["student_id"] = ObjectId(student_id)
            except Exception:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Invalid student ID format"
                )
        
        if parent_id:
            try:
                query["parent_id"] = ObjectId(parent_id)
            except Exception:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Invalid parent ID format"
                )
        
        if status_filter:
            query["status"] = status_filter
        
        # Get consent requests
        consent_requests = await db.evep.consent_requests.find(query).sort("created_at", -1).to_list(None)
        
        result = []
        for consent in consent_requests:
            try:
                # Safely access fields with defaults
                consent_id = str(consent.get("_id", ""))
                student_id_val = str(consent.get("student_id", ""))
                parent_id_val = str(consent.get("parent_id", ""))
                appointment_id = str(consent.get("appointment_id", ""))
                consent_type = consent.get("consent_type", "")
                consent_details = consent.get("consent_details", "")
                consent_status = consent.get("status", "")
                
                # Handle datetime fields safely
                response_date = None
                if consent.get("response_date"):
                    try:
                        response_date = consent["response_date"].isoformat()
                    except (AttributeError, TypeError):
                        response_date = None
                
                created_at = ""
                if consent.get("created_at"):
                    try:
                        created_at = consent["created_at"].isoformat()
                    except (AttributeError, TypeError):
                        created_at = ""
                
                updated_at = ""
                if consent.get("updated_at"):
                    try:
                        updated_at = consent["updated_at"].isoformat()
                    except (AttributeError, TypeError):
                        updated_at = ""
                
                result.append(ConsentRequestResponse(
                    consent_id=consent_id,
                    student_id=student_id_val,
                    parent_id=parent_id_val,
                    appointment_id=appointment_id,
                    consent_type=consent_type,
                    consent_details=consent_details,
                    consent_status=consent_status,
                    response=consent.get("response"),
                    response_notes=consent.get("response_notes"),
                    response_date=response_date,
                    expiry_date=consent.get("expiry_date"),
                    created_at=created_at,
                    updated_at=updated_at
                ))
            except Exception as e:
                # Log the error but continue processing other records
                print(f"Error processing consent request {consent.get('_id', 'unknown')}: {str(e)}")
                continue
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching consent requests: {str(e)}"
        )


@router.put("/consent/{consent_id}/response")
async def update_consent_response(
    consent_id: str,
    response_data: ConsentResponse,
    current_user: dict = Depends(get_current_user)
):
    """Update consent response (typically called by LINE Bot webhook)"""
    db = get_database()
    
    # Get consent request
    consent = await db.evep.consent_requests.find_one({"_id": ObjectId(consent_id)})
    if not consent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Consent request not found"
        )
    
    # Update consent response
    update_doc = {
        "status": "responded",
        "response": response_data.response,
        "response_notes": response_data.response_notes,
        "response_date": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.consent_requests.update_one(
        {"_id": ObjectId(consent_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Consent request not found"
        )
    
    # Update related notification
    await db.evep.line_notifications.update_one(
        {"consent_request_id": ObjectId(consent_id)},
        {
            "$set": {
                "response_received": True,
                "response_content": response_data.response,
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    # Log audit
    await log_security_event(
        user_id=current_user.get("user_id", "line_bot"),
        action="consent_response_received",
        details=f"Consent response received for request {consent_id}: {response_data.response}",
        ip_address="system"
    )
    
    return {"message": "Consent response updated successfully"}


@router.get("/notifications/templates", response_model=List[NotificationTemplate])
async def get_notification_templates(
    template_type: Optional[str] = Query(None, description="Filter by template type"),
    current_user: dict = Depends(get_current_user)
):
    """Get notification templates"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "teacher", "admin", "super_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view notification templates"
        )
    
    # Build query
    query = {"is_active": True}
    if template_type:
        query["template_type"] = template_type
    
    # Get templates
    templates = await db.evep.notification_templates.find(query).sort("template_name", 1).to_list(None)
    
    result = []
    for template in templates:
        result.append(NotificationTemplate(
            template_id=str(template["_id"]),
            template_name=template["template_name"],
            template_type=template["template_type"],
            subject=template["subject"],
            message_template=template["message_template"],
            variables=template.get("variables", []),
            is_active=template.get("is_active", True),
            created_at=template["created_at"].isoformat(),
            updated_at=template["updated_at"].isoformat()
        ))
    
    return result


@router.post("/notifications/templates", response_model=NotificationTemplate)
async def create_notification_template(
    template_data: NotificationTemplate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification template"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create notification templates"
        )
    
    # Create template document
    template_doc = {
        "template_name": template_data.template_name,
        "template_type": template_data.template_type,
        "subject": template_data.subject,
        "message_template": template_data.message_template,
        "variables": template_data.variables,
        "is_active": template_data.is_active,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.notification_templates.insert_one(template_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_notification_template",
        details=f"Created notification template: {template_data.template_name}",
        ip_address="system"
    )
    
    return NotificationTemplate(
        template_id=str(result.inserted_id),
        template_name=template_data.template_name,
        template_type=template_data.template_type,
        subject=template_data.subject,
        message_template=template_data.message_template,
        variables=template_data.variables,
        is_active=template_data.is_active,
        created_at=template_doc["created_at"].isoformat(),
        updated_at=template_doc["updated_at"].isoformat()
    )
