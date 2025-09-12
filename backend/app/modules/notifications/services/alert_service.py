from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import Config

class AlertService:
    """Alert service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("notifications")
        
        # In-memory storage for demonstration
        self.alerts = {}
        self.alert_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the alert service"""
        # Initialize demo data
        await self._initialize_demo_data()
        
        print("🔧 Alert service initialized")
    
    async def _initialize_demo_data(self) -> None:
        """Initialize demo alert data"""
        # Demo alerts
        demo_alerts = [
            {
                "alert_id": "ALT-000001",
                "alert_type": "system_health",
                "title": "High CPU Usage",
                "message": "CPU usage is above 80% for the last 5 minutes",
                "severity": "warning",
                "status": "active",
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "acknowledged_at": None,
                "resolved_at": None,
                "acknowledged_by": None,
                "resolved_by": None,
                "source": "system_monitoring",
                "metadata": {
                    "cpu_usage": "85%",
                    "threshold": "80%",
                    "duration": "5 minutes"
                }
            },
            {
                "alert_id": "ALT-000002",
                "alert_type": "database_issue",
                "title": "Database Connection Pool Exhausted",
                "message": "Database connection pool is at 95% capacity",
                "severity": "critical",
                "status": "active",
                "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "acknowledged_at": None,
                "resolved_at": None,
                "acknowledged_by": None,
                "resolved_by": None,
                "source": "database_monitoring",
                "metadata": {
                    "connection_pool_usage": "95%",
                    "active_connections": 95,
                    "max_connections": 100
                }
            },
            {
                "alert_id": "ALT-000003",
                "alert_type": "security",
                "title": "Multiple Failed Login Attempts",
                "message": "Multiple failed login attempts detected for user admin",
                "severity": "high",
                "status": "acknowledged",
                "created_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                "acknowledged_at": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
                "resolved_at": None,
                "acknowledged_by": "admin-001",
                "resolved_by": None,
                "source": "security_monitoring",
                "metadata": {
                    "failed_attempts": 5,
                    "user_id": "admin",
                    "ip_address": "192.168.1.100"
                }
            },
            {
                "alert_id": "ALT-000004",
                "alert_type": "backup_failure",
                "title": "Daily Backup Failed",
                "message": "Daily database backup failed to complete",
                "severity": "medium",
                "status": "resolved",
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "acknowledged_at": (datetime.utcnow() - timedelta(hours=23)).isoformat(),
                "resolved_at": (datetime.utcnow() - timedelta(hours=22)).isoformat(),
                "acknowledged_by": "admin-001",
                "resolved_by": "admin-001",
                "source": "backup_system",
                "metadata": {
                    "backup_type": "daily",
                    "error_message": "Disk space insufficient",
                    "retry_count": 3
                }
            },
            {
                "alert_id": "ALT-000005",
                "alert_type": "performance",
                "title": "High Response Time",
                "message": "API response time is above 2 seconds",
                "severity": "warning",
                "status": "active",
                "created_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
                "acknowledged_at": None,
                "resolved_at": None,
                "acknowledged_by": None,
                "resolved_by": None,
                "source": "performance_monitoring",
                "metadata": {
                    "average_response_time": "2.5s",
                    "threshold": "2.0s",
                    "affected_endpoints": ["/api/v1/patients", "/api/v1/screenings"]
                }
            }
        ]
        
        for alert in demo_alerts:
            self.alerts[alert["alert_id"]] = alert
            self.alert_counter = max(self.alert_counter, int(alert["alert_id"].split("-")[1]))
    
    async def get_alerts(
        self,
        skip: int = 0,
        limit: int = 100,
        alert_type: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get alerts with optional filtering"""
        alerts = list(self.alerts.values())
        
        # Apply filters
        if alert_type:
            alerts = [a for a in alerts if a["alert_type"] == alert_type]
        
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity]
        
        if status:
            alerts = [a for a in alerts if a["status"] == status]
        
        # Sort by creation date (newest first)
        alerts.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        return alerts[skip:skip + limit]
    
    async def get_alert(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get an alert by ID"""
        return self.alerts.get(alert_id)
    
    async def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new alert"""
        # Validate required fields
        required_fields = ["alert_type", "title", "message", "severity"]
        for field in required_fields:
            if field not in alert_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate severity
        valid_severities = ["low", "medium", "high", "critical"]
        if alert_data["severity"] not in valid_severities:
            raise ValueError(f"Invalid severity: {alert_data['severity']}")
        
        # Generate alert ID
        self.alert_counter += 1
        alert_id = f"ALT-{self.alert_counter:06d}"
        
        # Create alert
        alert = {
            "alert_id": alert_id,
            "alert_type": alert_data["alert_type"],
            "title": alert_data["title"],
            "message": alert_data["message"],
            "severity": alert_data["severity"],
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "acknowledged_at": None,
            "resolved_at": None,
            "acknowledged_by": None,
            "resolved_by": None,
            "source": alert_data.get("source", "system"),
            "metadata": alert_data.get("metadata", {})
        }
        
        # Store alert
        self.alerts[alert_id] = alert
        
        return alert
    
    async def update_alert(self, alert_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an alert"""
        if alert_id not in self.alerts:
            return None
        
        alert = self.alerts[alert_id]
        
        # Update fields
        for key, value in updates.items():
            if key in alert:
                alert[key] = value
        
        alert["updated_at"] = datetime.utcnow().isoformat()
        
        return alert
    
    async def delete_alert(self, alert_id: str) -> bool:
        """Delete an alert"""
        if alert_id not in self.alerts:
            return False
        
        del self.alerts[alert_id]
        return True
    
    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> Optional[Dict[str, Any]]:
        """Acknowledge an alert"""
        if alert_id not in self.alerts:
            return None
        
        alert = self.alerts[alert_id]
        
        if alert["status"] == "active":
            alert["status"] = "acknowledged"
            alert["acknowledged_at"] = datetime.utcnow().isoformat()
            alert["acknowledged_by"] = acknowledged_by
        
        return alert
    
    async def resolve_alert(self, alert_id: str, resolved_by: str) -> Optional[Dict[str, Any]]:
        """Resolve an alert"""
        if alert_id not in self.alerts:
            return None
        
        alert = self.alerts[alert_id]
        
        alert["status"] = "resolved"
        alert["resolved_at"] = datetime.utcnow().isoformat()
        alert["resolved_by"] = resolved_by
        
        return alert
    
    async def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active alerts"""
        return await self.get_alerts(status="active")
    
    async def get_critical_alerts(self) -> List[Dict[str, Any]]:
        """Get all critical alerts"""
        alerts = await self.get_alerts(severity="critical")
        return [a for a in alerts if a["status"] in ["active", "acknowledged"]]
    
    async def get_alerts_by_type(self, alert_type: str) -> List[Dict[str, Any]]:
        """Get alerts by type"""
        return await self.get_alerts(alert_type=alert_type)
    
    async def get_alerts_by_severity(self, severity: str) -> List[Dict[str, Any]]:
        """Get alerts by severity"""
        return await self.get_alerts(severity=severity)
    
    async def get_alerts_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get alerts by status"""
        return await self.get_alerts(status=status)
    
    async def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert statistics"""
        total_alerts = len(self.alerts)
        active_alerts = len([a for a in self.alerts.values() if a["status"] == "active"])
        acknowledged_alerts = len([a for a in self.alerts.values() if a["status"] == "acknowledged"])
        resolved_alerts = len([a for a in self.alerts.values() if a["status"] == "resolved"])
        
        # Type distribution
        type_counts = {}
        for alert in self.alerts.values():
            alert_type = alert["alert_type"]
            type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
        
        # Severity distribution
        severity_counts = {}
        for alert in self.alerts.values():
            severity = alert["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Status distribution
        status_counts = {}
        for alert in self.alerts.values():
            status = alert["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Recent activity (last 24 hours)
        day_ago = datetime.utcnow() - timedelta(days=1)
        recent_alerts = [
            a for a in self.alerts.values()
            if datetime.fromisoformat(a["created_at"]) > day_ago
        ]
        
        return {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "acknowledged_alerts": acknowledged_alerts,
            "resolved_alerts": resolved_alerts,
            "type_distribution": type_counts,
            "severity_distribution": severity_counts,
            "status_distribution": status_counts,
            "recent_alerts": len(recent_alerts),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def create_system_alert(
        self,
        alert_type: str,
        title: str,
        message: str,
        severity: str = "medium",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a system alert"""
        alert_data = {
            "alert_type": alert_type,
            "title": title,
            "message": message,
            "severity": severity,
            "source": "system",
            "metadata": metadata or {}
        }
        
        return await self.create_alert(alert_data)
    
    async def create_security_alert(
        self,
        title: str,
        message: str,
        severity: str = "high",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a security alert"""
        return await self.create_system_alert(
            alert_type="security",
            title=title,
            message=message,
            severity=severity,
            metadata=metadata
        )
    
    async def create_performance_alert(
        self,
        title: str,
        message: str,
        severity: str = "medium",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a performance alert"""
        return await self.create_system_alert(
            alert_type="performance",
            title=title,
            message=message,
            severity=severity,
            metadata=metadata
        )
    
    async def create_database_alert(
        self,
        title: str,
        message: str,
        severity: str = "high",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a database alert"""
        return await self.create_system_alert(
            alert_type="database_issue",
            title=title,
            message=message,
            severity=severity,
            metadata=metadata
        )
    
    async def auto_resolve_alerts(self, hours: int = 24) -> int:
        """Auto-resolve old alerts"""
        cutoff_date = datetime.utcnow() - timedelta(hours=hours)
        resolved_count = 0
        
        for alert in self.alerts.values():
            if (alert["status"] == "acknowledged" and 
                datetime.fromisoformat(alert["acknowledged_at"]) < cutoff_date):
                alert["status"] = "resolved"
                alert["resolved_at"] = datetime.utcnow().isoformat()
                alert["resolved_by"] = "system"
                resolved_count += 1
        
        return resolved_count
    
    async def cleanup_resolved_alerts(self, days: int = 30) -> int:
        """Clean up old resolved alerts"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        deleted_count = 0
        
        alerts_to_delete = []
        for alert_id, alert in self.alerts.items():
            if (alert["status"] == "resolved" and 
                datetime.fromisoformat(alert["resolved_at"]) < cutoff_date):
                alerts_to_delete.append(alert_id)
        
        for alert_id in alerts_to_delete:
            del self.alerts[alert_id]
            deleted_count += 1
        
        return deleted_count
    
    async def get_alert_history(self, alert_id: str) -> List[Dict[str, Any]]:
        """Get alert history"""
        if alert_id not in self.alerts:
            return []
        
        alert = self.alerts[alert_id]
        history = [
            {
                "action": "created",
                "timestamp": alert["created_at"],
                "user": "system"
            }
        ]
        
        if alert.get("acknowledged_at"):
            history.append({
                "action": "acknowledged",
                "timestamp": alert["acknowledged_at"],
                "user": alert["acknowledged_by"]
            })
        
        if alert.get("resolved_at"):
            history.append({
                "action": "resolved",
                "timestamp": alert["resolved_at"],
                "user": alert["resolved_by"]
            })
        
        return history
    
    async def get_alert_trends(self, days: int = 7) -> Dict[str, Any]:
        """Get alert trends over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_alerts = [
            a for a in self.alerts.values()
            if datetime.fromisoformat(a["created_at"]) > cutoff_date
        ]
        
        # Daily trend
        daily_counts = {}
        for alert in recent_alerts:
            date = alert["created_at"][:10]  # YYYY-MM-DD
            daily_counts[date] = daily_counts.get(date, 0) + 1
        
        # Severity trend
        severity_counts = {}
        for alert in recent_alerts:
            severity = alert["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Type trend
        type_counts = {}
        for alert in recent_alerts:
            alert_type = alert["alert_type"]
            type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
        
        return {
            "period_days": days,
            "total_alerts": len(recent_alerts),
            "daily_trend": daily_counts,
            "severity_distribution": severity_counts,
            "type_distribution": type_counts,
            "last_updated": datetime.utcnow().isoformat()
        }

