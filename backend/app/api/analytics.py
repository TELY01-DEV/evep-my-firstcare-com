from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import json

from app.core.config import settings
from app.core.database import get_database
from app.api.auth import get_current_user
from app.utils.timezone import get_current_thailand_time

router = APIRouter()

# Pydantic models for analytics
class AnalyticsRequest(BaseModel):
    analytics_type: str  # 'trends', 'predictions', 'comparisons', 'performance'
    date_range: str = "30d"  # '7d', '30d', '90d', '1y'
    filters: Optional[Dict[str, Any]] = None
    group_by: Optional[str] = None  # 'school', 'grade', 'age_group', 'month'

class TrendData(BaseModel):
    period: str
    value: float
    change_percentage: float
    trend_direction: str  # 'up', 'down', 'stable'

class PredictionData(BaseModel):
    metric: str
    current_value: float
    predicted_value: float
    confidence_interval: List[float]
    prediction_date: str

class AnalyticsResponse(BaseModel):
    analytics_type: str
    data: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]
    generated_at: str

@router.post("/analytics/comprehensive", response_model=AnalyticsResponse)
async def get_comprehensive_analytics(
    request: AnalyticsRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get comprehensive analytics based on request type"""
    try:
        # Validate user permissions
        if current_user["role"] not in ["admin", "doctor", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access analytics"
            )
        
        # Get analytics based on type
        if request.analytics_type == "trends":
            data = await get_trend_analytics(request, current_user, db)
        elif request.analytics_type == "predictions":
            data = await get_prediction_analytics(request, current_user, db)
        elif request.analytics_type == "comparisons":
            data = await get_comparison_analytics(request, current_user, db)
        elif request.analytics_type == "performance":
            data = await get_performance_analytics(request, current_user, db)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid analytics type"
            )
        
        return AnalyticsResponse(
            analytics_type=request.analytics_type,
            data=data,
            insights=data.get("insights", []),
            recommendations=data.get("recommendations", []),
            generated_at=get_current_thailand_time().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analytics: {str(e)}"
        )

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get key metrics for dashboard"""
    try:
        # Get basic counts
        patients_collection = db["patients"]
        screenings_collection = db["screenings"]
        
        total_patients = await patients_collection.count_documents({})
        total_screenings = await screenings_collection.count_documents({})
        
        # Get recent activity
        recent_screenings = await screenings_collection.count_documents({
            "created_at": {"$gte": (get_current_thailand_time() - timedelta(days=7)).isoformat()}
        })
        
        # Get completion rate
        completed_screenings = await screenings_collection.count_documents({"status": "completed"})
        completion_rate = (completed_screenings / total_screenings * 100) if total_screenings > 0 else 0
        
        # Get average vision scores
        pipeline = [
            {"$match": {"status": "completed", "results": {"$exists": True}}},
            {"$group": {
                "_id": None,
                "avg_left_eye": {"$avg": {"$toDouble": "$results.left_eye_distance"}},
                "avg_right_eye": {"$avg": {"$toDouble": "$results.right_eye_distance"}}
            }}
        ]
        
        avg_scores = await screenings_collection.aggregate(pipeline).to_list(1)
        avg_left_eye = avg_scores[0]["avg_left_eye"] if avg_scores else 0
        avg_right_eye = avg_scores[0]["avg_right_eye"] if avg_scores else 0
        
        return {
            "total_patients": total_patients,
            "total_screenings": total_screenings,
            "recent_screenings": recent_screenings,
            "completion_rate": round(completion_rate, 1),
            "avg_vision_scores": {
                "left_eye": round(avg_left_eye, 2),
                "right_eye": round(avg_right_eye, 2)
            },
            "user_role": current_user["role"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard analytics: {str(e)}"
        )

@router.get("/analytics/trends")
async def get_trend_analytics(
    date_range: str = Query("30d", description="Date range for analysis"),
    group_by: str = Query("month", description="Grouping criteria"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get trend analysis data"""
    try:
        # Calculate date range
        end_date = get_current_thailand_time()
        if date_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif date_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif date_range == "90d":
            start_date = end_date - timedelta(days=90)
        elif date_range == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get screening trends
        screenings_collection = db["screenings"]
        
        pipeline = [
            {"$match": {
                "created_at": {
                    "$gte": start_date.isoformat(),
                    "$lte": end_date.isoformat()
                }
            }},
            {"$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m",
                        "date": {"$dateFromString": {"dateString": "$created_at"}}
                    }
                },
                "count": {"$sum": 1},
                "completed": {
                    "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                }
            }},
            {"$sort": {"_id": 1}}
        ]
        
        trends = []
        async for doc in screenings_collection.aggregate(pipeline):
            trends.append({
                "period": doc["_id"],
                "total_screenings": doc["count"],
                "completed_screenings": doc["completed"],
                "completion_rate": round((doc["completed"] / doc["count"]) * 100, 1)
            })
        
        # Calculate trend direction
        if len(trends) >= 2:
            recent = trends[-1]["completion_rate"]
            previous = trends[-2]["completion_rate"]
            change = recent - previous
            direction = "up" if change > 0 else "down" if change < 0 else "stable"
        else:
            direction = "stable"
            change = 0
        
        return {
            "trends": trends,
            "summary": {
                "total_periods": len(trends),
                "avg_completion_rate": round(sum(t["completion_rate"] for t in trends) / len(trends), 1) if trends else 0,
                "trend_direction": direction,
                "change_percentage": round(change, 1)
            },
            "insights": [
                f"Completion rate trend is {direction}",
                f"Average completion rate: {round(sum(t['completion_rate'] for t in trends) / len(trends), 1)}%" if trends else "No data available"
            ],
            "recommendations": [
                "Monitor completion rates closely",
                "Implement follow-up procedures for incomplete screenings"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve trend analytics: {str(e)}"
        )

@router.get("/analytics/predictions")
async def get_prediction_analytics(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get predictive analytics"""
    try:
        # Mock prediction data (replace with actual ML model)
        predictions = [
            {
                "metric": "Screening Volume",
                "current_value": 45,
                "predicted_value": 52,
                "confidence_interval": [48, 56],
                "prediction_date": (get_current_thailand_time() + timedelta(days=30)).isoformat()
            },
            {
                "metric": "Completion Rate",
                "current_value": 78.5,
                "predicted_value": 82.1,
                "confidence_interval": [79.5, 84.7],
                "prediction_date": (get_current_thailand_time() + timedelta(days=30)).isoformat()
            },
            {
                "metric": "Average Vision Score",
                "current_value": 20.3,
                "predicted_value": 20.1,
                "confidence_interval": [19.8, 20.4],
                "prediction_date": (get_current_thailand_time() + timedelta(days=30)).isoformat()
            }
        ]
        
        return {
            "predictions": predictions,
            "insights": [
                "Screening volume expected to increase by 15%",
                "Completion rate showing positive trend",
                "Vision scores remain stable"
            ],
            "recommendations": [
                "Prepare for increased screening demand",
                "Maintain current quality standards",
                "Monitor vision score trends"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve prediction analytics: {str(e)}"
        )

@router.get("/analytics/comparisons")
async def get_comparison_analytics(
    comparison_type: str = Query("school", description="Type of comparison"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get comparison analytics"""
    try:
        if comparison_type == "school":
            # Compare performance across schools
            pipeline = [
                {"$lookup": {
                    "from": "patients",
                    "localField": "patient_id",
                    "foreignField": "_id",
                    "as": "patient"
                }},
                {"$unwind": "$patient"},
                {"$group": {
                    "_id": "$patient.school",
                    "total_screenings": {"$sum": 1},
                    "completed_screenings": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                    },
                    "avg_vision_score": {
                        "$avg": {"$toDouble": "$results.left_eye_distance"}
                    }
                }},
                {"$sort": {"total_screenings": -1}}
            ]
            
            comparisons = []
            async for doc in db["screenings"].aggregate(pipeline):
                comparisons.append({
                    "name": doc["_id"],
                    "total_screenings": doc["total_screenings"],
                    "completion_rate": round((doc["completed_screenings"] / doc["total_screenings"]) * 100, 1),
                    "avg_vision_score": round(doc["avg_vision_score"], 2)
                })
        
        elif comparison_type == "grade":
            # Compare performance across grades
            pipeline = [
                {"$lookup": {
                    "from": "patients",
                    "localField": "patient_id",
                    "foreignField": "_id",
                    "as": "patient"
                }},
                {"$unwind": "$patient"},
                {"$group": {
                    "_id": "$patient.grade",
                    "total_screenings": {"$sum": 1},
                    "completed_screenings": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                    }
                }},
                {"$sort": {"_id": 1}}
            ]
            
            comparisons = []
            async for doc in db["screenings"].aggregate(pipeline):
                comparisons.append({
                    "name": doc["_id"],
                    "total_screenings": doc["total_screenings"],
                    "completion_rate": round((doc["completed_screenings"] / doc["total_screenings"]) * 100, 1)
                })
        
        else:
            comparisons = []
        
        return {
            "comparison_type": comparison_type,
            "comparisons": comparisons,
            "insights": [
                f"Performance varies across {comparison_type}s",
                "Some {comparison_type}s show higher completion rates"
            ],
            "recommendations": [
                f"Share best practices across {comparison_type}s",
                "Provide additional support to lower-performing {comparison_type}s"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve comparison analytics: {str(e)}"
        )

@router.get("/analytics/performance")
async def get_performance_analytics(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get performance analytics"""
    try:
        # Get performance metrics
        screenings_collection = db["screenings"]
        
        # Overall performance
        total_screenings = await screenings_collection.count_documents({})
        completed_screenings = await screenings_collection.count_documents({"status": "completed"})
        completion_rate = (completed_screenings / total_screenings * 100) if total_screenings > 0 else 0
        
        # Average processing time (mock data)
        avg_processing_time = 15.5  # minutes
        
        # Quality metrics
        quality_score = 92.5  # percentage
        
        # Efficiency metrics
        screenings_per_day = 8.2
        patients_per_screening = 1.0
        
        return {
            "completion_rate": round(completion_rate, 1),
            "avg_processing_time": avg_processing_time,
            "quality_score": quality_score,
            "screenings_per_day": screenings_per_day,
            "patients_per_screening": patients_per_screening,
            "insights": [
                f"Overall completion rate: {round(completion_rate, 1)}%",
                f"Average processing time: {avg_processing_time} minutes",
                f"Quality score: {quality_score}%"
            ],
            "recommendations": [
                "Focus on improving completion rates",
                "Optimize screening workflow for efficiency",
                "Maintain high quality standards"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve performance analytics: {str(e)}"
        )

async def get_trend_analytics(request: AnalyticsRequest, current_user: Dict, db) -> Dict[str, Any]:
    """Get trend analytics data"""
    # Implementation moved to the endpoint above
    pass

async def get_prediction_analytics(request: AnalyticsRequest, current_user: Dict, db) -> Dict[str, Any]:
    """Get prediction analytics data"""
    # Implementation moved to the endpoint above
    pass

async def get_comparison_analytics(request: AnalyticsRequest, current_user: Dict, db) -> Dict[str, Any]:
    """Get comparison analytics data"""
    # Implementation moved to the endpoint above
    pass

async def get_performance_analytics(request: AnalyticsRequest, current_user: Dict, db) -> Dict[str, Any]:
    """Get performance analytics data"""
    # Implementation moved to the endpoint above
    pass
