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
class AppointmentCreate(BaseModel):
    school_id: str
    appointment_date: str = Field(..., description="Date in YYYY-MM-DD format")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    screening_type: str = Field(..., description="Type of screening to be conducted")
    expected_students: int = Field(..., description="Expected number of students")
    notes: Optional[str] = None
    equipment_needed: Optional[List[str]] = None
    staff_requirements: Optional[List[str]] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = Field(None, description="Status: 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'")
    notes: Optional[str] = None
    actual_students: Optional[int] = None
    completed_students: Optional[int] = None

class AppointmentResponse(BaseModel):
    appointment_id: str
    school_id: str
    school_name: str
    hospital_staff_id: str
    staff_name: str
    appointment_date: str
    start_time: str
    end_time: str
    screening_type: str
    status: str
    expected_students: int
    actual_students: Optional[int] = None
    completed_students: Optional[int] = None
    notes: Optional[str] = None
    equipment_needed: Optional[List[str]] = None
    staff_requirements: Optional[List[str]] = None
    created_at: str
    updated_at: str

class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    available: bool
    conflicting_appointments: Optional[List[str]] = None

# Appointment Management Endpoints
@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new hospital screening appointment"""
    db = get_database()
    
    # Check permissions - only hospital staff can create appointments
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create appointments"
        )
    
    # Validate school exists
    school = await db.evep.schools.find_one({"_id": ObjectId(appointment_data.school_id)})
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Validate date format
    try:
        appointment_date = datetime.strptime(appointment_data.appointment_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Validate time format
    try:
        start_time = datetime.strptime(appointment_data.start_time, "%H:%M").time()
        end_time = datetime.strptime(appointment_data.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM"
        )
    
    # Check for time conflicts
    conflict_query = {
        "school_id": ObjectId(appointment_data.school_id),
        "appointment_date": appointment_date,
        "status": {"$nin": ["cancelled"]},
        "$or": [
            {
                "start_time": {"$lt": appointment_data.end_time},
                "end_time": {"$gt": appointment_data.start_time}
            }
        ]
    }
    
    conflicting_appointments = await db.evep.appointments.find(conflict_query).to_list(None)
    if conflicting_appointments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time slot conflicts with existing appointments"
        )
    
    # Create appointment
    appointment_doc = {
        "school_id": ObjectId(appointment_data.school_id),
        "hospital_staff_id": ObjectId(current_user["user_id"]),
        "appointment_date": appointment_date,
        "start_time": appointment_data.start_time,
        "end_time": appointment_data.end_time,
        "screening_type": appointment_data.screening_type,
        "status": "scheduled",
        "expected_students": appointment_data.expected_students,
        "notes": appointment_data.notes,
        "equipment_needed": appointment_data.equipment_needed or [],
        "staff_requirements": appointment_data.staff_requirements or [],
        "created_at": get_current_thailand_time(),
        "updated_at": get_current_thailand_time()
    }
    
    result = await db.evep.appointments.insert_one(appointment_doc)
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="create_appointment",
        details=f"Created appointment for school {appointment_data.school_id} on {appointment_data.appointment_date}",
        ip_address="system"
    )
    
    # Get staff name
    staff = await db.evep.users.find_one({"_id": ObjectId(current_user["user_id"])})
    staff_name = f"{staff.get('first_name', '')} {staff.get('last_name', '')}" if staff else "Unknown"
    
    return AppointmentResponse(
        appointment_id=str(result.inserted_id),
        school_id=appointment_data.school_id,
        school_name=school.get("name", "Unknown School"),
        hospital_staff_id=current_user["user_id"],
        staff_name=staff_name,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
        screening_type=appointment_data.screening_type,
        status="scheduled",
        expected_students=appointment_data.expected_students,
        notes=appointment_data.notes,
        equipment_needed=appointment_data.equipment_needed,
        staff_requirements=appointment_data.staff_requirements,
        created_at=appointment_doc["created_at"].isoformat(),
        updated_at=appointment_doc["updated_at"].isoformat()
    )


@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    school_id: Optional[str] = Query(None, description="Filter by school ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """Get appointments with optional filtering"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view appointments"
        )
    
    # Build query
    query = {}
    
    if school_id:
        query["school_id"] = ObjectId(school_id)
    
    if status:
        query["status"] = status
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
            query["appointment_date"] = {"$gte": from_date}
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
            if "appointment_date" in query:
                query["appointment_date"]["$lte"] = to_date
            else:
                query["appointment_date"] = {"$lte": to_date}
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    # Role-based filtering
    if current_user["role"] == "teacher":
        # Teachers can only see appointments for their school
        teacher = await db.evep.teachers.find_one({"user_id": ObjectId(current_user["user_id"])})
        if teacher and teacher.get("school"):
            query["school_id"] = ObjectId(teacher["school"])
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher not associated with any school"
            )
    
    # Get appointments
    appointments = await db.evep.appointments.find(query).sort("appointment_date", 1).to_list(None)
    
    # Get related data
    school_ids = list(set([str(app["school_id"]) for app in appointments]))
    staff_ids = list(set([str(app["hospital_staff_id"]) for app in appointments]))
    
    schools = await db.evep.schools.find({"_id": {"$in": [ObjectId(sid) for sid in school_ids]}}).to_list(None)
    staff = await db.evep.users.find({"_id": {"$in": [ObjectId(sid) for sid in staff_ids]}}).to_list(None)
    
    # Create lookup dictionaries
    school_lookup = {str(s["_id"]): s.get("name", "Unknown School") for s in schools}
    staff_lookup = {str(s["_id"]): f"{s.get('first_name', '')} {s.get('last_name', '')}" for s in staff}
    
    # Convert to response format
    result = []
    for appointment in appointments:
        result.append(AppointmentResponse(
            appointment_id=str(appointment["_id"]),
            school_id=str(appointment["school_id"]),
            school_name=school_lookup.get(str(appointment["school_id"]), "Unknown School"),
            hospital_staff_id=str(appointment["hospital_staff_id"]),
            staff_name=staff_lookup.get(str(appointment["hospital_staff_id"]), "Unknown Staff"),
            appointment_date=appointment["appointment_date"].isoformat() if isinstance(appointment["appointment_date"], datetime) else str(appointment["appointment_date"]),
            start_time=appointment["start_time"],
            end_time=appointment["end_time"],
            screening_type=appointment["screening_type"],
            status=appointment["status"],
            expected_students=appointment["expected_students"],
            actual_students=appointment.get("actual_students"),
            completed_students=appointment.get("completed_students"),
            notes=appointment.get("notes"),
            equipment_needed=appointment.get("equipment_needed", []),
            staff_requirements=appointment.get("staff_requirements", []),
            created_at=appointment["created_at"].isoformat(),
            updated_at=appointment["updated_at"].isoformat()
        ))
    
    return result


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific appointment by ID"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view appointments"
        )
    
    # Get appointment
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Get related data
    school = await db.evep.schools.find_one({"_id": appointment["school_id"]})
    staff = await db.evep.users.find_one({"_id": appointment["hospital_staff_id"]})
    
    return AppointmentResponse(
        appointment_id=str(appointment["_id"]),
        school_id=str(appointment["school_id"]),
        school_name=school.get("name", "Unknown School") if school else "Unknown School",
        hospital_staff_id=str(appointment["hospital_staff_id"]),
        staff_name=f"{staff.get('first_name', '')} {staff.get('last_name', '')}" if staff else "Unknown Staff",
        appointment_date=appointment["appointment_date"].isoformat() if isinstance(appointment["appointment_date"], datetime) else str(appointment["appointment_date"]),
        start_time=appointment["start_time"],
        end_time=appointment["end_time"],
        screening_type=appointment["screening_type"],
        status=appointment["status"],
        expected_students=appointment["expected_students"],
        actual_students=appointment.get("actual_students"),
        completed_students=appointment.get("completed_students"),
        notes=appointment.get("notes"),
        equipment_needed=appointment.get("equipment_needed", []),
        staff_requirements=appointment.get("staff_requirements", []),
        created_at=appointment["created_at"].isoformat(),
        updated_at=appointment["updated_at"].isoformat()
    )


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an appointment"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update appointments"
        )
    
    # Get existing appointment
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Build update document
    update_doc = {"updated_at": get_current_thailand_time()}
    
    if update_data.appointment_date:
        try:
            appointment_date = datetime.strptime(update_data.appointment_date, "%Y-%m-%d").date()
            update_doc["appointment_date"] = appointment_date
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if update_data.start_time:
        update_doc["start_time"] = update_data.start_time
    
    if update_data.end_time:
        update_doc["end_time"] = update_data.end_time
    
    if update_data.status:
        update_doc["status"] = update_data.status
    
    if update_data.notes is not None:
        update_doc["notes"] = update_data.notes
    
    if update_data.actual_students is not None:
        update_doc["actual_students"] = update_data.actual_students
    
    if update_data.completed_students is not None:
        update_doc["completed_students"] = update_data.completed_students
    
    # Update appointment
    result = await db.evep.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="update_appointment",
        details=f"Updated appointment {appointment_id}",
        ip_address="system"
    )
    
    # Return updated appointment
    return await get_appointment(appointment_id, current_user)


