"""
Prompt Manager for EVEP Platform

This module manages prompt templates for different roles and insight types.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class PromptTemplate(BaseModel):
    """Prompt template model"""
    template_id: str
    role: str
    insight_type: str
    prompt_template: str
    variables: List[str]
    version: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class PromptManager:
    """Manages prompt templates for different roles and insight types"""
    
    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}
        self._load_default_templates()
    
    def _load_default_templates(self):
        """Load default prompt templates"""
        default_templates = [
            {
                "template_id": "doctor_screening_analysis",
                "role": "doctor",
                "insight_type": "screening_analysis",
                "prompt_template": """
                Analyze the following vision screening data for clinical assessment:
                
                Patient Information:
                - Name: {patient_name}
                - Age: {patient_age}
                - Gender: {patient_gender}
                
                Screening Results:
                - Left Eye Distance: {left_eye_distance}
                - Right Eye Distance: {right_eye_distance}
                - Left Eye Near: {left_eye_near}
                - Right Eye Near: {right_eye_near}
                - Color Vision: {color_vision}
                - Depth Perception: {depth_perception}
                
                Medical History: {medical_history}
                
                Please provide:
                1. Clinical interpretation of the screening results
                2. Potential diagnoses or conditions to consider
                3. Recommended follow-up actions and timeline
                4. Risk factors and red flags to monitor
                5. Treatment recommendations if applicable
                6. Referral recommendations if needed
                
                Focus on medical accuracy, clinical relevance, and evidence-based recommendations.
                """,
                "variables": [
                    "patient_name", "patient_age", "patient_gender",
                    "left_eye_distance", "right_eye_distance",
                    "left_eye_near", "right_eye_near",
                    "color_vision", "depth_perception", "medical_history"
                ],
                "version": "1.0",
                "is_active": True
            },
            {
                "template_id": "teacher_academic_impact",
                "role": "teacher",
                "insight_type": "academic_impact",
                "prompt_template": """
                Analyze the following vision screening data for educational impact:
                
                Student Information:
                - Name: {student_name}
                - Grade: {grade_level}
                - School: {school_name}
                
                Screening Results:
                - Left Eye Distance: {left_eye_distance}
                - Right Eye Distance: {right_eye_distance}
                - Color Vision: {color_vision}
                - Depth Perception: {depth_perception}
                
                Academic Performance: {academic_performance}
                
                Please provide:
                1. Impact on learning and academic performance
                2. Specific subjects that may be affected
                3. Recommended classroom accommodations
                4. Signs to watch for in the classroom
                5. Communication recommendations for parents
                6. Educational support strategies
                7. Seating and lighting recommendations
                
                Focus on practical classroom applications and student success.
                """,
                "variables": [
                    "student_name", "grade_level", "school_name",
                    "left_eye_distance", "right_eye_distance",
                    "color_vision", "depth_perception", "academic_performance"
                ],
                "version": "1.0",
                "is_active": True
            },
            {
                "template_id": "parent_guidance",
                "role": "parent",
                "insight_type": "parent_guidance",
                "prompt_template": """
                Explain the following vision screening results to parents:
                
                Child's Information:
                - Name: {child_name}
                - Age: {child_age}
                
                Screening Results:
                - Left Eye Distance: {left_eye_distance}
                - Right Eye Distance: {right_eye_distance}
                - Color Vision: {color_vision}
                - Overall Assessment: {overall_assessment}
                
                Please provide:
                1. Simple explanation of what the results mean
                2. What these results mean for your child's vision
                3. Recommended next steps and timeline
                4. Signs to watch for at home
                5. Questions to ask healthcare providers
                6. How to support your child's vision health
                7. When to seek additional medical attention
                
                Use clear, simple language that parents can easily understand.
                Avoid medical jargon and focus on practical guidance.
                """,
                "variables": [
                    "child_name", "child_age",
                    "left_eye_distance", "right_eye_distance",
                    "color_vision", "overall_assessment"
                ],
                "version": "1.0",
                "is_active": True
            },
            {
                "template_id": "executive_trends",
                "role": "executive",
                "insight_type": "trend_analysis",
                "prompt_template": """
                Analyze the following vision screening program data for strategic insights:
                
                Program Statistics:
                - Total Screenings: {total_screenings}
                - Time Period: {time_period}
                - Population: {population_size}
                
                Screening Results Summary:
                - Normal Vision: {normal_vision_count}
                - Mild Impairment: {mild_impairment_count}
                - Moderate Impairment: {moderate_impairment_count}
                - Severe Impairment: {severe_impairment_count}
                
                Program Metrics: {program_metrics}
                
                Please provide:
                1. Key trends and patterns in the data
                2. Program effectiveness metrics and analysis
                3. Resource allocation recommendations
                4. Strategic opportunities for improvement
                5. Risk management considerations
                6. ROI and impact assessment
                7. Recommendations for program expansion or modification
                
                Focus on high-level insights and strategic implications for decision-making.
                """,
                "variables": [
                    "total_screenings", "time_period", "population_size",
                    "normal_vision_count", "mild_impairment_count",
                    "moderate_impairment_count", "severe_impairment_count",
                    "program_metrics"
                ],
                "version": "1.0",
                "is_active": True
            },
            {
                "template_id": "mobile_unit_screening",
                "role": "medical_staff",
                "insight_type": "mobile_screening",
                "prompt_template": """
                Analyze the following mobile vision screening data:
                
                Patient Information:
                - Name: {patient_name}
                - Age: {patient_age}
                - School: {school_name}
                
                Mobile Screening Results:
                - Left Eye Distance: {left_eye_distance}
                - Right Eye Distance: {right_eye_distance}
                - Glasses Needed: {glasses_needed}
                - Glasses Prescription: {glasses_prescription}
                - Glasses Fitted: {glasses_fitted}
                - Glasses Delivered: {glasses_delivered}
                
                Please provide:
                1. Assessment of vision screening results
                2. Glasses prescription analysis and recommendations
                3. Fitting and delivery status review
                4. Follow-up recommendations
                5. Mobile unit workflow optimization suggestions
                6. Quality assurance recommendations
                
                Focus on mobile unit operations and immediate patient care needs.
                """,
                "variables": [
                    "patient_name", "patient_age", "school_name",
                    "left_eye_distance", "right_eye_distance",
                    "glasses_needed", "glasses_prescription",
                    "glasses_fitted", "glasses_delivered"
                ],
                "version": "1.0",
                "is_active": True
            }
        ]
        
        for template_data in default_templates:
            template = PromptTemplate(
                **template_data,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.templates[template.template_id] = template
    
    def get_template(self, template_id: str) -> Optional[PromptTemplate]:
        """Get a specific prompt template"""
        return self.templates.get(template_id)
    
    def get_templates_by_role(self, role: str) -> List[PromptTemplate]:
        """Get all templates for a specific role"""
        return [
            template for template in self.templates.values()
            if template.role == role and template.is_active
        ]
    
    def get_templates_by_insight_type(self, insight_type: str) -> List[PromptTemplate]:
        """Get all templates for a specific insight type"""
        return [
            template for template in self.templates.values()
            if template.insight_type == insight_type and template.is_active
        ]
    
    def create_template(self, template_data: Dict[str, Any]) -> PromptTemplate:
        """Create a new prompt template"""
        template = PromptTemplate(
            **template_data,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.templates[template.template_id] = template
        return template
    
    def update_template(self, template_id: str, updates: Dict[str, Any]) -> Optional[PromptTemplate]:
        """Update an existing prompt template"""
        if template_id not in self.templates:
            return None
        
        template = self.templates[template_id]
        update_data = template.dict()
        update_data.update(updates)
        update_data["updated_at"] = datetime.utcnow()
        
        updated_template = PromptTemplate(**update_data)
        self.templates[template_id] = updated_template
        return updated_template
    
    def delete_template(self, template_id: str) -> bool:
        """Delete a prompt template"""
        if template_id in self.templates:
            del self.templates[template_id]
            return True
        return False
    
    def render_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Render a prompt template with variables"""
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        try:
            return template.prompt_template.format(**variables)
        except KeyError as e:
            raise ValueError(f"Missing required variable: {e}")
    
    def validate_variables(self, template_id: str, variables: Dict[str, Any]) -> bool:
        """Validate that all required variables are provided"""
        template = self.get_template(template_id)
        if not template:
            return False
        
        required_vars = set(template.variables)
        provided_vars = set(variables.keys())
        
        return required_vars.issubset(provided_vars)
    
    def get_missing_variables(self, template_id: str, variables: Dict[str, Any]) -> List[str]:
        """Get list of missing variables for a template"""
        template = self.get_template(template_id)
        if not template:
            return []
        
        required_vars = set(template.variables)
        provided_vars = set(variables.keys())
        
        return list(required_vars - provided_vars)
    
    def export_templates(self) -> str:
        """Export all templates as JSON"""
        templates_data = []
        for template in self.templates.values():
            template_dict = template.dict()
            template_dict["created_at"] = template_dict["created_at"].isoformat()
            template_dict["updated_at"] = template_dict["updated_at"].isoformat()
            templates_data.append(template_dict)
        
        return json.dumps(templates_data, indent=2)
    
    def import_templates(self, templates_json: str) -> int:
        """Import templates from JSON"""
        try:
            templates_data = json.loads(templates_json)
            imported_count = 0
            
            for template_data in templates_data:
                # Convert ISO strings back to datetime
                template_data["created_at"] = datetime.fromisoformat(template_data["created_at"])
                template_data["updated_at"] = datetime.fromisoformat(template_data["updated_at"])
                
                template = PromptTemplate(**template_data)
                self.templates[template.template_id] = template
                imported_count += 1
            
            return imported_count
        except Exception as e:
            logger.error(f"Error importing templates: {e}")
            raise
    
    def get_template_statistics(self) -> Dict[str, Any]:
        """Get statistics about templates"""
        total_templates = len(self.templates)
        active_templates = len([t for t in self.templates.values() if t.is_active])
        
        role_counts = {}
        insight_type_counts = {}
        
        for template in self.templates.values():
            role_counts[template.role] = role_counts.get(template.role, 0) + 1
            insight_type_counts[template.insight_type] = insight_type_counts.get(template.insight_type, 0) + 1
        
        return {
            "total_templates": total_templates,
            "active_templates": active_templates,
            "role_distribution": role_counts,
            "insight_type_distribution": insight_type_counts
        }
