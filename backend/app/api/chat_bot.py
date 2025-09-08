"""
Chat Bot API endpoints for EVEP Medical Portal

This module provides conversational AI capabilities for the medical portal,
allowing users to ask questions about screening, inventory, students, and medical team workflows.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import re

from app.api.auth import get_current_user
from app.modules.ai_insights import InsightGenerator
from app.core.database import get_database
from app.core.chat_database import get_chat_database, ChatDatabase
from app.modules.ai_agents.agent_manager import agent_manager, UserType
from app.modules.ai_agents.database_agent_manager import database_agent_manager
from app.modules.ai_agents.vector_learning import vector_learning_system

router = APIRouter(tags=["Chat Bot"])

# Initialize insight generator for AI responses
insight_generator = InsightGenerator()

class ChatMessage(BaseModel):
    """Chat message model"""
    message: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    conversation_id: str
    intent: str
    confidence: float
    suggestions: Optional[List[str]] = None
    quick_actions: Optional[List[Dict[str, Any]]] = None
    timestamp: str

class ConversationHistory(BaseModel):
    """Conversation history model"""
    conversation_id: str
    user_id: str
    messages: List[Dict[str, Any]]
    created_at: str
    updated_at: str

# Intent patterns will be loaded from database
# This is a fallback for when database is not available
FALLBACK_INTENT_PATTERNS = {
    "screening_help": [
        r"how.*screen", r"start.*screen", r"screen.*process", r"vision.*test",
        r"ตรวจ.*สายตา", r"เริ่ม.*ตรวจ", r"กระบวนการ.*ตรวจ", r"การตรวจ.*สายตา"
    ],
    "inventory_query": [
        r"inventory", r"stock", r"glasses", r"equipment", r"available",
        r"คลัง.*สินค้า", r"สต็อก", r"แว่น.*ตา", r"อุปกรณ์", r"มี.*อยู่"
    ],
    "student_info": [
        r"student", r"find.*student", r"student.*record", r"patient.*info",
        r"นักเรียน", r"หานักเรียน", r"ข้อมูล.*นักเรียน", r"ข้อมูล.*ผู้ป่วย"
    ],
    "medical_team": [
        r"medical.*team", r"doctor", r"nurse", r"staff", r"schedule",
        r"ทีม.*แพทย์", r"แพทย์", r"พยาบาล", r"เจ้าหน้าที่", r"ตาราง.*งาน"
    ],
    "system_help": [
        r"how.*to", r"help", r"navigate", r"where.*is", r"how.*do.*i",
        r"วิธี.*ใช้", r"ช่วย", r"นำทาง", r"อยู่.*ที่.*ไหน", r"ทำ.*ยังไง"
    ],
    "reports": [
        r"report", r"analytics", r"statistics", r"data", r"summary",
        r"รายงาน", r"การวิเคราะห์", r"สถิติ", r"ข้อมูล", r"สรุป"
    ]
}

# Response templates for different intents (Bilingual: English and Thai)
RESPONSE_TEMPLATES = {
    "screening_help": {
        "response": "I can help you with vision screening procedures. Here's how to start a screening session:\n\nฉันสามารถช่วยคุณเกี่ยวกับขั้นตอนการตรวจสายตาได้ นี่คือวิธีเริ่มการตรวจ:",
        "suggestions": [
            "Start a new screening session / เริ่มการตรวจใหม่",
            "View screening procedures / ดูขั้นตอนการตรวจ",
            "Check screening equipment / ตรวจสอบอุปกรณ์การตรวจ",
            "Review screening results / ตรวจสอบผลการตรวจ"
        ],
        "quick_actions": [
            {"label": "Start Screening / เริ่มตรวจ", "action": "navigate", "path": "/dashboard/screenings"},
            {"label": "View Procedures / ดูขั้นตอน", "action": "help", "topic": "screening_procedures"}
        ]
    },
    "inventory_query": {
        "response": "I can help you check inventory status. Let me look up the current inventory information:\n\nฉันสามารถช่วยคุณตรวจสอบสถานะคลังสินค้าได้ ให้ฉันค้นหาข้อมูลคลังสินค้าปัจจุบัน:",
        "suggestions": [
            "Check glasses inventory / ตรวจสอบคลังแว่นตา",
            "View equipment status / ดูสถานะอุปกรณ์",
            "Check screening kits / ตรวจสอบชุดตรวจ",
            "View delivery status / ดูสถานะการจัดส่ง"
        ],
        "quick_actions": [
            {"label": "View Inventory / ดูคลังสินค้า", "action": "navigate", "path": "/dashboard/inventory"},
            {"label": "Check Glasses / ตรวจแว่นตา", "action": "navigate", "path": "/dashboard/glasses-management"}
        ]
    },
    "student_info": {
        "response": "I can help you find student information. Please provide the student's name or ID:\n\nฉันสามารถช่วยคุณหาข้อมูลนักเรียนได้ กรุณาระบุชื่อหรือรหัสนักเรียน:",
        "suggestions": [
            "Search by student name / ค้นหาด้วยชื่อนักเรียน",
            "Search by student ID / ค้นหาด้วยรหัสนักเรียน",
            "View all students / ดูนักเรียนทั้งหมด",
            "Check student records / ตรวจสอบประวัตินักเรียน"
        ],
        "quick_actions": [
            {"label": "Search Students / ค้นหานักเรียน", "action": "navigate", "path": "/dashboard/evep/students"},
            {"label": "View Patients / ดูผู้ป่วย", "action": "navigate", "path": "/dashboard/patients"}
        ]
    },
    "medical_team": {
        "response": "I can help you with medical team information. Here's what I can assist with:\n\nฉันสามารถช่วยคุณเกี่ยวกับข้อมูลทีมแพทย์ได้ นี่คือสิ่งที่ฉันสามารถช่วยได้:",
        "suggestions": [
            "View medical staff / ดูบุคลากรแพทย์",
            "Check schedules / ตรวจสอบตารางงาน",
            "Find team members / หาสมาชิกทีม",
            "View staff roles / ดูบทบาทเจ้าหน้าที่"
        ],
        "quick_actions": [
            {"label": "Medical Staff / บุคลากรแพทย์", "action": "navigate", "path": "/dashboard/medical-staff"},
            {"label": "Staff Management / จัดการเจ้าหน้าที่", "action": "navigate", "path": "/dashboard/medical-staff-management"}
        ]
    },
    "system_help": {
        "response": "I'm here to help you navigate the EVEP Medical Portal. What would you like to know?\n\nฉันอยู่ที่นี่เพื่อช่วยคุณนำทางใน EVEP Medical Portal คุณต้องการทราบอะไร?",
        "suggestions": [
            "How to use the portal / วิธีใช้พอร์ทัล",
            "Navigation help / ช่วยเหลือการนำทาง",
            "Feature explanations / คำอธิบายฟีเจอร์",
            "System overview / ภาพรวมระบบ"
        ],
        "quick_actions": [
            {"label": "Portal Guide / คู่มือพอร์ทัล", "action": "help", "topic": "portal_guide"},
            {"label": "Dashboard / แดชบอร์ด", "action": "navigate", "path": "/dashboard"}
        ]
    },
    "reports": {
        "response": "I can help you generate and view reports. Here are the available reporting options:\n\nฉันสามารถช่วยคุณสร้างและดูรายงานได้ นี่คือตัวเลือกรายงานที่มี:",
        "suggestions": [
            "Generate screening reports / สร้างรายงานการตรวจ",
            "View analytics / ดูการวิเคราะห์",
            "Check statistics / ตรวจสอบสถิติ",
            "Export data / ส่งออกข้อมูล"
        ],
        "quick_actions": [
            {"label": "View Reports / ดูรายงาน", "action": "navigate", "path": "/dashboard/reports"},
            {"label": "Analytics / การวิเคราะห์", "action": "navigate", "path": "/dashboard/analytics"}
        ]
    }
}

async def detect_intent(message: str, chat_db: Optional[ChatDatabase]) -> tuple[str, float]:
    """Detect the intent of a user message using database patterns"""
    message_lower = message.lower()
    
    best_intent = "system_help"
    best_confidence = 0.0
    
    # Use fallback patterns if database is not available
    if chat_db is None:
        for intent, patterns in FALLBACK_INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    confidence = 0.8
                    if confidence > best_confidence:
                        best_intent = intent
                        best_confidence = confidence
        return best_intent, best_confidence
    
    try:
        # Get intent patterns from database
        intent_patterns = await chat_db.get_intent_patterns()
        
        # If database is empty, use fallback patterns
        if not intent_patterns:
            intent_patterns = FALLBACK_INTENT_PATTERNS
        
        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    confidence = 0.8  # High confidence for pattern matches
                    if confidence > best_confidence:
                        best_intent = intent
                        best_confidence = confidence
        
        # If no specific intent found, use system help
        if best_confidence == 0.0:
            best_intent = "system_help"
            best_confidence = 0.5
            
    except Exception as e:
        # Fallback to hardcoded patterns if database fails
        print(f"Error loading intent patterns from database: {e}")
        for intent, patterns in FALLBACK_INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    confidence = 0.8
                    if confidence > best_confidence:
                        best_intent = intent
                        best_confidence = confidence
    
    return best_intent, best_confidence

async def generate_response(intent: str, message: str, user_role: str, chat_db: Optional[ChatDatabase], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate a response based on intent and context using database templates"""
    
    # Use fallback template if database is not available
    if chat_db is None:
        template = RESPONSE_TEMPLATES.get(intent, RESPONSE_TEMPLATES["system_help"])
    else:
        try:
            # Get template from database
            template_doc = await chat_db.get_response_template(intent)
            
            if template_doc:
                template = {
                    "response": template_doc["response"],
                    "suggestions": template_doc["suggestions"],
                    "quick_actions": template_doc["quick_actions"]
                }
            else:
                # Fallback to hardcoded template
                template = RESPONSE_TEMPLATES.get(intent, RESPONSE_TEMPLATES["system_help"])
                
        except Exception as e:
            print(f"Error loading response template from database: {e}")
            # Fallback to hardcoded template
            template = RESPONSE_TEMPLATES.get(intent, RESPONSE_TEMPLATES["system_help"])
    
    # Customize response based on user role
    if user_role in ["doctor", "nurse", "medical_staff"]:
        template["response"] = f"As a medical professional, {template['response'].lower()}"
    elif user_role in ["teacher"]:
        template["response"] = f"As an educator, {template['response'].lower()}"
    elif user_role in ["admin", "super_admin"]:
        template["response"] = f"As an administrator, {template['response'].lower()}"
    
    # Add specific information based on intent
    if intent == "screening_help":
        template["response"] += "\n\n1. Navigate to the Screenings section\n2. Select 'Start New Screening'\n3. Choose the screening type (VA, Mobile, School)\n4. Follow the guided process"
    elif intent == "inventory_query":
        template["response"] += "\n\nCurrent inventory status:\n• Glasses: Available\n• Screening kits: In stock\n• Equipment: Operational"
    elif intent == "student_info":
        template["response"] += "\n\nTo find student information:\n1. Go to Students section\n2. Use the search function\n3. Enter name or student ID\n4. View detailed records"
    
    return template

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    chat_message: ChatMessage,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Chat with the medical portal bot
    
    This endpoint handles conversational interactions with the AI bot.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        user_id = current_user.get("user_id", "")
        if not user_role or not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role or ID not found"
            )
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Generate conversation ID if not provided
        conversation_id = chat_message.conversation_id or f"conv_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}"
        
        # If database is not available, use fallback mode
        if chat_db is None:
            # Use fallback patterns and templates
            intent, confidence = await detect_intent(chat_message.message, None)
            response_data = await generate_response(intent, chat_message.message, user_role, None, chat_message.context)
        else:
            # Check if conversation exists, create if not
            conversation = await chat_db.get_conversation(conversation_id)
            if not conversation:
                await chat_db.create_conversation(user_id, conversation_id)
            
            # Add user message to conversation
            await chat_db.add_message_to_conversation(
                conversation_id=conversation_id,
                message=chat_message.message,
                is_user=True,
                metadata={"user_role": user_role}
            )
            
            # Detect intent using database patterns
            intent, confidence = await detect_intent(chat_message.message, chat_db)
            
            # Generate response using database templates
            response_data = await generate_response(intent, chat_message.message, user_role, chat_db, chat_message.context)
            
            # Store learning data for AI/ML
            learning_id = await chat_db.store_learning_data(
                user_id=user_id,
                conversation_id=conversation_id,
                message=chat_message.message,
                intent=intent,
                confidence=confidence,
                response=response_data["response"]
            )
            
            # Add bot response to conversation
            await chat_db.add_message_to_conversation(
                conversation_id=conversation_id,
                message=response_data["response"],
                is_user=False,
                intent=intent,
                confidence=confidence,
                metadata={"learning_id": learning_id}
            )
        
        # Create response
        response = ChatResponse(
            response=response_data["response"],
            conversation_id=conversation_id,
            intent=intent,
            confidence=confidence,
            suggestions=response_data.get("suggestions", []),
            quick_actions=response_data.get("quick_actions", []),
            timestamp=datetime.utcnow().isoformat()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}"
        )

