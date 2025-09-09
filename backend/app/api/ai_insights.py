"""
AI Insights API endpoints for EVEP Platform

This module provides API endpoints for generating and managing AI-powered insights.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.api.auth import get_current_user
from app.modules.ai_insights import InsightGenerator
from app.models.evep_models import PyObjectId
from app.core.database import get_ai_insights_collection
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/ai-insights", tags=["AI Insights"])

# Initialize insight generator
insight_generator = InsightGenerator()

@router.get("/health")
async def ai_insights_health_check():
    """
    Health check for AI Insights service
    
    This endpoint checks if the AI Insights service is properly configured.
    """
    import os
    
    # Check OpenAI API key
    openai_key = os.getenv("OPENAI_API_KEY", "")
    openai_configured = bool(openai_key and openai_key != "your-openai-api-key-here")
    
    # Check other dependencies
    try:
        # Test if modules can be imported
        from app.modules.ai_insights import LLMService, PromptManager, VectorStore
        modules_available = True
    except ImportError as e:
        modules_available = False
        module_error = str(e)
    
    status = "healthy" if (openai_configured and modules_available) else "degraded"
    
    return {
        "status": status,
        "service": "AI Insights",
        "openai_configured": openai_configured,
        "modules_available": modules_available,
        "timestamp": datetime.utcnow().isoformat(),
        "note": "Service is functional with fallback mechanisms" if not openai_configured else "Service is fully operational"
    }

class ScreeningInsightRequest(BaseModel):
    """Request model for generating screening insights"""
    screening_data: Dict[str, Any]
    patient_info: Optional[Dict[str, Any]] = None
    role: str = "doctor"
    insight_type: str = "screening_analysis"
    language: str = "en"  # Default to English

class BatchInsightRequest(BaseModel):
    """Request model for generating batch insights"""
    screening_data_list: List[Dict[str, Any]]
    role: str = "doctor"
    insight_type: str = "screening_analysis"

class TrendAnalysisRequest(BaseModel):
    """Request model for generating trend analysis"""
    program_data: Dict[str, Any]
    role: str = "executive"

class InsightSearchRequest(BaseModel):
    """Request model for searching insights"""
    query: str
    role: Optional[str] = None
    insight_type: Optional[str] = None
    n_results: int = 5

class MobileUnitInsightRequest(BaseModel):
    """Request model for mobile unit insights"""
    mobile_screening_data: Dict[str, Any]
    patient_info: Optional[Dict[str, Any]] = None

class AIInsightDocument(BaseModel):
    """MongoDB document model for AI insights"""
    insight_id: str
    screening_id: Optional[str] = None
    patient_id: Optional[str] = None
    user_id: str
    user_role: str
    role: str
    insight_type: str
    language: str
    content: str
    recommendations: List[str] = []
    confidence: float = 0.0
    model_used: str = ""
    template_used: str = ""
    success: bool = True
    error_message: Optional[str] = None
    screening_data: Dict[str, Any] = {}
    patient_info: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

async def save_insight_to_mongodb(insight_data: Dict[str, Any], current_user: Dict[str, Any], request: ScreeningInsightRequest) -> str:
    """Save AI insight to MongoDB"""
    try:
        collection = get_ai_insights_collection()
        
        # Create insight document
        insight_doc = {
            "insight_id": insight_data.get("insight_id", f"insight_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
            "screening_id": request.screening_data.get("screening_id"),
            "patient_id": request.screening_data.get("patient_id") or request.patient_info.get("patient_id") if request.patient_info else None,
            "user_id": current_user.get("user_id", current_user.get("id")),
            "user_role": current_user.get("role", "user"),
            "role": request.role,
            "insight_type": request.insight_type,
            "language": request.language,
            "content": insight_data.get("content", ""),
            "recommendations": insight_data.get("recommendations", []),
            "confidence": insight_data.get("confidence", 0.0),
            "model_used": insight_data.get("model", ""),
            "template_used": insight_data.get("template_used", ""),
            "success": insight_data.get("success", True),
            "error_message": insight_data.get("error"),
            "screening_data": request.screening_data,
            "patient_info": request.patient_info,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = collection.insert_one(insight_doc)
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error saving insight to MongoDB: {e}")
        return None

@router.post("/generate-screening-insight")
async def generate_screening_insight(
    request: ScreeningInsightRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate AI insight for a screening result
    
    This endpoint generates role-based insights for vision screening results.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "doctor", "medical_staff", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate AI insights"
            )
        
        # Prepare patient info with defaults if missing
        patient_info = request.patient_info or {}
        patient_info.setdefault("patient_name", "Unknown Patient")
        patient_info.setdefault("patient_age", "Unknown")
        patient_info.setdefault("patient_gender", "Unknown")
        
        # Check if OpenAI API key is configured
        import os
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if not openai_key or openai_key == "your-openai-api-key-here":
            # Return mock insight when API key is not configured
            return {
                "success": True,
                "insight": {
                    "type": "mock_insight",
                    "content": f"AI Insights service is not configured. This is a mock insight for {user_role} role.",
                    "recommendations": [
                        "Configure OpenAI API key to enable AI insights",
                        "Contact system administrator for setup"
                    ],
                    "confidence": 0.0,
                    "generated_at": datetime.utcnow().isoformat()
                },
                "generated_by": current_user.get("user_id"),
                "timestamp": datetime.utcnow().isoformat(),
                "note": "Mock insight - OpenAI API key not configured"
            }
        
        # Generate insight
        insight = await insight_generator.generate_screening_insight(
            screening_data=request.screening_data,
            patient_info=patient_info,
            role=request.role,
            insight_type=request.insight_type,
            language=request.language
        )
        
        if not insight.get("success", False):
            # Return fallback insight instead of error
            return {
                "success": True,
                "insight": {
                    "type": "fallback_insight",
                    "content": f"AI service temporarily unavailable. Basic analysis for {user_role} role.",
                    "recommendations": [
                        "Review screening data manually",
                        "Contact AI service administrator"
                    ],
                    "confidence": 0.5,
                    "generated_at": datetime.utcnow().isoformat(),
                    "error": insight.get('error', 'Unknown error')
                },
                "generated_by": current_user.get("user_id"),
                "timestamp": datetime.utcnow().isoformat(),
                "note": "Fallback insight - AI service error"
            }
        
        # Save insight to MongoDB
        mongo_id = await save_insight_to_mongodb(insight, current_user, request)
        
        return {
            "success": True,
            "insight": insight,
            "generated_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat(),
            "mongo_id": mongo_id,
            "saved_to_database": bool(mongo_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Return fallback insight instead of error
        return {
            "success": True,
            "insight": {
                "type": "error_fallback",
                "content": f"AI Insights service encountered an error. Basic analysis for {current_user.get('role', 'user')} role.",
                "recommendations": [
                    "Review screening data manually",
                    "Contact system administrator"
                ],
                "confidence": 0.3,
                "generated_at": datetime.utcnow().isoformat(),
                "error": str(e)
            },
            "generated_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Fallback insight - Service error"
        }

@router.post("/generate-batch-insights")
async def generate_batch_insights(
    request: BatchInsightRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate AI insights for multiple screening results
    
    This endpoint generates insights for a batch of screening results.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "doctor", "medical_staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate batch insights"
            )
        
        # Generate batch insights
        insights = await insight_generator.generate_batch_insights(
            screening_data_list=request.screening_data_list,
            role=request.role,
            insight_type=request.insight_type
        )
        
        successful_insights = [insight for insight in insights if insight.get("success", False)]
        failed_insights = [insight for insight in insights if not insight.get("success", False)]
        
        return {
            "success": True,
            "total_insights": len(insights),
            "successful_insights": len(successful_insights),
            "failed_insights": len(failed_insights),
            "insights": insights,
            "generated_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating batch insights: {str(e)}"
        )

@router.post("/generate-trend-analysis")
async def generate_trend_analysis(
    request: TrendAnalysisRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate trend analysis for program data
    
    This endpoint generates strategic insights for program data analysis.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "executive"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate trend analysis"
            )
        
        # Generate trend analysis
        analysis = await insight_generator.generate_trend_analysis(
            program_data=request.program_data,
            role=request.role
        )
        
        if not analysis.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate trend analysis: {analysis.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "analysis": analysis,
            "generated_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating trend analysis: {str(e)}"
        )

@router.post("/search-insights")
async def search_insights(
    request: InsightSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Search for existing AI insights
    
    This endpoint searches for previously generated insights.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "doctor", "medical_staff", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to search insights"
            )
        
        # Search insights
        results = await insight_generator.search_insights(
            query=request.query,
            role=request.role,
            insight_type=request.insight_type,
            n_results=request.n_results
        )
        
        return {
            "success": True,
            "query": request.query,
            "results_count": len(results),
            "results": results,
            "searched_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching insights: {str(e)}"
        )

@router.post("/generate-mobile-unit-insight")
async def generate_mobile_unit_insight(
    request: MobileUnitInsightRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate AI insight for mobile unit screening
    
    This endpoint generates insights specifically for mobile unit screenings.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "medical_staff", "doctor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate mobile unit insights"
            )
        
        # Generate mobile unit insight
        insight = await insight_generator.generate_mobile_unit_insight(
            mobile_screening_data=request.mobile_screening_data,
            patient_info=request.patient_info
        )
        
        if not insight.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate mobile unit insight: {insight.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "insight": insight,
            "generated_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating mobile unit insight: {str(e)}"
        )

@router.get("/statistics")
async def get_insight_statistics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI insights statistics
    
    This endpoint provides statistics about generated insights and system usage.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "executive"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view insight statistics"
            )
        
        # Get statistics
        stats = insight_generator.get_insight_statistics()
        
        return {
            "success": True,
            "statistics": stats,
            "requested_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting insight statistics: {str(e)}"
        )

@router.get("/templates")
async def get_prompt_templates(
    role: Optional[str] = None,
    insight_type: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get available prompt templates
    
    This endpoint returns available prompt templates for AI insights.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "super_admin", "doctor", "medical_staff", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view prompt templates"
            )
        
        # Get templates based on filters
        if role:
            templates = insight_generator.prompt_manager.get_templates_by_role(role)
        elif insight_type:
            templates = insight_generator.prompt_manager.get_templates_by_insight_type(insight_type)
        else:
            templates = list(insight_generator.prompt_manager.templates.values())
        
        # Convert to serializable format
        template_data = []
        for template in templates:
            template_dict = template.dict()
            template_dict["created_at"] = template_dict["created_at"].isoformat()
            template_dict["updated_at"] = template_dict["updated_at"].isoformat()
            template_data.append(template_dict)
        
        return {
            "success": True,
            "templates": template_data,
            "total_templates": len(template_data),
            "filters": {
                "role": role,
                "insight_type": insight_type
            },
            "requested_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting prompt templates: {str(e)}"
        )

@router.get("/health")
async def ai_insights_health_check(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Health check for AI insights system
    
    This endpoint checks the health of the AI insights components.
    """
    try:
        # Check LLM service
        llm_healthy = (
            insight_generator.llm_service.openai_client is not None or
            insight_generator.llm_service.claude_client is not None
        )
        
        # Check prompt manager
        prompt_healthy = len(insight_generator.prompt_manager.templates) > 0
        
        # Check vector store
        vector_healthy = insight_generator.vector_store.chroma_client is not None
        
        overall_healthy = llm_healthy and prompt_healthy and vector_healthy
        
        return {
            "success": True,
            "healthy": overall_healthy,
            "components": {
                "llm_service": llm_healthy,
                "prompt_manager": prompt_healthy,
                "vector_store": vector_healthy
            },
            "checked_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "healthy": False,
            "error": str(e),
            "checked_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/insights")
