"""
LINE Webhook Service for EVEP Platform
Handles incoming LINE webhook events
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from linebot import WebhookHandler
from linebot.models import (
    TextMessage, ImageMessage, LocationMessage, StickerMessage,
    FollowEvent, UnfollowEvent, JoinEvent, LeaveEvent,
    PostbackEvent, BeaconEvent
)

from app.core.database import get_database
from app.core.config import Config

class LineWebhookService:
    """LINE Webhook Service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("line_integration")
        self.db = None
        self.handler = None
        self.channel_secret = None
    
    async def initialize(self) -> None:
        """Initialize the LINE Webhook service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        # Initialize webhook handler
        self.channel_secret = self.config.get("config", {}).get("line_channel_secret")
        
        if self.channel_secret:
            self.handler = WebhookHandler(self.channel_secret)
            self._register_handlers()
            print("✅ LINE Webhook handler initialized")
        else:
            print("⚠️  LINE Channel Secret not found. Webhook features will be limited.")
        
        print("✅ LINE Webhook Service initialized")
    
    def _register_handlers(self) -> None:
        """Register LINE webhook event handlers"""
        if not self.handler:
            return
        
        # Message events
        @self.handler.add(TextMessage)
        def handle_text_message(event):
            asyncio.create_task(self._handle_text_message(event))
        
        @self.handler.add(ImageMessage)
        def handle_image_message(event):
            asyncio.create_task(self._handle_image_message(event))
        
        @self.handler.add(LocationMessage)
        def handle_location_message(event):
            asyncio.create_task(self._handle_location_message(event))
        
        @self.handler.add(StickerMessage)
        def handle_sticker_message(event):
            asyncio.create_task(self._handle_sticker_message(event))
        
        # Follow/Unfollow events
        @self.handler.add(FollowEvent)
        def handle_follow(event):
            asyncio.create_task(self._handle_follow(event))
        
        @self.handler.add(UnfollowEvent)
        def handle_unfollow(event):
            asyncio.create_task(self._handle_unfollow(event))
        
        # Group events
        @self.handler.add(JoinEvent)
        def handle_join(event):
            asyncio.create_task(self._handle_join(event))
        
        @self.handler.add(LeaveEvent)
        def handle_leave(event):
            asyncio.create_task(self._handle_leave(event))
        
        # Postback events
        @self.handler.add(PostbackEvent)
        def handle_postback(event):
            asyncio.create_task(self._handle_postback(event))
        
        # Beacon events
        @self.handler.add(BeaconEvent)
        def handle_beacon(event):
            asyncio.create_task(self._handle_beacon(event))
    
    async def process_webhook(self, body: bytes, signature: str) -> Dict[str, Any]:
        """Process LINE webhook"""
        try:
            if not self.handler:
                return {"error": "Webhook handler not initialized"}
            
            # Process webhook
            self.handler.handle(body.decode('utf-8'), signature)
            
            return {
                "status": "success",
                "processed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error processing webhook: {e}")
            return {"error": str(e)}
    
    async def _handle_text_message(self, event) -> None:
        """Handle text message event"""
        try:
            user_id = event.source.user_id
            message_text = event.message.text
            
            # Log message
            await self._log_incoming_message(user_id, "text", message_text)
            
            # Process message based on content
            if message_text.lower() in ["สวัสดี", "hello", "hi"]:
                await self._send_welcome_message(user_id)
            elif "นัดหมาย" in message_text or "appointment" in message_text.lower():
                await self._handle_appointment_request(user_id, message_text)
            elif "ผลการตรวจ" in message_text or "results" in message_text.lower():
                await self._handle_results_request(user_id, message_text)
            elif "ช่วยเหลือ" in message_text or "help" in message_text.lower():
                await self._send_help_message(user_id)
            else:
                await self._send_default_response(user_id)
                
        except Exception as e:
            print(f"Error handling text message: {e}")
    
    async def _handle_image_message(self, event) -> None:
        """Handle image message event"""
        try:
            user_id = event.source.user_id
            message_id = event.message.id
            
            # Log message
            await self._log_incoming_message(user_id, "image", f"Image message: {message_id}")
            
            # Send acknowledgment
            await self._send_image_acknowledgment(user_id)
            
        except Exception as e:
            print(f"Error handling image message: {e}")
    
    async def _handle_location_message(self, event) -> None:
        """Handle location message event"""
        try:
            user_id = event.source.user_id
            address = event.message.address
            latitude = event.message.latitude
            longitude = event.message.longitude
            
            # Log message
            await self._log_incoming_message(user_id, "location", f"Location: {address}")
            
            # Store location for future use
            await self._store_user_location(user_id, address, latitude, longitude)
            
            # Send location acknowledgment
            await self._send_location_acknowledgment(user_id, address)
            
        except Exception as e:
            print(f"Error handling location message: {e}")
    
    async def _handle_sticker_message(self, event) -> None:
        """Handle sticker message event"""
        try:
            user_id = event.source.user_id
            package_id = event.message.package_id
            sticker_id = event.message.sticker_id
            
            # Log message
            await self._log_incoming_message(user_id, "sticker", f"Sticker: {package_id}/{sticker_id}")
            
            # Send sticker acknowledgment
            await self._send_sticker_acknowledgment(user_id)
            
        except Exception as e:
            print(f"Error handling sticker message: {e}")
    
    async def _handle_follow(self, event) -> None:
        """Handle follow event"""
        try:
            user_id = event.source.user_id
            
            # Log follow event
            await self._log_follow_event(user_id)
            
            # Send welcome message
            await self._send_welcome_message(user_id)
            
            # Create user profile
            await self._create_user_profile(user_id)
            
        except Exception as e:
            print(f"Error handling follow event: {e}")
    
    async def _handle_unfollow(self, event) -> None:
        """Handle unfollow event"""
        try:
            user_id = event.source.user_id
            
            # Log unfollow event
            await self._log_unfollow_event(user_id)
            
            # Update user status
            await self._update_user_status(user_id, "unfollowed")
            
        except Exception as e:
            print(f"Error handling unfollow event: {e}")
    
    async def _handle_join(self, event) -> None:
        """Handle join event"""
        try:
            group_id = event.source.group_id
            
            # Log join event
            await self._log_join_event(group_id)
            
            # Send group welcome message
            await self._send_group_welcome_message(group_id)
            
        except Exception as e:
            print(f"Error handling join event: {e}")
    
    async def _handle_leave(self, event) -> None:
        """Handle leave event"""
        try:
            group_id = event.source.group_id
            
            # Log leave event
            await self._log_leave_event(group_id)
            
        except Exception as e:
            print(f"Error handling leave event: {e}")
    
    async def _handle_postback(self, event) -> None:
        """Handle postback event"""
        try:
            user_id = event.source.user_id
            data = event.postback.data
            
            # Log postback
            await self._log_postback_event(user_id, data)
            
            # Process postback data
            await self._process_postback_data(user_id, data)
            
        except Exception as e:
            print(f"Error handling postback event: {e}")
    
    async def _handle_beacon(self, event) -> None:
        """Handle beacon event"""
        try:
            user_id = event.source.user_id
            beacon_type = event.beacon.type
            hwid = event.beacon.hwid
            
            # Log beacon event
            await self._log_beacon_event(user_id, beacon_type, hwid)
            
        except Exception as e:
            print(f"Error handling beacon event: {e}")
    
    # Helper methods for message handling
    async def _send_welcome_message(self, user_id: str) -> None:
        """Send welcome message to new user"""
        try:
            message = """สวัสดี! ยินดีต้อนรับสู่ EVEP Platform 👋

