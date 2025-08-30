from typing import Dict, Any, List, Optional
from datetime import datetime, date
from app.core.config import Config
from app.core.event_bus import event_bus
from app.shared.models.screening import Screening, ScreeningCreate, ScreeningUpdate, ScreeningStatus, ScreeningType

class ScreeningService:
    """Screening service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("screening")
        
        # In-memory storage for demonstration
        self.screenings = {}
        self.screening_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the screening service"""
        # In a real implementation, this would connect to the database
        # For now, we'll use in-memory storage for demonstration
        
        # Create some demo screenings
        await self._create_demo_screenings()
        
        print("🔧 Screening service initialized")
    
    async def _create_demo_screenings(self) -> None:
        """Create demo screenings for testing"""
        demo_screenings = [
            {
                "patient_id": "PAT-000001",
                "screening_type": ScreeningType.BASIC,
                "screening_date": datetime(2024, 1, 15, 10, 0),
                "conducted_by": "doctor-001",
                "status": ScreeningStatus.PENDING,
                "notes": "Regular vision screening"
            },
            {
                "patient_id": "PAT-000002",
                "screening_type": ScreeningType.COMPREHENSIVE,
                "screening_date": datetime(2024, 1, 20, 14, 0),
                "conducted_by": "doctor-002",
                "status": ScreeningStatus.COMPLETED,
                "results": {
                    "visual_acuity": "20/20",
                    "color_vision": "normal",
                    "depth_perception": "normal",
                    "requires_assessment": False
                },
                "notes": "Comprehensive eye examination completed"
            },
            {
                "patient_id": "PAT-000003",
                "screening_type": ScreeningType.BASIC,
                "screening_date": datetime(2024, 1, 25, 9, 0),
                "conducted_by": "doctor-001",
                "status": ScreeningStatus.IN_PROGRESS,
                "notes": "Vision screening in progress"
            }
        ]
        
        for screening_data in demo_screenings:
            screening_create = ScreeningCreate(**screening_data)
            await self.create_screening(screening_create)
    
    async def get_screenings(
        self,
        skip: int = 0,
        limit: int = 100,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        screening_type: Optional[str] = None,
        conducted_by: Optional[str] = None
    ) -> List[Screening]:
        """Get screenings with optional filtering"""
        screenings = list(self.screenings.values())
        
        # Apply filters
        if patient_id:
            screenings = [s for s in screenings if s.patient_id == patient_id]
        
        if status:
            screenings = [s for s in screenings if s.status.value == status]
        
        if screening_type:
            screenings = [s for s in screenings if s.screening_type.value == screening_type]
        
        if conducted_by:
            screenings = [s for s in screenings if s.conducted_by == conducted_by]
        
        # Apply pagination
        return screenings[skip:skip + limit]
    
    async def get_screening(self, screening_id: str) -> Optional[Screening]:
        """Get a screening by ID"""
        return self.screenings.get(screening_id)
    
    async def create_screening(self, screening_create: ScreeningCreate) -> Screening:
        """Create a new screening"""
        # Generate screening ID
        self.screening_counter += 1
        screening_id = f"SCR-{self.screening_counter:06d}"
        
        # Create screening
        screening = Screening(
            screening_id=screening_id,
            patient_id=screening_create.patient_id,
            screening_type=screening_create.screening_type,
            screening_date=screening_create.screening_date or datetime.utcnow(),
            conducted_by=screening_create.conducted_by,
            status=screening_create.status or ScreeningStatus.PENDING,
            results=screening_create.results or {},
            notes=screening_create.notes
        )
        
        # Store screening
        self.screenings[screening_id] = screening
        
        # Emit event
        await event_bus.emit("screening.created", {
            "screening_id": screening_id,
            "screening_data": screening.dict(),
            "user_id": "system"
        })
        
        return screening
    
    async def update_screening(self, screening_id: str, screening_update: ScreeningUpdate) -> Optional[Screening]:
        """Update a screening"""
        if screening_id not in self.screenings:
            return None
        
        screening = self.screenings[screening_id]
        
        # Track changes
        changes = {}
        
        # Update fields if provided
        if screening_update.patient_id is not None:
            changes["patient_id"] = {"old": screening.patient_id, "new": screening_update.patient_id}
            screening.patient_id = screening_update.patient_id
        
        if screening_update.screening_type is not None:
            changes["screening_type"] = {"old": screening.screening_type, "new": screening_update.screening_type}
            screening.screening_type = screening_update.screening_type
        
        if screening_update.scheduled_date is not None:
            changes["scheduled_date"] = {"old": screening.scheduled_date, "new": screening_update.scheduled_date}
            screening.scheduled_date = screening_update.scheduled_date
        
        if screening_update.conducted_by is not None:
            changes["conducted_by"] = {"old": screening.conducted_by, "new": screening_update.conducted_by}
            screening.conducted_by = screening_update.conducted_by
        
        if screening_update.status is not None:
            changes["status"] = {"old": screening.status, "new": screening_update.status}
            screening.status = screening_update.status
        
        if screening_update.results is not None:
            changes["results"] = {"old": screening.results, "new": screening_update.results}
            screening.results = screening_update.results
        
        if screening_update.notes is not None:
            changes["notes"] = {"old": screening.notes, "new": screening_update.notes}
            screening.notes = screening_update.notes
        
        # Update timestamp
        screening.updated_at = datetime.utcnow()
        
        # Emit event if there were changes
        if changes:
            await event_bus.emit("screening.updated", {
                "screening_id": screening_id,
                "changes": changes,
                "user_id": "system"
            })
        
        return screening
    
    async def delete_screening(self, screening_id: str) -> bool:
        """Delete a screening (soft delete)"""
        if screening_id not in self.screenings:
            return False
        
        screening = self.screenings[screening_id]
        screening.status = ScreeningStatus.CANCELLED
        screening.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("screening.deleted", {
            "screening_id": screening_id,
            "user_id": "system"
        })
        
        return True
    
    async def start_screening(self, screening_id: str) -> Optional[Screening]:
        """Start a screening session"""
        if screening_id not in self.screenings:
            return None
        
        screening = self.screenings[screening_id]
        
        if screening.status != ScreeningStatus.SCHEDULED:
            raise ValueError("Screening must be in SCHEDULED status to start")
        
        screening.status = ScreeningStatus.IN_PROGRESS
        screening.started_at = datetime.utcnow()
        screening.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("screening.started", {
            "screening_id": screening_id,
            "user_id": "system"
        })
        
        return screening
    
    async def complete_screening(self, screening_id: str, results: Dict[str, Any]) -> Optional[Screening]:
        """Complete a screening with results"""
        if screening_id not in self.screenings:
            return None
        
        screening = self.screenings[screening_id]
        
        if screening.status != ScreeningStatus.IN_PROGRESS:
            raise ValueError("Screening must be IN_PROGRESS to complete")
        
        screening.status = ScreeningStatus.COMPLETED
        screening.results = results
        screening.completed_at = datetime.utcnow()
        screening.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("screening.completed", {
            "screening_id": screening_id,
            "patient_id": screening.patient_id,
            "results": results,
            "user_id": "system"
        })
        
        return screening
    
    async def reschedule_screening(self, screening_id: str, new_date: str) -> Optional[Screening]:
        """Reschedule a screening"""
        if screening_id not in self.screenings:
            return None
        
        screening = self.screenings[screening_id]
        
        if screening.status not in [ScreeningStatus.SCHEDULED, ScreeningStatus.CANCELLED]:
            raise ValueError("Screening must be SCHEDULED or CANCELLED to reschedule")
        
        old_date = screening.scheduled_date
        screening.scheduled_date = datetime.strptime(new_date, "%Y-%m-%d").date()
        screening.status = ScreeningStatus.SCHEDULED
        screening.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("screening.rescheduled", {
            "screening_id": screening_id,
            "old_date": old_date,
            "new_date": screening.scheduled_date,
            "user_id": "system"
        })
        
        return screening
    
    async def cancel_screening(self, screening_id: str, reason: str) -> Optional[Screening]:
        """Cancel a screening"""
        if screening_id not in self.screenings:
            return None
        
        screening = self.screenings[screening_id]
        
        if screening.status not in [ScreeningStatus.SCHEDULED, ScreeningStatus.IN_PROGRESS]:
            raise ValueError("Screening must be SCHEDULED or IN_PROGRESS to cancel")
        
        screening.status = ScreeningStatus.CANCELLED
        screening.notes = f"Cancelled: {reason}"
        screening.updated_at = datetime.utcnow()
        
        # Emit event
        await event_bus.emit("screening.cancelled", {
            "screening_id": screening_id,
            "reason": reason,
            "user_id": "system"
        })
        
        return screening
    
    async def get_patient_screenings(self, patient_id: str, skip: int = 0, limit: int = 100) -> List[Screening]:
        """Get all screenings for a specific patient"""
        screenings = [
            s for s in self.screenings.values()
            if s.patient_id == patient_id
        ]
        
        # Sort by scheduled date (newest first)
        screenings.sort(key=lambda x: x.scheduled_date, reverse=True)
        
        return screenings[skip:skip + limit]
    
    async def get_screening_statistics(self) -> Dict[str, Any]:
        """Get screening statistics"""
        total_screenings = len(self.screenings)
        scheduled_screenings = len([s for s in self.screenings.values() if s.status == ScreeningStatus.SCHEDULED])
        in_progress_screenings = len([s for s in self.screenings.values() if s.status == ScreeningStatus.IN_PROGRESS])
        completed_screenings = len([s for s in self.screenings.values() if s.status == ScreeningStatus.COMPLETED])
        cancelled_screenings = len([s for s in self.screenings.values() if s.status == ScreeningStatus.CANCELLED])
        
        # Screening type distribution
        type_counts = {}
        for screening in self.screenings.values():
            screening_type = screening.screening_type.value
            type_counts[screening_type] = type_counts.get(screening_type, 0) + 1
        
        # Result category distribution
        result_categories = {"normal": 0, "requires_assessment": 0, "urgent": 0}
        for screening in self.screenings.values():
            if screening.status == ScreeningStatus.COMPLETED and screening.results:
                requires_assessment = screening.results.get("requires_assessment", False)
                if requires_assessment:
                    result_categories["requires_assessment"] += 1
                else:
                    result_categories["normal"] += 1
        
        # Doctor distribution
        doctor_counts = {}
        for screening in self.screenings.values():
            doctor = screening.conducted_by or "Unassigned"
            doctor_counts[doctor] = doctor_counts.get(doctor, 0) + 1
        
        return {
            "total_screenings": total_screenings,
            "scheduled_screenings": scheduled_screenings,
            "in_progress_screenings": in_progress_screenings,
            "completed_screenings": completed_screenings,
            "cancelled_screenings": cancelled_screenings,
            "screening_type_distribution": type_counts,
            "result_category_distribution": result_categories,
            "doctor_distribution": doctor_counts,
            "last_updated": datetime.utcnow()
        }
    
    async def get_patient_screening_statistics(self, patient_id: str) -> Dict[str, Any]:
        """Get screening statistics for a specific patient"""
        patient_screenings = [
            s for s in self.screenings.values()
            if s.patient_id == patient_id
        ]
        
        if not patient_screenings:
            return {
                "patient_id": patient_id,
                "total_screenings": 0,
                "screening_history": [],
                "last_screening": None,
                "next_screening": None
            }
        
        # Sort by date
        patient_screenings.sort(key=lambda x: x.scheduled_date)
        
        # Get last and next screenings
        completed_screenings = [s for s in patient_screenings if s.status == ScreeningStatus.COMPLETED]
        upcoming_screenings = [s for s in patient_screenings if s.status == ScreeningStatus.SCHEDULED]
        
        last_screening = completed_screenings[-1] if completed_screenings else None
        next_screening = upcoming_screenings[0] if upcoming_screenings else None
        
        # Screening type distribution
        type_counts = {}
        for screening in patient_screenings:
            screening_type = screening.screening_type.value
            type_counts[screening_type] = type_counts.get(screening_type, 0) + 1
        
        return {
            "patient_id": patient_id,
            "total_screenings": len(patient_screenings),
            "completed_screenings": len(completed_screenings),
            "upcoming_screenings": len(upcoming_screenings),
            "screening_type_distribution": type_counts,
            "last_screening": last_screening.dict() if last_screening else None,
            "next_screening": next_screening.dict() if next_screening else None,
            "screening_history": [s.dict() for s in patient_screenings]
        }
    
    async def advanced_search(self, filters: Dict[str, Any]) -> List[Screening]:
        """Advanced screening search with multiple filters"""
        screenings = list(self.screenings.values())
        
        # Apply patient ID filter
        if "patient_id" in filters:
            screenings = [s for s in screenings if s.patient_id == filters["patient_id"]]
        
        # Apply screening type filter
        if "screening_type" in filters:
            screenings = [s for s in screenings if s.screening_type.value == filters["screening_type"]]
        
        # Apply status filter
        if "status" in filters:
            screenings = [s for s in screenings if s.status.value == filters["status"]]
        
        # Apply conducted by filter
        if "conducted_by" in filters:
            screenings = [s for s in screenings if s.conducted_by == filters["conducted_by"]]
        
        # Apply result category filter
        if "result_category" in filters:
            result_category = filters["result_category"]
            if result_category == "requires_assessment":
                screenings = [s for s in screenings if s.results.get("requires_assessment", False)]
            elif result_category == "normal":
                screenings = [s for s in screenings if not s.results.get("requires_assessment", False)]
        
        # Apply date filters
        if "created_after" in filters or "created_before" in filters:
            created_after = filters.get("created_after")
            created_before = filters.get("created_before")
            
            filtered_screenings = []
            for screening in screenings:
                created_date = screening.created_at.date()
                
                if created_after and created_date < datetime.strptime(created_after, "%Y-%m-%d").date():
                    continue
                
                if created_before and created_date > datetime.strptime(created_before, "%Y-%m-%d").date():
                    continue
                
                filtered_screenings.append(screening)
            
            screenings = filtered_screenings
        
        return screenings
    
    async def get_screenings_by_status(self, status: ScreeningStatus) -> List[Screening]:
        """Get all screenings with a specific status"""
        return [
            s for s in self.screenings.values()
            if s.status == status
        ]
    
    async def get_screenings_by_type(self, screening_type: ScreeningType) -> List[Screening]:
        """Get all screenings of a specific type"""
        return [
            s for s in self.screenings.values()
            if s.screening_type == screening_type
        ]
    
    async def get_screenings_by_doctor(self, doctor_id: str) -> List[Screening]:
        """Get all screenings conducted by a specific doctor"""
        return [
            s for s in self.screenings.values()
            if s.conducted_by == doctor_id
        ]
    
    async def get_screenings_by_date_range(self, start_date: date, end_date: date) -> List[Screening]:
        """Get screenings within a date range"""
        return [
            s for s in self.screenings.values()
            if start_date <= s.scheduled_date <= end_date
        ]
    
    async def get_urgent_screenings(self) -> List[Screening]:
        """Get screenings that require urgent attention"""
        urgent_screenings = []
        
        for screening in self.screenings.values():
            if screening.status == ScreeningStatus.COMPLETED and screening.results:
                # Check if results indicate urgent attention needed
                if screening.results.get("requires_assessment", False):
                    urgent_screenings.append(screening)
        
        return urgent_screenings
    
    async def get_overdue_screenings(self) -> List[Screening]:
        """Get screenings that are overdue"""
        today = date.today()
        overdue_screenings = []
        
        for screening in self.screenings.values():
            if (screening.status == ScreeningStatus.SCHEDULED and 
                screening.scheduled_date < today):
                overdue_screenings.append(screening)
        
        return overdue_screenings

