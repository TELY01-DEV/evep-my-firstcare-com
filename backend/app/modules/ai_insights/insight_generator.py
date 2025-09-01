"""
Insight Generator for EVEP Platform

This module combines LLM service, prompt manager, and vector store to generate AI insights.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .llm_service import LLMService
from .prompt_manager import PromptManager
from .vector_store import VectorStore

logger = logging.getLogger(__name__)

class InsightGenerator:
    """Generates AI insights using LLM, prompts, and vector search"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.prompt_manager = PromptManager()
        self.vector_store = VectorStore()
    
    async def generate_screening_insight(
        self,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None,
        role: str = "doctor",
        insight_type: str = "screening_analysis"
    ) -> Dict[str, Any]:
        """
        Generate insight for a screening result
        
        Args:
            screening_data: Screening results and data
            patient_info: Patient information
            role: User role (doctor, teacher, parent, executive)
            insight_type: Type of insight to generate
            
        Returns:
            Generated insight with metadata
        """
        try:
            # Find similar cases using vector search
            similar_cases = self.vector_store.search_similar_screenings(
                screening_data, n_results=3
            )
            
            # Get appropriate prompt template
            template = self._get_best_template(role, insight_type)
            if not template:
                raise ValueError(f"No template found for role {role} and type {insight_type}")
            
            # Prepare variables for prompt
            variables = self._prepare_variables(screening_data, patient_info, similar_cases)
            
            # Validate variables
            missing_vars = self.prompt_manager.get_missing_variables(template.template_id, variables)
            if missing_vars:
                logger.warning(f"Missing variables for template {template.template_id}: {missing_vars}")
                # Fill missing variables with defaults
                variables = self._fill_missing_variables(variables, missing_vars)
            
            # Render prompt
            prompt = self.prompt_manager.render_template(template.template_id, variables)
            
            # Generate insight using LLM - Use OpenAI as primary (Claude API key has issues)
            # Use GPT-4 for doctors and executives, GPT-3.5-turbo for others
            model = "gpt-4" if role in ["doctor", "executive"] else "gpt-3.5-turbo"
            
            insight_result = await self.llm_service.generate_insight(
                prompt=prompt,
                model=model,
                context={"role": role, "insight_type": insight_type}
            )
            
            # Store insight in vector store
            insight_id = f"insight_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            self._store_insight(insight_id, insight_result, screening_data, role, insight_type)
            
            # Add screening result to vector store for future similarity search
            if patient_info:
                self.vector_store.add_screening_result(
                    screening_id=screening_data.get("screening_id", insight_id),
                    screening_data=screening_data,
                    patient_info=patient_info
                )
            
            return {
                "insight_id": insight_id,
                "role": role,
                "insight_type": insight_type,
                "content": insight_result.get("content", ""),
                "similar_cases": similar_cases,
                "template_used": template.template_id,
                "model_used": insight_result.get("model", ""),
                "usage": insight_result.get("usage", {}),
                "timestamp": datetime.utcnow().isoformat(),
                "success": insight_result.get("success", False)
            }
            
        except Exception as e:
            logger.error(f"Error generating screening insight: {e}")
            return {
                "success": False,
                "error": str(e),
                "role": role,
                "insight_type": insight_type,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _get_best_template(self, role: str, insight_type: str) -> Optional[Any]:
        """Get the best template for the given role and insight type"""
        # First try to find exact match
        templates = self.prompt_manager.get_templates_by_role(role)
        for template in templates:
            if template.insight_type == insight_type:
                return template
        
        # If no exact match, try to find a general template for the role
        for template in templates:
            if template.insight_type == "general":
                return template
        
        # If still no match, try to find any template for the insight type
        templates = self.prompt_manager.get_templates_by_insight_type(insight_type)
        if templates:
            return templates[0]
        
        return None
    
    def _prepare_variables(
        self,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None,
        similar_cases: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Prepare variables for prompt template"""
        variables = {}
        
        # Add patient information
        if patient_info:
            variables.update({
                "patient_name": patient_info.get("name", "Unknown"),
                "patient_age": patient_info.get("age", "Unknown"),
                "patient_gender": patient_info.get("gender", "Unknown"),
                "child_name": patient_info.get("name", "Unknown"),
                "child_age": patient_info.get("age", "Unknown"),
                "student_name": patient_info.get("name", "Unknown"),
                "grade_level": patient_info.get("grade", "Unknown"),
                "school_name": patient_info.get("school", "Unknown")
            })
        
        # Add screening results
        variables.update({
            "left_eye_distance": screening_data.get("left_eye_distance", "Not recorded"),
            "right_eye_distance": screening_data.get("right_eye_distance", "Not recorded"),
            "left_eye_near": screening_data.get("left_eye_near", "Not recorded"),
            "right_eye_near": screening_data.get("right_eye_near", "Not recorded"),
            "color_vision": screening_data.get("color_vision", "Not tested"),
            "depth_perception": screening_data.get("depth_perception", "Not tested"),
            "overall_assessment": screening_data.get("overall_assessment", "Not assessed"),
            "academic_impact": screening_data.get("academic_impact", "Not assessed")
        })
        
        # Add medical history if available
        variables["medical_history"] = screening_data.get("medical_history", "No medical history available")
        
        # Add academic performance if available
        variables["academic_performance"] = screening_data.get("academic_performance", "No academic data available")
        
        # Add similar cases context
        if similar_cases:
            similar_cases_text = self._format_similar_cases(similar_cases)
            variables["similar_cases"] = similar_cases_text
        
        return variables
    
    def _fill_missing_variables(self, variables: Dict[str, Any], missing_vars: List[str]) -> Dict[str, Any]:
        """Fill missing variables with default values"""
        defaults = {
            "patient_name": "Unknown Patient",
            "patient_age": "Unknown",
            "patient_gender": "Unknown",
            "child_name": "Unknown Child",
            "child_age": "Unknown",
            "student_name": "Unknown Student",
            "grade_level": "Unknown",
            "school_name": "Unknown School",
            "medical_history": "No medical history available",
            "academic_performance": "No academic data available",
            "similar_cases": "No similar cases found"
        }
        
        for var in missing_vars:
            if var in defaults:
                variables[var] = defaults[var]
        
        return variables
    
    def _format_similar_cases(self, similar_cases: List[Dict[str, Any]]) -> str:
        """Format similar cases for prompt context"""
        if not similar_cases:
            return "No similar cases found"
        
        formatted_cases = []
        for i, case in enumerate(similar_cases[:3], 1):  # Limit to top 3
            case_text = f"Case {i}: {case.get('text', 'No description available')}"
            if case.get('metadata'):
                metadata = case['metadata']
                case_text += f" (Assessment: {metadata.get('assessment', 'Unknown')})"
            formatted_cases.append(case_text)
        
        return "\n".join(formatted_cases)
    
    def _store_insight(
        self,
        insight_id: str,
        insight_result: Dict[str, Any],
        screening_data: Dict[str, Any],
        role: str,
        insight_type: str
    ):
        """Store generated insight in vector store"""
        try:
            # Create text representation of insight
            insight_text = insight_result.get("content", "")
            
            # Prepare metadata
            metadata = {
                "insight_id": insight_id,
                "role": role,
                "insight_type": insight_type,
                "screening_id": screening_data.get("screening_id"),
                "model_used": insight_result.get("model", ""),
                "success": insight_result.get("success", False)
            }
            
            # Add to vector store
            self.vector_store.add_document(
                collection_name="ai_insights",
                document_id=insight_id,
                text=insight_text,
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error storing insight in vector store: {e}")
    
    async def generate_batch_insights(
        self,
        screening_data_list: List[Dict[str, Any]],
        role: str = "doctor",
        insight_type: str = "screening_analysis"
    ) -> List[Dict[str, Any]]:
        """Generate insights for multiple screening results"""
        insights = []
        
        for screening_data in screening_data_list:
            insight = await self.generate_screening_insight(
                screening_data=screening_data,
                role=role,
                insight_type=insight_type
            )
            insights.append(insight)
        
        return insights
    
    async def generate_trend_analysis(
        self,
        program_data: Dict[str, Any],
        role: str = "executive"
    ) -> Dict[str, Any]:
        """Generate trend analysis for program data"""
        try:
            # Get trend analysis template
            template = self.prompt_manager.get_template("executive_trends")
            if not template:
                raise ValueError("Executive trends template not found")
            
            # Prepare variables
            variables = {
                "total_screenings": program_data.get("total_screenings", 0),
                "time_period": program_data.get("time_period", "Unknown"),
                "population_size": program_data.get("population_size", 0),
                "normal_vision_count": program_data.get("normal_vision_count", 0),
                "mild_impairment_count": program_data.get("mild_impairment_count", 0),
                "moderate_impairment_count": program_data.get("moderate_impairment_count", 0),
                "severe_impairment_count": program_data.get("severe_impairment_count", 0),
                "program_metrics": str(program_data.get("program_metrics", {}))
            }
            
            # Render prompt
            prompt = self.prompt_manager.render_template(template.template_id, variables)
            
            # Generate insight
            insight_result = await self.llm_service.generate_insight(
                prompt=prompt,
                model="gpt-4",
                context={"role": role, "insight_type": "trend_analysis"}
            )
            
            return {
                "insight_id": f"trend_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "role": role,
                "insight_type": "trend_analysis",
                "content": insight_result.get("content", ""),
                "program_data": program_data,
                "template_used": template.template_id,
                "model_used": insight_result.get("model", ""),
                "usage": insight_result.get("usage", {}),
                "timestamp": datetime.utcnow().isoformat(),
                "success": insight_result.get("success", False)
            }
            
        except Exception as e:
            logger.error(f"Error generating trend analysis: {e}")
            return {
                "success": False,
                "error": str(e),
                "role": role,
                "insight_type": "trend_analysis",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def search_insights(
        self,
        query: str,
        role: Optional[str] = None,
        insight_type: Optional[str] = None,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for existing insights"""
        try:
            # Prepare metadata filter
            metadata_filter = {}
            if role:
                metadata_filter["role"] = role
            if insight_type:
                metadata_filter["insight_type"] = insight_type
            
            # Search in vector store
            results = self.vector_store.search_similar(
                collection_name="ai_insights",
                query=query,
                n_results=n_results,
                filter_metadata=metadata_filter if metadata_filter else None
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching insights: {e}")
            return []
    
    def get_insight_statistics(self) -> Dict[str, Any]:
        """Get statistics about generated insights"""
        try:
            # Get vector store statistics
            vector_stats = self.vector_store.get_collection_stats("ai_insights")
            
            # Get prompt template statistics
            prompt_stats = self.prompt_manager.get_template_statistics()
            
            return {
                "vector_store_stats": vector_stats,
                "prompt_template_stats": prompt_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting insight statistics: {e}")
            return {}
    
    async def generate_mobile_unit_insight(
        self,
        mobile_screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insight specifically for mobile unit screenings"""
        try:
            # Use mobile unit specific template
            template = self.prompt_manager.get_template("mobile_unit_screening")
            if not template:
                # Fallback to general screening analysis
                return await self.generate_screening_insight(
                    screening_data=mobile_screening_data,
                    patient_info=patient_info,
                    role="medical_staff",
                    insight_type="mobile_screening"
                )
            
            # Prepare variables for mobile screening
            variables = {
                "patient_name": patient_info.get("name", "Unknown") if patient_info else "Unknown",
                "patient_age": patient_info.get("age", "Unknown") if patient_info else "Unknown",
                "school_name": patient_info.get("school", "Unknown") if patient_info else "Unknown",
                "left_eye_distance": mobile_screening_data.get("left_eye_distance", "Not recorded"),
                "right_eye_distance": mobile_screening_data.get("right_eye_distance", "Not recorded"),
                "glasses_needed": mobile_screening_data.get("glasses_needed", False),
                "glasses_prescription": str(mobile_screening_data.get("glasses_prescription", "None")),
                "glasses_fitted": mobile_screening_data.get("glasses_fitted", False),
                "glasses_delivered": mobile_screening_data.get("glasses_delivered", False)
            }
            
            # Render prompt
            prompt = self.prompt_manager.render_template(template.template_id, variables)
            
            # Generate insight
            insight_result = await self.llm_service.generate_insight(
                prompt=prompt,
                model="gpt-4",
                context={"role": "medical_staff", "insight_type": "mobile_screening"}
            )
            
            return {
                "insight_id": f"mobile_insight_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "role": "medical_staff",
                "insight_type": "mobile_screening",
                "content": insight_result.get("content", ""),
                "mobile_screening_data": mobile_screening_data,
                "template_used": template.template_id,
                "model_used": insight_result.get("model", ""),
                "usage": insight_result.get("usage", {}),
                "timestamp": datetime.utcnow().isoformat(),
                "success": insight_result.get("success", False)
            }
            
        except Exception as e:
            logger.error(f"Error generating mobile unit insight: {e}")
            return {
                "success": False,
                "error": str(e),
                "role": "medical_staff",
                "insight_type": "mobile_screening",
                "timestamp": datetime.utcnow().isoformat()
            }
