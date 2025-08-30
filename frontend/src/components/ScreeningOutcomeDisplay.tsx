import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Info,
  Schedule,
  School,
  Notifications,
  Visibility
} from '@mui/icons-material';

interface ScreeningOutcomeDisplayProps {
  outcome: {
    outcome_id: string;
    session_id: string;
    outcome: {
      overall_result: string;
      risk_level: string;
      specific_findings: string[];
      academic_impact?: string;
      recommendations: string[];
      follow_up_required: boolean;
      follow_up_type?: string;
      follow_up_date?: string;
      notes?: string;
    };
    examiner_notes?: string;
    parent_notification_sent: boolean;
    school_notification_sent: boolean;
    created_at: string;
    updated_at: string;
  };
}

const ScreeningOutcomeDisplay: React.FC<ScreeningOutcomeDisplayProps> = ({ outcome }) => {
  const getResultColor = (result: string) => {
    switch (result) {
      case 'normal':
        return 'success';
      case 'abnormal':
        return 'error';
      case 'borderline':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'normal':
        return <CheckCircle color="success" />;
      case 'abnormal':
        return <Warning color="error" />;
      case 'borderline':
        return <Info color="warning" />;
      default:
        return <Info />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {getResultIcon(outcome.outcome.overall_result)}
          <Typography variant="h6" sx={{ ml: 1 }}>
            Screening Outcome
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Overall Result and Risk Level */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Overall Result
              </Typography>
              <Chip
                label={outcome.outcome.overall_result.toUpperCase()}
                color={getResultColor(outcome.outcome.overall_result) as any}
                size="medium"
                sx={{ mb: 1 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Risk Level
              </Typography>
              <Chip
                label={outcome.outcome.risk_level.toUpperCase()}
                color={getRiskColor(outcome.outcome.risk_level) as any}
                size="medium"
              />
            </Paper>
          </Grid>

          {/* Academic Impact */}
          {outcome.outcome.academic_impact && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'blue.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2">
                    Academic Impact
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {outcome.outcome.academic_impact}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Specific Findings */}
          {outcome.outcome.specific_findings.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'orange.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Visibility sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2">
                    Specific Findings
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {outcome.outcome.specific_findings.map((finding, index) => (
                    <Chip
                      key={index}
                      label={finding}
                      variant="outlined"
                      size="small"
                      color="warning"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Recommendations */}
          {outcome.outcome.recommendations.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'green.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  {outcome.outcome.recommendations.map((recommendation, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Follow-up Information */}
          {outcome.outcome.follow_up_required && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'red.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="subtitle2">
                    Follow-up Required
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {outcome.outcome.follow_up_type && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Type:
                      </Typography>
                      <Typography variant="body1">
                        {outcome.outcome.follow_up_type.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Grid>
                  )}
                  {outcome.outcome.follow_up_date && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(outcome.outcome.follow_up_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Additional Notes */}
          {outcome.outcome.notes && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Notes
                </Typography>
                <Typography variant="body2">
                  {outcome.outcome.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Examiner Notes */}
          {outcome.examiner_notes && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'purple.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Examiner Notes
                </Typography>
                <Typography variant="body2">
                  {outcome.examiner_notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Notification Status */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'blue.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle2">
                  Notification Status
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={outcome.parent_notification_sent ? 'Sent' : 'Not Sent'}
                      color={outcome.parent_notification_sent ? 'success' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2">
                      Parent Notification
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={outcome.school_notification_sent ? 'Sent' : 'Not Sent'}
                      color={outcome.school_notification_sent ? 'success' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2">
                      School Notification
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Timestamps */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
              <Typography variant="caption">
                Created: {new Date(outcome.created_at).toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Updated: {new Date(outcome.updated_at).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ScreeningOutcomeDisplay;
