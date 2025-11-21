import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Info,
  Schedule,
  Person,
  Assignment,
  Visibility,
  Edit,
  Lock,
  LockOpen,
  AssignmentTurnedIn,
  ExpandMore,
  Approval
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import unifiedApi from '../../services/unifiedApi';

interface ApprovalWorkflowProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionData: any;
  onApproval?: (approved: boolean, notes?: string) => void;
  mode: 'request' | 'approve' | 'view';
}

interface ApprovalRequest {
  request_id: string;
  session_id: string;
  patient_name: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_type: 'completion' | 'edit_after_completion' | 'critical_step';
  screening_summary: any;
  notes?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

interface ScreeningSummary {
  total_steps: number;
  completed_steps: number;
  current_step: string;
  examiner_notes: string;
  critical_findings: string[];
  recommended_actions: string[];
  quality_score: number;
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  open,
  onClose,
  sessionId,
  sessionData,
  onApproval,
  mode
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [screeningSummary, setScreeningSummary] = useState<ScreeningSummary | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requiresSecondApproval, setRequiresSecondApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovalData = async () => {
      try {
        setLoading(true);
        const response = await unifiedApi.get(`/api/v1/mobile-unit/sessions/${sessionId}/approval-request`);
        
        if (response.data.success) {
          setApprovalRequest(response.data.approval_request);
          setScreeningSummary(response.data.screening_summary);
        }
      } catch (err) {
        console.error('Error fetching approval data:', err);
        setError('Failed to load approval information');
      } finally {
        setLoading(false);
      }
    };

    if (open && sessionId) {
      fetchApprovalData();
    }
  }, [open, sessionId]);

  const submitApprovalRequest = async () => {
    try {
      setLoading(true);
      const response = await unifiedApi.post(`/api/v1/mobile-unit/sessions/${sessionId}/request-approval`, {
        approval_type: 'completion',
        notes: approvalNotes,
        screening_data: sessionData,
        requires_second_approval: requiresSecondApproval
      });

      if (response.data.success) {
        onApproval?.(true, approvalNotes);
        onClose();
      } else {
        setError('Failed to submit approval request');
      }
    } catch (err) {
      console.error('Error submitting approval request:', err);
      setError('Error submitting approval request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    try {
      setLoading(true);
      const response = await unifiedApi.post(`/api/v1/mobile-unit/sessions/${sessionId}/approve`, {
        approved,
        approval_notes: approved ? approvalNotes : undefined,
        rejection_reason: !approved ? rejectionReason : undefined,
        approved_by: user?.user_id
      });

      if (response.data.success) {
        onApproval?.(approved, approved ? approvalNotes : rejectionReason);
        onClose();
      } else {
        setError('Failed to process approval');
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      setError('Error processing approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const renderRequestMode = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        You are requesting approval to complete this screening session.
      </Alert>

      {screeningSummary && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Screening Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {screeningSummary.completed_steps}/{screeningSummary.total_steps} steps
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Quality Score: 
                  <Chip
                    label={`${screeningSummary.quality_score}%`}
                    color={getQualityScoreColor(screeningSummary.quality_score)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Current Step: {screeningSummary.current_step}
                </Typography>
              </Grid>
            </Grid>

            {screeningSummary.critical_findings.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error">
                  Critical Findings:
                </Typography>
                <List dense>
                  {screeningSummary.critical_findings.map((finding, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="error" />
                      </ListItemIcon>
                      <ListItemText primary={finding} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {screeningSummary.recommended_actions.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="primary">
                  Recommended Actions:
                </Typography>
                <List dense>
                  {screeningSummary.recommended_actions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Info color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <TextField
        label="Additional Notes for Approval"
        multiline
        rows={4}
        value={approvalNotes}
        onChange={(e) => setApprovalNotes(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        placeholder="Provide any additional context or notes for the supervising doctor..."
      />

      <FormControlLabel
        control={
          <Switch
            checked={requiresSecondApproval}
            onChange={(e) => setRequiresSecondApproval(e.target.checked)}
          />
        }
        label="Requires Second Doctor Approval"
      />
    </Box>
  );

  const renderApprovalMode = () => (
    <Box>
      {approvalRequest && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Requested by: {approvalRequest.requested_by_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Request Time: {new Date(approvalRequest.requested_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Patient: {approvalRequest.patient_name}
                  </Typography>
                </Grid>
              </Grid>

              {approvalRequest.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Examiner Notes:</Typography>
                  <Typography variant="body2">{approvalRequest.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Screening Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {screeningSummary && (
                <Box>
                  <Typography variant="body2">
                    Quality Score: {screeningSummary.quality_score}%
                  </Typography>
                  <Typography variant="body2">
                    Examiner Notes: {screeningSummary.examiner_notes}
                  </Typography>
                  
                  {screeningSummary.critical_findings.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="subtitle2" color="error">
                        Critical Findings:
                      </Typography>
                      {screeningSummary.critical_findings.map((finding, index) => (
                        <Typography key={index} variant="body2" color="error">
                          • {finding}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          <TextField
            label="Approval Notes"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            placeholder="Add your approval notes..."
          />

          <TextField
            label="Rejection Reason (if rejecting)"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Reason for rejection (required if rejecting)..."
          />
        </>
      )}
    </Box>
  );

  const renderViewMode = () => (
    <Box>
      {approvalRequest && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2 }}>
                <AssignmentTurnedIn />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Approval Status
                </Typography>
                <Chip
                  label={approvalRequest.status}
                  color={getStatusColor(approvalRequest.status)}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Requested by: {approvalRequest.requested_by_name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Request Time: {new Date(approvalRequest.requested_at).toLocaleString()}
                </Typography>
              </Grid>
              {approvalRequest.approved_by && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Approved by: {approvalRequest.approved_by_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Approval Time: {new Date(approvalRequest.approved_at!).toLocaleString()}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>

            {approvalRequest.notes && (
              <Box mt={2}>
                <Typography variant="subtitle2">Examiner Notes:</Typography>
                <Typography variant="body2">{approvalRequest.notes}</Typography>
              </Box>
            )}

            {approvalRequest.rejection_reason && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error">Rejection Reason:</Typography>
                <Typography variant="body2" color="error">{approvalRequest.rejection_reason}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Approval sx={{ mr: 1 }} />
          {mode === 'request' && 'Request Approval'}
          {mode === 'approve' && 'Approve Screening'}
          {mode === 'view' && 'Approval Status'}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <Typography>Loading approval information...</Typography>
          </Box>
        ) : (
          <>
            {mode === 'request' && renderRequestMode()}
            {mode === 'approve' && renderApprovalMode()}
            {mode === 'view' && renderViewMode()}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {mode === 'view' ? 'Close' : 'Cancel'}
        </Button>
        
        {mode === 'request' && (
          <Button
            onClick={submitApprovalRequest}
            variant="contained"
            disabled={loading}
            startIcon={<AssignmentTurnedIn />}
          >
            Request Approval
          </Button>
        )}
        
        {mode === 'approve' && (
          <>
            <Button
              onClick={() => handleApproval(false)}
              variant="outlined"
              color="error"
              disabled={loading || !rejectionReason.trim()}
              startIcon={<Warning />}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleApproval(true)}
              variant="contained"
              color="success"
              disabled={loading}
              startIcon={<CheckCircle />}
            >
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalWorkflow;