"""
Prompt Service for EVEP Platform
Handles AI prompt template management
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.core.database import get_database
from app.core.config import Config

class PromptService:
    """Prompt Service for AI prompt template management"""
    
    def __init__(self):
        self.config = Config.get_module_config("ai_ml")
        self.db = None
        self.default_prompts = {
            "doctor": {
                "screening_analysis": {
                    "template": "Analyze the following vision screening results for patient {patient_name} (Age: {age}, Gender: {gender}). Screening type: {screening_type}. Results: {results}. Provide detailed analysis including potential issues, risk assessment, and recommendations.",
                    "variables": ["patient_name", "age", "gender", "screening_type", "results"]
                },
                "treatment_recommendation": {
                    "template": "Based on the screening results for {patient_name}, provide treatment recommendations including follow-up schedule, interventions, and monitoring requirements.",
                    "variables": ["patient_name"]
                },
                "risk_assessment": {
                    "template": "Assess the clinical risk for patient {patient_name} based on their screening history and current results. Consider factors like age, medical history, and screening trends.",
                    "variables": ["patient_name"]
                }
            },
            "teacher": {
                "academic_impact": {
                    "template": "Analyze the potential academic impact of vision issues for student {student_name}. Consider reading, writing, and classroom participation implications.",
                    "variables": ["student_name"]
                },
                "classroom_accommodation": {
                    "template": "Suggest classroom accommodations for student {student_name} based on their vision screening results. Include seating, lighting, and material adjustments.",
                    "variables": ["student_name"]
                }
            },
            "parent": {
                "progress_tracking": {
                    "template": "Provide progress tracking insights for {child_name}'s vision development. Include trends, improvements, and areas of concern.",
                    "variables": ["child_name"]
                },
                "educational_guidance": {
                    "template": "Offer educational guidance for {child_name}'s vision health. Include home activities, monitoring tips, and when to seek professional help.",
                    "variables": ["child_name"]
                }
            },
            "admin": {
                "system_performance": {
                    "template": "Analyze the overall system performance of the EVEP platform. Include metrics, trends, and recommendations for optimization.",
                    "variables": []
                },
                "population_health": {
                    "template": "Analyze population health trends from vision screening data. Include detection rates, common issues, and intervention effectiveness.",
                    "variables": []
                }
            }
        }
    
    async def initialize(self) -> None:
        """Initialize the prompt service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize default prompts
        await self._initialize_default_prompts()
        
        print("✅ Prompt Service initialized")
    
    async def _initialize_default_prompts(self) -> None:
        """Initialize default prompt templates"""
        try:
            for role, prompts in self.default_prompts.items():
                for prompt_type, prompt_data in prompts.items():
                    # Check if prompt already exists
                    existing = await self.db.prompt_templates.find_one({
                        "role": role,
                        "type": prompt_type
                    })
                    
                    if not existing:
                        # Create default prompt
                        prompt_doc = {
                            "template_id": f"{role}_{prompt_type}",
                            "role": role,
                            "type": prompt_type,
                            "template": prompt_data["template"],
                            "variables": prompt_data["variables"],
                            "version": "1.0.0",
                            "is_active": True,
                            "is_default": True,
                            "created_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                        
                        await self.db.prompt_templates.insert_one(prompt_doc)
            
            print("✅ Default prompt templates initialized")
            
        except Exception as e:
            print(f"Error initializing default prompts: {e}")
    
    async def get_prompts(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available prompt templates"""
        try:
            filter_query = {"is_active": True}
            if role:
                filter_query["role"] = role
            
            prompts = await self.db.prompt_templates.find(filter_query).to_list(None)
            
            return [
                {
                    "template_id": prompt["template_id"],
                    "role": prompt["role"],
                    "type": prompt["type"],
                    "template": prompt["template"],
                    "variables": prompt["variables"],
                    "version": prompt["version"],
                    "is_default": prompt.get("is_default", False),
                    "created_at": prompt["created_at"],
                    "updated_at": prompt["updated_at"]
                }
                for prompt in prompts
            ]
            
        except Exception as e:
            print(f"Error getting prompts: {e}")
            return []
    
    async def create_prompt(self, prompt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new prompt template"""
        try:
            # Validate required fields
            required_fields = ["template_id", "role", "type", "template"]
            for field in required_fields:
                if field not in prompt_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Check if template_id already exists
            existing = await self.db.prompt_templates.find_one({
                "template_id": prompt_data["template_id"]
            })
            
            if existing:
                raise ValueError(f"Prompt template with ID {prompt_data['template_id']} already exists")
            
            # Create prompt document
            prompt_doc = {
                "template_id": prompt_data["template_id"],
                "role": prompt_data["role"],
                "type": prompt_data["type"],
                "template": prompt_data["template"],
                "variables": prompt_data.get("variables", []),
                "version": prompt_data.get("version", "1.0.0"),
                "is_active": prompt_data.get("is_active", True),
                "is_default": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert into database
            result = await self.db.prompt_templates.insert_one(prompt_doc)
            
            return {
                "id": str(result.inserted_id),
                **prompt_doc
            }
            
        except Exception as e:
            print(f"Error creating prompt: {e}")
            raise
    
    async def update_prompt(self, template_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing prompt template"""
        try:
            # Check if prompt exists
            existing = await self.db.prompt_templates.find_one({"template_id": template_id})
            if not existing:
                raise ValueError(f"Prompt template {template_id} not found")
            
            # Prepare update data
            update_data = {
                **updates,
                "updated_at": datetime.utcnow()
            }
            
            # Update in database
            await self.db.prompt_templates.update_one(
                {"template_id": template_id},
                {"$set": update_data}
            )
            
            # Get updated prompt
            updated = await self.db.prompt_templates.find_one({"template_id": template_id})
            
            return {
                "template_id": updated["template_id"],
                "role": updated["role"],
                "type": updated["type"],
                "template": updated["template"],
                "variables": updated["variables"],
                "version": updated["version"],
                "is_active": updated["is_active"],
                "is_default": updated.get("is_default", False),
                "created_at": updated["created_at"],
                "updated_at": updated["updated_at"]
            }
            
        except Exception as e:
            print(f"Error updating prompt: {e}")
            raise
    
    async def delete_prompt(self, template_id: str) -> bool:
        """Delete prompt template"""
        try:
            # Check if prompt exists
            existing = await self.db.prompt_templates.find_one({"template_id": template_id})
            if not existing:
                raise ValueError(f"Prompt template {template_id} not found")
            
            # Don't allow deletion of default prompts
            if existing.get("is_default", False):
                raise ValueError("Cannot delete default prompt templates")
            
            # Delete from database
            result = await self.db.prompt_templates.delete_one({"template_id": template_id})
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting prompt: {e}")
            return False
    
    async def get_prompt(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get specific prompt template"""
        try:
            prompt = await self.db.prompt_templates.find_one({"template_id": template_id})
            
            if not prompt:
                return None
            
            return {
                "template_id": prompt["template_id"],
                "role": prompt["role"],
                "type": prompt["type"],
                "template": prompt["template"],
                "variables": prompt["variables"],
                "version": prompt["version"],
                "is_active": prompt["is_active"],
                "is_default": prompt.get("is_default", False),
                "created_at": prompt["created_at"],
                "updated_at": prompt["updated_at"]
            }
            
        except Exception as e:
            print(f"Error getting prompt: {e}")
            return None
    
    async def format_prompt(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Format prompt template with variables"""
        try:
            # Get prompt template
            prompt = await self.get_prompt(template_id)
            if not prompt:
                raise ValueError(f"Prompt template {template_id} not found")
            
            # Format template with variables
            formatted_prompt = prompt["template"]
            for var_name, var_value in variables.items():
                placeholder = f"{{{var_name}}}"
                formatted_prompt = formatted_prompt.replace(placeholder, str(var_value))
            
            return formatted_prompt
            
        except Exception as e:
            print(f"Error formatting prompt: {e}")
            return f"Error formatting prompt: {str(e)}"
    
    async def get_prompts_by_role(self, role: str) -> List[Dict[str, Any]]:
        """Get all prompts for a specific role"""
        return await self.get_prompts(role)
    
    async def get_prompts_by_type(self, prompt_type: str) -> List[Dict[str, Any]]:
        """Get all prompts of a specific type"""
        try:
            prompts = await self.db.prompt_templates.find({
                "type": prompt_type,
                "is_active": True
            }).to_list(None)
            
            return [
                {
                    "template_id": prompt["template_id"],
                    "role": prompt["role"],
                    "type": prompt["type"],
                    "template": prompt["template"],
                    "variables": prompt["variables"],
                    "version": prompt["version"],
                    "is_default": prompt.get("is_default", False)
                }
                for prompt in prompts
            ]
            
        except Exception as e:
            print(f"Error getting prompts by type: {e}")
            return []
