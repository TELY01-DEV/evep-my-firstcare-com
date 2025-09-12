import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface ScreeningOutcomeFormProps {
  sessionId: string;
  patientId: string;
  onOutcomeCreated?: (outcome: any) => void;
  onCancel?: () => void;
}

interface ScreeningOutcome {
  overall_result: string;
  risk_level: string;
  specific_findings: string[];
  academic_impact?: string;
  recommendations: string[];
  follow_up_required: boolean;
  follow_up_type?: string;
  follow_up_date?: string;
  notes?: string;
}

const ScreeningOutcomeForm: React.FC<ScreeningOutcomeFormProps> = ({
  sessionId,
  patientId,
  onOutcomeCreated,
  onCancel
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [outcome, setOutcome] = useState<ScreeningOutcome>({
    overall_result: '',
    risk_level: '',
    specific_findings: [],
    academic_impact: '',
    recommendations: [],
    follow_up_required: false,
    follow_up_type: '',
    follow_up_date: '',
    notes: ''
  });

  const [examinerNotes, setExaminerNotes] = useState('');
  const [parentNotificationSent, setParentNotificationSent] = useState(false);
  const [schoolNotificationSent, setSchoolNotificationSent] = useState(false);

  // Temporary input states
  const [newFinding, setNewFinding] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');

  const handleAddFinding = () => {
    if (newFinding.trim()) {
      setOutcome(prev => ({
        ...prev,
        specific_findings: [...prev.specific_findings, newFinding.trim()]
      }));
      setNewFinding('');
    }
  };

  const handleRemoveFinding = (index: number) => {
    setOutcome(prev => ({
      ...prev,
      specific_findings: prev.specific_findings.filter((_, i) => i !== index)
    }));
  };

  const handleAddRecommendation = () => {
    if (newRecommendation.trim()) {
      setOutcome(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, newRecommendation.trim()]
      }));
      setNewRecommendation('');
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setOutcome(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!outcome.overall_result || !outcome.risk_level) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/v1/screenings/sessions/${sessionId}/outcome`,
        {
          outcome: {
            ...outcome,
            follow_up_date: outcome.follow_up_date || undefined
          },
          examiner_notes: examinerNotes,
          parent_notification_sent: parentNotificationSent,
          school_notification_sent: schoolNotificationSent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess('Screening outcome created successfully!');
      if (onOutcomeCreated) {
        onOutcomeCreated(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create screening outcome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Screening Outcome Details
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Overall Result */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Overall Result</InputLabel>
                <Select
                  value={outcome.overall_result}
                  label="Overall Result"
                  onChange={(e) => setOutcome(prev => ({ ...prev, overall_result: e.target.value }))}
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="abnormal">Abnormal</MenuItem>
                  <MenuItem value="borderline">Borderline</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Risk Level */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={outcome.risk_level}
                  label="Risk Level"
                  onChange={(e) => setOutcome(prev => ({ ...prev, risk_level: e.target.value }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Academic Impact */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Academic Impact"
                multiline
                rows={3}
                value={outcome.academic_impact}
                onChange={(e) => setOutcome(prev => ({ ...prev, academic_impact: e.target.value }))}
                placeholder="Describe any potential impact on academic performance..."
              />
            </Grid>

            {/* Specific Findings */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Specific Findings
              </Typography>
              <Box sx={{ mb: 2 }}>
                {outcome.specific_findings.map((finding, index) => (
                  <Chip
                    key={index}
                    label={finding}
                    onDelete={() => handleRemoveFinding(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a specific finding..."
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFinding()}
                />
                <Button variant="outlined" onClick={handleAddFinding}>
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recommendations
              </Typography>
              <Box sx={{ mb: 2 }}>
                {outcome.recommendations.map((recommendation, index) => (
                  <Chip
                    key={index}
                    label={recommendation}
                    onDelete={() => handleRemoveRecommendation(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a recommendation..."
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecommendation()}
                />
                <Button variant="outlined" onClick={handleAddRecommendation}>
                  Add
                </Button>
              </Box>
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Follow-up Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Follow-up Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={outcome.follow_up_required}
                    onChange={(e) => setOutcome(prev => ({ ...prev, follow_up_required: e.target.checked }))}
                  />
                }
                label="Follow-up Required"
              />
            </Grid>

            {outcome.follow_up_required && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Follow-up Type</InputLabel>
                    <Select
                      value={outcome.follow_up_type}
                      label="Follow-up Type"
                      onChange={(e) => setOutcome(prev => ({ ...prev, follow_up_type: e.target.value }))}
                    >
                      <MenuItem value="re_screening">Re-screening</MenuItem>
                      <MenuItem value="medical_evaluation">Medical Evaluation</MenuItem>
                      <MenuItem value="glasses_prescription">Glasses Prescription</MenuItem>
                      <MenuItem value="specialist_referral">Specialist Referral</MenuItem>
                      <MenuItem value="academic_accommodation">Academic Accommodation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Follow-up Date"
                    type="date"
                    value={outcome.follow_up_date || ''}
                    onChange={(e) => setOutcome(prev => ({ 
                      ...prev, 
                      follow_up_date: e.target.value || undefined 
                    }))}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={4}
                value={outcome.notes}
                onChange={(e) => setOutcome(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or observations..."
              />
            </Grid>

            {/* Examiner Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Examiner Notes"
                multiline
                rows={3}
                value={examinerNotes}
                onChange={(e) => setExaminerNotes(e.target.value)}
                placeholder="Private notes for other examiners..."
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Notification Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={parentNotificationSent}
                    onChange={(e) => setParentNotificationSent(e.target.checked)}
                  />
                }
                label="Parent Notification Sent"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={schoolNotificationSent}
                    onChange={(e) => setSchoolNotificationSent(e.target.checked)}
                  />
                }
                label="School Notification Sent"
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button variant="outlined" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !outcome.overall_result || !outcome.risk_level}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Outcome'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
  );
};

export default ScreeningOutcomeForm;
