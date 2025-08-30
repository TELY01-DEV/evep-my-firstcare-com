from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import Config

class NotificationService:
    """Notification service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("notifications")
        
        # In-memory storage for demonstration
        self.notifications = {}
        self.notification_counter = 0
        self.templates = {}
        self.settings = {}
    
    async def initialize(self) -> None:
        """Initialize the notification service"""
        # Initialize demo data
        await self._initialize_demo_data()
        
        print("🔧 Notification service initialized")
    
    async def _initialize_demo_data(self) -> None:
        """Initialize demo notification data"""
        # Demo notification templates
        self.templates = {
            "welcome": {
                "name": "Welcome Notification",
                "subject": "Welcome to EVEP Platform",
                "body": "Welcome {user_name}! Thank you for joining the EVEP Platform.",
                "variables": ["user_name"],
                "notification_type": "system"
            },
            "screening_scheduled": {
                "name": "Screening Scheduled",
                "subject": "Screening Appointment Scheduled",
                "body": "Your screening appointment has been scheduled for {appointment_date} at {appointment_time}.",
                "variables": ["appointment_date", "appointment_time"],
                "notification_type": "appointment"
            },
            "screening_reminder": {
                "name": "Screening Reminder",
                "subject": "Screening Appointment Reminder",
                "body": "Reminder: You have a screening appointment tomorrow at {appointment_time}.",
                "variables": ["appointment_time"],
                "notification_type": "reminder"
            },
            "results_ready": {
                "name": "Results Ready",
                "subject": "Your Screening Results Are Ready",
                "body": "Your screening results are now available. Please log in to view them.",
                "variables": [],
                "notification_type": "results"
            },
            "system_maintenance": {
                "name": "System Maintenance",
                "subject": "Scheduled System Maintenance",
                "body": "The system will be under maintenance from {start_time} to {end_time}.",
                "variables": ["start_time", "end_time"],
                "notification_type": "system"
            }
        }
        
        # Demo notification settings
        self.settings = {
            "email_notifications": True,
            "sms_notifications": False,
            "push_notifications": True,
            "notification_frequency": "immediate",
            "quiet_hours": {
                "enabled": True,
                "start_time": "22:00",
                "end_time": "08:00"
            },
            "notification_types": {
                "system": True,
                "appointment": True,
                "reminder": True,
                "results": True,
                "alert": True
            }
        }
        
        # Demo notifications
        demo_notifications = [
            {
                "notification_id": "NOT-000001",
                "user_id": "user-001",
                "notification_type": "system",
                "title": "Welcome to EVEP Platform",
                "message": "Welcome John Doe! Thank you for joining the EVEP Platform.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "read_at": None,
                "priority": "normal",
                "category": "welcome"
            },
            {
                "notification_id": "NOT-000002",
                "user_id": "user-001",
                "notification_type": "appointment",
                "title": "Screening Appointment Scheduled",
                "message": "Your screening appointment has been scheduled for 2024-01-15 at 10:00 AM.",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
                "priority": "normal",
                "category": "screening"
            },
            {
                "notification_id": "NOT-000003",
                "user_id": "user-002",
                "notification_type": "reminder",
                "title": "Screening Appointment Reminder",
                "message": "Reminder: You have a screening appointment tomorrow at 2:00 PM.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "read_at": None,
                "priority": "high",
                "category": "reminder"
            },
            {
                "notification_id": "NOT-000004",
                "user_id": "user-003",
                "notification_type": "results",
                "title": "Your Screening Results Are Ready",
                "message": "Your screening results are now available. Please log in to view them.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "read_at": None,
                "priority": "high",
                "category": "results"
            },
            {
                "notification_id": "NOT-000005",
                "user_id": "user-001",
                "notification_type": "system",
                "title": "Scheduled System Maintenance",
                "message": "The system will be under maintenance from 02:00 AM to 04:00 AM.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=30)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=30)).isoformat(),
                "read_at": None,
                "priority": "normal",
                "category": "maintenance"
            }
        ]
        
        for notification in demo_notifications:
            self.notifications[notification["notification_id"]] = notification
            self.notification_counter = max(self.notification_counter, int(notification["notification_id"].split("-")[1]))
    
    async def get_notifications(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[str] = None,
        notification_type: Optional[str] = None,
        status: Optional[str] = None,
        read: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get notifications with optional filtering"""
        notifications = list(self.notifications.values())
        
        # Apply filters
        if user_id:
            notifications = [n for n in notifications if n["user_id"] == user_id]
        
        if notification_type:
            notifications = [n for n in notifications if n["notification_type"] == notification_type]
        
        if status:
            notifications = [n for n in notifications if n["status"] == status]
        
        if read is not None:
            notifications = [n for n in notifications if n["read"] == read]
        
        # Sort by creation date (newest first)
        notifications.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        return notifications[skip:skip + limit]
    
    async def get_notification(self, notification_id: str) -> Optional[Dict[str, Any]]:
        """Get a notification by ID"""
        return self.notifications.get(notification_id)
    
    async def create_notification(self, notification_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new notification"""
        # Validate required fields
        required_fields = ["user_id", "notification_type", "title", "message"]
        for field in required_fields:
            if field not in notification_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate notification ID
        self.notification_counter += 1
        notification_id = f"NOT-{self.notification_counter:06d}"
        
        # Create notification
        notification = {
            "notification_id": notification_id,
            "user_id": notification_data["user_id"],
            "notification_type": notification_data["notification_type"],
            "title": notification_data["title"],
            "message": notification_data["message"],
            "status": "pending",
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
            "sent_at": None,
            "read_at": None,
            "priority": notification_data.get("priority", "normal"),
            "category": notification_data.get("category", "general"),
            "metadata": notification_data.get("metadata", {})
        }
        
        # Store notification
        self.notifications[notification_id] = notification
        
        # Send notification
        await self._send_notification(notification)
        
        return notification
    
    async def _send_notification(self, notification: Dict[str, Any]) -> None:
        """Send a notification"""
        # Update status to sent
        notification["status"] = "sent"
        notification["sent_at"] = datetime.utcnow().isoformat()
        
        # In a real implementation, this would:
        # 1. Check user notification preferences
        # 2. Send via email, SMS, push notification, etc.
        # 3. Handle delivery failures
        # 4. Update delivery status
        
        print(f"📧 Sending notification {notification['notification_id']} to user {notification['user_id']}")
    
    async def update_notification(self, notification_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a notification"""
        if notification_id not in self.notifications:
            return None
        
        notification = self.notifications[notification_id]
        
        # Update fields
        for key, value in updates.items():
            if key in notification:
                notification[key] = value
        
        notification["updated_at"] = datetime.utcnow().isoformat()
        
        return notification
    
    async def delete_notification(self, notification_id: str) -> bool:
        """Delete a notification"""
        if notification_id not in self.notifications:
            return False
        
        del self.notifications[notification_id]
        return True
    
    async def mark_as_read(self, notification_id: str) -> Optional[Dict[str, Any]]:
        """Mark a notification as read"""
        if notification_id not in self.notifications:
            return None
        
        notification = self.notifications[notification_id]
        notification["read"] = True
        notification["read_at"] = datetime.utcnow().isoformat()
        
        return notification
    
    async def mark_as_unread(self, notification_id: str) -> Optional[Dict[str, Any]]:
        """Mark a notification as unread"""
        if notification_id not in self.notifications:
            return None
        
        notification = self.notifications[notification_id]
        notification["read"] = False
        notification["read_at"] = None
        
        return notification
    
    async def mark_multiple_as_read(self, notification_ids: List[str]) -> int:
        """Mark multiple notifications as read"""
        count = 0
        for notification_id in notification_ids:
            if await self.mark_as_read(notification_id):
                count += 1
        
        return count
    
    async def get_user_notifications(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get notifications for a specific user"""
        notifications = await self.get_notifications(
            skip=skip,
            limit=limit,
            user_id=user_id
        )
        
        if unread_only:
            notifications = [n for n in notifications if not n["read"]]
        
        return notifications
    
    async def get_user_unread_count(self, user_id: str) -> int:
        """Get unread notification count for a user"""
        notifications = await self.get_notifications(user_id=user_id)
        unread_count = len([n for n in notifications if not n["read"]])
        
        return unread_count
    
    async def get_templates(self) -> Dict[str, Any]:
        """Get available notification templates"""
        return self.templates
    
    async def get_settings(self) -> Dict[str, Any]:
        """Get notification settings"""
        return self.settings
    
    async def update_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update notification settings"""
        # Validate settings
        valid_settings = [
            "email_notifications",
            "sms_notifications",
            "push_notifications",
            "notification_frequency",
            "quiet_hours",
            "notification_types"
        ]
        
        for key in settings:
            if key not in valid_settings:
                raise ValueError(f"Invalid setting: {key}")
        
        # Update settings
        self.settings.update(settings)
        
        return self.settings
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get notification statistics"""
        total_notifications = len(self.notifications)
        read_notifications = len([n for n in self.notifications.values() if n["read"]])
        unread_notifications = total_notifications - read_notifications
        
        # Type distribution
        type_counts = {}
        for notification in self.notifications.values():
            notification_type = notification["notification_type"]
            type_counts[notification_type] = type_counts.get(notification_type, 0) + 1
        
        # Status distribution
        status_counts = {}
        for notification in self.notifications.values():
            status = notification["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for notification in self.notifications.values():
            priority = notification["priority"]
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_notifications = [
            n for n in self.notifications.values()
            if datetime.fromisoformat(n["created_at"]) > week_ago
        ]
        
        return {
            "total_notifications": total_notifications,
            "read_notifications": read_notifications,
            "unread_notifications": unread_notifications,
            "type_distribution": type_counts,
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "recent_notifications": len(recent_notifications),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def send_template_notification(
        self,
        template_name: str,
        user_id: str,
        variables: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """Send a notification using a template"""
        if template_name not in self.templates:
            raise ValueError(f"Template not found: {template_name}")
        
        template = self.templates[template_name]
        
        # Validate required variables
        for variable in template["variables"]:
            if variable not in variables:
                raise ValueError(f"Missing required variable: {variable}")
        
        # Format message
        message = template["body"]
        for variable, value in variables.items():
            message = message.replace(f"{{{variable}}}", value)
        
        # Create notification
        notification_data = {
            "user_id": user_id,
            "notification_type": template["notification_type"],
            "title": template["subject"],
            "message": message,
            "category": template_name
        }
        
        return await self.create_notification(notification_data)
    
    async def send_bulk_notification(
        self,
        user_ids: List[str],
        notification_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Send notification to multiple users"""
        notifications = []
        
        for user_id in user_ids:
            notification_data["user_id"] = user_id
            notification = await self.create_notification(notification_data.copy())
            notifications.append(notification)
        
        return notifications
    
    async def cleanup_old_notifications(self, days: int = 30) -> int:
        """Clean up old notifications"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        deleted_count = 0
        
        notifications_to_delete = []
        for notification_id, notification in self.notifications.items():
            if datetime.fromisoformat(notification["created_at"]) < cutoff_date:
                notifications_to_delete.append(notification_id)
        
        for notification_id in notifications_to_delete:
            del self.notifications[notification_id]
            deleted_count += 1
        
        return deleted_count
    
    async def get_notification_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get notification preferences for a user"""
        # In a real implementation, this would fetch user-specific preferences
        # For now, return default settings
        return {
            "user_id": user_id,
            "email_notifications": True,
            "sms_notifications": False,
            "push_notifications": True,
            "notification_frequency": "immediate",
            "quiet_hours": {
                "enabled": True,
                "start_time": "22:00",
                "end_time": "08:00"
            },
            "notification_types": {
                "system": True,
                "appointment": True,
                "reminder": True,
                "results": True,
                "alert": True
            }
        }
    
    async def update_notification_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update notification preferences for a user"""
        # In a real implementation, this would save user-specific preferences
        # For now, just return the updated preferences
        return {
            "user_id": user_id,
            **preferences,
            "updated_at": datetime.utcnow().isoformat()
        }

