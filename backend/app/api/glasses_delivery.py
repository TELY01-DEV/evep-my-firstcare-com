from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi import status as http_status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import log_security_event
from app.api.auth import get_current_user
from app.utils.timezone import get_current_thailand_time

router = APIRouter()

# Models
class GlassesDeliveryItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    prescription: str

class PrescriptionDetails(BaseModel):
    right_eye: str
    left_eye: str
    pupillary_distance: str

class GlassesDeliveryResponse(BaseModel):
    delivery_id: str
    patient_id: str
    patient_name: str
    patient_cid: str
    glasses_items: List[GlassesDeliveryItem]
    prescription_details: PrescriptionDetails
    delivery_date: str
    delivery_status: str
    delivery_method: str
    delivered_by: str
    school_name: str
    notes: str
    created_at: str
    updated_at: str

# Glasses Delivery Endpoints
@router.get("/glasses-delivery", response_model=List[GlassesDeliveryResponse])
async def get_glasses_deliveries(
    status: Optional[str] = Query(None, description="Filter by delivery status"),
    school: Optional[str] = Query(None, description="Filter by school name"),
    current_user: dict = Depends(get_current_user)
):
    """Get glasses delivery records with optional filtering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "medical_admin", "nurse", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view delivery records"
        )
    
    # Build query
    query = {"is_active": True}
    
    if status:
        query["delivery_status"] = status
    
    if school:
        query["school_name"] = {"$regex": school, "$options": "i"}
    
    # Get delivery records
    deliveries = await db.evep.glasses_delivery.find(query).sort("delivery_date", -1).to_list(None)
    
    result = []
    for delivery in deliveries:
        result.append(GlassesDeliveryResponse(
            delivery_id=delivery["delivery_id"],
            patient_id=delivery["patient_id"],
            patient_name=delivery["patient_name"],
            patient_cid=delivery["patient_cid"],
            glasses_items=delivery["glasses_items"],
            prescription_details=delivery["prescription_details"],
            delivery_date=delivery["delivery_date"].isoformat() if delivery.get("delivery_date") and isinstance(delivery.get("delivery_date"), datetime) else (str(delivery.get("delivery_date")) if delivery.get("delivery_date") else ""),
            delivery_status=delivery["delivery_status"],
            delivery_method=delivery["delivery_method"],
            delivered_by=delivery["delivered_by"],
            school_name=delivery["school_name"],
            notes=delivery["notes"],
            created_at=delivery["created_at"].isoformat() if delivery.get("created_at") and isinstance(delivery.get("created_at"), datetime) else (str(delivery.get("created_at")) if delivery.get("created_at") else ""),
            updated_at=delivery["updated_at"].isoformat() if delivery.get("updated_at") and isinstance(delivery.get("updated_at"), datetime) else (str(delivery.get("updated_at")) if delivery.get("updated_at") else "")
        ))
    
    return result

@router.get("/glasses-delivery/{delivery_id}", response_model=GlassesDeliveryResponse)
async def get_glasses_delivery(
    delivery_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific glasses delivery record"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "medical_admin", "nurse", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view delivery records"
        )
    
    # Get delivery record
    delivery = await db.evep.glasses_delivery.find_one({"delivery_id": delivery_id})
    if not delivery:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Delivery record not found"
        )
    
    return GlassesDeliveryResponse(
        delivery_id=delivery["delivery_id"],
        patient_id=delivery["patient_id"],
        patient_name=delivery["patient_name"],
        patient_cid=delivery["patient_cid"],
        glasses_items=delivery["glasses_items"],
        prescription_details=delivery["prescription_details"],
        delivery_date=delivery["delivery_date"].isoformat() if delivery.get("delivery_date") and isinstance(delivery.get("delivery_date"), datetime) else (str(delivery.get("delivery_date")) if delivery.get("delivery_date") else ""),
        delivery_status=delivery["delivery_status"],
        delivery_method=delivery["delivery_method"],
        delivered_by=delivery["delivered_by"],
        school_name=delivery["school_name"],
        notes=delivery["notes"],
        created_at=delivery["created_at"].isoformat() if delivery.get("created_at") and isinstance(delivery.get("created_at"), datetime) else (str(delivery.get("created_at")) if delivery.get("created_at") else ""),
        updated_at=delivery["updated_at"].isoformat() if delivery.get("updated_at") and isinstance(delivery.get("updated_at"), datetime) else (str(delivery.get("updated_at")) if delivery.get("updated_at") else "")
    )

@router.put("/glasses-delivery/{delivery_id}/status")
async def update_delivery_status(
    delivery_id: str,
    status: str = Query(..., description="New delivery status"),
    notes: Optional[str] = Query(None, description="Additional notes"),
    current_user: dict = Depends(get_current_user)
):
    """Update delivery status"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "medical_admin", "nurse", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update delivery status"
        )
    
    # Update delivery status
    result = await db.evep.glasses_delivery.update_one(
        {"delivery_id": delivery_id},
        {
            "$set": {
                "delivery_status": status,
                "notes": notes or "",
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Delivery record not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_delivery_status",
        details=f"Updated delivery {delivery_id} status to {status}",
        ip_address="system"
    )
    
    return {"message": "Delivery status updated successfully"}

@router.get("/glasses-delivery/stats/overview")
async def get_delivery_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get delivery statistics overview"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "medical_admin", "nurse", "super_admin", "system_admin"]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view delivery statistics"
        )
    
    # Get statistics
    total_deliveries = await db.evep.glasses_delivery.count_documents({"is_active": True})
    pending_deliveries = await db.evep.glasses_delivery.count_documents({"is_active": True, "delivery_status": "pending"})
    delivered_count = await db.evep.glasses_delivery.count_documents({"is_active": True, "delivery_status": "delivered"})
    
    # Get school distribution
    school_stats = await db.evep.glasses_delivery.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$school_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)
    
    return {
        "total_deliveries": total_deliveries,
        "pending_deliveries": pending_deliveries,
        "delivered_count": delivered_count,
        "school_distribution": school_stats
    }