🔍 เราคือแพลตฟอร์มตรวจสายตาสำหรับเด็กอายุ 6-12 ปี

บริการของเรา:
• การตรวจสายตาดิจิทัล
• การวิเคราะห์ผลด้วย AI
• การติดตามผลการรักษา
• คำแนะนำจากผู้เชี่ยวชาญ

พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด"""
            
            await self._send_text_message(user_id, message)
            
        except Exception as e:
            print(f"Error sending welcome message: {e}")
    
    async def _send_help_message(self, user_id: str) -> None:
        """Send help message"""
        try:
            message = """📋 คำสั่งที่สามารถใช้ได้:

🔍 "นัดหมาย" - จองการตรวจสายตา
📊 "ผลการตรวจ" - ดูผลการตรวจล่าสุด
📅 "ตารางเวลา" - ดูตารางนัดหมาย
📞 "ติดต่อ" - ข้อมูลการติดต่อ
💡 "เคล็ดลับ" - เคล็ดลับสุขภาพสายตา

หรือพิมพ์ข้อความใดๆ เพื่อพูดคุยกับเรา"""
            
            await self._send_text_message(user_id, message)
            
        except Exception as e:
            print(f"Error sending help message: {e}")
    
    async def _handle_appointment_request(self, user_id: str, message: str) -> None:
        """Handle appointment request"""
        try:
            message = """📅 การนัดหมายตรวจสายตา

