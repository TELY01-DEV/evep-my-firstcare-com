from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import Config

class DashboardService:
    """Dashboard service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("reporting")
        
        # In-memory storage for demonstration
        self.dashboard_data = {}
        self.alerts = []
    
    async def initialize(self) -> None:
        """Initialize the dashboard service"""
        # Initialize demo dashboard data
        await self._initialize_demo_data()
        
        print("🔧 Dashboard service initialized")
    
    async def _initialize_demo_data(self) -> None:
        """Initialize demo dashboard data"""
        # Demo overview data
        self.dashboard_data["overview"] = {
            "total_patients": 1250,
            "total_screenings": 2100,
            "total_vision_tests": 4200,
            "total_assessments": 315,
            "new_patients_today": 3,
            "screenings_today": 8,
            "pending_assessments": 12,
            "urgent_cases": 2,
            "system_health": "healthy",
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Demo patient dashboard data
        self.dashboard_data["patient_summary"] = {
            "patient_statistics": {
                "total_patients": 1250,
                "new_this_month": 45,
                "active_patients": 890,
                "inactive_patients": 360
            },
            "demographics": {
                "age_distribution": {
                    "0-5": 150,
                    "6-12": 300,
                    "13-18": 400,
                    "19-25": 200,
                    "26+": 200
                },
                "gender_distribution": {
                    "male": 625,
                    "female": 625
                },
                "location_distribution": {
                    "Bangkok": 500,
                    "Chiang Mai": 200,
                    "Phuket": 150,
                    "Other": 400
                }
            },
            "recent_activity": {
                "new_registrations": [3, 2, 4, 1, 3, 2, 5],
                "patient_visits": [15, 18, 12, 20, 16, 14, 19]
            }
        }
        
        # Demo screening dashboard data
        self.dashboard_data["screening_summary"] = {
            "screening_statistics": {
                "total_screenings": 2100,
                "completed_today": 8,
                "scheduled_today": 12,
                "pending_screenings": 25,
                "completion_rate": 0.85
            },
            "screening_types": {
                "vision_screening": 1500,
                "comprehensive_eye_exam": 400,
                "school_screening": 200
            },
            "screening_status": {
                "scheduled": 150,
                "in_progress": 50,
                "completed": 1800,
                "cancelled": 100
            },
            "recent_activity": {
                "screenings_completed": [8, 6, 9, 7, 8, 5, 10],
                "screenings_scheduled": [12, 15, 10, 13, 11, 14, 9]
            }
        }
        
        # Demo performance dashboard data
        self.dashboard_data["performance"] = {
            "system_metrics": {
                "uptime": "99.9%",
                "response_time": "120ms",
                "error_rate": "0.1%",
                "active_users": 25,
                "database_connections": 15
            },
            "resource_usage": {
                "cpu_usage": "45%",
                "memory_usage": "65%",
                "disk_usage": "40%",
                "network_usage": "30%"
            },
            "performance_trends": {
                "response_time_trend": [120, 125, 118, 122, 119, 121, 120],
                "error_rate_trend": [0.1, 0.15, 0.08, 0.12, 0.09, 0.11, 0.1],
                "active_users_trend": [25, 28, 22, 26, 24, 27, 25]
            }
        }
        
        # Demo alerts
        self.alerts = [
            {
                "alert_id": "ALT-000001",
                "type": "warning",
                "title": "High CPU Usage",
                "message": "CPU usage is above 80%",
                "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "acknowledged": False
            },
            {
                "alert_id": "ALT-000002",
                "type": "info",
                "title": "System Maintenance",
                "message": "Scheduled maintenance in 2 hours",
                "timestamp": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                "acknowledged": True
            },
            {
                "alert_id": "ALT-000003",
                "type": "success",
                "title": "Backup Completed",
                "message": "Daily backup completed successfully",
                "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "acknowledged": False
            }
        ]
    
    async def get_overview_data(self) -> Dict[str, Any]:
        """Get dashboard overview data"""
        try:
            return self.dashboard_data["overview"]
        except Exception as e:
            print(f"Error getting overview data: {e}")
            return {}
    
    async def get_patient_dashboard(self) -> Dict[str, Any]:
        """Get patient dashboard data"""
        try:
            return self.dashboard_data["patient_summary"]
        except Exception as e:
            print(f"Error getting patient dashboard: {e}")
            return {}
    
    async def get_screening_dashboard(self) -> Dict[str, Any]:
        """Get screening dashboard data"""
        try:
            return self.dashboard_data["screening_summary"]
        except Exception as e:
            print(f"Error getting screening dashboard: {e}")
            return {}
    
    async def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get performance dashboard data"""
        try:
            return self.dashboard_data["performance"]
        except Exception as e:
            print(f"Error getting performance dashboard: {e}")
            return {}
    
    async def get_alerts(self) -> List[Dict[str, Any]]:
        """Get dashboard alerts and notifications"""
        try:
            return self.alerts
        except Exception as e:
            print(f"Error getting alerts: {e}")
            return []
    
    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        try:
            for alert in self.alerts:
                if alert["alert_id"] == alert_id:
                    alert["acknowledged"] = True
                    alert["acknowledged_at"] = datetime.utcnow().isoformat()
                    return True
            return False
        except Exception as e:
            print(f"Error acknowledging alert: {e}")
            return False
    
    async def add_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new alert"""
        try:
            # Generate alert ID
            alert_id = f"ALT-{len(self.alerts) + 1:06d}"
            
            alert = {
                "alert_id": alert_id,
                "type": alert_data.get("type", "info"),
                "title": alert_data["title"],
                "message": alert_data["message"],
                "timestamp": datetime.utcnow().isoformat(),
                "acknowledged": False
            }
            
            self.alerts.append(alert)
            return alert
            
        except Exception as e:
            print(f"Error adding alert: {e}")
            return {}
    
    async def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert statistics"""
        try:
            total_alerts = len(self.alerts)
            acknowledged_alerts = len([a for a in self.alerts if a["acknowledged"]])
            unacknowledged_alerts = total_alerts - acknowledged_alerts
            
            # Type distribution
            type_counts = {}
            for alert in self.alerts:
                alert_type = alert["type"]
                type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
            
            return {
                "total_alerts": total_alerts,
                "acknowledged_alerts": acknowledged_alerts,
                "unacknowledged_alerts": unacknowledged_alerts,
                "type_distribution": type_counts,
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting alert statistics: {e}")
            return {}
    
    async def get_dashboard_widgets(self, dashboard_type: str) -> List[Dict[str, Any]]:
        """Get dashboard widgets for a specific dashboard type"""
        try:
            widgets = []
            
            if dashboard_type == "overview":
                widgets = [
                    {
                        "widget_id": "widget-001",
                        "type": "metric",
                        "title": "Total Patients",
                        "value": self.dashboard_data["overview"]["total_patients"],
                        "icon": "people",
                        "color": "primary"
                    },
                    {
                        "widget_id": "widget-002",
                        "type": "metric",
                        "title": "Total Screenings",
                        "value": self.dashboard_data["overview"]["total_screenings"],
                        "icon": "visibility",
                        "color": "success"
                    },
                    {
                        "widget_id": "widget-003",
                        "type": "metric",
                        "title": "Pending Assessments",
                        "value": self.dashboard_data["overview"]["pending_assessments"],
                        "icon": "assignment",
                        "color": "warning"
                    },
                    {
                        "widget_id": "widget-004",
                        "type": "metric",
                        "title": "Urgent Cases",
                        "value": self.dashboard_data["overview"]["urgent_cases"],
                        "icon": "priority_high",
                        "color": "error"
                    }
                ]
            elif dashboard_type == "patients":
                widgets = [
                    {
                        "widget_id": "widget-101",
                        "type": "chart",
                        "title": "Age Distribution",
                        "chart_type": "pie",
                        "data": self.dashboard_data["patient_summary"]["demographics"]["age_distribution"]
                    },
                    {
                        "widget_id": "widget-102",
                        "type": "chart",
                        "title": "Gender Distribution",
                        "chart_type": "doughnut",
                        "data": self.dashboard_data["patient_summary"]["demographics"]["gender_distribution"]
                    },
                    {
                        "widget_id": "widget-103",
                        "type": "chart",
                        "title": "Recent Registrations",
                        "chart_type": "line",
                        "data": self.dashboard_data["patient_summary"]["recent_activity"]["new_registrations"]
                    }
                ]
            elif dashboard_type == "screenings":
                widgets = [
                    {
                        "widget_id": "widget-201",
                        "type": "chart",
                        "title": "Screening Types",
                        "chart_type": "bar",
                        "data": self.dashboard_data["screening_summary"]["screening_types"]
                    },
                    {
                        "widget_id": "widget-202",
                        "type": "chart",
                        "title": "Screening Status",
                        "chart_type": "pie",
                        "data": self.dashboard_data["screening_summary"]["screening_status"]
                    },
                    {
                        "widget_id": "widget-203",
                        "type": "chart",
                        "title": "Completion Rate Trend",
                        "chart_type": "line",
                        "data": self.dashboard_data["screening_summary"]["recent_activity"]["screenings_completed"]
                    }
                ]
            elif dashboard_type == "performance":
                widgets = [
                    {
                        "widget_id": "widget-301",
                        "type": "metric",
                        "title": "System Uptime",
                        "value": self.dashboard_data["performance"]["system_metrics"]["uptime"],
                        "icon": "check_circle",
                        "color": "success"
                    },
                    {
                        "widget_id": "widget-302",
                        "type": "metric",
                        "title": "Response Time",
                        "value": self.dashboard_data["performance"]["system_metrics"]["response_time"],
                        "icon": "speed",
                        "color": "info"
                    },
                    {
                        "widget_id": "widget-303",
                        "type": "chart",
                        "title": "Resource Usage",
                        "chart_type": "gauge",
                        "data": self.dashboard_data["performance"]["resource_usage"]
                    }
                ]
            
            return widgets
            
        except Exception as e:
            print(f"Error getting dashboard widgets: {e}")
            return []
    
    async def get_dashboard_configuration(self, dashboard_type: str) -> Dict[str, Any]:
        """Get dashboard configuration"""
        try:
            configurations = {
                "overview": {
                    "title": "Platform Overview",
                    "description": "Key metrics and system overview",
                    "layout": "grid",
                    "columns": 4,
                    "refresh_interval": 30,
                    "widgets": ["metric", "chart", "alert"]
                },
                "patients": {
                    "title": "Patient Dashboard",
                    "description": "Patient statistics and demographics",
                    "layout": "grid",
                    "columns": 3,
                    "refresh_interval": 60,
                    "widgets": ["chart", "table", "metric"]
                },
                "screenings": {
                    "title": "Screening Dashboard",
                    "description": "Screening activities and results",
                    "layout": "grid",
                    "columns": 3,
                    "refresh_interval": 60,
                    "widgets": ["chart", "metric", "table"]
                },
                "performance": {
                    "title": "Performance Dashboard",
                    "description": "System performance and metrics",
                    "layout": "grid",
                    "columns": 3,
                    "refresh_interval": 15,
                    "widgets": ["metric", "chart", "gauge"]
                }
            }
            
            return configurations.get(dashboard_type, {})
            
        except Exception as e:
            print(f"Error getting dashboard configuration: {e}")
            return {}
    
    async def update_dashboard_data(self, dashboard_type: str, data: Dict[str, Any]) -> bool:
        """Update dashboard data"""
        try:
            if dashboard_type in self.dashboard_data:
                self.dashboard_data[dashboard_type].update(data)
                self.dashboard_data[dashboard_type]["last_updated"] = datetime.utcnow().isoformat()
                return True
            return False
            
        except Exception as e:
            print(f"Error updating dashboard data: {e}")
            return False
    
    async def get_dashboard_insights(self, dashboard_type: str) -> List[Dict[str, Any]]:
        """Get insights for a specific dashboard"""
        try:
            insights = []
            
            if dashboard_type == "overview":
                insights = [
                    {
                        "type": "info",
                        "title": "System Health",
                        "message": "All systems are operating normally",
                        "icon": "check_circle"
                    },
                    {
                        "type": "warning",
                        "title": "Pending Assessments",
                        "message": "12 assessments require attention",
                        "icon": "assignment"
                    },
                    {
                        "type": "success",
                        "title": "High Completion Rate",
                        "message": "Screening completion rate is 85%",
                        "icon": "trending_up"
                    }
                ]
            elif dashboard_type == "patients":
                insights = [
                    {
                        "type": "info",
                        "title": "Patient Growth",
                        "message": "45 new patients registered this month",
                        "icon": "person_add"
                    },
                    {
                        "type": "info",
                        "title": "Age Distribution",
                        "message": "Most patients are in the 13-18 age group",
                        "icon": "people"
                    }
                ]
            elif dashboard_type == "screenings":
                insights = [
                    {
                        "type": "success",
                        "title": "High Completion Rate",
                        "message": "85% of scheduled screenings completed",
                        "icon": "check_circle"
                    },
                    {
                        "type": "info",
                        "title": "Screening Types",
                        "message": "Vision screening is the most common type",
                        "icon": "visibility"
                    }
                ]
            elif dashboard_type == "performance":
                insights = [
                    {
                        "type": "success",
                        "title": "System Performance",
                        "message": "System is performing optimally",
                        "icon": "speed"
                    },
                    {
                        "type": "info",
                        "title": "Resource Usage",
                        "message": "CPU and memory usage are within normal ranges",
                        "icon": "memory"
                    }
                ]
            
            return insights
            
        except Exception as e:
            print(f"Error getting dashboard insights: {e}")
            return []
    
    async def export_dashboard_data(self, dashboard_type: str, format: str = "json") -> Dict[str, Any]:
        """Export dashboard data"""
        try:
            if dashboard_type not in self.dashboard_data:
                return {}
            
            export_data = {
                "dashboard_type": dashboard_type,
                "format": format,
                "export_date": datetime.utcnow().isoformat(),
                "data": self.dashboard_data[dashboard_type]
            }
            
            return export_data
            
        except Exception as e:
            print(f"Error exporting dashboard data: {e}")
            return {}
    
    async def get_dashboard_history(self, dashboard_type: str, time_range: str = "7d") -> List[Dict[str, Any]]:
        """Get dashboard data history"""
        try:
            # In a real implementation, this would query historical dashboard data
            # For now, return demo history
            history = [
                {
                    "timestamp": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                    "data_snapshot": f"Dashboard data snapshot for day {i}",
                    "changes": f"Changes detected on day {i}"
                }
                for i in range(7)
            ]
            
            return history
            
        except Exception as e:
            print(f"Error getting dashboard history: {e}")
            return []

