"""
Insights API endpoints for EVEP Platform

This module provides API endpoints for retrieving insight history and analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.api.auth import get_current_user

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/history")
async def get_insight_history(
    insight_type: Optional[str] = Query(None, description="Filter by insight type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get historical AI insights
    
    This endpoint retrieves historical insights with optional filtering and pagination.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "doctor", "medical_staff", "teacher", "executive"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view insight history"
            )
        
        # Mock data for now - in production this would come from a database
        mock_insights = [
            {
                "insight_id": "insight_001",
                "insight_type": "patient_analysis",
                "title": "Patient Vision Analysis",
                "description": "Patient shows consistent improvement in vision scores over the last 3 months",
                "confidence_score": 0.92,
                "recommendations": ["Continue current treatment plan", "Schedule follow-up in 3 months"],
                "risk_level": "low",
                "generated_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "generated_by": "doctor_001"
            },
            {
                "insight_id": "insight_002",
                "insight_type": "screening_trends",
                "title": "Screening Trends Analysis",
                "description": "Overall improvement in screening completion rates across all schools",
                "confidence_score": 0.88,
                "recommendations": ["Continue current screening program", "Focus on schools with lower completion rates"],
                "risk_level": "none",
                "generated_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "generated_by": "admin_001"
            },
            {
                "insight_id": "insight_003",
                "insight_type": "risk_assessment",
                "title": "High Risk Patient Alert",
                "description": "Patient shows signs of potential vision deterioration",
                "confidence_score": 0.95,
                "recommendations": ["Immediate ophthalmologist consultation", "Enhanced monitoring required"],
                "risk_level": "high",
                "generated_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                "generated_by": "doctor_002"
            }
        ]
        
        # Filter by insight type if provided
        if insight_type:
            mock_insights = [insight for insight in mock_insights if insight["insight_type"] == insight_type]
        
        # Calculate pagination
        total = len(mock_insights)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_insights = mock_insights[start_idx:end_idx]
        total_pages = (total + limit - 1) // limit
        
        return {
            "insights": paginated_insights,
            "total": total,
            "page": page,
            "total_pages": total_pages,
            "limit": limit,
            "requested_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving insight history: {str(e)}"
        )

@router.get("/analytics")
async def get_insight_analytics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI insights analytics
    
    This endpoint provides analytics and statistics about generated insights.
    """
    try:
        # Validate user permissions
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "doctor", "medical_staff", "teacher", "executive"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view insight analytics"
            )
        
        # Mock analytics data - in production this would be calculated from database
        analytics_data = {
            "total_insights": 50,
            "insights_by_type": {
                "patient_analysis": 20,
                "screening_trends": 15,
                "risk_assessment": 10,
                "recommendations": 5
            },
            "insights_by_role": {
                "doctor": 30,
                "teacher": 15,
                "admin": 5
            },
            "recent_activity": [
                {
                    "insight_id": "insight_001",
                    "type": "patient_analysis",
                    "generated_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                    "generated_by": "doctor_001"
                },
                {
                    "insight_id": "insight_002",
                    "type": "screening_trends",
                    "generated_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                    "generated_by": "admin_001"
                },
                {
                    "insight_id": "insight_003",
                    "type": "risk_assessment",
                    "generated_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                    "generated_by": "doctor_002"
                }
            ],
            "confidence_distribution": {
                "high": 15,
                "medium": 25,
                "low": 10
            },
            "risk_level_distribution": {
                "high": 8,
                "medium": 12,
                "low": 30
            }
        }
        
        return {
            "success": True,
            "analytics": analytics_data,
            "requested_by": current_user.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving insight analytics: {str(e)}"
        )
