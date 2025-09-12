"""
Telegram Webhook API for EVEP Platform
Handles incoming Telegram messages and commands
"""

import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends, status
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_users_collection
from app.services.telegram_service import telegram_service
from app.api.auth import get_current_user

router = APIRouter(prefix="/telegram", tags=["Telegram Integration"])


class TelegramWebhookData(BaseModel):
    update_id: int
    message: Dict[str, Any]


class TelegramCommandRequest(BaseModel):
    command: str
    user_id: str
    admin_user_id: str


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Handle incoming Telegram webhook messages"""
    try:
        # Get the raw body
        body = await request.body()
        data = json.loads(body)
        
        # Extract message information
        if "message" not in data:
            return {"ok": True}
        
        message = data["message"]
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        from_user = message.get("from", {})
        
        # Check if this is from the authorized chat
        if str(chat_id) != telegram_service.chat_id:
            print(f"Unauthorized chat ID: {chat_id}")
            return {"ok": True}
        
        # Check if this is a command
        if text.startswith("/"):
            await handle_telegram_command(text, from_user)
        
        return {"ok": True}
        
    except Exception as e:
        print(f"Error processing Telegram webhook: {e}")
        return {"ok": True}


async def handle_telegram_command(command_text: str, from_user: Dict[str, Any]):
    """Handle Telegram commands"""
    try:
        # Parse command
        parts = command_text.split()
        if len(parts) < 2:
            await telegram_service.send_message("❌ Invalid command format. Use: /approve <user_id> or /reject <user_id>")
            return
        
        command = parts[0][1:]  # Remove the "/"
        user_id = parts[1]
        
        # Find admin user by Telegram user ID or username
        admin_user = await find_admin_by_telegram_info(from_user)
        if not admin_user:
            await telegram_service.send_message("❌ You are not authorized to perform this action.")
            return
        
        # Handle the command
        result = await telegram_service.handle_telegram_command(
            command, 
            user_id, 
            str(admin_user["_id"])
        )
        
        if result["success"]:
            await telegram_service.send_message(f"✅ {result['message']}")
        else:
            await telegram_service.send_message(f"❌ {result['message']}")
            
    except Exception as e:
        print(f"Error handling Telegram command: {e}")
        await telegram_service.send_message(f"❌ Error processing command: {str(e)}")


async def find_admin_by_telegram_info(telegram_user: Dict[str, Any]) -> Dict[str, Any]:
    """Find admin user by Telegram user information"""
    try:
        users_collection = get_users_collection()
        
        # Try to find by Telegram user ID
        telegram_user_id = str(telegram_user.get("id", ""))
        admin_user = await users_collection.find_one({
            "telegram_user_id": telegram_user_id,
            "role": {"$in": ["admin", "super_admin"]},
            "is_active": True
        })
        
        if admin_user:
            return admin_user
        
        # Try to find by username
        username = telegram_user.get("username", "")
        if username:
            admin_user = await users_collection.find_one({
                "telegram_username": username,
                "role": {"$in": ["admin", "super_admin"]},
                "is_active": True
            })
            
            if admin_user:
                return admin_user
        
        return None
        
    except Exception as e:
        print(f"Error finding admin user: {e}")
        return None


@router.post("/command")
async def process_telegram_command(
    command_data: TelegramCommandRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process Telegram command via API (for testing)"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        result = await telegram_service.handle_telegram_command(
            command_data.command,
            command_data.user_id,
            command_data.admin_user_id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing command: {str(e)}"
        )


@router.post("/test-notification")
async def test_telegram_notification(
    current_user: dict = Depends(get_current_user)
):
    """Test Telegram notification (for testing)"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        success = await telegram_service.send_system_notification(
            "Test Notification",
            "This is a test message from EVEP Platform",
            "info"
        )
        
        if success:
            return {"message": "Test notification sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test notification"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test notification: {str(e)}"
        )


@router.get("/pending-users")
async def get_pending_users_for_telegram(
    current_user: dict = Depends(get_current_user)
):
    """Get pending users formatted for Telegram"""
    
    # Check if user has admin permissions
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users_collection = get_users_collection()
        
        # Find all users with pending status
        pending_users = await users_collection.find({
            "status": "pending",
            "is_active": False
        }).to_list(length=None)
        
        if not pending_users:
            return {"message": "No pending users found"}
        
        # Format for Telegram
        message = "🔔 <b>Pending User Approvals</b>\n\n"
        
        for user in pending_users:
            message += f"""
👤 <b>{user.get('first_name', '')} {user.get('last_name', '')}</b>
📧 {user.get('email', '')}
🎭 {user.get('role', '').upper()}
🏢 {user.get('organization', 'N/A')}
🆔 <code>{str(user['_id'])}</code>

<b>Quick Actions:</b>
✅ <code>/approve {str(user['_id'])}</code>
❌ <code>/reject {str(user['_id'])}</code>

{'─' * 30}
            """
        
        return {
            "message": message,
            "user_count": len(pending_users)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting pending users: {str(e)}"
        )
