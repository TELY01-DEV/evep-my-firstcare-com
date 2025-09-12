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
    language: str = "en"  # Default to English
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
                "language": "en",
                "is_active": True
            }
        ]
        
        # Add Thai language templates
        thai_templates = [
            {
                "template_id": "doctor_screening_analysis_th",
                "role": "doctor",
                "insight_type": "screening_analysis",
                "prompt_template": """
                วิเคราะห์ข้อมูลการตรวจสายตาต่อไปนี้เพื่อการประเมินทางคลินิก:
                
                ข้อมูลผู้ป่วย:
                - ชื่อ: {patient_name}
                - อายุ: {patient_age}
                - เพศ: {patient_gender}
                
                ผลการตรวจ:
                - ตาซ้ายระยะไกล: {left_eye_distance}
                - ตาขวาระยะไกล: {right_eye_distance}
                - ตาซ้ายระยะใกล้: {left_eye_near}
                - ตาขวาระยะใกล้: {right_eye_near}
                - การมองเห็นสี: {color_vision}
                - การรับรู้ความลึก: {depth_perception}
                
                ประวัติทางการแพทย์: {medical_history}
                
                กรุณาให้ข้อมูล:
                1. การตีความทางคลินิกของผลการตรวจ
                2. การวินิจฉัยหรือภาวะที่อาจเป็นไปได้
                3. การติดตามที่แนะนำและระยะเวลา
                4. ปัจจัยเสี่ยงและสัญญาณเตือนที่ต้องเฝ้าระวัง
                5. คำแนะนำการรักษาหากจำเป็น
                6. คำแนะนำการส่งต่อหากจำเป็น
                
                มุ่งเน้นความถูกต้องทางการแพทย์ ความเกี่ยวข้องทางคลินิก และคำแนะนำที่อิงตามหลักฐาน
                """,
                "variables": [
                    "patient_name", "patient_age", "patient_gender",
                    "left_eye_distance", "right_eye_distance",
                    "left_eye_near", "right_eye_near",
                    "color_vision", "depth_perception", "medical_history"
                ],
                "version": "1.0",
                "language": "th",
                "is_active": True
            },
            {
                "template_id": "teacher_academic_impact_th",
                "role": "teacher",
                "insight_type": "academic_impact",
                "prompt_template": """
                วิเคราะห์ข้อมูลการตรวจสายตาต่อไปนี้เพื่อผลกระทบทางการศึกษา:
                
                ข้อมูลนักเรียน:
                - ชื่อ: {student_name}
                - ชั้น: {grade_level}
                - โรงเรียน: {school_name}
                
                ผลการตรวจ:
                - ตาซ้ายระยะไกล: {left_eye_distance}
                - ตาขวาระยะไกล: {right_eye_distance}
                - การมองเห็นสี: {color_vision}
                - การรับรู้ความลึก: {depth_perception}
                
                ผลการเรียน: {academic_performance}
                
                กรุณาให้ข้อมูล:
                1. ผลกระทบต่อการเรียนรู้และผลการเรียน
                2. วิชาที่อาจได้รับผลกระทบ
                3. การปรับปรุงห้องเรียนที่แนะนำ
                4. สัญญาณที่ต้องสังเกตในห้องเรียน
                5. คำแนะนำการสื่อสารกับผู้ปกครอง
                6. กลยุทธ์การสนับสนุนทางการศึกษา
                7. คำแนะนำเรื่องที่นั่งและการส่องสว่าง
                
                มุ่งเน้นการประยุกต์ใช้ในห้องเรียนและความสำเร็จของนักเรียน
                """,
                "variables": [
                    "student_name", "grade_level", "school_name",
                    "left_eye_distance", "right_eye_distance",
                    "color_vision", "depth_perception", "academic_performance"
                ],
                "version": "1.0",
                "language": "th",
                "is_active": True
            },
            {
                "template_id": "parent_guidance_th",
                "role": "parent",
                "insight_type": "parent_guidance",
                "prompt_template": """
                อธิบายผลการตรวจสายตาต่อไปนี้ให้ผู้ปกครอง:
                
                ข้อมูลบุตรหลาน:
                - ชื่อ: {child_name}
                - อายุ: {child_age}
                
                ผลการตรวจ:
                - ตาซ้ายระยะไกล: {left_eye_distance}
                - ตาขวาระยะไกล: {right_eye_distance}
                - การมองเห็นสี: {color_vision}
                - การประเมินโดยรวม: {overall_assessment}
                
                กรุณาให้ข้อมูล:
                1. คำอธิบายง่ายๆ ว่าผลลัพธ์หมายถึงอะไร
                2. ผลลัพธ์เหล่านี้หมายถึงอะไรสำหรับสายตาของบุตรหลาน
                3. ขั้นตอนต่อไปที่แนะนำและระยะเวลา
                4. สัญญาณที่ต้องสังเกตที่บ้าน
                5. คำถามที่ควรถามผู้ให้บริการด้านสุขภาพ
                6. วิธีสนับสนุนสุขภาพสายตาของบุตรหลาน
                7. เมื่อไหร่ที่ควรขอความช่วยเหลือทางการแพทย์เพิ่มเติม
                
                ใช้ภาษาที่ชัดเจน ง่ายต่อการเข้าใจสำหรับผู้ปกครอง
                หลีกเลี่ยงศัพท์ทางการแพทย์และมุ่งเน้นคำแนะนำที่ปฏิบัติได้
                """,
                "variables": [
                    "child_name", "child_age",
                    "left_eye_distance", "right_eye_distance",
                    "color_vision", "overall_assessment"
                ],
                "version": "1.0",
                "language": "th",
                "is_active": True
            },
            {
                "template_id": "executive_trends_th",
                "role": "executive",
                "insight_type": "trend_analysis",
                "prompt_template": """
                วิเคราะห์ข้อมูลโปรแกรมการตรวจสายตาต่อไปนี้เพื่อข้อมูลเชิงกลยุทธ์:
                
                สถิติโปรแกรม:
                - การตรวจทั้งหมด: {total_screenings}
                - ระยะเวลา: {time_period}
                - ประชากร: {population_size}
                
                สรุปผลการตรวจ:
                - สายตาปกติ: {normal_vision_count}
                - สายตาผิดปกติเล็กน้อย: {mild_impairment_count}
                - สายตาผิดปกติปานกลาง: {moderate_impairment_count}
                - สายตาผิดปกติรุนแรง: {severe_impairment_count}
                
                ตัวชี้วัดโปรแกรม: {program_metrics}
                
                กรุณาให้ข้อมูล:
                1. แนวโน้มและรูปแบบหลักในข้อมูล
                2. ตัวชี้วัดและวิเคราะห์ประสิทธิภาพโปรแกรม
                3. คำแนะนำการจัดสรรทรัพยากร
                4. โอกาสเชิงกลยุทธ์สำหรับการปรับปรุง
                5. การพิจารณาการจัดการความเสี่ยง
                6. การประเมินผลตอบแทนการลงทุนและผลกระทบ
                7. คำแนะนำสำหรับการขยายหรือปรับเปลี่ยนโปรแกรม
                
                มุ่งเน้นข้อมูลเชิงลึกระดับสูงและความหมายเชิงกลยุทธ์สำหรับการตัดสินใจ
                """,
                "variables": [
                    "total_screenings", "time_period", "population_size",
                    "normal_vision_count", "mild_impairment_count",
                    "moderate_impairment_count", "severe_impairment_count",
                    "program_metrics"
                ],
                "version": "1.0",
                "language": "th",
                "is_active": True
            },
            {
                "template_id": "mobile_unit_screening_th",
                "role": "medical_staff",
                "insight_type": "mobile_screening",
                "prompt_template": """
                วิเคราะห์ข้อมูลการตรวจสายตาหน่วยเคลื่อนที่ต่อไปนี้:
                
                ข้อมูลผู้ป่วย:
                - ชื่อ: {patient_name}
                - อายุ: {patient_age}
                - โรงเรียน: {school_name}
                
                ผลการตรวจหน่วยเคลื่อนที่:
                - ตาซ้ายระยะไกล: {left_eye_distance}
                - ตาขวาระยะไกล: {right_eye_distance}
                - ต้องการแว่นตา: {glasses_needed}
                - สูตรแว่นตา: {glasses_prescription}
                - แว่นตาติดตั้งแล้ว: {glasses_fitted}
                - แว่นตาส่งมอบแล้ว: {glasses_delivered}
                
                กรุณาให้ข้อมูล:
                1. การประเมินผลการตรวจสายตา
                2. การวิเคราะห์และคำแนะนำสูตรแว่นตา
                3. การตรวจสอบสถานะการติดตั้งและการส่งมอบ
                4. คำแนะนำการติดตาม
                5. คำแนะนำการปรับปรุงกระบวนการหน่วยเคลื่อนที่
                6. คำแนะนำการประกันคุณภาพ
                
                มุ่งเน้นการดำเนินงานหน่วยเคลื่อนที่และความต้องการการดูแลผู้ป่วยทันที
                """,
                "variables": [
                    "patient_name", "patient_age", "school_name",
                    "left_eye_distance", "right_eye_distance",
                    "glasses_needed", "glasses_prescription",
                    "glasses_fitted", "glasses_delivered"
                ],
                "version": "1.0",
                "language": "th",
                "is_active": True
            }
        ]
        
        # Combine English and Thai templates
        all_templates = default_templates + thai_templates
        
        for template_data in all_templates:
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
    
    def get_templates_by_language(self, language: str) -> List[PromptTemplate]:
        """Get all templates for a specific language"""
        return [
            template for template in self.templates.values()
            if template.language == language and template.is_active
        ]
    
    def get_template_by_role_type_language(self, role: str, insight_type: str, language: str = "en") -> Optional[PromptTemplate]:
        """Get template by role, insight type, and language"""
        for template in self.templates.values():
            if (template.role == role and 
                template.insight_type == insight_type and 
                template.language == language and 
                template.is_active):
                return template
        return None
    
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
