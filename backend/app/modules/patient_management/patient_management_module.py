from abc import ABC
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from app.core.base_module import BaseModule
from app.core.config import Config
from app.core.event_bus import event_bus
from app.modules.patient_management.services.patient_service import PatientService
from app.modules.patient_management.services.demographics_service import DemographicsService
from app.modules.patient_management.services.medical_history_service import MedicalHistoryService
from app.shared.models.patient import Patient, PatientCreate, PatientUpdate
from datetime import datetime

# Import security logging
from app.api.medical_security import log_medical_security_event
from app.api.auth import get_current_user

class PatientManagementModule(BaseModule):
    """Patient Management module for EVEP Platform"""
    
    def __init__(self):
        super().__init__()
        self.name = "patient_management"
        self.version = "1.0.0"
        self.description = "Patient data and management operations"
        
        # Initialize services
        self.patient_service = PatientService()
        self.demographics_service = DemographicsService()
        self.medical_history_service = MedicalHistoryService()
        
        # Setup router
        self.router = APIRouter(prefix="/api/v1/patients", tags=["patients"])
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the patient management module"""
        print(f"🔧 Initializing {self.name} module v{self.version}")
        
        # Initialize services
        await self.patient_service.initialize()
        await self.demographics_service.initialize()
        await self.medical_history_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("patient.created", self._handle_patient_created)
        event_bus.subscribe("patient.updated", self._handle_patient_updated)
        event_bus.subscribe("patient.deleted", self._handle_patient_deleted)
        event_bus.subscribe("demographics.updated", self._handle_demographics_updated)
        event_bus.subscribe("medical_history.updated", self._handle_medical_history_updated)
        
        print(f"✅ {self.name} module initialized successfully")
    
    def get_router(self) -> APIRouter:
        """Get the patient management module router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get events that this module subscribes to"""
        return [
            "patient.created",
            "patient.updated",
            "patient.deleted",
            "demographics.updated",
            "medical_history.updated"
        ]
    
    def _setup_routes(self) -> None:
        """Setup patient management API routes"""
        
        @self.router.get("/health")
        async def health_check():
            """Health check endpoint for patient management module"""
            return {
                "status": "healthy",
                "module": "patient_management",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.router.get("/")
        async def get_patients(
            request: Request,
            current_user: dict = Depends(get_current_user),
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            search: Optional[str] = Query(None, description="Search term for patient name or ID"),
            status: Optional[str] = Query(None, description="Filter by patient status"),
            assigned_doctor: Optional[str] = Query(None, description="Filter by assigned doctor")
        ):
            """Get all patients with optional filtering"""
            try:
                # Log patient list access
                await log_medical_security_event(
                    request=request,
                    current_user=current_user,
                    event_type="patient_access",
                    action="Patient list accessed",
                    resource="/api/v1/patients",
                    details=f"Retrieved {limit} patients (skip: {skip}, search: {search}, status: {status})"
                )
                
                patients = await self.patient_service.get_patients(
                    skip=skip,
                    limit=limit,
                    search=search,
                    status=status,
                    assigned_doctor=assigned_doctor
                )
                return {
                    "status": "success",
                    "data": patients,
                    "message": "Patients retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(patients)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{patient_id}")
        async def get_patient(
            patient_id: str,
            request: Request,
            current_user: dict = Depends(get_current_user)
        ):
            """Get a specific patient by ID"""
            try:
                # Log individual patient access
                await log_medical_security_event(
                    request=request,
                    current_user=current_user,
                    event_type="patient_access",
                    action="Individual patient accessed",
                    resource=f"/api/v1/patients/{patient_id}",
                    patient_id=patient_id,
                    details=f"Patient {patient_id} accessed by {current_user.get('email', 'unknown')}"
                )
                
                patient = await self.patient_service.get_patient(patient_id)
                if not patient:
                    raise HTTPException(status_code=404, detail="Patient not found")
                
                return {
                    "status": "success",
                    "data": patient,
                    "message": "Patient retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/")
        async def create_patient(patient_create: PatientCreate):
            """Create a new patient"""
            try:
                patient = await self.patient_service.create_patient(patient_create)
                return {
                    "status": "success",
                    "data": patient,
                    "message": "Patient created successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/{patient_id}")
        async def update_patient(patient_id: str, patient_update: PatientUpdate):
            """Update a patient"""
            try:
                patient = await self.patient_service.update_patient(patient_id, patient_update)
                if not patient:
                    raise HTTPException(status_code=404, detail="Patient not found")
                
                return {
                    "status": "success",
                    "data": patient,
                    "message": "Patient updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/{patient_id}")
        async def delete_patient(patient_id: str):
            """Delete a patient (soft delete)"""
            try:
                success = await self.patient_service.delete_patient(patient_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Patient not found")
                
                return {
                    "status": "success",
                    "message": "Patient deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{patient_id}/demographics")
        async def get_patient_demographics(patient_id: str):
            """Get patient demographics"""
            try:
                demographics = await self.demographics_service.get_patient_demographics(patient_id)
                if not demographics:
                    raise HTTPException(status_code=404, detail="Patient demographics not found")
                
                return {
                    "status": "success",
                    "data": demographics,
                    "message": "Patient demographics retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/{patient_id}/demographics")
        async def update_patient_demographics(patient_id: str, demographics_data: Dict[str, Any]):
            """Update patient demographics"""
            try:
                demographics = await self.demographics_service.update_patient_demographics(
                    patient_id, demographics_data
                )
                if not demographics:
                    raise HTTPException(status_code=404, detail="Patient not found")
                
                return {
                    "status": "success",
                    "data": demographics,
                    "message": "Patient demographics updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{patient_id}/medical-history")
        async def get_patient_medical_history(patient_id: str):
            """Get patient medical history"""
            try:
                medical_history = await self.medical_history_service.get_patient_medical_history(patient_id)
                if not medical_history:
                    raise HTTPException(status_code=404, detail="Patient medical history not found")
                
                return {
                    "status": "success",
                    "data": medical_history,
                    "message": "Patient medical history retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{patient_id}/medical-history")
        async def add_medical_history_entry(patient_id: str, entry_data: Dict[str, Any]):
            """Add a medical history entry"""
            try:
                entry = await self.medical_history_service.add_medical_history_entry(
                    patient_id, entry_data
                )
                if not entry:
                    raise HTTPException(status_code=404, detail="Patient not found")
                
                return {
                    "status": "success",
                    "data": entry,
                    "message": "Medical history entry added successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/statistics/overview")
        async def get_patient_statistics():
            """Get patient statistics overview"""
            try:
                stats = await self.patient_service.get_patient_statistics()
                return {
                    "status": "success",
                    "data": stats,
                    "message": "Patient statistics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/search/advanced")
        async def advanced_patient_search(
            name: Optional[str] = Query(None, description="Patient name"),
            age_min: Optional[int] = Query(None, ge=0, description="Minimum age"),
            age_max: Optional[int] = Query(None, ge=0, description="Maximum age"),
            gender: Optional[str] = Query(None, description="Patient gender"),
            assigned_doctor: Optional[str] = Query(None, description="Assigned doctor"),
            status: Optional[str] = Query(None, description="Patient status"),
            created_after: Optional[str] = Query(None, description="Created after date (YYYY-MM-DD)"),
            created_before: Optional[str] = Query(None, description="Created before date (YYYY-MM-DD)")
        ):
            """Advanced patient search with multiple filters"""
            try:
                filters = {
                    "name": name,
                    "age_min": age_min,
                    "age_max": age_max,
                    "gender": gender,
                    "assigned_doctor": assigned_doctor,
                    "status": status,
                    "created_after": created_after,
                    "created_before": created_before
                }
                
                # Remove None values
                filters = {k: v for k, v in filters.items() if v is not None}
                
                patients = await self.patient_service.advanced_search(filters)
                return {
                    "status": "success",
                    "data": patients,
                    "message": "Advanced search completed successfully",
                    "filters_applied": filters
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    

    
    async def _handle_patient_created(self, data: Dict[str, Any]) -> None:
        """Handle patient created event"""
        try:
            patient_id = data.get("patient_id")
            patient_data = data.get("patient_data")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "patient_created",
                "patient_id": patient_id,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "patient_created",
                "resource": "patient",
                "resource_id": patient_id,
                "user_id": data.get("user_id"),
                "details": patient_data
            })
            
        except Exception as e:
            print(f"Error handling patient created event: {e}")
    
    async def _handle_patient_updated(self, data: Dict[str, Any]) -> None:
        """Handle patient updated event"""
        try:
            patient_id = data.get("patient_id")
            changes = data.get("changes")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "patient_updated",
                "patient_id": patient_id,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "patient_updated",
                "resource": "patient",
                "resource_id": patient_id,
                "user_id": data.get("user_id"),
                "details": changes
            })
            
        except Exception as e:
            print(f"Error handling patient updated event: {e}")
    
    async def _handle_patient_deleted(self, data: Dict[str, Any]) -> None:
        """Handle patient deleted event"""
        try:
            patient_id = data.get("patient_id")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "patient_deleted",
                "patient_id": patient_id,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "patient_deleted",
                "resource": "patient",
                "resource_id": patient_id,
                "user_id": data.get("user_id")
            })
            
        except Exception as e:
            print(f"Error handling patient deleted event: {e}")
    
    async def _handle_demographics_updated(self, data: Dict[str, Any]) -> None:
        """Handle demographics updated event"""
        try:
            patient_id = data.get("patient_id")
            changes = data.get("changes")
            
            await event_bus.emit("audit.log", {
                "action": "demographics_updated",
                "resource": "patient",
                "resource_id": patient_id,
                "user_id": data.get("user_id"),
                "details": changes
            })
            
        except Exception as e:
            print(f"Error handling demographics updated event: {e}")
    
    async def _handle_medical_history_updated(self, data: Dict[str, Any]) -> None:
        """Handle medical history updated event"""
        try:
            patient_id = data.get("patient_id")
            entry_data = data.get("entry_data")
            
            await event_bus.emit("audit.log", {
                "action": "medical_history_updated",
                "resource": "patient",
                "resource_id": patient_id,
                "user_id": data.get("user_id"),
                "details": entry_data
            })
            
        except Exception as e:
            print(f"Error handling medical history updated event: {e}")



