"""
Master Geographic Data, Hospital Data API endpoints
Provides access to master data collections including hospitals, provinces, districts, subdistricts, and hospital types
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Body
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from bson import ObjectId
import json
from app.core.database import (
    get_database,
    get_allhospitals_collection,
    get_hospitaltypes_collection,
    get_provinces_collection,
    get_districts_collection,
    get_subdistricts_collection,
    get_migration_summaries_collection
)
from app.api.auth import get_current_user
from app.shared.models.user import User
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def convert_objectid_to_str(obj):
    """Convert ObjectId to string recursively"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    else:
        return obj

# Helper function to get zipcode based on province and subdistrict code
def get_zipcode_for_subdistrict(province_name, subdistrict_code=None):
    """Get zipcode based on province name and optionally subdistrict code"""
    # Thai province to base zipcode mapping
    province_zipcode_map = {
        "กรุงเทพมหานคร": "10",
        "นนทบุรี": "11",
        "ปทุมธานี": "12",
        "สมุทรปราการ": "10",  # Same as Bangkok
        "สมุทรสาคร": "74",
        "นครปฐม": "73",
        "กาญจนบุรี": "71",
        "ราชบุรี": "70",
        "เพชรบุรี": "76",
        "ประจวบคีรีขันธ์": "77",
        "ชุมพร": "86",
        "สุราษฎร์ธานี": "84",
        "นครศรีธรรมราช": "80",
        "กระบี่": "81",
        "พังงา": "82",
        "ภูเก็ต": "83",
        "ตรัง": "92",
        "สตูล": "91",
        "สงขลา": "90",
        "ยะลา": "95",
        "นราธิวาส": "96",
        "ปัตตานี": "94",
        "นครราชสีมา": "30",
        "บุรีรัมย์": "31",
        "สุรินทร์": "32",
        "ศรีสะเกษ": "33",
        "อุบลราชธานี": "34",
        "ยโสธร": "35",
        "ชัยภูมิ": "36",
        "อำนาจเจริญ": "37",
        "หนองบัวลำภู": "39",
        "ขอนแก่น": "40",
        "อุดรธานี": "41",
        "เลย": "42",
        "หนองคาย": "43",
        "มหาสารคาม": "44",
        "ร้อยเอ็ด": "45",
        "กาฬสินธุ์": "46",
        "สกลนคร": "47",
        "นครพนม": "48",
        "มุกดาหาร": "49",
        "เชียงใหม่": "50",
        "ลำพูน": "51",
        "ลำปาง": "52",
        "อุตรดิตถ์": "53",
        "แพร่": "54",
        "น่าน": "55",
        "พะเยา": "56",
        "เชียงราย": "57",
        "แม่ฮ่องสอน": "58",
        "นครสวรรค์": "60",
        "อุทัยธานี": "61",
        "กำแพงเพชร": "62",
        "ตาก": "63",
        "สุโขทัย": "64",
        "พิษณุโลก": "65",
        "พิจิตร": "66",
        "เพชรบูรณ์": "67",
        "สุพรรณบุรี": "72",
        "สมุทรสงคราม": "75",
        "ระนอง": "85",
        "พัทลุง": "93"
    }
    
    # Get province code
    province_code = ""
    if isinstance(province_name, dict):
        # If it's an object with en/th keys, use the Thai name
        thai_name = province_name.get('th', '')
        province_code = province_zipcode_map.get(thai_name, '')
    else:
        # If it's a string, try to match directly
        province_code = province_zipcode_map.get(province_name, '')
    
    if not province_code:
        return ''
    
    # If we have a subdistrict code, try to generate a more specific zipcode
    if subdistrict_code and len(str(subdistrict_code)) >= 6:
        # Extract the last 3 digits from the subdistrict code for more specificity
        subdistrict_suffix = str(subdistrict_code)[-3:]
        return f"{province_code}{subdistrict_suffix}"
    else:
        # Default to province base zipcode with 000
        return f"{province_code}000"

router = APIRouter()

