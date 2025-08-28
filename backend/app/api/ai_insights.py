from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.database import get_database
from app.api.auth import get_current_user
from app.utils.blockchain import generate_blockchain_hash
from app.utils.timezone import get_current_thailand_time

router = APIRouter()

# Pydantic models for AI insights
class InsightRequest(BaseModel):
    insight_type: str  # 'patient_analysis', 'screening_trends', 'risk_assessment', 'recommendations'
    patient_id: Optional[str] = None
    date_range: Optional[str] = None  # '7d', '30d', '90d', '1y'
    context: Optional[Dict[str, Any]] = None

class AIInsight(BaseModel):
    insight_id: str
    insight_type: str
    title: str
    description: str
    confidence_score: float
    recommendations: List[str]
    risk_level: Optional[str] = None
    data_points: Dict[str, Any]
    generated_at: str
    expires_at: Optional[str] = None

class InsightResponse(BaseModel):
    insights: List[AIInsight]
    summary: str
    next_actions: List[str]

# Mock LLM integration (replace with actual OpenAI/Claude API)
class MockLLMService:
    def __init__(self):
        self.model_name = "gpt-4"  # or "claude-3-sonnet"
        self.api_key = settings.OPENAI_API_KEY if hasattr(settings, 'OPENAI_API_KEY') else "mock_key"
    
    async def generate_insight(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI insight using LLM"""
        # Simulate API call delay
        await asyncio.sleep(0.5)
        
        # Mock responses based on insight type
        if "patient_analysis" in prompt.lower():
            return {
                "insight": "Patient shows consistent vision improvement over the last 3 screenings",
                "confidence": 0.85,
                "recommendations": [
                    "Continue current treatment plan",
                    "Schedule follow-up in 6 months",
                    "Monitor for any regression"
                ],
                "risk_level": "low"
            }
        elif "screening_trends" in prompt.lower():
            return {
                "insight": "Class 3A shows 15% improvement in average vision scores",
                "confidence": 0.92,
                "recommendations": [
                    "Continue current screening program",
                    "Consider expanding to other classes",
                    "Share best practices with other schools"
                ],
                "risk_level": "none"
            }
        elif "risk_assessment" in prompt.lower():
            return {
                "insight": "Patient shows early signs of myopia progression",
                "confidence": 0.78,
                "recommendations": [
                    "Increase outdoor activity time",
                    "Limit screen time to 2 hours per day",
                    "Schedule comprehensive eye exam"
                ],
                "risk_level": "medium"
            }
        else:
            return {
                "insight": "General recommendation based on screening data",
                "confidence": 0.75,
                "recommendations": [
                    "Continue regular screenings",
                    "Maintain healthy eye habits"
                ],
                "risk_level": "low"
            }

# Initialize LLM service
llm_service = MockLLMService()

@router.post("/insights/generate", response_model=InsightResponse)
async def generate_insights(
    request: InsightRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate AI insights based on request type and context"""
    try:
        # Validate user permissions
        if current_user["role"] not in ["admin", "doctor", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate AI insights"
            )
        
        # Get relevant data based on insight type
        data_context = await get_data_context(request, current_user, db)
        
        # Generate prompt based on insight type and user role
        prompt = generate_prompt(request.insight_type, current_user["role"], data_context)
        
        # Get AI insight
        ai_response = await llm_service.generate_insight(prompt, data_context)
        
        # Create insight object
        insight = AIInsight(
            insight_id=generate_blockchain_hash(f"insight_{request.insight_type}_{current_user['user_id']}"),
            insight_type=request.insight_type,
            title=f"{request.insight_type.replace('_', ' ').title()} Analysis",
            description=ai_response["insight"],
            confidence_score=ai_response["confidence"],
            recommendations=ai_response["recommendations"],
            risk_level=ai_response.get("risk_level"),
            data_points=data_context,
            generated_at=get_current_thailand_time().isoformat(),
            expires_at=(get_current_thailand_time() + timedelta(days=30)).isoformat()
        )
        
        # Store insight in database
        await store_insight(insight, current_user["user_id"], db)
        
        # Generate summary and next actions
        summary = f"Generated {request.insight_type.replace('_', ' ')} insight with {ai_response['confidence']:.0%} confidence"
        next_actions = ai_response["recommendations"][:3]  # Top 3 recommendations
        
        return InsightResponse(
            insights=[insight],
            summary=summary,
            next_actions=next_actions
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )

@router.get("/insights/history", response_model=List[AIInsight])
async def get_insight_history(
    insight_type: Optional[str] = None,
    limit: int = 10,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get historical AI insights"""
    try:
        # Build query
        query = {"user_id": current_user["user_id"]}
        if insight_type:
            query["insight_type"] = insight_type
        
        # Get insights from database
        insights_collection = db["ai_insights"]
        cursor = insights_collection.find(query).sort("generated_at", -1).limit(limit)
        
        insights = []
        async for doc in cursor:
            insights.append(AIInsight(**doc))
        
        return insights
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve insight history: {str(e)}"
        )

@router.get("/insights/analytics")
async def get_insight_analytics(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get analytics about AI insights usage"""
    try:
        insights_collection = db["ai_insights"]
        
        # Get insights by type
        pipeline = [
            {"$match": {"user_id": current_user["user_id"]}},
            {"$group": {
                "_id": "$insight_type",
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence_score"}
            }}
        ]
        
        analytics = []
        async for doc in insights_collection.aggregate(pipeline):
            analytics.append({
                "insight_type": doc["_id"],
                "count": doc["count"],
                "avg_confidence": round(doc["avg_confidence"], 2)
            })
        
        return {
            "total_insights": sum(a["count"] for a in analytics),
            "insights_by_type": analytics,
            "user_role": current_user["role"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analytics: {str(e)}"
        )

async def get_data_context(request: InsightRequest, user: Dict, db) -> Dict[str, Any]:
    """Get relevant data context for AI analysis"""
    context = {
        "user_role": user["role"],
        "organization": user.get("organization"),
        "date_range": request.date_range or "30d"
    }
    
    if request.patient_id:
        # Get patient-specific data
        patients_collection = db["patients"]
        screenings_collection = db["screenings"]
        
        # Get patient info
        patient = await patients_collection.find_one({"_id": request.patient_id})
        if patient:
            context["patient"] = {
                "name": f"{patient['first_name']} {patient['last_name']}",
                "age": calculate_age(patient["date_of_birth"]),
                "school": patient["school"],
                "grade": patient["grade"]
            }
        
        # Get patient screenings
        screenings = []
        async for screening in screenings_collection.find({"patient_id": request.patient_id}):
            screenings.append({
                "date": screening["created_at"],
                "results": screening.get("results", {}),
                "status": screening["status"]
            })
        context["patient_screenings"] = screenings
    
    # Get general statistics based on user role
    if user["role"] in ["admin", "doctor"]:
        context["statistics"] = await get_general_statistics(db, user)
    
    return context

async def get_general_statistics(db, user: Dict) -> Dict[str, Any]:
    """Get general statistics for AI context"""
    patients_collection = db["patients"]
    screenings_collection = db["screenings"]
    
    # Get counts
    total_patients = await patients_collection.count_documents({})
    total_screenings = await screenings_collection.count_documents({})
    
    # Get recent screenings
    recent_screenings = []
    async for screening in screenings_collection.find().sort("created_at", -1).limit(10):
        recent_screenings.append({
            "patient_id": screening["patient_id"],
            "status": screening["status"],
            "date": screening["created_at"]
        })
    
    return {
        "total_patients": total_patients,
        "total_screenings": total_screenings,
        "recent_screenings": recent_screenings
    }

def generate_prompt(insight_type: str, user_role: str, context: Dict[str, Any]) -> str:
    """Generate appropriate prompt for LLM based on insight type and user role"""
    
    base_prompts = {
        "patient_analysis": """
        Analyze the patient's vision screening history and provide insights about:
        1. Vision trends and progression
        2. Risk factors and potential issues
        3. Recommendations for care and follow-up
        4. Comparison with age-appropriate benchmarks
        
        Patient context: {patient_info}
        Screening history: {screenings}
        """,
        
        "screening_trends": """
        Analyze screening trends and patterns to identify:
        1. Overall vision health trends
        2. Common issues or improvements
        3. Effectiveness of screening programs
        4. Recommendations for program optimization
        
        Statistics: {statistics}
        Recent screenings: {recent_screenings}
        """,
        
        "risk_assessment": """
        Assess potential vision health risks and provide:
        1. Risk level assessment
        2. Contributing factors
        3. Preventive measures
        4. Monitoring recommendations
        
        Patient data: {patient_info}
        Screening results: {screenings}
        """,
        
        "recommendations": """
        Generate personalized recommendations for:
        1. Patient care and treatment
        2. Screening frequency
        3. Lifestyle modifications
        4. Follow-up actions
        
        Context: {context}
        User role: {user_role}
        """
    }
    
    prompt_template = base_prompts.get(insight_type, base_prompts["recommendations"])
    
    return prompt_template.format(
        patient_info=context.get("patient", "No patient data"),
        screenings=context.get("patient_screenings", []),
        statistics=context.get("statistics", {}),
        recent_screenings=context.get("statistics", {}).get("recent_screenings", []),
        context=context,
        user_role=user_role
    )

async def store_insight(insight: AIInsight, user_id: str, db):
    """Store AI insight in database"""
    insights_collection = db["ai_insights"]
    
    insight_data = insight.dict()
    insight_data["user_id"] = user_id
    insight_data["created_at"] = get_current_thailand_time().isoformat()
    
    await insights_collection.insert_one(insight_data)

def calculate_age(date_of_birth: str) -> int:
    """Calculate age from date of birth"""
    try:
        birth_date = datetime.fromisoformat(date_of_birth.replace('Z', '+00:00'))
        today = datetime.now(birth_date.tzinfo)
        age = today.year - birth_date.year
        if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        return age
    except:
        return 0
