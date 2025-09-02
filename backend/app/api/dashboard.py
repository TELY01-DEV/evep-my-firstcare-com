from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.config import settings
from app.core.database import get_database
import jwt
import os
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from app.utils.blockchain import generate_blockchain_hash
from app.utils.timezone import get_current_thailand_time

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

async def verify_dashboard_token(token: str = Depends(HTTPBearer())):
    """Simple token verification for dashboard endpoints"""
    try:
        # Use the same JWT secret and algorithm as AuthService
        jwt_secret = os.getenv("JWT_SECRET_KEY", "hardcoded_secret_key")
        payload = jwt.decode(token.credentials, jwt_secret, algorithms=["HS256"])
        
        # Extract user information
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Return user data in the expected format
        return {
            "id": user_id,
            "email": payload.get("email", ""),
            "role": payload.get("role", ""),
            "organization": payload.get("organization", "")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(verify_dashboard_token)):
    """Get dashboard statistics based on user role"""
    try:
        db = get_database()
        
        # Get user role and organization
        user_role = current_user.get("role")
        user_id = current_user.get("id")  # AuthModule returns "id" not "user_id"
        organization = current_user.get("organization")
        
        # Initialize stats
        stats = {
            "totalPatients": 0,
            "totalScreenings": 0,
            "pendingScreenings": 0,
            "completedScreenings": 0,
            "totalStudents": 0,
            "totalTeachers": 0,
            "totalSchools": 0,
            "totalSchoolScreenings": 0,
            "totalVisionScreenings": 0,
            "totalStandardVisionScreenings": 0,
            "totalHospitalMobileUnit": 0,
            "recentActivity": []
        }
        
        # Get patients count based on role
        if user_role == "admin":
            # Admin sees all patients
            stats["totalPatients"] = await db.evep["patients"].count_documents({})
        elif user_role == "doctor":
            # Doctor sees patients in their organization
            if organization:
                stats["totalPatients"] = await db.evep["patients"].count_documents({
                    "organization": organization
                })
            else:
                stats["totalPatients"] = await db.evep["patients"].count_documents({
                    "created_by": ObjectId(user_id)
                })
        elif user_role == "teacher":
            # Teacher sees students in their class/school
            if organization:
                stats["totalPatients"] = await db.evep["evep.students"].count_documents({
                    "school_name": organization
                })
        elif user_role == "parent":
            # Parent sees only their children
            stats["totalPatients"] = await db.evep["evep.students"].count_documents({
                "parent_id": ObjectId(user_id)
            })
        
        # Get screenings count based on role
        if user_role == "admin":
            stats["totalScreenings"] = await db.evep["screenings"].count_documents({})
            stats["pendingScreenings"] = await db.evep["screenings"].count_documents({
                "status": "pending"
            })
            stats["completedScreenings"] = await db.evep["screenings"].count_documents({
                "status": "completed"
            })
        elif user_role == "doctor":
            if organization:
                stats["totalScreenings"] = await db.evep["screenings"].count_documents({
                    "organization": organization
                })
                stats["pendingScreenings"] = await db.evep["screenings"].count_documents({
                    "organization": organization,
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.evep["screenings"].count_documents({
                    "organization": organization,
                    "status": "completed"
                })
            else:
                stats["totalScreenings"] = await db.evep["screenings"].count_documents({
                    "examiner_id": ObjectId(user_id)
                })
                stats["pendingScreenings"] = await db.evep["screenings"].count_documents({
                    "examiner_id": ObjectId(user_id),
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.evep["screenings"].count_documents({
                    "examiner_id": ObjectId(user_id),
                    "status": "completed"
                })
        elif user_role == "teacher":
            if organization:
                # Teachers see school screenings for their school
                stats["totalScreenings"] = await db.evep["school_screenings"].count_documents({
                    "school_name": organization
                })
                stats["pendingScreenings"] = await db.evep["school_screenings"].count_documents({
                    "school_name": organization,
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.evep["school_screenings"].count_documents({
                    "school_name": organization,
                    "status": "completed"
                })
        elif user_role == "parent":
            # Get screenings for parent's children
            children = await db.evep["evep.students"].find(
                {"parent_id": ObjectId(user_id)},
                {"_id": 1}
            ).to_list(None)
            
            if children:
                children_ids = [child["_id"] for child in children]
                stats["totalScreenings"] = await db.evep["school_screenings"].count_documents({
                    "student_id": {"$in": children_ids}
                })
                stats["pendingScreenings"] = await db.evep["school_screenings"].count_documents({
                    "student_id": {"$in": children_ids},
                    "status": "pending"
                })
                stats["completedScreenings"] = await db.evep["school_screenings"].count_documents({
                    "student_id": {"$in": children_ids},
                    "status": "completed"
                })
        
        # Get EVEP-specific statistics (students, teachers, schools)
        if user_role == "admin":
            # Count students, teachers, and schools
            stats["totalStudents"] = await db.evep["evep.students"].count_documents({"status": "active"})
            stats["totalTeachers"] = await db.evep["evep.teachers"].count_documents({"status": "active"})
            stats["totalSchools"] = await db.evep["evep.schools"].count_documents({"status": "active"})
            
            # Count school screenings
            stats["totalSchoolScreenings"] = await db.evep["school_screenings"].count_documents({})
            
            # Count vision screenings (from screenings collection)
            stats["totalVisionScreenings"] = await db.evep["screenings"].count_documents({})
            
            # Count standard vision screenings (completed screenings)
            stats["totalStandardVisionScreenings"] = await db.evep["screenings"].count_documents({"status": "completed"})
            
            # Count hospital mobile unit (pending screenings)
            stats["totalHospitalMobileUnit"] = await db.evep["screenings"].count_documents({"status": "pending"})
        
        # Get recent activity
        recent_activity = await get_recent_activity(db, current_user)
        stats["recentActivity"] = recent_activity
        
        # Log audit trail
        audit_data = {
            "user_id": ObjectId(user_id),
            "action": "dashboard_stats_viewed",
            "timestamp": get_current_thailand_time().isoformat(),
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
        
        await db.evep["audit_logs"].insert_one(audit_data)
        
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
                screening_filter["school_name"] = organization
        elif user_role == "parent":
            children = await db.evep["evep.students"].find(
                {"parent_id": ObjectId(user_id)},
                {"_id": 1}
            ).to_list(None)
            if children:
                children_ids = [child["_id"] for child in children]
                screening_filter["student_id"] = {"$in": children_ids}
        
        # Use appropriate collection based on role
        collection_name = "school_screenings" if user_role in ["teacher", "parent"] else "screenings"
        recent_screenings = await db.evep[collection_name].find(
            screening_filter
        ).sort("created_at", -1).limit(5).to_list(None)
        
        for screening in recent_screenings:
            if user_role in ["teacher", "parent"]:
                # For school screenings, get student info
                student = await db.evep["evep.students"].find_one({"_id": screening["student_id"]})
                patient_name = f"{student['first_name']} {student['last_name']}" if student else "Unknown Student"
            else:
                # For regular screenings, get patient info
                patient = await db.evep["patients"].find_one({"_id": screening["patient_id"]})
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
        
        recent_patients = await db.evep["patients"].find(
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
async def get_dashboard_analytics(current_user: dict = Depends(verify_dashboard_token)):
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
        
        daily_screenings = await db.evep["screenings"].aggregate(pipeline).to_list(None)
        
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
        
        results_distribution = await db.evep["screenings"].aggregate(results_pipeline).to_list(None)
        
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