@router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an appointment"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete appointments"
        )
    
    # Get appointment
    appointment = await db.evep.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check if appointment can be deleted (not in progress or completed)
    if appointment["status"] in ["in_progress", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete appointment that is in progress or completed"
        )
    
    # Soft delete by updating status
    result = await db.evep.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": get_current_thailand_time(),
                "cancelled_by": current_user["user_id"],
                "cancelled_at": get_current_thailand_time()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Log audit
    await log_security_event(
        user_id=current_user["user_id"],
        action="cancel_appointment",
        details=f"Cancelled appointment {appointment_id}",
        ip_address="system"
    )
    
    return {"message": "Appointment cancelled successfully"}


@router.get("/appointments/available-slots")
async def get_available_slots(
    school_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: dict = Depends(get_current_user)
):
    """Get available time slots for a school on a specific date"""
    db = get_database()
    
    # Check permissions
    if current_user["role"] not in ["medical_staff", "doctor", "admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view available slots"
        )
    
    # Validate date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get existing appointments for the school on the date
    existing_appointments = await db.evep.appointments.find({
        "school_id": ObjectId(school_id),
        "appointment_date": target_date,
        "status": {"$nin": ["cancelled"]}
    }).to_list(None)
    
    # Generate time slots (9 AM to 5 PM, 1-hour slots)
    time_slots = []
    start_hour = 9
    end_hour = 17
    
    for hour in range(start_hour, end_hour):
        start_time = f"{hour:02d}:00"
        end_time = f"{hour + 1:02d}:00"
        
        # Check for conflicts
        conflicting_appointments = []
        for appointment in existing_appointments:
            if (appointment["start_time"] < end_time and 
                appointment["end_time"] > start_time):
                conflicting_appointments.append(str(appointment["_id"]))
        
        time_slots.append(TimeSlot(
            start_time=start_time,
            end_time=end_time,
            available=len(conflicting_appointments) == 0,
            conflicting_appointments=conflicting_appointments if conflicting_appointments else None
        ))
    
    return {
        "school_id": school_id,
        "date": date,
        "time_slots": time_slots,
        "total_slots": len(time_slots),
        "available_slots": len([slot for slot in time_slots if slot.available])
    }
