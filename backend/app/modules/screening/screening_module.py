from abc import ABC
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from app.core.base_module import BaseModule
from app.core.config import Config
from app.core.event_bus import event_bus
from app.modules.screening.services.screening_service import ScreeningService
from app.modules.screening.services.vision_test_service import VisionTestService
from app.modules.screening.services.assessment_service import AssessmentService
from app.shared.models.screening import Screening, ScreeningCreate, ScreeningUpdate
from datetime import datetime

# Import security logging
from app.api.medical_security import log_medical_security_event
from app.api.auth import get_current_user

class ScreeningModule(BaseModule):
    """Screening module for EVEP Platform"""
    
    def __init__(self):
        super().__init__()
        self.name = "screening"
        self.version = "1.0.0"
        self.description = "Vision screening and assessment operations"
        
        # Initialize services
        self.screening_service = ScreeningService()
        self.vision_test_service = VisionTestService()
        self.assessment_service = AssessmentService()
        
        # Setup router
        self.router = APIRouter(prefix="/api/v1/screenings", tags=["screenings"])
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the screening module"""
        print(f"🔧 Initializing {self.name} module v{self.version}")
        
        # Initialize services
        await self.screening_service.initialize()
        await self.vision_test_service.initialize()
        await self.assessment_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("screening.created", self._handle_screening_created)
        event_bus.subscribe("screening.updated", self._handle_screening_updated)
        event_bus.subscribe("screening.completed", self._handle_screening_completed)
        event_bus.subscribe("vision_test.completed", self._handle_vision_test_completed)
        event_bus.subscribe("assessment.created", self._handle_assessment_created)
        
        print(f"✅ {self.name} module initialized successfully")
    
    def get_router(self) -> APIRouter:
        """Get the screening module router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get events that this module subscribes to"""
        return [
            "screening.created",
            "screening.updated",
            "screening.completed",
            "vision_test.completed",
            "assessment.created"
        ]
    
    def _setup_routes(self) -> None:
        """Setup screening API routes"""
        
        @self.router.get("/health")
        async def health_check():
            """Health check endpoint for screening module"""
            return {
                "status": "healthy",
                "module": "screening",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.router.get("/")
        async def get_screenings(
            request: Request,
            current_user: dict = Depends(get_current_user),
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
            status: Optional[str] = Query(None, description="Filter by screening status"),
            screening_type: Optional[str] = Query(None, description="Filter by screening type"),
            conducted_by: Optional[str] = Query(None, description="Filter by conducting staff")
        ):
            """Get all screenings with optional filtering"""
            try:
                # Log screening list access
                await log_medical_security_event(
                    request=request,
                    current_user=current_user,
                    event_type="screening_access",
                    action="Screening list accessed",
                    resource="/api/v1/screenings",
                    patient_id=patient_id,
                    details=f"Retrieved {limit} screenings (skip: {skip}, patient_id: {patient_id}, status: {status})"
                )
                
                screenings = await self.screening_service.get_screenings(
                    skip=skip,
                    limit=limit,
                    patient_id=patient_id,
                    status=status,
                    screening_type=screening_type,
                    conducted_by=conducted_by
                )
                return {
                    "status": "success",
                    "data": screenings,
                    "message": "Screenings retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(screenings)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{screening_id}")
        async def get_screening(screening_id: str):
            """Get a specific screening by ID"""
            try:
                screening = await self.screening_service.get_screening(screening_id)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/")
        async def create_screening(screening_create: ScreeningCreate):
            """Create a new screening"""
            try:
                screening = await self.screening_service.create_screening(screening_create)
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening created successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/{screening_id}")
        async def update_screening(screening_id: str, screening_update: ScreeningUpdate):
            """Update a screening"""
            try:
                screening = await self.screening_service.update_screening(screening_id, screening_update)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/{screening_id}")
        async def delete_screening(screening_id: str):
            """Delete a screening (soft delete)"""
            try:
                success = await self.screening_service.delete_screening(screening_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "message": "Screening deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/start")
        async def start_screening(screening_id: str):
            """Start a screening session"""
            try:
                screening = await self.screening_service.start_screening(screening_id)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening started successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/complete")
        async def complete_screening(screening_id: str, results: Dict[str, Any]):
            """Complete a screening with results"""
            try:
                screening = await self.screening_service.complete_screening(screening_id, results)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening completed successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{screening_id}/vision-tests")
        async def get_screening_vision_tests(screening_id: str):
            """Get vision tests for a screening"""
            try:
                vision_tests = await self.vision_test_service.get_screening_vision_tests(screening_id)
                return {
                    "status": "success",
                    "data": vision_tests,
                    "message": "Vision tests retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/vision-tests")
        async def add_vision_test(screening_id: str, test_data: Dict[str, Any]):
            """Add a vision test to a screening"""
            try:
                vision_test = await self.vision_test_service.add_vision_test(screening_id, test_data)
                if not vision_test:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": vision_test,
                    "message": "Vision test added successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{screening_id}/assessments")
        async def get_screening_assessments(screening_id: str):
            """Get assessments for a screening"""
            try:
                assessments = await self.assessment_service.get_screening_assessments(screening_id)
                return {
                    "status": "success",
                    "data": assessments,
                    "message": "Assessments retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/assessments")
        async def create_assessment(screening_id: str, assessment_data: Dict[str, Any]):
            """Create an assessment for a screening"""
            try:
                assessment = await self.assessment_service.create_assessment(screening_id, assessment_data)
                if not assessment:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": assessment,
                    "message": "Assessment created successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/patient/{patient_id}")
        async def get_patient_screenings(
            patient_id: str,
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
        ):
            """Get all screenings for a specific patient"""
            try:
                screenings = await self.screening_service.get_patient_screenings(
                    patient_id, skip=skip, limit=limit
                )
                return {
                    "status": "success",
                    "data": screenings,
                    "message": "Patient screenings retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(screenings)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/statistics/overview")
        async def get_screening_statistics():
            """Get screening statistics overview"""
            try:
                stats = await self.screening_service.get_screening_statistics()
                return {
                    "status": "success",
                    "data": stats,
                    "message": "Screening statistics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/statistics/patient/{patient_id}")
        async def get_patient_screening_statistics(patient_id: str):
            """Get screening statistics for a specific patient"""
            try:
                stats = await self.screening_service.get_patient_screening_statistics(patient_id)
                return {
                    "status": "success",
                    "data": stats,
                    "message": "Patient screening statistics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/search/advanced")
        async def advanced_screening_search(
            patient_id: Optional[str] = Query(None, description="Patient ID"),
            screening_type: Optional[str] = Query(None, description="Screening type"),
            status: Optional[str] = Query(None, description="Screening status"),
            conducted_by: Optional[str] = Query(None, description="Conducting staff"),
            result_category: Optional[str] = Query(None, description="Result category"),
            created_after: Optional[str] = Query(None, description="Created after date (YYYY-MM-DD)"),
            created_before: Optional[str] = Query(None, description="Created before date (YYYY-MM-DD)")
        ):
            """Advanced screening search with multiple filters"""
            try:
                filters = {
                    "patient_id": patient_id,
                    "screening_type": screening_type,
                    "status": status,
                    "conducted_by": conducted_by,
                    "result_category": result_category,
                    "created_after": created_after,
                    "created_before": created_before
                }
                
                # Remove None values
                filters = {k: v for k, v in filters.items() if v is not None}
                
                screenings = await self.screening_service.advanced_search(filters)
                return {
                    "status": "success",
                    "data": screenings,
                    "message": "Advanced search completed successfully",
                    "filters_applied": filters
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/reschedule")
        async def reschedule_screening(screening_id: str, new_date: str):
            """Reschedule a screening"""
            try:
                screening = await self.screening_service.reschedule_screening(screening_id, new_date)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening rescheduled successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{screening_id}/cancel")
        async def cancel_screening(screening_id: str, reason: str):
            """Cancel a screening"""
            try:
                screening = await self.screening_service.cancel_screening(screening_id, reason)
                if not screening:
                    raise HTTPException(status_code=404, detail="Screening not found")
                
                return {
                    "status": "success",
                    "data": screening,
                    "message": "Screening cancelled successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    

    
    async def _handle_screening_created(self, data: Dict[str, Any]) -> None:
        """Handle screening created event"""
        try:
            screening_id = data.get("screening_id")
            screening_data = data.get("screening_data")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "screening_scheduled",
                "screening_id": screening_id,
                "patient_id": screening_data.get("patient_id"),
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "screening_created",
                "resource": "screening",
                "resource_id": screening_id,
                "user_id": data.get("user_id"),
                "details": screening_data
            })
            
        except Exception as e:
            print(f"Error handling screening created event: {e}")
    
    async def _handle_screening_updated(self, data: Dict[str, Any]) -> None:
        """Handle screening updated event"""
        try:
            screening_id = data.get("screening_id")
            changes = data.get("changes")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "screening_updated",
                "screening_id": screening_id,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "screening_updated",
                "resource": "screening",
                "resource_id": screening_id,
                "user_id": data.get("user_id"),
                "details": changes
            })
            
        except Exception as e:
            print(f"Error handling screening updated event: {e}")
    
    async def _handle_screening_completed(self, data: Dict[str, Any]) -> None:
        """Handle screening completed event"""
        try:
            screening_id = data.get("screening_id")
            results = data.get("results")
            
            # Emit additional events
            await event_bus.emit("notification.send", {
                "type": "screening_completed",
                "screening_id": screening_id,
                "patient_id": data.get("patient_id"),
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "screening_completed",
                "resource": "screening",
                "resource_id": screening_id,
                "user_id": data.get("user_id"),
                "details": results
            })
            
            # Trigger assessment if needed
            if results.get("requires_assessment", False):
                await event_bus.emit("assessment.required", {
                    "screening_id": screening_id,
                    "patient_id": data.get("patient_id"),
                    "results": results
                })
            
        except Exception as e:
            print(f"Error handling screening completed event: {e}")
    
    async def _handle_vision_test_completed(self, data: Dict[str, Any]) -> None:
        """Handle vision test completed event"""
        try:
            test_id = data.get("test_id")
            screening_id = data.get("screening_id")
            results = data.get("results")
            
            await event_bus.emit("audit.log", {
                "action": "vision_test_completed",
                "resource": "vision_test",
                "resource_id": test_id,
                "screening_id": screening_id,
                "user_id": data.get("user_id"),
                "details": results
            })
            
        except Exception as e:
            print(f"Error handling vision test completed event: {e}")
    
    async def _handle_assessment_created(self, data: Dict[str, Any]) -> None:
        """Handle assessment created event"""
        try:
            assessment_id = data.get("assessment_id")
            screening_id = data.get("screening_id")
            assessment_data = data.get("assessment_data")
            
            await event_bus.emit("notification.send", {
                "type": "assessment_created",
                "assessment_id": assessment_id,
                "screening_id": screening_id,
                "user_id": data.get("user_id")
            })
            
            await event_bus.emit("audit.log", {
                "action": "assessment_created",
                "resource": "assessment",
                "resource_id": assessment_id,
                "screening_id": screening_id,
                "user_id": data.get("user_id"),
                "details": assessment_data
            })
            
        except Exception as e:
            print(f"Error handling assessment created event: {e}")