# Pydantic Models for CRUD Operations
class ProvinceCreate(BaseModel):
    name: str
    active: bool = True
    note: Optional[str] = None
    countryId: Optional[str] = None

class ProvinceUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    note: Optional[str] = None
    countryId: Optional[str] = None

class DistrictCreate(BaseModel):
    name: str
    active: bool = True
    note: Optional[str] = None
    provinceId: str
    countryId: Optional[str] = None

class DistrictUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    note: Optional[str] = None
    provinceId: Optional[str] = None
    countryId: Optional[str] = None

class SubdistrictCreate(BaseModel):
    name: str
    active: bool = True
    note: Optional[str] = None
    provinceId: str
    districtId: str
    countryId: Optional[str] = None
    zipcode: Optional[str] = None

class SubdistrictUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    note: Optional[str] = None
    provinceId: Optional[str] = None
    districtId: Optional[str] = None
    countryId: Optional[str] = None
    zipcode: Optional[str] = None

class HospitalTypeCreate(BaseModel):
    name: str
    note: Optional[str] = None
    pictures: Optional[List[str]] = None

class HospitalTypeUpdate(BaseModel):
    name: Optional[str] = None
    note: Optional[str] = None
    pictures: Optional[List[str]] = None

class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hospitalType: Optional[str] = None
    provinceId: Optional[str] = None
    districtId: Optional[str] = None
    subDistrictId: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    pictures: Optional[List[str]] = None
    visible: bool = True
    remark: Optional[str] = None

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hospitalType: Optional[str] = None
    provinceId: Optional[str] = None
    districtId: Optional[str] = None
    subDistrictId: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    pictures: Optional[List[str]] = None
    visible: Optional[bool] = None
    remark: Optional[str] = None

