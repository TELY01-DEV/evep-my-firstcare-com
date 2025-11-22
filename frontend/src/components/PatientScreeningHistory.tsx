import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Grid,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
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
  Compare,
  Timeline as TimelineIcon,
  LocalHospital,
  Person,
  CalendarMonth,
  Assessment,
  Assignment,
  BarChart
} from '@mui/icons-material';
import StaffBadge from './StaffBadge';

interface ScreeningSession {
  _id: string;
  session_id?: string;
  patient_id: string;
  patient_name: string;
  examiner_id: string;
  examiner_name: string;
  examiner_role?: string;
  screening_type: string;
  status: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  current_step?: number;
  current_step_name?: string;
  step_history?: Array<{
    step_name: string;
    step_number: number;
    status: string;
    completed_by?: string;
    completed_by_name?: string;
    completed_by_role?: string;
    completed_at?: string;
    started_at?: string;
    notes?: string;
    quality_score?: number;
  }>;
  results?: any;
  workflow_data?: any;
  last_updated_by?: string;
  last_updated_by_name?: string;
  last_updated_by_role?: string;
}

interface PatientScreeningHistoryProps {
  patientId: string;
  patientName: string;
  sessions: ScreeningSession[];
  showComparison?: boolean;
  showStaffContinuity?: boolean;
  defaultTab?: number;
}

