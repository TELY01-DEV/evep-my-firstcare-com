import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add,
  Visibility,
  Assessment,
  CheckCircle,
  Warning,
  Schedule,
  Person,
  School,
  Refresh,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  Save,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ScreeningSession {
  _id: string;
  patient_id: string;
  patient_name: string;
  examiner_id: string;
  examiner_name: string;
  screening_type: string;
  equipment_used: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  results?: ScreeningResults;
}

interface ScreeningResults {
  left_eye_distance: string;
  right_eye_distance: string;
  left_eye_near: string;
  right_eye_near: string;
  color_vision: 'normal' | 'deficient' | 'failed';
  depth_perception: 'normal' | 'impaired' | 'failed';
  notes: string;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date?: string;
}

interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  school: string;
  grade: string;
}

const Screenings: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Screening workflow states
  const [activeStep, setActiveStep] = useState(0);
  const [currentSession, setCurrentSession] = useState<ScreeningSession | null>(null);
  const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
  
  // Form states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [screeningType, setScreeningType] = useState('');
  const [equipmentUsed, setEquipmentUsed] = useState('');
  const [results, setResults] = useState<ScreeningResults>({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal',
    depth_perception: 'normal',
    notes: '',
    recommendations: '',
    follow_up_required: false,
  });

  const steps = [
    'Select Patient',
    'Setup Screening',
    'Conduct Test',
    'Record Results',
    'Complete Screening'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Fetch screening sessions
      const sessionsResponse = await fetch('http://localhost:8013/api/v1/screenings/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      } else {
        // Mock data for development
        setSessions([
          {
            _id: '1',
            patient_id: '1',
            patient_name: 'John Doe',
            examiner_id: user?.user_id || '1',
            examiner_name: user?.first_name + ' ' + user?.last_name || 'Dr. Smith',
            screening_type: 'Comprehensive Vision Screening',
            equipment_used: 'Snellen Chart, Ishihara Test',
            status: 'completed',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T11:00:00Z',
            results: {
              left_eye_distance: '20/20',
              right_eye_distance: '20/25',
              left_eye_near: '20/20',
              right_eye_near: '20/20',
              color_vision: 'normal',
              depth_perception: 'normal',
              notes: 'Patient performed well during screening',
              recommendations: 'Continue regular eye care',
              follow_up_required: false,
            }
          },
          {
            _id: '2',
            patient_id: '2',
            patient_name: 'Sarah Smith',
            examiner_id: user?.user_id || '1',
            examiner_name: user?.first_name + ' ' + user?.last_name || 'Dr. Smith',
            screening_type: 'Basic Vision Screening',
            equipment_used: 'Snellen Chart',
            status: 'in_progress',
            created_at: '2024-01-15T14:00:00Z',
            updated_at: '2024-01-15T14:15:00Z',
          }
        ]);
      }

      // Fetch patients
      const patientsResponse = await fetch('http://localhost:8013/api/v1/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData.patients || []);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScreening = () => {
    setActiveStep(0);
    setCurrentSession(null);
    setScreeningDialogOpen(true);
  };

  const handleNextStep = () => {
    if (activeStep === 0 && !selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (activeStep === 1 && (!screeningType || !equipmentUsed)) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCompleteScreening = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('evep_token');
      
      // Create or update screening session
      const sessionData = {
        patient_id: selectedPatient,
        screening_type: screeningType,
        equipment_used: equipmentUsed,
        results: results,
        status: 'completed'
      };

      const response = await fetch('http://localhost:8013/api/v1/screenings/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        setSuccess('Screening completed successfully!');
        setScreeningDialogOpen(false);
        fetchData();
        resetScreeningForm();
      } else {
        setError('Failed to complete screening');
      }
    } catch (err) {
      console.error('Screening save error:', err);
      setError('Failed to complete screening');
    } finally {
      setSaving(false);
    }
  };

  const resetScreeningForm = () => {
    setActiveStep(0);
    setSelectedPatient('');
    setScreeningType('');
    setEquipmentUsed('');
    setResults({
      left_eye_distance: '',
      right_eye_distance: '',
      left_eye_near: '',
      right_eye_near: '',
      color_vision: 'normal',
      depth_perception: 'normal',
      notes: '',
      recommendations: '',
      follow_up_required: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'in_progress':
        return <PlayArrow />;
      case 'pending':
        return <Schedule />;
      case 'cancelled':
        return <Stop />;
      default:
        return <Assessment />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Vision Screening
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Conduct and manage vision screening sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleStartScreening}
          sx={{ borderRadius: 2 }}
        >
          Start New Screening
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Screening Sessions */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Screening Sessions
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Examiner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Typography variant="subtitle2">
                          {session.patient_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.screening_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.examiner_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(session.status)}
                        label={session.status.replace('_', ' ')}
                        color={getStatusColor(session.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(session.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Results">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {session.status === 'in_progress' && (
                          <Tooltip title="Continue Screening">
                            <IconButton size="small" color="primary">
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {sessions.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No screening sessions found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Screening Workflow Dialog */}
      <Dialog 
        open={screeningDialogOpen} 
        onClose={() => setScreeningDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Vision Screening Workflow
        </DialogTitle>
        <DialogContent>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Patient
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Patient</InputLabel>
                <Select
                  value={selectedPatient}
                  label="Patient"
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient._id} value={patient._id}>
                      {patient.first_name} {patient.last_name} - {patient.school} ({patient.grade})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Setup Screening
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Screening Type</InputLabel>
                    <Select
                      value={screeningType}
                      label="Screening Type"
                      onChange={(e) => setScreeningType(e.target.value)}
                    >
                      <MenuItem value="Comprehensive Vision Screening">Comprehensive Vision Screening</MenuItem>
                      <MenuItem value="Basic Vision Screening">Basic Vision Screening</MenuItem>
                      <MenuItem value="Color Vision Test">Color Vision Test</MenuItem>
                      <MenuItem value="Depth Perception Test">Depth Perception Test</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Equipment Used"
                    value={equipmentUsed}
                    onChange={(e) => setEquipmentUsed(e.target.value)}
                    margin="normal"
                    placeholder="e.g., Snellen Chart, Ishihara Test"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Conduct Test
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Follow the standard vision screening protocol for the selected test type.
                Ensure proper lighting and patient positioning.
              </Typography>
              
              <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Screening Instructions:
                </Typography>
                <Typography variant="body2" component="div">
                  <ul>
                    <li>Position patient at appropriate distance from chart</li>
                    <li>Ensure proper lighting conditions</li>
                    <li>Test each eye separately</li>
                    <li>Record smallest line patient can read correctly</li>
                    <li>Note any observations or difficulties</li>
                  </ul>
                </Typography>
              </Card>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Record Results
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Left Eye Distance"
                    value={results.left_eye_distance}
                    onChange={(e) => setResults(prev => ({ ...prev, left_eye_distance: e.target.value }))}
                    margin="normal"
                    placeholder="e.g., 20/20"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Right Eye Distance"
                    value={results.right_eye_distance}
                    onChange={(e) => setResults(prev => ({ ...prev, right_eye_distance: e.target.value }))}
                    margin="normal"
                    placeholder="e.g., 20/25"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Left Eye Near"
                    value={results.left_eye_near}
                    onChange={(e) => setResults(prev => ({ ...prev, left_eye_near: e.target.value }))}
                    margin="normal"
                    placeholder="e.g., 20/20"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Right Eye Near"
                    value={results.right_eye_near}
                    onChange={(e) => setResults(prev => ({ ...prev, right_eye_near: e.target.value }))}
                    margin="normal"
                    placeholder="e.g., 20/20"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                                       <FormControl fullWidth margin="normal">
                       <InputLabel>Color Vision</InputLabel>
                       <Select
                         value={results.color_vision}
                         label="Color Vision"
                         onChange={(e) => setResults(prev => ({ ...prev, color_vision: e.target.value as 'normal' | 'deficient' | 'failed' }))}
                       >
                         <MenuItem value="normal">Normal</MenuItem>
                         <MenuItem value="deficient">Deficient</MenuItem>
                         <MenuItem value="failed">Failed</MenuItem>
                       </Select>
                     </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                                     <FormControl fullWidth margin="normal">
                     <InputLabel>Depth Perception</InputLabel>
                     <Select
                       value={results.depth_perception}
                       label="Depth Perception"
                       onChange={(e) => setResults(prev => ({ ...prev, depth_perception: e.target.value as 'normal' | 'impaired' | 'failed' }))}
                     >
                       <MenuItem value="normal">Normal</MenuItem>
                       <MenuItem value="impaired">Impaired</MenuItem>
                       <MenuItem value="failed">Failed</MenuItem>
                     </Select>
                   </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={results.notes}
                    onChange={(e) => setResults(prev => ({ ...prev, notes: e.target.value }))}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="Additional observations or notes..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recommendations"
                    value={results.recommendations}
                    onChange={(e) => setResults(prev => ({ ...prev, recommendations: e.target.value }))}
                    margin="normal"
                    multiline
                    rows={2}
                    placeholder="Recommendations for follow-up care..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Complete Screening
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Review the screening results and confirm completion.
              </Typography>
              
              <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Screening Summary:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Left Eye Distance:</strong> {results.left_eye_distance || 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Right Eye Distance:</strong> {results.right_eye_distance || 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Color Vision:</strong> {results.color_vision}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Depth Perception:</strong> {results.depth_perception}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreeningDialogOpen(false)}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={handlePreviousStep}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCompleteScreening}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Complete Screening'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Screenings;