@router.get("/hospitals", response_model=Dict[str, Any])
async def get_hospitals(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of documents to return"),
    province_id: Optional[str] = Query(None, description="Filter by province ID"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    subdistrict_id: Optional[str] = Query(None, description="Filter by subdistrict ID"),
    hospital_type_id: Optional[str] = Query(None, description="Filter by hospital type ID"),
    search: Optional[str] = Query(None, description="Search in hospital name"),
    current_user: User = Depends(get_current_user)
):
    """Get hospitals with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        
        if province_id:
            filter_query["provinceId"] = ObjectId(province_id)
        if district_id:
            filter_query["districtId"] = ObjectId(district_id)
        if subdistrict_id:
            filter_query["subDistrictId"] = ObjectId(subdistrict_id)
        if hospital_type_id:
            filter_query["hospitalType"] = hospital_type_id
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        
        # Get hospitals collection using proper getter
        hospitals_collection = get_allhospitals_collection()
        
        # Get total count
        total_count = await hospitals_collection.count_documents(filter_query)
        
        # Get hospitals
        cursor = hospitals_collection.find(filter_query).skip(skip).limit(limit)
        hospitals = await cursor.to_list(length=limit)
        
        # Remove migration metadata from response and convert ObjectId to string
        for hospital in hospitals:
            hospital.pop('_migration_metadata', None)
            hospital.pop('_created_at', None)
            hospital.pop('_updated_at', None)
        
        # Convert ObjectId to string for JSON serialization
        hospitals = convert_objectid_to_str(hospitals)
        
        return {
            "hospitals": hospitals,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching hospitals: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/hospitals/{hospital_id}")
async def get_hospital_by_id(
    hospital_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """Get a specific hospital by ID"""
    try:
        hospital = await db.allhospitals.find_one({"_id": hospital_id})
        
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        # Remove migration metadata
        hospital.pop('_migration_metadata', None)
        hospital.pop('_created_at', None)
        hospital.pop('_updated_at', None)
        
        return hospital
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching hospital {hospital_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/provinces", response_model=Dict[str, Any])
async def get_provinces(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of documents to return"),
    search: Optional[str] = Query(None, description="Search in province name"),
    current_user: User = Depends(get_current_user)
):
    """Get provinces with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        
        # Get provinces collection using proper getter
        provinces_collection = get_provinces_collection()
        
        # Get total count
        total_count = await provinces_collection.count_documents(filter_query)
        
        # Get provinces
        cursor = provinces_collection.find(filter_query).skip(skip).limit(limit)
        provinces = await cursor.to_list(length=limit)
        
        # Remove migration metadata from response and convert ObjectId to string
        for province in provinces:
            province.pop('_migration_metadata', None)
            province.pop('_created_at', None)
            province.pop('_updated_at', None)
        
        # Convert ObjectId to string for JSON serialization
        provinces = convert_objectid_to_str(provinces)
        
        return {
            "provinces": provinces,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching provinces: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/districts", response_model=Dict[str, Any])
async def get_districts(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of documents to return"),
    province_id: Optional[str] = Query(None, description="Filter by province ID"),
    search: Optional[str] = Query(None, description="Search in district name"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    current_user: User = Depends(get_current_user)
):
    """Get districts with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        
        if province_id:
            filter_query["provinceId"] = ObjectId(province_id)
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        if status:
            if status == "active":
                filter_query["active"] = True
            elif status == "inactive":
                filter_query["active"] = False
        
        # Get districts collection using proper getter
        districts_collection = get_districts_collection()
        
        # Get total count
        total_count = await districts_collection.count_documents(filter_query)
        
        # Get districts
        cursor = districts_collection.find(filter_query).skip(skip).limit(limit)
        districts = await cursor.to_list(length=limit)
        
        # Remove migration metadata from response and convert ObjectId to string
        for district in districts:
            district.pop('_migration_metadata', None)
            district.pop('_created_at', None)
            district.pop('_updated_at', None)
        
        # Convert ObjectId to string for JSON serialization
        districts = convert_objectid_to_str(districts)
        
        return {
            "districts": districts,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching districts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/subdistricts", response_model=Dict[str, Any])
async def get_subdistricts(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of documents to return"),
    province_id: Optional[str] = Query(None, description="Filter by province ID"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    search: Optional[str] = Query(None, description="Search in subdistrict name"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    current_user: User = Depends(get_current_user)
):
    """Get subdistricts with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        
        if province_id:
            filter_query["provinceId"] = ObjectId(province_id)
        if district_id:
            filter_query["districtId"] = ObjectId(district_id)
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        if status:
            if status == "active":
                filter_query["active"] = True
            elif status == "inactive":
                filter_query["active"] = False
        
        # Get subdistricts collection using proper getter
        subdistricts_collection = get_subdistricts_collection()
        
        # Get total count
        total_count = await subdistricts_collection.count_documents(filter_query)
        
        # Get subdistricts
        cursor = subdistricts_collection.find(filter_query).skip(skip).limit(limit)
        subdistricts = await cursor.to_list(length=limit)
        
        # Get provinces collection to fetch province names for zipcode mapping
        provinces_collection = get_provinces_collection()
        
        # Remove migration metadata from response and convert ObjectId to string
        for subdistrict in subdistricts:
            subdistrict.pop('_migration_metadata', None)
            subdistrict.pop('_created_at', None)
            subdistrict.pop('_updated_at', None)
            
            # Add zipcode information - use stored zipcode if available, otherwise generate
            if 'zipcode' not in subdistrict or not subdistrict['zipcode']:
                if 'provinceId' in subdistrict:
                    try:
                        province = await provinces_collection.find_one({"_id": ObjectId(subdistrict['provinceId'])})
                        if province and 'name' in province:
                            # Get subdistrict code if available
                            subdistrict_code = subdistrict.get('code', None)
                            zipcode = get_zipcode_for_subdistrict(province['name'], subdistrict_code)
                            subdistrict['zipcode'] = zipcode
                    except Exception as e:
                        logger.warning(f"Could not fetch province for zipcode: {e}")
                        subdistrict['zipcode'] = ''
                else:
                    subdistrict['zipcode'] = ''
        
        # Convert ObjectId to string for JSON serialization
        subdistricts = convert_objectid_to_str(subdistricts)
        
        return {
            "subdistricts": subdistricts,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching subdistricts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/hospital-types", response_model=Dict[str, Any])
async def get_hospital_types(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of documents to return"),
    search: Optional[str] = Query(None, description="Search in hospital type name"),
    current_user: User = Depends(get_current_user)
):
    """Get hospital types with optional filtering and pagination"""
    try:
        # Build filter query
        filter_query = {}
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        
        # Get hospital types collection using proper getter
        hospital_types_collection = get_hospitaltypes_collection()
        
        # Get total count
        total_count = await hospital_types_collection.count_documents(filter_query)
        
        # Get hospital types
        cursor = hospital_types_collection.find(filter_query).skip(skip).limit(limit)
        hospital_types = await cursor.to_list(length=limit)
        
        # Remove migration metadata from response and convert ObjectId to string
        for hospital_type in hospital_types:
            hospital_type.pop('_migration_metadata', None)
            hospital_type.pop('_created_at', None)
            hospital_type.pop('_updated_at', None)
        
        # Convert ObjectId to string for JSON serialization
        hospital_types = convert_objectid_to_str(hospital_types)
        
        return {
            "hospital_types": hospital_types,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching hospital types: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/migration-summary")
async def get_migration_summary(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """Get master data migration summary"""
    try:
        summary = await db.migration_summaries.find_one({})
        
        if not summary:
            raise HTTPException(status_code=404, detail="Migration summary not found")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching migration summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats")
async def get_master_data_stats(
    current_user: User = Depends(get_current_user)
):
    """Get statistics for all master data collections"""
    try:
        stats = {}
        
        # Get counts for each collection using proper collection getters
        allhospitals_collection = get_allhospitals_collection()
        hospitaltypes_collection = get_hospitaltypes_collection()
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        subdistricts_collection = get_subdistricts_collection()
        
        stats['allhospitals'] = await allhospitals_collection.count_documents({})
        stats['hospitaltypes'] = await hospitaltypes_collection.count_documents({})
        stats['provinces'] = await provinces_collection.count_documents({})
        stats['districts'] = await districts_collection.count_documents({})
        stats['subdistricts'] = await subdistricts_collection.count_documents({})
        
        return {
            "collection_stats": stats,
            "total_documents": sum(stats.values()),
            "collections": len(stats)
        }
        
    except Exception as e:
        logger.error(f"Error fetching master data stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== PROVINCES CRUD ====================

@router.post("/provinces", response_model=Dict[str, Any])
async def create_province(
    province_data: ProvinceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new province"""
    try:
        provinces_collection = get_provinces_collection()
        
        # Check if province with same name already exists
        existing = await provinces_collection.find_one({"name": province_data.name})
        if existing:
            raise HTTPException(status_code=400, detail="Province with this name already exists")
        
        # Create province document
        province_doc = {
            "name": province_data.name,
            "active": province_data.active,
            "note": province_data.note,
            "countryId": province_data.countryId,
            "createdAt": datetime.utcnow().isoformat(),
            "modifiedAt": datetime.utcnow().isoformat(),
            "createdBy": current_user.id
        }
        
        result = await provinces_collection.insert_one(province_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Province created successfully",
            "province": province_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating province: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/provinces/{province_id}")
async def update_province(
    province_id: str,
    province_data: ProvinceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a province"""
    try:
        provinces_collection = get_provinces_collection()
        
        # Check if province exists
        existing = await provinces_collection.find_one({"_id": ObjectId(province_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Province not found")
        
        # Prepare update data
        update_data = {k: v for k, v in province_data.dict().items() if v is not None}
        update_data["modifiedAt"] = datetime.utcnow().isoformat()
        update_data["modifiedBy"] = current_user.id
        
        # Update province
        result = await provinces_collection.update_one(
            {"_id": ObjectId(province_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Province updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating province: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/provinces/{province_id}")
async def delete_province(
    province_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a province"""
    try:
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        subdistricts_collection = get_subdistricts_collection()
        
        # Check if province exists
        existing = await provinces_collection.find_one({"_id": ObjectId(province_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Province not found")
        
        # Check if province has districts
        district_count = await districts_collection.count_documents({"provinceId": province_id})
        if district_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete province with districts")
        
        # Check if province has subdistricts
        subdistrict_count = await subdistricts_collection.count_documents({"provinceId": province_id})
        if subdistrict_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete province with subdistricts")
        
        # Delete province
        result = await provinces_collection.delete_one({"_id": ObjectId(province_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete province")
        
        return {"message": "Province deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting province: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== DISTRICTS CRUD ====================

@router.post("/districts", response_model=Dict[str, Any])
async def create_district(
    district_data: DistrictCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new district"""
    try:
        districts_collection = get_districts_collection()
        provinces_collection = get_provinces_collection()
        
        # Check if province exists
        province = await provinces_collection.find_one({"_id": ObjectId(district_data.provinceId)})
        if not province:
            raise HTTPException(status_code=400, detail="Province not found")
        
        # Check if district with same name in province already exists
        existing = await districts_collection.find_one({
            "name": district_data.name,
            "provinceId": district_data.provinceId
        })
        if existing:
            raise HTTPException(status_code=400, detail="District with this name already exists in this province")
        
        # Create district document
        district_doc = {
            "name": district_data.name,
            "active": district_data.active,
            "note": district_data.note,
            "provinceId": district_data.provinceId,
            "countryId": district_data.countryId,
            "createdAt": datetime.utcnow().isoformat(),
            "modifiedAt": datetime.utcnow().isoformat(),
            "createdBy": current_user.id
        }
        
        result = await districts_collection.insert_one(district_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "District created successfully",
            "district": district_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating district: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/districts/{district_id}")
async def update_district(
    district_id: str,
    district_data: DistrictUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a district"""
    try:
        districts_collection = get_districts_collection()
        provinces_collection = get_provinces_collection()
        
        # Check if district exists
        existing = await districts_collection.find_one({"_id": ObjectId(district_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="District not found")
        
        # If provinceId is being updated, check if new province exists
        if district_data.provinceId:
            province = await provinces_collection.find_one({"_id": ObjectId(district_data.provinceId)})
            if not province:
                raise HTTPException(status_code=400, detail="Province not found")
        
        # Prepare update data
        update_data = {k: v for k, v in district_data.dict().items() if v is not None}
        update_data["modifiedAt"] = datetime.utcnow().isoformat()
        update_data["modifiedBy"] = current_user.id
        
        # Update district
        result = await districts_collection.update_one(
            {"_id": ObjectId(district_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "District updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating district: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/districts/{district_id}")
async def delete_district(
    district_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a district"""
    try:
        districts_collection = get_districts_collection()
        subdistricts_collection = get_subdistricts_collection()
        
        # Check if district exists
        existing = await districts_collection.find_one({"_id": ObjectId(district_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="District not found")
        
        # Check if district has subdistricts
        subdistrict_count = await subdistricts_collection.count_documents({"districtId": district_id})
        if subdistrict_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete district with subdistricts")
        
        # Delete district
        result = await districts_collection.delete_one({"_id": ObjectId(district_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete district")
        
        return {"message": "District deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting district: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== SUBDISTRICTS CRUD ====================

@router.post("/subdistricts", response_model=Dict[str, Any])
async def create_subdistrict(
    subdistrict_data: SubdistrictCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new subdistrict"""
    try:
        subdistricts_collection = get_subdistricts_collection()
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        
        # Check if province exists
        province = await provinces_collection.find_one({"_id": ObjectId(subdistrict_data.provinceId)})
        if not province:
            raise HTTPException(status_code=400, detail="Province not found")
        
        # Check if district exists and belongs to the province
        district = await districts_collection.find_one({
            "_id": ObjectId(subdistrict_data.districtId),
            "provinceId": subdistrict_data.provinceId
        })
        if not district:
            raise HTTPException(status_code=400, detail="District not found or does not belong to the specified province")
        
        # Check if subdistrict with same name in district already exists
        existing = await subdistricts_collection.find_one({
            "name": subdistrict_data.name,
            "districtId": subdistrict_data.districtId
        })
        if existing:
            raise HTTPException(status_code=400, detail="Subdistrict with this name already exists in this district")
        
        # Generate zipcode if provided
        zipcode = ""
        if subdistrict_data.zipcode:
            zipcode = subdistrict_data.zipcode
        else:
            # Generate zipcode based on province
            if province and 'name' in province:
                zipcode = get_zipcode_for_subdistrict(province['name'])
        
        # Create subdistrict document
        subdistrict_doc = {
            "name": subdistrict_data.name,
            "active": subdistrict_data.active,
            "note": subdistrict_data.note,
            "provinceId": subdistrict_data.provinceId,
            "districtId": subdistrict_data.districtId,
            "countryId": subdistrict_data.countryId,
            "zipcode": zipcode,
            "createdAt": datetime.utcnow().isoformat(),
            "modifiedAt": datetime.utcnow().isoformat(),
            "createdBy": current_user.id
        }
        
        result = await subdistricts_collection.insert_one(subdistrict_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Subdistrict created successfully",
            "subdistrict": subdistrict_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subdistrict: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/subdistricts/{subdistrict_id}")
async def update_subdistrict(
    subdistrict_id: str,
    subdistrict_data: SubdistrictUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a subdistrict"""
    try:
        subdistricts_collection = get_subdistricts_collection()
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        
        # Check if subdistrict exists
        existing = await subdistricts_collection.find_one({"_id": ObjectId(subdistrict_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Subdistrict not found")
        
        # If provinceId is being updated, check if new province exists
        if subdistrict_data.provinceId:
            province = await provinces_collection.find_one({"_id": ObjectId(subdistrict_data.provinceId)})
            if not province:
                raise HTTPException(status_code=400, detail="Province not found")
        
        # If districtId is being updated, check if new district exists and belongs to province
        if subdistrict_data.districtId:
            district = await districts_collection.find_one({
                "_id": ObjectId(subdistrict_data.districtId),
                "provinceId": subdistrict_data.provinceId or existing.get("provinceId")
            })
            if not district:
                raise HTTPException(status_code=400, detail="District not found or does not belong to the specified province")
        
        # Prepare update data
        update_data = {k: v for k, v in subdistrict_data.dict().items() if v is not None}
        update_data["modifiedAt"] = datetime.utcnow().isoformat()
        update_data["modifiedBy"] = current_user.id
        
        # Handle zipcode update
        if 'zipcode' not in update_data or not update_data['zipcode']:
            # Generate zipcode based on province if not provided
            province_id = subdistrict_data.provinceId or existing.get("provinceId")
            if province_id:
                province = await provinces_collection.find_one({"_id": ObjectId(province_id)})
                if province and 'name' in province:
                    update_data['zipcode'] = get_zipcode_for_subdistrict(province['name'])
        
        # Update subdistrict
        result = await subdistricts_collection.update_one(
            {"_id": ObjectId(subdistrict_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Subdistrict updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subdistrict: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/subdistricts/{subdistrict_id}")
async def delete_subdistrict(
    subdistrict_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a subdistrict"""
    try:
        subdistricts_collection = get_subdistricts_collection()
        allhospitals_collection = get_allhospitals_collection()
        
        # Check if subdistrict exists
        existing = await subdistricts_collection.find_one({"_id": ObjectId(subdistrict_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Subdistrict not found")
        
        # Check if subdistrict has hospitals
        hospital_count = await allhospitals_collection.count_documents({"subDistrictId": subdistrict_id})
        if hospital_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete subdistrict with hospitals")
        
        # Delete subdistrict
        result = await subdistricts_collection.delete_one({"_id": ObjectId(subdistrict_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete subdistrict")
        
        return {"message": "Subdistrict deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting subdistrict: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== HOSPITAL TYPES CRUD ====================

@router.post("/hospital-types", response_model=Dict[str, Any])
async def create_hospital_type(
    hospital_type_data: HospitalTypeCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new hospital type"""
    try:
        hospital_types_collection = get_hospitaltypes_collection()
        
        # Check if hospital type with same name already exists
        existing = await hospital_types_collection.find_one({"name": hospital_type_data.name})
        if existing:
            raise HTTPException(status_code=400, detail="Hospital type with this name already exists")
        
        # Create hospital type document
        hospital_type_doc = {
            "name": hospital_type_data.name,
            "note": hospital_type_data.note,
            "pictures": hospital_type_data.pictures or [],
            "createdAt": datetime.utcnow().isoformat(),
            "modifiedAt": datetime.utcnow().isoformat(),
            "createdBy": current_user.id
        }
        
        result = await hospital_types_collection.insert_one(hospital_type_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Hospital type created successfully",
            "hospital_type": hospital_type_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating hospital type: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/hospital-types/{hospital_type_id}")
async def update_hospital_type(
    hospital_type_id: str,
    hospital_type_data: HospitalTypeUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a hospital type"""
    try:
        hospital_types_collection = get_hospitaltypes_collection()
        
        # Check if hospital type exists
        existing = await hospital_types_collection.find_one({"_id": ObjectId(hospital_type_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Hospital type not found")
        
        # Prepare update data
        update_data = {k: v for k, v in hospital_type_data.dict().items() if v is not None}
        update_data["modifiedAt"] = datetime.utcnow().isoformat()
        update_data["modifiedBy"] = current_user.id
        
        # Update hospital type
        result = await hospital_types_collection.update_one(
            {"_id": ObjectId(hospital_type_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Hospital type updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hospital type: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/hospital-types/{hospital_type_id}")
async def delete_hospital_type(
    hospital_type_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a hospital type"""
    try:
        hospital_types_collection = get_hospitaltypes_collection()
        allhospitals_collection = get_allhospitals_collection()
        
        # Check if hospital type exists
        existing = await hospital_types_collection.find_one({"_id": ObjectId(hospital_type_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Hospital type not found")
        
        # Check if hospital type has hospitals
        hospital_count = await allhospitals_collection.count_documents({"hospitalType": hospital_type_id})
        if hospital_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete hospital type with hospitals")
        
        # Delete hospital type
        result = await hospital_types_collection.delete_one({"_id": ObjectId(hospital_type_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete hospital type")
        
        return {"message": "Hospital type deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hospital type: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== HOSPITALS CRUD ====================

@router.post("/hospitals", response_model=Dict[str, Any])
async def create_hospital(
    hospital_data: HospitalCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new hospital"""
    try:
        allhospitals_collection = get_allhospitals_collection()
        hospital_types_collection = get_hospitaltypes_collection()
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        subdistricts_collection = get_subdistricts_collection()
        
        # Validate hospital type if provided
        if hospital_data.hospitalType:
            hospital_type = await hospital_types_collection.find_one({"_id": ObjectId(hospital_data.hospitalType)})
            if not hospital_type:
                raise HTTPException(status_code=400, detail="Hospital type not found")
        
        # Validate province if provided
        if hospital_data.provinceId:
            province = await provinces_collection.find_one({"_id": ObjectId(hospital_data.provinceId)})
            if not province:
                raise HTTPException(status_code=400, detail="Province not found")
        
        # Validate district if provided
        if hospital_data.districtId:
            district = await districts_collection.find_one({"_id": ObjectId(hospital_data.districtId)})
            if not district:
                raise HTTPException(status_code=400, detail="District not found")
            
            # Check if district belongs to the specified province
            if hospital_data.provinceId and district.get("provinceId") != hospital_data.provinceId:
                raise HTTPException(status_code=400, detail="District does not belong to the specified province")
        
        # Validate subdistrict if provided
        if hospital_data.subDistrictId:
            subdistrict = await subdistricts_collection.find_one({"_id": ObjectId(hospital_data.subDistrictId)})
            if not subdistrict:
                raise HTTPException(status_code=400, detail="Subdistrict not found")
            
            # Check if subdistrict belongs to the specified district
            if hospital_data.districtId and subdistrict.get("districtId") != hospital_data.districtId:
                raise HTTPException(status_code=400, detail="Subdistrict does not belong to the specified district")
        
        # Check if hospital with same name already exists
        existing = await allhospitals_collection.find_one({"name": hospital_data.name})
        if existing:
            raise HTTPException(status_code=400, detail="Hospital with this name already exists")
        
        # Create hospital document
        hospital_doc = {
            "name": hospital_data.name,
            "address": hospital_data.address,
            "phone": hospital_data.phone,
            "email": hospital_data.email,
            "hospitalType": hospital_data.hospitalType,
            "provinceId": hospital_data.provinceId,
            "districtId": hospital_data.districtId,
            "subDistrictId": hospital_data.subDistrictId,
            "location": hospital_data.location,
            "pictures": hospital_data.pictures or [],
            "visible": hospital_data.visible,
            "remark": hospital_data.remark,
            "createdAt": datetime.utcnow().isoformat(),
            "modifiedAt": datetime.utcnow().isoformat(),
            "createdBy": current_user.id
        }
        
        result = await allhospitals_collection.insert_one(hospital_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Hospital created successfully",
            "hospital": hospital_doc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating hospital: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/hospitals/{hospital_id}")
async def update_hospital(
    hospital_id: str,
    hospital_data: HospitalUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a hospital"""
    try:
        allhospitals_collection = get_allhospitals_collection()
        hospital_types_collection = get_hospitaltypes_collection()
        provinces_collection = get_provinces_collection()
        districts_collection = get_districts_collection()
        subdistricts_collection = get_subdistricts_collection()
        
        # Check if hospital exists
        existing = await allhospitals_collection.find_one({"_id": ObjectId(hospital_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        # Validate hospital type if being updated
        if hospital_data.hospitalType:
            hospital_type = await hospital_types_collection.find_one({"_id": ObjectId(hospital_data.hospitalType)})
            if not hospital_type:
                raise HTTPException(status_code=400, detail="Hospital type not found")
        
        # Validate province if being updated
        if hospital_data.provinceId:
            province = await provinces_collection.find_one({"_id": ObjectId(hospital_data.provinceId)})
            if not province:
                raise HTTPException(status_code=400, detail="Province not found")
        
        # Validate district if being updated
        if hospital_data.districtId:
            district = await districts_collection.find_one({"_id": ObjectId(hospital_data.districtId)})
            if not district:
                raise HTTPException(status_code=400, detail="District not found")
            
            # Check if district belongs to the specified province
            province_id = hospital_data.provinceId or existing.get("provinceId")
            if province_id and district.get("provinceId") != province_id:
                raise HTTPException(status_code=400, detail="District does not belong to the specified province")
        
        # Validate subdistrict if being updated
        if hospital_data.subDistrictId:
            subdistrict = await subdistricts_collection.find_one({"_id": ObjectId(hospital_data.subDistrictId)})
            if not subdistrict:
                raise HTTPException(status_code=400, detail="Subdistrict not found")
            
            # Check if subdistrict belongs to the specified district
            district_id = hospital_data.districtId or existing.get("districtId")
            if district_id and subdistrict.get("districtId") != district_id:
                raise HTTPException(status_code=400, detail="Subdistrict does not belong to the specified district")
        
        # Prepare update data
        update_data = {k: v for k, v in hospital_data.dict().items() if v is not None}
        update_data["modifiedAt"] = datetime.utcnow().isoformat()
        update_data["modifiedBy"] = current_user.id
        
        # Update hospital
        result = await allhospitals_collection.update_one(
            {"_id": ObjectId(hospital_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Hospital updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hospital: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/hospitals/{hospital_id}")
async def delete_hospital(
    hospital_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a hospital"""
    try:
        allhospitals_collection = get_allhospitals_collection()
        
        # Check if hospital exists
        existing = await allhospitals_collection.find_one({"_id": ObjectId(hospital_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        # Delete hospital
        result = await allhospitals_collection.delete_one({"_id": ObjectId(hospital_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete hospital")
        
        return {"message": "Hospital deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hospital: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
