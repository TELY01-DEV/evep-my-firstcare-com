from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.config import settings
from app.core.database import get_database
from app.api.auth import get_current_user
from app.utils.blockchain import generate_blockchain_hash

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics based on user role"""
    try:
        db = get_database()
        
        # Get user role and organization
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        organization = current_user.get("organization")
        
        # Initialize stats
        stats = {
            "totalPatients": 0,
            "totalScreenings": 0,
            "pendingScreenings": 0,
            "completedScreenings": 0,
            "recentActivity": []
        }
        
        # Get patients count based on role
        if user_role == "admin":
            # Admin sees all patients
            stats["totalPatients"] = await db.patients.count_documents({})
        elif user_role == "doctor":
            # Doctor sees patients in their organization
            if organization:
                stats["totalPatients"] = await db.patients.count_documents({
                    "organization": organization
                })
            else:
                stats["totalPatients"] = await db.patients.count_documents({
                    "created_by": ObjectId(user_id)
                })
        elif user_role == "teacher":
            # Teacher sees students in their class/school
            if organization:
                stats["totalPatients"] = await db.patients.count_documents({
                    "organization": organization
                })
        elif user_role == "parent":
            # Parent sees only their children
            stats["totalPatients"] = await db.patients.count_documents({
                "parent_id": ObjectId(user_id)
            })
        
        # Get screenings count based on role
        if user_role == "admin":
            stats["totalScreenings"] = await db.screenings.count_documents({})
            stats["pendingScreenings"] = await db.screenings.count_documents({
                "status": "pending"
            })
            stats["completedScreenings"] = await db.screenings.count_documents({
                "status": "completed"
            })
        elif user_role == "doctor":
            if organization:
                stats["totalScreenings"] = await db.screenings.count_documents({
                    "organization": organization
                })
                stats["pendingScreenings"] = await db.screenings.count_documents({
                    "organization": organization,
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.screenings.count_documents({
                    "organization": organization,
                    "status": "completed"
                })
            else:
                stats["totalScreenings"] = await db.screenings.count_documents({
                    "examiner_id": ObjectId(user_id)
                })
                stats["pendingScreenings"] = await db.screenings.count_documents({
                    "examiner_id": ObjectId(user_id),
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.screenings.count_documents({
                    "examiner_id": ObjectId(user_id),
                    "status": "completed"
                })
        elif user_role == "teacher":
            if organization:
                stats["totalScreenings"] = await db.screenings.count_documents({
                    "organization": organization
                })
                stats["pendingScreenings"] = await db.screenings.count_documents({
                    "organization": organization,
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.screenings.count_documents({
                    "organization": organization,
                    "status": "completed"
                })
        elif user_role == "parent":
            # Get screenings for parent's children
            children = await db.patients.find(
                {"parent_id": ObjectId(user_id)},
                {"_id": 1}
            ).to_list(None)
            
            if children:
                children_ids = [child["_id"] for child in children]
                stats["totalScreenings"] = await db.screenings.count_documents({
                    "patient_id": {"$in": children_ids}
                })
                stats["pendingScreenings"] = await db.screenings.count_documents({
                    "patient_id": {"$in": children_ids},
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.screenings.count_documents({
                    "patient_id": {"$in": children_ids},
                    "status": "completed"
                })
        
        # Get recent activity
        recent_activity = await get_recent_activity(db, current_user)
        stats["recentActivity"] = recent_activity
        
        # Log audit trail
        audit_data = {
            "user_id": ObjectId(user_id),
            "action": "dashboard_stats_viewed",
            "timestamp": settings.get_current_timestamp(),
            "details": {
                "role": user_role,
                "organization": organization,
                "stats_summary": {
                    "patients": stats["totalPatients"],
                    "screenings": stats["totalScreenings"]
                }
            },
            "audit_hash": generate_blockchain_hash(f"dashboard_stats_viewed:{user_id}")
        }
        
        await db.audit_logs.insert_one(audit_data)
        
        return stats
        
    except Exception as e:
        print(f"Dashboard stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics"
        )

async def get_recent_activity(db, current_user: dict) -> List[Dict[str, Any]]:
    """Get recent activity based on user role"""
    try:
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        organization = current_user.get("organization")
        
        activities = []
        
        # Get recent screenings
        screening_filter = {}
        if user_role == "doctor":
            if organization:
                screening_filter["organization"] = organization
            else:
                screening_filter["examiner_id"] = ObjectId(user_id)
        elif user_role == "teacher":
            if organization:
                screening_filter["organization"] = organization
        elif user_role == "parent":
            children = await db.patients.find(
                {"parent_id": ObjectId(user_id)},
                {"_id": 1}
            ).to_list(None)
            if children:
                children_ids = [child["_id"] for child in children]
                screening_filter["patient_id"] = {"$in": children_ids}
        
        recent_screenings = await db.screenings.find(
            screening_filter
        ).sort("created_at", -1).limit(5).to_list(None)
        
        for screening in recent_screenings:
            patient = await db.patients.find_one({"_id": screening["patient_id"]})
            patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else "Unknown Patient"
            
            activities.append({
                "id": str(screening["_id"]),
                "type": "screening",
                "description": f"Screening {'completed' if screening['status'] == 'completed' else 'in progress'} for {patient_name}",
                "timestamp": screening["created_at"],
                "status": "success" if screening["status"] == "completed" else "info"
            })
        
        # Get recent patient registrations
        patient_filter = {}
        if user_role == "doctor":
            if organization:
                patient_filter["organization"] = organization
            else:
                patient_filter["created_by"] = ObjectId(user_id)
        elif user_role == "teacher":
            if organization:
                patient_filter["organization"] = organization
        elif user_role == "parent":
            patient_filter["parent_id"] = ObjectId(user_id)
        
        recent_patients = await db.patients.find(
            patient_filter
        ).sort("created_at", -1).limit(3).to_list(None)
        
        for patient in recent_patients:
            activities.append({
                "id": str(patient["_id"]),
                "type": "patient",
                "description": f"New patient registered: {patient['first_name']} {patient['last_name']}",
                "timestamp": patient["created_at"],
                "status": "info"
            })
        
        # Sort activities by timestamp and return top 5
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:5]
        
    except Exception as e:
        print(f"Recent activity error: {str(e)}")
        return []

@router.get("/analytics")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    """Get detailed analytics for dashboard charts"""
    try:
        db = get_database()
        user_role = current_user.get("role")
        organization = current_user.get("organization")
        
        # Get date range (last 30 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Build filter based on user role
        filter_query = {
            "created_at": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }
        
        if user_role != "admin" and organization:
            filter_query["organization"] = organization
        
        # Get daily screening counts
        pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": {"$dateFromString": {"dateString": "$created_at"}}
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_screenings = await db.screenings.aggregate(pipeline).to_list(None)
        
        # Get screening results distribution
        results_pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results_distribution = await db.screenings.aggregate(results_pipeline).to_list(None)
        
        analytics = {
            "dailyScreenings": daily_screenings,
            "resultsDistribution": results_distribution,
            "dateRange": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }
        
        return analytics
        
    except Exception as e:
        print(f"Dashboard analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard analytics"
        )
