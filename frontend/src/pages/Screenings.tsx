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
  Tabs,
  Tab,
  Fab,
  Breadcrumbs,
  Link,
  FormControlLabel,
  Checkbox,
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
  LocalHospital,
  Inventory,
  DeliveryDining,
  Home,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MobileVisionScreeningForm from '../components/MobileVisionScreeningForm';
import StandardVisionScreeningForm from '../components/StandardVisionScreeningForm';
import EnhancedScreeningInterface from '../components/EnhancedScreeningInterface';
import RBACScreeningForm from '../components/RBAC/RBACScreeningForm';
import { hasMenuAccess } from '../utils/rbacMenuConfig';
import { API_ENDPOINTS } from '../config/api';

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
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Screening workflow states
  const [activeStep, setActiveStep] = useState(0);
  const [currentSession, setCurrentSession] = useState<ScreeningSession | null>(null);
  const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
  const [mobileScreeningDialogOpen, setMobileScreeningDialogOpen] = useState(false);
  const [mobileScreeningPageOpen, setMobileScreeningPageOpen] = useState(false);
  const [standardScreeningPageOpen, setStandardScreeningPageOpen] = useState(false);
  const [enhancedScreeningDialogOpen, setEnhancedScreeningDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // CRUD Dialog states
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
  const [editScreeningDialogOpen, setEditScreeningDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ScreeningSession | null>(null);

  // Helper function to ensure results have all required fields
  const createCompleteResults = (existingResults: Partial<ScreeningResults> | undefined, updates: Partial<ScreeningResults>): ScreeningResults => {
    return {
      left_eye_distance: '',
      right_eye_distance: '',
      left_eye_near: '',
      right_eye_near: '',
      color_vision: 'normal' as const,
      depth_perception: 'normal' as const,
      notes: '',
      recommendations: '',
      follow_up_required: false,
      ...existingResults,
      ...updates
    };
  };
  
  // Form states
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
      const sessionsResponse = await fetch(API_ENDPOINTS.SCREENINGS_SESSIONS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData || []);
      } else {
        console.error('Failed to fetch sessions from API');
        setSessions([]);
      }

      // Fetch patients (students)
      const patientsResponse = await fetch(API_ENDPOINTS.EVEP_STUDENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData.students || []);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScreening = async () => {
    if (!selectedPatient || !screeningType) {
      setError('Please select a patient and screening type');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const screeningData = {
        patient_id: selectedPatient._id,
        patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        screening_type: screeningType,
        equipment_used: equipmentUsed,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        notes: results.notes
      };

      const response = await fetch(API_ENDPOINTS.SCREENINGS_SESSIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screeningData),
      });

      if (response.ok) {
        const newScreening = await response.json();
        setSessions(prev => [newScreening, ...prev]);
        setSuccess('Screening session started successfully!');
        setScreeningDialogOpen(false);
        resetScreeningForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start screening session');
      }
    } catch (error) {
      console.error('Error starting screening:', error);
      setError('Failed to start screening session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMobileScreening = () => {
    setMobileScreeningPageOpen(true);
  };

  const handleStartStandardScreening = () => {
    setStandardScreeningPageOpen(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setMobileScreeningDialogOpen(false);
  };

  const handleMobileScreeningCompleted = (screening: any) => {
    setSuccess('Mobile vision screening completed successfully!');
    setMobileScreeningDialogOpen(false);
    setSelectedPatient(null);
    fetchData();
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
        patient_id: selectedPatient?._id,
        screening_type: screeningType,
        equipment_used: equipmentUsed,
        results: results,
        status: 'completed'
      };

      const response = await fetch(API_ENDPOINTS.SCREENINGS_SESSIONS, {
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
    setSelectedPatient(null);
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
    setActiveStep(0);
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

  const getScreeningTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('mobile')) {
      return <LocalHospital />;
    } else if (type.toLowerCase().includes('standard')) {
      return <Assessment />;
    } else if (type.toLowerCase().includes('enhanced')) {
      return <Visibility />;
    }
    return <Assessment />;
  };

  // CRUD action handlers for Recent Screening Sessions
  const handleViewResults = (session: ScreeningSession) => {
    setSelectedSession(session);
    setViewResultsDialogOpen(true);
  };

  const handleContinueScreening = (session: ScreeningSession) => {
    // Redirect to the appropriate screening form based on type
    if (session.screening_type.toLowerCase().includes('mobile')) {
      setSelectedSession(session);
      setMobileScreeningPageOpen(true);
    } else if (session.screening_type.toLowerCase().includes('standard')) {
      setSelectedSession(session);
      setStandardScreeningPageOpen(true);
    } else {
      setSelectedSession(session);
      setEnhancedScreeningDialogOpen(true);
    }
  };

  const handleEditScreening = (session: ScreeningSession) => {
    setSelectedSession(session);
    setEditScreeningDialogOpen(true);
  };

  const handleDeleteScreening = (session: ScreeningSession) => {
    setSelectedSession(session);
    setDeleteConfirmDialogOpen(true);
  };

  const handleSaveScreeningChanges = async () => {
    if (!selectedSession || !selectedSession._id) {
      console.error('Cannot save screening: selectedSession or _id is missing', selectedSession);
      setError('Cannot save screening: Session ID is missing');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('evep_token');
      
      // Prepare the updated session data
      const updatedSession = {
        ...selectedSession,
        updated_at: new Date().toISOString()
      };
      
      const response = await fetch(`${API_ENDPOINTS.SCREENINGS_SESSIONS}/${selectedSession._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSession),
      });
      
      if (response.ok) {
        setSuccess('Screening session updated successfully!');
        setEditScreeningDialogOpen(false);
        setSelectedSession(null);
        fetchData(); // Refresh the data
      } else {
        setError('Failed to update screening session');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update screening session');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to safely update session state
  const updateSessionField = (field: string, value: any, subField?: string) => {
    setSelectedSession(prev => {
      if (!prev) return null;
      
      if (subField && prev.results) {
        return {
          ...prev,
          results: {
            ...prev.results,
            [subField]: value
          }
        };
      }
      
      return {
        ...prev,
        [field]: value
      };
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If mobile screening page is open, show the mobile screening form
  if (mobileScreeningPageOpen) {
    return (
      <RBACScreeningForm
        screeningType="Mobile Vision"
        requiredPath="/screening/mobile-vision"
        showAccessInfo={true}
      >
        <MobileVisionScreeningForm
          onScreeningCompleted={(screening) => {
            setSuccess('Mobile vision screening completed successfully!');
            setMobileScreeningPageOpen(false);
            fetchData();
          }}
          onCancel={() => setMobileScreeningPageOpen(false)}
        />
      </RBACScreeningForm>
    );
  }

  // If standard screening page is open, show the standard screening form
  if (standardScreeningPageOpen) {
    return (
      <RBACScreeningForm
        screeningType="Standard Vision"
        requiredPath="/screening/standard-vision"
        showAccessInfo={true}
      >
        <StandardVisionScreeningForm
          onComplete={(screening: any) => {
            setSuccess('Standard vision screening completed successfully!');
            setStandardScreeningPageOpen(false);
            fetchData();
          }}
          onCancel={() => setStandardScreeningPageOpen(false)}
        />
      </RBACScreeningForm>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <VisibilityIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Vision Screening
          </Typography>
        </Breadcrumbs>
      </Box>

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          {hasMenuAccess(user?.role || '', '/screening/standard-vision') && (
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={handleStartStandardScreening}
              sx={{ borderRadius: 2 }}
            >
              Standard Screening
            </Button>
          )}
          {hasMenuAccess(user?.role || '', '/screening/mobile-vision') && (
            <Button
              variant="contained"
              startIcon={<LocalHospital />}
              onClick={handleStartMobileScreening}
              sx={{ borderRadius: 2 }}
            >
              Mobile Unit Screening
            </Button>
          )}
          {hasMenuAccess(user?.role || '', '/screening/enhanced-interface') && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Visibility />}
              onClick={() => setEnhancedScreeningDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Enhanced Screening
            </Button>
          )}
        </Box>
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

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="All Screenings" />
            <Tab label="Mobile Unit Screenings" />
            <Tab label="Standard Screenings" />
          </Tabs>
        </CardContent>
      </Card>

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
                {sessions
                  .filter(session => {
                    if (activeTab === 1) return session.screening_type.toLowerCase().includes('mobile');
                    if (activeTab === 2) return !session.screening_type.toLowerCase().includes('mobile');
                    return true;
                  })
                  .map((session) => (
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
                      <Box display="flex" alignItems="center" gap={1}>
                        {getScreeningTypeIcon(session.screening_type)}
                        <Typography variant="body2">
                          {session.screening_type}
                        </Typography>
                      </Box>
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
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewResults(session)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {session.status === 'in_progress' && (
                          <Tooltip title="Continue Screening">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleContinueScreening(session)}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditScreening(session)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteScreening(session)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {sessions.filter(session => {
            if (activeTab === 1) return session.screening_type.toLowerCase().includes('mobile');
            if (activeTab === 2) return !session.screening_type.toLowerCase().includes('mobile');
            return true;
          }).length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No screening sessions found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Patient Selection Dialog for Mobile Screening */}
      <Dialog 
        open={mobileScreeningDialogOpen} 
        onClose={() => setMobileScreeningDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <LocalHospital color="primary" />
            Select Patient for Mobile Vision Screening
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a patient to conduct mobile vision screening with glasses prescription and fitting.
          </Typography>
          
          <Grid container spacing={2}>
            {patients.map((patient) => (
              <Grid item xs={12} md={6} key={patient._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { bgcolor: 'grey.50' },
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {patient.first_name} {patient.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {patient.school} - Grade {patient.grade}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMobileScreeningDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Vision Screening Form Dialog */}
      {selectedPatient && (
        <Dialog 
          open={!!selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
          maxWidth="lg" 
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            {/* <MobileVisionScreeningForm
              patientId={selectedPatient._id}
              patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
              onScreeningCompleted={handleMobileScreeningCompleted}
              onCancel={() => setSelectedPatient(null)}
            /> */}
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Mobile Vision Screening Form temporarily unavailable
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Screening Interface Dialog */}
      <Dialog 
        open={enhancedScreeningDialogOpen} 
        onClose={() => setEnhancedScreeningDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <EnhancedScreeningInterface
            patientId={patients[0]?._id || ''}
            patientName={patients[0] ? `${patients[0].first_name} ${patients[0].last_name}` : 'Test Patient'}
            onScreeningCompleted={(results) => {
              setSuccess('Enhanced screening completed successfully!');
              setEnhancedScreeningDialogOpen(false);
              fetchData();
            }}
            onCancel={() => setEnhancedScreeningDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Standard Screening Workflow Dialog */}
      <Dialog 
        open={screeningDialogOpen} 
        onClose={() => setScreeningDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Standard Vision Screening Workflow
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
                  value={selectedPatient?._id || ''}
                  label="Patient"
                  onChange={(e) => {
                    const patient = patients.find(p => p._id === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
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

      {/* View Results Dialog */}
      <Dialog 
        open={viewResultsDialogOpen} 
        onClose={() => setViewResultsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Screening Results - {selectedSession?.patient_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Patient Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Name:</strong> {selectedSession.patient_name}<br/>
                    <strong>Screening Type:</strong> {selectedSession.screening_type}<br/>
                    <strong>Status:</strong> {selectedSession.status}<br/>
                    <strong>Date:</strong> {new Date(selectedSession.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                {selectedSession.results && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Screening Results
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Left Eye Distance:</strong> {selectedSession.results.left_eye_distance || 'Not recorded'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Right Eye Distance:</strong> {selectedSession.results.right_eye_distance || 'Not recorded'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Left Eye Near:</strong> {selectedSession.results.left_eye_near || 'Not recorded'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Right Eye Near:</strong> {selectedSession.results.right_eye_near || 'Not recorded'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Color Vision:</strong> {selectedSession.results.color_vision || 'Not recorded'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Depth Perception:</strong> {selectedSession.results.depth_perception || 'Not recorded'}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {selectedSession.results.notes && (
                      <Box mt={2}>
                        <Typography variant="body2">
                          <strong>Notes:</strong> {selectedSession.results.notes}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedSession.results.recommendations && (
                      <Box mt={2}>
                        <Typography variant="body2">
                          <strong>Recommendations:</strong> {selectedSession.results.recommendations}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                )}
                
                {!selectedSession.results && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No detailed results available for this screening session.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewResultsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Screening Dialog */}
      <Dialog 
        open={editScreeningDialogOpen} 
        onClose={() => setEditScreeningDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Edit Screening Session - {selectedSession?.patient_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Medical Record Warning:</strong> Editing screening results affects medical records. Please ensure all changes are accurate and medically appropriate.
              </Alert>
              
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Patient Name"
                        value={selectedSession.patient_name}
                        disabled
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Screening Type"
                        value={selectedSession.screening_type}
                        disabled
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={selectedSession.status}
                          label="Status"
                          onChange={(e) => {
                            setSelectedSession(prev => prev ? {
                              ...prev,
                              status: e.target.value as any
                            } : null);
                          }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Equipment Used"
                        value={selectedSession.equipment_used || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            equipment_used: e.target.value
                          } : null);
                        }}
                        margin="normal"
                        placeholder="e.g., Snellen Chart, Ishihara Test"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Vision Test Results */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Vision Test Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Left Eye Distance Vision"
                        value={selectedSession.results?.left_eye_distance || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { left_eye_distance: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        placeholder="e.g., 20/20, 20/40"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Right Eye Distance Vision"
                        value={selectedSession.results?.right_eye_distance || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { right_eye_distance: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        placeholder="e.g., 20/20, 20/40"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Left Eye Near Vision"
                        value={selectedSession.results?.left_eye_near || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { left_eye_near: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        placeholder="e.g., N8, N12"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Right Eye Near Vision"
                        value={selectedSession.results?.right_eye_near || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { right_eye_near: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        placeholder="e.g., N8, N12"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Color Vision</InputLabel>
                        <Select
                          value={selectedSession.results?.color_vision || 'normal'}
                          label="Color Vision"
                          onChange={(e) => {
                                                          setSelectedSession(prev => prev ? {
                                ...prev,
                                results: createCompleteResults(prev.results, { color_vision: e.target.value as any })
                              } : null);
                          }}
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
                          value={selectedSession.results?.depth_perception || 'normal'}
                          label="Depth Perception"
                          onChange={(e) => {
                                                          setSelectedSession(prev => prev ? {
                                ...prev,
                                results: createCompleteResults(prev.results, { depth_perception: e.target.value as any })
                              } : null);
                          }}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="impaired">Impaired</MenuItem>
                          <MenuItem value="failed">Failed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Additional Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={selectedSession.results?.notes || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { notes: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Additional observations, findings, or notes..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Recommendations"
                        value={selectedSession.results?.recommendations || ''}
                        onChange={(e) => {
                          setSelectedSession(prev => prev ? {
                            ...prev,
                            results: createCompleteResults(prev.results, { recommendations: e.target.value })
                          } : null);
                        }}
                        margin="normal"
                        multiline
                        rows={2}
                        placeholder="Recommendations for follow-up care, treatment, or monitoring..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedSession.results?.follow_up_required || false}
                            onChange={(e) => {
                                                              setSelectedSession(prev => prev ? {
                                  ...prev,
                                  results: createCompleteResults(prev.results, { follow_up_required: e.target.checked })
                                } : null);
                            }}
                          />
                        }
                        label="Follow-up Required"
                      />
                    </Grid>
                    {selectedSession.results?.follow_up_required && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Follow-up Date"
                          type="date"
                          value={selectedSession.results?.follow_up_date || ''}
                          onChange={(e) => {
                            setSelectedSession(prev => prev ? {
                              ...prev,
                              results: createCompleteResults(prev.results, { follow_up_date: e.target.value })
                            } : null);
                          }}
                          margin="normal"
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditScreeningDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveScreeningChanges}
            startIcon={<Save />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmDialogOpen} 
        onClose={() => setDeleteConfirmDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this screening session?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Patient:</strong> {selectedSession?.patient_name}<br/>
            <strong>Type:</strong> {selectedSession?.screening_type}<br/>
            <strong>Date:</strong> {selectedSession ? new Date(selectedSession.created_at).toLocaleDateString() : ''}
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This action cannot be undone. All screening data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              // TODO: Implement actual deletion
              console.log('Deleting session:', selectedSession);
              setDeleteConfirmDialogOpen(false);
              setSelectedSession(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Screenings;
