"""
Mobile Unit API Endpoints
Handles multi-user coordination, step assignment, and approval workflows for mobile screening units
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from database import get_db
from utils.validators import validate_mobile_unit_session, validate_step_assignment
from utils.audit_logger import log_audit_event
from utils.rbac import require_permission

mobile_unit_bp = Blueprint('mobile_unit', __name__, url_prefix='/api/v1/mobile-unit')
logger = logging.getLogger(__name__)

@mobile_unit_bp.route('/sessions', methods=['GET'])
@jwt_required()
@require_permission('view_screenings')
def get_mobile_unit_sessions():
    """Get all mobile unit screening sessions with coordination data"""
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        # Build query filters
        query = {}
        unit_id = request.args.get('unit_id')
        status = request.args.get('status')
        assigned_to = request.args.get('assigned_to')
        
        if unit_id:
            query['mobile_unit_config.unit_id'] = unit_id
        if status:
            query['status'] = status
        if assigned_to:
            query['step_assignments.assigned_to'] = assigned_to
        
        # Get sessions with mobile unit data
        sessions = list(db.screening_sessions.find(query).sort('created_at', -1))
        
        # Get mobile unit statistics
        stats = {
            'total_sessions': len(sessions),
            'completed_today': len([s for s in sessions if 
                s.get('status') == 'completed' and 
                s.get('created_at', '').startswith(datetime.now().strftime('%Y-%m-%d'))
            ]),
            'in_progress': len([s for s in sessions if 'progress' in s.get('status', '').lower()]),
            'pending_approval': len([s for s in sessions if 
                s.get('approval_workflow', {}).get('approval_status') == 'pending'
            ]),
            'average_completion_time': 45,  # TODO: Calculate from actual data
            'staff_utilization': 75  # TODO: Calculate from actual data
        }
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            session['_id'] = str(session['_id'])
            if 'patient_id' in session:
                session['patient_id'] = str(session['patient_id'])
        
        return jsonify({
            'success': True,
            'sessions': sessions,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching mobile unit sessions: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/assign-step', methods=['POST'])
@jwt_required()
@require_permission('manage_screenings')
def assign_step(session_id):
    """Assign a specific step to a staff member"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        # Validate step assignment data
        if not validate_step_assignment(data):
            return jsonify({'success': False, 'error': 'Invalid step assignment data'}), 400
        
        # Get the session
        session = db.screening_sessions.find_one({'session_id': session_id})
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # Create step assignment
        assignment = {
            'step_name': data['step_assignment']['step_name'],
            'step_number': data['step_assignment']['step_number'],
            'assigned_to': data['step_assignment']['assigned_to'],
            'assigned_to_name': data['step_assignment']['assigned_to_name'],
            'assigned_role': data['step_assignment']['assigned_role'],
            'assignment_time': datetime.utcnow().isoformat(),
            'assigned_by': current_user['user_id'],
            'assigned_by_name': current_user.get('full_name', 'Unknown'),
            'status': 'pending',
            'priority': data['step_assignment'].get('priority', 'medium'),
            'estimated_duration': data['step_assignment'].get('estimated_duration', 15)
        }
        
        # Update session with step assignment
        update_data = {
            '$push': {'step_assignments': assignment},
            '$set': {
                'updated_at': datetime.utcnow().isoformat(),
                'last_updated_by': current_user['user_id'],
                'last_updated_by_name': current_user.get('full_name', 'Unknown')
            }
        }
        
        result = db.screening_sessions.update_one(
            {'session_id': session_id},
            update_data
        )
        
        if result.modified_count > 0:
            # Log audit event
            log_audit_event(
                action='step_assigned',
                user_id=current_user['user_id'],
                details={
                    'session_id': session_id,
                    'step_name': assignment['step_name'],
                    'assigned_to': assignment['assigned_to_name']
                }
            )
            
            return jsonify({
                'success': True,
                'message': 'Step assigned successfully',
                'assignment': assignment
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to assign step'}), 500
            
    except Exception as e:
        logger.error(f"Error assigning step: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/step-assignment', methods=['POST'])
@jwt_required()
def check_step_assignment(session_id):
    """Check if current user can proceed with a specific step"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        step_number = data.get('step_number')
        step_name = data.get('step_name')
        user_id = data.get('user_id')
        user_role = data.get('user_role')
        
        # Get session
        session = db.screening_sessions.find_one({'session_id': session_id})
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # Check if step is assigned to this user
        step_assignments = session.get('step_assignments', [])
        user_assignment = None
        
        for assignment in step_assignments:
            if (assignment['step_number'] == step_number and 
                assignment['assigned_to'] == user_id):
                user_assignment = assignment
                break
        
        # Check if step is locked by another user
        locked_steps = session.get('concurrent_access', {}).get('locked_steps', [])
        step_locked = any(lock['step_number'] == step_number and lock['locked_by'] != user_id 
                         for lock in locked_steps)
        
        can_proceed = True
        message = None
        
        if user_assignment:
            if user_assignment['status'] == 'completed':
                can_proceed = False
                message = 'Step already completed'
            elif step_locked:
                can_proceed = False
                message = 'Step is currently locked by another user'
        else:
            # Check role-based permissions if no specific assignment
            step_permissions = {
                0: ['nurse', 'medical_staff', 'doctor'],  # Appointment Schedule
                1: ['nurse', 'medical_staff', 'doctor'],  # Parent Consent
                2: ['nurse', 'medical_staff', 'doctor'],  # Student Registration
                3: ['nurse', 'medical_staff', 'doctor'],  # VA Screening
                4: ['doctor'],                            # Doctor Diagnosis
                5: ['nurse', 'medical_staff', 'doctor'],  # Glasses Selection
                6: ['nurse', 'medical_staff', 'doctor'],  # Inventory Check
                7: ['nurse', 'medical_staff', 'doctor']   # School Delivery
            }
            
            allowed_roles = step_permissions.get(step_number, [])
            if user_role not in allowed_roles:
                can_proceed = False
                message = f'Role {user_role} not authorized for this step'
        
        return jsonify({
            'success': True,
            'canProceed': can_proceed,
            'assignment': user_assignment,
            'locked': step_locked,
            'message': message
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking step assignment: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/lock-step', methods=['POST'])
@jwt_required()
def lock_step(session_id):
    """Lock a step for exclusive access"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        step_number = data.get('step_number')
        
        # Create lock
        lock_data = {
            'step_number': step_number,
            'locked_by': current_user['user_id'],
            'locked_by_name': current_user.get('full_name', 'Unknown'),
            'locked_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        }
        
        # Update session with lock
        result = db.screening_sessions.update_one(
            {'session_id': session_id},
            {
                '$push': {'concurrent_access.locked_steps': lock_data},
                '$addToSet': {'concurrent_access.active_users': current_user['user_id']}
            }
        )
        
        return jsonify({'success': True, 'lock': lock_data}), 200
        
    except Exception as e:
        logger.error(f"Error locking step: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/unlock-step', methods=['POST'])
@jwt_required()
def unlock_step(session_id):
    """Unlock a step"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        step_number = data.get('step_number')
        
        # Remove lock
        result = db.screening_sessions.update_one(
            {'session_id': session_id},
            {
                '$pull': {
                    'concurrent_access.locked_steps': {
                        'step_number': step_number,
                        'locked_by': current_user['user_id']
                    }
                }
            }
        )
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        logger.error(f"Error unlocking step: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/request-approval', methods=['POST'])
@jwt_required()
def request_approval(session_id):
    """Request approval for screening completion or modifications"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        # Create approval request
        approval_request = {
            'request_id': str(ObjectId()),
            'session_id': session_id,
            'requested_by': current_user['user_id'],
            'requested_by_name': current_user.get('full_name', 'Unknown'),
            'requested_at': datetime.utcnow().isoformat(),
            'approval_type': data.get('approval_type', 'completion'),
            'notes': data.get('notes', ''),
            'status': 'pending',
            'screening_data': data.get('screening_data', {}),
            'requires_second_approval': data.get('requires_second_approval', False)
        }
        
        # Update session with approval request
        update_data = {
            '$set': {
                'approval_workflow': approval_request,
                'status': 'pending_approval',
                'updated_at': datetime.utcnow().isoformat()
            }
        }
        
        result = db.screening_sessions.update_one(
            {'session_id': session_id},
            update_data
        )
        
        if result.modified_count > 0:
            # Log audit event
            log_audit_event(
                action='approval_requested',
                user_id=current_user['user_id'],
                details={
                    'session_id': session_id,
                    'approval_type': approval_request['approval_type']
                }
            )
            
            # TODO: Send notification to supervising doctors
            
            return jsonify({
                'success': True,
                'message': 'Approval request submitted',
                'request_id': approval_request['request_id']
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to submit approval request'}), 500
            
    except Exception as e:
        logger.error(f"Error requesting approval: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/sessions/<session_id>/approve', methods=['POST'])
@jwt_required()
@require_permission('approve_screenings')
def approve_screening(session_id):
    """Approve or reject a screening session"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        approved = data.get('approved', False)
        notes = data.get('approval_notes', '') if approved else None
        rejection_reason = data.get('rejection_reason', '') if not approved else None
        
        # Update approval status
        approval_data = {
            'approval_status': 'approved' if approved else 'rejected',
            'approved_by': current_user['user_id'],
            'approved_by_name': current_user.get('full_name', 'Unknown'),
            'approved_at': datetime.utcnow().isoformat()
        }
        
        if approved and notes:
            approval_data['approval_notes'] = notes
        if not approved and rejection_reason:
            approval_data['rejection_reason'] = rejection_reason
        
        # Update session status
        new_status = 'completed' if approved else 'requires_revision'
        
        result = db.screening_sessions.update_one(
            {'session_id': session_id},
            {
                '$set': {
                    f'approval_workflow.{k}': v for k, v in approval_data.items()
                } | {
                    'status': new_status,
                    'updated_at': datetime.utcnow().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            # Log audit event
            log_audit_event(
                action='screening_approved' if approved else 'screening_rejected',
                user_id=current_user['user_id'],
                details={
                    'session_id': session_id,
                    'notes': notes or rejection_reason
                }
            )
            
            return jsonify({
                'success': True,
                'message': f'Screening {"approved" if approved else "rejected"} successfully'
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to update approval status'}), 500
            
    except Exception as e:
        logger.error(f"Error processing approval: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/staff', methods=['GET'])
@jwt_required()
@require_permission('view_staff')
def get_mobile_unit_staff():
    """Get available staff for mobile unit assignments"""
    try:
        db = get_db()
        
        # Get medical staff with mobile unit roles
        staff = list(db.users.find(
            {
                'role': {'$in': ['doctor', 'nurse', 'medical_staff', 'medical_admin']},
                'is_active': True
            },
            {
                'user_id': 1,
                'full_name': 1,
                'role': 1,
                'email': 1,
                'mobile_unit_status': 1,
                'current_assignments': 1
            }
        ))
        
        # Add real-time status and assignment counts
        for member in staff:
            member['_id'] = str(member['_id'])
            member['status'] = member.get('mobile_unit_status', 'available')
            member['current_assignments'] = 0  # TODO: Count from active sessions
            member['current_patient'] = None   # TODO: Get from active sessions
        
        return jsonify({
            'success': True,
            'staff': staff
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching mobile unit staff: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@mobile_unit_bp.route('/staff/<staff_id>/status', methods=['PUT'])
@jwt_required()
@require_permission('manage_staff')
def update_staff_status(staff_id):
    """Update mobile unit staff availability status"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        new_status = data.get('status')
        if new_status not in ['available', 'busy', 'break', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        # Update staff status
        result = db.users.update_one(
            {'user_id': staff_id},
            {
                '$set': {
                    'mobile_unit_status': new_status,
                    'status_updated_at': datetime.utcnow().isoformat(),
                    'status_updated_by': current_user['user_id']
                }
            }
        )
        
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Status updated successfully'}), 200
        else:
            return jsonify({'success': False, 'error': 'Staff member not found'}), 404
            
    except Exception as e:
        logger.error(f"Error updating staff status: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500