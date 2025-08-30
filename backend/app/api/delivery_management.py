from fastapi import APIRouter, HTTPException, Depends, Query, status
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
class DeliveryCreate(BaseModel):
    patient_id: str
    glasses_order_id: str
    school_id: str
    delivery_address: str
    contact_person: str
    contact_phone: str
    expected_delivery_date: str = Field(..., description="Expected delivery date (YYYY-MM-DD)")
    delivery_instructions: Optional[str] = None
    priority: str = Field(..., description="Priority: 'normal', 'urgent', 'emergency'")
    notes: Optional[str] = None

class DeliveryUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Status: 'scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'")
    actual_delivery_date: Optional[str] = None
    delivery_notes: Optional[str] = None
    recipient_signature: Optional[str] = None
    delivery_confirmation: Optional[bool] = None
    notes: Optional[str] = None

class DeliveryScheduleCreate(BaseModel):
    delivery_id: str
    scheduled_date: str = Field(..., description="Scheduled delivery date (YYYY-MM-DD)")
    scheduled_time: str = Field(..., description="Scheduled delivery time (HH:MM)")
    delivery_route: Optional[str] = None
    assigned_driver: Optional[str] = None
    vehicle_info: Optional[dict] = None
    notes: Optional[str] = None

class DeliveryConfirmation(BaseModel):
    delivery_id: str
    confirmation_type: str = Field(..., description="Type: 'delivered', 'failed', 'rescheduled'")
    confirmation_date: str = Field(..., description="Confirmation date (YYYY-MM-DD)")
    recipient_name: str
    recipient_phone: str
    signature: Optional[str] = None
    delivery_notes: Optional[str] = None
    photos: Optional[List[str]] = None
    notes: Optional[str] = None

class DeliveryResponse(BaseModel):
    delivery_id: str
    patient_id: str
    patient_name: str
    glasses_order_id: str
    school_id: str
    school_name: str
    delivery_address: str
    contact_person: str
    contact_phone: str
    expected_delivery_date: str
    actual_delivery_date: Optional[str] = None
    delivery_instructions: Optional[str] = None
    priority: str
    status: str
    delivery_notes: Optional[str] = None
    recipient_signature: Optional[str] = None
    delivery_confirmation: Optional[bool] = None
    created_by: str
    created_by_name: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class DeliveryScheduleResponse(BaseModel):
    schedule_id: str
    delivery_id: str
    scheduled_date: str
    scheduled_time: str
    delivery_route: Optional[str] = None
    assigned_driver: Optional[str] = None
    vehicle_info: Optional[dict] = None
    status: str
    created_by: str
    created_by_name: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class DeliveryConfirmationResponse(BaseModel):
    confirmation_id: str
    delivery_id: str
    confirmation_type: str
    confirmation_date: str
    recipient_name: str
    recipient_phone: str
    signature: Optional[str] = None
    delivery_notes: Optional[str] = None
    photos: Optional[List[str]] = None
    confirmed_by: str
    confirmed_by_name: str
    notes: Optional[str] = None
    created_at: str

# Delivery Management Endpoints
@router.post("/deliveries", response_model=DeliveryResponse)
async def create_delivery(
    delivery_data: DeliveryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new delivery record"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create deliveries"
        )
    
    # Validate patient exists
    patient = await db.evep.patients.find_one({"_id": ObjectId(delivery_data.patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate school exists
    school = await db.evep.schools.find_one({"_id": ObjectId(delivery_data.school_id)})
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Validate expected delivery date
    try:
        expected_date = datetime.strptime(delivery_data.expected_delivery_date, "%Y-%m-%d").date()
        if expected_date < datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expected delivery date cannot be in the past"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Create delivery document
    delivery_doc = {
        "patient_id": ObjectId(delivery_data.patient_id),
        "glasses_order_id": ObjectId(delivery_data.glasses_order_id),
        "school_id": ObjectId(delivery_data.school_id),
        "delivery_address": delivery_data.delivery_address,
        "contact_person": delivery_data.contact_person,
        "contact_phone": delivery_data.contact_phone,
        "expected_delivery_date": expected_date,
        "delivery_instructions": delivery_data.delivery_instructions,
        "priority": delivery_data.priority,
        "status": "scheduled",
        "notes": delivery_data.notes,
        "created_by": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.deliveries.insert_one(delivery_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_delivery",
        details=f"Created delivery for patient {delivery_data.patient_id}",
        ip_address="system"
    )
    
    # Get creator name
    creator = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    creator_name = f"{creator.get('first_name', '')} {creator.get('last_name', '')}" if creator else "Unknown"
    
    return DeliveryResponse(
        delivery_id=str(result.inserted_id),
        patient_id=delivery_data.patient_id,
        patient_name=f"{patient.get('first_name', '')} {patient.get('last_name', '')}",
        glasses_order_id=delivery_data.glasses_order_id,
        school_id=delivery_data.school_id,
        school_name=school.get("name", "Unknown School"),
        delivery_address=delivery_data.delivery_address,
        contact_person=delivery_data.contact_person,
        contact_phone=delivery_data.contact_phone,
        expected_delivery_date=delivery_data.expected_delivery_date,
        delivery_instructions=delivery_data.delivery_instructions,
        priority=delivery_data.priority,
        status="scheduled",
        notes=delivery_data.notes,
        created_by=current_user["user_id"],
        created_by_name=creator_name,
        created_at=delivery_doc["created_at"].isoformat(),
        updated_at=delivery_doc["updated_at"].isoformat()
    )


@router.get("/deliveries/school/{school_id}", response_model=List[DeliveryResponse])
async def get_school_deliveries(
    school_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """Get deliveries for a specific school"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view deliveries"
        )
    
    # Build query
    query = {"school_id": ObjectId(school_id)}
    
    if status:
        query["status"] = status
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
            query["expected_delivery_date"] = {"$gte": from_date}
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
            if "expected_delivery_date" in query:
                query["expected_delivery_date"]["$lte"] = to_date
            else:
                query["expected_delivery_date"] = {"$lte": to_date}
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    # Get deliveries
    deliveries = await db.evep.deliveries.find(query).sort("expected_delivery_date", 1).to_list(None)
    
    result = []
    for delivery in deliveries:
        # Get patient name
        patient = await db.evep.patients.find_one({"_id": delivery["patient_id"]})
        patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}" if patient else "Unknown"
        
        # Get school name
        school = await db.evep.schools.find_one({"_id": delivery["school_id"]})
        school_name = school.get("name", "Unknown School") if school else "Unknown School"
        
        # Get creator name
        creator = await db.evep.users.find_one({"_id": delivery["created_by"]})
        creator_name = f"{creator.get('first_name', '')} {creator.get('last_name', '')}" if creator else "Unknown"
        
        result.append(DeliveryResponse(
            delivery_id=str(delivery["_id"]),
            patient_id=str(delivery["patient_id"]),
            patient_name=patient_name,
            glasses_order_id=str(delivery["glasses_order_id"]),
            school_id=str(delivery["school_id"]),
            school_name=school_name,
            delivery_address=delivery["delivery_address"],
            contact_person=delivery["contact_person"],
            contact_phone=delivery["contact_phone"],
            expected_delivery_date=delivery["expected_delivery_date"].isoformat() if isinstance(delivery["expected_delivery_date"], datetime) else str(delivery["expected_delivery_date"]),
            actual_delivery_date=delivery.get("actual_delivery_date").isoformat() if delivery.get("actual_delivery_date") else None,
            delivery_instructions=delivery.get("delivery_instructions"),
            priority=delivery["priority"],
            status=delivery["status"],
            delivery_notes=delivery.get("delivery_notes"),
            recipient_signature=delivery.get("recipient_signature"),
            delivery_confirmation=delivery.get("delivery_confirmation"),
            notes=delivery.get("notes"),
            created_by=str(delivery["created_by"]),
            created_by_name=creator_name,
            created_at=delivery["created_at"].isoformat(),
            updated_at=delivery["updated_at"].isoformat()
        ))
    
    return result


@router.put("/deliveries/{delivery_id}/status")
async def update_delivery_status(
    delivery_id: str,
    update_data: DeliveryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update delivery status"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update deliveries"
        )
    
    # Get existing delivery
    delivery = await db.evep.deliveries.find_one({"_id": ObjectId(delivery_id)})
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    # Build update document
    update_doc = {"updated_at": get_current_thailand_time()}
    
    if update_data.status is not None:
        update_doc["status"] = update_data.status
    
    if update_data.actual_delivery_date is not None:
        try:
            actual_date = datetime.strptime(update_data.actual_delivery_date, "%Y-%m-%d").date()
            update_doc["actual_delivery_date"] = actual_date
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if update_data.delivery_notes is not None:
        update_doc["delivery_notes"] = update_data.delivery_notes
    
    if update_data.recipient_signature is not None:
        update_doc["recipient_signature"] = update_data.recipient_signature
    
    if update_data.delivery_confirmation is not None:
        update_doc["delivery_confirmation"] = update_data.delivery_confirmation
    
    if update_data.notes is not None:
        update_doc["notes"] = update_data.notes
    
    # Update delivery
    result = await db.evep.deliveries.update_one(
        {"_id": ObjectId(delivery_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_delivery_status",
        details=f"Updated delivery {delivery_id} status to {update_data.status}",
        ip_address="system"
    )
    
    return {"message": "Delivery status updated successfully"}


@router.post("/deliveries/{delivery_id}/confirm", response_model=DeliveryConfirmationResponse)
async def confirm_delivery(
    delivery_id: str,
    confirmation_data: DeliveryConfirmation,
    current_user: dict = Depends(get_current_user)
):
    """Confirm delivery completion"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to confirm deliveries"
        )
    
    # Get delivery
    delivery = await db.evep.deliveries.find_one({"_id": ObjectId(delivery_id)})
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    # Validate confirmation date
    try:
        confirmation_date = datetime.strptime(confirmation_data.confirmation_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Create confirmation document
    confirmation_doc = {
        "delivery_id": ObjectId(delivery_id),
        "confirmation_type": confirmation_data.confirmation_type,
        "confirmation_date": confirmation_date,
        "recipient_name": confirmation_data.recipient_name,
        "recipient_phone": confirmation_data.recipient_phone,
        "signature": confirmation_data.signature,
        "delivery_notes": confirmation_data.delivery_notes,
        "photos": confirmation_data.photos or [],
        "notes": confirmation_data.notes,
        "confirmed_by": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time()
    }
    
    result = await db.evep.delivery_confirmations.insert_one(confirmation_doc)
    
    # Update delivery status
    delivery_status = "delivered" if confirmation_data.confirmation_type == "delivered" else "failed"
    await db.evep.deliveries.update_one(
        {"_id": ObjectId(delivery_id)},
        {
            "$set": {
                "status": delivery_status,
                "actual_delivery_date": confirmation_date,
                "delivery_confirmation": True,
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="confirm_delivery",
        details=f"Confirmed delivery {delivery_id} as {confirmation_data.confirmation_type}",
        ip_address="system"
    )
    
    # Get confirmer name
    confirmer = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    confirmer_name = f"{confirmer.get('first_name', '')} {confirmer.get('last_name', '')}" if confirmer else "Unknown"
    
    return DeliveryConfirmationResponse(
        confirmation_id=str(result.inserted_id),
        delivery_id=delivery_id,
        confirmation_type=confirmation_data.confirmation_type,
        confirmation_date=confirmation_data.confirmation_date,
        recipient_name=confirmation_data.recipient_name,
        recipient_phone=confirmation_data.recipient_phone,
        signature=confirmation_data.signature,
        delivery_notes=confirmation_data.delivery_notes,
        photos=confirmation_data.photos,
        confirmed_by=current_user["user_id"],
        confirmed_by_name=confirmer_name,
        notes=confirmation_data.notes,
        created_at=confirmation_doc["created_at"].isoformat()
    )


@router.get("/deliveries/upcoming")
async def get_upcoming_deliveries(
    days: int = Query(7, description="Number of days to look ahead"),
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming deliveries within specified days"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view deliveries"
        )
    
    # Calculate date range
    today = datetime.now().date()
    end_date = today + timedelta(days=days)
    
    # Get upcoming deliveries
    deliveries = await db.evep.deliveries.find({
        "expected_delivery_date": {"$gte": today, "$lte": end_date},
        "status": {"$in": ["scheduled", "in_transit"]}
    }).sort("expected_delivery_date", 1).to_list(None)
    
    result = []
    for delivery in deliveries:
        # Get patient name
        patient = await db.evep.patients.find_one({"_id": delivery["patient_id"]})
        patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}" if patient else "Unknown"
        
        # Get school name
        school = await db.evep.schools.find_one({"_id": delivery["school_id"]})
        school_name = school.get("name", "Unknown School") if school else "Unknown School"
        
        result.append({
            "delivery_id": str(delivery["_id"]),
            "patient_name": patient_name,
            "school_name": school_name,
            "expected_delivery_date": delivery["expected_delivery_date"].isoformat() if isinstance(delivery["expected_delivery_date"], datetime) else str(delivery["expected_delivery_date"]),
            "priority": delivery["priority"],
            "status": delivery["status"],
            "contact_person": delivery["contact_person"],
            "contact_phone": delivery["contact_phone"],
            "delivery_address": delivery["delivery_address"]
        })
    
    return {
        "upcoming_deliveries": result,
        "total_upcoming": len(result),
        "date_range": {
            "from": today.isoformat(),
            "to": end_date.isoformat(),
            "days": days
        }
    }


@router.get("/deliveries/stats")
async def get_delivery_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get delivery statistics"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view delivery statistics"
        )
    
    # Get total deliveries
    total_deliveries = await db.evep.deliveries.count_documents({})
    
    # Get deliveries by status
    status_stats = await db.evep.deliveries.aggregate([
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get deliveries by priority
    priority_stats = await db.evep.deliveries.aggregate([
        {
            "$group": {
                "_id": "$priority",
                "count": {"$sum": 1}
            }
        }
    ]).to_list(None)
    
    # Get recent deliveries (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_deliveries = await db.evep.deliveries.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Get on-time deliveries
    on_time_deliveries = await db.evep.deliveries.count_documents({
        "status": "delivered",
        "$expr": {
            "$lte": ["$actual_delivery_date", "$expected_delivery_date"]
        }
    })
    
    # Get delayed deliveries
    delayed_deliveries = await db.evep.deliveries.count_documents({
        "status": "delivered",
        "$expr": {
            "$gt": ["$actual_delivery_date", "$expected_delivery_date"]
        }
    })
    
    return {
        "total_deliveries": total_deliveries,
        "recent_deliveries": recent_deliveries,
        "on_time_deliveries": on_time_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "delivery_success_rate": (on_time_deliveries / (on_time_deliveries + delayed_deliveries) * 100) if (on_time_deliveries + delayed_deliveries) > 0 else 0,
        "status_distribution": {stat["_id"]: stat["count"] for stat in status_stats},
        "priority_distribution": {stat["_id"]: stat["count"] for stat in priority_stats}
    }
