"""
Insights API endpoints for AI/ML Service
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import structlog

from app.core.logging import log_request, log_response, log_error

logger = structlog.get_logger()

router = APIRouter()

# Request/Response Models
class InsightRequest(BaseModel):
    """Request model for generating insights"""
    screening_data: Dict[str, Any]
    patient_info: Optional[Dict[str, Any]] = None
    role: str = "doctor"
    insight_type: str = "screening_analysis"

class SearchRequest(BaseModel):
    """Request model for searching insights"""
    query: str
    role: Optional[str] = None
    insight_type: Optional[str] = None
    n_results: int = 10

class InsightResponse(BaseModel):
    """Response model for insights"""
    success: bool
    insight: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None

class SearchResponse(BaseModel):
    """Response model for search results"""
    success: bool
    results: List[Dict[str, Any]] = []
    total_count: int = 0
    error: Optional[str] = None

@router.post("/generate", response_model=InsightResponse)
async def generate_insight(
    request: InsightRequest,
    app_request: Request
):
    """Generate AI insight"""
    
    ai_manager = app_request.app.state.ai_manager
    
    if not ai_manager or not ai_manager.is_initialized():
        raise HTTPException(
            status_code=503,
            detail="AI service not available"
        )
    
    try:
        # Log request
        log_request(request.dict(), logger)
        
        # Generate insight
        insight = await ai_manager.generate_insight(
            screening_data=request.screening_data,
            patient_info=request.patient_info,
            role=request.role,
            insight_type=request.insight_type
        )
        
        # Log response
        log_response({
            "type": "insight_generation",
            "success": True,
            "processing_time": insight.get("processing_time")
        }, logger)
        
        return InsightResponse(
            success=True,
            insight=insight,
            processing_time=insight.get("processing_time")
        )
        
    except Exception as e:
        log_error(e, {"request": request.dict()}, logger)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insight: {str(e)}"
        )

@router.post("/search", response_model=SearchResponse)
async def search_insights(
    request: SearchRequest,
    app_request: Request
):
    """Search existing insights"""
    
    ai_manager = app_request.app.state.ai_manager
    
    if not ai_manager or not ai_manager.is_initialized():
        raise HTTPException(
            status_code=503,
            detail="AI service not available"
        )
    
    try:
        # Log request
        log_request(request.dict(), logger)
        
        # Search insights
        results = await ai_manager.search_insights(
            query=request.query,
            role=request.role,
            insight_type=request.insight_type,
            n_results=request.n_results
        )
        
        # Log response
        log_response({
            "type": "insight_search",
            "success": True,
            "result_count": len(results)
        }, logger)
        
        return SearchResponse(
            success=True,
            results=results,
            total_count=len(results)
        )
        
    except Exception as e:
        log_error(e, {"request": request.dict()}, logger)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search insights: {str(e)}"
        )

@router.get("/statistics")
async def get_statistics(app_request: Request):
    """Get AI service statistics"""
    
    ai_manager = app_request.app.state.ai_manager
    
    if not ai_manager:
        return {"error": "AI Manager not available"}
    
    try:
        stats = await ai_manager.get_statistics()
        return stats
        
    except Exception as e:
        log_error(e, {}, logger)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.get("/templates")
async def get_templates(app_request: Request):
    """Get available prompt templates"""
    
    ai_manager = app_request.app.state.ai_manager
    
    if not ai_manager or not ai_manager.is_initialized():
        raise HTTPException(
            status_code=503,
            detail="AI service not available"
        )
    
    try:
        templates = await ai_manager.prompt_manager.get_all_templates()
        return {
            "success": True,
            "templates": templates
        }
        
    except Exception as e:
        log_error(e, {}, logger)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get templates: {str(e)}"
        )