async def get_saved_insights(
    current_user: Dict[str, Any] = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
    role: Optional[str] = None,
    insight_type: Optional[str] = None,
    language: Optional[str] = None
):
    """
    Retrieve saved AI insights from MongoDB
    """
    try:
        collection = get_ai_insights_collection()
        
        # Build query filter
        query_filter = {
            "user_id": current_user.get("user_id", current_user.get("id"))
        }
        
        if role:
            query_filter["role"] = role
        if insight_type:
            query_filter["insight_type"] = insight_type
        if language:
            query_filter["language"] = language
        
        # Get insights with pagination
        cursor = collection.find(query_filter).sort("created_at", -1).skip(offset).limit(limit)
        insights = list(cursor)
        
        # Convert ObjectId to string
        for insight in insights:
            insight["_id"] = str(insight["_id"])
            if "created_at" in insight:
                insight["created_at"] = insight["created_at"].isoformat()
            if "updated_at" in insight:
                insight["updated_at"] = insight["updated_at"].isoformat()
        
        # Get total count
        total_count = collection.count_documents(query_filter)
        
        return {
            "success": True,
            "insights": insights,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving insights: {str(e)}"
        )

@router.get("/insights/{insight_id}")
async def get_insight_by_id(
    insight_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve a specific AI insight by ID
    """
    try:
        collection = get_ai_insights_collection()
        
        # Find insight by ID and user
        insight = collection.find_one({
            "_id": ObjectId(insight_id),
            "user_id": current_user.get("user_id", current_user.get("id"))
        })
        
        if not insight:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insight not found"
            )
        
        # Convert ObjectId to string
        insight["_id"] = str(insight["_id"])
        if "created_at" in insight:
            insight["created_at"] = insight["created_at"].isoformat()
        if "updated_at" in insight:
            insight["updated_at"] = insight["updated_at"].isoformat()
        
        return {
            "success": True,
            "insight": insight
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving insight: {str(e)}"
        )
