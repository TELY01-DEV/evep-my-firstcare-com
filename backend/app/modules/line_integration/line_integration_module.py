"""
LINE Integration Module for EVEP Platform
Handles LINE bot integration for communication and notifications
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import (
    TextSendMessage, ImageSendMessage, TemplateSendMessage,
    ButtonsTemplate, PostbackAction, MessageAction,
    CarouselTemplate, CarouselColumn, FlexSendMessage
)

from app.core.base_module import BaseModule
from app.core.event_bus import event_bus
from app.modules.line_integration.services.line_bot_service import LineBotService
from app.modules.line_integration.services.line_message_service import LineMessageService
from app.modules.line_integration.services.line_webhook_service import LineWebhookService

# Import the comprehensive bot manager from DiaCare Buddy
from app.modules.line_integration.bot_manager import router as bot_manager_router

class LineIntegrationModule(BaseModule):
    """LINE Integration Module for EVEP Platform"""
    
    def __init__(self):
        super().__init__("line_integration", {
            "enabled": True,
            "version": "1.0.0",
            "dependencies": ["auth", "database", "notifications", "patient_management"],
            "config": {
                "line_channel_access_token": os.getenv("LINE_CHANNEL_ACCESS_TOKEN", ""),
                "line_channel_secret": os.getenv("LINE_CHANNEL_SECRET", ""),
                "webhook_url": "/api/v1/line_integration/webhook",
                "features": {
                    "screening_reminders": True,
                    "result_notifications": True,
                    "appointment_management": True,
                    "educational_content": True,
                    "support_chat": True
                }
            }
        })
        
        # Initialize services
        self.line_bot_service = LineBotService()
        self.line_message_service = LineMessageService()
        self.line_webhook_service = LineWebhookService()
        
        # Setup routes
        self._setup_routes()
    
    def get_router(self) -> APIRouter:
        """Get the module's router"""
        return self.router
    
    def get_events(self) -> List[str]:
        """Get the module's event subscriptions"""
        return [
            "screening.reminder",
            "screening.completed",
            "appointment.scheduled",
            "appointment.reminder",
            "notification.send",
            "educational.content"
        ]
    
    async def initialize(self) -> None:
        """Initialize the LINE Integration module"""
        print(f"🔧 Initializing LINE Integration module v{self.config['version']}")
        
        # Initialize services
        await self.line_bot_service.initialize()
        await self.line_message_service.initialize()
        await self.line_webhook_service.initialize()
        
        print(f"🔧 LINE Bot service initialized")
        print(f"🔧 LINE Message service initialized")
        print(f"🔧 LINE Webhook service initialized")
        
        # Subscribe to events
        event_bus.subscribe("screening.reminder", self._handle_screening_reminder)
        event_bus.subscribe("screening.completed", self._handle_screening_completed)
        event_bus.subscribe("appointment.scheduled", self._handle_appointment_scheduled)
        event_bus.subscribe("appointment.reminder", self._handle_appointment_reminder)
        event_bus.subscribe("notification.send", self._handle_notification_send)
        event_bus.subscribe("educational.content", self._handle_educational_content)
        
        print(f"✅ {self.module_name} module initialized successfully")
    
    def _setup_routes(self) -> None:
        """Setup API routes"""
        
        # Include the comprehensive bot manager routes
        self.router.include_router(bot_manager_router, prefix="/bot", tags=["Bot Manager"])
        
        # LINE Webhook
        @self.router.post("/webhook")
        async def line_webhook(request: Request):
            """Handle LINE webhook events"""
            return await self._handle_webhook(request)
        
        # LINE Bot management
        @self.router.post("/send-message")
        async def send_message(data: Dict[str, Any]):
            """Send message to LINE user"""
            return await self._send_message(data)
        
        @self.router.post("/broadcast")
        async def broadcast_message(data: Dict[str, Any]):
            """Broadcast message to all LINE users"""
            return await self._broadcast_message(data)
        
        # LINE User management
        @self.router.get("/users")
        async def get_line_users():
            """Get all LINE users"""
            return await self._get_line_users()
        
        @self.router.post("/users/{user_id}/link")
        async def link_user(user_id: str, data: Dict[str, Any]):
            """Link LINE user to EVEP account"""
            return await self._link_user(user_id, data)
        
        @self.router.delete("/users/{user_id}/unlink")
        async def unlink_user(user_id: str):
            """Unlink LINE user from EVEP account"""
            return await self._unlink_user(user_id)
        
        # LINE Bot features
        @self.router.post("/screening-reminder")
        async def send_screening_reminder(data: Dict[str, Any]):
            """Send screening reminder via LINE"""
            return await self._send_screening_reminder(data)
        
        @self.router.post("/appointment-reminder")
        async def send_appointment_reminder(data: Dict[str, Any]):
            """Send appointment reminder via LINE"""
            return await self._send_appointment_reminder(data)
        
        @self.router.post("/educational-content")
        async def send_educational_content(data: Dict[str, Any]):
            """Send educational content via LINE"""
            return await self._send_educational_content(data)
        
        # LINE Bot analytics
        @self.router.get("/analytics")
        async def get_line_analytics(time_period: str = "30d"):
            """Get LINE bot analytics"""
            return await self._get_line_analytics(time_period)
        
        # Health check endpoint
        @self.router.get("/health")
        async def health_check():
            """Health check endpoint for LINE Integration module"""
            return {
                "status": "healthy",
                "module": "line_integration",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # Event handlers
    async def _handle_screening_reminder(self, data: Dict[str, Any]) -> None:
        """Handle screening reminder event"""
        try:
            patient_id = data.get("patient_id")
            reminder_type = data.get("reminder_type", "general")
            
            # Send LINE reminder
            await self.line_bot_service.send_screening_reminder(patient_id, reminder_type)
            
        except Exception as e:
            print(f"Error handling screening reminder: {e}")
    
    async def _handle_screening_completed(self, data: Dict[str, Any]) -> None:
        """Handle screening completion event"""
        try:
            screening_id = data.get("screening_id")
            patient_id = data.get("patient_id")
            
            # Send LINE notification
            await self.line_bot_service.send_screening_results(patient_id, screening_id)
            
        except Exception as e:
            print(f"Error handling screening completion: {e}")
    
    async def _handle_appointment_scheduled(self, data: Dict[str, Any]) -> None:
        """Handle appointment scheduling event"""
        try:
            appointment_id = data.get("appointment_id")
            patient_id = data.get("patient_id")
            
            # Send LINE confirmation
            await self.line_bot_service.send_appointment_confirmation(patient_id, appointment_id)
            
        except Exception as e:
            print(f"Error handling appointment scheduling: {e}")
    
    async def _handle_appointment_reminder(self, data: Dict[str, Any]) -> None:
        """Handle appointment reminder event"""
        try:
            appointment_id = data.get("appointment_id")
            patient_id = data.get("patient_id")
            
            # Send LINE reminder
            await self.line_bot_service.send_appointment_reminder(patient_id, appointment_id)
            
        except Exception as e:
            print(f"Error handling appointment reminder: {e}")
    
    async def _handle_notification_send(self, data: Dict[str, Any]) -> None:
        """Handle notification send event"""
        try:
            user_id = data.get("user_id")
            message = data.get("message")
            notification_type = data.get("type", "general")
            
            # Send LINE notification
            await self.line_bot_service.send_notification(user_id, message, notification_type)
            
        except Exception as e:
            print(f"Error handling notification send: {e}")
    
    async def _handle_educational_content(self, data: Dict[str, Any]) -> None:
        """Handle educational content event"""
        try:
            content_type = data.get("content_type")
            target_users = data.get("target_users", [])
            
            # Send educational content
            await self.line_bot_service.send_educational_content(target_users, content_type)
            
        except Exception as e:
            print(f"Error handling educational content: {e}")
    
    # API endpoint handlers
    async def _handle_webhook(self, request: Request) -> Dict[str, Any]:
        """Handle LINE webhook events"""
        try:
            body = await request.body()
            signature = request.headers.get('X-Line-Signature', '')
            
            # Process webhook
            result = await self.line_webhook_service.process_webhook(body, signature)
            
            return {
                "status": "success",
                "data": result
            }
            
        except InvalidSignatureError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")
    
    async def _send_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send message to LINE user"""
        try:
            user_id = data.get("user_id")
            message = data.get("message")
            message_type = data.get("type", "text")
            
            result = await self.line_bot_service.send_message(user_id, message, message_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
    async def _broadcast_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Broadcast message to all LINE users"""
        try:
            message = data.get("message")
            message_type = data.get("type", "text")
            
            result = await self.line_bot_service.broadcast_message(message, message_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to broadcast message: {str(e)}")
    
    async def _get_line_users(self) -> Dict[str, Any]:
        """Get all LINE users"""
        try:
            users = await self.line_bot_service.get_users()
            
            return {
                "status": "success",
                "data": {
                    "users": users,
                    "total": len(users)
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")
    
    async def _link_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Link LINE user to EVEP account"""
        try:
            evep_user_id = data.get("evep_user_id")
            user_type = data.get("user_type", "patient")
            
            result = await self.line_bot_service.link_user(user_id, evep_user_id, user_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to link user: {str(e)}")
    
    async def _unlink_user(self, user_id: str) -> Dict[str, Any]:
        """Unlink LINE user from EVEP account"""
        try:
            result = await self.line_bot_service.unlink_user(user_id)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to unlink user: {str(e)}")
    
    async def _send_screening_reminder(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send screening reminder via LINE"""
        try:
            patient_id = data.get("patient_id")
            reminder_type = data.get("reminder_type", "general")
            
            result = await self.line_bot_service.send_screening_reminder(patient_id, reminder_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send screening reminder: {str(e)}")
    
    async def _send_appointment_reminder(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send appointment reminder via LINE"""
        try:
            appointment_id = data.get("appointment_id")
            patient_id = data.get("patient_id")
            
            result = await self.line_bot_service.send_appointment_reminder(patient_id, appointment_id)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send appointment reminder: {str(e)}")
    
    async def _send_educational_content(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send educational content via LINE"""
        try:
            content_type = data.get("content_type")
            target_users = data.get("target_users", [])
            
            result = await self.line_bot_service.send_educational_content(target_users, content_type)
            
            return {
                "status": "success",
                "data": result
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send educational content: {str(e)}")
    
    async def _get_line_analytics(self, time_period: str) -> Dict[str, Any]:
        """Get LINE bot analytics"""
        try:
            analytics = await self.line_bot_service.get_analytics(time_period)
            
            return {
                "status": "success",
                "data": analytics
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
