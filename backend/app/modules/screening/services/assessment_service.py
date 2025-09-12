from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import Config

class AssessmentService:
    """Assessment service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("screening")
        
        # In-memory storage for demonstration
        self.assessments = {}
        self.assessment_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the assessment service"""
        print("🔧 Assessment service initialized")
    
    async def get_screening_assessments(self, screening_id: str) -> List[Dict[str, Any]]:
        """Get assessments for a specific screening"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["screening_id"] == screening_id
        ]
    
    async def create_assessment(self, screening_id: str, assessment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create an assessment for a screening"""
        # Validate required fields
        required_fields = ["assessment_type", "findings", "recommendations"]
        for field in required_fields:
            if field not in assessment_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate assessment ID
        self.assessment_counter += 1
        assessment_id = f"ASS-{self.assessment_counter:06d}"
        
        # Create assessment
        assessment = {
            "assessment_id": assessment_id,
            "screening_id": screening_id,
            "assessment_type": assessment_data["assessment_type"],
            "findings": assessment_data["findings"],
            "recommendations": assessment_data["recommendations"],
            "diagnosis": assessment_data.get("diagnosis", ""),
            "severity": assessment_data.get("severity", "mild"),
            "urgency": assessment_data.get("urgency", "routine"),
            "follow_up_required": assessment_data.get("follow_up_required", False),
            "follow_up_date": assessment_data.get("follow_up_date"),
            "conducted_by": assessment_data.get("conducted_by", "system"),
            "notes": assessment_data.get("notes", ""),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store assessment
        self.assessments[assessment_id] = assessment
        
        return assessment
    
    async def get_assessment(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """Get an assessment by ID"""
        return self.assessments.get(assessment_id)
    
    async def update_assessment(self, assessment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an assessment"""
        if assessment_id not in self.assessments:
            return None
        
        assessment = self.assessments[assessment_id]
        
        # Update fields
        for key, value in updates.items():
            if key in assessment:
                assessment[key] = value
        
        assessment["updated_at"] = datetime.utcnow().isoformat()
        
        return assessment
    
    async def delete_assessment(self, assessment_id: str) -> bool:
        """Delete an assessment"""
        if assessment_id not in self.assessments:
            return False
        
        del self.assessments[assessment_id]
        return True
    
    async def get_assessments_by_type(self, assessment_type: str) -> List[Dict[str, Any]]:
        """Get assessments by type"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["assessment_type"] == assessment_type
        ]
    
    async def get_assessments_by_severity(self, severity: str) -> List[Dict[str, Any]]:
        """Get assessments by severity"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["severity"] == severity
        ]
    
    async def get_assessments_by_urgency(self, urgency: str) -> List[Dict[str, Any]]:
        """Get assessments by urgency"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["urgency"] == urgency
        ]
    
    async def get_urgent_assessments(self) -> List[Dict[str, Any]]:
        """Get assessments that require urgent attention"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["urgency"] in ["urgent", "emergency"]
        ]
    
    async def get_assessments_requiring_followup(self) -> List[Dict[str, Any]]:
        """Get assessments that require follow-up"""
        return [
            assessment for assessment in self.assessments.values()
            if assessment["follow_up_required"] == True
        ]
    
    async def get_assessment_statistics(self) -> Dict[str, Any]:
        """Get assessment statistics"""
        total_assessments = len(self.assessments)
        
        # Assessment type distribution
        type_counts = {}
        for assessment in self.assessments.values():
            assessment_type = assessment["assessment_type"]
            type_counts[assessment_type] = type_counts.get(assessment_type, 0) + 1
        
        # Severity distribution
        severity_counts = {}
        for assessment in self.assessments.values():
            severity = assessment["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Urgency distribution
        urgency_counts = {}
        for assessment in self.assessments.values():
            urgency = assessment["urgency"]
            urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1
        
        # Follow-up required count
        follow_up_count = len([a for a in self.assessments.values() if a["follow_up_required"]])
        
        return {
            "total_assessments": total_assessments,
            "assessment_type_distribution": type_counts,
            "severity_distribution": severity_counts,
            "urgency_distribution": urgency_counts,
            "follow_up_required": follow_up_count,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def validate_assessment_data(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate assessment data"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required fields
        required_fields = ["assessment_type", "findings", "recommendations"]
        for field in required_fields:
            if field not in assessment_data:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Missing required field: {field}")
        
        # Validate assessment type
        if "assessment_type" in assessment_data:
            valid_types = [
                "comprehensive_eye_exam",
                "vision_screening_followup",
                "specialist_consultation",
                "diagnostic_testing",
                "treatment_planning"
            ]
            if assessment_data["assessment_type"] not in valid_types:
                validation_result["warnings"].append(f"Assessment type '{assessment_data['assessment_type']}' is not in standard list")
        
        # Validate severity
        if "severity" in assessment_data:
            valid_severities = ["mild", "moderate", "severe", "critical"]
            if assessment_data["severity"] not in valid_severities:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Invalid severity level")
        
        # Validate urgency
        if "urgency" in assessment_data:
            valid_urgencies = ["routine", "urgent", "emergency"]
            if assessment_data["urgency"] not in valid_urgencies:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Invalid urgency level")
        
        # Validate findings
        if "findings" in assessment_data:
            findings = assessment_data["findings"]
            if not isinstance(findings, str) or len(findings.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Findings must be a non-empty string")
        
        # Validate recommendations
        if "recommendations" in assessment_data:
            recommendations = assessment_data["recommendations"]
            if not isinstance(recommendations, str) or len(recommendations.strip()) == 0:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Recommendations must be a non-empty string")
        
        return validation_result
    
    async def get_assessment_templates(self) -> Dict[str, Any]:
        """Get assessment templates for different assessment types"""
        templates = {
            "comprehensive_eye_exam": {
                "assessment_type": "comprehensive_eye_exam",
                "description": "Comprehensive Eye Examination",
                "required_fields": ["findings", "recommendations"],
                "optional_fields": ["diagnosis", "severity", "urgency", "follow_up_required"],
                "template": {
                    "findings": "Detailed findings from comprehensive examination...",
                    "recommendations": "Specific recommendations for treatment or follow-up...",
                    "diagnosis": "Primary diagnosis if applicable",
                    "severity": "mild|moderate|severe|critical",
                    "urgency": "routine|urgent|emergency"
                }
            },
            "vision_screening_followup": {
                "assessment_type": "vision_screening_followup",
                "description": "Vision Screening Follow-up Assessment",
                "required_fields": ["findings", "recommendations"],
                "optional_fields": ["diagnosis", "severity", "urgency"],
                "template": {
                    "findings": "Findings from screening follow-up...",
                    "recommendations": "Recommendations based on screening results...",
                    "diagnosis": "Diagnosis if screening revealed issues",
                    "severity": "mild|moderate|severe|critical",
                    "urgency": "routine|urgent|emergency"
                }
            },
            "specialist_consultation": {
                "assessment_type": "specialist_consultation",
                "description": "Specialist Consultation Assessment",
                "required_fields": ["findings", "recommendations"],
                "optional_fields": ["diagnosis", "severity", "urgency", "specialist_type"],
                "template": {
                    "findings": "Specialist consultation findings...",
                    "recommendations": "Specialist recommendations...",
                    "diagnosis": "Specialist diagnosis",
                    "severity": "mild|moderate|severe|critical",
                    "urgency": "routine|urgent|emergency",
                    "specialist_type": "ophthalmologist|optometrist|retina_specialist"
                }
            },
            "diagnostic_testing": {
                "assessment_type": "diagnostic_testing",
                "description": "Diagnostic Testing Assessment",
                "required_fields": ["findings", "recommendations"],
                "optional_fields": ["diagnosis", "severity", "urgency", "test_results"],
                "template": {
                    "findings": "Diagnostic test findings...",
                    "recommendations": "Recommendations based on test results...",
                    "diagnosis": "Diagnosis based on test results",
                    "severity": "mild|moderate|severe|critical",
                    "urgency": "routine|urgent|emergency",
                    "test_results": "Detailed test results"
                }
            },
            "treatment_planning": {
                "assessment_type": "treatment_planning",
                "description": "Treatment Planning Assessment",
                "required_fields": ["findings", "recommendations"],
                "optional_fields": ["diagnosis", "severity", "urgency", "treatment_plan"],
                "template": {
                    "findings": "Assessment findings for treatment planning...",
                    "recommendations": "Treatment recommendations...",
                    "diagnosis": "Diagnosis requiring treatment",
                    "severity": "mild|moderate|severe|critical",
                    "urgency": "routine|urgent|emergency",
                    "treatment_plan": "Detailed treatment plan"
                }
            }
        }
        
        return templates
    
    async def analyze_assessment_trends(self, patient_id: str) -> Dict[str, Any]:
        """Analyze assessment trends for a patient"""
        # This would typically query assessments across multiple screenings for a patient
        # For now, we'll analyze all assessments
        
        if not self.assessments:
            return {
                "patient_id": patient_id,
                "analysis": "No assessments available",
                "trends": {},
                "recommendations": []
            }
        
        # Analyze severity trends
        severity_trends = {}
        for assessment in self.assessments.values():
            severity = assessment["severity"]
            severity_trends[severity] = severity_trends.get(severity, 0) + 1
        
        # Analyze urgency trends
        urgency_trends = {}
        for assessment in self.assessments.values():
            urgency = assessment["urgency"]
            urgency_trends[urgency] = urgency_trends.get(urgency, 0) + 1
        
        # Analyze assessment types
        type_trends = {}
        for assessment in self.assessments.values():
            assessment_type = assessment["assessment_type"]
            type_trends[assessment_type] = type_trends.get(assessment_type, 0) + 1
        
        # Generate recommendations based on trends
        recommendations = []
        
        if urgency_trends.get("urgent", 0) > 0:
            recommendations.append("Monitor for urgent assessment patterns")
        
        if urgency_trends.get("emergency", 0) > 0:
            recommendations.append("Review emergency assessment protocols")
        
        if severity_trends.get("severe", 0) > 0 or severity_trends.get("critical", 0) > 0:
            recommendations.append("Consider specialist referral for severe cases")
        
        return {
            "patient_id": patient_id,
            "analysis": f"Analyzed {len(self.assessments)} assessments",
            "severity_trends": severity_trends,
            "urgency_trends": urgency_trends,
            "type_trends": type_trends,
            "recommendations": recommendations
        }
    
    async def generate_assessment_report(self, assessment_id: str) -> Dict[str, Any]:
        """Generate a detailed assessment report"""
        assessment = self.assessments.get(assessment_id)
        
        if not assessment:
            return {
                "error": "Assessment not found",
                "assessment_id": assessment_id
            }
        
        # Generate report sections
        report = {
            "assessment_id": assessment_id,
            "screening_id": assessment["screening_id"],
            "report_date": datetime.utcnow().isoformat(),
            "assessment_type": assessment["assessment_type"],
            "severity": assessment["severity"],
            "urgency": assessment["urgency"],
            "findings": assessment["findings"],
            "recommendations": assessment["recommendations"],
            "diagnosis": assessment.get("diagnosis", ""),
            "follow_up_required": assessment["follow_up_required"],
            "follow_up_date": assessment.get("follow_up_date"),
            "conducted_by": assessment["conducted_by"],
            "notes": assessment.get("notes", ""),
            "created_at": assessment["created_at"]
        }
        
        return report
    
    async def export_assessment_data(self, screening_id: str, format: str = "json") -> Dict[str, Any]:
        """Export assessment data for a screening"""
        assessments = await self.get_screening_assessments(screening_id)
        
        if format.lower() == "json":
            return {
                "screening_id": screening_id,
                "format": "json",
                "total_assessments": len(assessments),
                "data": assessments,
                "exported_at": datetime.utcnow().isoformat()
            }
        elif format.lower() == "csv":
            # In a real implementation, this would generate CSV data
            return {
                "screening_id": screening_id,
                "format": "csv",
                "total_assessments": len(assessments),
                "data": "CSV data would be generated here",
                "exported_at": datetime.utcnow().isoformat()
            }
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def get_assessment_history(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get assessment history for a patient across all screenings"""
        # This would typically query across multiple screenings
        # For now, return all assessments
        all_assessments = []
        
        for assessment in self.assessments.values():
            # In a real implementation, we'd join with screening data to get patient_id
            # For now, we'll return all assessments
            all_assessments.append(assessment)
        
        # Sort by creation date
        all_assessments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return all_assessments
    
    async def schedule_followup(self, assessment_id: str, followup_date: str, notes: str = "") -> Optional[Dict[str, Any]]:
        """Schedule a follow-up for an assessment"""
        if assessment_id not in self.assessments:
            return None
        
        assessment = self.assessments[assessment_id]
        assessment["follow_up_required"] = True
        assessment["follow_up_date"] = followup_date
        assessment["notes"] = f"{assessment.get('notes', '')}\nFollow-up scheduled: {notes}"
        assessment["updated_at"] = datetime.utcnow().isoformat()
        
        return assessment
    
    async def get_upcoming_followups(self) -> List[Dict[str, Any]]:
        """Get assessments with upcoming follow-ups"""
        today = datetime.utcnow().date()
        upcoming_followups = []
        
        for assessment in self.assessments.values():
            if assessment["follow_up_required"] and assessment.get("follow_up_date"):
                try:
                    followup_date = datetime.strptime(assessment["follow_up_date"], "%Y-%m-%d").date()
                    if followup_date >= today:
                        upcoming_followups.append(assessment)
                except ValueError:
                    # Skip invalid dates
                    continue
        
        # Sort by follow-up date
        upcoming_followups.sort(key=lambda x: x.get("follow_up_date", ""))
        
        return upcoming_followups

