from fastapi import APIRouter, HTTPException, Depends, Query, status
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
class GlassesItemCreate(BaseModel):
    item_code: str = Field(..., description="Unique item code")
    item_name: str = Field(..., description="Item name/description")
    category: str = Field(..., description="Category: 'frames', 'lenses', 'accessories'")
    brand: Optional[str] = None
    model: Optional[str] = None
    specifications: Optional[dict] = None
    unit_price: float = Field(..., description="Unit price in THB")
    cost_price: float = Field(..., description="Cost price in THB")
    initial_stock: int = Field(..., description="Initial stock quantity")
    reorder_level: int = Field(..., description="Reorder level threshold")
    supplier_info: Optional[dict] = None
    notes: Optional[str] = None

class GlassesItemUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    specifications: Optional[dict] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None
    reorder_level: Optional[int] = None
    supplier_info: Optional[dict] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class StockAdjustment(BaseModel):
    item_id: str
    adjustment_type: str = Field(..., description="Type: 'in', 'out', 'adjustment'")
    quantity: int = Field(..., description="Quantity to adjust")
    reason: str = Field(..., description="Reason for adjustment")
    reference_document: Optional[str] = None
    notes: Optional[str] = None

class GlassesOrderCreate(BaseModel):
    patient_id: str
    diagnosis_id: str
    items: List[dict] = Field(..., description="List of items with quantities")
    prescription_details: Optional[dict] = None
    special_requirements: Optional[str] = None
    priority: str = Field(..., description="Priority: 'normal', 'urgent', 'emergency'")
    expected_delivery_date: Optional[str] = None
    notes: Optional[str] = None

class GlassesOrderUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Status: 'pending', 'processing', 'ready', 'delivered', 'cancelled'")
    items: Optional[List[dict]] = None
    prescription_details: Optional[dict] = None
    special_requirements: Optional[str] = None
    priority: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    actual_delivery_date: Optional[str] = None
    notes: Optional[str] = None

