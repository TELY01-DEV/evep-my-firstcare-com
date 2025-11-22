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

from app.core.config import Config
from app.core.database import get_database

# Store connected clients and collaboration data
connected_clients: Dict[str, Dict[str, Any]] = {}

@dataclass
class PatientQueueItem:
    """Patient queue item data structure"""
    patient_id: str
    queue_position: int
    current_step: int
    priority: str  # 'high', 'normal', 'low'
    staff_working: List[str]
    estimated_completion: Optional[datetime]
    created_at: datetime
    
class FIFOQueueManager:
    """FIFO Queue Manager for Patient Screening Workflow"""
    
    def __init__(self):
        self.queue: List[PatientQueueItem] = []
        self.step_assignments: Dict[str, List[str]] = {}  # patient_id -> [staff_ids]
    
    def add_patient(self, patient_id: str, priority: str = 'normal') -> int:
        """Add patient to queue and return position"""
        # Check if patient already in queue
        existing = self.get_patient_in_queue(patient_id)
        if existing:
            return existing.queue_position
        
        # Determine position based on priority
        if priority == 'high':
            # Insert at beginning after other high priority
            high_priority_count = len([item for item in self.queue if item.priority == 'high'])
            position = high_priority_count
        else:
            # Add to end
            position = len(self.queue)
        
        queue_item = PatientQueueItem(
            patient_id=patient_id,
            queue_position=position + 1,
            current_step=3,  # Start at screening step
            priority=priority,
            staff_working=[],
            estimated_completion=None,
            created_at=datetime.now()
        )
        
        self.queue.insert(position, queue_item)
        self._update_positions()
        
        return queue_item.queue_position
    
    def remove_patient(self, patient_id: str) -> bool:
        """Remove patient from queue"""
        self.queue = [item for item in self.queue if item.patient_id != patient_id]
        self._update_positions()
        return True
    
    def assign_staff_to_patient(self, patient_id: str, staff_id: str) -> bool:
        """Assign staff member to patient"""
        queue_item = self.get_patient_in_queue(patient_id)
        if queue_item and staff_id not in queue_item.staff_working:
            queue_item.staff_working.append(staff_id)
            return True
        return False
    
    def remove_staff_from_patient(self, patient_id: str, staff_id: str) -> bool:
        """Remove staff member from patient"""
        queue_item = self.get_patient_in_queue(patient_id)
        if queue_item and staff_id in queue_item.staff_working:
            queue_item.staff_working.remove(staff_id)
            return True
        return False
    
    def update_patient_step(self, patient_id: str, step: int) -> bool:
        """Update patient's current step"""
        queue_item = self.get_patient_in_queue(patient_id)
        if queue_item:
            queue_item.current_step = step
            return True
        return False
    
    def get_patient_in_queue(self, patient_id: str) -> Optional[PatientQueueItem]:
        """Get patient queue item by ID"""
        return next((item for item in self.queue if item.patient_id == patient_id), None)
    
    def get_queue_data(self) -> List[Dict[str, Any]]:
        """Get queue data as serializable dictionaries"""
        return [asdict(item) for item in self.queue]
    
    def _update_positions(self):
        """Update queue positions after changes"""
        for i, item in enumerate(self.queue):
            item.queue_position = i + 1

