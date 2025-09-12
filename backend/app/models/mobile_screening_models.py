"""
Mobile Screening Models for EVEP Platform

This module contains Pydantic models for the Mobile Reflection Unit screening workflow,
including all the missing flows identified in the Thai clinical pathway.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums for various statuses and types
class AssessmentOutcome(str, Enum):
    NORMAL = "normal"
    ABNORMAL = "abnormal"

class MeasurementQuality(str, Enum):
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

class ChartType(str, Enum):
    SNELLEN = "snellen"
    TUMBLING_E = "tumbling_e"
    LEA_SYMBOLS = "lea_symbols"
    NUMBERS = "numbers"

class AbnormalityType(str, Enum):
    REFRACTIVE_ERROR = "refractive_error"
    EYE_DISEASE = "eye_disease"
    OTHER = "other"

class RefractiveErrorType(str, Enum):
    MYOPIA = "myopia"
    HYPEROPIA = "hyperopia"
    ASTIGMATISM = "astigmatism"
    PRESBYOPIA = "presbyopia"

class SeverityLevel(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class LensType(str, Enum):
    SINGLE_VISION = "single_vision"
    BIFOCAL = "bifocal"
    PROGRESSIVE = "progressive"

class ManufacturingStatus(str, Enum):
    ORDERED = "ordered"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELIVERED = "delivered"

class DeliveryMethod(str, Enum):
    SCHOOL_DELIVERY = "school_delivery"
    HOME_DELIVERY = "home_delivery"
    MOBILE_UNIT_PICKUP = "mobile_unit_pickup"

class DeliveryStatus(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"

class FittingStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"

# Base models for common structures
class EyeMeasurement(BaseModel):
    sphere: str = Field(..., description="Sphere measurement in diopters")
    cylinder: str = Field(..., description="Cylinder measurement in diopters")
    axis: str = Field(..., description="Axis measurement in degrees")

class FaceMeasurements(BaseModel):
    bridge_width: str = Field(..., description="Bridge width in mm")
    temple_length: str = Field(..., description="Temple length in mm")

class ConsentForms(BaseModel):
    vision_screening: bool = Field(..., description="Vision screening consent")
    data_sharing: bool = Field(..., description="Data sharing consent")
    glasses_prescription: bool = Field(..., description="Glasses prescription consent")
    consent_date: datetime = Field(default_factory=datetime.utcnow)

class MedicalHistory(BaseModel):
    previous_eye_surgery: bool = Field(default=False)
    eye_diseases: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)

class EquipmentCalibration(BaseModel):
    auto_refractor_model: str = Field(..., description="Auto-refractor model")
    calibration_date: datetime = Field(..., description="Last calibration date")
    calibration_status: str = Field(..., description="Calibration status")
    examiner_id: str = Field(..., description="Examiner ID")

# Registration Data Model
class RegistrationData(BaseModel):
    student_id: str = Field(..., description="Unique school identifier")
    school_name: str = Field(..., description="Current school enrollment")
    grade_level: str = Field(..., description="Current academic grade")
    parent_name: str = Field(..., description="Primary caregiver name")
    parent_phone: str = Field(..., description="Parent contact number")
    parent_email: EmailStr = Field(..., description="Parent email address")
    consent_forms: ConsentForms = Field(..., description="Consent form collection")
    medical_history: MedicalHistory = Field(..., description="Medical history review")
    equipment_calibration: EquipmentCalibration = Field(..., description="Equipment setup")

# Mobile Screening Session Model
class MobileScreeningSessionCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID")
    examiner_id: str = Field(..., description="Examiner ID")
    school_name: str = Field(..., description="School name")
    session_date: datetime = Field(default_factory=datetime.utcnow)
    equipment_calibration: EquipmentCalibration = Field(..., description="Equipment calibration")

class MobileScreeningSession(MobileScreeningSessionCreate):
    session_id: str = Field(..., description="Unique session ID")
    session_status: str = Field(default="in_progress", description="Session status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Initial Assessment Models
class AutoRefraction(BaseModel):
    left_eye: EyeMeasurement = Field(..., description="Left eye measurements")
    right_eye: EyeMeasurement = Field(..., description="Right eye measurements")
    pupillary_distance: str = Field(..., description="Pupillary distance in mm")
    interpupillary_distance: str = Field(..., description="Interpupillary distance in mm")
    equipment_used: str = Field(..., description="Equipment model used")
    measurement_quality: MeasurementQuality = Field(..., description="Measurement quality")

class DistanceVision(BaseModel):
    left_eye: str = Field(..., description="Left eye distance vision")
    right_eye: str = Field(..., description="Right eye distance vision")
    binocular: str = Field(..., description="Binocular vision")
    chart_type: ChartType = Field(..., description="Chart type used")

class NearVision(BaseModel):
    left_eye: str = Field(..., description="Left eye near vision")
    right_eye: str = Field(..., description="Right eye near vision")
    reading_distance: str = Field(..., description="Reading distance in cm")

class ExternalExamination(BaseModel):
    eyelids: str = Field(..., description="Eyelid assessment")
    conjunctiva: str = Field(..., description="Conjunctiva assessment")
    cornea: str = Field(..., description="Cornea assessment")
    pupil_response: str = Field(..., description="Pupil response")
    notes: Optional[str] = Field(None, description="Examination notes")

class OcularMotility(BaseModel):
    eye_movements: str = Field(..., description="Eye movement assessment")
    alignment: str = Field(..., description="Eye alignment")
    convergence: str = Field(..., description="Convergence assessment")

class ColorVision(BaseModel):
    ishihara_test: str = Field(..., description="Ishihara test result")
    color_deficiency_type: Optional[str] = Field(None, description="Color deficiency type")

class DepthPerception(BaseModel):
    stereopsis: str = Field(..., description="Stereopsis assessment")
    depth_perception_score: Optional[str] = Field(None, description="Depth perception score")

class InitialAssessmentCreate(BaseModel):
    session_id: str = Field(..., description="Session ID")
    patient_id: str = Field(..., description="Patient ID")
    assessment_date: datetime = Field(default_factory=datetime.utcnow)
    auto_refraction: AutoRefraction = Field(..., description="Automatic eye measurement")
    distance_vision: DistanceVision = Field(..., description="Distance vision testing")
    near_vision: NearVision = Field(..., description="Near vision testing")
    external_examination: ExternalExamination = Field(..., description="External eye examination")
    ocular_motility: OcularMotility = Field(..., description="Ocular motility testing")
    color_vision: ColorVision = Field(..., description="Color vision testing")
    depth_perception: DepthPerception = Field(..., description="Depth perception testing")
    assessment_outcome: AssessmentOutcome = Field(..., description="Assessment outcome")

class InitialAssessment(InitialAssessmentCreate):
    assessment_id: str = Field(..., description="Unique assessment ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Clinical Decision Models
class RefractiveError(BaseModel):
    type: RefractiveErrorType = Field(..., description="Refractive error type")
    severity: SeverityLevel = Field(..., description="Error severity")
    prescription_required: bool = Field(..., description="Prescription required")

class EyeDisease(BaseModel):
    condition: str = Field(..., description="Disease condition")
    severity: SeverityLevel = Field(..., description="Disease severity")
    referral_required: bool = Field(..., description="Referral required")
    referral_type: Optional[str] = Field(None, description="Referral type")

class ClinicalDecisionCreate(BaseModel):
    assessment_id: str = Field(..., description="Assessment ID")
    patient_id: str = Field(..., description="Patient ID")
    decision_date: datetime = Field(default_factory=datetime.utcnow)
    assessment_outcome: AssessmentOutcome = Field(..., description="Assessment outcome")
    abnormality_type: Optional[AbnormalityType] = Field(None, description="Abnormality type")
    refractive_error: Optional[RefractiveError] = Field(None, description="Refractive error details")
    eye_disease: Optional[EyeDisease] = Field(None, description="Eye disease details")
    clinical_notes: Optional[str] = Field(None, description="Clinical notes")
    referral_required: bool = Field(default=False, description="Referral required")
    referral_type: Optional[str] = Field(None, description="Referral type")

class ClinicalDecision(ClinicalDecisionCreate):
    decision_id: str = Field(..., description="Unique decision ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Glasses Prescription Models
class FinalPrescription(BaseModel):
    left_eye: EyeMeasurement = Field(..., description="Left eye prescription")
    right_eye: EyeMeasurement = Field(..., description="Right eye prescription")
    pupillary_distance: str = Field(..., description="Pupillary distance")
    interpupillary_distance: str = Field(..., description="Interpupillary distance")
    vertex_distance: str = Field(..., description="Vertex distance")
    pantoscopic_tilt: str = Field(..., description="Pantoscopic tilt")

class FrameSelection(BaseModel):
    frame_size: str = Field(..., description="Frame size")
    face_measurements: FaceMeasurements = Field(..., description="Face measurements")
    frame_material: str = Field(..., description="Frame material")
    lens_type: LensType = Field(..., description="Lens type")
    lens_coatings: List[str] = Field(default_factory=list, description="Lens coatings")

class GlassesPrescriptionCreate(BaseModel):
    decision_id: str = Field(..., description="Clinical decision ID")
    patient_id: str = Field(..., description="Patient ID")
    prescription_date: datetime = Field(default_factory=datetime.utcnow)
    final_prescription: FinalPrescription = Field(..., description="Final prescription")
    frame_selection: FrameSelection = Field(..., description="Frame selection")
    prescription_status: str = Field(default="approved", description="Prescription status")

class GlassesPrescription(GlassesPrescriptionCreate):
    prescription_id: str = Field(..., description="Unique prescription ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Manufacturing and Delivery Models
class Delivery(BaseModel):
    method: DeliveryMethod = Field(..., description="Delivery method")
    delivery_date: Optional[datetime] = Field(None, description="Delivery date")
    delivery_status: DeliveryStatus = Field(default=DeliveryStatus.PENDING, description="Delivery status")
    recipient_name: Optional[str] = Field(None, description="Recipient name")
    recipient_phone: Optional[str] = Field(None, description="Recipient phone")

class Fitting(BaseModel):
    fitting_date: Optional[datetime] = Field(None, description="Fitting date")
    fitting_status: FittingStatus = Field(default=FittingStatus.PENDING, description="Fitting status")
    adjustments_needed: bool = Field(default=False, description="Adjustments needed")
    adjustment_notes: Optional[str] = Field(None, description="Adjustment notes")

class ManufacturingOrderCreate(BaseModel):
    prescription_id: str = Field(..., description="Prescription ID")
    patient_id: str = Field(..., description="Patient ID")
    order_date: datetime = Field(default_factory=datetime.utcnow)
    manufacturing_status: ManufacturingStatus = Field(default=ManufacturingStatus.ORDERED, description="Manufacturing status")
    estimated_completion: datetime = Field(..., description="Estimated completion date")
    delivery: Delivery = Field(..., description="Delivery details")
    fitting: Fitting = Field(..., description="Fitting details")

class ManufacturingOrder(ManufacturingOrderCreate):
    order_id: str = Field(..., description="Unique order ID")
    actual_completion: Optional[datetime] = Field(None, description="Actual completion date")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Follow-up Models
class SixMonthFollowup(BaseModel):
    scheduled_date: datetime = Field(..., description="Scheduled follow-up date")
    completed_date: Optional[datetime] = Field(None, description="Completed date")
    vision_improvement: Optional[str] = Field(None, description="Vision improvement")
    glasses_compliance: Optional[str] = Field(None, description="Glasses compliance")
    academic_impact: Optional[str] = Field(None, description="Academic impact")
    notes: Optional[str] = Field(None, description="Follow-up notes")

class AnnualScreening(BaseModel):
    next_screening_date: datetime = Field(..., description="Next screening date")
    screening_reminder_sent: bool = Field(default=False, description="Reminder sent")

class ParentCommunication(BaseModel):
    initial_notification_sent: bool = Field(default=False, description="Initial notification sent")
    followup_notification_sent: bool = Field(default=False, description="Follow-up notification sent")
    parent_feedback: Optional[str] = Field(None, description="Parent feedback")

class FollowUpSessionCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID")
    prescription_id: str = Field(..., description="Prescription ID")
    followup_date: datetime = Field(..., description="Follow-up date")
    six_month_followup: SixMonthFollowup = Field(..., description="6-month follow-up")
    annual_screening: AnnualScreening = Field(..., description="Annual screening")
    parent_communication: ParentCommunication = Field(..., description="Parent communication")

class FollowUpSession(FollowUpSessionCreate):
    followup_id: str = Field(..., description="Unique follow-up ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Response Models
class MobileScreeningSessionResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    session: MobileScreeningSession = Field(..., description="Screening session")
    message: str = Field(..., description="Response message")

class InitialAssessmentResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    assessment: InitialAssessment = Field(..., description="Initial assessment")
    message: str = Field(..., description="Response message")

class ClinicalDecisionResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    decision: ClinicalDecision = Field(..., description="Clinical decision")
    message: str = Field(..., description="Response message")

class GlassesPrescriptionResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    prescription: GlassesPrescription = Field(..., description="Glasses prescription")
    message: str = Field(..., description="Response message")

class ManufacturingOrderResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    order: ManufacturingOrder = Field(..., description="Manufacturing order")
    message: str = Field(..., description="Response message")

class FollowUpSessionResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    followup: FollowUpSession = Field(..., description="Follow-up session")
    message: str = Field(..., description="Response message")

# Complete Workflow Response
class CompleteWorkflowResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    session: MobileScreeningSession = Field(..., description="Screening session")
    assessment: InitialAssessment = Field(..., description="Initial assessment")
    decision: ClinicalDecision = Field(..., description="Clinical decision")
    prescription: Optional[GlassesPrescription] = Field(None, description="Glasses prescription")
    order: Optional[ManufacturingOrder] = Field(None, description="Manufacturing order")
    followup: Optional[FollowUpSession] = Field(None, description="Follow-up session")
    message: str = Field(..., description="Response message")
