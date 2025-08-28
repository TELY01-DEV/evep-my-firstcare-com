"""
Socket.IO Service for Real-time Communication
Handles real-time updates, notifications, and live data streaming
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

import socketio
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.database import get_database

# Initialize Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio)

# Store connected clients
connected_clients: Dict[str, Dict[str, Any]] = {}

@dataclass
class RealTimeEvent:
    """Real-time event data structure"""
    event_type: str
    user_id: Optional[str]
    room: Optional[str]
    data: Dict[str, Any]
    timestamp: datetime
    source: str

class SocketIOService:
    """Socket.IO service for managing real-time communication"""
    
    def __init__(self):
        self.sio = sio
        self.connected_clients = connected_clients
        self.db = None
    
    async def initialize(self):
        """Initialize the Socket.IO service"""
        self.db = get_database()
        
        # Register event handlers
        self.register_handlers()
        
        # Start background tasks
        asyncio.create_task(self.health_check_loop())
        asyncio.create_task(self.cleanup_disconnected_clients())
    
    def register_handlers(self):
        """Register Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            print(f"Client connected: {sid}")
            
            # Extract user info from auth
            user_info = self.extract_user_info(auth)
            
            # Store client information
            self.connected_clients[sid] = {
                'user_id': user_info.get('user_id'),
                'role': user_info.get('role'),
                'rooms': [],
                'connected_at': datetime.now(),
                'last_activity': datetime.now()
            }
            
            # Join default room based on role
            if user_info.get('role'):
                await self.sio.emit('joined_room', {'room': f"role_{user_info['role']}"}, room=sid)
                await self.sio.emit('system_message', {
                    'message': f'Welcome to EVEP Platform! You are connected as {user_info["role"]}',
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
            
            # Send initial data
            await self.send_initial_data(sid, user_info)
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            print(f"Client disconnected: {sid}")
            
            if sid in self.connected_clients:
                # Clean up client data
                client_info = self.connected_clients[sid]
                
                # Leave all rooms
                for room in client_info.get('rooms', []):
                    await self.sio.leave_room(sid, room)
                
                # Remove from connected clients
                del self.connected_clients[sid]
        
        @self.sio.event
        async def join_room(sid, data):
            """Handle room joining"""
            room = data.get('room')
            if room:
                await self.sio.enter_room(sid, room)
                
                if sid in self.connected_clients:
                    self.connected_clients[sid]['rooms'].append(room)
                    self.connected_clients[sid]['last_activity'] = datetime.now()
                
                await self.sio.emit('room_joined', {
                    'room': room,
                    'message': f'Joined room: {room}'
                }, room=sid)
        
        @self.sio.event
        async def leave_room(sid, data):
            """Handle room leaving"""
            room = data.get('room')
            if room:
                await self.sio.leave_room(sid, room)
                
                if sid in self.connected_clients:
                    if room in self.connected_clients[sid]['rooms']:
                        self.connected_clients[sid]['rooms'].remove(room)
                    self.connected_clients[sid]['last_activity'] = datetime.now()
                
                await self.sio.emit('room_left', {
                    'room': room,
                    'message': f'Left room: {room}'
                }, room=sid)
        
        @self.sio.event
        async def subscribe_to_updates(sid, data):
            """Handle subscription to real-time updates"""
            subscription_type = data.get('type')
            filters = data.get('filters', {})
            
            if sid in self.connected_clients:
                self.connected_clients[sid]['last_activity'] = datetime.now()
                
                # Create subscription room
                subscription_room = f"updates_{subscription_type}_{sid}"
                await self.sio.enter_room(sid, subscription_room)
                self.connected_clients[sid]['rooms'].append(subscription_room)
                
                await self.sio.emit('subscription_confirmed', {
                    'type': subscription_type,
                    'room': subscription_room,
                    'filters': filters
                }, room=sid)
        
        @self.sio.event
        async def send_message(sid, data):
            """Handle direct messages"""
            target_user = data.get('target_user')
            message = data.get('message')
            
            if sid in self.connected_clients:
                sender_info = self.connected_clients[sid]
                self.connected_clients[sid]['last_activity'] = datetime.now()
                
                # Find target user's session
                target_sid = self.find_user_session(target_user)
                
                if target_sid:
                    await self.sio.emit('new_message', {
                        'from_user': sender_info.get('user_id'),
                        'from_role': sender_info.get('role'),
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    }, room=target_sid)
                    
                    # Confirm message sent
                    await self.sio.emit('message_sent', {
                        'target_user': target_user,
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    }, room=sid)
                else:
                    await self.sio.emit('message_error', {
                        'error': 'User not found or offline',
                        'target_user': target_user
                    }, room=sid)
        
        @self.sio.event
        async def ping(sid):
            """Handle ping for connection health check"""
            if sid in self.connected_clients:
                self.connected_clients[sid]['last_activity'] = datetime.now()
            await self.sio.emit('pong', room=sid)
    
    def extract_user_info(self, auth: Dict) -> Dict[str, Any]:
        """Extract user information from authentication data"""
        # This would typically decode JWT token or validate session
        # For now, return basic info
        return {
            'user_id': auth.get('user_id'),
            'role': auth.get('role', 'guest'),
            'permissions': auth.get('permissions', [])
        }
    
    async def send_initial_data(self, sid: str, user_info: Dict[str, Any]):
        """Send initial data to newly connected client"""
        try:
            # Send system status
            await self.sio.emit('system_status', {
                'status': 'online',
                'timestamp': datetime.now().isoformat(),
                'user_info': user_info
            }, room=sid)
            
            # Send role-specific initial data
            if user_info.get('role') == 'doctor':
                await self.send_doctor_initial_data(sid)
            elif user_info.get('role') == 'parent':
                await self.send_parent_initial_data(sid)
            elif user_info.get('role') == 'teacher':
                await self.send_teacher_initial_data(sid)
            elif user_info.get('role') == 'executive':
                await self.send_executive_initial_data(sid)
                
        except Exception as e:
            print(f"Error sending initial data: {e}")
    
    async def send_doctor_initial_data(self, sid: str):
        """Send initial data for doctors"""
        try:
            # Get pending screenings
            pending_screenings = await self.db.screenings.count_documents({
                'status': 'pending_review'
            })
            
            await self.sio.emit('doctor_dashboard_data', {
                'pending_screenings': pending_screenings,
                'today_appointments': 0,  # Would query appointments
                'recent_alerts': []  # Would query alerts
            }, room=sid)
        except Exception as e:
            print(f"Error sending doctor data: {e}")
    
    async def send_parent_initial_data(self, sid: str):
        """Send initial data for parents"""
        try:
            # Get child's recent screenings
            recent_screenings = await self.db.screenings.count_documents({
                'parent_id': self.connected_clients[sid].get('user_id')
            })
            
            await self.sio.emit('parent_dashboard_data', {
                'recent_screenings': recent_screenings,
                'upcoming_appointments': [],
                'notifications': []
            }, room=sid)
        except Exception as e:
            print(f"Error sending parent data: {e}")
    
    async def send_teacher_initial_data(self, sid: str):
        """Send initial data for teachers"""
        try:
            # Get class screening statistics
            class_stats = await self.db.screenings.aggregate([
                {'$match': {'teacher_id': self.connected_clients[sid].get('user_id')}},
                {'$group': {
                    '_id': '$status',
                    'count': {'$sum': 1}
                }}
            ]).to_list(None)
            
            await self.sio.emit('teacher_dashboard_data', {
                'class_screening_stats': class_stats,
                'pending_consents': 0,
                'recent_results': []
            }, room=sid)
        except Exception as e:
            print(f"Error sending teacher data: {e}")
    
    async def send_executive_initial_data(self, sid: str):
        """Send initial data for executives"""
        try:
            # Get platform statistics
            total_patients = await self.db.patients.count_documents({})
            total_screenings = await self.db.screenings.count_documents({})
            
            await self.sio.emit('executive_dashboard_data', {
                'total_patients': total_patients,
                'total_screenings': total_screenings,
                'system_health': 'healthy',
                'recent_activities': []
            }, room=sid)
        except Exception as e:
            print(f"Error sending executive data: {e}")
    
    def find_user_session(self, user_id: str) -> Optional[str]:
        """Find session ID for a specific user"""
        for sid, client_info in self.connected_clients.items():
            if client_info.get('user_id') == user_id:
                return sid
        return None
    
    async def broadcast_event(self, event: RealTimeEvent):
        """Broadcast real-time event to relevant clients"""
        try:
            event_data = asdict(event)
            event_data['timestamp'] = event.timestamp.isoformat()
            
            # Broadcast to specific room if specified
            if event.room:
                await self.sio.emit(event.event_type, event_data, room=event.room)
            else:
                # Broadcast to all connected clients
                await self.sio.emit(event.event_type, event_data)
                
        except Exception as e:
            print(f"Error broadcasting event: {e}")
    
    async def send_notification(self, user_id: str, notification: Dict[str, Any]):
        """Send notification to specific user"""
        try:
            target_sid = self.find_user_session(user_id)
            if target_sid:
                await self.sio.emit('notification', {
                    **notification,
                    'timestamp': datetime.now().isoformat()
                }, room=target_sid)
        except Exception as e:
            print(f"Error sending notification: {e}")
    
    async def send_screening_update(self, screening_id: str, update_data: Dict[str, Any]):
        """Send screening update to relevant users"""
        try:
            # Get screening details
            screening = await self.db.screenings.find_one({'_id': screening_id})
            if not screening:
                return
            
            # Create update event
            event = RealTimeEvent(
                event_type='screening_updated',
                user_id=None,
                room=f"screening_{screening_id}",
                data={
                    'screening_id': screening_id,
                    'patient_id': screening.get('patient_id'),
                    'status': update_data.get('status'),
                    'updated_fields': update_data
                },
                timestamp=datetime.now(),
                source='backend'
            )
            
            await self.broadcast_event(event)
            
        except Exception as e:
            print(f"Error sending screening update: {e}")
    
    async def health_check_loop(self):
        """Periodic health check for connected clients"""
        while True:
            try:
                current_time = datetime.now()
                
                # Check for inactive clients (more than 5 minutes)
                inactive_clients = []
                for sid, client_info in self.connected_clients.items():
                    if (current_time - client_info['last_activity']).seconds > 300:
                        inactive_clients.append(sid)
                
                # Disconnect inactive clients
                for sid in inactive_clients:
                    await self.sio.disconnect(sid)
                
                # Send health check to all clients
                await self.sio.emit('health_check', {
                    'timestamp': current_time.isoformat(),
                    'active_connections': len(self.connected_clients)
                })
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"Error in health check loop: {e}")
                await asyncio.sleep(60)
    
    async def cleanup_disconnected_clients(self):
        """Clean up disconnected clients"""
        while True:
            try:
                # Remove any clients that are no longer in the connected list
                # This handles edge cases where disconnect events might be missed
                await asyncio.sleep(30)  # Clean up every 30 seconds
                
            except Exception as e:
                print(f"Error in cleanup loop: {e}")
                await asyncio.sleep(30)

# Create global instance
socketio_service = SocketIOService()

# Export for use in other modules
__all__ = ['socketio_service', 'sio', 'socket_app', 'RealTimeEvent']