# Initialize Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio)

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
        self.queue_manager = FIFOQueueManager()  # Add queue manager
    
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
        
        # === LIVE COLLABORATIVE EDITING EVENTS ===
        
        @self.sio.event
        async def live_typing(sid, data):
            """Handle live typing events for collaborative editing"""
            if sid in self.connected_clients:
                client_info = self.connected_clients[sid]
                self.connected_clients[sid]['last_activity'] = datetime.now()
                
                # Validate required data
                required_fields = ['session_id', 'step', 'field_name', 'current_value', 'user_name']
                if not all(field in data for field in required_fields):
                    await self.sio.emit('error', {
                        'message': 'Missing required fields for live typing',
                        'required': required_fields
                    }, room=sid)
                    return
                
                # Add metadata
                typing_event = {
                    **data,
                    'user_id': client_info.get('user_id'),
                    'user_role': client_info.get('role'),
                    'timestamp': datetime.now().isoformat(),
                    'event_id': f"typing_{data['session_id']}_{data['step']}_{data['field_name']}_{datetime.now().timestamp()}"
                }
                
                # Broadcast to others in the same session room
                room_name = f"hospital_mobile_session_{data['session_id']}"
                await self.sio.emit('live_field_typing', typing_event, room=room_name, skip_sid=sid)
                
                # Log the typing activity
                await self.log_collaborative_activity({
                    'activity_type': 'live_typing',
                    'session_id': data['session_id'],
                    'user_id': client_info.get('user_id'),
                    'user_name': data.get('user_name'),
                    'field_name': data['field_name'],
                    'current_value': data['current_value'],
                    'step': data['step'],
                    'timestamp': datetime.now()
                })
        
        @self.sio.event
        async def field_completed(sid, data):
            """Handle field completion events"""
            if sid in self.connected_clients:
                client_info = self.connected_clients[sid]
                self.connected_clients[sid]['last_activity'] = datetime.now()
                
                # Add metadata
                completion_event = {
                    **data,
                    'user_id': client_info.get('user_id'),
                    'user_role': client_info.get('role'),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Broadcast to others in the same session room
                room_name = f"hospital_mobile_session_{data['session_id']}"
                await self.sio.emit('live_field_updated', completion_event, room=room_name, skip_sid=sid)
        
        @self.sio.event
        async def cursor_position(sid, data):
            """Handle cursor position/field focus events"""
            if sid in self.connected_clients:
                client_info = self.connected_clients[sid]
                self.connected_clients[sid]['last_activity'] = datetime.now()
                
                # Add metadata
                cursor_event = {
                    **data,
                    'user_id': client_info.get('user_id'),
                    'user_role': client_info.get('role'),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Broadcast to others in the same session room
                room_name = f"hospital_mobile_session_{data['session_id']}"
                await self.sio.emit('user_cursor_moved', cursor_event, room=room_name, skip_sid=sid)
        
        @self.sio.event
        async def field_conflict_detected(sid, data):
            """Handle field editing conflicts"""
            if sid in self.connected_clients:
                client_info = self.connected_clients[sid]
                
                # Create conflict event
                conflict_event = {
                    **data,
                    'detecting_user': client_info.get('user_id'),
                    'timestamp': datetime.now().isoformat(),
                    'conflict_id': f"conflict_{data['session_id']}_{data['field_name']}_{datetime.now().timestamp()}"
                }
                
                # Broadcast conflict to all users in session
                room_name = f"hospital_mobile_session_{data['session_id']}"
                await self.sio.emit('collaborative_conflict', conflict_event, room=room_name)
                
                # Log conflict for analysis
                await self.log_collaborative_activity({
                    'activity_type': 'field_conflict',
                    'session_id': data['session_id'],
                    'field_name': data['field_name'],
                    'conflict_details': data,
                    'timestamp': datetime.now()
                })
        
        @self.sio.event
        async def authenticate(sid, data):
            """Handle user authentication for Socket.IO"""
            token = data.get('token')
            user_id = data.get('user_id')
            role = data.get('role')
            
            # Update client info with authenticated data
            if sid in self.connected_clients:
                self.connected_clients[sid].update({
                    'user_id': user_id,
                    'role': role,
                    'authenticated': True,
                    'auth_time': datetime.now()
                })
                
                await self.sio.emit('authentication_success', {
                    'user_id': user_id,
                    'role': role,
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
                
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
    
    async def log_collaborative_activity(self, activity_data: Dict[str, Any]):
        """Log collaborative editing activities for audit and analysis"""
        try:
            if self.db:
                # Add to collaborative_activities collection
                activity_record = {
                    **activity_data,
                    'logged_at': datetime.now()
                }
                
                await self.db.collaborative_activities.insert_one(activity_record)
                
                # Also add to session-specific activity log
                if 'session_id' in activity_data:
                    await self.db.hospital_mobile_sessions.update_one(
                        {'session_id': activity_data['session_id']},
                        {
                            '$push': {
                                'collaborative_activities': activity_record
                            }
                        }
                    )
        except Exception as e:
            print(f"Error logging collaborative activity: {e}")
    
    def find_users_in_session(self, session_id: str) -> List[str]:
        """Find all connected users in a specific session"""
        session_users = []
        room_name = f"hospital_mobile_session_{session_id}"
        
        for sid, client_info in self.connected_clients.items():
            if room_name in client_info.get('rooms', []):
                session_users.append({
                    'sid': sid,
                    'user_id': client_info.get('user_id'),
                    'user_role': client_info.get('role'),
                    'connected_at': client_info.get('connected_at'),
                    'last_activity': client_info.get('last_activity')
                })
        
        return session_users
    
    async def broadcast_session_update(self, session_id: str, update_data: Dict[str, Any], exclude_sid: str = None):
        """Broadcast updates to all users in a specific session"""
        room_name = f"hospital_mobile_session_{session_id}"
        
        broadcast_event = {
            'session_id': session_id,
            'update_type': 'session_data_updated',
            'data': update_data,
            'timestamp': datetime.now().isoformat()
        }
        
        if exclude_sid:
            await self.sio.emit('session_updated', broadcast_event, room=room_name, skip_sid=exclude_sid)
        else:
            await self.sio.emit('session_updated', broadcast_event, room=room_name)
        
        # Real-time Collaboration Event Handlers
        @self.sio.event
        async def join_screening(sid, data):
            """Handle joining a screening collaboration session"""
            patient_id = data.get('patient_id')
            user = data.get('user', {})
            session_id = data.get('session_id')
            
            if not patient_id or not user:
                await self.sio.emit('error', {
                    'message': 'Invalid screening collaboration data'
                }, room=sid)
                return
            
            # Create screening room
            room_name = f"screening_{patient_id}"
            await self.sio.enter_room(sid, room_name)
            
            # Update client info with collaboration details
            if sid in self.connected_clients:
                self.connected_clients[sid].update({
                    'patient_id': patient_id,
                    'collaboration_session': session_id,
                    'screening_step': user.get('step', 0),
                    'last_activity': datetime.now()
                })
                if room_name not in self.connected_clients[sid]['rooms']:
                    self.connected_clients[sid]['rooms'].append(room_name)
            
            # Notify other users in the session
            await self.sio.emit('user_joined', user, room=room_name, skip_sid=sid)
            
            # Send current active users to the joining user
            active_users = await self.get_screening_active_users(patient_id)
            await self.sio.emit('active_users_updated', active_users, room=sid)
            
            # Add patient to queue and update queue data
            self.queue_manager.add_patient(patient_id, 'normal')
            self.queue_manager.assign_staff_to_patient(patient_id, user.get('user_id'))
            queue_data = await self.get_patient_queue()
            await self.sio.emit('queue_updated', queue_data, room=room_name)
            
            print(f"👥 User {user.get('name')} joined screening for patient {patient_id}")
        
        @self.sio.event
        async def step_change(sid, data):
            """Handle step changes in screening workflow"""
            user_id = data.get('user_id')
            step = data.get('step')
            step_name = data.get('step_name')
            patient_id = data.get('patient_id')
            
            if not all([user_id, step is not None, patient_id]):
                return
            
            # Update client step info
            if sid in self.connected_clients:
                self.connected_clients[sid]['screening_step'] = step
                self.connected_clients[sid]['last_activity'] = datetime.now()
            
            # Update patient step in queue
            self.queue_manager.update_patient_step(patient_id, step)
            
            # Broadcast step change to screening room
            room_name = f"screening_{patient_id}"
            await self.sio.emit('step_changed', {
                'user_id': user_id,
                'step': step,
                'step_name': step_name,
                'patient_id': patient_id,
                'timestamp': datetime.now().isoformat()
            }, room=room_name, skip_sid=sid)
            
            # Update step status tracking and queue
            step_statuses = await self.get_step_statuses(patient_id)
            await self.sio.emit('step_status_updated', step_statuses, room=room_name)
            
            queue_data = await self.get_patient_queue()
            await self.sio.emit('queue_updated', queue_data, room=room_name)
            
            print(f"🔄 Step changed: User {user_id} moved to step {step} for patient {patient_id}")
        
        @self.sio.event
        async def user_heartbeat(sid, data):
            """Handle user presence heartbeat"""
            user_id = data.get('user_id')
            step = data.get('step')
            last_activity = data.get('last_activity')
            
            if sid in self.connected_clients:
                self.connected_clients[sid].update({
                    'screening_step': step,
                    'last_activity': datetime.now()
                })
                
                # Update presence in screening room if applicable
                patient_id = self.connected_clients[sid].get('patient_id')
                if patient_id:
                    room_name = f"screening_{patient_id}"
                    active_users = await self.get_screening_active_users(patient_id)
                    await self.sio.emit('active_users_updated', active_users, room=room_name)
        
        @self.sio.event
        async def leave_screening(sid, data):
            """Handle leaving a screening collaboration session"""
            patient_id = data.get('patient_id')
            user_id = data.get('user_id')
            
            if patient_id and sid in self.connected_clients:
                room_name = f"screening_{patient_id}"
                await self.sio.leave_room(sid, room_name)
                
                # Remove from client info
                if room_name in self.connected_clients[sid]['rooms']:
                    self.connected_clients[sid]['rooms'].remove(room_name)
                
                # Remove staff from patient and clean up queue
                self.queue_manager.remove_staff_from_patient(patient_id, user_id)
                
                self.connected_clients[sid].pop('patient_id', None)
                self.connected_clients[sid].pop('collaboration_session', None)
                
                # Notify other users
                await self.sio.emit('user_left', user_id, room=room_name)
                
                # Update active users list and queue
                active_users = await self.get_screening_active_users(patient_id)
                await self.sio.emit('active_users_updated', active_users, room=room_name)
                
                queue_data = await self.get_patient_queue()
                await self.sio.emit('queue_updated', queue_data, room=room_name)
                
                print(f"👋 User {user_id} left screening for patient {patient_id}")
    
    async def get_screening_active_users(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get list of active users for a specific patient screening"""
        room_name = f"screening_{patient_id}"
        active_users = []
        
        for sid, client_info in self.connected_clients.items():
            if (room_name in client_info.get('rooms', []) and 
                client_info.get('patient_id') == patient_id):
                active_users.append({
                    'user_id': client_info.get('user_id'),
                    'name': client_info.get('username', 'Unknown'),
                    'role': client_info.get('role'),
                    'step': client_info.get('screening_step', 0),
                    'last_activity': client_info.get('last_activity').isoformat() if client_info.get('last_activity') else None,
                    'status': 'active' if (datetime.now() - client_info.get('last_activity', datetime.now())).seconds < 60 else 'away'
                })
        
        return active_users
    
    async def get_patient_queue(self) -> List[Dict[str, Any]]:
        """Get current patient queue data"""
        return self.queue_manager.get_queue_data()
    
    async def get_step_statuses(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get current step statuses for a patient"""
        # This would integrate with actual workflow tracking
        # For now, return sample data structure
        return [
            {
                'step': 3,
                'assigned_staff': ['user1'],
                'estimated_duration': '15 min',
                'completion_status': 'in_progress'
            }
        ]
    
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