@router.get("/conversations")
async def get_conversations(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get user's conversation history
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID not found"
            )
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Get user's conversations from database
        conversations = await chat_db.get_user_conversations(user_id, limit=20)
        
        # Format conversations for response
        formatted_conversations = []
        for conv in conversations:
            formatted_conv = {
                "conversation_id": conv["conversation_id"],
                "created_at": conv["created_at"].isoformat(),
                "updated_at": conv["updated_at"].isoformat(),
                "message_count": conv["metadata"]["total_messages"],
                "intents_used": conv["metadata"]["intents_used"],
                "last_message": conv["messages"][-1]["message"] if conv["messages"] else None
            }
            formatted_conversations.append(formatted_conv)
        
        return {
            "success": True,
            "conversations": formatted_conversations,
            "user_id": user_id,
            "total_conversations": len(formatted_conversations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversations: {str(e)}"
        )

@router.get("/suggestions")
async def get_chat_suggestions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get suggested questions for the chat bot from database
    """
    try:
        user_role = current_user.get("role", "")
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Get suggestions from database based on user role
        db_suggestions = await chat_db.get_suggestions_by_role(user_role)
        
        # Format suggestions for response
        formatted_suggestions = []
        for suggestion in db_suggestions:
            formatted_suggestions.append({
                "id": str(suggestion["_id"]),
                "text": suggestion["text"],
                "category": suggestion["category"],
                "priority": suggestion["priority"],
                "usage_count": suggestion["usage_count"]
            })
        
        # Sort by priority and usage count
        formatted_suggestions.sort(key=lambda x: (x["priority"], -x["usage_count"]))
        
        # Extract just the text for backward compatibility
        suggestion_texts = [s["text"] for s in formatted_suggestions]
        
        return {
            "success": True,
            "suggestions": suggestion_texts,
            "detailed_suggestions": formatted_suggestions,
            "user_role": user_role,
            "total_suggestions": len(formatted_suggestions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        # Fallback to hardcoded suggestions if database fails
        print(f"Error loading suggestions from database: {e}")
        
        # Role-based suggestions (Bilingual: English and Thai) - Fallback
        suggestions = {
            "general": [
                "How do I start a vision screening? / วิธีเริ่มการตรวจสายตา?",
                "Where can I find student information? / หาข้อมูลนักเรียนได้ที่ไหน?",
                "How do I check inventory status? / ตรวจสอบสถานะคลังสินค้ายังไง?",
                "What reports are available? / มีรายงานอะไรบ้าง?"
            ],
            "medical": [
                "How do I interpret screening results? / ตีความผลการตรวจยังไง?",
                "What are the screening procedures? / ขั้นตอนการตรวจมีอะไรบ้าง?",
                "How do I access patient records? / เข้าถึงประวัติผู้ป่วยยังไง?",
                "What equipment do I need for screening? / ต้องใช้อุปกรณ์อะไรในการตรวจ?"
            ],
            "admin": [
                "How do I manage user permissions? / จัดการสิทธิ์ผู้ใช้ยังไง?",
                "Where can I view system analytics? / ดูการวิเคราะห์ระบบได้ที่ไหน?",
                "How do I generate reports? / สร้างรายงานยังไง?",
                "What are the system settings? / การตั้งค่าระบบมีอะไรบ้าง?"
            ]
        }
        
        # Select suggestions based on user role
        if user_role in ["doctor", "nurse", "medical_staff"]:
            selected_suggestions = suggestions["medical"]
        elif user_role in ["admin", "super_admin"]:
            selected_suggestions = suggestions["admin"]
        else:
            selected_suggestions = suggestions["general"]
        
        return {
            "success": True,
            "suggestions": selected_suggestions,
            "user_role": user_role,
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/analytics")
async def get_chat_analytics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get chat bot analytics and usage statistics
    """
    try:
        user_id = current_user.get("user_id")
        user_role = current_user.get("role")
        
        # Only allow admins to view analytics
        if user_role not in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view analytics"
            )
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Get conversation analytics
        conversation_analytics = await chat_db.get_conversation_analytics()
        
        # Get intent usage statistics
        intent_stats = await chat_db.get_intent_usage_stats()
        
        return {
            "success": True,
            "analytics": {
                "conversations": conversation_analytics,
                "intent_usage": intent_stats
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving analytics: {str(e)}"
        )

@router.post("/feedback")
async def submit_chat_feedback(
    learning_id: str,
    feedback: str,
    satisfaction_score: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submit feedback for chat bot responses to improve AI/ML learning
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID not found"
            )
        
        # Validate satisfaction score
        if satisfaction_score is not None and (satisfaction_score < 1 or satisfaction_score > 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Satisfaction score must be between 1 and 5"
            )
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Update learning data with feedback
        success = await chat_db.update_user_feedback(learning_id, feedback, satisfaction_score)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning record not found"
            )
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "learning_id": learning_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting feedback: {str(e)}"
        )

@router.post("/ai-agent")
async def chat_with_ai_agent(
    chat_message: ChatMessage,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Chat with specialized AI agent based on user type
    
    This endpoint provides intelligent responses using OpenAI GPT-4
    with specialized agents for different user types in the EVEP Medical Portal.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        user_id = current_user.get("user_id", "")
        if not user_role or not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role or ID not found"
            )
        
        # Map user role to UserType enum
        user_type_mapping = {
            "parent": UserType.PARENT,
            "teacher": UserType.TEACHER,
            "doctor": UserType.DOCTOR,
            "nurse": UserType.NURSE,
            "optometrist": UserType.OPTOMETRIST,
            "medical_staff": UserType.MEDICAL_STAFF,
            "hospital_staff": UserType.HOSPITAL_STAFF,
            "hospital_exclusive": UserType.HOSPITAL_EXCLUSIVE,
            "medical_admin": UserType.MEDICAL_ADMIN,
            "system_admin": UserType.SYSTEM_ADMIN,
            "super_admin": UserType.SUPER_ADMIN,
            "admin": UserType.SUPER_ADMIN,  # Map admin to super_admin
            "executive": UserType.EXECUTIVE
        }
        
        user_type = user_type_mapping.get(user_role, UserType.PARENT)
        
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Get conversation history if available
        conversation_history = []
        if chat_message.conversation_id and chat_db:
            try:
                conversation = await chat_db.get_conversation(chat_message.conversation_id)
                if conversation:
                    conversation_history = conversation.get("messages", [])
            except Exception as e:
                print(f"Error retrieving conversation history: {e}")
        
        # Get AI agent response
        agent_response = await agent_manager.get_agent_response(
            user_type=user_type,
            message=chat_message.message,
            context=chat_message.context,
            conversation_history=conversation_history
        )
        
        # Generate conversation ID if not provided
        conversation_id = chat_message.conversation_id or f"ai_conv_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}"
        
        # Store conversation if database is available
        if chat_db:
            try:
                # Check if conversation exists, create if not
                conversation = await chat_db.get_conversation(conversation_id)
                if not conversation:
                    await chat_db.create_conversation(user_id, conversation_id)
                
                # Add user message to conversation
                await chat_db.add_message_to_conversation(
                    conversation_id=conversation_id,
                    message=chat_message.message,
                    is_user=True,
                    metadata={"user_role": user_role, "agent_type": "ai_agent"}
                )
                
                # Add AI response to conversation
                await chat_db.add_message_to_conversation(
                    conversation_id=conversation_id,
                    message=agent_response["response"],
                    is_user=False,
                    intent="ai_agent_response",
                    confidence=agent_response.get("confidence", 0.8),
                    metadata={
                        "agent_type": agent_response.get("agent_type", "ai_agent"),
                        "model": agent_response.get("model", "gpt-4"),
                        "fallback_mode": agent_response.get("fallback_mode", False)
                    }
                )
                
                # Store learning data for AI/ML
                await chat_db.store_learning_data(
                    user_id=user_id,
                    message=chat_message.message,
                    response=agent_response["response"],
                    intent=agent_response.get("intent", "ai_agent_response"),
                    confidence=agent_response.get("confidence", 0.8),
                    agent_type=agent_response.get("agent_type", "unknown")
                )
                
                # Store conversation turn for detailed learning
                await chat_db.store_conversation_turn(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    user_message=chat_message.message,
                    bot_response=agent_response["response"],
                    agent_type=agent_response.get("agent_type", "unknown"),
                    intent=agent_response.get("intent", "ai_agent_response"),
                    confidence=agent_response.get("confidence", 0.8)
                )
                
            except Exception as e:
                print(f"Error storing conversation: {e}")
        
        # Create response
        response = ChatResponse(
            response=agent_response["response"],
            conversation_id=conversation_id,
            intent="ai_agent_response",
            confidence=agent_response.get("confidence", 0.8),
            suggestions=[],  # AI agents provide contextual responses
            quick_actions=[],  # AI agents provide contextual actions
            timestamp=datetime.utcnow().isoformat()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing AI agent message: {str(e)}"
        )

@router.get("/health")
async def chat_bot_health_check():
    """
    Health check for chat bot service
    """
    try:
        # Get chat database instance
        chat_db = get_chat_database()
        
        # Get counts from database
        intent_patterns = await chat_db.get_intent_patterns()
        suggestions = await chat_db.get_suggestions_by_role("all")
        
        return {
            "status": "healthy",
            "service": "Chat Bot",
            "database_connected": True,
            "intents_available": len(intent_patterns),
            "suggestions_available": len(suggestions),
            "features": {
                "conversation_storage": True,
                "intent_recognition": True,
                "response_templates": True,
                "learning_data": True,
                "analytics": True,
                "feedback_system": True
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "service": "Chat Bot",
            "database_connected": False,
            "error": str(e),
            "fallback_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/analytics")
async def get_chat_analytics(
    days: int = 30,
    user_id: Optional[str] = None,
    agent_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get chat analytics for learning insights (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin", "medical_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access analytics"
            )
        
        chat_db = get_chat_database()
        if chat_db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Get conversation analytics
        analytics = await chat_db.get_conversation_analytics(
            user_id=user_id,
            agent_type=agent_type,
            days=days
        )
        
        if analytics is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve analytics"
            )
        
        return {
            "analytics": analytics,
            "timestamp": datetime.utcnow().isoformat(),
            "requested_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics error: {str(e)}"
        )

@router.get("/performance")
async def get_ai_performance_metrics(
    current_user: dict = Depends(get_current_user)
):
    """Get AI agent performance metrics (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin", "medical_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access performance metrics"
            )
        
        # Get database-based AI agent manager instance
        from app.modules.ai_agents.database_agent_manager import database_agent_manager
        agent_manager = database_agent_manager
        
        # Get performance metrics
        performance_metrics = agent_manager.get_performance_metrics()
        
        return {
            "performance_metrics": performance_metrics,
            "timestamp": datetime.utcnow().isoformat(),
            "requested_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance metrics error: {str(e)}"
        )

@router.post("/cache/clear")
async def clear_ai_cache(
    current_user: dict = Depends(get_current_user)
):
    """Clear AI agent response cache (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to clear cache"
            )
        
        # Get database-based AI agent manager instance
        from app.modules.ai_agents.database_agent_manager import database_agent_manager
        agent_manager = database_agent_manager
        
        # Clear cache
        agent_manager.clear_cache()
        
        return {
            "message": "AI agent cache cleared successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "cleared_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cache clear error: {str(e)}"
        )

@router.get("/agent-configs")
async def get_agent_configurations(
    current_user: dict = Depends(get_current_user)
):
    """Get all AI agent configurations (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access agent configurations"
            )
        
        chat_db = get_chat_database()
        if chat_db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Get all agent configurations
        configs = await chat_db.get_all_agent_configs()
        
        return {
            "agent_configurations": configs,
            "total_configs": len(configs),
            "timestamp": datetime.utcnow().isoformat(),
            "requested_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent configs error: {str(e)}"
        )

@router.put("/agent-configs/{agent_type}")
async def update_agent_configuration(
    agent_type: str,
    config_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update AI agent configuration (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update agent configurations"
            )
        
        chat_db = get_chat_database()
        if chat_db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Update agent configuration
        success = await chat_db.update_agent_config(agent_type, config_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update agent configuration"
            )
        
        # Reload agent configurations
        from app.modules.ai_agents.database_agent_manager import database_agent_manager
        await database_agent_manager.reload_agent_configs()
        
        return {
            "message": f"Agent configuration '{agent_type}' updated successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent config update error: {str(e)}"
        )

@router.post("/agent-configs/reload")
async def reload_agent_configurations(
    current_user: dict = Depends(get_current_user)
):
    """Reload AI agent configurations from database (Admin only)"""
    try:
        # Check if user has admin privileges
        if current_user.get("role") not in ["super_admin", "system_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to reload agent configurations"
            )
        
        # Reload agent configurations
        from app.modules.ai_agents.database_agent_manager import database_agent_manager
        await database_agent_manager.reload_agent_configs()
        
        return {
            "message": "Agent configurations reloaded successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "reloaded_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent config reload error: {str(e)}"
        )

@router.get("/vector-learning/analytics")
async def get_vector_learning_analytics(
    user_id: Optional[str] = None,
    user_type: Optional[str] = None,
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get vector learning analytics (Admin only)"""
    try:
        # Check if user is admin
        if current_user.get("role") not in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get vector learning analytics
        analytics = await vector_learning_system.get_learning_analytics(
            user_id=user_id,
            user_type=user_type,
            days=days
        )
        
        return {
            "analytics": analytics,
            "timestamp": datetime.utcnow().isoformat(),
            "requested_by": current_user.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting vector learning analytics: {str(e)}"
        )

@router.get("/vector-learning/user-preferences/{user_id}")
async def get_user_preferences(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user preferences for personalization"""
    try:
        # Check if user can access this data
        if current_user.get("user_id") != user_id and current_user.get("role") not in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get user preferences
        preferences = await vector_learning_system.get_user_preferences(
            user_id=user_id,
            user_type=current_user.get("role", "user")
        )
        
        return {
            "user_id": user_id,
            "preferences": preferences,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting user preferences: {str(e)}"
        )

@router.get("/vector-learning/similar-behavior")
async def get_similar_user_behavior(
    user_type: str,
    message: str,
    n_results: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """Get similar user behavior patterns for learning"""
    try:
        # Get similar behavior patterns
        similar_behaviors = await vector_learning_system.get_similar_user_behavior(
            user_type=user_type,
            message=message,
            n_results=n_results
        )
        
        return {
            "user_type": user_type,
            "message": message,
            "similar_behaviors": similar_behaviors,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting similar user behavior: {str(e)}"
        )

@router.get("/vector-learning/effective-responses")
async def get_effective_responses(
    user_type: str,
    message: str,
    n_results: int = 3,
    current_user: dict = Depends(get_current_user)
):
    """Get effective responses for similar messages"""
    try:
        # Get effective responses
        effective_responses = await vector_learning_system.get_effective_responses(
            user_type=user_type,
            message=message,
            n_results=n_results
        )
        
        return {
            "user_type": user_type,
            "message": message,
            "effective_responses": effective_responses,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting effective responses: {str(e)}"
        )