โปรดเลือกประเภทการนัดหมาย:
1. ตรวจสายตาประจำปี
2. ตรวจติดตามผล
3. ตรวจฉุกเฉิน

หรือติดต่อเราโดยตรงที่:
📞 02-123-4567
📧 info@evep.com"""
            
            await self._send_text_message(user_id, message)
            
        except Exception as e:
            print(f"Error handling appointment request: {e}")
    
    async def _handle_results_request(self, user_id: str, message: str) -> None:
        """Handle results request"""
        try:
            # Check if user has linked account
            line_user = await self.db.line_users.find_one({"line_user_id": user_id})
            
            if line_user:
                message = """📊 ผลการตรวจล่าสุด

เรากำลังตรวจสอบผลการตรวจของคุณ...
โปรดรอสักครู่ หรือติดต่อเราโดยตรงที่:
📞 02-123-4567"""
            else:
                message = """📊 ผลการตรวจ

เพื่อดูผลการตรวจ กรุณาเชื่อมต่อบัญชี LINE กับ EVEP Platform ก่อน

ติดต่อเราเพื่อเชื่อมต่อบัญชี:
📞 02-123-4567"""
            
            await self._send_text_message(user_id, message)
            
        except Exception as e:
            print(f"Error handling results request: {e}")
    
    async def _send_default_response(self, user_id: str) -> None:
        """Send default response"""
        try:
            message = """ขอบคุณสำหรับข้อความของคุณ! 💬

หากต้องการความช่วยเหลือ พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด

