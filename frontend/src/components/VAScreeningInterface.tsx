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
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Visibility,
  MedicalServices,
  Assessment,
  CheckCircle,
  Warning,
  ExpandMore
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface VAScreeningInterfaceProps {
  patientId?: string;
  appointmentId?: string;
  onScreeningComplete?: (screening: any) => void;
  onCancel?: () => void;
}

interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

interface VAScreeningResult {
  eye: string;
  distance_acuity_uncorrected?: string;
  distance_acuity_corrected?: string;
  near_acuity_uncorrected?: string;
  near_acuity_corrected?: string;
  color_vision?: string;
  depth_perception?: string;
  contrast_sensitivity?: string;
  additional_tests?: any;
}

const VAScreeningInterface: React.FC<VAScreeningInterfaceProps> = ({
  patientId,
  appointmentId,
  onScreeningComplete,
  onCancel
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [screeningType, setScreeningType] = useState('');
  const [equipmentUsed, setEquipmentUsed] = useState('');
  const [examinerNotes, setExaminerNotes] = useState('');
  const [results, setResults] = useState<VAScreeningResult[]>([]);
  const [overallAssessment, setOverallAssessment] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Data state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [currentScreeningId, setCurrentScreeningId] = useState<string | null>(null);

  // Temporary input states
  const [newRecommendation, setNewRecommendation] = useState('');

  // Load data on component mount
  useEffect(() => {
    if (patientId) {
      loadPatient();
      loadPatientScreenings();
    }
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) return;
    
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatient(response.data);
    } catch (err: any) {
      setError('Failed to load patient information');
    }
  };

  const loadPatientScreenings = async () => {
    if (!patientId) return;
    
    try {
      const response = await axios.get(`/api/v1/screenings/va/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreenings(response.data || []);
    } catch (err: any) {
      setError('Failed to load patient screenings');
    }
  };

  const handleStartScreening = async () => {
    if (!patientId || !appointmentId || !screeningType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const screeningData = {
        patient_id: patientId,
        appointment_id: appointmentId,
        screening_type: screeningType,
        equipment_used: equipmentUsed || undefined,
        examiner_notes: examinerNotes || undefined
      };

      const response = await axios.post(
        '/api/v1/screenings/va',
        screeningData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCurrentScreeningId(response.data.screening_id);
      setSuccess('VA screening session started successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start VA screening');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecommendation = () => {
    if (newRecommendation.trim()) {
      setRecommendations(prev => [...prev, newRecommendation.trim()]);
      setNewRecommendation('');
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteScreening = async () => {
    if (!currentScreeningId || !overallAssessment) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        results: results,
        overall_assessment: overallAssessment,
        recommendations: recommendations,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || undefined,
        examiner_notes: examinerNotes,
        status: 'completed'
      };

      const response = await axios.put(
        `/api/v1/screenings/va/${currentScreeningId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('VA screening completed successfully!');
      loadPatientScreenings();
      if (onScreeningComplete) {
        onScreeningComplete(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete VA screening');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = () => {
    const newResult: VAScreeningResult = {
      eye: 'left',
      distance_acuity_uncorrected: '',
      distance_acuity_corrected: '',
      near_acuity_uncorrected: '',
      near_acuity_corrected: '',
      color_vision: '',
      depth_perception: '',
      contrast_sensitivity: ''
    };
    setResults(prev => [...prev, newResult]);
  };

  const handleUpdateResult = (index: number, field: keyof VAScreeningResult, value: string) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const handleRemoveResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'normal':
        return 'success';
      case 'mild_impairment':
        return 'warning';
      case 'moderate_impairment':
        return 'error';
      case 'severe_impairment':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
            VA Screening Interface
          </Typography>

          {patient && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'blue.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Patient: {patient.first_name} {patient.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DOB: {new Date(patient.date_of_birth).toLocaleDateString()} | Gender: {patient.gender}
              </Typography>
            </Paper>
          )}

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

          {!currentScreeningId ? (
            // Start Screening Form
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Screening Type</InputLabel>
                  <Select
                    value={screeningType}
                    label="Screening Type"
                    onChange={(e) => setScreeningType(e.target.value)}
                  >
                    <MenuItem value="comprehensive">Comprehensive Eye Screening</MenuItem>
                    <MenuItem value="distance">Distance Vision Screening</MenuItem>
                    <MenuItem value="near">Near Vision Screening</MenuItem>
                    <MenuItem value="color">Color Vision Screening</MenuItem>
                    <MenuItem value="depth">Depth Perception Screening</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Equipment Used"
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  placeholder="e.g., Snellen chart, Ishihara plates..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Examiner Notes"
                  multiline
                  rows={3}
                  value={examinerNotes}
                  onChange={(e) => setExaminerNotes(e.target.value)}
                  placeholder="Initial observations or notes..."
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleStartScreening}
                  disabled={loading || !screeningType}
                  startIcon={loading ? <CircularProgress size={20} /> : <MedicalServices />}
                >
                  {loading ? 'Starting...' : 'Start VA Screening'}
                </Button>
              </Grid>
            </Grid>
          ) : (
            // Screening Results Form
            <Grid container spacing={3}>
              {/* Results Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Screening Results
                </Typography>
                
                {results.map((result, index) => (
                  <Accordion key={index} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {result.eye.charAt(0).toUpperCase() + result.eye.slice(1)} Eye Results
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Eye</InputLabel>
                            <Select
                              value={result.eye}
                              label="Eye"
                              onChange={(e) => handleUpdateResult(index, 'eye', e.target.value)}
                            >
                              <MenuItem value="left">Left Eye</MenuItem>
                              <MenuItem value="right">Right Eye</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Distance Acuity (Uncorrected)"
                            value={result.distance_acuity_uncorrected || ''}
                            onChange={(e) => handleUpdateResult(index, 'distance_acuity_uncorrected', e.target.value)}
                            placeholder="e.g., 20/20, 20/40..."
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Distance Acuity (Corrected)"
                            value={result.distance_acuity_corrected || ''}
                            onChange={(e) => handleUpdateResult(index, 'distance_acuity_corrected', e.target.value)}
                            placeholder="e.g., 20/20, 20/40..."
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Near Acuity (Uncorrected)"
                            value={result.near_acuity_uncorrected || ''}
                            onChange={(e) => handleUpdateResult(index, 'near_acuity_uncorrected', e.target.value)}
                            placeholder="e.g., N6, N8..."
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Near Acuity (Corrected)"
                            value={result.near_acuity_corrected || ''}
                            onChange={(e) => handleUpdateResult(index, 'near_acuity_corrected', e.target.value)}
                            placeholder="e.g., N6, N8..."
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Color Vision"
                            value={result.color_vision || ''}
                            onChange={(e) => handleUpdateResult(index, 'color_vision', e.target.value)}
                            placeholder="e.g., Normal, Color blind..."
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Depth Perception"
                            value={result.depth_perception || ''}
                            onChange={(e) => handleUpdateResult(index, 'depth_perception', e.target.value)}
                            placeholder="e.g., Normal, Impaired..."
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRemoveResult(index)}
                          >
                            Remove Result
                          </Button>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                <Button
                  variant="outlined"
                  onClick={handleAddResult}
                  sx={{ mb: 2 }}
                >
                  Add Eye Result
                </Button>
              </Grid>

              {/* Assessment Section */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Overall Assessment</InputLabel>
                  <Select
                    value={overallAssessment}
                    label="Overall Assessment"
                    onChange={(e) => setOverallAssessment(e.target.value)}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="mild_impairment">Mild Impairment</MenuItem>
                    <MenuItem value="moderate_impairment">Moderate Impairment</MenuItem>
                    <MenuItem value="severe_impairment">Severe Impairment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Follow-up Date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Recommendations Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {recommendations.map((recommendation, index) => (
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

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {onCancel && (
                    <Button variant="outlined" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleCompleteScreening}
                    disabled={loading || !overallAssessment}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  >
                    {loading ? 'Completing...' : 'Complete Screening'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Screening History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Patient Screening History
          </Typography>

          <List>
            {screenings.map((screening) => (
              <React.Fragment key={screening.screening_id}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {screening.screening_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Chip
                          label={screening.overall_assessment?.replace('_', ' ').toUpperCase() || 'IN PROGRESS'}
                          color={getAssessmentColor(screening.overall_assessment || '') as any}
                          size="small"
                        />
                        <Chip
                          label={screening.status.toUpperCase()}
                          color={screening.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Examiner: {screening.examiner_name} | Date: {new Date(screening.created_at).toLocaleString()}
                        </Typography>
                        {screening.recommendations && screening.recommendations.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Recommendations: {screening.recommendations.join(', ')}
                          </Typography>
                        )}
                        {screening.follow_up_required && (
                          <Typography variant="body2" color="text.secondary">
                            Follow-up Required: {screening.follow_up_date ? new Date(screening.follow_up_date).toLocaleDateString() : 'Date not set'}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VAScreeningInterface;
