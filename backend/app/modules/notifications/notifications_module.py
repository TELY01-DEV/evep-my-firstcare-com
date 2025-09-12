from abc import ABC
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.base_module import BaseModule
from app.core.config import Config
from app.core.event_bus import event_bus
from app.modules.notifications.services.notification_service import NotificationService
from app.modules.notifications.services.alert_service import AlertService
from app.modules.notifications.services.messaging_service import MessagingService

class NotificationsModule(BaseModule):
    """Notifications module for EVEP Platform"""
    
    def __init__(self):
        super().__init__()
        self.name = "notifications"
        self.version = "1.0.0"
        self.description = "Notifications, alerts, and messaging system"
        
        # Initialize services
        self.notification_service = NotificationService()
        self.alert_service = AlertService()
        self.messaging_service = MessagingService()
        
        # Setup router
        self.router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])
        self._setup_routes()
    
    async def initialize(self) -> None:
        """Initialize the notifications module"""
        print(f"🔧 Initializing {self.name} module v{self.version}")
        
        # Initialize services
        await self.notification_service.initialize()
        await self.alert_service.initialize()
        await self.messaging_service.initialize()
        
        # Subscribe to events
        event_bus.subscribe("notification.send", self._handle_notification_send)
        event_bus.subscribe("alert.triggered", self._handle_alert_triggered)
        event_bus.subscribe("message.sent", self._handle_message_sent)
        
        print(f"✅ {self.name} module initialized successfully")
    
    def get_router(self) -> APIRouter:
        """Get the notifications module router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get events that this module subscribes to"""
        return [
            "notification.send",
            "alert.triggered",
            "message.sent"
        ]
    
    def _setup_routes(self) -> None:
        """Setup notifications API routes"""
        
        @self.router.get("/")
        async def get_notifications(
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            user_id: Optional[str] = Query(None, description="Filter by user ID"),
            notification_type: Optional[str] = Query(None, description="Filter by notification type"),
            status: Optional[str] = Query(None, description="Filter by status"),
            read: Optional[bool] = Query(None, description="Filter by read status")
        ):
            """Get all notifications with optional filtering"""
            try:
                notifications = await self.notification_service.get_notifications(
                    skip=skip,
                    limit=limit,
                    user_id=user_id,
                    notification_type=notification_type,
                    status=status,
                    read=read
                )
                return {
                    "status": "success",
                    "data": notifications,
                    "message": "Notifications retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(notifications)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/{notification_id}")
        async def get_notification(notification_id: str):
            """Get a specific notification by ID"""
            try:
                notification = await self.notification_service.get_notification(notification_id)
                if not notification:
                    raise HTTPException(status_code=404, detail="Notification not found")
                
                return {
                    "status": "success",
                    "data": notification,
                    "message": "Notification retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/")
        async def create_notification(notification_data: Dict[str, Any]):
            """Create a new notification"""
            try:
                notification = await self.notification_service.create_notification(notification_data)
                return {
                    "status": "success",
                    "data": notification,
                    "message": "Notification created successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/{notification_id}")
        async def update_notification(notification_id: str, updates: Dict[str, Any]):
            """Update a notification"""
            try:
                notification = await self.notification_service.update_notification(notification_id, updates)
                if not notification:
                    raise HTTPException(status_code=404, detail="Notification not found")
                
                return {
                    "status": "success",
                    "data": notification,
                    "message": "Notification updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/{notification_id}")
        async def delete_notification(notification_id: str):
            """Delete a notification"""
            try:
                success = await self.notification_service.delete_notification(notification_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Notification not found")
                
                return {
                    "status": "success",
                    "message": "Notification deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{notification_id}/read")
        async def mark_notification_read(notification_id: str):
            """Mark a notification as read"""
            try:
                notification = await self.notification_service.mark_as_read(notification_id)
                if not notification:
                    raise HTTPException(status_code=404, detail="Notification not found")
                
                return {
                    "status": "success",
                    "data": notification,
                    "message": "Notification marked as read"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/{notification_id}/unread")
        async def mark_notification_unread(notification_id: str):
            """Mark a notification as unread"""
            try:
                notification = await self.notification_service.mark_as_unread(notification_id)
                if not notification:
                    raise HTTPException(status_code=404, detail="Notification not found")
                
                return {
                    "status": "success",
                    "data": notification,
                    "message": "Notification marked as unread"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/bulk/read")
        async def mark_notifications_read_bulk(notification_ids: List[str]):
            """Mark multiple notifications as read"""
            try:
                count = await self.notification_service.mark_multiple_as_read(notification_ids)
                return {
                    "status": "success",
                    "data": {"marked_count": count},
                    "message": f"{count} notifications marked as read"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/user/{user_id}")
        async def get_user_notifications(
            user_id: str,
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            unread_only: bool = Query(False, description="Get only unread notifications")
        ):
            """Get notifications for a specific user"""
            try:
                notifications = await self.notification_service.get_user_notifications(
                    user_id=user_id,
                    skip=skip,
                    limit=limit,
                    unread_only=unread_only
                )
                return {
                    "status": "success",
                    "data": notifications,
                    "message": "User notifications retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(notifications)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/user/{user_id}/unread-count")
        async def get_user_unread_count(user_id: str):
            """Get unread notification count for a user"""
            try:
                count = await self.notification_service.get_user_unread_count(user_id)
                return {
                    "status": "success",
                    "data": {"unread_count": count},
                    "message": "Unread count retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/alerts/")
        async def get_alerts(
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            alert_type: Optional[str] = Query(None, description="Filter by alert type"),
            severity: Optional[str] = Query(None, description="Filter by severity"),
            status: Optional[str] = Query(None, description="Filter by status")
        ):
            """Get all alerts with optional filtering"""
            try:
                alerts = await self.alert_service.get_alerts(
                    skip=skip,
                    limit=limit,
                    alert_type=alert_type,
                    severity=severity,
                    status=status
                )
                return {
                    "status": "success",
                    "data": alerts,
                    "message": "Alerts retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(alerts)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/alerts/{alert_id}")
        async def get_alert(alert_id: str):
            """Get a specific alert by ID"""
            try:
                alert = await self.alert_service.get_alert(alert_id)
                if not alert:
                    raise HTTPException(status_code=404, detail="Alert not found")
                
                return {
                    "status": "success",
                    "data": alert,
                    "message": "Alert retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/alerts/")
        async def create_alert(alert_data: Dict[str, Any]):
            """Create a new alert"""
            try:
                alert = await self.alert_service.create_alert(alert_data)
                return {
                    "status": "success",
                    "data": alert,
                    "message": "Alert created successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/alerts/{alert_id}")
        async def update_alert(alert_id: str, updates: Dict[str, Any]):
            """Update an alert"""
            try:
                alert = await self.alert_service.update_alert(alert_id, updates)
                if not alert:
                    raise HTTPException(status_code=404, detail="Alert not found")
                
                return {
                    "status": "success",
                    "data": alert,
                    "message": "Alert updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/alerts/{alert_id}")
        async def delete_alert(alert_id: str):
            """Delete an alert"""
            try:
                success = await self.alert_service.delete_alert(alert_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Alert not found")
                
                return {
                    "status": "success",
                    "message": "Alert deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/alerts/{alert_id}/acknowledge")
        async def acknowledge_alert(alert_id: str):
            """Acknowledge an alert"""
            try:
                alert = await self.alert_service.acknowledge_alert(alert_id)
                if not alert:
                    raise HTTPException(status_code=404, detail="Alert not found")
                
                return {
                    "status": "success",
                    "data": alert,
                    "message": "Alert acknowledged successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/alerts/{alert_id}/resolve")
        async def resolve_alert(alert_id: str):
            """Resolve an alert"""
            try:
                alert = await self.alert_service.resolve_alert(alert_id)
                if not alert:
                    raise HTTPException(status_code=404, detail="Alert not found")
                
                return {
                    "status": "success",
                    "data": alert,
                    "message": "Alert resolved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/alerts/active")
        async def get_active_alerts():
            """Get all active alerts"""
            try:
                alerts = await self.alert_service.get_active_alerts()
                return {
                    "status": "success",
                    "data": alerts,
                    "message": "Active alerts retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/alerts/critical")
        async def get_critical_alerts():
            """Get all critical alerts"""
            try:
                alerts = await self.alert_service.get_critical_alerts()
                return {
                    "status": "success",
                    "data": alerts,
                    "message": "Critical alerts retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/messages/")
        async def get_messages(
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            sender_id: Optional[str] = Query(None, description="Filter by sender ID"),
            recipient_id: Optional[str] = Query(None, description="Filter by recipient ID"),
            message_type: Optional[str] = Query(None, description="Filter by message type"),
            status: Optional[str] = Query(None, description="Filter by status")
        ):
            """Get all messages with optional filtering"""
            try:
                messages = await self.messaging_service.get_messages(
                    skip=skip,
                    limit=limit,
                    sender_id=sender_id,
                    recipient_id=recipient_id,
                    message_type=message_type,
                    status=status
                )
                return {
                    "status": "success",
                    "data": messages,
                    "message": "Messages retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(messages)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/messages/{message_id}")
        async def get_message(message_id: str):
            """Get a specific message by ID"""
            try:
                message = await self.messaging_service.get_message(message_id)
                if not message:
                    raise HTTPException(status_code=404, detail="Message not found")
                
                return {
                    "status": "success",
                    "data": message,
                    "message": "Message retrieved successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/messages/")
        async def send_message(message_data: Dict[str, Any]):
            """Send a new message"""
            try:
                message = await self.messaging_service.send_message(message_data)
                return {
                    "status": "success",
                    "data": message,
                    "message": "Message sent successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/messages/{message_id}")
        async def update_message(message_id: str, updates: Dict[str, Any]):
            """Update a message"""
            try:
                message = await self.messaging_service.update_message(message_id, updates)
                if not message:
                    raise HTTPException(status_code=404, detail="Message not found")
                
                return {
                    "status": "success",
                    "data": message,
                    "message": "Message updated successfully"
                }
            except HTTPException:
                raise
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.delete("/messages/{message_id}")
        async def delete_message(message_id: str):
            """Delete a message"""
            try:
                success = await self.messaging_service.delete_message(message_id)
                if not success:
                    raise HTTPException(status_code=404, detail="Message not found")
                
                return {
                    "status": "success",
                    "message": "Message deleted successfully"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/messages/conversation/{conversation_id}")
        async def get_conversation_messages(
            conversation_id: str,
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
        ):
            """Get messages in a conversation"""
            try:
                messages = await self.messaging_service.get_conversation_messages(
                    conversation_id=conversation_id,
                    skip=skip,
                    limit=limit
                )
                return {
                    "status": "success",
                    "data": messages,
                    "message": "Conversation messages retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(messages)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/messages/user/{user_id}")
        async def get_user_messages(
            user_id: str,
            skip: int = Query(0, ge=0, description="Number of records to skip"),
            limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
            unread_only: bool = Query(False, description="Get only unread messages")
        ):
            """Get messages for a specific user"""
            try:
                messages = await self.messaging_service.get_user_messages(
                    user_id=user_id,
                    skip=skip,
                    limit=limit,
                    unread_only=unread_only
                )
                return {
                    "status": "success",
                    "data": messages,
                    "message": "User messages retrieved successfully",
                    "pagination": {
                        "skip": skip,
                        "limit": limit,
                        "total": len(messages)
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.post("/messages/{message_id}/read")
        async def mark_message_read(message_id: str):
            """Mark a message as read"""
            try:
                message = await self.messaging_service.mark_as_read(message_id)
                if not message:
                    raise HTTPException(status_code=404, detail="Message not found")
                
                return {
                    "status": "success",
                    "data": message,
                    "message": "Message marked as read"
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/templates")
        async def get_notification_templates():
            """Get available notification templates"""
            try:
                templates = await self.notification_service.get_templates()
                return {
                    "status": "success",
                    "data": templates,
                    "message": "Notification templates retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/settings")
        async def get_notification_settings():
            """Get notification settings"""
            try:
                settings = await self.notification_service.get_settings()
                return {
                    "status": "success",
                    "data": settings,
                    "message": "Notification settings retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.put("/settings")
        async def update_notification_settings(settings: Dict[str, Any]):
            """Update notification settings"""
            try:
                updated_settings = await self.notification_service.update_settings(settings)
                return {
                    "status": "success",
                    "data": updated_settings,
                    "message": "Notification settings updated successfully"
                }
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.router.get("/statistics")
        async def get_notification_statistics():
            """Get notification statistics"""
            try:
                statistics = await self.notification_service.get_statistics()
                return {
                    "status": "success",
                    "data": statistics,
                    "message": "Notification statistics retrieved successfully"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    
    async def _handle_notification_send(self, data: Dict[str, Any]) -> None:
        """Handle notification send event"""
        try:
            notification_id = data.get("notification_id")
            notification_type = data.get("notification_type")
            user_id = data.get("user_id")
            
            # Emit additional events
            await event_bus.emit("audit.log", {
                "action": "notification_sent",
                "resource": "notification",
                "resource_id": notification_id,
                "user_id": user_id,
                "details": {"notification_type": notification_type}
            })
            
        except Exception as e:
            print(f"Error handling notification send event: {e}")
    
    async def _handle_alert_triggered(self, data: Dict[str, Any]) -> None:
        """Handle alert triggered event"""
        try:
            alert_id = data.get("alert_id")
            alert_type = data.get("alert_type")
            severity = data.get("severity")
            
            await event_bus.emit("audit.log", {
                "action": "alert_triggered",
                "resource": "alert",
                "resource_id": alert_id,
                "details": {
                    "alert_type": alert_type,
                    "severity": severity
                }
            })
            
        except Exception as e:
            print(f"Error handling alert triggered event: {e}")
    
    async def _handle_message_sent(self, data: Dict[str, Any]) -> None:
        """Handle message sent event"""
        try:
            message_id = data.get("message_id")
            sender_id = data.get("sender_id")
            recipient_id = data.get("recipient_id")
            
            await event_bus.emit("audit.log", {
                "action": "message_sent",
                "resource": "message",
                "resource_id": message_id,
                "user_id": sender_id,
                "details": {"recipient_id": recipient_id}
            })
            
        except Exception as e:
            print(f"Error handling message sent event: {e}")