หรือติดต่อเราโดยตรงที่:
📞 02-123-4567
📧 info@evep.com"""
            
            await self._send_text_message(user_id, message)
            
        except Exception as e:
            print(f"Error sending default response: {e}")
    
    async def _send_text_message(self, user_id: str, message: str) -> None:
        """Send text message to user"""
        try:
            # This would typically use the LINE Bot API
            # For now, we'll just log the message
            await self._log_outgoing_message(user_id, "text", message)
            
        except Exception as e:
            print(f"Error sending text message: {e}")
    
    # Database operations
    async def _log_incoming_message(self, user_id: str, message_type: str, content: str) -> None:
        """Log incoming message"""
        try:
            log_data = {
                "line_user_id": user_id,
                "type": message_type,
                "content": content,
                "direction": "received",
                "created_at": datetime.utcnow()
            }
            await self.db.line_messages.insert_one(log_data)
        except Exception as e:
            print(f"Error logging incoming message: {e}")
    
    async def _log_outgoing_message(self, user_id: str, message_type: str, content: str) -> None:
        """Log outgoing message"""
        try:
            log_data = {
                "line_user_id": user_id,
                "type": message_type,
                "content": content,
                "direction": "sent",
                "created_at": datetime.utcnow()
            }
            await self.db.line_messages.insert_one(log_data)
        except Exception as e:
            print(f"Error logging outgoing message: {e}")
    
    async def _log_follow_event(self, user_id: str) -> None:
        """Log follow event"""
        try:
            log_data = {
                "line_user_id": user_id,
                "event_type": "follow",
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging follow event: {e}")
    
    async def _log_unfollow_event(self, user_id: str) -> None:
        """Log unfollow event"""
        try:
            log_data = {
                "line_user_id": user_id,
                "event_type": "unfollow",
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging unfollow event: {e}")
    
    async def _log_join_event(self, group_id: str) -> None:
        """Log join event"""
        try:
            log_data = {
                "group_id": group_id,
                "event_type": "join",
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging join event: {e}")
    
    async def _log_leave_event(self, group_id: str) -> None:
        """Log leave event"""
        try:
            log_data = {
                "group_id": group_id,
                "event_type": "leave",
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging leave event: {e}")
    
    async def _log_postback_event(self, user_id: str, data: str) -> None:
        """Log postback event"""
        try:
            log_data = {
                "line_user_id": user_id,
                "event_type": "postback",
                "data": data,
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging postback event: {e}")
    
    async def _log_beacon_event(self, user_id: str, beacon_type: str, hwid: str) -> None:
        """Log beacon event"""
        try:
            log_data = {
                "line_user_id": user_id,
                "event_type": "beacon",
                "beacon_type": beacon_type,
                "hwid": hwid,
                "created_at": datetime.utcnow()
            }
            await self.db.line_events.insert_one(log_data)
        except Exception as e:
            print(f"Error logging beacon event: {e}")
    
    async def _create_user_profile(self, user_id: str) -> None:
        """Create user profile"""
        try:
            profile_data = {
                "line_user_id": user_id,
                "status": "active",
                "joined_at": datetime.utcnow(),
                "last_activity": datetime.utcnow()
            }
            await self.db.line_user_profiles.insert_one(profile_data)
        except Exception as e:
            print(f"Error creating user profile: {e}")
    
    async def _update_user_status(self, user_id: str, status: str) -> None:
        """Update user status"""
        try:
            await self.db.line_user_profiles.update_one(
                {"line_user_id": user_id},
                {"$set": {"status": status, "updated_at": datetime.utcnow()}}
            )
        except Exception as e:
            print(f"Error updating user status: {e}")
    
    async def _store_user_location(self, user_id: str, address: str, latitude: float, longitude: float) -> None:
        """Store user location"""
        try:
            location_data = {
                "line_user_id": user_id,
                "address": address,
                "latitude": latitude,
                "longitude": longitude,
                "created_at": datetime.utcnow()
            }
            await self.db.line_user_locations.insert_one(location_data)
        except Exception as e:
            print(f"Error storing user location: {e}")
    
    async def _process_postback_data(self, user_id: str, data: str) -> None:
        """Process postback data"""
        try:
            # This would handle different postback actions
            # For now, we'll just log it
            print(f"Processing postback data: {data} for user: {user_id}")
        except Exception as e:
            print(f"Error processing postback data: {e}")
    
    # Placeholder methods for message acknowledgments
    async def _send_image_acknowledgment(self, user_id: str) -> None:
        """Send image acknowledgment"""
        await self._send_text_message(user_id, "ขอบคุณสำหรับรูปภาพ! 📸")
    
    async def _send_location_acknowledgment(self, user_id: str, address: str) -> None:
        """Send location acknowledgment"""
        await self._send_text_message(user_id, f"ขอบคุณสำหรับข้อมูลตำแหน่ง! 📍\nที่อยู่: {address}")
    
    async def _send_sticker_acknowledgment(self, user_id: str) -> None:
        """Send sticker acknowledgment"""
        await self._send_text_message(user_id, "สติกเกอร์น่ารักมาก! 😊")
    
    async def _send_group_welcome_message(self, group_id: str) -> None:
        """Send group welcome message"""
        # This would send a message to the group
        print(f"Sending welcome message to group: {group_id}")
