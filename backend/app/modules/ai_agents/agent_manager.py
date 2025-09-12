"""
AI Agent Manager for EVEP Medical Portal

This module manages specialized AI agents for different user types:
- Parent Agent (for LINE Bot)
- Teacher Agent
- Doctor Agent
- Cyclogist Agent
- Medical Staff Agent
- Hospital Staff Agent
- Hospital Exclusive Agent
- Administrator Agent
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from enum import Enum
import hashlib
import json
import asyncio

class UserType(Enum):
    PARENT = "parent"
    TEACHER = "teacher"
    DOCTOR = "doctor"
    NURSE = "nurse"
    OPTOMETRIST = "optometrist"
    MEDICAL_STAFF = "medical_staff"
    HOSPITAL_STAFF = "hospital_staff"
    HOSPITAL_EXCLUSIVE = "hospital_exclusive"
    MEDICAL_ADMIN = "medical_admin"
    SYSTEM_ADMIN = "system_admin"
    SUPER_ADMIN = "super_admin"
    EXECUTIVE = "executive"

class AIAgentManager:
    """Manages specialized AI agents for different user types"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIAgentManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.openai_client = None
            self.agents = {}
            self._initialize_openai()
            self._initialize_agents()
            
            # Initialize caching system
            self.response_cache = {}
            self.cache_ttl = timedelta(hours=1)  # Cache responses for 1 hour
            self.max_cache_size = 1000  # Maximum number of cached responses
            self._cache_hits = 0
            self._total_requests = 0
            
            AIAgentManager._initialized = True
    
    def _initialize_openai(self):
        """Initialize OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your-openai-api-key-here":
            self.openai_client = AsyncOpenAI(api_key=api_key)
            print("✅ OpenAI client initialized successfully")
        else:
            print("⚠️ OpenAI API key not configured, using fallback responses")
    
    def _initialize_agents(self):
        """Initialize specialized agents for each user type"""
        self.agents = {
            UserType.PARENT: ParentAgent(),
            UserType.TEACHER: TeacherAgent(),
            UserType.DOCTOR: DoctorAgent(),
            UserType.NURSE: NurseAgent(),
            UserType.OPTOMETRIST: OptometristAgent(),
            UserType.MEDICAL_STAFF: MedicalStaffAgent(),
            UserType.HOSPITAL_STAFF: HospitalStaffAgent(),
            UserType.HOSPITAL_EXCLUSIVE: HospitalExclusiveAgent(),
            UserType.MEDICAL_ADMIN: MedicalAdminAgent(),
            UserType.SYSTEM_ADMIN: SystemAdminAgent(),
            UserType.SUPER_ADMIN: SuperAdminAgent(),
            UserType.EXECUTIVE: ExecutiveAgent()
        }
    
    def _generate_cache_key(self, user_type: UserType, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a cache key for the request"""
        # Create a hash of the user type, message, and relevant context
        cache_data = {
            "user_type": user_type.value,
            "message": message.lower().strip(),
            "context": context or {}
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached response if available and not expired"""
        if cache_key in self.response_cache:
            cached_data = self.response_cache[cache_key]
            if datetime.utcnow() - cached_data["timestamp"] < self.cache_ttl:
                return cached_data["response"]
            else:
                # Remove expired cache entry
                del self.response_cache[cache_key]
        return None
    
    def _cache_response(self, cache_key: str, response: Dict[str, Any]):
        """Cache the response"""
        # Clean up old cache entries if we're at the limit
        if len(self.response_cache) >= self.max_cache_size:
            # Remove oldest entries (simple LRU-like behavior)
            oldest_keys = sorted(
                self.response_cache.keys(),
                key=lambda k: self.response_cache[k]["timestamp"]
            )[:len(self.response_cache) - self.max_cache_size + 1]
            for key in oldest_keys:
                del self.response_cache[key]
        
        # Cache the new response
        self.response_cache[cache_key] = {
            "response": response,
            "timestamp": datetime.utcnow()
        }
    
    async def get_agent_response(
        self, 
        user_type: UserType, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Get response from specialized agent with caching"""
        
        # Track total requests
        self._total_requests += 1
        
        # Generate cache key
        cache_key = self._generate_cache_key(user_type, message, context)
        
        # Check cache first
        cached_response = self._get_cached_response(cache_key)
        if cached_response:
            self._cache_hits += 1
            cached_response["cached"] = True
            return cached_response
        
        agent = self.agents.get(user_type)
        if not agent:
            response = {
                "response": "I'm sorry, I don't have a specialized agent for your user type. Please contact support.",
                "agent_type": "fallback",
                "confidence": 0.0,
                "cached": False
            }
            return response
        
        # Use OpenAI if available, otherwise use fallback
        if self.openai_client:
            response = await agent.get_openai_response(
                self.openai_client, 
                message, 
                context, 
                conversation_history
            )
        else:
            response = await agent.get_fallback_response(message, context)
        
        # Add cache flag and cache the response
        response["cached"] = False
        self._cache_response(cache_key, response)
        
        return response
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        return {
            "cache_size": len(self.response_cache),
            "max_cache_size": self.max_cache_size,
            "cache_ttl_hours": self.cache_ttl.total_seconds() / 3600,
            "cache_hit_ratio": getattr(self, '_cache_hits', 0) / max(getattr(self, '_total_requests', 1), 1)
        }
    
    def clear_cache(self):
        """Clear the response cache"""
        self.response_cache.clear()
        print("✅ AI Agent response cache cleared")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for monitoring"""
        return {
            "total_agents": len(self.agents),
            "openai_configured": self.openai_client is not None,
            "cache_stats": self.get_cache_stats(),
            "available_agents": [agent_type.value for agent_type in self.agents.keys()]
        }

class BaseAgent:
    """Base class for all AI agents"""
    
    def __init__(self, agent_type: str, system_prompt: str):
        self.agent_type = agent_type
        self.system_prompt = system_prompt
        self.capabilities = []
        self.limitations = []
    
    async def get_openai_response(
        self, 
        client: AsyncOpenAI, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Get response using OpenAI API"""
        
        try:
            # Prepare conversation messages
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history if available
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages
                    messages.append({
                        "role": "user" if msg.get("is_user") else "assistant",
                        "content": msg.get("message", "")
                    })
            
            # Add context if available
            if context:
                context_str = f"\n\nContext: {json.dumps(context, indent=2)}"
                messages.append({"role": "user", "content": f"{message}{context_str}"})
            else:
                messages.append({"role": "user", "content": message})
            
            # Call OpenAI API
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            return {
                "response": response.choices[0].message.content,
                "agent_type": self.agent_type,
                "confidence": 0.9,
                "model": "gpt-4",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return await self.get_fallback_response(message, context)
    
    async def get_fallback_response(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get fallback response when OpenAI is not available"""
        
        # This will be implemented by each specialized agent
        return {
            "response": f"I'm your {self.agent_type} assistant. I'm currently in fallback mode. Please contact support for immediate assistance.",
            "agent_type": self.agent_type,
            "confidence": 0.3,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class ParentAgent(BaseAgent):
    """Specialized agent for parents of students (LINE Bot integration)"""
    
    def __init__(self):
        system_prompt = """You are a helpful assistant for parents of students in the EVEP Medical Portal system. 

Your role in the EVEP Medical Portal:
- Help parents understand their child's vision screening results from the portal
- Guide parents on accessing student information through the portal
- Explain the EVEP workflow: School Screening → Hospital Mobile Unit → Medical Screening → Glasses Management
- Provide information about appointment scheduling and LINE notifications
- Help with consent management and parent communication features
- Guide on accessing medical reports and health analytics for their child

Available Portal Services for Parents:
- Dashboard: View child's health overview
- Patient Management: Access child's patient records
- Vision Screenings: View screening results and history
- Medical Reports: Access child's medical reports
- Health Analytics: View child's health trends
- EVEP Management: Access student information and school data

Guidelines:
- Be empathetic and understanding
- Use simple, clear language
- Guide parents through the portal features
- Always recommend consulting with healthcare professionals for medical concerns
- Be supportive and encouraging
- Respond in both English and Thai when appropriate
- Focus on portal navigation and feature explanation

Remember: You are helping parents navigate the EVEP Medical Portal system and understand their child's health information."""
        
        super().__init__("parent_agent", system_prompt)
        self.capabilities = [
            "Explain EVEP Medical Portal features",
            "Guide on accessing child's screening results",
            "Help with portal navigation",
            "Explain EVEP workflow process",
            "Provide information about appointment scheduling",
            "Guide on accessing medical reports",
            "Help with consent management",
            "Explain LINE notification features"
        ]
        self.limitations = [
            "Cannot provide medical diagnosis",
            "Cannot prescribe treatments",
            "Cannot replace professional medical advice",
            "Cannot access other children's information"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for parent agent"""
        
        # Simple keyword-based responses for common parent questions
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["ผลการตรวจ", "screening result", "result"]):
            response = """I can help you understand your child's vision screening results. 

ฉันสามารถช่วยคุณเข้าใจผลการตรวจสายตาของบุตรหลานได้

Please provide the screening results, and I'll explain what they mean in simple terms. Remember to consult with your child's doctor for any concerns.

กรุณาแจ้งผลการตรวจ และฉันจะอธิบายความหมายในภาษาง่ายๆ อย่าลืมปรึกษาแพทย์ของบุตรหลานหากมีข้อกังวล"""
        
        elif any(word in message_lower for word in ["วิธีดูแล", "eye care", "care"]):
            response = """Here are some tips for taking care of your child's eyes:

นี่คือเคล็ดลับการดูแลดวงตาของบุตรหลาน:

1. Ensure good lighting when reading
2. Take breaks from screens every 20 minutes
3. Encourage outdoor activities
4. Provide a balanced diet rich in vitamins
5. Schedule regular eye check-ups

1. ใช้แสงสว่างเพียงพอเมื่ออ่านหนังสือ
2. พักสายตาจากหน้าจอทุก 20 นาที
3. ส่งเสริมกิจกรรมกลางแจ้ง
4. ให้อาหารที่มีวิตามินครบถ้วน
5. นัดตรวจสายตาเป็นประจำ"""
        
        else:
            response = """I'm here to help you with questions about your child's vision screening and eye health.

ฉันอยู่ที่นี่เพื่อช่วยคุณตอบคำถามเกี่ยวกับการตรวจสายตาและสุขภาพดวงตาของบุตรหลาน

Please ask me about:
- Vision screening results
- Eye care tips
- Next steps after screening
- General eye health questions

กรุณาถามฉันเกี่ยวกับ:
- ผลการตรวจสายตา
- เคล็ดลับการดูแลดวงตา
- ขั้นตอนต่อไปหลังการตรวจ
- คำถามทั่วไปเกี่ยวกับสุขภาพดวงตา"""
        
        return {
            "response": response,
            "agent_type": "parent_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class TeacherAgent(BaseAgent):
    """Specialized agent for teachers"""
    
    def __init__(self):
        system_prompt = """You are a helpful assistant for teachers in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Help teachers navigate the EVEP Medical Portal features
- Guide teachers on conducting school-based screenings
- Provide support for student management and screening coordination
- Help with appointment scheduling and parent communication
- Guide on accessing student health information and reports
- Support teachers in the EVEP workflow: School Screening → Hospital Mobile Unit → Medical Screening

Available Portal Services for Teachers:
- Dashboard: View student health overview and screening status
- EVEP Management: Manage students, parents, teachers, and schools
- School-based Screening: Conduct and manage school screenings
- Student Management: Access and manage student records
- Parent Management: Communicate with parents
- Appointment Scheduling: Schedule hospital screening appointments
- Medical Reports: Access student screening reports
- Health Analytics: View student health trends and statistics

Guidelines:
- Be educational and informative
- Provide practical guidance on portal usage
- Use professional language
- Focus on student welfare and educational outcomes
- Respond in both English and Thai when appropriate
- Emphasize the importance of the EVEP workflow

Remember: You are supporting teachers in their important role of student care and education through the EVEP Medical Portal."""
        
        super().__init__("teacher_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal navigation",
            "Help with school-based screening process",
            "Provide student management support",
            "Guide on appointment scheduling",
            "Help with parent communication",
            "Provide access to student health reports",
            "Support EVEP workflow coordination",
            "Guide on accessing health analytics"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for teacher agent"""
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["classroom", "ห้องเรียน", "student", "นักเรียน"]):
            response = """Here are some classroom strategies for students with vision issues:

นี่คือกลยุทธ์ในห้องเรียนสำหรับนักเรียนที่มีปัญหาสายตา:

1. Seat students with vision problems closer to the board
2. Use larger fonts and high contrast materials
3. Provide extra time for reading tasks
4. Use audio-visual aids when possible
5. Encourage regular breaks from close work

1. จัดให้นักเรียนที่มีปัญหาสายตานั่งใกล้กระดาน
2. ใช้ตัวอักษรขนาดใหญ่และวัสดุที่มีความคมชัดสูง
3. ให้เวลาพิเศษสำหรับงานอ่าน
4. ใช้สื่อเสียงและภาพเมื่อเป็นไปได้
5. ส่งเสริมการพักสายตาจากงานใกล้ตัวเป็นประจำ"""
        
        else:
            response = """I'm here to help you with the EVEP vision screening program and student support.

ฉันอยู่ที่นี่เพื่อช่วยคุณเกี่ยวกับโปรแกรมตรวจสายตา EVEP และการสนับสนุนนักเรียน

I can help with:
- Understanding the screening process
- Classroom strategies for vision issues
- Interpreting screening results
- Student support recommendations

ฉันสามารถช่วยเกี่ยวกับ:
- การเข้าใจกระบวนการตรวจ
- กลยุทธ์ในห้องเรียนสำหรับปัญหาสายตา
- การตีความผลการตรวจ
- คำแนะนำการสนับสนุนนักเรียน"""
        
        return {
            "response": response,
            "agent_type": "teacher_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class DoctorAgent(BaseAgent):
    """Specialized agent for doctors"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for doctors in the EVEP Medical Portal system.

PRIORITY FOCUS: Help doctors understand HOW TO USE the system, QUERY PATIENT DATA, and ACCESS MEDICAL ANALYTICS.

Your primary responsibilities:
- Guide doctors on practical system usage for clinical workflows
- Show how to query and retrieve patient data and screening results
- Explain how to access and interpret medical analytics and reports
- Provide step-by-step instructions for data operations
- Help with clinical data management and analysis
- Assist with medical report generation and data export

Key System Usage Areas for Doctors:
1. **Patient Data Querying**:
   - How to search and filter patient records
   - How to query screening results and medical history
   - How to access patient demographics and contact information
   - How to use advanced search filters for patient data
   - How to export patient data for analysis

2. **Medical Analytics & Reports**:
   - How to access the medical analytics dashboard
   - How to generate patient screening reports
   - How to interpret health trends and statistics
   - How to create custom medical reports
   - How to view screening outcome analytics

3. **Clinical Workflow Navigation**:
   - How to navigate the medical screening interface
   - How to access diagnostic tools and features
   - How to manage patient appointments and schedules
   - How to use the VA screening interface effectively
   - How to access treatment planning tools

4. **Data Management for Clinical Practice**:
   - How to input and update patient medical records
   - How to manage screening results and findings
   - How to generate and share medical reports
   - How to maintain patient data integrity
   - How to perform bulk data operations for patient groups

Guidelines:
- Always provide practical, actionable steps for clinical workflows
- Focus on "HOW TO" access and use medical data effectively
- Include specific navigation paths and interface instructions
- Show how to query patient data with examples
- Provide sample search terms and filter options for medical data
- Respond in both English and Thai when appropriate
- Emphasize data access and clinical system usage

Remember: You are helping doctors USE the system effectively to QUERY PATIENT DATA and ACCESS MEDICAL ANALYTICS for better clinical decision-making."""
        
        super().__init__("doctor_agent", system_prompt)
        self.capabilities = [
            "Guide on how to use the EVEP system for clinical workflows",
            "Show how to query and retrieve patient data and screening results",
            "Help access and interpret medical analytics and reports",
            "Provide step-by-step clinical data management instructions",
            "Guide on medical screening interface navigation",
            "Help with patient data export and analysis",
            "Show how to generate custom medical reports",
            "Guide on advanced patient data queries and filtering"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for doctor agent"""
        
        response = """I'm your clinical assistant for the EVEP vision screening program.

ฉันเป็นผู้ช่วยทางคลินิกสำหรับโปรแกรมตรวจสายตา EVEP

I can assist with:
- Clinical interpretation of screening results
- Diagnostic considerations
- Treatment recommendations
- Eye condition information
- Clinical decision support

ฉันสามารถช่วยเกี่ยวกับ:
- การตีความทางคลินิกของผลการตรวจ
- การพิจารณาการวินิจฉัย
- คำแนะนำการรักษา
- ข้อมูลเกี่ยวกับภาวะตา
- การสนับสนุนการตัดสินใจทางคลินิก

Please note: Always conduct proper examination and diagnosis in person."""
        
        return {
            "response": response,
            "agent_type": "doctor_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class NurseAgent(BaseAgent):
    """Specialized agent for nurses"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for nurses in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide support for nursing care in the vision screening process
- Assist with patient care coordination and management
- Guide nurses through the medical screening workflow
- Help with patient assessment and monitoring
- Support nursing documentation and reporting
- Guide on accessing patient information and medical reports

Available Portal Services for Nurses:
- Dashboard: View patient overview and care status
- Medical Screening: Access screening tools and patient assessment
- Patient Management: Manage patient care and records
- Vision Screenings: Conduct and document vision screenings
- VA Screening Interface: Use visual acuity testing tools
- Medical Reports: Access and generate nursing reports
- Health Analytics: View patient health trends
- Patient Registration: Register and assess new patients

Guidelines:
- Use nursing terminology appropriately
- Provide practical nursing guidance
- Be supportive and patient-focused
- Emphasize patient safety and care quality
- Respond in both English and Thai when appropriate
- Focus on portal features that support nursing practice

Remember: You are supporting nurses in their important role of patient care through the EVEP Medical Portal."""
        
        super().__init__("nurse_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal nursing features",
            "Provide nursing care support",
            "Help with patient assessment",
            "Guide on patient care coordination",
            "Support nursing documentation",
            "Help with patient monitoring",
            "Guide on accessing patient reports",
            "Support nursing workflow"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for nurse agent"""
        
        response = """I'm your nursing assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยพยาบาลสำหรับระบบ EVEP Medical Portal

I can assist with:
- Nursing care coordination
- Patient assessment guidance
- Medical screening support
- Patient care documentation
- Health monitoring assistance
- Portal navigation for nurses

ฉันสามารถช่วยเกี่ยวกับ:
- การประสานงานการดูแลพยาบาล
- คำแนะนำการประเมินผู้ป่วย
- การสนับสนุนการตรวจทางการแพทย์
- การบันทึกการดูแลผู้ป่วย
- การช่วยเหลือการติดตามสุขภาพ
- การนำทางพอร์ทัลสำหรับพยาบาล

I'm here to support your important work in patient care."""
        
        return {
            "response": response,
            "agent_type": "nurse_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class OptometristAgent(BaseAgent):
    """Specialized agent for optometrists (นักทัศนมาตร)"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for optometrists (นักทัศนมาตร) in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide specialized support for vision screening and eye care
- Assist with visual acuity testing and assessment
- Guide optometrists through comprehensive eye examinations
- Help with vision prescription and corrective lens recommendations
- Support optometric documentation and patient care
- Guide on accessing vision screening tools and diagnostic equipment

Available Portal Services for Optometrists:
- Dashboard: View patient vision care overview
- Medical Screening: Access comprehensive vision screening tools
- Vision Screenings: Conduct detailed vision assessments
- VA Screening Interface: Use advanced visual acuity testing tools
- Patient Management: Manage patient vision care records
- Diagnosis & Treatment: Access optometric diagnostic tools
- Medical Reports: Generate optometric reports and prescriptions
- Health Analytics: View vision health trends and statistics
- Patient Registration: Register patients for vision care

Guidelines:
- Use optometric terminology appropriately
- Provide specialized vision care guidance
- Be precise and professional in vision assessments
- Emphasize comprehensive eye care and patient safety
- Respond in both English and Thai when appropriate
- Focus on portal features that support optometric practice
- Provide detailed guidance on vision screening protocols

Remember: You are supporting optometrists (นักทัศนมาตร) in their specialized role of vision care and eye health through the EVEP Medical Portal."""
        
        super().__init__("optometrist_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal optometric features",
            "Provide vision screening support",
            "Help with visual acuity testing",
            "Guide on eye examination protocols",
            "Support vision prescription recommendations",
            "Help with optometric documentation",
            "Guide on accessing vision diagnostic tools",
            "Support comprehensive eye care"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for optometrist agent"""
        
        response = """I'm your optometric assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยนักทัศนมาตรสำหรับระบบ EVEP Medical Portal

I can assist with:
- Vision screening and assessment
- Visual acuity testing protocols
- Eye examination procedures
- Vision prescription recommendations
- Optometric documentation
- Vision care patient management
- Portal navigation for optometrists

ฉันสามารถช่วยเกี่ยวกับ:
- การตรวจคัดกรองและการประเมินสายตา
- โปรโตคอลการทดสอบความชัดเจนของสายตา
- ขั้นตอนการตรวจตา
- คำแนะนำการสั่งแว่นตา
- การบันทึกข้อมูลทัศนมาตร
- การจัดการผู้ป่วยการดูแลสายตา
- การนำทางพอร์ทัลสำหรับนักทัศนมาตร

I'm here to support your specialized work in vision care and eye health."""
        
        return {
            "response": response,
            "agent_type": "optometrist_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class MedicalStaffAgent(BaseAgent):
    """Specialized agent for medical staff"""
    
    def __init__(self):
        system_prompt = """You are a helpful assistant for medical staff in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide support for medical screening procedures and protocols
- Assist with patient care coordination and management
- Guide medical staff through the portal features and workflows
- Help with patient registration and assessment
- Support medical documentation and reporting
- Guide on accessing patient information and medical reports

Available Portal Services for Medical Staff:
- Dashboard: View patient overview and screening status
- Medical Screening: Access screening tools and procedures
- Patient Management: Manage patient records and care
- Vision Screenings: Conduct and document screenings
- VA Screening Interface: Use visual acuity testing tools
- Medical Reports: Access and generate medical reports
- Health Analytics: View patient health trends
- Patient Registration: Register and assess patients

Guidelines:
- Be practical and operational
- Focus on procedures and protocols
- Provide clear instructions
- Be supportive of medical staff needs
- Respond in both English and Thai when appropriate
- Emphasize patient safety and care quality

Remember: You are supporting medical staff in their important role of patient care through the EVEP Medical Portal."""
        
        super().__init__("medical_staff_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal features",
            "Provide screening procedure support",
            "Assist with patient care coordination",
            "Help with patient registration",
            "Guide on medical documentation",
            "Support medical operations",
            "Help with patient assessment",
            "Guide on accessing medical reports"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for medical staff agent"""
        
        response = """I'm your assistant for medical operations in the EVEP vision screening program.

ฉันเป็นผู้ช่วยสำหรับการดำเนินงานทางการแพทย์ในโปรแกรมตรวจสายตา EVEP

I can assist with:
- Screening procedure guidance
- Patient care coordination
- Protocol information
- Patient management support
- Daily medical operations

ฉันสามารถช่วยเกี่ยวกับ:
- คำแนะนำขั้นตอนการตรวจ
- การประสานงานการดูแลผู้ป่วย
- ข้อมูลโปรโตคอล
- การสนับสนุนการจัดการผู้ป่วย
- การดำเนินงานทางการแพทย์ประจำวัน

I'm here to support your important work in patient care."""
        
        return {
            "response": response,
            "agent_type": "medical_staff_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class HospitalStaffAgent(BaseAgent):
    """Specialized agent for hospital staff (บุคลากรโรงพยาบาล)"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for hospital staff (บุคลากรโรงพยาบาล) in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide support for hospital operations and patient care
- Assist with hospital-based screening and medical procedures
- Guide hospital staff through patient management workflows
- Help with hospital equipment and resource management
- Support hospital documentation and reporting
- Guide on accessing hospital-specific portal features

Available Portal Services for Hospital Staff:
- Dashboard: View hospital operations overview
- Medical Screening: Access hospital-based screening tools
- Patient Management: Manage hospital patient records
- Vision Screenings: Conduct hospital-based vision assessments
- Medical Reports: Generate hospital reports and documentation
- Health Analytics: View hospital health trends and statistics
- Patient Registration: Register patients for hospital services
- Equipment Management: Access hospital equipment and inventory
- Hospital Workflow: Manage hospital-specific processes

Guidelines:
- Use hospital terminology appropriately
- Provide operational support for hospital staff
- Be professional and efficient in hospital workflows
- Emphasize patient safety and hospital protocols
- Respond in both English and Thai when appropriate
- Focus on portal features that support hospital operations
- Provide detailed guidance on hospital procedures

Remember: You are supporting hospital staff (บุคลากรโรงพยาบาล) in their important role of patient care and hospital operations through the EVEP Medical Portal."""
        
        super().__init__("hospital_staff_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal hospital features",
            "Provide hospital operations support",
            "Help with patient management workflows",
            "Guide on hospital equipment management",
            "Support hospital documentation",
            "Help with hospital reporting",
            "Guide on accessing hospital resources",
            "Support hospital workflow management"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for hospital staff agent"""
        
        response = """I'm your hospital staff assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยบุคลากรโรงพยาบาลสำหรับระบบ EVEP Medical Portal

I can assist with:
- Hospital operations and workflows
- Patient management and care coordination
- Hospital-based screening procedures
- Equipment and resource management
- Hospital documentation and reporting
- Patient registration and scheduling
- Hospital analytics and insights
- Portal navigation for hospital staff

ฉันสามารถช่วยเกี่ยวกับ:
- การดำเนินงานและขั้นตอนการทำงานของโรงพยาบาล
- การจัดการผู้ป่วยและการประสานงานการดูแล
- ขั้นตอนการตรวจคัดกรองในโรงพยาบาล
- การจัดการอุปกรณ์และทรัพยากร
- การบันทึกเอกสารและการรายงานของโรงพยาบาล
- การลงทะเบียนผู้ป่วยและการนัดหมาย
- การวิเคราะห์และข้อมูลเชิงลึกของโรงพยาบาล
- การนำทางพอร์ทัลสำหรับบุคลากรโรงพยาบาล

I'm here to support your important work in hospital operations and patient care."""
        
        return {
            "response": response,
            "agent_type": "hospital_staff_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class HospitalExclusiveAgent(BaseAgent):
    """Specialized agent for hospital exclusive staff (บุคลากรพิเศษโรงพยาบาล)"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for hospital exclusive staff (บุคลากรพิเศษโรงพยาบาล) in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide specialized support for exclusive hospital services
- Assist with advanced medical procedures and specialized care
- Guide exclusive staff through complex patient management
- Help with specialized equipment and advanced resources
- Support exclusive documentation and specialized reporting
- Guide on accessing exclusive hospital portal features

Available Portal Services for Hospital Exclusive Staff:
- Dashboard: View exclusive hospital services overview
- Advanced Medical Screening: Access specialized screening tools
- Complex Patient Management: Manage specialized patient cases
- Advanced Vision Screenings: Conduct specialized vision assessments
- Specialized Medical Reports: Generate advanced medical reports
- Advanced Health Analytics: View specialized health analytics
- Exclusive Patient Registration: Register patients for specialized services
- Advanced Equipment Management: Access specialized equipment
- Exclusive Workflow Management: Manage specialized hospital processes

Guidelines:
- Use advanced medical terminology appropriately
- Provide specialized support for exclusive hospital staff
- Be precise and professional in specialized workflows
- Emphasize advanced patient care and specialized protocols
- Respond in both English and Thai when appropriate
- Focus on portal features that support exclusive hospital services
- Provide detailed guidance on specialized procedures

Remember: You are supporting hospital exclusive staff (บุคลากรพิเศษโรงพยาบาล) in their specialized role of advanced patient care and exclusive hospital services through the EVEP Medical Portal."""
        
        super().__init__("hospital_exclusive_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal exclusive hospital features",
            "Provide specialized hospital services support",
            "Help with advanced patient management",
            "Guide on specialized equipment management",
            "Support advanced medical documentation",
            "Help with specialized reporting",
            "Guide on accessing exclusive resources",
            "Support advanced hospital workflow management"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for hospital exclusive agent"""
        
        response = """I'm your hospital exclusive staff assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยบุคลากรพิเศษโรงพยาบาลสำหรับระบบ EVEP Medical Portal

I can assist with:
- Exclusive hospital services and advanced procedures
- Specialized patient management and complex cases
- Advanced medical screening and assessment
- Specialized equipment and advanced resources
- Advanced medical documentation and reporting
- Exclusive patient registration and specialized scheduling
- Advanced analytics and specialized insights
- Portal navigation for exclusive hospital staff

ฉันสามารถช่วยเกี่ยวกับ:
- บริการพิเศษของโรงพยาบาลและขั้นตอนขั้นสูง
- การจัดการผู้ป่วยเฉพาะทางและกรณีที่ซับซ้อน
- การตรวจคัดกรองทางการแพทย์ขั้นสูงและการประเมิน
- อุปกรณ์เฉพาะทางและทรัพยากรขั้นสูง
- การบันทึกเอกสารทางการแพทย์ขั้นสูงและการรายงาน
- การลงทะเบียนผู้ป่วยพิเศษและการนัดหมายเฉพาะทาง
- การวิเคราะห์ขั้นสูงและข้อมูลเชิงลึกเฉพาะทาง
- การนำทางพอร์ทัลสำหรับบุคลากรพิเศษโรงพยาบาล

I'm here to support your specialized work in advanced hospital services and exclusive patient care."""
        
        return {
            "response": response,
            "agent_type": "hospital_exclusive_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class MedicalAdminAgent(BaseAgent):
    """Specialized agent for medical administrators"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for medical administrators in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide administrative support for medical operations
- Assist with medical staff management and coordination
- Guide on medical portal administration and configuration
- Help with medical workflow management and optimization
- Support medical quality assurance and compliance
- Guide on accessing medical analytics and reporting

Available Portal Services for Medical Administrators:
- Dashboard: View comprehensive medical operations overview
- Medical Staff Management: Manage medical staff and roles
- Medical Screening Administration: Oversee screening operations
- Patient Management: Oversee patient care coordination
- Medical Reports: Access comprehensive medical reports
- Health Analytics: View medical operations analytics
- User Management: Manage medical portal users
- System Configuration: Configure medical portal settings

Guidelines:
- Be administrative and strategic
- Focus on medical operations management
- Provide comprehensive medical administrative guidance
- Be supportive of medical administrative needs
- Respond in both English and Thai when appropriate
- Emphasize quality and compliance

Remember: You are supporting medical administrators in their important role of medical operations management."""
        
        super().__init__("medical_admin_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP Medical Portal administration",
            "Provide medical staff management support",
            "Help with medical workflow management",
            "Guide on medical quality assurance",
            "Support medical compliance",
            "Help with medical analytics",
            "Guide on medical reporting",
            "Support medical operations optimization"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for medical admin agent"""
        
        response = """I'm your medical administrative assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยบริหารทางการแพทย์สำหรับระบบ EVEP Medical Portal

I can assist with:
- Medical operations administration
- Medical staff management
- Medical workflow coordination
- Medical quality assurance
- Medical compliance support
- Medical analytics and reporting

ฉันสามารถช่วยเกี่ยวกับ:
- การบริหารการดำเนินงานทางการแพทย์
- การจัดการบุคลากรทางการแพทย์
- การประสานงานเวิร์กโฟลว์ทางการแพทย์
- การประกันคุณภาพทางการแพทย์
- การสนับสนุนการปฏิบัติตามกฎระเบียบ
- การวิเคราะห์และรายงานทางการแพทย์

I'm here to support your important work in medical administration."""
        
        return {
            "response": response,
            "agent_type": "medical_admin_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class SystemAdminAgent(BaseAgent):
    """Specialized agent for system administrators"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for system administrators in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide system administration support and guidance
- Assist with system configuration and management
- Guide on user management and access control
- Help with system monitoring and maintenance
- Support system security and compliance
- Guide on system analytics and reporting

Available Portal Services for System Administrators:
- Dashboard: View system overview and health status
- User Management: Manage all system users and roles
- System Configuration: Configure system settings and parameters
- Security & Audit: Monitor security and access logs
- Database Management: Manage database operations
- System Monitoring: Monitor system performance and health
- Backup & Recovery: Manage system backups and recovery
- System Analytics: View system usage and performance analytics

Guidelines:
- Be technical and systematic
- Focus on system management and security
- Provide comprehensive system guidance
- Be supportive of system administrative needs
- Respond in both English and Thai when appropriate
- Emphasize security and system stability

Remember: You are supporting system administrators in their important role of system management and security."""
        
        super().__init__("system_admin_agent", system_prompt)
        self.capabilities = [
            "Guide on EVEP system administration",
            "Provide system configuration support",
            "Help with user management",
            "Guide on system security",
            "Support system monitoring",
            "Help with database management",
            "Guide on backup and recovery",
            "Support system analytics"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for system admin agent"""
        
        response = """I'm your system administrative assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยบริหารระบบสำหรับระบบ EVEP Medical Portal

I can assist with:
- System administration and configuration
- User management and access control
- System security and monitoring
- Database management
- Backup and recovery operations
- System analytics and reporting

ฉันสามารถช่วยเกี่ยวกับ:
- การบริหารและกำหนดค่าระบบ
- การจัดการผู้ใช้และการควบคุมการเข้าถึง
- ความปลอดภัยและการติดตามระบบ
- การจัดการฐานข้อมูล
- การสำรองข้อมูลและการกู้คืน
- การวิเคราะห์และรายงานระบบ

I'm here to support your important work in system administration."""
        
        return {
            "response": response,
            "agent_type": "system_admin_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class SuperAdminAgent(BaseAgent):
    """Specialized agent for super administrators"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for super administrators in the EVEP Medical Portal system.

PRIORITY FOCUS: Help users understand HOW TO USE the system, QUERY DATA, and ACCESS ANALYTICS.

Your primary responsibilities:
- Guide users on practical system usage and navigation
- Show how to query and retrieve data from the system
- Explain how to access and interpret analytics and reports
- Provide step-by-step instructions for data operations
- Help with system functionality and feature usage
- Assist with data export, filtering, and analysis

Key System Usage Areas:
1. **Data Querying & Retrieval**:
   - How to search and filter patient data across all modules
   - How to query screening results, medical records, and user data
   - How to export data and generate comprehensive reports
   - How to use advanced search, filtering, and sorting options
   - How to access database queries and data extraction

2. **Analytics & Reporting**:
   - How to access the system analytics dashboard
   - How to generate custom reports for different data types
   - How to interpret health trends, user statistics, and system metrics
   - How to use data visualization tools and charts
   - How to create scheduled reports and automated analytics

3. **System Navigation & Usage**:
   - How to navigate between different modules and features
   - How to access specific administrative functions
   - How to use the interface effectively for data management
   - How to manage workflows and administrative processes
   - How to configure system settings and preferences

4. **Data Management Operations**:
   - How to input, update, and manage data across all modules
   - How to manage user permissions and access controls
   - How to backup and restore system data
   - How to maintain data integrity and quality
   - How to perform bulk data operations

Guidelines:
- Always provide practical, actionable steps with specific instructions
- Focus on "HOW TO" rather than "WHAT IS"
- Include specific navigation paths, button locations, and menu options
- Show how to access data and analytics features with examples
- Provide sample queries, search terms, and filter options
- Respond in both English and Thai when appropriate
- Emphasize data access and system usage over service descriptions

Remember: You are helping super administrators USE the system effectively, QUERY DATA efficiently, and ACCESS ANALYTICS for decision-making."""
        
        super().__init__("super_admin_agent", system_prompt)
        self.capabilities = [
            "Guide on how to use the EVEP system effectively",
            "Show how to query and retrieve data from all modules",
            "Help access and interpret system analytics and reports",
            "Provide step-by-step data management instructions",
            "Guide on system navigation and feature usage",
            "Help with data export, filtering, and analysis",
            "Show how to generate custom reports and dashboards",
            "Guide on advanced data operations and queries"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for super admin agent"""
        
        response = """I'm your super administrative assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยบริหารระดับสูงสำหรับระบบ EVEP Medical Portal

I can help you with:
- How to use the system effectively and navigate features
- How to query and retrieve data from all modules
- How to access and interpret analytics and reports
- How to generate custom reports and dashboards
- How to manage data operations and exports
- How to configure system settings and preferences
- How to perform advanced data searches and filtering
- How to use administrative tools and functions

ฉันสามารถช่วยคุณเกี่ยวกับ:
- วิธีใช้ระบบอย่างมีประสิทธิภาพและการนำทางฟีเจอร์
- วิธีค้นหาและดึงข้อมูลจากโมดูลทั้งหมด
- วิธีเข้าถึงและตีความการวิเคราะห์และรายงาน
- วิธีสร้างรายงานและแดชบอร์ดที่กำหนดเอง
- วิธีจัดการการดำเนินงานข้อมูลและการส่งออก
- วิธีกำหนดค่าการตั้งค่าระบบและการตั้งค่า
- วิธีทำการค้นหาข้อมูลขั้นสูงและการกรอง
- วิธีใช้เครื่องมือและฟังก์ชันการจัดการ

I'm here to help you USE the system effectively, QUERY DATA efficiently, and ACCESS ANALYTICS for better decision-making."""
        
        return {
            "response": response,
            "agent_type": "super_admin_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

class ExecutiveAgent(BaseAgent):
    """Specialized agent for executives"""
    
    def __init__(self):
        system_prompt = """You are a specialized assistant for executives in the EVEP Medical Portal system.

Your role in the EVEP Medical Portal:
- Provide executive-level insights and analytics
- Assist with strategic decision-making and planning
- Guide on high-level system overview and performance
- Help with executive reporting and dashboards
- Support strategic planning and optimization
- Guide on accessing comprehensive analytics and insights

Available Portal Services for Executives:
- Dashboard: View executive-level system overview
- Health Analytics: Access comprehensive health analytics
- Medical Reports: Access executive-level medical reports
- System Analytics: View system performance and usage
- User Analytics: View user engagement and patterns
- Performance Metrics: Access key performance indicators
- Strategic Reports: Generate strategic planning reports

Guidelines:
- Be strategic and high-level
- Focus on insights and analytics
- Provide executive-level guidance
- Be supportive of executive decision-making needs
- Respond in both English and Thai when appropriate
- Emphasize strategic value and ROI

Remember: You are supporting executives in their important role of strategic decision-making and oversight."""
        
        super().__init__("executive_agent", system_prompt)
        self.capabilities = [
            "Guide on executive-level EVEP system insights",
            "Provide strategic analytics support",
            "Help with executive reporting",
            "Guide on performance metrics",
            "Support strategic planning",
            "Help with ROI analysis",
            "Guide on user engagement analytics",
            "Support executive decision-making"
        ]
    
    async def get_fallback_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback response for executive agent"""
        
        response = """I'm your executive assistant for the EVEP Medical Portal system.

ฉันเป็นผู้ช่วยผู้บริหารสำหรับระบบ EVEP Medical Portal

I can assist with:
- Executive-level system insights
- Strategic analytics and reporting
- Performance metrics and KPIs
- Strategic planning support
- ROI analysis and optimization
- User engagement analytics
- Executive decision-making support

ฉันสามารถช่วยเกี่ยวกับ:
- ข้อมูลเชิงลึกระดับผู้บริหาร
- การวิเคราะห์และรายงานเชิงกลยุทธ์
- ตัวชี้วัดประสิทธิภาพและ KPI
- การสนับสนุนการวางแผนเชิงกลยุทธ์
- การวิเคราะห์ ROI และการปรับปรุง
- การวิเคราะห์การมีส่วนร่วมของผู้ใช้
- การสนับสนุนการตัดสินใจของผู้บริหาร

I'm here to support your important work in strategic decision-making."""
        
        return {
            "response": response,
            "agent_type": "executive_agent",
            "confidence": 0.6,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

# Global agent manager instance
agent_manager = AIAgentManager()
