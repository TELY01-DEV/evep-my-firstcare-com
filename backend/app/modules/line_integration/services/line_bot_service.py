"""
LINE Bot Service for EVEP Platform
Handles LINE bot operations and messaging
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from linebot import LineBotApi
from linebot.models import (
    TextSendMessage, ImageSendMessage, TemplateSendMessage,
    ButtonsTemplate, PostbackAction, MessageAction,
    CarouselTemplate, CarouselColumn, FlexSendMessage
)

from app.core.database import get_database
from app.core.config import Config

class LineBotService:
    """LINE Bot Service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("line_integration")
        self.db = None
        self.line_bot_api = None
        self.channel_access_token = None
        self.channel_secret = None
    
    async def initialize(self) -> None:
        """Initialize the LINE Bot service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize LINE Bot API
        self.channel_access_token = self.config.get("config", {}).get("line_channel_access_token")
        self.channel_secret = self.config.get("config", {}).get("line_channel_secret")
        
        if self.channel_access_token:
            self.line_bot_api = LineBotApi(self.channel_access_token)
            print("✅ LINE Bot API initialized")
        else:
            print("⚠️  LINE Channel Access Token not found. LINE features will be limited.")
        
        print("✅ LINE Bot Service initialized")
    
    async def send_message(self, user_id: str, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Send message to LINE user"""
        try:
            if not self.line_bot_api:
                return {"error": "LINE Bot API not initialized"}
            
            if message_type == "text":
                line_message = TextSendMessage(text=message)
            elif message_type == "image":
                line_message = ImageSendMessage(
                    original_content_url=message,
                    preview_image_url=message
                )
            else:
                line_message = TextSendMessage(text=message)
            
            # Send message
            response = self.line_bot_api.push_message(user_id, line_message)
            
            # Log message
            await self._log_message(user_id, message, message_type, "sent")
            
            return {
                "status": "success",
                "message_id": response.message_id if hasattr(response, 'message_id') else None,
                "sent_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error sending LINE message: {e}")
            return {"error": str(e)}
    
    async def broadcast_message(self, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Broadcast message to all LINE users"""
        try:
            if not self.line_bot_api:
                return {"error": "LINE Bot API not initialized"}
            
            # Get all LINE users
            users = await self.get_users()
            user_ids = [user["line_user_id"] for user in users]
            
            if message_type == "text":
                line_message = TextSendMessage(text=message)
            else:
                line_message = TextSendMessage(text=message)
            
            # Broadcast message
            response = self.line_bot_api.multicast(user_ids, line_message)
            
            # Log broadcast
            await self._log_broadcast(message, message_type, len(user_ids))
            
            return {
                "status": "success",
                "sent_to": len(user_ids),
                "sent_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error broadcasting LINE message: {e}")
            return {"error": str(e)}
    
    async def send_screening_reminder(self, patient_id: str, reminder_type: str = "general") -> Dict[str, Any]:
        """Send screening reminder via LINE"""
        try:
            # Get patient data
            patient = await self.db.patients.find_one({"_id": patient_id})
            if not patient:
                return {"error": "Patient not found"}
            
            # Get patient's LINE user ID
            line_user = await self.db.line_users.find_one({"evep_user_id": patient_id})
            if not line_user:
                return {"error": "Patient not linked to LINE"}
            
            # Create reminder message
            if reminder_type == "annual":
                message = f"🔍 การตรวจสายตาประจำปี\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nถึงเวลาตรวจสายตาประจำปีแล้ว\nโปรดนัดหมายการตรวจกับเรา\n\n📞 ติดต่อ: 02-123-4567"
            elif reminder_type == "followup":
                message = f"👁️ การตรวจติดตามผล\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nถึงเวลาตรวจติดตามผลการรักษาแล้ว\nโปรดนัดหมายการตรวจกับเรา\n\n📞 ติดต่อ: 02-123-4567"
            else:
                message = f"🔍 การตรวจสายตา\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nโปรดนัดหมายการตรวจสายตากับเรา\n\n📞 ติดต่อ: 02-123-4567"
            
            # Send message
            result = await self.send_message(line_user["line_user_id"], message)
            
            # Log reminder
            await self._log_reminder(patient_id, reminder_type, "screening")
            
            return result
            
        except Exception as e:
            print(f"Error sending screening reminder: {e}")
            return {"error": str(e)}
    
    async def send_screening_results(self, patient_id: str, screening_id: str) -> Dict[str, Any]:
        """Send screening results via LINE"""
        try:
            # Get patient and screening data
            patient = await self.db.patients.find_one({"_id": patient_id})
            screening = await self.db.screenings.find_one({"_id": screening_id})
            
            if not patient or not screening:
                return {"error": "Patient or screening not found"}
            
            # Get patient's LINE user ID
            line_user = await self.db.line_users.find_one({"evep_user_id": patient_id})
            if not line_user:
                return {"error": "Patient not linked to LINE"}
            
            # Create results message
            status = screening.get("status", "unknown")
            if status == "completed":
                message = f"✅ ผลการตรวจสายตา\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nการตรวจสายตาของ {patient.get('name', 'บุตร')} เสร็จสิ้นแล้ว\n\nผลการตรวจ: {screening.get('results', {}).get('summary', 'ปกติ')}\n\nโปรดติดต่อเราเพื่อรับคำแนะนำเพิ่มเติม\n\n📞 ติดต่อ: 02-123-4567"
            else:
                message = f"⏳ การตรวจสายตา\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nการตรวจสายตาของ {patient.get('name', 'บุตร')} กำลังดำเนินการ\n\nเราจะแจ้งผลให้ทราบเมื่อเสร็จสิ้น\n\n📞 ติดต่อ: 02-123-4567"
            
            # Send message
            result = await self.send_message(line_user["line_user_id"], message)
            
            # Log results notification
            await self._log_notification(patient_id, "screening_results", screening_id)
            
            return result
            
        except Exception as e:
            print(f"Error sending screening results: {e}")
            return {"error": str(e)}
    
    async def send_appointment_confirmation(self, patient_id: str, appointment_id: str) -> Dict[str, Any]:
        """Send appointment confirmation via LINE"""
        try:
            # Get patient data
            patient = await self.db.patients.find_one({"_id": patient_id})
            if not patient:
                return {"error": "Patient not found"}
            
            # Get patient's LINE user ID
            line_user = await self.db.line_users.find_one({"evep_user_id": patient_id})
            if not line_user:
                return {"error": "Patient not linked to LINE"}
            
            # Create confirmation message
            message = f"📅 ยืนยันการนัดหมาย\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nการนัดหมายของคุณได้รับการยืนยันแล้ว\n\n📅 วันที่: {datetime.now().strftime('%d/%m/%Y')}\n⏰ เวลา: 09:00 น.\n📍 สถานที่: คลินิก EVEP\n\nโปรดมาถึงก่อนเวลานัดหมาย 15 นาที\n\n📞 ติดต่อ: 02-123-4567"
            
            # Send message
            result = await self.send_message(line_user["line_user_id"], message)
            
            # Log confirmation
            await self._log_notification(patient_id, "appointment_confirmation", appointment_id)
            
            return result
            
        except Exception as e:
            print(f"Error sending appointment confirmation: {e}")
            return {"error": str(e)}
    
    async def send_appointment_reminder(self, patient_id: str, appointment_id: str) -> Dict[str, Any]:
        """Send appointment reminder via LINE"""
        try:
            # Get patient data
            patient = await self.db.patients.find_one({"_id": patient_id})
            if not patient:
                return {"error": "Patient not found"}
            
            # Get patient's LINE user ID
            line_user = await self.db.line_users.find_one({"evep_user_id": patient_id})
            if not line_user:
                return {"error": "Patient not linked to LINE"}
            
            # Create reminder message
            message = f"⏰ เตือนการนัดหมาย\n\nสวัสดีคุณ {patient.get('name', 'ผู้ปกครอง')}\n\nนี่เป็นการเตือนการนัดหมายของคุณ\n\n📅 วันที่: {datetime.now().strftime('%d/%m/%Y')}\n⏰ เวลา: 09:00 น.\n📍 สถานที่: คลินิก EVEP\n\nโปรดมาถึงก่อนเวลานัดหมาย 15 นาที\n\n📞 ติดต่อ: 02-123-4567"
            
            # Send message
            result = await self.send_message(line_user["line_user_id"], message)
            
            # Log reminder
            await self._log_reminder(patient_id, "appointment", appointment_id)
            
            return result
            
        except Exception as e:
            print(f"Error sending appointment reminder: {e}")
            return {"error": str(e)}
    
    async def send_notification(self, user_id: str, message: str, notification_type: str = "general") -> Dict[str, Any]:
        """Send notification via LINE"""
        try:
            # Get user's LINE ID
            line_user = await self.db.line_users.find_one({"evep_user_id": user_id})
            if not line_user:
                return {"error": "User not linked to LINE"}
            
            # Send message
            result = await self.send_message(line_user["line_user_id"], message)
            
            # Log notification
            await self._log_notification(user_id, notification_type)
            
            return result
            
        except Exception as e:
            print(f"Error sending notification: {e}")
            return {"error": str(e)}
    
    async def send_educational_content(self, target_users: List[str], content_type: str) -> Dict[str, Any]:
        """Send educational content via LINE"""
        try:
            # Get educational content
            content = await self._get_educational_content(content_type)
            if not content:
                return {"error": "Educational content not found"}
            
            # Send to target users
            sent_count = 0
            for user_id in target_users:
                line_user = await self.db.line_users.find_one({"evep_user_id": user_id})
                if line_user:
                    await self.send_message(line_user["line_user_id"], content["message"])
                    sent_count += 1
            
            # Log educational content
            await self._log_educational_content(content_type, sent_count)
            
            return {
                "status": "success",
                "sent_to": sent_count,
                "content_type": content_type
            }
            
        except Exception as e:
            print(f"Error sending educational content: {e}")
            return {"error": str(e)}
    
    async def get_users(self) -> List[Dict[str, Any]]:
        """Get all LINE users"""
        try:
            users = await self.db.line_users.find().to_list(None)
            return [
                {
                    "line_user_id": user["line_user_id"],
                    "evep_user_id": user["evep_user_id"],
                    "user_type": user.get("user_type", "patient"),
                    "linked_at": user.get("linked_at"),
                    "last_activity": user.get("last_activity")
                }
                for user in users
            ]
        except Exception as e:
            print(f"Error getting LINE users: {e}")
            return []
    
    async def link_user(self, line_user_id: str, evep_user_id: str, user_type: str = "patient") -> Dict[str, Any]:
        """Link LINE user to EVEP account"""
        try:
            # Check if already linked
            existing = await self.db.line_users.find_one({"line_user_id": line_user_id})
            if existing:
                return {"error": "LINE user already linked"}
            
            # Create link
            link_data = {
                "line_user_id": line_user_id,
                "evep_user_id": evep_user_id,
                "user_type": user_type,
                "linked_at": datetime.utcnow(),
                "last_activity": datetime.utcnow()
            }
            
            await self.db.line_users.insert_one(link_data)
            
            return {
                "status": "success",
                "linked_at": link_data["linked_at"].isoformat()
            }
            
        except Exception as e:
            print(f"Error linking user: {e}")
            return {"error": str(e)}
    
    async def unlink_user(self, line_user_id: str) -> Dict[str, Any]:
        """Unlink LINE user from EVEP account"""
        try:
            result = await self.db.line_users.delete_one({"line_user_id": line_user_id})
            
            if result.deleted_count > 0:
                return {"status": "success", "message": "User unlinked"}
            else:
                return {"error": "User not found"}
            
        except Exception as e:
            print(f"Error unlinking user: {e}")
            return {"error": str(e)}
    
    async def get_analytics(self, time_period: str = "30d") -> Dict[str, Any]:
        """Get LINE bot analytics"""
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            if time_period == "7d":
                start_date = end_date - timedelta(days=7)
            elif time_period == "30d":
                start_date = end_date - timedelta(days=30)
            elif time_period == "90d":
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=30)
            
            # Get message statistics
            pipeline = [
                {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
                {"$group": {"_id": "$type", "count": {"$sum": 1}}}
            ]
            message_stats = await self.db.line_messages.aggregate(pipeline).to_list(None)
            
            # Get user statistics
            total_users = await self.db.line_users.count_documents({})
            active_users = await self.db.line_users.count_documents({
                "last_activity": {"$gte": start_date}
            })
            
            return {
                "time_period": time_period,
                "total_users": total_users,
                "active_users": active_users,
                "messages_by_type": {stat["_id"]: stat["count"] for stat in message_stats},
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting analytics: {e}")
            return {"error": str(e)}
    
    # Helper methods
    async def _log_message(self, user_id: str, message: str, message_type: str, direction: str) -> None:
        """Log LINE message"""
        try:
            log_data = {
                "line_user_id": user_id,
                "message": message,
                "type": message_type,
                "direction": direction,  # sent, received
                "created_at": datetime.utcnow()
            }
            await self.db.line_messages.insert_one(log_data)
        except Exception as e:
            print(f"Error logging message: {e}")
    
    async def _log_broadcast(self, message: str, message_type: str, recipient_count: int) -> None:
        """Log broadcast message"""
        try:
            log_data = {
                "message": message,
                "type": message_type,
                "recipient_count": recipient_count,
                "direction": "sent",
                "created_at": datetime.utcnow()
            }
            await self.db.line_broadcasts.insert_one(log_data)
        except Exception as e:
            print(f"Error logging broadcast: {e}")
    
    async def _log_reminder(self, user_id: str, reminder_type: str, reference_id: str = None) -> None:
        """Log reminder"""
        try:
            log_data = {
                "user_id": user_id,
                "reminder_type": reminder_type,
                "reference_id": reference_id,
                "sent_at": datetime.utcnow()
            }
            await self.db.line_reminders.insert_one(log_data)
        except Exception as e:
            print(f"Error logging reminder: {e}")
    
    async def _log_notification(self, user_id: str, notification_type: str, reference_id: str = None) -> None:
        """Log notification"""
        try:
            log_data = {
                "user_id": user_id,
                "notification_type": notification_type,
                "reference_id": reference_id,
                "sent_at": datetime.utcnow()
            }
            await self.db.line_notifications.insert_one(log_data)
        except Exception as e:
            print(f"Error logging notification: {e}")
    
    async def _log_educational_content(self, content_type: str, recipient_count: int) -> None:
        """Log educational content"""
        try:
            log_data = {
                "content_type": content_type,
                "recipient_count": recipient_count,
                "sent_at": datetime.utcnow()
            }
            await self.db.line_educational_content.insert_one(log_data)
        except Exception as e:
            print(f"Error logging educational content: {e}")
    
    async def _get_educational_content(self, content_type: str) -> Optional[Dict[str, Any]]:
        """Get educational content"""
        try:
            content = await self.db.educational_content.find_one({"type": content_type, "active": True})
            return content
        except Exception as e:
            print(f"Error getting educational content: {e}")
            return None
