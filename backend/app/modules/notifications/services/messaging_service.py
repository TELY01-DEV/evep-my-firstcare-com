from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import Config

class MessagingService:
    """Messaging service for EVEP Platform"""
    
    def __init__(self):
        self.config = Config.get_module_config("notifications")
        
        # In-memory storage for demonstration
        self.messages = {}
        self.conversations = {}
        self.message_counter = 0
        self.conversation_counter = 0
    
    async def initialize(self) -> None:
        """Initialize the messaging service"""
        # Initialize demo data
        await self._initialize_demo_data()
        
        print("🔧 Messaging service initialized")
    
    async def _initialize_demo_data(self) -> None:
        """Initialize demo messaging data"""
        # Demo conversations
        demo_conversations = [
            {
                "conversation_id": "CONV-000001",
                "title": "Patient Screening Discussion",
                "participants": ["user-001", "user-002"],
                "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "last_message_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "message_count": 3,
                "status": "active"
            },
            {
                "conversation_id": "CONV-000002",
                "title": "System Maintenance Notification",
                "participants": ["admin-001", "admin-002"],
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "last_message_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "message_count": 2,
                "status": "active"
            },
            {
                "conversation_id": "CONV-000003",
                "title": "Emergency Alert Discussion",
                "participants": ["admin-001", "user-003"],
                "created_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
                "last_message_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "message_count": 5,
                "status": "active"
            }
        ]
        
        for conversation in demo_conversations:
            self.conversations[conversation["conversation_id"]] = conversation
            self.conversation_counter = max(self.conversation_counter, int(conversation["conversation_id"].split("-")[1]))
        
        # Demo messages
        demo_messages = [
            {
                "message_id": "MSG-000001",
                "conversation_id": "CONV-000001",
                "sender_id": "user-001",
                "recipient_id": "user-002",
                "message_type": "text",
                "content": "Hi, I need to discuss the screening results for patient John Doe.",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "priority": "normal"
            },
            {
                "message_id": "MSG-000002",
                "conversation_id": "CONV-000001",
                "sender_id": "user-002",
                "recipient_id": "user-001",
                "message_type": "text",
                "content": "Sure, I can help. What specific concerns do you have?",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
                "priority": "normal"
            },
            {
                "message_id": "MSG-000003",
                "conversation_id": "CONV-000001",
                "sender_id": "user-001",
                "recipient_id": "user-002",
                "message_type": "text",
                "content": "The vision test results show some abnormalities. Should we schedule a follow-up?",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "read_at": None,
                "priority": "high"
            },
            {
                "message_id": "MSG-000004",
                "conversation_id": "CONV-000002",
                "sender_id": "admin-001",
                "recipient_id": "admin-002",
                "message_type": "text",
                "content": "System maintenance is scheduled for tonight at 2 AM. Please ensure all services are prepared.",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
                "priority": "normal"
            },
            {
                "message_id": "MSG-000005",
                "conversation_id": "CONV-000002",
                "sender_id": "admin-002",
                "recipient_id": "admin-001",
                "message_type": "text",
                "content": "Understood. I'll prepare the maintenance checklist and notify users.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "read_at": None,
                "priority": "normal"
            },
            {
                "message_id": "MSG-000006",
                "conversation_id": "CONV-000003",
                "sender_id": "admin-001",
                "recipient_id": "user-003",
                "message_type": "text",
                "content": "Emergency alert: Database connection issues detected. Investigating now.",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=12)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(hours=11)).isoformat(),
                "priority": "critical"
            },
            {
                "message_id": "MSG-000007",
                "conversation_id": "CONV-000003",
                "sender_id": "user-003",
                "recipient_id": "admin-001",
                "message_type": "text",
                "content": "What's the estimated resolution time?",
                "status": "sent",
                "read": True,
                "created_at": (datetime.utcnow() - timedelta(hours=10)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=10)).isoformat(),
                "read_at": (datetime.utcnow() - timedelta(hours=9)).isoformat(),
                "priority": "normal"
            },
            {
                "message_id": "MSG-000008",
                "conversation_id": "CONV-000003",
                "sender_id": "admin-001",
                "recipient_id": "user-003",
                "message_type": "text",
                "content": "Issue resolved. Database connections restored. System is stable now.",
                "status": "sent",
                "read": False,
                "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "sent_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "read_at": None,
                "priority": "normal"
            }
        ]
        
        for message in demo_messages:
            self.messages[message["message_id"]] = message
            self.message_counter = max(self.message_counter, int(message["message_id"].split("-")[1]))
    
    async def get_messages(
        self,
        skip: int = 0,
        limit: int = 100,
        sender_id: Optional[str] = None,
        recipient_id: Optional[str] = None,
        message_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get messages with optional filtering"""
        messages = list(self.messages.values())
        
        # Apply filters
        if sender_id:
            messages = [m for m in messages if m["sender_id"] == sender_id]
        
        if recipient_id:
            messages = [m for m in messages if m["recipient_id"] == recipient_id]
        
        if message_type:
            messages = [m for m in messages if m["message_type"] == message_type]
        
        if status:
            messages = [m for m in messages if m["status"] == status]
        
        # Sort by creation date (newest first)
        messages.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        return messages[skip:skip + limit]
    
    async def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get a message by ID"""
        return self.messages.get(message_id)
    
    async def send_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send a new message"""
        # Validate required fields
        required_fields = ["sender_id", "recipient_id", "content"]
        for field in required_fields:
            if field not in message_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate message ID
        self.message_counter += 1
        message_id = f"MSG-{self.message_counter:06d}"
        
        # Get or create conversation
        conversation_id = message_data.get("conversation_id")
        if not conversation_id:
            conversation_id = await self._get_or_create_conversation(
                message_data["sender_id"],
                message_data["recipient_id"]
            )
        
        # Create message
        message = {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "sender_id": message_data["sender_id"],
            "recipient_id": message_data["recipient_id"],
            "message_type": message_data.get("message_type", "text"),
            "content": message_data["content"],
            "status": "pending",
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
            "sent_at": None,
            "read_at": None,
            "priority": message_data.get("priority", "normal"),
            "metadata": message_data.get("metadata", {})
        }
        
        # Store message
        self.messages[message_id] = message
        
        # Send message
        await self._send_message(message)
        
        # Update conversation
        await self._update_conversation(conversation_id, message)
        
        return message
    
    async def _get_or_create_conversation(self, sender_id: str, recipient_id: str) -> str:
        """Get existing conversation or create new one"""
        # Check for existing conversation
        for conversation in self.conversations.values():
            participants = set(conversation["participants"])
            if sender_id in participants and recipient_id in participants:
                return conversation["conversation_id"]
        
        # Create new conversation
        self.conversation_counter += 1
        conversation_id = f"CONV-{self.conversation_counter:06d}"
        
        conversation = {
            "conversation_id": conversation_id,
            "title": f"Conversation between {sender_id} and {recipient_id}",
            "participants": [sender_id, recipient_id],
            "created_at": datetime.utcnow().isoformat(),
            "last_message_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "status": "active"
        }
        
        self.conversations[conversation_id] = conversation
        return conversation_id
    
    async def _send_message(self, message: Dict[str, Any]) -> None:
        """Send a message"""
        # Update status to sent
        message["status"] = "sent"
        message["sent_at"] = datetime.utcnow().isoformat()
        
        # In a real implementation, this would:
        # 1. Check recipient's online status
        # 2. Send via WebSocket, push notification, etc.
        # 3. Handle delivery failures
        # 4. Update delivery status
        
        print(f"💬 Sending message {message['message_id']} from {message['sender_id']} to {message['recipient_id']}")
    
    async def _update_conversation(self, conversation_id: str, message: Dict[str, Any]) -> None:
        """Update conversation with new message"""
        if conversation_id in self.conversations:
            conversation = self.conversations[conversation_id]
            conversation["last_message_at"] = message["created_at"]
            conversation["message_count"] += 1
    
    async def update_message(self, message_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a message"""
        if message_id not in self.messages:
            return None
        
        message = self.messages[message_id]
        
        # Update fields
        for key, value in updates.items():
            if key in message:
                message[key] = value
        
        message["updated_at"] = datetime.utcnow().isoformat()
        
        return message
    
    async def delete_message(self, message_id: str) -> bool:
        """Delete a message"""
        if message_id not in self.messages:
            return False
        
        del self.messages[message_id]
        return True
    
    async def mark_as_read(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Mark a message as read"""
        if message_id not in self.messages:
            return None
        
        message = self.messages[message_id]
        message["read"] = True
        message["read_at"] = datetime.utcnow().isoformat()
        
        return message
    
    async def get_conversation_messages(
        self,
        conversation_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get messages in a conversation"""
        messages = [
            m for m in self.messages.values()
            if m["conversation_id"] == conversation_id
        ]
        
        # Sort by creation date (oldest first for conversation view)
        messages.sort(key=lambda x: x["created_at"])
        
        # Apply pagination
        return messages[skip:skip + limit]
    
    async def get_user_messages(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get messages for a specific user"""
        messages = [
            m for m in self.messages.values()
            if m["sender_id"] == user_id or m["recipient_id"] == user_id
        ]
        
        if unread_only:
            messages = [m for m in messages if not m["read"] and m["recipient_id"] == user_id]
        
        # Sort by creation date (newest first)
        messages.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        return messages[skip:skip + limit]
    
    async def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get conversations for a specific user"""
        conversations = [
            c for c in self.conversations.values()
            if user_id in c["participants"]
        ]
        
        # Sort by last message date (newest first)
        conversations.sort(key=lambda x: x["last_message_at"], reverse=True)
        
        return conversations
    
    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        return self.conversations.get(conversation_id)
    
    async def create_conversation(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new conversation"""
        # Validate required fields
        if "participants" not in conversation_data:
            raise ValueError("Missing required field: participants")
        
        if len(conversation_data["participants"]) < 2:
            raise ValueError("Conversation must have at least 2 participants")
        
        # Generate conversation ID
        self.conversation_counter += 1
        conversation_id = f"CONV-{self.conversation_counter:06d}"
        
        # Create conversation
        conversation = {
            "conversation_id": conversation_id,
            "title": conversation_data.get("title", "New Conversation"),
            "participants": conversation_data["participants"],
            "created_at": datetime.utcnow().isoformat(),
            "last_message_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "status": "active",
            "metadata": conversation_data.get("metadata", {})
        }
        
        # Store conversation
        self.conversations[conversation_id] = conversation
        
        return conversation
    
    async def update_conversation(self, conversation_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a conversation"""
        if conversation_id not in self.conversations:
            return None
        
        conversation = self.conversations[conversation_id]
        
        # Update fields
        for key, value in updates.items():
            if key in conversation:
                conversation[key] = value
        
        conversation["updated_at"] = datetime.utcnow().isoformat()
        
        return conversation
    
    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages"""
        if conversation_id not in self.conversations:
            return False
        
        # Delete all messages in the conversation
        messages_to_delete = [
            message_id for message_id, message in self.messages.items()
            if message["conversation_id"] == conversation_id
        ]
        
        for message_id in messages_to_delete:
            del self.messages[message_id]
        
        # Delete conversation
        del self.conversations[conversation_id]
        
        return True
    
    async def get_message_statistics(self) -> Dict[str, Any]:
        """Get message statistics"""
        total_messages = len(self.messages)
        sent_messages = len([m for m in self.messages.values() if m["status"] == "sent"])
        read_messages = len([m for m in self.messages.values() if m["read"]])
        unread_messages = total_messages - read_messages
        
        # Type distribution
        type_counts = {}
        for message in self.messages.values():
            message_type = message["message_type"]
            type_counts[message_type] = type_counts.get(message_type, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for message in self.messages.values():
            priority = message["priority"]
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        # Conversation statistics
        total_conversations = len(self.conversations)
        active_conversations = len([c for c in self.conversations.values() if c["status"] == "active"])
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_messages = [
            m for m in self.messages.values()
            if datetime.fromisoformat(m["created_at"]) > week_ago
        ]
        
        return {
            "total_messages": total_messages,
            "sent_messages": sent_messages,
            "read_messages": read_messages,
            "unread_messages": unread_messages,
            "total_conversations": total_conversations,
            "active_conversations": active_conversations,
            "type_distribution": type_counts,
            "priority_distribution": priority_counts,
            "recent_messages": len(recent_messages),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def send_system_message(
        self,
        recipient_id: str,
        content: str,
        message_type: str = "system",
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """Send a system message to a user"""
        message_data = {
            "sender_id": "system",
            "recipient_id": recipient_id,
            "content": content,
            "message_type": message_type,
            "priority": priority
        }
        
        return await self.send_message(message_data)
    
    async def send_bulk_message(
        self,
        recipient_ids: List[str],
        content: str,
        message_type: str = "text",
        priority: str = "normal"
    ) -> List[Dict[str, Any]]:
        """Send message to multiple recipients"""
        messages = []
        
        for recipient_id in recipient_ids:
            message_data = {
                "sender_id": "system",
                "recipient_id": recipient_id,
                "content": content,
                "message_type": message_type,
                "priority": priority
            }
            
            message = await self.send_message(message_data)
            messages.append(message)
        
        return messages
    
    async def cleanup_old_messages(self, days: int = 30) -> int:
        """Clean up old messages"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        deleted_count = 0
        
        messages_to_delete = []
        for message_id, message in self.messages.items():
            if datetime.fromisoformat(message["created_at"]) < cutoff_date:
                messages_to_delete.append(message_id)
        
        for message_id in messages_to_delete:
            del self.messages[message_id]
            deleted_count += 1
        
        return deleted_count
    
    async def get_message_trends(self, days: int = 7) -> Dict[str, Any]:
        """Get message trends over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_messages = [
            m for m in self.messages.values()
            if datetime.fromisoformat(m["created_at"]) > cutoff_date
        ]
        
        # Daily trend
        daily_counts = {}
        for message in recent_messages:
            date = message["created_at"][:10]  # YYYY-MM-DD
            daily_counts[date] = daily_counts.get(date, 0) + 1
        
        # Type trend
        type_counts = {}
        for message in recent_messages:
            message_type = message["message_type"]
            type_counts[message_type] = type_counts.get(message_type, 0) + 1
        
        # Priority trend
        priority_counts = {}
        for message in recent_messages:
            priority = message["priority"]
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        return {
            "period_days": days,
            "total_messages": len(recent_messages),
            "daily_trend": daily_counts,
            "type_distribution": type_counts,
            "priority_distribution": priority_counts,
            "last_updated": datetime.utcnow().isoformat()
        }