class GlassesItemResponse(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    specifications: Optional[dict] = None
    unit_price: float
    cost_price: float
    current_stock: int
    reorder_level: int
    supplier_info: Optional[dict] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str

class GlassesOrderResponse(BaseModel):
    order_id: str
    patient_id: str
    patient_name: str
    diagnosis_id: str
    items: List[dict]
    prescription_details: Optional[dict] = None
    special_requirements: Optional[str] = None
    priority: str
    status: str
    expected_delivery_date: Optional[str] = None
    actual_delivery_date: Optional[str] = None
    total_cost: float
    created_by: str
    created_by_name: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class StockAdjustmentResponse(BaseModel):
    adjustment_id: str
    item_id: str
    item_name: str
    adjustment_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reason: str
    reference_document: Optional[str] = None
    notes: Optional[str] = None
    adjusted_by: str
    adjusted_by_name: str
    created_at: str

# Glasses Inventory Endpoints
@router.post("/inventory/glasses", response_model=GlassesItemResponse)
async def create_glasses_item(
    item_data: GlassesItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new glasses inventory item"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create inventory items"
        )
    
    # Check if item code already exists
    existing_item = await db.evep.glasses_inventory.find_one({"item_code": item_data.item_code})
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item code already exists"
        )
    
    # Create item document
    item_doc = {
        "item_code": item_data.item_code,
        "item_name": item_data.item_name,
        "category": item_data.category,
        "brand": item_data.brand,
        "model": item_data.model,
        "specifications": item_data.specifications or {},
        "unit_price": item_data.unit_price,
        "cost_price": item_data.cost_price,
        "current_stock": item_data.initial_stock,
        "reorder_level": item_data.reorder_level,
        "supplier_info": item_data.supplier_info or {},
        "notes": item_data.notes,
        "is_active": True,
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.glasses_inventory.insert_one(item_doc)
    
    # Create initial stock adjustment record
    if item_data.initial_stock > 0:
        adjustment_doc = {
            "item_id": result.inserted_id,
            "adjustment_type": "in",
            "quantity": item_data.initial_stock,
            "previous_stock": 0,
            "new_stock": item_data.initial_stock,
            "reason": "Initial stock",
            "adjusted_by": ObjectId(current_user["user_id"]),
            "created_at": get_current_thailand_time()
        }
        await db.evep.stock_adjustments.insert_one(adjustment_doc)
    
    # Log audit
    from app.core.security import log_security_event
    from fastapi import Request
    
    # Create a mock request object for logging
    class MockRequest:
        def __init__(self):
            self.client = type('obj', (object,), {'host': 'system'})()
    
    mock_request = MockRequest()
    log_security_event(
        request=mock_request,
        event_type="create_glasses_item",
        description=f"Created glasses item: {item_data.item_name}",
        portal="inventory"
    )
    
    # Get creator name
    creator = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    creator_name = f"{creator.get('first_name', '')} {creator.get('last_name', '')}" if creator else "Unknown"
    
    return GlassesItemResponse(
        item_id=str(result.inserted_id),
        item_code=item_data.item_code,
        item_name=item_data.item_name,
        category=item_data.category,
        brand=item_data.brand,
        model=item_data.model,
        specifications=item_data.specifications,
        unit_price=item_data.unit_price,
        cost_price=item_data.cost_price,
        current_stock=item_data.initial_stock,
        reorder_level=item_data.reorder_level,
        supplier_info=item_data.supplier_info,
        notes=item_data.notes,
        is_active=True,
        created_at=item_doc["created_at"].isoformat(),
        updated_at=item_doc["updated_at"].isoformat()
    )


@router.get("/inventory/glasses", response_model=List[GlassesItemResponse])
async def get_glasses_inventory(
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    in_stock: Optional[bool] = Query(None, description="Filter by stock availability"),
    current_user: dict = Depends(get_current_user)
):
    """Get glasses inventory items with optional filtering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view inventory"
        )
    
    # Build query
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    
    if brand:
        query["brand"] = brand
    
    if in_stock is not None:
        if in_stock:
            query["current_stock"] = {"$gt": 0}
        else:
            query["current_stock"] = {"$lte": 0}
    
    # Get items
    items = await db.evep.glasses_inventory.find(query).sort("item_name", 1).to_list(None)
    
    result = []
    for item in items:
        result.append(GlassesItemResponse(
            item_id=str(item["_id"]),
            item_code=item["item_code"],
            item_name=item["item_name"],
            category=item["category"],
            brand=item.get("brand"),
            model=item.get("model"),
            specifications=item.get("specifications", {}),
            unit_price=item["unit_price"],
            cost_price=item["cost_price"],
            current_stock=item["current_stock"],
            reorder_level=item["reorder_level"],
            supplier_info=item.get("supplier_info", {}),
            notes=item.get("notes"),
            is_active=item.get("is_active", True),
            created_at=item["created_at"].isoformat(),
            updated_at=item["updated_at"].isoformat()
        ))
    
    return result


@router.get("/inventory/glasses/{item_id}", response_model=GlassesItemResponse)
async def get_glasses_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific glasses inventory item"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view inventory"
        )
    
    # Get item
    item = await db.evep.glasses_inventory.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return GlassesItemResponse(
        item_id=str(item["_id"]),
        item_code=item["item_code"],
        item_name=item["item_name"],
        category=item["category"],
        brand=item.get("brand"),
        model=item.get("model"),
        specifications=item.get("specifications", {}),
        unit_price=item["unit_price"],
        cost_price=item["cost_price"],
        current_stock=item["current_stock"],
        reorder_level=item["reorder_level"],
        supplier_info=item.get("supplier_info", {}),
        notes=item.get("notes"),
        is_active=item.get("is_active", True),
        created_at=item["created_at"].isoformat(),
        updated_at=item["updated_at"].isoformat()
    )


@router.put("/inventory/glasses/{item_id}", response_model=GlassesItemResponse)
async def update_glasses_item(
    item_id: str,
    update_data: GlassesItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a glasses inventory item"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update inventory items"
        )
    
    # Get existing item
    item = await db.evep.glasses_inventory.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Build update document
    update_doc = {"updated_at": get_current_thailand_time()}
    
    if update_data.item_name is not None:
        update_doc["item_name"] = update_data.item_name
    
    if update_data.category is not None:
        update_doc["category"] = update_data.category
    
    if update_data.brand is not None:
        update_doc["brand"] = update_data.brand
    
    if update_data.model is not None:
        update_doc["model"] = update_data.model
    
    if update_data.specifications is not None:
        update_doc["specifications"] = update_data.specifications
    
    if update_data.unit_price is not None:
        update_doc["unit_price"] = update_data.unit_price
    
    if update_data.cost_price is not None:
        update_doc["cost_price"] = update_data.cost_price
    
    if update_data.reorder_level is not None:
        update_doc["reorder_level"] = update_data.reorder_level
    
    if update_data.supplier_info is not None:
        update_doc["supplier_info"] = update_data.supplier_info
    
    if update_data.notes is not None:
        update_doc["notes"] = update_data.notes
    
    if update_data.is_active is not None:
        update_doc["is_active"] = update_data.is_active
    
    # Update item
    result = await db.evep.glasses_inventory.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_glasses_item",
        details=f"Updated glasses item: {item_id}",
        ip_address="system"
    )
    
    # Return updated item
    return await get_glasses_item(item_id, current_user)


@router.post("/inventory/glasses/{item_id}/adjust-stock", response_model=StockAdjustmentResponse)
async def adjust_stock(
    item_id: str,
    adjustment_data: StockAdjustment,
    current_user: dict = Depends(get_current_user)
):
    """Adjust stock for a glasses inventory item"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to adjust stock"
        )
    
    # Get item
    item = await db.evep.glasses_inventory.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Calculate new stock
    previous_stock = item["current_stock"]
    
    if adjustment_data.adjustment_type == "in":
        new_stock = previous_stock + adjustment_data.quantity
    elif adjustment_data.adjustment_type == "out":
        if previous_stock < adjustment_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock for adjustment"
            )
        new_stock = previous_stock - adjustment_data.quantity
    elif adjustment_data.adjustment_type == "adjustment":
        new_stock = adjustment_data.quantity
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid adjustment type"
        )
    
    # Update stock
    await db.evep.glasses_inventory.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$set": {
                "current_stock": new_stock,
                "updated_at": get_current_thailand_time()
            }
        }
    )
    
    # Create adjustment record
    adjustment_doc = {
        "item_id": ObjectId(item_id),
        "adjustment_type": adjustment_data.adjustment_type,
        "quantity": adjustment_data.quantity,
        "previous_stock": previous_stock,
        "new_stock": new_stock,
        "reason": adjustment_data.reason,
        "reference_document": adjustment_data.reference_document,
        "notes": adjustment_data.notes,
        "adjusted_by": ObjectId(current_user["user_id"]),
        "created_at": get_current_thailand_time()
    }
    
    adjustment_result = await db.evep.stock_adjustments.insert_one(adjustment_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="adjust_stock",
        details=f"Adjusted stock for item {item_id}: {adjustment_data.quantity} {adjustment_data.adjustment_type}",
        ip_address="system"
    )
    
    # Get adjuster name
    adjuster = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    adjuster_name = f"{adjuster.get('first_name', '')} {adjuster.get('last_name', '')}" if adjuster else "Unknown"
    
    return StockAdjustmentResponse(
        adjustment_id=str(adjustment_result.inserted_id),
        item_id=item_id,
        item_name=item["item_name"],
        adjustment_type=adjustment_data.adjustment_type,
        quantity=adjustment_data.quantity,
        previous_stock=previous_stock,
        new_stock=new_stock,
        reason=adjustment_data.reason,
        reference_document=adjustment_data.reference_document,
        notes=adjustment_data.notes,
        adjusted_by=current_user["user_id"],
        adjusted_by_name=adjuster_name,
        created_at=adjustment_doc["created_at"].isoformat()
    )


