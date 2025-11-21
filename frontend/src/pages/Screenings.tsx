import React, { useState, useEffect, useMemo } from 'react';
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
import { useLanguage } from '../contexts/LanguageContext';
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'Register waiting for screening' | 
          'Appointment Schedule' | 'Parent Consent' | 'Student Registration' | 'VA Screening' | 
          'Doctor Diagnosis' | 'Glasses Selection' | 'Inventory Check' | 'School Delivery' | 'Screening Complete';
  created_at: string;
  updated_at: string;
  results?: ScreeningResults;
  current_step?: number;
  current_step_name?: string;
  workflow_data?: any;
  step_history?: Array<{
    step_name: string;
    step_number: number;
    status: string;
    completed_by?: string;
    completed_by_name?: string;
    completed_at?: string;
    notes?: string;
  }>;
  last_updated_by?: string;
  last_updated_by_name?: string;
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
  const { t } = useLanguage();

  // Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role && ['super_admin', 'admin', 'medical_admin'].includes(user.role);
  };
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
  const [forceDelete, setForceDelete] = useState(false);
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

  // Memoize filtered sessions to prevent unnecessary re-renders
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (activeTab === 1) return session.screening_type.toLowerCase().includes('mobile');
      if (activeTab === 2) return !session.screening_type.toLowerCase().includes('mobile');
      return true;
    });
  }, [sessions, activeTab]);

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
        
        console.log('📊 Raw API sessions:', sessionsData.length, 'sessions');
        
        // Remove duplicate sessions for the same patient (keep only the most recent)
        const patientSessionMap = new Map();
        
        sessionsData.forEach((session: any) => {
          const patientId = session.patient_id;
          const sessionDate = new Date(session.created_at || session.updated_at || 0);
          
          if (!patientSessionMap.has(patientId) || 
              sessionDate > new Date(patientSessionMap.get(patientId).created_at || patientSessionMap.get(patientId).updated_at || 0)) {
            patientSessionMap.set(patientId, session);
          }
        });
        
        const uniqueSessions = Array.from(patientSessionMap.values());
        
        console.log('📊 After removing patient duplicates:', uniqueSessions.length, 'unique sessions');
        console.log('📊 Removed', sessionsData.length - uniqueSessions.length, 'duplicate sessions');
        
        setSessions(uniqueSessions || []);
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
        setSuccess('Screening session started successfully!');
        setScreeningDialogOpen(false);
        resetScreeningForm();
        fetchData(); // Refresh the complete list instead of manually adding
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          // Handle duplicate session error
          setError(`Cannot create new session: ${errorData.detail}`);
        } else {
          setError(errorData.detail || 'Failed to start screening session');
        }
      }
    } catch (error) {
      console.error('Error starting screening:', error);
      setError('Failed to start screening session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMobileScreening = () => {
    setSelectedSession(null); // Reset selected session for new screening
    resetScreeningForm(); // Reset form data
    setMobileScreeningPageOpen(true);
  };

  const handleStartStandardScreening = () => {
    setSelectedSession(null); // Reset selected session for new screening
    resetScreeningForm(); // Reset form data
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
    // Check if status is a step name (from Mobile Vision Screening workflow)
    const mobileSteps = [
      'Appointment Schedule',
      'Parent Consent',
      'Student Registration',
      'VA Screening',
      'Doctor Diagnosis',
      'Glasses Selection',
      'Inventory Check',
      'School Delivery'
    ];
    
    if (mobileSteps.includes(status)) {
      return 'warning'; // Step in progress
    }
    
    switch (status) {
      case 'completed':
      case 'Screening Complete':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
      case 'Register waiting for screening':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    // Check if status is a step name (from Mobile Vision Screening workflow)
    const mobileSteps = [
      'Appointment Schedule',
      'Parent Consent',
      'Student Registration',
      'VA Screening',
      'Doctor Diagnosis',
      'Glasses Selection',
      'Inventory Check',
      'School Delivery'
    ];
    
    if (mobileSteps.includes(status)) {
      return <PlayArrow />; // Step in progress
    }
    
    switch (status) {
      case 'completed':
      case 'Screening Complete':
        return <CheckCircle />;
      case 'in_progress':
        return <PlayArrow />;
      case 'pending':
      case 'Register waiting for screening':
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
    const isCancelled = session.status === 'cancelled';
    const isMobileScreening = session.screening_type?.toLowerCase().includes('mobile');
    const isStandardScreening = session.screening_type?.toLowerCase().includes('standard');
    
    // For mobile screenings (regardless of completion status), open the full screening form unless cancelled
    if (!isCancelled && isMobileScreening) {
      // Open full mobile screening form for editing (works for both complete and incomplete)
      setSelectedSession(session);
      setMobileScreeningPageOpen(true);
    } else if (!isCancelled && isStandardScreening) {
      // TODO: Open standard screening form for editing once existingSession support is added
      setSelectedSession(session);
      setStandardScreeningPageOpen(true);
    } else {
      // For cancelled or unknown screening types, show simple edit dialog
      setSelectedSession(session);
      setEditScreeningDialogOpen(true);
    }
  };

  const handleStepNavigation = (session: ScreeningSession, targetStep?: number) => {
    const isCancelled = session.status === 'cancelled';
    const isMobileScreening = session.screening_type?.toLowerCase().includes('mobile');
    
    // Only allow step navigation for mobile screenings that are not cancelled
    if (!isCancelled && isMobileScreening) {
      // Create a modified session with the target step if specified
      const sessionForNavigation = targetStep !== undefined ? {
        ...session,
        current_step: targetStep,
        navigation_target_step: targetStep // Add flag for form to know which step to navigate to
      } : session;
      
      setSelectedSession(sessionForNavigation);
      setMobileScreeningPageOpen(true);
    } else {
      // Fall back to regular edit for non-mobile or cancelled sessions
      handleEditScreening(session);
    }
  };

  const handleDeleteScreening = (session: ScreeningSession) => {
    setSelectedSession(session);
    setForceDelete(false); // Reset force delete when opening dialog
    setDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSession) {
      console.error('Cannot delete screening: selectedSession is missing', selectedSession);
      setError('Cannot delete screening: Session is missing');
      setDeleteConfirmDialogOpen(false);
      return;
    }
    
    // Use session_id instead of _id since that's what the API returns
    const sessionId = (selectedSession as any).session_id || selectedSession._id;
    if (!sessionId) {
      console.error('Cannot delete screening: session ID is missing', selectedSession);
      setError('Cannot delete screening: Session ID is missing');
      setDeleteConfirmDialogOpen(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('evep_token');

      // Debug logging
      console.log('🔧 Delete Debug Info:');
      console.log('  - User role:', user?.role);
      console.log('  - Is admin?', isAdmin());
      console.log('  - Force delete checked?', forceDelete);
      console.log('  - Session ID:', sessionId);

      // Add force_delete query parameter for admin users when forceDelete is true
      const queryParams = new URLSearchParams();
      if (forceDelete) {
        queryParams.append('force_delete', 'true');
        console.log('  - Added force_delete=true to query params');
      }
      const queryString = queryParams.toString();
      const deleteUrl = `${API_ENDPOINTS.SCREENINGS_SESSIONS}/${sessionId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('  - Delete URL:', deleteUrl);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('  - Delete response:', result);
        
        const deleteType = result.deletion_type;
        console.log('  - Deletion type:', deleteType);
        
        const message = deleteType === 'hard_delete' 
          ? 'Screening session permanently deleted' 
          : 'Screening session cancelled successfully';
        
        console.log('  - Success message:', message);
        
        setSuccess(message);
        setDeleteConfirmDialogOpen(false);
        setSelectedSession(null);
        setForceDelete(false); // Reset force delete state
        fetchData(); // Refresh the data
      } else {
        const errorData = await response.json();
        console.log('  - Delete error response:', errorData);
        setError(errorData.detail || 'Failed to delete screening session');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete screening session');
    } finally {
      setSaving(false);
    }
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
          existingSession={selectedSession}
          onScreeningCompleted={(screening) => {
            setSuccess('Mobile vision screening completed successfully!');
            setMobileScreeningPageOpen(false);
            setSelectedSession(null); // Clear selected session
            fetchData();
          }}
          onCancel={() => {
            setMobileScreeningPageOpen(false);
            setSelectedSession(null); // Clear selected session
          }}
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
          existingSession={selectedSession}
          onComplete={(screening: any) => {
            setSuccess('Standard vision screening completed successfully!');
            setStandardScreeningPageOpen(false);
            setSelectedSession(null); // Clear selected session
            fetchData();
          }}
          onCancel={() => {
            setStandardScreeningPageOpen(false);
            setSelectedSession(null); // Clear selected session
          }}
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
            {t('screenings.title')}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('screenings.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('screenings.subtitle')}
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
              onClick={() => {
                setSelectedSession(null); // Reset selected session for new screening
                resetScreeningForm(); // Reset form data
                setEnhancedScreeningDialogOpen(true);
              }}
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
            <Tab label={t('screenings.all_screenings')} />
            <Tab label={t('screenings.mobile_screening')} />
            <Tab label={t('screenings.standard_screening')} />
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
                  <TableCell>Current Step</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSessions.map((session, index) => {
                    // Use session_id as the primary key since API returns this field
                    const sessionKey = (session as any).session_id || session._id || `session-${index}`;
                    
                    return (
                  <TableRow key={sessionKey} hover>
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
                      <Box>
                        <Chip
                          icon={getStatusIcon(session.status)}
                          label={session.status.replace('_', ' ')}
                          color={getStatusColor(session.status) as any}
                          size="small"
                        />
                        {/* Show who worked on current status */}
                        {session.last_updated_by_name && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            by {session.last_updated_by_name}
                          </Typography>
                        )}
                        {/* Show step history for current step if available */}
                        {session.step_history && session.current_step !== undefined && (
                          (() => {
                            const currentStepHistory = session.step_history.find(
                              step => step.step_number === session.current_step
                            );
                            return currentStepHistory?.completed_by_name ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Step by {currentStepHistory.completed_by_name}
                                {currentStepHistory.completed_at && (
                                  <span> • {new Date(currentStepHistory.completed_at).toLocaleDateString()}</span>
                                )}
                              </Typography>
                            ) : null;
                          })()
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {session.current_step_name || session.current_step !== undefined ? (
                        <Box>
                          {session.current_step !== undefined && session.screening_type?.toLowerCase().includes('mobile') ? (
                            <>
                              <Chip
                                label={`Step ${(session.current_step || 0) + 1} of 8: ${session.current_step_name || 'N/A'}`}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  mb: 0.5,
                                  cursor: session.status !== 'cancelled' ? 'pointer' : 'default',
                                  '&:hover': session.status !== 'cancelled' ? {
                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                    transform: 'scale(1.02)'
                                  } : {}
                                }}
                                onClick={() => session.status !== 'cancelled' && handleStepNavigation(session, session.current_step)}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Status: {session.status.replace('_', ' ')}
                              </Typography>
                              {/* Show step history for mobile workflow */}
                              {session.step_history && session.step_history.length > 0 && (
                                <Box sx={{ mt: 1, maxHeight: 100, overflowY: 'auto' }}>
                                  {session.step_history
                                    .filter(step => step.completed_by_name) // Only show completed steps
                                    .slice(-3) // Show last 3 completed steps
                                    .map((step, index) => (
                                    <Typography 
                                      key={index} 
                                      variant="caption" 
                                      color="text.secondary" 
                                      sx={{ 
                                        display: 'block', 
                                        fontSize: '0.7rem',
                                        cursor: session.status !== 'cancelled' ? 'pointer' : 'default',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        '&:hover': session.status !== 'cancelled' ? {
                                          backgroundColor: 'rgba(33, 150, 243, 0.08)',
                                          transform: 'scale(1.01)'
                                        } : {}
                                      }}
                                      onClick={() => session.status !== 'cancelled' && handleStepNavigation(session, step.step_number)}
                                    >
                                      Step {step.step_number + 1}: {step.step_name} by {step.completed_by_name}
                                      {step.completed_at && (
                                        <span> • {new Date(step.completed_at).toLocaleDateString()}</span>
                                      )}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </>
                          ) : (
                            <>
                              <Chip
                                label={session.current_step_name || `Step ${(session.current_step || 0) + 1}`}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  mb: 0.5,
                                  cursor: session.status !== 'cancelled' && session.screening_type?.toLowerCase().includes('mobile') ? 'pointer' : 'default',
                                  '&:hover': session.status !== 'cancelled' && session.screening_type?.toLowerCase().includes('mobile') ? {
                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                    transform: 'scale(1.02)'
                                  } : {}
                                }}
                                onClick={() => {
                                  if (session.status !== 'cancelled' && session.screening_type?.toLowerCase().includes('mobile')) {
                                    handleStepNavigation(session, session.current_step);
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Status: {session.status.replace('_', ' ')}
                              </Typography>
                              {/* Show who worked on current step for standard workflow */}
                              {session.step_history && session.current_step !== undefined && (
                                (() => {
                                  const currentStepHistory = session.step_history.find(
                                    step => step.step_number === session.current_step
                                  );
                                  return currentStepHistory?.completed_by_name ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                                      by {currentStepHistory.completed_by_name}
                                      {currentStepHistory.completed_at && (
                                        <span> • {new Date(currentStepHistory.completed_at).toLocaleDateString()}</span>
                                      )}
                                    </Typography>
                                  ) : null;
                                })()
                              )}
                            </>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
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
                        <Tooltip title={
                          session.status !== 'cancelled' &&
                          (session.screening_type?.toLowerCase().includes('mobile') || 
                           session.screening_type?.toLowerCase().includes('standard'))
                            ? "Edit in Full Screening Form" 
                            : "Edit Session Details"
                        }>
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredSessions.length === 0 && (
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
        onClose={() => {
          setEnhancedScreeningDialogOpen(false);
          setSelectedSession(null); // Reset selected session
          resetScreeningForm(); // Reset form data
        }} 
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
              setSelectedSession(null); // Reset selected session
              resetScreeningForm(); // Reset form data
              fetchData();
            }}
            onCancel={() => {
              setEnhancedScreeningDialogOpen(false);
              setSelectedSession(null); // Reset selected session
              resetScreeningForm(); // Reset form data
            }}
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
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Screening Results - {selectedSession?.patient_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && <ScreeningResultsTabs selectedSession={selectedSession} />}
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
        onClose={() => {
          setEditScreeningDialogOpen(false);
          setSelectedSession(null); // Reset selected session
          resetScreeningForm(); // Reset form data
        }} 
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
                          <MenuItem value="Register waiting for screening">Register waiting for screening</MenuItem>
                          <MenuItem value="Appointment Schedule">Appointment Schedule</MenuItem>
                          <MenuItem value="Parent Consent">Parent Consent</MenuItem>
                          <MenuItem value="Student Registration">Student Registration</MenuItem>
                          <MenuItem value="VA Screening">VA Screening</MenuItem>
                          <MenuItem value="Doctor Diagnosis">Doctor Diagnosis</MenuItem>
                          <MenuItem value="Glasses Selection">Glasses Selection</MenuItem>
                          <MenuItem value="Screening Complete">Screening Complete</MenuItem>
                          <MenuItem value="Inventory Check">Inventory Check</MenuItem>
                          <MenuItem value="School Delivery">School Delivery</MenuItem>
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
          <Button onClick={() => {
            setEditScreeningDialogOpen(false);
            setSelectedSession(null); // Reset selected session
            resetScreeningForm(); // Reset form data
          }}>
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
        onClose={() => {
          setDeleteConfirmDialogOpen(false);
          setForceDelete(false); // Reset force delete when closing dialog
        }} 
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
          
          {isAdmin() && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" color="error">
                    <strong>Force Delete (Permanent):</strong> Permanently remove all data from database
                  </Typography>
                }
              />
            </Box>
          )}
          
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            <strong>Warning:</strong> {forceDelete 
              ? 'This will permanently delete all screening data and cannot be undone!'
              : 'This will cancel the screening session but preserve data for audit purposes.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmDialogOpen(false);
              setForceDelete(false); // Reset force delete when cancelling
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
            disabled={saving}
          >
            {saving 
              ? 'Processing...' 
              : forceDelete 
                ? 'Permanently Delete' 
                : 'Cancel Session'
            }
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

// Screening Results Tabs Component
interface ScreeningResultsTabsProps {
  selectedSession: ScreeningSession;
}

const ScreeningResultsTabs: React.FC<ScreeningResultsTabsProps> = ({ selectedSession }) => {
  const [activeTab, setActiveTab] = useState(0);

  const renderPatientInfo = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          Patient Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Full Name:</strong> {selectedSession.patient_name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Screening Type:</strong> {selectedSession.screening_type}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Status:</strong> 
              <Chip 
                label={selectedSession.status.replace('_', ' ')} 
                size="small" 
                color={selectedSession.status === 'completed' ? 'success' : selectedSession.status === 'in_progress' ? 'warning' : 'default'}
                sx={{ ml: 1 }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Date:</strong> {new Date(selectedSession.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Examiner:</strong> {selectedSession.examiner_name || 'Not specified'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Equipment:</strong> {selectedSession.equipment_used || 'Not specified'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderWorkflowProgress = () => {
    const isMobileScreening = selectedSession.screening_type?.toLowerCase().includes('mobile');
    const workflowSteps = isMobileScreening 
      ? [
          'Appointment Schedule',
          'Parent Consent', 
          'Student Registration',
          'VA Screening',
          'Doctor Diagnosis',
          'Glasses Selection',
          'Inventory Check',
          'School Delivery'
        ]
      : [
          'Patient Selection',
          'Screening Setup',
          'Vision Assessment', 
          'Results & Recommendations',
          'Complete Screening'
        ];

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Workflow Progress
          </Typography>
          {selectedSession.current_step !== undefined ? (
            <Stepper activeStep={selectedSession.current_step || 0} orientation="vertical">
              {workflowSteps.map((step, index) => (
                <Step key={index}>
                  <StepLabel
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}
                      >
                        {completed ? '✓' : index + 1}
                      </Box>
                    )}
                  >
                    <Typography variant="body1" sx={{ fontWeight: index === selectedSession.current_step ? 'bold' : 'normal' }}>
                      {step}
                    </Typography>
                    {index === selectedSession.current_step && (
                      <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                        (Current Step)
                      </Typography>
                    )}
                    {selectedSession.current_step_name && index === selectedSession.current_step && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {selectedSession.current_step_name}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No workflow progress information available.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderVisionResults = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          Vision Assessment Results
        </Typography>
        {selectedSession.results ? (
          <Grid container spacing={3}>
            {/* Distance Vision */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Distance Vision
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Left Eye:</strong>
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {selectedSession.results.left_eye_distance || 'Not tested'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Right Eye:</strong>
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {selectedSession.results.right_eye_distance || 'Not tested'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Near Vision */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Near Vision
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Left Eye:</strong>
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {selectedSession.results.left_eye_near || 'Not tested'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Right Eye:</strong>
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {selectedSession.results.right_eye_near || 'Not tested'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Specialized Tests */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Specialized Tests
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Color Vision:</strong>
                    </Typography>
                    <Chip 
                      label={selectedSession.results.color_vision || 'Not tested'}
                      color={selectedSession.results.color_vision === 'normal' ? 'success' : selectedSession.results.color_vision === 'failed' ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Depth Perception:</strong>
                    </Typography>
                    <Chip 
                      label={selectedSession.results.depth_perception || 'Not tested'}
                      color={selectedSession.results.depth_perception === 'normal' ? 'success' : selectedSession.results.depth_perception === 'failed' ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Notes and Recommendations */}
            {(selectedSession.results.notes || selectedSession.results.recommendations) && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                {selectedSession.results.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Clinical Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
                      {selectedSession.results.notes}
                    </Typography>
                  </Box>
                )}
                {selectedSession.results.recommendations && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations:
                    </Typography>
                    <Typography variant="body2" sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}>
                      {selectedSession.results.recommendations}
                    </Typography>
                  </Box>
                )}
              </Grid>
            )}
          </Grid>
        ) : (
          <Box>
            {/* Show session status and workflow data even when no formal results */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>No formal vision assessment results recorded for this screening session.</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Session Status: <Chip label={selectedSession.status} size="small" color="warning" />
              </Typography>
              <Typography variant="body2">
                This may be a test session or the vision assessment has not been completed yet.
              </Typography>
            </Alert>

            {/* Check for workflow data that might contain screening information */}
            {selectedSession.workflow_data?.screening_results && (
              <Card sx={{ mb: 2, bgcolor: 'warning.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Workflow Screening Data Found
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Glasses Needed:</strong> {selectedSession.workflow_data.screening_results.glasses_needed ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Glasses Fitted:</strong> {selectedSession.workflow_data.screening_results.glasses_fitted ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Overall Assessment:</strong> {selectedSession.workflow_data.screening_results.overall_assessment || 'Not specified'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Follow-up Required:</strong> {selectedSession.workflow_data.screening_results.follow_up_required ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                    {selectedSession.workflow_data.screening_results.screening_notes && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Notes:</strong> {selectedSession.workflow_data.screening_results.screening_notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Show debug information to help understand the data structure */}
            <Card sx={{ mt: 2, bgcolor: 'grey.50', border: '1px dashed grey' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  🔧 Session Data Summary (for troubleshooting)
                </Typography>
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Session ID:</strong> {selectedSession._id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Patient:</strong> {selectedSession.patient_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {selectedSession.screening_type}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> {selectedSession.status}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Current Step:</strong> {selectedSession.current_step !== undefined ? selectedSession.current_step : 'undefined'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Results Object:</strong> {selectedSession.results ? 'exists but empty/null fields' : 'null/undefined'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Workflow Data:</strong> {selectedSession.workflow_data ? 'exists' : 'null/undefined'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderWorkflowData = () => {
    const workflowData = selectedSession.workflow_data;
    const stepHistory = selectedSession.step_history;
    const isMobileScreening = selectedSession.screening_type?.toLowerCase().includes('mobile');

    return (
      <Box>
        {/* Step-by-Step Progress Details */}
        {stepHistory && stepHistory.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📋 Step History & Progress
              </Typography>
              {stepHistory.map((step, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="primary">
                        Step {step.step_number + 1}: {step.step_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {step.status}
                      </Typography>
                      {step.completed_at && (
                        <Typography variant="body2" color="text.secondary">
                          Completed: {new Date(step.completed_at).toLocaleString()}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {step.completed_by_name && (
                        <Typography variant="body2">
                          <strong>Completed by:</strong> {step.completed_by_name}
                        </Typography>
                      )}
                      {step.notes && (
                        <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 0.5, fontSize: '0.875rem' }}>
                          <strong>Notes:</strong> {step.notes}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Workflow Data Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🔍 Detailed Workflow Information
            </Typography>
            
            {workflowData ? (
              <Box>
                {/* Parent Consent Information */}
                {workflowData.parent_consent !== undefined && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: workflowData.parent_consent ? 'success.light' : 'error.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      👨‍👩‍👧‍👦 Parent Consent
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {workflowData.parent_consent ? '✅ Granted' : '❌ Not Granted'}
                    </Typography>
                    {workflowData.consent_date && (
                      <Typography variant="body2">
                        <strong>Date:</strong> {new Date(workflowData.consent_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Screening Results Details */}
                {workflowData.screening_results && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom color="info.contrastText">
                      🔬 Detailed Screening Results
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Glasses Needed:</strong> {workflowData.screening_results.glasses_needed ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Glasses Fitted:</strong> {workflowData.screening_results.glasses_fitted ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Glasses Delivered:</strong> {workflowData.screening_results.glasses_delivered ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Overall Assessment:</strong> {workflowData.screening_results.overall_assessment || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Academic Impact:</strong> {workflowData.screening_results.academic_impact || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" color="info.contrastText">
                          <strong>Follow-up Required:</strong> {workflowData.screening_results.follow_up_required ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      {workflowData.screening_results.screening_notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="info.contrastText" sx={{ mt: 1 }}>
                            <strong>Clinical Notes:</strong> {workflowData.screening_results.screening_notes}
                          </Typography>
                        </Grid>
                      )}
                      {workflowData.screening_results.recommendations && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="info.contrastText" sx={{ mt: 1 }}>
                            <strong>Recommendations:</strong> {workflowData.screening_results.recommendations}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* Inventory & Delivery Status */}
                {isMobileScreening && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom color="warning.contrastText">
                      📦 Inventory & Delivery Status
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="warning.contrastText">
                          <strong>Inventory Checked:</strong> {workflowData.inventory_checked ? '✅ Yes' : '❌ No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="warning.contrastText">
                          <strong>Glasses Selected:</strong> {workflowData.glasses_selected ? '✅ Yes' : '❌ No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="warning.contrastText">
                          <strong>Delivery Scheduled:</strong> {workflowData.delivery_scheduled ? '✅ Yes' : '❌ No'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Raw Technical Data (Collapsible) */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    🔧 Technical Data (For Debugging)
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <details>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                        Click to expand raw workflow data
                      </summary>
                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', mt: 1 }}>
                        {JSON.stringify(workflowData, null, 2)}
                      </Box>
                    </details>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No detailed workflow data available for this screening session.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Session Metadata */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Session Metadata
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Session ID:</strong> {selectedSession._id}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created:</strong> {new Date(selectedSession.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Last Updated:</strong> {new Date(selectedSession.updated_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedSession.last_updated_by_name && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Last Updated By:</strong> {selectedSession.last_updated_by_name}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Current Step:</strong> {selectedSession.current_step !== undefined ? `${selectedSession.current_step + 1}` : 'Unknown'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Current Step Name:</strong> {selectedSession.current_step_name || 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Follow-up Information */}
        {selectedSession.results?.follow_up_required && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom color="warning.contrastText">
                  ⏰ Follow-up Required
                </Typography>
                {selectedSession.results.follow_up_date && (
                  <Typography variant="body2" color="warning.contrastText">
                    <strong>Scheduled Date:</strong> {new Date(selectedSession.results.follow_up_date).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="body2" color="warning.contrastText" sx={{ mt: 1 }}>
                  Patient requires additional follow-up based on screening results.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Always show patient info */}
      {renderPatientInfo()}
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab 
            label="Workflow Progress" 
            icon={<Schedule />}
            iconPosition="start"
          />
          <Tab 
            label="Vision Results" 
            icon={<VisibilityIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Additional Data" 
            icon={<Assessment />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderWorkflowProgress()}
      {activeTab === 1 && renderVisionResults()}
      {activeTab === 2 && renderWorkflowData()}
    </Box>
  );
};

export default Screenings;
