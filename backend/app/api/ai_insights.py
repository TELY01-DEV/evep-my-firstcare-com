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
from pydantic import BaseModel

router = APIRouter(prefix="/ai-insights", tags=["AI Insights"])

# Initialize insight generator
insight_generator = InsightGenerator()

class ScreeningInsightRequest(BaseModel):
    """Request model for generating screening insights"""
    screening_data: Dict[str, Any]
    patient_info: Optional[Dict[str, Any]] = None
    role: str = "doctor"
    insight_type: str = "screening_analysis"

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
        if user_role not in ["admin", "doctor", "medical_staff", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to generate AI insights"
            )
        
        # Generate insight
        insight = await insight_generator.generate_screening_insight(
            screening_data=request.screening_data,
            patient_info=request.patient_info,
            role=request.role,
            insight_type=request.insight_type
        )
        
        if not insight.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate insight: {insight.get('error', 'Unknown error')}"
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
            detail=f"Error generating screening insight: {str(e)}"
        )

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
        if user_role not in ["admin", "doctor", "medical_staff"]:
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
        if user_role not in ["admin", "executive"]:
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
        if user_role not in ["admin", "doctor", "medical_staff", "teacher"]:
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
        if user_role not in ["admin", "medical_staff", "doctor"]:
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
        if user_role not in ["admin", "executive"]:
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
        if user_role not in ["admin", "doctor", "medical_staff", "teacher"]:
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