const PatientScreeningHistory: React.FC<PatientScreeningHistoryProps> = ({
  patientId,
  patientName,
  sessions,
  showComparison = true,
  showStaffContinuity = true,
  defaultTab = 0
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Sort sessions by date (newest first)
  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get unique staff members across all sessions
  const getAllStaff = () => {
    const staffSet = new Set();
    const staffDetails = new Map();
    
    sessions.forEach(session => {
      // Add examiner
      if (session.examiner_name) {
        staffSet.add(session.examiner_name);
        staffDetails.set(session.examiner_name, {
          name: session.examiner_name,
          role: session.examiner_role || 'medical_staff',
          sessions: staffDetails.get(session.examiner_name)?.sessions || []
        });
        staffDetails.get(session.examiner_name).sessions.push(session._id);
      }

      // Add step history staff
      session.step_history?.forEach(step => {
        if (step.completed_by_name) {
          staffSet.add(step.completed_by_name);
          if (!staffDetails.has(step.completed_by_name)) {
            staffDetails.set(step.completed_by_name, {
              name: step.completed_by_name,
              role: step.completed_by_role || 'medical_staff',
              sessions: []
            });
          }
          if (!staffDetails.get(step.completed_by_name).sessions.includes(session._id)) {
            staffDetails.get(step.completed_by_name).sessions.push(session._id);
          }
        }
      });

      // Add last updated by
      if (session.last_updated_by_name && session.last_updated_by_name !== session.examiner_name) {
        staffSet.add(session.last_updated_by_name);
        if (!staffDetails.has(session.last_updated_by_name)) {
          staffDetails.set(session.last_updated_by_name, {
            name: session.last_updated_by_name,
            role: session.last_updated_by_role || 'medical_staff',
            sessions: []
          });
        }
        if (!staffDetails.get(session.last_updated_by_name).sessions.includes(session._id)) {
          staffDetails.get(session.last_updated_by_name).sessions.push(session._id);
        }
      }
    });

    return Array.from(staffDetails.values());
  };

  const getSessionMetrics = () => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'completed' || s.status === 'Screening Complete').length;
    const inProgress = sessions.filter(s => s.status === 'in_progress' || s.status.includes('Screening')).length;
    
    const screeningTypes = new Map();
    sessions.forEach(session => {
      const type = session.screening_type;
      screeningTypes.set(type, (screeningTypes.get(type) || 0) + 1);
    });

    const dateRange = sessions.length > 1 ? {
      first: new Date(Math.min(...sessions.map(s => new Date(s.created_at).getTime()))),
      last: new Date(Math.max(...sessions.map(s => new Date(s.created_at).getTime())))
    } : null;

    return {
      total,
      completed,
      inProgress,
      screeningTypes: Array.from(screeningTypes.entries()),
      dateRange
    };
  };

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    
    if (diffDays === 0) return `Same day (${startStr})`;
    if (diffDays < 30) return `${diffDays} days apart (${startStr} - ${endStr})`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months apart (${startStr} - ${endStr})`;
    return `${Math.floor(diffDays / 365)} years apart (${startStr} - ${endStr})`;
  };

  const renderOverview = () => {
    const metrics = getSessionMetrics();
    
    return (
      <Box>
        {/* Patient Info Header */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Person sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {patientName}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Patient ID: {patientId.substring(0, 8)}...
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight={700}>
                    {metrics.total}
                  </Typography>
                  <Typography variant="body2">
                    Total Screenings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight={700}>
                    {metrics.completed}
                  </Typography>
                  <Typography variant="body2">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight={700}>
                    {metrics.inProgress}
                  </Typography>
                  <Typography variant="body2">
                    In Progress
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Session Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <BarChart color="primary" />
                  Screening Types
                </Typography>
                {metrics.screeningTypes.map(([type, count]) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                      <Typography variant="body2">{type}</Typography>
                      <Chip label={count} size="small" color="primary" />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(count / metrics.total) * 100} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <CalendarMonth color="primary" />
                  Timeline Summary
                </Typography>
                {metrics.dateRange ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Screening Period
                    </Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {formatDateRange(metrics.dateRange.first, metrics.dateRange.last)}
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        First Screening: {metrics.dateRange.first.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Latest Screening: {metrics.dateRange.last.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Single screening session
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Sessions List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <History color="primary" />
              All Screening Sessions
            </Typography>
            
            {sortedSessions.map((session, index) => (
              <Accordion 
                key={session._id}
                expanded={expandedSessions.has(session._id)}
                onChange={() => toggleSessionExpansion(session._id)}
                sx={{ mb: 2, border: '1px solid #e0e0e0' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <Chip 
                      label={`#${index + 1}`} 
                      color="primary" 
                      size="small" 
                      sx={{ minWidth: 40 }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {session.screening_type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(session.created_at).toLocaleDateString()} • 
                        Examiner: {session.examiner_name}
                      </Typography>
                    </Box>
                    <Chip 
                      label={session.status} 
                      color={session.status.includes('completed') || session.status.includes('Complete') ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Box sx={{ pt: 2 }}>
                    {/* Session Details */}
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Session Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2">
                            <strong>Session ID:</strong> {session._id.substring(0, 8)}...
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> {session.status}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Created:</strong> {new Date(session.created_at).toLocaleString()}
                          </Typography>
                          {session.completed_at && (
                            <Typography variant="body2">
                              <strong>Completed:</strong> {new Date(session.completed_at).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Staff Involved
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <StaffBadge
                            staffName={session.examiner_name}
                            role={session.examiner_role as any}
                            status="completed"
                            stepName="Primary Examiner"
                            size="small"
                            variant="card"
                          />
                          {session.step_history?.map((step, stepIndex) => 
                            step.completed_by_name && step.completed_by_name !== session.examiner_name && (
                              <StaffBadge
                                key={stepIndex}
                                staffName={step.completed_by_name}
                                role={step.completed_by_role as any}
                                status="completed"
                                stepName={step.step_name}
                                size="small"
                                variant="badge"
                              />
                            )
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Step Progress */}
                    {session.current_step !== undefined && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Progress: Step {(session.current_step || 0) + 1}
                          {session.current_step_name && ` - ${session.current_step_name}`}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={((session.current_step || 0) + 1) / 8 * 100} 
                          sx={{ height: 8, borderRadius: 4, mt: 1 }}
                        />
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderStaffContinuity = () => {
    const allStaff = getAllStaff();

    return (
      <Box>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <Assignment color="primary" />
          Staff Continuity Across Sessions
        </Typography>
        
        {allStaff.length === 0 ? (
          <Alert severity="info">
            No staff information available for tracking continuity.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {allStaff.map((staff, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <StaffBadge
                        staffName={staff.name}
                        role={staff.role as any}
                        status="completed"
                        size="medium"
                        variant="card"
                        showTimestamp={false}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Involved in {staff.sessions.length} session{staff.sessions.length > 1 ? 's' : ''}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      {staff.sessions.map((sessionId: string) => {
                        const session = sessions.find(s => s._id === sessionId);
                        return session ? (
                          <Chip 
                            key={sessionId}
                            label={`${session.screening_type} - ${new Date(session.created_at).toLocaleDateString()}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ) : null;
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderSessionComparison = () => {
    if (sessions.length < 2) {
      return (
        <Alert severity="info">
          Patient has only one screening session. Comparison requires multiple sessions.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <Compare color="primary" />
          Session Comparison Analysis
        </Typography>
        
        {/* Comparison tools would go here */}
        <Alert severity="info" sx={{ mt: 2 }}>
          Session comparison feature - Under Development
          <br />
          This will show side-by-side comparison of screening results, progress, and outcomes.
        </Alert>
      </Box>
    );
  };

  const renderCombinedTimeline = () => {
    // Combine all sessions into one timeline
    const allTimelineSteps: any[] = [];
    
    sessions.forEach((session, sessionIndex) => {
      // Add session start
      allTimelineSteps.push({
        type: 'session_start',
        session_id: session._id,
        session_number: sessionIndex + 1,
        timestamp: session.created_at,
        title: `Session ${sessionIndex + 1} Started`,
        description: `${session.screening_type} by ${session.examiner_name}`,
        session: session
      });

      // Add step history
      session.step_history?.forEach(step => {
        if (step.completed_at) {
          allTimelineSteps.push({
            type: 'step_completed',
            session_id: session._id,
            session_number: sessionIndex + 1,
            timestamp: step.completed_at,
            title: step.step_name,
            description: `Completed by ${step.completed_by_name}`,
            step: step,
            session: session
          });
        }
      });

      // Add session completion
      if (session.completed_at) {
        allTimelineSteps.push({
          type: 'session_completed',
          session_id: session._id,
          session_number: sessionIndex + 1,
          timestamp: session.completed_at,
          title: `Session ${sessionIndex + 1} Completed`,
          description: session.screening_type,
          session: session
        });
      }
    });

    // Sort by timestamp
    allTimelineSteps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
      <Box>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <TimelineIcon color="primary" />
          Combined Patient Timeline
        </Typography>

        <Timeline position="left">
          {allTimelineSteps.map((item, index) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot 
                  color={
                    item.type === 'session_start' ? 'primary' :
                    item.type === 'session_completed' ? 'success' : 'info'
                  }
                >
                  {item.type === 'session_start' ? <LocalHospital /> : 
                   item.type === 'session_completed' ? <Assessment /> : <Assignment />}
                </TimelineDot>
                {index < allTimelineSteps.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent sx={{ pb: 3 }}>
                <Paper sx={{ p: 2, ml: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Chip 
                      label={`Session ${item.session_number}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Typography>

                  {item.step?.completed_by_name && (
                    <Box sx={{ mt: 1 }}>
                      <StaffBadge
                        staffName={item.step.completed_by_name}
                        role={item.step.completed_by_role as any}
                        status="completed"
                        size="small"
                        variant="inline"
                        showTimestamp={false}
                      />
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Box>
    );
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ px: 3, pt: 2 }}
          >
            <Tab label="Overview" icon={<History />} iconPosition="start" />
            <Tab label="Combined Timeline" icon={<TimelineIcon />} iconPosition="start" />
            {showStaffContinuity && (
              <Tab label="Staff Continuity" icon={<Assignment />} iconPosition="start" />
            )}
            {showComparison && sessions.length > 1 && (
              <Tab label="Session Comparison" icon={<Compare />} iconPosition="start" />
            )}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderOverview()}
          {activeTab === 1 && renderCombinedTimeline()}
          {activeTab === 2 && showStaffContinuity && renderStaffContinuity()}
          {activeTab === 3 && showComparison && renderSessionComparison()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatientScreeningHistory;