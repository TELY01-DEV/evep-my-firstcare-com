"""
LLM Service for EVEP Platform

This service provides integration with OpenAI GPT-4 and Claude for AI-powered insights.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
import anthropic
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with Large Language Models (OpenAI GPT-4 and Claude)"""
    
    def __init__(self):
        self.openai_client = None
        self.claude_client = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize OpenAI and Claude clients"""
        try:
            # Initialize OpenAI client
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                self.openai_client = AsyncOpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OpenAI API key not found")
            
            # Initialize Claude client
            claude_api_key = os.getenv("ANTHROPIC_API_KEY")
            if claude_api_key:
                self.claude_client = anthropic.AsyncAnthropic(api_key=claude_api_key)
                logger.info("Claude client initialized successfully")
            else:
                logger.warning("Claude API key not found")
                
        except Exception as e:
            logger.error(f"Error initializing LLM clients: {e}")
    
    async def generate_insight(
        self,
        prompt: str,
        model: str = "gpt-4",
        max_tokens: int = 1000,
        temperature: float = 0.7,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI insight using specified model
        
        Args:
            prompt: The prompt to send to the LLM
            model: Model to use ('gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet')
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0 to 1.0)
            context: Additional context data
            
        Returns:
            Dictionary containing the generated insight
        """
        try:
            if model.startswith("gpt") and self.openai_client:
                return await self._generate_openai_insight(
                    prompt, model, max_tokens, temperature, context
                )
            elif model.startswith("claude") and self.claude_client:
                return await self._generate_claude_insight(
                    prompt, model, max_tokens, temperature, context
                )
            else:
                raise ValueError(f"Model {model} not supported or client not available")
                
        except Exception as e:
            logger.error(f"Error generating insight with {model}: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": model,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _generate_openai_insight(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insight using OpenAI models"""
        try:
            # Prepare messages
            messages = [
                {"role": "system", "content": self._get_system_prompt(context)},
                {"role": "user", "content": prompt}
            ]
            
            # Make API call
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return {
                "success": True,
                "content": response.choices[0].message.content,
                "model": model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _generate_claude_insight(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insight using Claude models"""
        try:
            # Prepare system prompt
            system_prompt = self._get_system_prompt(context)
            
            # Make API call
            response = await self.claude_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "success": True,
                "content": response.content[0].text,
                "model": model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise
    
    def _get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get system prompt based on context"""
        base_prompt = """You are an AI assistant specialized in pediatric vision screening and eye health analysis. 
        You provide insights, recommendations, and analysis for the EVEP (EYE Vision Evaluation Platform).
        
        Your role is to:
        1. Analyze vision screening data and results
        2. Provide evidence-based recommendations
        3. Identify potential vision problems and risk factors
        4. Suggest appropriate follow-up actions
        5. Explain findings in clear, understandable terms
        
        Always prioritize accuracy, safety, and the well-being of children."""
        
        if context and context.get("role"):
            role = context["role"]
            if role == "doctor":
                base_prompt += "\n\nYou are providing insights for medical professionals. Use appropriate medical terminology and provide detailed clinical analysis."
            elif role == "teacher":
                base_prompt += "\n\nYou are providing insights for teachers. Focus on academic impact and classroom accommodations."
            elif role == "parent":
                base_prompt += "\n\nYou are providing insights for parents. Use simple, clear language and focus on practical next steps."
            elif role == "executive":
                base_prompt += "\n\nYou are providing insights for executives. Focus on trends, statistics, and strategic recommendations."
        
        return base_prompt
    
    async def generate_role_based_insight(
        self,
        data: Dict[str, Any],
        role: str,
        insight_type: str
    ) -> Dict[str, Any]:
        """
        Generate role-based insights for different user types
        
        Args:
            data: Screening data and context
            role: User role (doctor, teacher, parent, executive)
            insight_type: Type of insight to generate
            
        Returns:
            Generated insight tailored to the role
        """
        try:
            # Prepare context
            context = {"role": role, "insight_type": insight_type}
            
            # Generate appropriate prompt based on role and insight type
            prompt = self._create_role_based_prompt(data, role, insight_type)
            
            # Choose appropriate model based on role
            model = "gpt-4" if role in ["doctor", "executive"] else "gpt-3.5-turbo"
            
            # Generate insight
            result = await self.generate_insight(
                prompt=prompt,
                model=model,
                context=context
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating role-based insight: {e}")
            return {
                "success": False,
                "error": str(e),
                "role": role,
                "insight_type": insight_type,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _create_role_based_prompt(
        self,
        data: Dict[str, Any],
        role: str,
        insight_type: str
    ) -> str:
        """Create role-specific prompts"""
        
        if role == "doctor":
            return self._create_doctor_prompt(data, insight_type)
        elif role == "teacher":
            return self._create_teacher_prompt(data, insight_type)
        elif role == "parent":
            return self._create_parent_prompt(data, insight_type)
        elif role == "executive":
            return self._create_executive_prompt(data, insight_type)
        else:
            return self._create_general_prompt(data, insight_type)
    
    def _create_doctor_prompt(self, data: Dict[str, Any], insight_type: str) -> str:
        """Create prompt for medical professionals"""
        return f"""
        Analyze the following vision screening data for clinical insights:
        
        Patient Data: {data.get('patient_info', {})}
        Screening Results: {data.get('screening_results', {})}
        Medical History: {data.get('medical_history', {})}
        
        Please provide:
        1. Clinical assessment of the screening results
        2. Potential diagnoses or conditions to consider
        3. Recommended follow-up actions
        4. Risk factors and red flags
        5. Treatment recommendations if applicable
        
        Focus on medical accuracy and clinical relevance.
        """
    
    def _create_teacher_prompt(self, data: Dict[str, Any], insight_type: str) -> str:
        """Create prompt for teachers"""
        return f"""
        Analyze the following vision screening data for educational impact:
        
        Student Data: {data.get('student_info', {})}
        Screening Results: {data.get('screening_results', {})}
        Academic Performance: {data.get('academic_data', {})}
        
        Please provide:
        1. Impact on learning and academic performance
        2. Recommended classroom accommodations
        3. Signs to watch for in the classroom
        4. Communication recommendations for parents
        5. Educational support strategies
        
        Focus on practical classroom applications and student success.
        """
    
    def _create_parent_prompt(self, data: Dict[str, Any], insight_type: str) -> str:
        """Create prompt for parents"""
        return f"""
        Analyze the following vision screening data for parent guidance:
        
        Child's Data: {data.get('child_info', {})}
        Screening Results: {data.get('screening_results', {})}
        
        Please provide:
        1. Simple explanation of the results
        2. What the results mean for your child
        3. Recommended next steps
        4. Signs to watch for at home
        5. Questions to ask healthcare providers
        
        Use clear, simple language that parents can understand.
        """
    
    def _create_executive_prompt(self, data: Dict[str, Any], insight_type: str) -> str:
        """Create prompt for executives"""
        return f"""
        Analyze the following vision screening data for strategic insights:
        
        Program Data: {data.get('program_data', {})}
        Screening Statistics: {data.get('screening_stats', {})}
        Population Data: {data.get('population_data', {})}
        
        Please provide:
        1. Key trends and patterns
        2. Program effectiveness metrics
        3. Resource allocation recommendations
        4. Strategic opportunities
        5. Risk management considerations
        
        Focus on high-level insights and strategic implications.
        """
    
    def _create_general_prompt(self, data: Dict[str, Any], insight_type: str) -> str:
        """Create general prompt for other roles"""
        return f"""
        Analyze the following vision screening data:
        
        Data: {data}
        
        Please provide:
        1. Summary of key findings
        2. Important observations
        3. Recommended actions
        4. Additional considerations
        
        Provide clear, actionable insights.
        """
    
    async def batch_generate_insights(
        self,
        data_list: List[Dict[str, Any]],
        role: str,
        insight_type: str
    ) -> List[Dict[str, Any]]:
        """Generate insights for multiple data points"""
        tasks = []
        for data in data_list:
            task = self.generate_role_based_insight(data, role, insight_type)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