@router.get("/inventory/glasses/available")
async def get_available_glasses(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: dict = Depends(get_current_user)
):
    """Get available glasses items for ordering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "doctor", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view inventory"
        )
    
    # Build query for available items
    query = {
        "is_active": True,
        "current_stock": {"$gt": 0}
    }
    
    if category:
        query["category"] = category
    
    # Get available items
    items = await db.evep.glasses_inventory.find(query).sort("item_name", 1).to_list(None)
    
    result = []
    for item in items:
        result.append({
            "item_id": str(item["_id"]),
            "item_code": item["item_code"],
            "item_name": item["item_name"],
            "category": item["category"],
            "brand": item.get("brand"),
            "model": item.get("model"),
            "specifications": item.get("specifications", {}),
            "unit_price": item["unit_price"],
            "current_stock": item["current_stock"],
            "available": item["current_stock"] > 0
        })
    
    return {
        "available_items": result,
        "total_available": len(result),
        "categories": list(set([item["category"] for item in result]))
    }


@router.get("/inventory/glasses/low-stock")
async def get_low_stock_items(
    current_user: dict = Depends(get_current_user)
):
    """Get items that are below reorder level"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view inventory"
        )
    
    # Get items below reorder level
    items = await db.evep.glasses_inventory.find({
        "is_active": True,
        "$expr": {"$lte": ["$current_stock", "$reorder_level"]}
    }).sort("current_stock", 1).to_list(None)
    
    result = []
    for item in items:
        result.append({
            "item_id": str(item["_id"]),
            "item_code": item["item_code"],
            "item_name": item["item_name"],
            "category": item["category"],
            "current_stock": item["current_stock"],
            "reorder_level": item["reorder_level"],
            "unit_price": item["unit_price"],
            "supplier_info": item.get("supplier_info", {})
        })
    
    return {
        "low_stock_items": result,
        "total_low_stock": len(result),
        "categories_affected": list(set([item["category"] for item in result]))
    }


@router.get("/inventory/glasses/stats")
async def get_inventory_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get inventory statistics"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["admin", "medical_staff", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view inventory statistics"
        )
    
    # Get total items
    total_items = await db.evep.glasses_inventory.count_documents({"is_active": True})
    
    # Get items by category
    category_stats = await db.evep.glasses_inventory.aggregate([
        {"$match": {"is_active": True}},
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "total_stock": {"$sum": "$current_stock"},
                "total_value": {"$sum": {"$multiply": ["$current_stock", "$unit_price"]}}
            }
        }
    ]).to_list(None)
    
    # Get low stock items count
    low_stock_count = await db.evep.glasses_inventory.count_documents({
        "is_active": True,
        "$expr": {"$lte": ["$current_stock", "$reorder_level"]}
    })
    
    # Get out of stock items count
    out_of_stock_count = await db.evep.glasses_inventory.count_documents({
        "is_active": True,
        "current_stock": 0
    })
    
    # Calculate total inventory value
    total_value = sum(stat["total_value"] for stat in category_stats)
    
    return {
        "total_items": total_items,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "total_inventory_value": total_value,
        "categories": {stat["_id"]: {
            "count": stat["count"],
            "total_stock": stat["total_stock"],
            "total_value": stat["total_value"]
        } for stat in category_stats}
    }
