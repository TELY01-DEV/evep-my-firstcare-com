"""
Mobile Unit Activity Logger
Enhanced audit logging specifically for mobile unit coordination events
"""

import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
from database import get_db
from bson import ObjectId

class MobileUnitAuditLogger:
    """Enhanced audit logging for mobile unit operations"""
    
    def __init__(self):
        self.db = get_db()
        
    def log_mobile_unit_event(
        self,
        action: str,
        user_id: str,
        session_id: str,
        details: Dict[str, Any],
        patient_id: Optional[str] = None,
        unit_id: Optional[str] = None,
        severity: str = 'info'
    ):
        """Log mobile unit specific events with enhanced tracking"""
        
        try:
            # Create base audit entry
            audit_entry = {
                'action': action,
                'category': 'mobile_unit',
                'user_id': user_id,
                'session_id': session_id,
                'patient_id': patient_id,
                'unit_id': unit_id,
                'timestamp': datetime.utcnow().isoformat(),
                'severity': severity,
                'details': details,
                'client_info': self._get_client_info()
            }
            
            # Add blockchain-style hash for tamper evidence
            audit_entry['audit_hash'] = self._generate_audit_hash(audit_entry)
            
            # Insert into audit collection
            result = self.db.mobile_unit_audit_logs.insert_one(audit_entry)
            
            # Also log to main audit collection for unified tracking
            self._log_to_main_audit(audit_entry)
            
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error logging mobile unit audit event: {e}")
            return None
    
    def log_step_assignment(
        self,
        user_id: str,
        session_id: str,
        step_name: str,
        assigned_to: str,
        assigned_to_name: str,
        priority: str = 'medium'
    ):
        """Log step assignment events"""
        
        return self.log_mobile_unit_event(
            action='step_assigned',
            user_id=user_id,
            session_id=session_id,
            details={
                'step_name': step_name,
                'assigned_to': assigned_to,
                'assigned_to_name': assigned_to_name,
                'priority': priority,
                'assignment_type': 'manual'
            }
        )
    
    def log_step_completion(
        self,
        user_id: str,
        session_id: str,
        step_name: str,
        step_number: int,
        completion_data: Dict[str, Any],
        duration_minutes: Optional[int] = None
    ):
        """Log step completion events"""
        
        return self.log_mobile_unit_event(
            action='step_completed',
            user_id=user_id,
            session_id=session_id,
            details={
                'step_name': step_name,
                'step_number': step_number,
                'completion_data': completion_data,
                'duration_minutes': duration_minutes,
                'data_quality_score': self._calculate_data_quality_score(completion_data)
            }
        )
    
    def log_concurrent_access(
        self,
        user_id: str,
        session_id: str,
        action_type: str,  # 'lock', 'unlock', 'conflict'
        step_name: str,
        conflicting_user: Optional[str] = None
    ):
        """Log concurrent access events and conflicts"""
        
        severity = 'warning' if action_type == 'conflict' else 'info'
        
        return self.log_mobile_unit_event(
            action=f'concurrent_access_{action_type}',
            user_id=user_id,
            session_id=session_id,
            details={
                'step_name': step_name,
                'action_type': action_type,
                'conflicting_user': conflicting_user,
                'resolved': action_type != 'conflict'
            },
            severity=severity
        )
    
    def log_approval_workflow(
        self,
        user_id: str,
        session_id: str,
        action_type: str,  # 'requested', 'approved', 'rejected'
        approval_type: str = 'completion',
        notes: Optional[str] = None,
        approver_id: Optional[str] = None
    ):
        """Log approval workflow events"""
        
        return self.log_mobile_unit_event(
            action=f'approval_{action_type}',
            user_id=user_id,
            session_id=session_id,
            details={
                'approval_type': approval_type,
                'action_type': action_type,
                'notes': notes,
                'approver_id': approver_id,
                'requires_escalation': approval_type == 'critical'
            },
            severity='info' if action_type == 'approved' else 'warning'
        )
    
    def log_quality_assurance(
        self,
        user_id: str,
        session_id: str,
        qa_type: str,  # 'automated', 'manual', 'supervisor_review'
        quality_score: float,
        issues_found: list,
        corrective_actions: list
    ):
        """Log quality assurance events"""
        
        severity = 'error' if quality_score < 70 else 'warning' if quality_score < 85 else 'info'
        
        return self.log_mobile_unit_event(
            action='quality_assurance',
            user_id=user_id,
            session_id=session_id,
            details={
                'qa_type': qa_type,
                'quality_score': quality_score,
                'issues_found': issues_found,
                'corrective_actions': corrective_actions,
                'requires_intervention': quality_score < 70
            },
            severity=severity
        )
    
    def log_staff_coordination(
        self,
        user_id: str,
        action_type: str,  # 'status_change', 'workload_balance', 'emergency_reassignment'
        staff_id: str,
        details: Dict[str, Any]
    ):
        """Log staff coordination events"""
        
        return self.log_mobile_unit_event(
            action=f'staff_{action_type}',
            user_id=user_id,
            session_id=details.get('session_id', ''),
            details={
                'affected_staff': staff_id,
                'action_type': action_type,
                **details
            }
        )
    
    def log_session_handoff(
        self,
        user_id: str,
        session_id: str,
        from_user: str,
        to_user: str,
        handoff_reason: str,
        session_state: Dict[str, Any]
    ):
        """Log session handoff between staff members"""
        
        return self.log_mobile_unit_event(
            action='session_handoff',
            user_id=user_id,
            session_id=session_id,
            details={
                'from_user': from_user,
                'to_user': to_user,
                'handoff_reason': handoff_reason,
                'session_state_snapshot': session_state,
                'handoff_type': 'planned' if 'scheduled' in handoff_reason else 'emergency'
            }
        )
    
    def get_mobile_unit_analytics(
        self,
        unit_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get analytics from mobile unit audit logs"""
        
        try:
            # Build query
            query = {'category': 'mobile_unit'}
            
            if unit_id:
                query['unit_id'] = unit_id
            
            if start_date and end_date:
                query['timestamp'] = {
                    '$gte': start_date.isoformat(),
                    '$lte': end_date.isoformat()
                }
            
            # Get audit logs
            logs = list(self.db.mobile_unit_audit_logs.find(query))
            
            # Calculate analytics
            analytics = {
                'total_events': len(logs),
                'step_assignments': len([l for l in logs if l['action'] == 'step_assigned']),
                'step_completions': len([l for l in logs if l['action'] == 'step_completed']),
                'approval_requests': len([l for l in logs if l['action'] == 'approval_requested']),
                'concurrent_conflicts': len([l for l in logs if 'conflict' in l['action']]),
                'quality_issues': len([l for l in logs if l['action'] == 'quality_assurance' and l['severity'] in ['warning', 'error']]),
                'average_step_duration': self._calculate_average_step_duration(logs),
                'staff_utilization': self._calculate_staff_utilization(logs),
                'most_active_users': self._get_most_active_users(logs),
                'common_issues': self._identify_common_issues(logs)
            }
            
            return analytics
            
        except Exception as e:
            print(f"Error generating mobile unit analytics: {e}")
            return {}
    
    def _generate_audit_hash(self, audit_entry: Dict[str, Any]) -> str:
        """Generate blockchain-style hash for audit entry"""
        
        # Get previous hash for chaining
        previous_entry = self.db.mobile_unit_audit_logs.find_one(
            {},
            sort=[('timestamp', -1)]
        )
        previous_hash = previous_entry.get('audit_hash', '') if previous_entry else ''
        
        # Create hash input
        hash_input = {
            'action': audit_entry['action'],
            'user_id': audit_entry['user_id'],
            'session_id': audit_entry['session_id'],
            'timestamp': audit_entry['timestamp'],
            'details': audit_entry['details'],
            'previous_hash': previous_hash
        }
        
        # Generate hash
        hash_string = json.dumps(hash_input, sort_keys=True)
        return hashlib.sha256(hash_string.encode()).hexdigest()
    
    def _log_to_main_audit(self, mobile_unit_entry: Dict[str, Any]):
        """Also log to main audit collection for unified tracking"""
        
        main_audit_entry = {
            'action': f"mobile_unit_{mobile_unit_entry['action']}",
            'user_id': mobile_unit_entry['user_id'],
            'timestamp': mobile_unit_entry['timestamp'],
            'details': {
                'mobile_unit_event': True,
                'session_id': mobile_unit_entry['session_id'],
                **mobile_unit_entry['details']
            },
            'audit_hash': mobile_unit_entry['audit_hash']
        }
        
        self.db.audit_logs.insert_one(main_audit_entry)
    
    def _get_client_info(self) -> Dict[str, Any]:
        """Get client information for audit trail"""
        
        # In a real implementation, this would extract from request context
        return {
            'client_ip': 'mobile_unit_terminal',
            'user_agent': 'EVEP Mobile Unit System',
            'session_context': 'mobile_screening'
        }
    
    def _calculate_data_quality_score(self, completion_data: Dict[str, Any]) -> float:
        """Calculate data quality score for completed step"""
        
        # Simple quality scoring based on completeness
        total_fields = len(completion_data)
        filled_fields = len([v for v in completion_data.values() if v not in [None, '', []]])
        
        if total_fields == 0:
            return 0.0
        
        completeness_score = (filled_fields / total_fields) * 100
        
        # Additional quality factors could be added here
        # e.g., data validation, consistency checks, etc.
        
        return round(completeness_score, 2)
    
    def _calculate_average_step_duration(self, logs: list) -> float:
        """Calculate average step completion duration"""
        
        completion_logs = [l for l in logs if l['action'] == 'step_completed']
        durations = [l['details'].get('duration_minutes', 0) for l in completion_logs if l['details'].get('duration_minutes')]
        
        return round(sum(durations) / len(durations), 2) if durations else 0.0
    
    def _calculate_staff_utilization(self, logs: list) -> float:
        """Calculate staff utilization percentage"""
        
        # This is a simplified calculation
        # In practice, you'd want to consider active time vs available time
        assignment_logs = [l for l in logs if l['action'] == 'step_assigned']
        completion_logs = [l for l in logs if l['action'] == 'step_completed']
        
        if not assignment_logs:
            return 0.0
        
        utilization = (len(completion_logs) / len(assignment_logs)) * 100
        return round(min(utilization, 100), 2)
    
    def _get_most_active_users(self, logs: list) -> list:
        """Get most active users from logs"""
        
        user_activity = {}
        for log in logs:
            user_id = log['user_id']
            user_activity[user_id] = user_activity.get(user_id, 0) + 1
        
        # Sort by activity count
        sorted_users = sorted(user_activity.items(), key=lambda x: x[1], reverse=True)
        
        return [{'user_id': user_id, 'activity_count': count} for user_id, count in sorted_users[:10]]
    
    def _identify_common_issues(self, logs: list) -> list:
        """Identify common issues from audit logs"""
        
        issues = {}
        
        # Look for quality assurance issues
        qa_logs = [l for l in logs if l['action'] == 'quality_assurance' and l['severity'] in ['warning', 'error']]
        for log in qa_logs:
            for issue in log['details'].get('issues_found', []):
                issues[issue] = issues.get(issue, 0) + 1
        
        # Look for concurrent access conflicts
        conflict_logs = [l for l in logs if 'conflict' in l['action']]
        if conflict_logs:
            issues['concurrent_access_conflicts'] = len(conflict_logs)
        
        # Look for approval rejections
        rejection_logs = [l for l in logs if l['action'] == 'approval_rejected']
        if rejection_logs:
            issues['approval_rejections'] = len(rejection_logs)
        
        # Sort by frequency
        sorted_issues = sorted(issues.items(), key=lambda x: x[1], reverse=True)
        
        return [{'issue': issue, 'frequency': count} for issue, count in sorted_issues[:10]]

# Global instance
mobile_unit_audit_logger = MobileUnitAuditLogger()

# Convenience functions
def log_mobile_unit_event(action: str, user_id: str, session_id: str, details: Dict[str, Any], **kwargs):
    """Convenience function for logging mobile unit events"""
    return mobile_unit_audit_logger.log_mobile_unit_event(action, user_id, session_id, details, **kwargs)

def log_step_assignment(user_id: str, session_id: str, step_name: str, assigned_to: str, assigned_to_name: str, priority: str = 'medium'):
    """Convenience function for logging step assignments"""
    return mobile_unit_audit_logger.log_step_assignment(user_id, session_id, step_name, assigned_to, assigned_to_name, priority)

def log_step_completion(user_id: str, session_id: str, step_name: str, step_number: int, completion_data: Dict[str, Any], duration_minutes: Optional[int] = None):
    """Convenience function for logging step completions"""
    return mobile_unit_audit_logger.log_step_completion(user_id, session_id, step_name, step_number, completion_data, duration_minutes)

def log_approval_workflow(user_id: str, session_id: str, action_type: str, approval_type: str = 'completion', notes: Optional[str] = None, approver_id: Optional[str] = None):
    """Convenience function for logging approval workflows"""
    return mobile_unit_audit_logger.log_approval_workflow(user_id, session_id, action_type, approval_type, notes, approver_id)