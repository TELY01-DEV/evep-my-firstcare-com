"""
Telegram Bot Service for EVEP Platform
Handles notifications and user approval commands
"""

import asyncio
import aiohttp
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_users_collection, get_audit_logs_collection
from app.core.security import generate_blockchain_hash


class TelegramService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        
    async def send_message(self, text: str, parse_mode: str = "HTML") -> bool:
        """Send a message to the configured Telegram chat"""
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        print(f"Telegram API error: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"Error sending Telegram message: {e}")
            return False
    
    async def send_user_registration_notification(self, user_data: Dict[str, Any]) -> bool:
        """Send notification about new user registration"""
        try:
            # Format the message
            user_id = user_data.get('user_id', '')
            message = f"""
🔔 <b>New User Registration</b>

👤 <b>User Details:</b>
• Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}
• Email: {user_data.get('email', '')}
• Role: {user_data.get('role', '').upper()}
• Organization: {user_data.get('organization', 'N/A')}
• Phone: {user_data.get('phone', 'N/A')}

⏰ <b>Registration Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🆔 <b>User ID:</b> <code>{user_id}</code>

<b>Quick Actions:</b>
✅ Approve: <code>/approve {user_id}</code>
❌ Reject: <code>/reject {user_id}</code>
            """
            
            return await self.send_message(message)
            
        except Exception as e:
            print(f"Error sending registration notification: {e}")
            return False
    
    async def send_approval_confirmation(self, user_data: Dict[str, Any], action: str, admin_name: str) -> bool:
        """Send confirmation of user approval/rejection"""
        try:
            action_emoji = "✅" if action == "approve" else "❌"
            action_text = "approved" if action == "approve" else "rejected"
            
            message = f"""
{action_emoji} <b>User {action_text.title()}</b>

👤 <b>User:</b> {user_data.get('first_name', '')} {user_data.get('last_name', '')}
📧 <b>Email:</b> {user_data.get('email', '')}
👨‍💼 <b>Admin:</b> {admin_name}
⏰ <b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            
            return await self.send_message(message)
            
        except Exception as e:
            print(f"Error sending approval confirmation: {e}")
            return False
    
    async def handle_telegram_command(self, command: str, user_id: str, admin_user_id: str) -> Dict[str, Any]:
        """Handle Telegram approval commands"""
        try:
            users_collection = get_users_collection()
            audit_logs_collection = get_audit_logs_collection()
            
            # Validate ObjectId
            if not ObjectId.is_valid(user_id):
                return {
                    "success": False,
                    "message": "Invalid user ID format"
                }
            
            # Check if user exists
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            # Check if user is actually pending
            if user.get("status") != "pending":
                return {
                    "success": False,
                    "message": f"User is not pending approval (current status: {user.get('status', 'unknown')})"
                }
            
            # Get admin user info
            admin_user = await users_collection.find_one({"_id": ObjectId(admin_user_id)})
            admin_name = f"{admin_user.get('first_name', '')} {admin_user.get('last_name', '')}" if admin_user else "Unknown Admin"
            
            # Generate blockchain hash for audit
            audit_hash = generate_blockchain_hash(
                f"telegram_user_{command}:{user_id}:{admin_user_id}"
            )
            
            if command == "approve":
                # Approve the user
                result = await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "is_active": True,
                            "status": "active",
                            "approved_at": datetime.utcnow().isoformat(),
                            "approved_by": admin_user_id,
                            "approved_via": "telegram",
                            "updated_at": datetime.utcnow().isoformat(),
                            "audit_hash": audit_hash
                        }
                    }
                )
                
                action_message = "approved"
                
            elif command == "reject":
                # Reject the user
                result = await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "is_active": False,
                            "status": "rejected",
                            "rejected_at": datetime.utcnow().isoformat(),
                            "rejected_by": admin_user_id,
                            "rejected_via": "telegram",
                            "rejection_reason": "Rejected via Telegram command",
                            "updated_at": datetime.utcnow().isoformat(),
                            "audit_hash": audit_hash
                        }
                    }
                )
                
                action_message = "rejected"
                
            else:
                return {
                    "success": False,
                    "message": "Invalid command. Use 'approve' or 'reject'"
                }
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "Failed to update user status"
                }
            
            # Log the approval action
            await audit_logs_collection.insert_one({
                "action": f"telegram_user_{action_message}",
                "user_id": user_id,
                "admin_user_id": admin_user_id,
                "admin_email": admin_user.get("email") if admin_user else "unknown",
                "timestamp": datetime.utcnow().isoformat(),
                "ip_address": "telegram_bot",
                "audit_hash": audit_hash,
                "details": {
                    "target_user_email": user.get("email"),
                    "action": command,
                    "via": "telegram"
                }
            })
            
            # Send confirmation message
            await self.send_approval_confirmation(user, command, admin_name)
            
            return {
                "success": True,
                "message": f"User {action_message} successfully",
                "user_email": user.get("email"),
                "action": command
            }
            
        except Exception as e:
            print(f"Error handling Telegram command: {e}")
            return {
                "success": False,
                "message": f"Error processing command: {str(e)}"
            }
    
    async def send_system_notification(self, title: str, message: str, severity: str = "info") -> bool:
        """Send system notifications"""
        try:
            severity_emoji = {
                "info": "ℹ️",
                "warning": "⚠️",
                "error": "❌",
                "success": "✅"
            }.get(severity, "ℹ️")
            
            formatted_message = f"""
{severity_emoji} <b>{title}</b>

{message}

⏰ <b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            
            return await self.send_message(formatted_message)
            
        except Exception as e:
            print(f"Error sending system notification: {e}")
            return False


# Global instance
telegram_service = TelegramService()
