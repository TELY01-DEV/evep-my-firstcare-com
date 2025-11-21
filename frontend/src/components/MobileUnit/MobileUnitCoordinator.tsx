import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Badge,
  Divider,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Person,
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  Refresh,
  Add,
  Edit,
  Visibility,
  LocalHospital,
  Group,
  Timeline,
  Notifications,
  AssignmentTurnedIn,
  AssignmentLate,
  HealthAndSafety
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import unifiedApi from '../../services/unifiedApi';

// Types for Mobile Unit Workflow
interface StepAssignment {
  step_name: string;
  step_number: number;
  assigned_to: string;
  assigned_to_name: string;
  assigned_role: 'nurse' | 'doctor' | 'medical_staff' | 'medical_admin';
  assignment_time: string;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_approval';
  estimated_duration: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface MobileUnitSession {
  session_id: string;
  patient_id: string;
  patient_name: string;
  current_step: number;
  current_step_name: string;
  status: string;
  created_at: string;
  step_assignments: StepAssignment[];
  approval_workflow?: {
    requires_approval: boolean;
    approval_status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
  };
  concurrent_access?: {
    locked_steps: string[];
    active_users: string[];
  };
}

interface StaffMember {
  user_id: string;
  name: string;
  role: 'nurse' | 'doctor' | 'medical_staff' | 'medical_admin';
  status: 'available' | 'busy' | 'break' | 'offline';
  current_assignments: number;
  current_patient?: string;
  station?: string;
}

interface MobileUnitStats {
  total_sessions: number;
  completed_today: number;
  in_progress: number;
  pending_approval: number;
  average_completion_time: number;
  staff_utilization: number;
}

interface MobileUnitCoordinatorProps {
  unitId?: string;
  onNotification?: (message: string) => void;
}

const MobileUnitCoordinator: React.FC<MobileUnitCoordinatorProps> = ({ 
  unitId = 'default-unit', 
  onNotification 
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MobileUnitSession[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<MobileUnitStats>({
    total_sessions: 0,
    completed_today: 0,
    in_progress: 0,
    pending_approval: 0,
    average_completion_time: 0,
    staff_utilization: 0
  });
  const [selectedSession, setSelectedSession] = useState<MobileUnitSession | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Partial<StepAssignment>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch mobile unit sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await unifiedApi.get('/api/v1/mobile-unit/sessions');
      if (response.data.success) {
        setSessions(response.data.sessions || []);
        setStats(response.data.stats || stats);
      } else {
        setError('Failed to fetch sessions');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Error fetching sessions');
    } finally {
      setLoading(false);
    }
  }, [stats]);

  // Fetch available staff
  const fetchStaff = useCallback(async () => {
    try {
      const response = await unifiedApi.get('/api/v1/mobile-unit/staff');
      if (response.data.success) {
        setStaff(response.data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  }, []);

  // Assign step to staff member
  const assignStep = async (sessionId: string, assignment: StepAssignment) => {
    try {
      const response = await unifiedApi.post(`/api/v1/mobile-unit/sessions/${sessionId}/assign-step`, {
        step_assignment: assignment
      });

      if (response.data.success) {
        await fetchSessions();
        setAssignmentDialogOpen(false);
        setNewAssignment({});
      } else {
        setError('Failed to assign step');
      }
    } catch (err) {
      console.error('Error assigning step:', err);
      setError('Error assigning step');
    }
  };

  // Update staff status
  const updateStaffStatus = async (staffId: string, status: StaffMember['status']) => {
    try {
      await unifiedApi.put(`/api/v1/mobile-unit/staff/${staffId}/status`, { status });
      await fetchStaff();
    } catch (err) {
      console.error('Error updating staff status:', err);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      case 'requires_approval': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Get staff status color
  const getStaffStatusColor = (status: StaffMember['status']) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'break': return 'info';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStaff();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSessions();
      fetchStaff();
    }, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchSessions, fetchStaff]);

  const openAssignmentDialog = (session: MobileUnitSession) => {
    setSelectedSession(session);
    setNewAssignment({
      step_name: session.current_step_name,
      step_number: session.current_step,
      status: 'pending',
      priority: 'medium'
    });
    setAssignmentDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Mobile Unit Coordinator
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchSessions();
            fetchStaff();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Dashboard */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{stats.total_sessions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">{stats.completed_today}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline sx={{ mr: 1, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h6">{stats.in_progress}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentTurnedIn sx={{ mr: 1, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6">{stats.pending_approval}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approval
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule sx={{ mr: 1, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6">{stats.average_completion_time}m</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Time
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Group sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{stats.staff_utilization}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff Utilization
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Sessions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Active Sessions
                </Typography>
                <Chip
                  label={`${sessions.length} Sessions`}
                  color="primary"
                  size="small"
                />
              </Box>
              
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              
              <List>
                {sessions.map((session, index) => (
                  <React.Fragment key={session.session_id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {session.patient_name}
                            </Typography>
                            <Chip
                              label={session.status}
                              color={getStatusColor(session.status)}
                              size="small"
                            />
                            {session.approval_workflow?.requires_approval && (
                              <Chip
                                label="Needs Approval"
                                color="warning"
                                size="small"
                                icon={<AssignmentLate />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Step {session.current_step}: {session.current_step_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Created: {new Date(session.created_at).toLocaleString()}
                            </Typography>
                            {session.step_assignments?.length > 0 && (
                              <Box display="flex" gap={1} mt={1}>
                                {session.step_assignments.slice(0, 3).map((assignment, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${assignment.assigned_to_name} - ${assignment.step_name}`}
                                    color={getStatusColor(assignment.status)}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {session.step_assignments.length > 3 && (
                                  <Chip
                                    label={`+${session.step_assignments.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Tooltip title="Assign Step">
                          <IconButton
                            edge="end"
                            onClick={() => openAssignmentDialog(session)}
                          >
                            <Assignment />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton edge="end">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < sessions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              {sessions.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No active sessions found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Staff Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Staff Status
                </Typography>
                <Chip
                  label={`${staff.filter(s => s.status === 'available').length} Available`}
                  color="success"
                  size="small"
                />
              </Box>
              
              <List>
                {staff.map((member, index) => (
                  <React.Fragment key={member.user_id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Badge
                          color={getStaffStatusColor(member.status)}
                          variant="dot"
                        >
                          <Avatar>
                            {member.role === 'doctor' ? <LocalHospital /> : <HealthAndSafety />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {member.name}
                            </Typography>
                            <Chip
                              label={member.role}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Chip
                              label={member.status}
                              color={getStaffStatusColor(member.status)}
                              size="small"
                            />
                            <Typography variant="caption" display="block">
                              {member.current_assignments} assignments
                            </Typography>
                            {member.current_patient && (
                              <Typography variant="caption" color="primary">
                                Current: {member.current_patient}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Select
                          value={member.status}
                          onChange={(e) => updateStaffStatus(member.user_id, e.target.value as StaffMember['status'])}
                          size="small"
                          variant="outlined"
                        >
                          <MenuItem value="available">Available</MenuItem>
                          <MenuItem value="busy">Busy</MenuItem>
                          <MenuItem value="break">Break</MenuItem>
                          <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < staff.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Step Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assign Step to Staff Member
          {selectedSession && (
            <Typography variant="subtitle2" color="text.secondary">
              Patient: {selectedSession.patient_name}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Step Name"
                value={newAssignment.step_name || ''}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, step_name: e.target.value }))}
                fullWidth
                disabled
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Step Number"
                value={newAssignment.step_number || ''}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, step_number: parseInt(e.target.value) }))}
                type="number"
                fullWidth
                disabled
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign to Staff</InputLabel>
                <Select
                  value={newAssignment.assigned_to || ''}
                  onChange={(e) => {
                    const selectedStaff = staff.find(s => s.user_id === e.target.value);
                    setNewAssignment(prev => ({
                      ...prev,
                      assigned_to: e.target.value,
                      assigned_to_name: selectedStaff?.name || '',
                      assigned_role: selectedStaff?.role
                    }));
                  }}
                  label="Assign to Staff"
                >
                  {staff.filter(s => s.status === 'available').map(member => (
                    <MenuItem key={member.user_id} value={member.user_id}>
                      {member.name} ({member.role}) - {member.current_assignments} assignments
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newAssignment.priority || 'medium'}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, priority: e.target.value as StepAssignment['priority'] }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Estimated Duration (minutes)"
                value={newAssignment.estimated_duration || ''}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                type="number"
                fullWidth
                placeholder="e.g., 15"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedSession && newAssignment.assigned_to) {
                assignStep(selectedSession.session_id, {
                  ...newAssignment,
                  assignment_time: new Date().toISOString()
                } as StepAssignment);
              }
            }}
            variant="contained"
            disabled={!newAssignment.assigned_to}
          >
            Assign Step
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileUnitCoordinator;