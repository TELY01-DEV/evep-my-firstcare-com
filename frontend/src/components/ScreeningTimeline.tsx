import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Grid,
  LinearProgress,
  Alert
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
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Assignment,
  LocalHospital,
  AccessTime,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import StaffBadge from './StaffBadge';

interface TimelineStep {
  step_number: number;
  step_name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'skipped';
  staff_name?: string;
  staff_id?: string;
  staff_role?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  data_quality_score?: number;
  required_approval?: boolean;
  approved_by?: string;
  approved_at?: string;
}

interface ScreeningTimelineProps {
  sessionId: string;
  patientName: string;
  screeningType: string;
  currentStep?: number;
  totalSteps?: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  steps: TimelineStep[];
  examinerName?: string;
  examinerRole?: string;
  showProgress?: boolean;
  showDuration?: boolean;
  showQuality?: boolean;
}

const ScreeningTimeline: React.FC<ScreeningTimelineProps> = ({
  sessionId,
  patientName,
  screeningType,
  currentStep = 0,
  totalSteps = 8,
  status,
  createdAt,
  updatedAt,
  steps,
  examinerName,
  examinerRole = 'medical_staff',
  showProgress = true,
  showDuration = true,
  showQuality = true
}) => {

  // Calculate overall progress
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Calculate total duration
  const totalDuration = steps.reduce((acc, step) => {
    if (step.duration_minutes) {
      return acc + step.duration_minutes;
    }
    if (step.started_at && step.completed_at) {
      const start = new Date(step.started_at).getTime();
      const end = new Date(step.completed_at).getTime();
      return acc + Math.floor((end - start) / (1000 * 60));
    }
    return acc;
  }, 0);

  // Calculate average quality score
  const qualityScores = steps.filter(s => s.data_quality_score).map(s => s.data_quality_score!);
  const averageQuality = qualityScores.length > 0 
    ? qualityScores.reduce((acc, score) => acc + score, 0) / qualityScores.length 
    : 0;

  const getStepIcon = (step: TimelineStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <PlayArrow color="warning" />;
      case 'pending':
        return <RadioButtonUnchecked color="disabled" />;
      case 'skipped':
        return <Stop color="error" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const getStepColor = (step: TimelineStep) => {
    switch (step.status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'grey';
      case 'skipped':
        return 'error';
      default:
        return 'grey';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header Section */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            📋 Screening Timeline
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {patientName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {screeningType} • Session: {sessionId.substring(0, 8)}
          </Typography>
        </Box>

        {/* Progress Overview */}
        {showProgress && (
          <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {completedSteps}/{totalSteps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Steps Completed
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color="primary"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progressPercentage)}% Complete
                  </Typography>
                </Box>
              </Grid>

              {showDuration && (
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {formatDuration(totalDuration)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Duration
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <AccessTime color="action" sx={{ mr: 0.5, fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        Started: {formatTimestamp(createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {showQuality && averageQuality > 0 && (
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color={`${getQualityColor(averageQuality)}.main`}>
                      {Math.round(averageQuality)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data Quality
                    </Typography>
                    <Chip 
                      label={averageQuality >= 90 ? 'Excellent' : averageQuality >= 70 ? 'Good' : 'Needs Review'}
                      size="small"
                      color={getQualityColor(averageQuality) as any}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Timeline */}
        <Box sx={{ p: 3 }}>
          {steps.length === 0 ? (
            <Alert severity="info">
              No step information available for this screening session.
            </Alert>
          ) : (
            <Timeline position="left">
              {steps.map((step, index) => (
                <TimelineItem key={step.step_number}>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={getStepColor(step) as any}
                      sx={{ 
                        p: 1.5,
                        border: step.step_number === currentStep ? '3px solid #2196f3' : 'none',
                        transform: step.step_number === currentStep ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {getStepIcon(step)}
                    </TimelineDot>
                    {index < steps.length - 1 && (
                      <TimelineConnector 
                        sx={{ 
                          backgroundColor: step.status === 'completed' ? 'success.main' : 'grey.300',
                          width: 3
                        }}
                      />
                    )}
                  </TimelineSeparator>

                  <TimelineContent sx={{ pb: 4 }}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        ml: 1,
                        border: step.step_number === currentStep ? '2px solid #2196f3' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        boxShadow: step.step_number === currentStep ? 3 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': step.step_number === currentStep ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #2196f3, #21cbf3)',
                        } : {}
                      }}
                    >
                      {/* Step Header */}
                      <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            Step {step.step_number + 1}: {step.step_name}
                          </Typography>
                          
                          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            <Chip
                              label={step.status.replace('_', ' ').toUpperCase()}
                              size="small"
                              color={getStepColor(step) as any}
                              variant={step.status === 'completed' ? 'filled' : 'outlined'}
                            />
                            
                            {step.required_approval && (
                              <Chip
                                label="Requires Approval"
                                size="small"
                                color="warning"
                                variant="outlined"
                                icon={<Assignment />}
                              />
                            )}
                            
                            {step.step_number === currentStep && (
                              <Chip
                                label="CURRENT STEP"
                                size="small"
                                color="primary"
                                sx={{ animation: 'pulse 2s infinite' }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Duration Display */}
                        {showDuration && (step.duration_minutes || (step.started_at && step.completed_at)) && (
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary">
                              Duration
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {step.duration_minutes 
                                ? formatDuration(step.duration_minutes)
                                : step.started_at && step.completed_at 
                                ? formatDuration(Math.floor((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / (1000 * 60)))
                                : '-'
                              }
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Staff Information */}
                      {step.staff_name && (
                        <Box mb={2}>
                          <StaffBadge
                            staffName={step.staff_name}
                            role={step.staff_role as any}
                            status={step.status === 'completed' ? 'completed' : 'active'}
                            stepName={step.step_name}
                            timestamp={step.completed_at || step.started_at}
                            variant="card"
                            size="medium"
                          />
                        </Box>
                      )}

                      {/* Timestamps */}
                      <Box display="flex" gap={3} mb={2}>
                        {step.started_at && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Started
                            </Typography>
                            <Typography variant="body2">
                              {formatTimestamp(step.started_at)}
                            </Typography>
                          </Box>
                        )}
                        
                        {step.completed_at && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Completed
                            </Typography>
                            <Typography variant="body2">
                              {formatTimestamp(step.completed_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Quality Score */}
                      {showQuality && step.data_quality_score && (
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary">
                            Data Quality Score
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={step.data_quality_score}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              color={getQualityColor(step.data_quality_score) as any}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {step.data_quality_score}%
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Approval Information */}
                      {step.approved_by && step.approved_at && (
                        <Box mb={2}>
                          <Alert severity="success" sx={{ p: 1 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocalHospital fontSize="small" />
                              <Typography variant="body2">
                                Approved by {step.approved_by} on {formatTimestamp(step.approved_at)}
                              </Typography>
                            </Box>
                          </Alert>
                        </Box>
                      )}

                      {/* Notes */}
                      {step.notes && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            mt: 0.5,
                            p: 1,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            fontStyle: 'italic'
                          }}>
                            {step.notes}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}

          {/* Session Summary */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              📊 Session Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Primary Examiner
                  </Typography>
                  <Box mt={1}>
                    <StaffBadge
                      staffName={examinerName || 'Unknown'}
                      role={examinerRole as any}
                      status="completed"
                      variant="inline"
                      showTimestamp={false}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Session Status
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Staff Involved
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                    {new Set(steps.filter(s => s.staff_name).map(s => s.staff_name)).size} Staff Members
                  </Typography>
                </Box>
              </Grid>

              {updatedAt && (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                      {formatTimestamp(updatedAt)}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScreeningTimeline;