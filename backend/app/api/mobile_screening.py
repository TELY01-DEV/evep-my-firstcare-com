"""
Mobile Screening API endpoints for EVEP Platform

This module provides API endpoints for the complete Mobile Reflection Unit workflow,
including all the missing flows identified in the Thai clinical pathway.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
from bson import ObjectId

from app.api.auth import get_current_user
from app.core.db_rbac import has_permission_db, has_any_role_db, get_user_permissions_from_db
from app.core.database import get_database
from app.utils.blockchain import generate_blockchain_hash
from app.models.mobile_screening_models import (
    # Registration
    RegistrationData,
    
    # Session Management
    MobileScreeningSessionCreate,
    MobileScreeningSession,
    MobileScreeningSessionResponse,
    
    # Assessment
    InitialAssessmentCreate,
    InitialAssessment,
    InitialAssessmentResponse,
    
    # Clinical Decisions
    ClinicalDecisionCreate,
    ClinicalDecision,
    ClinicalDecisionResponse,
    
    # Glasses Prescription
    GlassesPrescriptionCreate,
    GlassesPrescription,
    GlassesPrescriptionResponse,
    
    # Manufacturing
    ManufacturingOrderCreate,
    ManufacturingOrder,
    ManufacturingOrderResponse,
    
    # Follow-up
    FollowUpSessionCreate,
    FollowUpSession,
    FollowUpSessionResponse,
    
    # Complete Workflow
    CompleteWorkflowResponse,
    
    # Enums
    AssessmentOutcome,
    AbnormalityType,
    ManufacturingStatus,
    DeliveryStatus
)

router = APIRouter(prefix="/mobile-screening", tags=["Mobile Screening"])

# Mock database collections (in production, these would be MongoDB collections)
mobile_screening_sessions = []
initial_assessments = []
clinical_decisions = []
glasses_prescriptions = []
manufacturing_orders = []
follow_up_sessions = []

def generate_id(prefix: str) -> str:
    """Generate a unique ID with prefix"""
    return f"{prefix}{str(uuid.uuid4())[:8].upper()}"

@router.post("/registration", response_model=Dict[str, Any])
async def register_patient(
    registration_data: RegistrationData,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Register a patient for mobile screening session
    
    This endpoint handles patient registration with consent forms and medical history.
    """
    try:
        # Validate user permissions
        # Check permissions using database-based RBAC
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        # Check permission from database
        if not await has_permission_db(user_id, "patients_create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to register patients"
            )
        
        # Create patient registration record
        registration_record = {
            "registration_id": generate_id("REG"),
            "patient_data": registration_data.dict(),
            "registered_by": current_user.get("user_id"),
            "registration_date": datetime.utcnow(),
            "status": "registered"
        }
        
        return {
            "success": True,
            "registration_id": registration_record["registration_id"],
            "message": "Patient registered successfully",
            "registration_data": registration_record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering patient: {str(e)}"
        )

@router.get("/sessions", response_model=List[MobileScreeningSessionResponse])
async def get_screening_sessions(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    examiner_id: Optional[str] = Query(None, description="Filter by examiner ID"),
    session_status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get mobile screening sessions with optional filtering"""
    try:
        # Check permissions using database-based RBAC
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        # Check permission from database
        if not await has_permission_db(user_id, "screenings_read"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to read screening sessions"
            )
        
        # Get database connection
        db = get_database()
        
        # Build MongoDB query
        query = {}
        if patient_id:
            if ObjectId.is_valid(patient_id):
                query["patient_id"] = ObjectId(patient_id)
            else:
                # If invalid ObjectId, return empty results
                return []
        if examiner_id:
            if ObjectId.is_valid(examiner_id):
                query["examiner_id"] = ObjectId(examiner_id)
        if session_status:
            query["session_status"] = session_status
        
        # Get sessions from MongoDB with pagination
        cursor = db.evep.mobile_screening_sessions.find(query).skip(skip).limit(limit)
        sessions = await cursor.to_list(length=limit)
        
        # Convert to response format
        result = []
        for session in sessions:
            # Convert ObjectIds to strings
            session["_id"] = str(session["_id"])
            session["session_id"] = str(session["_id"])
            session["patient_id"] = str(session["patient_id"])
            session["examiner_id"] = str(session["examiner_id"])
            
            result.append(MobileScreeningSessionResponse(
                success=True,
                session=MobileScreeningSession(**session),
                message="Session retrieved successfully"
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving screening sessions: {str(e)}"
        )

@router.post("/sessions", response_model=MobileScreeningSessionResponse)
async def create_screening_session(
    session_data: MobileScreeningSessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new mobile screening session
    
    This endpoint initializes a screening session with equipment calibration.
    """
    try:
        # Check permissions using database-based RBAC
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        # Check permission from database
        if not await has_permission_db(user_id, "screenings_create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create screening sessions"
            )
        
        # Get database connection
        db = get_database()
        
        # Validate patient exists  
        patient = await db.evep.patients.find_one({"_id": ObjectId(session_data.patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Generate audit hash
        audit_hash = generate_blockchain_hash(f"mobile_screening_session_created:{session_data.patient_id}")
        
        # Create session document for MongoDB
        session_doc = {
            "patient_id": ObjectId(session_data.patient_id),
            "examiner_id": ObjectId(session_data.examiner_id),
            "school_name": session_data.school_name,
            "session_date": session_data.session_date,
            "equipment_calibration": session_data.equipment_calibration.dict(),
            "session_status": "in_progress",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "audit_hash": audit_hash
        }
        
        # Save to MongoDB mobile_screening_sessions collection
        result = await db.evep.mobile_screening_sessions.insert_one(session_doc)
        session_doc["_id"] = result.inserted_id
        
        # Log audit 
        await db.evep.audit_logs.insert_one({
            "action": "mobile_screening_session_created",
            "user_id": current_user["user_id"],
            "session_id": str(result.inserted_id),
            "patient_id": session_data.patient_id,
            "timestamp": datetime.utcnow().isoformat(),
            "audit_hash": audit_hash,
            "details": {
                "school_name": session_data.school_name,
                "equipment_model": session_data.equipment_calibration.auto_refractor_model,
                "examiner_role": current_user.get("role", "unknown")
            }
        })
        
        # Get patient name for response
        patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip() or "Unknown Patient"
        
        # Create response session object
        session = MobileScreeningSession(
            session_id=str(result.inserted_id),
            **session_data.dict()
        )
        
        return MobileScreeningSessionResponse(
            success=True,
            session=session,
            message=f"Mobile screening session created successfully for {patient_name}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating screening session: {str(e)}"
        )

@router.put("/sessions/{session_id}", response_model=MobileScreeningSessionResponse)
async def update_screening_session(
    session_id: str,
    update_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a mobile screening session"""
    try:
        # Check permissions using database-based RBAC
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        # Check permission from database
        if not await has_permission_db(user_id, "screenings_update"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update screening sessions"
            )
        
        # Get database connection
        db = get_database()
        
        # Validate ObjectId format
        if not ObjectId.is_valid(session_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID format"
            )
        
        # Find and update the session in MongoDB
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.evep.mobile_screening_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mobile screening session not found"
            )
        
        # Get updated session
        updated_session = await db.evep.mobile_screening_sessions.find_one({"_id": ObjectId(session_id)})
        
        # Convert ObjectId to string for response
        if updated_session:
            updated_session["_id"] = str(updated_session["_id"])
            updated_session["session_id"] = str(updated_session["_id"])
        
        return MobileScreeningSessionResponse(
            success=True,
            session=MobileScreeningSession(**updated_session) if updated_session else None,
            message="Mobile screening session updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating screening session: {str(e)}"
        )

@router.delete("/sessions/{session_id}")
async def delete_screening_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a mobile screening session"""
    try:
        # Check permissions using database-based RBAC
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found"
            )
        
        # Check permission from database
        if not await has_permission_db(user_id, "screenings_delete"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to delete screening sessions"
            )
        
        # Find and remove the session
        session_index = None
        for i, session in enumerate(mobile_screening_sessions):
            if session.get("session_id") == session_id:
                session_index = i
                break
        
        if session_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Screening session not found"
            )
        
        # Remove the session
        deleted_session = mobile_screening_sessions.pop(session_index)
        
        return {
            "success": True,
            "message": "Screening session deleted successfully",
            "deleted_session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting screening session: {str(e)}"
        )

@router.post("/assessments", response_model=InitialAssessmentResponse)
async def create_initial_assessment(
    assessment_data: InitialAssessmentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create initial assessment with three-path evaluation
    
    This endpoint handles the complete initial assessment including automatic
    eye measurement, vision testing, and abnormality assessment.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse", "medical_staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create assessments"
            )
        
        # Create assessment
        assessment = InitialAssessment(
            assessment_id=generate_id("IA"),
            **assessment_data.dict()
        )
        
        # Store in mock database
        initial_assessments.append(assessment.dict())
        
        return InitialAssessmentResponse(
            success=True,
            assessment=assessment,
            message="Initial assessment created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating assessment: {str(e)}"
        )

@router.post("/clinical-decisions", response_model=ClinicalDecisionResponse)
async def create_clinical_decision(
    decision_data: ClinicalDecisionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create clinical decision based on assessment results
    
    This endpoint analyzes assessment results and determines the clinical pathway.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create clinical decisions"
            )
        
        # Create clinical decision
        decision = ClinicalDecision(
            decision_id=generate_id("CD"),
            **decision_data.dict()
        )
        
        # Store in mock database
        clinical_decisions.append(decision.dict())
        
        return ClinicalDecisionResponse(
            success=True,
            decision=decision,
            message="Clinical decision created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating clinical decision: {str(e)}"
        )

@router.post("/glasses-prescriptions", response_model=GlassesPrescriptionResponse)
async def create_glasses_prescription(
    prescription_data: GlassesPrescriptionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create glasses prescription with frame selection
    
    This endpoint handles glasses prescription creation including frame selection
    and parameter measurements.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create prescriptions"
            )
        
        # Create prescription
        prescription = GlassesPrescription(
            prescription_id=generate_id("GP"),
            **prescription_data.dict()
        )
        
        # Store in mock database
        glasses_prescriptions.append(prescription.dict())
        
        return GlassesPrescriptionResponse(
            success=True,
            prescription=prescription,
            message="Glasses prescription created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating prescription: {str(e)}"
        )

@router.post("/manufacturing-orders", response_model=ManufacturingOrderResponse)
async def create_manufacturing_order(
    order_data: ManufacturingOrderCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create manufacturing order for glasses
    
    This endpoint initiates the manufacturing process with delivery tracking.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse", "medical_staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create manufacturing orders"
            )
        
        # Create manufacturing order
        order = ManufacturingOrder(
            order_id=generate_id("MO"),
            **order_data.dict()
        )
        
        # Store in mock database
        manufacturing_orders.append(order.dict())
        
        return ManufacturingOrderResponse(
            success=True,
            order=order,
            message="Manufacturing order created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating manufacturing order: {str(e)}"
        )

@router.post("/follow-up-sessions", response_model=FollowUpSessionResponse)
async def create_follow_up_session(
    followup_data: FollowUpSessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create follow-up session for patient monitoring
    
    This endpoint sets up 6-month and annual follow-up sessions.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse", "medical_staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create follow-up sessions"
            )
        
        # Create follow-up session
        followup = FollowUpSession(
            followup_id=generate_id("FU"),
            **followup_data.dict()
        )
        
        # Store in mock database
        follow_up_sessions.append(followup.dict())
        
        return FollowUpSessionResponse(
            success=True,
            followup=followup,
            message="Follow-up session created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating follow-up session: {str(e)}"
        )

@router.post("/complete-workflow", response_model=CompleteWorkflowResponse)
async def create_complete_workflow(
    session_data: MobileScreeningSessionCreate,
    assessment_data: InitialAssessmentCreate,
    decision_data: ClinicalDecisionCreate,
    prescription_data: Optional[GlassesPrescriptionCreate] = None,
    order_data: Optional[ManufacturingOrderCreate] = None,
    followup_data: Optional[FollowUpSessionCreate] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create complete mobile screening workflow
    
    This endpoint creates the entire workflow from session to follow-up in one call.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["doctor", "nurse", "medical_staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create complete workflow"
            )
        
        # Create session
        session = MobileScreeningSession(
            session_id=generate_id("MSS"),
            **session_data.dict()
        )
        
        # Create assessment
        assessment = InitialAssessment(
            assessment_id=generate_id("IA"),
            session_id=session.session_id,
            **assessment_data.dict(exclude={"session_id"})
        )
        
        # Create clinical decision
        decision = ClinicalDecision(
            decision_id=generate_id("CD"),
            assessment_id=assessment.assessment_id,
            **decision_data.dict(exclude={"assessment_id"})
        )
        
        prescription = None
        order = None
        followup = None
        
        # Create prescription if needed
        if prescription_data and decision.assessment_outcome == AssessmentOutcome.ABNORMAL:
            prescription = GlassesPrescription(
                prescription_id=generate_id("GP"),
                decision_id=decision.decision_id,
                **prescription_data.dict(exclude={"decision_id"})
            )
            
            # Create manufacturing order if prescription exists
            if order_data:
                order = ManufacturingOrder(
                    order_id=generate_id("MO"),
                    prescription_id=prescription.prescription_id,
                    **order_data.dict(exclude={"prescription_id"})
                )
                
                # Create follow-up session if order exists
                if followup_data:
                    followup = FollowUpSession(
                        followup_id=generate_id("FU"),
                        prescription_id=prescription.prescription_id,
                        **followup_data.dict(exclude={"prescription_id"})
                    )
        
        # Store all records
        mobile_screening_sessions.append(session.dict())
        initial_assessments.append(assessment.dict())
        clinical_decisions.append(decision.dict())
        
        if prescription:
            glasses_prescriptions.append(prescription.dict())
        if order:
            manufacturing_orders.append(order.dict())
        if followup:
            follow_up_sessions.append(followup.dict())
        
        return CompleteWorkflowResponse(
            success=True,
            session=session,
            assessment=assessment,
            decision=decision,
            prescription=prescription,
            order=order,
            followup=followup,
            message="Complete workflow created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating complete workflow: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=MobileScreeningSessionResponse)
async def get_screening_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get screening session by ID"""
    try:
        session = next((s for s in mobile_screening_sessions if s["session_id"] == session_id), None)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Screening session not found"
            )
        
        return MobileScreeningSessionResponse(
            success=True,
            session=MobileScreeningSession(**session),
            message="Screening session retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving session: {str(e)}"
        )

@router.get("/assessments/{assessment_id}", response_model=InitialAssessmentResponse)
async def get_initial_assessment(
    assessment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get initial assessment by ID"""
    try:
        assessment = next((a for a in initial_assessments if a["assessment_id"] == assessment_id), None)
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Initial assessment not found"
            )
        
        return InitialAssessmentResponse(
            success=True,
            assessment=InitialAssessment(**assessment),
            message="Initial assessment retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving assessment: {str(e)}"
        )

@router.get("/patients/{patient_id}/workflow", response_model=Dict[str, Any])
async def get_patient_workflow(
    patient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get complete workflow for a patient"""
    try:
        # Find all records for the patient
        sessions = [s for s in mobile_screening_sessions if s["patient_id"] == patient_id]
        assessments = [a for a in initial_assessments if a["patient_id"] == patient_id]
        decisions = [d for d in clinical_decisions if d["patient_id"] == patient_id]
        prescriptions = [p for p in glasses_prescriptions if p["patient_id"] == patient_id]
        orders = [o for o in manufacturing_orders if o["patient_id"] == patient_id]
        followups = [f for f in follow_up_sessions if f["patient_id"] == patient_id]
        
        return {
            "success": True,
            "patient_id": patient_id,
            "workflow": {
                "sessions": sessions,
                "assessments": assessments,
                "decisions": decisions,
                "prescriptions": prescriptions,
                "orders": orders,
                "followups": followups
            },
            "message": "Patient workflow retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving patient workflow: {str(e)}"
        )

@router.get("/statistics", response_model=Dict[str, Any])
async def get_mobile_screening_statistics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get mobile screening statistics"""
    try:
        # Calculate statistics
        total_sessions = len(mobile_screening_sessions)
        total_assessments = len(initial_assessments)
        total_decisions = len(clinical_decisions)
        total_prescriptions = len(glasses_prescriptions)
        total_orders = len(manufacturing_orders)
        total_followups = len(follow_up_sessions)
        
        # Calculate outcomes
        normal_assessments = len([a for a in initial_assessments if a["assessment_outcome"] == "normal"])
        abnormal_assessments = len([a for a in initial_assessments if a["assessment_outcome"] == "abnormal"])
        
        # Calculate manufacturing status
        ordered_orders = len([o for o in manufacturing_orders if o["manufacturing_status"] == "ordered"])
        completed_orders = len([o for o in manufacturing_orders if o["manufacturing_status"] == "completed"])
        delivered_orders = len([o for o in manufacturing_orders if o["manufacturing_status"] == "delivered"])
        
        return {
            "success": True,
            "statistics": {
                "total_sessions": total_sessions,
                "total_assessments": total_assessments,
                "total_decisions": total_decisions,
                "total_prescriptions": total_prescriptions,
                "total_orders": total_orders,
                "total_followups": total_followups,
                "assessment_outcomes": {
                    "normal": normal_assessments,
                    "abnormal": abnormal_assessments
                },
                "manufacturing_status": {
                    "ordered": ordered_orders,
                    "completed": completed_orders,
                    "delivered": delivered_orders
                }
            },
            "message": "Statistics retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving statistics: {str(e)}"
        )
