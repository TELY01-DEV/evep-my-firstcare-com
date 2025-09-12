"""
AI Service for EVEP Platform
Handles LLM integration, conversation management, and AI analysis
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import openai
from openai import AsyncOpenAI

from app.core.database import get_database
from app.core.config import Config

class AIService:
    """AI Service for LLM integration and analysis"""
    
    def __init__(self):
        self.config = Config.get_module_config("ai_ml")
        self.db = None
        self.client = None
        self.conversations = {}
        self.performance_metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "average_response_time": 0,
            "total_tokens_used": 0,
            "last_updated": datetime.utcnow()
        }
    
    async def initialize(self) -> None:
        """Initialize the AI service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self.client = AsyncOpenAI(api_key=api_key)
        else:
            print("⚠️  OpenAI API key not found. AI features will be limited.")
            self.client = None
        
        # Load existing conversations
        await self._load_conversations()
        
        print("✅ AI Service initialized")
    
    async def analyze_screening_results(self, screening_id: str) -> Dict[str, Any]:
        """Analyze screening results using AI"""
        try:
            # Get screening data
            screening = await self.db.screenings.find_one({"_id": screening_id})
            if not screening:
                raise ValueError(f"Screening {screening_id} not found")
            
            # Get patient data
            patient = await self.db.patients.find_one({"_id": screening["patient_id"]})
            
            # Prepare analysis prompt
            prompt = self._create_screening_analysis_prompt(screening, patient)
            
            # Get AI analysis
            analysis = await self._get_ai_response(prompt)
            
            # Store analysis results
            analysis_result = {
                "screening_id": screening_id,
                "analysis": analysis,
                "generated_at": datetime.utcnow(),
                "model_used": self.config.get("config", {}).get("model_name", "gpt-4")
            }
            
            await self.db.ai_insights.insert_one(analysis_result)
            
            return analysis_result
            
        except Exception as e:
            print(f"Error analyzing screening results: {e}")
            return {"error": str(e)}
    
    async def predict_risk(self, patient_id: str, screening_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict risk assessment for patient"""
        try:
            # Get patient data
            patient = await self.db.patients.find_one({"_id": patient_id})
            if not patient:
                raise ValueError(f"Patient {patient_id} not found")
            
            # Get patient's screening history
            screenings = await self.db.screenings.find(
                {"patient_id": patient_id}
            ).sort("created_at", -1).limit(5).to_list(5)
            
            # Prepare risk assessment prompt
            prompt = self._create_risk_assessment_prompt(patient, screenings, screening_data)
            
            # Get AI risk assessment
            risk_assessment = await self._get_ai_response(prompt)
            
            return {
                "patient_id": patient_id,
                "risk_assessment": risk_assessment,
                "generated_at": datetime.utcnow(),
                "confidence_score": 0.85  # Placeholder
            }
            
        except Exception as e:
            print(f"Error predicting risk: {e}")
            return {"error": str(e)}
    
    async def start_conversation(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Start AI conversation"""
        try:
            conversation_id = f"conv_{user_id}_{datetime.utcnow().timestamp()}"
            
            # Create conversation
            conversation = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "context": context,
                "messages": [],
                "started_at": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "status": "active"
            }
            
            # Store in database
            await self.db.conversations.insert_one(conversation)
            
            # Store in memory
            self.conversations[conversation_id] = conversation
            
            return conversation
            
        except Exception as e:
            print(f"Error starting conversation: {e}")
            return {"error": str(e)}
    
    async def send_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Send message to AI conversation"""
        try:
            # Get conversation
            conversation = await self.db.conversations.find_one({"conversation_id": conversation_id})
            if not conversation:
                raise ValueError(f"Conversation {conversation_id} not found")
            
            # Add user message
            user_message = {
                "role": "user",
                "content": message,
                "timestamp": datetime.utcnow()
            }
            
            conversation["messages"].append(user_message)
            
            # Prepare conversation context
            messages = [{"role": "system", "content": "You are an AI assistant for the EVEP vision screening platform. Provide helpful, accurate, and professional responses."}]
            
            # Add conversation history
            for msg in conversation["messages"][-10:]:  # Last 10 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Get AI response
            ai_response = await self._get_ai_response(messages)
            
            # Add AI response
            ai_message = {
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.utcnow()
            }
            
            conversation["messages"].append(ai_message)
            conversation["last_activity"] = datetime.utcnow()
            
            # Update database
            await self.db.conversations.update_one(
                {"conversation_id": conversation_id},
                {"$set": conversation}
            )
            
            return {
                "conversation_id": conversation_id,
                "response": ai_response,
                "timestamp": datetime.utcnow()
            }
            
        except Exception as e:
            print(f"Error sending message: {e}")
            return {"error": str(e)}
    
    async def update_performance_metrics(self) -> None:
        """Update AI performance metrics"""
        try:
            # Calculate metrics
            total_requests = self.performance_metrics["total_requests"]
            successful_requests = self.performance_metrics["successful_requests"]
            
            success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
            
            # Update metrics
            self.performance_metrics.update({
                "success_rate": success_rate,
                "last_updated": datetime.utcnow()
            })
            
            # Store in database
            await self.db.ai_performance.update_one(
                {"service": "ai_service"},
                {"$set": self.performance_metrics},
                upsert=True
            )
            
        except Exception as e:
            print(f"Error updating performance metrics: {e}")
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get AI performance metrics"""
        return self.performance_metrics
    
    async def _get_ai_response(self, prompt: Any) -> str:
        """Get response from AI model"""
        if not self.client:
            return "AI service not available. Please configure OpenAI API key."
        
        try:
            start_time = datetime.utcnow()
            
            if isinstance(prompt, str):
                # Single prompt
                response = await self.client.chat.completions.create(
                    model=self.config.get("config", {}).get("model_name", "gpt-4"),
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=self.config.get("config", {}).get("max_tokens", 2000),
                    temperature=self.config.get("config", {}).get("temperature", 0.7)
                )
            else:
                # Conversation messages
                response = await self.client.chat.completions.create(
                    model=self.config.get("config", {}).get("model_name", "gpt-4"),
                    messages=prompt,
                    max_tokens=self.config.get("config", {}).get("max_tokens", 2000),
                    temperature=self.config.get("config", {}).get("temperature", 0.7)
                )
            
            # Update metrics
            self.performance_metrics["total_requests"] += 1
            self.performance_metrics["successful_requests"] += 1
            self.performance_metrics["total_tokens_used"] += response.usage.total_tokens
            
            response_time = (datetime.utcnow() - start_time).total_seconds()
            self.performance_metrics["average_response_time"] = (
                (self.performance_metrics["average_response_time"] + response_time) / 2
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.performance_metrics["total_requests"] += 1
            self.performance_metrics["failed_requests"] += 1
            print(f"Error getting AI response: {e}")
            return f"Error: {str(e)}"
    
    def _create_screening_analysis_prompt(self, screening: Dict[str, Any], patient: Dict[str, Any]) -> str:
        """Create prompt for screening analysis"""
        return f"""
        Analyze the following vision screening results for a patient:
        
        Patient Information:
        - Name: {patient.get('name', 'Unknown')}
        - Age: {patient.get('age', 'Unknown')}
        - Gender: {patient.get('gender', 'Unknown')}
        
        Screening Results:
        - Screening Type: {screening.get('screening_type', 'Unknown')}
        - Test Results: {json.dumps(screening.get('results', {}), indent=2)}
        - Test Date: {screening.get('screening_date', 'Unknown')}
        
        Please provide:
        1. Analysis of the screening results
        2. Potential vision issues detected
        3. Risk assessment
        4. Recommendations for follow-up
        5. Educational impact considerations
        
        Provide a professional, detailed analysis suitable for healthcare providers.
        """
    
    def _create_risk_assessment_prompt(self, patient: Dict[str, Any], screenings: List[Dict[str, Any]], new_data: Dict[str, Any]) -> str:
        """Create prompt for risk assessment"""
        return f"""
        Assess the risk level for the following patient based on their screening history and new data:
        
        Patient Information:
        - Name: {patient.get('name', 'Unknown')}
        - Age: {patient.get('age', 'Unknown')}
        - Medical History: {json.dumps(patient.get('medical_history', {}), indent=2)}
        
        Screening History (Last 5 screenings):
        {json.dumps([{
            'date': s.get('screening_date'),
            'type': s.get('screening_type'),
            'results': s.get('results', {})
        } for s in screenings], indent=2)}
        
        New Screening Data:
        {json.dumps(new_data, indent=2)}
        
        Please provide:
        1. Risk level assessment (Low/Medium/High/Critical)
        2. Factors contributing to the risk assessment
        3. Recommended actions
        4. Timeline for follow-up
        5. Monitoring recommendations
        
        Provide a structured risk assessment with clear recommendations.
        """
    
    async def _load_conversations(self) -> None:
        """Load existing conversations from database"""
        try:
            conversations = await self.db.conversations.find({"status": "active"}).to_list(100)
            for conv in conversations:
                self.conversations[conv["conversation_id"]] = conv
        except Exception as e:
            print(f"Error loading conversations: {e}")
