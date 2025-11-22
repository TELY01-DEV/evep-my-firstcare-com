import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Tab,
  Tabs,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  ExpandMore,
  History,
  Person,
  Assignment,
  CheckCircle,
  Info,
  Error,
  Edit,
  Save,
  Visibility,
  Timeline as TimelineIcon,
  FilterList,
  Refresh
} from '@mui/icons-material';
import StaffBadge from './StaffBadge';

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  staff_name: string;
  staff_id: string;
  staff_role?: string;
  action: 'created' | 'updated' | 'completed' | 'approved' | 'rejected' | 'assigned' | 'reviewed' | 'accessed';
  step_name?: string;
  step_number?: number;
  details?: string;
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  system_action?: boolean;
  ip_address?: string;
  user_agent?: string;
}

interface ActivityLogProps {
  sessionId: string;
  activities?: ActivityLogEntry[];
  stepHistory?: Array<{
    step_name: string;
    step_number: number;
    status: string;
    completed_by?: string;
    completed_by_name?: string;
    completed_by_role?: string;
    completed_at?: string;
    notes?: string;
  }>;
  examinerName?: string;
  examinerRole?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  lastUpdatedByRole?: string;
  showFilters?: boolean;
  compact?: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({
  sessionId,
  activities = [],
  stepHistory = [],
  examinerName,
  examinerRole = 'medical_staff',
  createdAt,
  updatedAt,
  lastUpdatedBy,
  lastUpdatedByName,
  lastUpdatedByRole = 'medical_staff',
  showFilters = true,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Generate activities from step history and session data if activities not provided
  const generateActivitiesFromStepHistory = (): ActivityLogEntry[] => {
    const generatedActivities: ActivityLogEntry[] = [];

    // Add session creation activity
    if (createdAt) {
      generatedActivities.push({
        id: `creation-${sessionId}`,
        timestamp: createdAt,
        staff_name: examinerName || 'System',
        staff_id: 'system',
        staff_role: examinerRole,
        action: 'created',
        details: 'Screening session created',
        system_action: !examinerName
      });
    }

    // Add step history activities
    stepHistory.forEach((step, index) => {
      if (step.completed_by_name && step.completed_at) {
        generatedActivities.push({
          id: `step-${step.step_number}-${sessionId}`,
          timestamp: step.completed_at,
          staff_name: step.completed_by_name,
          staff_id: step.completed_by || 'unknown',
          staff_role: step.completed_by_role,
          action: step.status === 'completed' ? 'completed' : 'updated',
          step_name: step.step_name,
          step_number: step.step_number,
          details: step.notes || `${step.step_name} ${step.status}`,
        });
      }
    });

    // Add last update activity if different from step completion
    if (updatedAt && lastUpdatedByName && updatedAt !== createdAt) {
      const lastStepTime = stepHistory
        .filter(s => s.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at;
      
      if (!lastStepTime || new Date(updatedAt) > new Date(lastStepTime)) {
        generatedActivities.push({
          id: `update-${sessionId}`,
          timestamp: updatedAt,
          staff_name: lastUpdatedByName,
          staff_id: lastUpdatedBy || 'unknown',
          staff_role: lastUpdatedByRole,
          action: 'updated',
          details: 'Session data updated'
        });
      }
    }

    return generatedActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const allActivities = activities.length > 0 ? activities : generateActivitiesFromStepHistory();

  // Filter activities by type
  const getFilteredActivities = (type: 'all' | 'steps' | 'updates' | 'system') => {
    switch (type) {
      case 'steps':
        return allActivities.filter(a => a.step_name || a.action === 'completed');
      case 'updates':
        return allActivities.filter(a => a.action === 'updated' || a.action === 'approved' || a.action === 'reviewed');
      case 'system':
        return allActivities.filter(a => a.system_action || a.action === 'created');
      default:
        return allActivities;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return <Save color="primary" />;
      case 'completed': return <CheckCircle color="success" />;
      case 'updated': return <Edit color="warning" />;
      case 'approved': return <CheckCircle color="success" />;
      case 'rejected': return <Error color="error" />;
      case 'assigned': return <Assignment color="info" />;
      case 'reviewed': return <Visibility color="secondary" />;
      case 'accessed': return <Person color="action" />;
      default: return <Info color="primary" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created': return 'primary';
      case 'completed': return 'success';
      case 'updated': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'assigned': return 'info';
      case 'reviewed': return 'secondary';
      default: return 'default';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const currentActivities = getFilteredActivities(
    activeTab === 0 ? 'all' : 
    activeTab === 1 ? 'steps' : 
    activeTab === 2 ? 'updates' : 'system'
  );

  if (compact) {
    return (
      <Card sx={{ boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <History color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              Recent Activity
            </Typography>
            <Chip 
              label={allActivities.length} 
              size="small" 
              color="primary" 
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          {currentActivities.slice(0, 3).map((activity, index) => (
            <Box key={activity.id} display="flex" alignItems="center" gap={2} mb={1}>
              <StaffBadge
                staffName={activity.staff_name}
                role={activity.staff_role as any}
                status={activity.action === 'completed' ? 'completed' : 'active'}
                size="small"
                variant="badge"
                showRole={false}
                showTimestamp={false}
              />
              <Typography variant="caption" sx={{ flex: 1 }}>
                {activity.action} {activity.step_name ? `${activity.step_name}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(activity.timestamp)}
              </Typography>
            </Box>
          ))}
          
          {allActivities.length > 3 && (
            <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
              +{allActivities.length - 3} more activities
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <TimelineIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Activity Log & Audit Trail
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Activities">
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
              {showFilters && (
                <Tooltip title="Filter Options">
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          
          {/* Stats */}
          <Box display="flex" gap={2} mt={2}>
            <Chip 
              label={`${allActivities.length} Total Activities`} 
              size="small" 
              color="primary" 
            />
            <Chip 
              label={`${stepHistory.filter(s => s.completed_by_name).length} Steps Completed`} 
              size="small" 
              color="success" 
            />
            <Chip 
              label={`${new Set(allActivities.map(a => a.staff_name)).size} Staff Members`} 
              size="small" 
              color="info" 
            />
          </Box>
        </Box>

        {/* Filter Tabs */}
        {showFilters && (
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: '1px solid #e0e0e0' }}
          >
            <Tab label="All Activities" />
            <Tab label="Step Completions" />
            <Tab label="Updates & Reviews" />
            <Tab label="System Actions" />
          </Tabs>
        )}

        {/* Activities Timeline */}
        <Box sx={{ p: 3 }}>
          {currentActivities.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No activities found for this screening session.
            </Alert>
          ) : (
            <Timeline position="left">
              {currentActivities.map((activity, index) => (
                <TimelineItem key={activity.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getActivityColor(activity.action) as any} sx={{ p: 1 }}>
                      {getActivityIcon(activity.action)}
                    </TimelineDot>
                    {index < currentActivities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  
                  <TimelineContent sx={{ pb: 3 }}>
                    <Paper sx={{ p: 2, ml: 1, boxShadow: 1 }}>
                      {/* Activity Header */}
                      <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
                        <Box display="flex" alignItems="center" gap={2} flex={1}>
                          <StaffBadge
                            staffName={activity.staff_name}
                            role={activity.staff_role as any}
                            status={activity.action === 'completed' ? 'completed' : 'active'}
                            size="small"
                            variant="inline"
                            showStatus={false}
                            showTimestamp={false}
                          />
                          
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                              {activity.step_name && ` - ${activity.step_name}`}
                            </Typography>
                            
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()} • {formatTimeAgo(activity.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Chip 
                          label={activity.action}
                          size="small"
                          color={getActivityColor(activity.action) as any}
                          variant="outlined"
                        />
                      </Box>

                      {/* Activity Details */}
                      {activity.details && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {activity.details}
                        </Typography>
                      )}

                      {/* Step Information */}
                      {activity.step_number !== undefined && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={`Step ${activity.step_number + 1}`}
                            size="small"
                            variant="filled"
                            color="secondary"
                          />
                        </Box>
                      )}

                      {/* Data Changes */}
                      {activity.changes && activity.changes.length > 0 && (
                        <Accordion sx={{ mt: 1, boxShadow: 0 }}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="caption">
                              View Data Changes ({activity.changes.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0 }}>
                            {activity.changes.map((change, idx) => (
                              <Box key={idx} sx={{ mb: 1 }}>
                                <Typography variant="caption" fontWeight={600}>
                                  {change.field}:
                                </Typography>
                                <Box sx={{ ml: 1 }}>
                                  <Typography variant="caption" color="error.main">
                                    - {JSON.stringify(change.old_value)}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" color="success.main">
                                    + {JSON.stringify(change.new_value)}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* System Information */}
                      {activity.system_action && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label="System Action"
                            size="small"
                            variant="outlined"
                            color="default"
                            icon={<Info />}
                          />
                        </Box>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;