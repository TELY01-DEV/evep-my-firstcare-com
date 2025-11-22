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
  History,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import MobileVisionScreeningForm from '../components/MobileVisionScreeningForm';
import StandardVisionScreeningForm from '../components/StandardVisionScreeningForm';
import EnhancedScreeningInterface from '../components/EnhancedScreeningInterface';
import RBACScreeningForm from '../components/RBAC/RBACScreeningForm';
import { hasMenuAccess } from '../utils/rbacMenuConfig';
import { API_ENDPOINTS } from '../config/api';
import StaffBadge from '../components/StaffBadge';
import ActivityLog from '../components/ActivityLog';
import ScreeningTimeline from '../components/ScreeningTimeline';
import PatientScreeningHistory from '../components/PatientScreeningHistory';

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
    completed_by_role?: string;
    completed_at?: string;
    started_at?: string;
    quality_score?: number;
    notes?: string;
  }>;
  last_updated_by?: string;
  last_updated_by_name?: string;
  last_updated_by_role?: string;
  examiner_role?: string;
  session_id?: string;
  isFirstSessionForPatient?: boolean;
  patientSessionCount?: number;
  sessionNumberForPatient?: number;
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
  const [patientHistoryDialogOpen, setPatientHistoryDialogOpen] = useState(false);
  const [selectedPatientSessions, setSelectedPatientSessions] = useState<ScreeningSession[]>([]);
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
        
        // Group sessions by patient to show multiple sessions per patient
        const patientSessionGroups = new Map();
        
        sessionsData.forEach((session: any) => {
          const patientId = session.patient_id;
          const sessionDate = new Date(session.created_at || session.updated_at || 0);
          
          if (!patientSessionGroups.has(patientId)) {
            patientSessionGroups.set(patientId, []);
          }
          
          patientSessionGroups.get(patientId).push({
            ...session,
            sessionDate: sessionDate
          });
        });
        
        // Sort sessions within each patient group by date (newest first)
        const allSessions: any[] = [];
        patientSessionGroups.forEach((sessions, patientId) => {
          sessions.sort((a: any, b: any) => b.sessionDate.getTime() - a.sessionDate.getTime());
          
          // Add session count and patient group info
          sessions.forEach((session: any, index: number) => {
            allSessions.push({
              ...session,
              patientSessionCount: sessions.length,
              isFirstSessionForPatient: index === 0,
              sessionNumberForPatient: index + 1
            });
          });
        });
        
        // Sort all sessions by date (newest first)
        allSessions.sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime());
        
        console.log('📊 Processed sessions with patient grouping:', allSessions.length, 'sessions');
        console.log('📊 Patients with multiple sessions:', 
          Array.from(patientSessionGroups.entries()).filter(([_, sessions]) => sessions.length > 1).length);
        
        setSessions(allSessions || []);
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

  const handleViewPatientHistory = (session: ScreeningSession) => {
    // Get all sessions for this patient
    const patientSessions = sessions.filter(s => s.patient_id === session.patient_id);
    setSelectedPatientSessions(patientSessions);
    setSelectedSession(session); // Set the primary session for context
    setPatientHistoryDialogOpen(true);
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
      {/* Medical Report Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
          
          body {
            font-family: 'Times New Roman', serif !important;
            font-size: 12pt !important;
            line-height: 1.6 !important;
            color: black !important;
            background: white !important;
          }
          
          .medical-report-container {
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .medical-section {
            margin-bottom: 15pt !important;
            page-break-inside: avoid !important;
          }
          
          .vision-acuity {
            font-size: 14pt !important;
            font-weight: bold !important;
            font-family: 'Courier New', monospace !important;
          }
          
          .clinical-notes {
            border-left: 3px solid black !important;
            padding-left: 10pt !important;
            font-style: italic !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always !important;
          }
        }
        
        @media screen {
          .high-contrast-text {
            color: #1a1a1a !important;
            font-weight: 500 !important;
          }
          
          .medical-data-value {
            font-size: 1.125rem !important;
            line-height: 1.5 !important;
            font-weight: 600 !important;
          }
          
          .accessibility-focus:focus {
            outline: 3px solid #2196f3 !important;
            outline-offset: 2px !important;
          }
        }
      `}</style>
      
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
                  <TableCell>Staff & Assignments</TableCell>
                  <TableCell>Status & Activity</TableCell>
                  <TableCell>Current Step & History</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSessions.map((session, index) => {
                    // Use session_id as the primary key since API returns this field
                    const sessionKey = (session as any).session_id || session._id || `session-${index}`;
                    
                    return (
                  <TableRow key={sessionKey} hover sx={{
                    backgroundColor: session.isFirstSessionForPatient
                      ? session.patientSessionCount && session.patientSessionCount > 1
                        ? 'rgba(33, 150, 243, 0.05)' 
                        : 'inherit'
                      : 'rgba(33, 150, 243, 0.02)'
                  }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {session.patient_name}
                          </Typography>
                          {session.patientSessionCount && session.patientSessionCount > 1 && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Chip 
                                label={`${session.patientSessionCount} sessions`}
                                size="small"
                                color={session.isFirstSessionForPatient ? 'primary' : 'default'}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Session #{session.sessionNumberForPatient}
                              </Typography>
                            </Box>
                          )}
                        </Box>
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
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        {/* Primary Examiner */}
                        <StaffBadge
                          staffName={session.examiner_name || 'Unknown'}
                          role={session.examiner_role || 'medical_staff'}
                          status="completed"
                          stepName="Primary Examiner"
                          timestamp={session.created_at}
                          size="small"
                          variant="inline"
                          showTimestamp={false}
                        />
                        
                        {/* Current Step Staff */}
                        {session.step_history && session.current_step !== undefined && (
                          (() => {
                            const currentStepHistory = session.step_history.find(
                              step => step.step_number === session.current_step
                            );
                            return currentStepHistory?.completed_by_name ? (
                              <StaffBadge
                                staffName={currentStepHistory.completed_by_name}
                                role={currentStepHistory.completed_by_role || 'medical_staff'}
                                status="active"
                                stepName={currentStepHistory.step_name}
                                timestamp={currentStepHistory.completed_at}
                                size="small"
                                variant="badge"
                                showTimestamp={false}
                              />
                            ) : null;
                          })()
                        )}
                        
                        {/* Last Updated By (if different from current step) */}
                        {session.last_updated_by_name && 
                         session.last_updated_by_name !== session.examiner_name &&
                         session.last_updated_by_name !== session.step_history?.find(s => s.step_number === session.current_step)?.completed_by_name && (
                          <StaffBadge
                            staffName={session.last_updated_by_name}
                            role={session.last_updated_by_role || 'medical_staff'}
                            status="working"
                            stepName="Last Updated"
                            timestamp={session.updated_at}
                            size="small"
                            variant="badge"
                            showTimestamp={false}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            icon={getStatusIcon(session.status)}
                            label={session.status.replace('_', ' ')}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        {/* Show who worked on current status with badge */}
                        {session.last_updated_by_name && (
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <StaffBadge
                              staffName={session.last_updated_by_name}
                              role={session.last_updated_by_role || 'medical_staff'}
                              status="completed"
                              size="small"
                              variant="badge"
                              showRole={false}
                              showTimestamp={false}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Updated by
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Show step history for current step if available */}
                        {session.step_history && session.current_step !== undefined && (
                          (() => {
                            const currentStepHistory = session.step_history.find(
                              step => step.step_number === session.current_step
                            );
                            return currentStepHistory?.completed_by_name ? (
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <StaffBadge
                                  staffName={currentStepHistory.completed_by_name}
                                  role={currentStepHistory.completed_by_role || 'medical_staff'}
                                  status="active"
                                  stepName={currentStepHistory.step_name}
                                  size="small"
                                  variant="badge"
                                  showRole={false}
                                  showTimestamp={false}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Step by
                                  {currentStepHistory.completed_at && (
                                    <span> • {new Date(currentStepHistory.completed_at).toLocaleDateString()}</span>
                                  )}
                                </Typography>
                              </Box>
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
                              {/* Show step history for mobile workflow with staff badges */}
                              {session.step_history && session.step_history.length > 0 && (
                                <Box sx={{ mt: 1, maxHeight: 120, overflowY: 'auto' }}>
                                  {session.step_history
                                    .filter(step => step.completed_by_name) // Only show completed steps
                                    .slice(-3) // Show last 3 completed steps
                                    .map((step, index) => (
                                    <Box 
                                      key={index}
                                      sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1,
                                        p: 1,
                                        borderRadius: '4px',
                                        cursor: session.status !== 'cancelled' ? 'pointer' : 'default',
                                        '&:hover': session.status !== 'cancelled' ? {
                                          backgroundColor: 'rgba(33, 150, 243, 0.08)',
                                          transform: 'scale(1.01)'
                                        } : {}
                                      }}
                                      onClick={() => session.status !== 'cancelled' && handleStepNavigation(session, step.step_number)}
                                    >
                                      <StaffBadge
                                        staffName={step.completed_by_name}
                                        role={step.completed_by_role || 'medical_staff'}
                                        status="completed"
                                        stepName={step.step_name}
                                        timestamp={step.completed_at}
                                        size="small"
                                        variant="badge"
                                        showRole={false}
                                        showTimestamp={false}
                                      />
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        sx={{ 
                                          fontSize: '0.7rem',
                                          flex: 1
                                        }}
                                      >
                                        Step {step.step_number + 1}: {step.step_name}
                                        {step.completed_at && (
                                          <span> • {new Date(step.completed_at).toLocaleDateString()}</span>
                                        )}
                                      </Typography>
                                    </Box>
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
                        {session.patientSessionCount && session.patientSessionCount > 1 && (
                          <Tooltip title={`View All ${session.patientSessionCount} Sessions for Patient`}>
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleViewPatientHistory(session)}
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                        )}
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

      {/* Patient Screening History Dialog */}
      <Dialog 
        open={patientHistoryDialogOpen} 
        onClose={() => setPatientHistoryDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <History color="primary" />
            Complete Screening History - {selectedSession?.patient_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSession && selectedPatientSessions.length > 0 && (
            <PatientScreeningHistory
              patientId={selectedSession.patient_id}
              patientName={selectedSession.patient_name}
              sessions={selectedPatientSessions}
              showComparison={true}
              showStaffContinuity={true}
              defaultTab={0}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
    <Card sx={{ mb: 4, boxShadow: 4, border: '2px solid #e2e8f0' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ 
          borderBottom: '3px solid', 
          borderColor: 'success.main', 
          pb: 3, 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: 'success.main',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            👤 PATIENT IDENTIFICATION & SESSION DETAILS
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ 
              bgcolor: 'success.main', 
              color: 'white', 
              px: 2, 
              py: 0.5, 
              borderRadius: 1,
              fontWeight: 500
            }}>
              Session ID: {selectedSession._id?.substring(0, 8) || 'N/A'}
            </Typography>
            <Chip 
              label={selectedSession.status.replace('_', ' ').toUpperCase()} 
              size="medium"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.875rem',
                height: 32
              }}
              color={selectedSession.status === 'completed' ? 'success' : selectedSession.status === 'in_progress' ? 'warning' : 'default'}
            />
          </Box>
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 3,
                color: '#1e293b',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                📋 PATIENT DEMOGRAPHICS
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    fontSize: '0.875rem'
                  }}>
                    PATIENT NAME
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 500,
                    fontSize: '1.1rem'
                  }}>
                    {selectedSession.patient_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    fontSize: '0.875rem'
                  }}>
                    SCREENING PROTOCOL
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}>
                    {selectedSession.screening_type}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 3,
                color: '#1e293b',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                🕐 SESSION INFORMATION
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    fontSize: '0.875rem'
                  }}>
                    EXAMINATION DATE
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}>
                    {new Date(selectedSession.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>\n                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    fontSize: '0.875rem'
                  }}>
                    EXAMINING CLINICIAN
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}>
                    {selectedSession.examiner_name || 'Not Specified'}
                  </Typography>
                </Box>\n                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    fontSize: '0.875rem'
                  }}>
                    EQUIPMENT UTILIZED
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}>
                    {selectedSession.equipment_used || 'Standard Vision Screening Equipment'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
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
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            borderBottom: '3px solid', 
            borderColor: 'secondary.main', 
            pb: 3, 
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: 'secondary.main',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              🔄 CLINICAL WORKFLOW PROGRESSION
            </Typography>
            <Typography variant="caption" sx={{ 
              bgcolor: 'secondary.main', 
              color: 'white', 
              px: 2, 
              py: 0.5, 
              borderRadius: 1,
              fontWeight: 500
            }}>
              {isMobileScreening ? 'Mobile Unit Protocol' : 'Standard Protocol'}
            </Typography>
          </Box>
          
          {selectedSession.current_step !== undefined ? (
            <Paper sx={{ p: 3, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
              <Stepper 
                activeStep={selectedSession.current_step || 0} 
                orientation="vertical"
                sx={{
                  '& .MuiStepLabel-root': {
                    py: 1
                  },
                  '& .MuiStepContent-root': {
                    borderLeft: '3px solid #e0e0e0',
                    ml: 2,
                    pl: 3
                  }
                }}
              >
                {workflowSteps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      StepIconComponent={({ active, completed }) => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: completed ? 'success.main' : active ? 'warning.main' : 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            border: completed ? '3px solid #2e7d32' : active ? '3px solid #ed6c02' : '3px solid #bdbdbd',
                            boxShadow: completed || active ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                          }}
                        >
                          {completed ? '✓' : index + 1}
                        </Box>
                      )}
                    >
                      <Box sx={{ ml: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: index === (selectedSession.current_step ?? -1) ? 700 : 500,
                            color: index === (selectedSession.current_step ?? -1) ? 'warning.main' : 
                                   index < (selectedSession.current_step ?? -1) ? 'success.main' : '#666',
                            fontSize: '1.1rem'
                          }}
                        >
                          {step}
                        </Typography>
                        {index === (selectedSession.current_step ?? -1) && (
                          <Chip
                            label="CURRENT STEP"
                            size="small"
                            color="warning"
                            variant="filled"
                            sx={{ 
                              mt: 0.5,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                        {selectedSession.current_step_name && index === (selectedSession.current_step ?? -1) && (
                          <Typography variant="caption" sx={{ 
                            display: 'block',
                            color: 'text.secondary',
                            mt: 0.5,
                            fontStyle: 'italic'
                          }}>
                            Status: {selectedSession.current_step_name}
                          </Typography>
                        )}
                        {index < (selectedSession.current_step ?? 0) && (
                          <Typography variant="caption" sx={{ 
                            display: 'block',
                            color: 'success.main',
                            mt: 0.5,
                            fontWeight: 500
                          }}>
                            ✅ Completed
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {/* Progress Summary */}
              <Box sx={{ mt: 4, p: 3, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  color: '#1e293b',
                  fontSize: '1.1rem'
                }}>
                  📊 PROGRESS SUMMARY
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.contrastText' }}>
                        {selectedSession.current_step || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.contrastText', fontWeight: 500 }}>
                        Steps Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.contrastText' }}>
                        {workflowSteps.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'info.contrastText', fontWeight: 500 }}>
                        Total Steps
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.contrastText' }}>
                        {Math.round(((selectedSession.current_step || 0) / workflowSteps.length) * 100)}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'warning.contrastText', fontWeight: 500 }}>
                        Progress
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ fontSize: '1rem', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No Workflow Information Available
              </Typography>
              <Typography variant="body2">
                This screening session does not contain detailed workflow progression data.
                This may indicate a legacy session or manual data entry.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderVisionResults = () => (
    <Card sx={{ mb: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ 
          borderBottom: '3px solid', 
          borderColor: 'primary.main', 
          pb: 2, 
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            fontSize: '1.5rem'
          }}>
            📋 CLINICAL VISION ASSESSMENT REPORT
          </Typography>
          <Typography variant="caption" sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: 500
          }}>
            Medical Report
          </Typography>
        </Box>
        
        {selectedSession.results ? (
          <Grid container spacing={4}>
            {/* Distance Vision Assessment */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 40, 
                    bgcolor: 'primary.main', 
                    mr: 2,
                    borderRadius: 1
                  }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: '#1e293b',
                    fontSize: '1.25rem'
                  }}>
                    DISTANCE VISION ACUITY (6m/20ft)
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        👁️ LEFT EYE (OS)
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: selectedSession.results.left_eye_distance && selectedSession.results.left_eye_distance !== 'Not tested' ? 'primary.main' : 'text.disabled',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedSession.results.left_eye_distance || 'NOT TESTED'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Oculus Sinister
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        👁️ RIGHT EYE (OD)
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: selectedSession.results.right_eye_distance && selectedSession.results.right_eye_distance !== 'Not tested' ? 'primary.main' : 'text.disabled',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedSession.results.right_eye_distance || 'NOT TESTED'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Oculus Dexter
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Near Vision Assessment */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 40, 
                    bgcolor: 'secondary.main', 
                    mr: 2,
                    borderRadius: 1
                  }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: '#1e293b',
                    fontSize: '1.25rem'
                  }}>
                    NEAR VISION ACUITY (33cm/14in)
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        👁️ LEFT EYE (OS)
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: selectedSession.results.left_eye_near && selectedSession.results.left_eye_near !== 'Not tested' ? 'secondary.main' : 'text.disabled',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedSession.results.left_eye_near || 'NOT TESTED'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Near Reading Distance
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        👁️ RIGHT EYE (OD)
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: selectedSession.results.right_eye_near && selectedSession.results.right_eye_near !== 'Not tested' ? 'secondary.main' : 'text.disabled',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedSession.results.right_eye_near || 'NOT TESTED'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Near Reading Distance
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Specialized Clinical Tests */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#fefce8', border: '1px solid #fbbf24' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 40, 
                    bgcolor: 'warning.main', 
                    mr: 2,
                    borderRadius: 1
                  }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: '#1e293b',
                    fontSize: '1.25rem'
                  }}>
                    SPECIALIZED VISION ASSESSMENTS
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #fbbf24',
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        🎨 COLOR VISION SCREENING
                      </Typography>
                      <Chip 
                        label={(
                          selectedSession.results.color_vision === 'normal' ? 'NORMAL' :
                          selectedSession.results.color_vision === 'deficient' ? 'DEFICIENT' :
                          selectedSession.results.color_vision === 'failed' ? 'FAILED' :
                          'NOT TESTED'
                        )}
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          height: 40,
                          '& .MuiChip-label': { px: 3 }
                        }}
                        color={
                          selectedSession.results.color_vision === 'normal' ? 'success' : 
                          selectedSession.results.color_vision === 'deficient' ? 'warning' :
                          selectedSession.results.color_vision === 'failed' ? 'error' : 'default'
                        }
                        variant="filled"
                      />
                      <Typography variant="caption" sx={{ 
                        mt: 2, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Ishihara/D-15 Test Protocol
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '2px solid #fbbf24',
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem'
                      }}>
                        🔍 STEREOPSIS ASSESSMENT
                      </Typography>
                      <Chip 
                        label={(
                          selectedSession.results.depth_perception === 'normal' ? 'NORMAL' :
                          selectedSession.results.depth_perception === 'impaired' ? 'IMPAIRED' :
                          selectedSession.results.depth_perception === 'failed' ? 'FAILED' :
                          'NOT TESTED'
                        )}
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          height: 40,
                          '& .MuiChip-label': { px: 3 }
                        }}
                        color={
                          selectedSession.results.depth_perception === 'normal' ? 'success' : 
                          selectedSession.results.depth_perception === 'impaired' ? 'warning' :
                          selectedSession.results.depth_perception === 'failed' ? 'error' : 'default'
                        }
                        variant="filled"
                      />
                      <Typography variant="caption" sx={{ 
                        mt: 2, 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}>
                        Titmus/Random Dot Stereogram
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Clinical Documentation */}
            {(selectedSession.results.notes || selectedSession.results.recommendations) && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 40, 
                      bgcolor: 'info.main', 
                      mr: 2,
                      borderRadius: 1
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: '#1e293b',
                      fontSize: '1.25rem'
                    }}>
                      CLINICAL DOCUMENTATION
                    </Typography>
                  </Box>
                  
                  {selectedSession.results.notes && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        📝 CLINICAL OBSERVATIONS
                      </Typography>
                      <Paper sx={{ 
                        p: 3, 
                        bgcolor: 'white',
                        border: '1px solid #cbd5e1',
                        borderLeft: '4px solid #0ea5e9'
                      }}>
                        <Typography variant="body1" sx={{ 
                          lineHeight: 1.8,
                          fontSize: '1rem',
                          color: '#1e293b',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {selectedSession.results.notes}
                        </Typography>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }}>
                            Examiner: {selectedSession.examiner_name || 'Not specified'} | 
                            Date: {new Date(selectedSession.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  
                  {selectedSession.results.recommendations && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#374151',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        ⚕️ CLINICAL RECOMMENDATIONS
                      </Typography>
                      <Paper sx={{ 
                        p: 3, 
                        bgcolor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderLeft: '4px solid #f59e0b'
                      }}>
                        <Typography variant="body1" sx={{ 
                          lineHeight: 1.8,
                          fontSize: '1rem',
                          color: '#92400e',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: 500
                        }}>
                          {selectedSession.results.recommendations}
                        </Typography>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #f59e0b' }}>
                          <Typography variant="caption" sx={{ 
                            color: '#92400e',
                            fontStyle: 'italic',
                            fontWeight: 500
                          }}>
                            ⚠️ Follow clinical protocols for implementation
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}
                </Paper>
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
      
      {/* Print/Export Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ 
          color: '#1e293b',
          fontWeight: 600,
          fontSize: '1.25rem'
        }}>
          📊 COMPREHENSIVE SCREENING REPORT
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => window.print()}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white'
              }
            }}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              // Generate PDF-like view
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Vision Screening Report - ${selectedSession.patient_name}</title>
                      <style>
                        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
                        .header { text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
                        .section { margin-bottom: 30px; page-break-inside: avoid; }
                        .label { font-weight: bold; color: #333; }
                        .value { margin-left: 20px; font-size: 1.1em; }
                        .result-box { border: 2px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
                        .normal { border-color: #4caf50; background-color: #f1f8e9; }
                        .warning { border-color: #ff9800; background-color: #fff3e0; }
                        .error { border-color: #f44336; background-color: #ffebee; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>VISION SCREENING MEDICAL REPORT</h1>
                        <p><strong>Patient:</strong> ${selectedSession.patient_name}</p>
                        <p><strong>Date:</strong> ${new Date(selectedSession.created_at).toLocaleDateString()}</p>
                        <p><strong>Examiner:</strong> ${selectedSession.examiner_name || 'Not specified'}</p>
                      </div>
                      <div class="section">
                        <h2>Vision Acuity Results</h2>
                        <div class="result-box">
                          <p class="label">Distance Vision:</p>
                          <p class="value">Left Eye (OS): ${selectedSession.results?.left_eye_distance || 'Not tested'}</p>
                          <p class="value">Right Eye (OD): ${selectedSession.results?.right_eye_distance || 'Not tested'}</p>
                        </div>
                        <div class="result-box">
                          <p class="label">Near Vision:</p>
                          <p class="value">Left Eye (OS): ${selectedSession.results?.left_eye_near || 'Not tested'}</p>
                          <p class="value">Right Eye (OD): ${selectedSession.results?.right_eye_near || 'Not tested'}</p>
                        </div>
                      </div>
                      <div class="section">
                        <h2>Specialized Tests</h2>
                        <div class="result-box ${selectedSession.results?.color_vision === 'normal' ? 'normal' : selectedSession.results?.color_vision === 'failed' ? 'error' : 'warning'}">
                          <p class="label">Color Vision: ${selectedSession.results?.color_vision || 'Not tested'}</p>
                        </div>
                        <div class="result-box ${selectedSession.results?.depth_perception === 'normal' ? 'normal' : selectedSession.results?.depth_perception === 'failed' ? 'error' : 'warning'}">
                          <p class="label">Depth Perception: ${selectedSession.results?.depth_perception || 'Not tested'}</p>
                        </div>
                      </div>
                      ${selectedSession.results?.notes || selectedSession.results?.recommendations ? `
                        <div class="section">
                          <h2>Clinical Documentation</h2>
                          ${selectedSession.results?.notes ? `<div class="result-box"><p class="label">Clinical Notes:</p><p class="value">${selectedSession.results.notes}</p></div>` : ''}
                          ${selectedSession.results?.recommendations ? `<div class="result-box warning"><p class="label">Recommendations:</p><p class="value">${selectedSession.results.recommendations}</p></div>` : ''}
                        </div>
                      ` : ''}
                      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; color: #666;">
                        <p>This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                        <p>Medical Record System - Vision Screening Module</p>
                      </div>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
              }
            }}
            sx={{
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark'
              }
            }}
          >
            Medical Report View
          </Button>
        </Box>
      </Box>
      
      {/* Enhanced Tabs */}
      <Paper sx={{ width: '100%', boxShadow: 3 }}>
        <Box sx={{ borderBottom: 2, borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontSize: '1rem',
                fontWeight: 600,
                minHeight: 64,
                textTransform: 'none',
                px: 3
              },
              '& .MuiTab-root.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          >
            <Tab 
              label="Workflow Progress" 
              icon={<Schedule />}
              iconPosition="start"
              sx={{ color: '#475569' }}
            />
            <Tab 
              label="Clinical Vision Results" 
              icon={<VisibilityIcon />}
              iconPosition="start"
              sx={{ color: '#475569' }}
            />
            <Tab 
              label="Additional Medical Data" 
              icon={<Assessment />}
              iconPosition="start"
              sx={{ color: '#475569' }}
            />
            <Tab 
              label="Activity Log" 
              icon={<History />}
              iconPosition="start"
              sx={{ color: '#475569' }}
            />
            <Tab 
              label="Timeline View" 
              icon={<Timeline />}
              iconPosition="start"
              sx={{ color: '#475569' }}
            />
          </Tabs>
        </Box>

        {/* Tab Content with Medical Styling */}
        <Box sx={{ p: 4, minHeight: 400, bgcolor: 'white' }}>
          {activeTab === 0 && renderWorkflowProgress()}
          {activeTab === 1 && renderVisionResults()}
          {activeTab === 2 && renderWorkflowData()}
          {activeTab === 3 && (
            <ActivityLog
              sessionId={selectedSession._id || selectedSession.session_id || ''}
              stepHistory={selectedSession.step_history || []}
              examinerName={selectedSession.examiner_name}
              examinerRole={selectedSession.examiner_role || 'medical_staff'}
              createdAt={selectedSession.created_at}
              updatedAt={selectedSession.updated_at}
              lastUpdatedBy={selectedSession.last_updated_by}
              lastUpdatedByName={selectedSession.last_updated_by_name}
              lastUpdatedByRole={selectedSession.last_updated_by_role || 'medical_staff'}
              showFilters={true}
              compact={false}
            />
          )}
          {activeTab === 4 && (
            <ScreeningTimeline
              sessionId={selectedSession._id || selectedSession.session_id || ''}
              patientName={selectedSession.patient_name}
              screeningType={selectedSession.screening_type}
              currentStep={selectedSession.current_step}
              totalSteps={selectedSession.screening_type?.toLowerCase().includes('mobile') ? 8 : 5}
              status={selectedSession.status}
              createdAt={selectedSession.created_at}
              updatedAt={selectedSession.updated_at}
              steps={(selectedSession.step_history || []).map(step => ({
                step_number: step.step_number,
                step_name: step.step_name,
                status: step.status === 'completed' ? 'completed' : step.step_number === selectedSession.current_step ? 'in_progress' : 'pending',
                staff_name: step.completed_by_name,
                staff_id: step.completed_by,
                staff_role: step.completed_by_role,
                started_at: step.started_at,
                completed_at: step.completed_at,
                notes: step.notes,
                data_quality_score: step.quality_score
              }))}
              examinerName={selectedSession.examiner_name}
              examinerRole={selectedSession.examiner_role || 'medical_staff'}
              showProgress={true}
              showDuration={true}
              showQuality={true}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Screenings;
