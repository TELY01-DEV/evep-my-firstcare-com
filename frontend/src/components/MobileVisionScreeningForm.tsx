import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Paper,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormLabel,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  AvatarGroup,
  Autocomplete,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Info,
  LocalHospital,
  School,
  Person,
  Add,
  Remove,
  Save,
  Send,
  Inventory,
  DeliveryDining,
  Assessment,
  ExpandMore,
  CreditCard,
  Search,
  FilterList,
  Schedule,
  Assignment,
  HowToReg,
  Visibility as Glasses,
  CheckCircleOutline,
  School as SchoolIcon,
  Home,
  LocalShipping,
  ArrowBack,
} from '@mui/icons-material';
import io from 'socket.io-client';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import DoctorDiagnosisForm from './DoctorDiagnosisForm';
import { API_ENDPOINTS } from '../config/api';

// Real-time Collaboration Interfaces
interface ActiveUser {
  user_id: string;
  name: string;
  role: string;
  avatar?: string;
  step: number;
  last_activity: string;
  status: 'active' | 'idle' | 'away';
}

interface PatientQueue {
  patient_id: string;
  patient_name: string;
  queue_position: number;
  current_step: number;
  estimated_completion: string;
  priority: 'normal' | 'urgent';
  staff_working: ActiveUser[];
}

interface StepStatus {
  step_number: number;
  step_name: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'blocked';
  assigned_staff?: ActiveUser[];
  estimated_duration: number;
  actual_duration?: number;
}

// Step Assignment Interface for Mobile Unit Coordination
interface StepAssignment {
  step_name: string;
  step_number: number;
  assigned_to: string;
  assigned_to_name: string;
  assigned_role: 'nurse' | 'doctor' | 'medical_staff' | 'medical_admin';
  assignment_time: string;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_approval';
  estimated_duration: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Mobile Unit Session Interface
interface MobileUnitSession {
  session_id: string;
  unit_id?: string;
  station_assignments: StepAssignment[];
  concurrent_access?: {
    locked_steps: string[];
    active_users: string[];
  };
  approval_workflow?: {
    requires_approval: boolean;
    approval_status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
  };
}


interface MobileVisionScreeningFormProps {
  existingSession?: any;
  onScreeningCompleted?: (screening: any) => void;
  onCancel?: () => void;
  mobileUnitMode?: boolean;
  unitId?: string;
}

interface Patient {
  _id: string;
  original_student_id?: string; // Original ID from EVEP Students API
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  school?: string;
  grade?: string;
  student_id?: string;
  citizen_id?: string;
  cid?: string; // Citizen ID field
  parent_consent?: boolean;
  registration_status?: 'pending' | 'registered' | 'screened';
  photos?: string[]; // Array of photo URLs/base64 strings
  screening_status?: 'pending' | 'completed' | 'follow_up_needed';
  follow_up_needed?: boolean;
  registration_date?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_name?: string;
  registration_type?: 'direct' | 'from_student' | 'walk_in';
  source_student_id?: string;
}

interface VisionResults {
  // Basic Vision Tests
  left_eye_distance: string;
  right_eye_distance: string;
  left_eye_near: string;
  right_eye_near: string;
  
  // Additional Tests
  color_vision: 'normal' | 'deficient' | 'failed';
  depth_perception: 'normal' | 'impaired' | 'failed';
  
  // Mobile Unit Specific
  glasses_needed: boolean;
  glasses_prescription?: {
    left_eye_sphere?: string;
    right_eye_sphere?: string;
    left_eye_cylinder?: string;
    right_eye_cylinder?: string;
    left_eye_axis?: string;
    right_eye_axis?: string;
    pupillary_distance?: string;
  };
  glasses_fitted: boolean;
  glasses_delivered: boolean;
  delivery_method?: 'immediate' | 'school_delivery' | 'home_delivery';
  delivery_date?: string;
  
  // Assessment
  overall_assessment: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  academic_impact: 'none' | 'mild' | 'moderate' | 'significant';
  follow_up_required: boolean;
  follow_up_type?: 're_screening' | 'specialist_referral' | 'glasses_adjustment' | 'academic_accommodation';
  follow_up_date?: string;
  
  // Notes
  screening_notes: string;
  recommendations: string;
  
  // Doctor Diagnosis
  doctor_diagnosis?: any;
}

interface Appointment {
  _id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  parent_consent: boolean;
  consent_date?: string;
}

const MobileVisionScreeningForm: React.FC<MobileVisionScreeningFormProps> = ({
  existingSession,
  onScreeningCompleted,
  onCancel,
  mobileUnitMode = false,
  unitId,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Mobile Unit specific state
  const [mobileUnitSession, setMobileUnitSession] = useState<MobileUnitSession | null>(null);
  const [currentStepAssignment, setCurrentStepAssignment] = useState<StepAssignment | null>(null);
  const [stepLocked, setStepLocked] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalPending, setApprovalPending] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Real-time Collaboration State
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [patientQueue, setPatientQueue] = useState<PatientQueue[]>([]);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [collaborationSession, setCollaborationSession] = useState<string | null>(null);
  const [currentUserPresence, setCurrentUserPresence] = useState<ActiveUser | null>(null);
  const socketRef = useRef<any>(null);
  const heartbeatRef = useRef<any>(null);
  
  // Patient selection
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schools, setSchools] = useState<Array<{id: string, name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'appointment' | 'manual' | 'prescreened' | 'notscreened'>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  
  // Citizen card reader
  const [citizenCardDialogOpen, setCitizenCardDialogOpen] = useState(false);
  const [citizenCardData, setCitizenCardData] = useState({
    citizen_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
  });
  
  // Manual patient registration
  const [manualPatientDialogOpen, setManualPatientDialogOpen] = useState(false);
  const [showStudentLookup, setShowStudentLookup] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    school: '',
    grade: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });
  
  // Patient editing
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  
  // Screening workflow
  const [parentConsent, setParentConsent] = useState(false);
  const [consentDate, setConsentDate] = useState('');
  const [screeningResults, setScreeningResults] = useState<VisionResults>({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal',
    depth_perception: 'normal',
    glasses_needed: false,
    glasses_fitted: false,
    glasses_delivered: false,
    overall_assessment: 'normal',
    academic_impact: 'none',
    follow_up_required: false,
    screening_notes: '',
    recommendations: '',
  });
  
  // Inventory and delivery
  const [inventoryChecked, setInventoryChecked] = useState(false);
  const [glassesSelected, setGlassesSelected] = useState(false);
  const [deliveryScheduled, setDeliveryScheduled] = useState(false);
  
  // Student to patient registration confirmation
  const [showRegistrationConfirmation, setShowRegistrationConfirmation] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  
  const steps = [
    'Appointment Schedule',
    'Parent Consent',
    'Student Registration',
    'VA Screening',
    'Doctor Diagnosis',
    'Glasses Selection',
    'Inventory Check',
    'School Delivery'
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchSchools();
  }, []);

  // Refetch patients when tab changes
  useEffect(() => {
    fetchPatients();
  }, [selectedTab]);

  // Load existing session data when existingSession is provided
  useEffect(() => {
    if (existingSession) {
      console.log('Loading existing session data:', existingSession);
      
      // Set current session ID
      setCurrentSessionId(existingSession.session_id || existingSession._id);
      
      // Set active step based on current_step
      if (existingSession.current_step !== undefined) {
        setActiveStep(existingSession.current_step);
      }
      
      // Restore workflow data if available
      if (existingSession.workflow_data) {
        const workflow = existingSession.workflow_data;
        
        // Restore parent consent
        if (workflow.parent_consent !== undefined) {
          setParentConsent(workflow.parent_consent);
        }
        
        // Restore consent date
        if (workflow.consent_date) {
          setConsentDate(workflow.consent_date);
        }
        
        // Restore screening results including doctor_diagnosis
        if (workflow.screening_results) {
          console.log('Restoring screening results:', workflow.screening_results);
          setScreeningResults(workflow.screening_results);
        }
        
        // Restore other workflow states
        if (workflow.inventory_checked !== undefined) {
          setInventoryChecked(workflow.inventory_checked);
        }
        
        if (workflow.glasses_selected !== undefined) {
          setGlassesSelected(workflow.glasses_selected);
        }
        
        if (workflow.delivery_scheduled !== undefined) {
          setDeliveryScheduled(workflow.delivery_scheduled);
        }
      }
      
      // Set selected patient based on session patient data
      if (existingSession.patient_id) {
        // Try to find the patient in the current patients list
        // Note: This might need to be called after fetchPatients completes
        const patientData: Patient = {
          _id: existingSession.patient_id,
          first_name: existingSession.patient_name?.split(' ')[0] || '',
          last_name: existingSession.patient_name?.split(' ').slice(1).join(' ') || '',
          date_of_birth: '', // Will be loaded from patient API later
          // Add other optional fields
          gender: '',
          school: '',
          grade: '',
          student_id: '',
          citizen_id: '',
          cid: '',
          parent_consent: true,
          registration_status: 'registered',
          photos: [],
          screening_status: 'pending',
          follow_up_needed: false,
          registration_date: existingSession.created_at || new Date().toISOString(),
          parent_phone: '',
          parent_email: '',
        };
        setSelectedPatient(patientData);
      }
      
      console.log('Existing session data loaded successfully');
    }
  }, [existingSession]);

  // Real-time Collaboration Setup
  useEffect(() => {
    if (selectedPatient && activeStep >= 3) { // Only for patient screening steps
      initializeCollaboration();
    }
    return () => {
      cleanupCollaboration();
    };
  }, [selectedPatient, activeStep]);

  const initializeCollaboration = useCallback(() => {
    if (!selectedPatient || !user) return;

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://socketio.evep.my-firstcare.com';
    const collaborationSocket = io(socketUrl, {
      transports: ['polling'], // Use polling only until WebSocket proxy is fixed
      query: {
        patient_id: selectedPatient._id,
        user_id: (user.id || user._id) as string,
        user_name: `${user.first_name} ${user.last_name}`,
        user_role: user.role,
        step: activeStep
      }
    });

    socketRef.current = collaborationSocket;
    setSocket(collaborationSocket);

    // Set up collaboration session
    const sessionId = `screening_${selectedPatient._id}`;
    setCollaborationSession(sessionId);

    // Set up current user presence
    const userPresence: ActiveUser = {
      user_id: (user.id || user._id) as string,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      step: activeStep,
      last_activity: new Date().toISOString(),
      status: 'active'
    };
    setCurrentUserPresence(userPresence);

    // Socket event listeners
    collaborationSocket.on('user_joined', (data: ActiveUser) => {
      console.log('👥 User joined collaboration:', data);
      setActiveUsers(prev => [...prev.filter(u => u.user_id !== data.user_id), data]);
    });

    collaborationSocket.on('user_left', (userId: string) => {
      console.log('👋 User left collaboration:', userId);
      setActiveUsers(prev => prev.filter(u => u.user_id !== userId));
    });

    collaborationSocket.on('step_changed', (data: { user_id: string, step: number, step_name: string }) => {
      console.log('🔄 Step changed:', data);
      setActiveUsers(prev => prev.map(u => 
        u.user_id === data.user_id ? { ...u, step: data.step } : u
      ));
    });

    collaborationSocket.on('queue_updated', (queueData: PatientQueue[]) => {
      console.log('📋 Queue updated:', queueData);
      setPatientQueue(queueData);
    });

    collaborationSocket.on('step_status_updated', (statusData: StepStatus[]) => {
      console.log('📊 Step status updated:', statusData);
      setStepStatuses(statusData);
    });

    // Join collaboration room
    collaborationSocket.emit('join_screening', {
      patient_id: selectedPatient._id,
      user: userPresence,
      session_id: sessionId
    });

    // Set up heartbeat
    heartbeatRef.current = setInterval(() => {
      collaborationSocket.emit('user_heartbeat', {
        user_id: (user.id || user._id) as string,
        step: activeStep,
        last_activity: new Date().toISOString()
      });
    }, 30000); // Every 30 seconds

    console.log('🚀 Real-time collaboration initialized');
  }, [selectedPatient, user, activeStep]);

  const cleanupCollaboration = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    setActiveUsers([]);
    setCollaborationSession(null);
    setCurrentUserPresence(null);
    
    console.log('🛑 Collaboration cleaned up');
  }, []);

  // Notify step change to other users
  const notifyStepChange = useCallback((newStep: number) => {
    if (socketRef.current && currentUserPresence) {
      socketRef.current.emit('step_change', {
        user_id: currentUserPresence.user_id,
        step: newStep,
        step_name: steps[newStep],
        patient_id: selectedPatient?._id
      });
    }
  }, [currentUserPresence, selectedPatient, steps]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Fetch all students for both tabs (to show all available students)
      const response = await fetch(API_ENDPOINTS.EVEP_STUDENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const studentList = data.students || data.patients || [];
        
        // Transform EVEP students API response to match Patient interface
        const transformedStudents = studentList.map((student: any) => ({
          _id: student.id || student._id,
          original_student_id: student.id || student._id, // Preserve original ID for backend
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          date_of_birth: student.birth_date || student.date_of_birth || '',
          school: student.school_name || student.school || '',
          grade: student.grade_level || student.grade || '',
          student_id: student.student_code || student.student_id || '',
          citizen_id: student.cid || student.citizen_id || '',
          cid: student.cid || student.citizen_id || '', // Map CID to both fields for compatibility
          parent_consent: student.consent_document || student.parent_consent || false,
          registration_status: student.registration_status || student.status || 'pending',
          photos: student.profile_photo ? [student.profile_photo, ...(student.extra_photos || [])] : (student.photos || []),
          screening_status: student.screening_status || 'pending',
          follow_up_needed: student.follow_up_needed || false,
          registration_date: student.registration_date || '',
          parent_phone: student.parent_phone || '',
          parent_email: student.parent_email || '',
          gender: student.gender || ''
        }));
        
        // Debug CID mapping for troubleshooting
        console.log('🔍 Student data transformation debug:', {
          totalStudents: studentList.length,
          sampleStudent: studentList[0] ? {
            name: `${studentList[0].first_name} ${studentList[0].last_name}`,
            originalCid: studentList[0].cid,
            originalCitizenId: studentList[0].citizen_id,
            transformedCid: transformedStudents[0]?.cid,
            transformedCitizenId: transformedStudents[0]?.citizen_id
          } : 'No students found'
        });
        
        // For School Screening Students tab, prioritize students with screening status
        if (selectedTab === 0) {
          // Sort students: screened/completed first, then others
          const sortedStudents = [...transformedStudents].sort((a, b) => {
            const aHasScreening = a.screening_status === 'completed' || a.registration_status === 'screened';
            const bHasScreening = b.screening_status === 'completed' || b.registration_status === 'screened';
            if (aHasScreening && !bHasScreening) return -1;
            if (!aHasScreening && bHasScreening) return 1;
            return 0;
          });
          setPatients(sortedStudents);
        } else {
          setPatients(transformedStudents);
        }
      } else {
        console.error('Failed to fetch students from API');
        setPatients([]);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to fetch patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch(API_ENDPOINTS.APPOINTMENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else {
        console.error('Failed to fetch appointments from API');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to fetch appointments');
      setAppointments([]);
    }
  };

  const handleCitizenCardRead = () => {
    // Simulate citizen card reading
    setCitizenCardData({
      citizen_id: '1234567890123',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '2015-03-15',
    });
    setCitizenCardDialogOpen(true);
  };

  const handleManualPatientAdd = () => {
    setManualPatientDialogOpen(true);
  };

  // Mobile Unit specific functions - disabled as endpoints don't exist in current backend
  const checkStepAssignment = async (stepNumber: number, stepName: string) => {
    // Mobile unit endpoints not implemented in backend - return true to allow normal operation
    console.log(`Step assignment check disabled - would check step ${stepNumber}: ${stepName}`);
    return true;
  };

  const lockStep = async (stepNumber: number) => {
    // Mobile unit lock endpoints not implemented - disabled
    console.log(`Step locking disabled - would lock step ${stepNumber}`);
    return;
  };

  const unlockStep = async (stepNumber: number) => {
    // Mobile unit unlock endpoints not implemented - disabled
    console.log(`Step unlocking disabled - would unlock step ${stepNumber}`);
    return;
  };

  const requestApproval = async () => {
    // Mobile unit approval endpoints not implemented - disabled
    console.log('Approval request disabled - mobile unit approval endpoints not available');
    setNotifications(prev => [...prev, 'Approval system not implemented yet']);
    return;
  };

  const checkApprovalStatus = async () => {
    // Mobile unit approval endpoints not implemented - disabled
    console.log('Approval status check disabled - mobile unit approval endpoints not available');
    return;
  };

  // Enhanced step navigation for mobile unit
  const handleStepChange = async (newStep: number) => {
    if (mobileUnitMode) {
      const canProceed = await checkStepAssignment(newStep, steps[newStep]);
      if (!canProceed) {
        setError(`Step ${newStep + 1}: ${steps[newStep]} is not assigned to you or is locked by another user`);
        return;
      }
      
      // Lock the current step
      await lockStep(newStep);
    }

    // Unlock previous step
    if (mobileUnitMode && activeStep !== newStep) {
      await unlockStep(activeStep);
    }

    setActiveStep(newStep);
    setError(null);
  };

  const handlePatientSelect = async (patient: Patient) => {
    // Just select the patient/student, don't register yet
    // Registration will happen in step 3 when user clicks "Register as Patient" button
    console.log('🔍 Patient selected for registration:', {
      name: `${patient.first_name} ${patient.last_name}`,
      cid: patient.cid,
      citizen_id: patient.citizen_id,
      student_id: patient.student_id,
      school: patient.school,
      grade: patient.grade
    });
    
    setSelectedPatient(patient);
    
    setActiveStep(1); // Move to Parent Consent step
  };

  // Function to register student as patient
  const registerStudentAsPatient = async () => {
    if (!selectedPatient) return false;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('evep_token');
      
      const studentIdForBackend = selectedPatient.original_student_id || selectedPatient._id;
      
      console.log('Checking if patient exists for student ID:', studentIdForBackend);
      
      // First, check if a patient already exists
      const checkResponse = await fetch(`${API_ENDPOINTS.PATIENTS}?student_id=${studentIdForBackend}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (checkResponse.ok) {
        const existingPatients = await checkResponse.json();
        
        if (existingPatients && existingPatients.length > 0) {
          console.log('Found existing patient for student, using it');
          const existingPatient = existingPatients[0];
          setSelectedPatient({
            ...existingPatient,
            registration_type: 'from_student',
            original_student_id: studentIdForBackend
          });
          setSuccess('Patient already registered, loaded existing record');
          return true;
        }
      }
      
      console.log('Registering new patient for student ID:', studentIdForBackend);
      
      const patientData = {
        first_name: selectedPatient.first_name || '',
        last_name: selectedPatient.last_name || '',
        cid: selectedPatient.cid || selectedPatient.citizen_id || '',
        date_of_birth: selectedPatient.date_of_birth || '',
        gender: selectedPatient.gender || 'male',
        parent_email: selectedPatient.parent_email || 'noemail@example.com',
        parent_phone: selectedPatient.parent_phone || '0000000000',
        emergency_contact: selectedPatient.parent_name || 'ไม่ระบุ',
        emergency_phone: selectedPatient.parent_phone || '0000000000',
        address: '',
        school: selectedPatient.school || '',
        grade: selectedPatient.grade || '',
        medical_history: {},
        family_vision_history: {},
        insurance_info: {},
        consent_forms: {},
        registration_type: 'from_student',
        source_student_id: studentIdForBackend
      };
      
      const response = await fetch(`${API_ENDPOINTS.PATIENTS}/from-student/${studentIdForBackend}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to register student as patient');
      }

      const registeredPatient = await response.json();
      setSelectedPatient(registeredPatient);
      setSuccess('Student successfully registered as patient!');
      return true;
    } catch (err) {
      console.error('Error registering student as patient:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Step 2 → Step 3: Show confirmation for student to patient registration
    if (activeStep === 2 && selectedPatient && !selectedPatient.registration_status) {
      setShowRegistrationConfirmation(true);
      return;
    }
    
    if (activeStep < steps.length - 1) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);
      
      // Notify collaboration of step change
      notifyStepChange(newStep);
    }
  };
  
  const handleConfirmRegistration = async () => {
    try {
      setPendingRegistration(true);
      setError(null);
      
      // Register student as patient
      const registered = await registerStudentAsPatient();
      
      if (registered) {
        // Close confirmation dialog and proceed to next step
        setShowRegistrationConfirmation(false);
        const newStep = activeStep + 1;
        setActiveStep(newStep);
        
        // Notify collaboration of step change
        notifyStepChange(newStep);
        
        // Show success toast
        setSuccess('Student successfully registered as patient in the screening system!');
        setTimeout(() => setSuccess(null), 5000);
      }
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Failed to register student as patient. Please try again.');
    } finally {
      setPendingRegistration(false);
    }
  };

  const handleRegisterAndClose = async () => {
    const registered = await registerStudentAsPatient();
    if (registered) {
      // Reset form and go back to patient selection
      setSelectedPatient(null);
      setActiveStep(0);
      setSuccess('Patient registered successfully! Ready for screening when needed.');
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      const newStep = activeStep - 1;
      setActiveStep(newStep);
      
      // Notify collaboration of step change
      notifyStepChange(newStep);
    }
  };

  // Helper function to retry failed requests
  const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${retries} for ${options.method} ${url}`);
        const response = await fetch(url, options);
        return response; // Return response regardless of status for normal handling
      } catch (error) {
        console.error(`Network error on attempt ${i + 1}:`, error);
        
        if (i === retries - 1) {
          throw error; // Throw on last attempt
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('All retry attempts failed');
  };

  const handleSaveStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('evep_token');
      
      // First, fetch the current student data
      console.log('🔍 Fetching current student data...');
      const studentId = selectedPatient?.student_id || selectedPatient?._id;
      const fetchResponse = await fetch(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch student data');
      }

      const currentStudentData = await fetchResponse.json();
      console.log('📋 Current student data:', currentStudentData);

      // Use editedPatient data if available (user has made edits), otherwise use selectedPatient
      const patientData = editedPatient || selectedPatient;

      // Update with consent information AND any edited patient data
      const updatedStudentData = {
        ...currentStudentData,
        // Patient information updates (if edited)
        ...(patientData && {
          first_name: patientData.first_name,
          last_name: patientData.last_name,
          date_of_birth: patientData.date_of_birth,
          school: patientData.school,
          grade: patientData.grade,
          student_id: patientData.student_id,
          cid: patientData.cid || patientData.citizen_id,
          citizen_id: patientData.cid || patientData.citizen_id, // Map cid to citizen_id for backend
        }),
        // Consent information
        consent_document: true,
        parent_consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 Updating student data with consent and patient info:', {
        consent_document: updatedStudentData.consent_document,
        parent_consent_date: updatedStudentData.parent_consent_date,
        cid: updatedStudentData.cid,
        citizen_id: updatedStudentData.citizen_id,
        first_name: updatedStudentData.first_name,
        last_name: updatedStudentData.last_name
      });

      const updateResponse = await fetch(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStudentData),
      });

      if (updateResponse.ok) {
        const savedData = await updateResponse.json();
        console.log('✅ Student data updated successfully:', savedData);
        
        // Update local state with saved data
        setSelectedPatient(prev => prev ? ({ 
          ...prev, 
          ...patientData, // Apply any patient edits
          consent_document: true,
          parent_consent_date: updatedStudentData.parent_consent_date
        }) : null);
        
        // Clear editing state if we were editing
        if (editedPatient) {
          setEditedPatient(null);
          setIsEditingPatient(false);
        }
        
        setSuccess(`Student data and parent consent saved successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await updateResponse.json();
        console.error('❌ Failed to update student data:', errorData);
        setError('Failed to save parent consent information');
      }
      
    } catch (err) {
      console.error('Error saving student data:', err);
      setError('Failed to save parent consent information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    // Check user authentication first
    console.log('🔍 User object debug:', {
      user: user,
      userKeys: user ? Object.keys(user) : 'user is null',
      userId: user?.user_id,
      id: user?.id,
      _id: user?._id
    });
    
    if (!user?.user_id && !user?.id && !user?._id) {
      console.log('❌ User not authenticated - no valid ID found');
      setError('Please log in to save screening data');
      return;
    }
    
    // Use the available ID field
    const userId = user?.user_id || user?.id || user?._id;
    
    // Check step and determine save strategy
    console.log('🔍 Save progress validation:', {
      activeStep: activeStep,
      stepName: steps[activeStep],
      hasRegistrationStatus: !!selectedPatient.registration_status,
      patientId: selectedPatient._id,
      isValidObjectId: selectedPatient._id?.match(/^[0-9a-fA-F]{24}$/),
      shouldSaveToStudent: activeStep === 1 || activeStep === 2, // Step 2 & 3: Save to student
      shouldSaveToPatient: activeStep > 2 // Step 4+: Patient screening
    });
    
    // Step 2 (Parent Consent) & Step 3 (Student Registration): Save to student data
    if (activeStep === 1 || activeStep === 2) {
      await handleSaveStudentData();
      return;
    }
    
    // Step 4+ (Patient Screening): Require patient registration
    if (!selectedPatient.registration_status || !selectedPatient._id?.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Patient registration required for this step');
      setError('Please register the student as a patient first before saving screening progress');
      return;
    }
    
    console.log('✅ Patient validation passed - proceeding with session creation');

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('evep_token');
      
      // Use the actual Mobile Screening API data structure based on backend
      const sessionData = {
        patient_id: selectedPatient._id,
        examiner_id: userId,
        school_name: selectedPatient.school || 'Mobile Unit',
        session_date: new Date().toISOString(),
        equipment_calibration: {
          auto_refractor_model: 'Spot Vision Screener',
          calibration_date: new Date().toISOString(),
          calibration_status: 'passed',
          examiner_id: userId
        }
      };

      console.log('📤 Session data being sent:', sessionData);

      // Use the correct Mobile Screening API endpoint that exists
      const url = currentSessionId 
        ? `${API_ENDPOINTS.MOBILE_SCREENING_SESSIONS}/${currentSessionId}`
        : API_ENDPOINTS.MOBILE_SCREENING_SESSIONS;
      
      const method = currentSessionId ? 'PUT' : 'POST';

      const response = await fetchWithRetry(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const data = await response.json();
        if (!currentSessionId && (data.session_id || data.session?.session_id)) {
          setCurrentSessionId(data.session_id || data.session.session_id);
        }
        setSuccess(`Mobile Screening progress saved at: ${steps[activeStep]}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // Ensure error is always a string for React rendering
        let errorMessage = 'Failed to save progress';
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData?.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        }
        
        setError(errorMessage);
      }
      
    } catch (err) {
      console.error('Failed to save progress:', err);
      
      let errorMessage = 'Failed to save progress';
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        errorMessage = 'Network connection issue. Your diagnosis data has been saved locally. Please check your internet connection and try again.';
      } else if (err instanceof Error && err.message === 'All retry attempts failed') {
        errorMessage = 'Unable to save after multiple attempts. Your data is backed up locally. Please try again when your connection is stable.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePatientEdit = async () => {
    if (!editedPatient) {
      setError('No patient data to save');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('evep_token');
      
      // Get the student ID for the backend API call
      const studentId = selectedPatient?.student_id || selectedPatient?._id;
      
      if (!studentId) {
        setError('No student ID found to update');
        return;
      }
      
      console.log('🔍 Saving patient edit data to backend...');
      console.log('📤 Updated patient data:', {
        cid: editedPatient.cid,
        citizen_id: editedPatient.cid, // Map cid to citizen_id for backend
        first_name: editedPatient.first_name,
        last_name: editedPatient.last_name,
        date_of_birth: editedPatient.date_of_birth,
        school: editedPatient.school,
        grade: editedPatient.grade,
        student_id: editedPatient.student_id
      });

      // Prepare the data for the backend - include both cid and citizen_id for compatibility
      const updateData = {
        first_name: editedPatient.first_name,
        last_name: editedPatient.last_name,
        date_of_birth: editedPatient.date_of_birth,
        school: editedPatient.school,
        grade: editedPatient.grade,
        student_id: editedPatient.student_id,
        cid: editedPatient.cid || editedPatient.citizen_id,
        citizen_id: editedPatient.cid || editedPatient.citizen_id, // Backend may expect citizen_id
        updated_at: new Date().toISOString()
      };

      const updateResponse = await fetch(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        const updatedStudent = await updateResponse.json();
        console.log('✅ Patient data saved successfully:', updatedStudent);
        
        // Update local state with the saved data
        setSelectedPatient(editedPatient);
        setIsEditingPatient(false);
        setSuccess('Patient information updated and saved to database');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await updateResponse.json();
        console.error('❌ Failed to save patient data:', errorData);
        
        let errorMessage = 'Failed to save patient information';
        if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData?.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        }
        
        setError(errorMessage);
      }
      
    } catch (err) {
      console.error('Error saving patient data:', err);
      setError('Failed to save patient information to database');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPatientEdit = () => {
    setEditedPatient(null);
    setIsEditingPatient(false);
  };

  const handleScreeningComplete = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    // Check user authentication first
    console.log('🔍 User object debug (completion):', {
      user: user,
      userKeys: user ? Object.keys(user) : 'user is null',
      userId: user?.user_id,
      id: user?.id,
      _id: user?._id
    });
    
    if (!user?.user_id && !user?.id && !user?._id) {
      console.log('❌ User not authenticated for screening completion - no valid ID found');
      setError('Please log in to complete screening');
      return;
    }
    
    // Use the available ID field
    const userId = user?.user_id || user?.id || user?._id;

    // Check if the student has been registered as a patient yet
    console.log('🔍 Screening completion validation check:', {
      hasRegistrationStatus: !!selectedPatient.registration_status,
      patientId: selectedPatient._id,
      isValidObjectId: selectedPatient._id?.match(/^[0-9a-fA-F]{24}$/)
    });
    
    if (!selectedPatient.registration_status || !selectedPatient._id?.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Screening completion validation failed - preventing session creation');
      setError('Please register the student as a patient first before completing screening');
      return;
    }
    
    console.log('✅ Screening completion validation passed - proceeding with session creation');

    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Use Mobile Screening API for completion
      const screeningData = {
        patient_id: selectedPatient?._id,
        examiner_id: userId,
        school_name: selectedPatient?.school || 'Mobile Unit',
        session_date: new Date().toISOString(),
        equipment_calibration: {
          auto_refractor_model: 'Spot Vision Screener',
          calibration_date: new Date().toISOString(),
          calibration_status: 'passed',
          examiner_id: userId
        }
      };

      const url = currentSessionId 
        ? `${API_ENDPOINTS.MOBILE_SCREENING_SESSIONS}/${currentSessionId}`
        : API_ENDPOINTS.MOBILE_SCREENING_SESSIONS;
      
      const method = currentSessionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screeningData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Mobile vision screening completed successfully!');
        onScreeningCompleted?.(data);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ Screening Completion API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // Ensure error is always a string for React rendering
        let errorMessage = 'Failed to complete screening';
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData?.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        }
        
        setError(errorMessage);
      }
      
    } catch (err) {
      console.error('Failed to complete screening:', err);
      setError('Failed to complete screening');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      const response = await fetch(API_ENDPOINTS.EVEP_SCHOOLS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const schoolList = (data.schools || []).map((school: any) => ({
          id: school.id,
          name: school.name
        }));
        setSchools(schoolList);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = `${patient.first_name} ${patient.last_name} ${patient.student_id || ''} ${patient.citizen_id || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'prescreened' && patient.screening_status === 'completed') ||
      (filterType === 'notscreened' && patient.screening_status !== 'completed') ||
      (filterType === 'school' && patient.school) ||
      (filterType === 'appointment' && appointments.some(apt => apt.patient_id === patient._id)) ||
      (filterType === 'manual' && !patient.school);
    
    const matchesSchool = filterSchool === 'all' || patient.school === filterSchool;
    
    return matchesSearch && matchesFilter && matchesSchool;
  });

  const renderPatientSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('mobile_screening.select_patient')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {selectedTab === 0 
          ? t('mobile_screening.description_school')
          : t('mobile_screening.description_walkin')
        }
      </Typography>

      {/* Quick Start Option */}
      <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" color="primary">
                {t('mobile_screening.start_without_patient')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('mobile_screening.start_without_patient_desc')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Assessment />}
              onClick={() => {
                setSelectedPatient(null);
                setActiveStep(1); // Move to Parent Consent step
              }}
            >
              {t('mobile_screening.start_workflow')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Patient Selection Tabs */}
      <Tabs value={selectedTab} onChange={(e, newValue) => {
        setSelectedTab(newValue);
        setShowStudentLookup(false);
        setStudentSearchTerm('');
      }} sx={{ mb: 3 }}>
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold">{t('mobile_screening.school_students')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('mobile_screening.school_students_desc')}
                </Typography>
              </Box>
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold">{t('mobile_screening.walkin_patient')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('mobile_screening.walkin_patient_desc')}
                </Typography>
              </Box>
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold">{t('mobile_screening.citizen_card')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('mobile_screening.citizen_card_desc')}
                </Typography>
              </Box>
            </Box>
          } 
        />
      </Tabs>

      {/* Manual Registration: Toggle between Student Lookup and New Patient Form */}
      {selectedTab === 1 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>{t('mobile_screening.two_ways_title')}</strong>
          </Typography>
          <Typography variant="body2" component="div">
            1. {t('mobile_screening.two_ways_new')}
            <br />
            2. {t('mobile_screening.two_ways_existing')}
          </Typography>
        </Alert>
      )}
      
      {selectedTab === 1 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={!showStudentLookup ? 'contained' : 'outlined'}
            startIcon={<Person />}
            onClick={() => setShowStudentLookup(false)}
          >
            {t('mobile_screening.create_new_patient')}
          </Button>
          <Button
            variant={showStudentLookup ? 'contained' : 'outlined'}
            startIcon={<School />}
            onClick={() => setShowStudentLookup(true)}
          >
            {t('mobile_screening.use_existing_student')}
          </Button>
        </Box>
      )}

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={selectedTab === 1 && showStudentLookup ? t('mobile_screening.search_students') : t('mobile_screening.search_patients')}
              value={selectedTab === 1 && showStudentLookup ? studentSearchTerm : searchTerm}
              onChange={(e) => {
                if (selectedTab === 1 && showStudentLookup) {
                  setStudentSearchTerm(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('mobile_screening.filter_by_type')}</InputLabel>
              <Select
                value={filterType}
                label={t('mobile_screening.filter_by_type')}
                onChange={(e) => setFilterType(e.target.value as any)}
                startAdornment={<FilterList sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">{t('mobile_screening.all_students')}</MenuItem>
                <MenuItem value="prescreened">{t('mobile_screening.path2_prescreened')}</MenuItem>
                <MenuItem value="notscreened">{t('mobile_screening.path1_notscreened')}</MenuItem>
                <MenuItem value="school">{t('mobile_screening.school_students_filter')}</MenuItem>
                <MenuItem value="manual">{t('mobile_screening.walkin_patients_filter')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              fullWidth
              options={[{ id: 'all', name: t('mobile_screening.all_schools') }, ...schools]}
              getOptionLabel={(option) => option.name}
              value={schools.find(s => s.name === filterSchool) || { id: 'all', name: t('mobile_screening.all_schools') }}
              onChange={(event, newValue) => {
                const allSchoolsText = t('mobile_screening.all_schools');
                setFilterSchool(newValue ? newValue.name === allSchoolsText ? 'all' : newValue.name : 'all');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('mobile_screening.filter_by_school')}
                  placeholder={t('mobile_screening.search_or_select_school')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SchoolIcon sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Show Manual Patient Form for Manual Registration tab when not in lookup mode */}
      {selectedTab === 1 && !showStudentLookup && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ➕ {t('mobile_screening.create_new_walkin')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('mobile_screening.registration_path2_desc')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('mobile_screening.first_name')}
                  value={newPatient.first_name}
                  onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('mobile_screening.last_name')}
                  value={newPatient.last_name}
                  onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('mobile_screening.date_of_birth')}
                  type="date"
                  value={newPatient.date_of_birth}
                  onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('mobile_screening.school')}
                  value={newPatient.school}
                  onChange={(e) => setNewPatient({ ...newPatient, school: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('mobile_screening.grade')}
                  value={newPatient.grade}
                  onChange={(e) => setNewPatient({ ...newPatient, grade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('mobile_screening.parent_name')}
                  value={newPatient.parent_name}
                  onChange={(e) => setNewPatient({ ...newPatient, parent_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parent Phone"
                  value={newPatient.parent_phone}
                  onChange={(e) => setNewPatient({ ...newPatient, parent_phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parent Email"
                  type="email"
                  value={newPatient.parent_email}
                  onChange={(e) => setNewPatient({ ...newPatient, parent_email: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<HowToReg />}
                disabled={!newPatient.first_name || !newPatient.last_name || !newPatient.date_of_birth}
                onClick={() => {
                  const tempPatient: Patient = {
                    _id: `temp_${Date.now()}`,
                    first_name: newPatient.first_name,
                    last_name: newPatient.last_name,
                    date_of_birth: newPatient.date_of_birth,
                    school: newPatient.school,
                    grade: newPatient.grade,
                    parent_phone: newPatient.parent_phone,
                    parent_email: newPatient.parent_email,
                    registration_status: 'registered'
                  };
                  setSelectedPatient(tempPatient);
                  setActiveStep(1);
                }}
              >
                Create Patient & Start Screening
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Patient List - Show for School Students tab or Manual Registration in lookup mode */}
      {(selectedTab === 0 || (selectedTab === 1 && showStudentLookup)) && (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedTab === 0 ? '📚 Students Registered by Teachers' : '🔄 Convert Student to Patient'}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">
              {selectedTab === 0 ? (
                <>
                  <strong>How students become patients:</strong>
                  <br />
                  <strong>Path 1:</strong> Staff/doctor directly picks student from this list (Steps 1-3) → Student becomes patient
                  <br />
                  <strong>Path 2:</strong> Teacher conducts school screening first → Student marked as "screened" → Staff/doctor picks from screened students
                </>
              ) : (
                <>
                  <strong>Walk-in patient using existing student record:</strong>
                  <br />
                  Select a student registered by a teacher to convert them to a patient for today's screening.
                </>
              )}
            </Typography>
          </Alert>
          <List>
            {(selectedTab === 1 && showStudentLookup 
              ? patients.filter(p => 
                  (p.first_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                   p.last_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                   p.student_id?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                )
              : filteredPatients
            ).map((patient) => (
              <ListItem
                key={patient._id}
                button
                onClick={() => handlePatientSelect(patient)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${patient.first_name} ${patient.last_name}`}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                        {patient.school && ` • School: ${patient.school}`}
                        {patient.grade && ` • Grade: ${patient.grade}`}
                        {patient.student_id && ` • Student ID: ${patient.student_id}`}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {patient.school && (
                          <Chip
                            icon={<School />}
                            label="School Student"
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {selectedTab === 0 && (
                          <Chip
                            icon={<Assessment />}
                            label="Needs Medical Screening"
                            size="small"
                            color="warning"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {patient.parent_consent && (
                          <Chip
                            icon={<Assignment />}
                            label="Consent Given"
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {patient.registration_status && (
                          <Chip
                            icon={<HowToReg />}
                            label={patient.registration_status}
                            size="small"
                            color={patient.registration_status === 'screened' ? 'success' : 'warning'}
                          />
                        )}
                        {patient.screening_status === 'completed' && (
                          <Chip
                            label="Pre-screened by Teacher (Path 2)"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {patient.screening_status !== 'completed' && selectedTab === 0 && (
                          <Chip
                            label="Ready for Direct Screening (Path 1)"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                        {patient.registration_type === 'from_student' && (
                          <Chip
                            icon={<SchoolIcon />}
                            label="From Student Record"
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {patient.registration_type === 'direct' && (
                          <Chip
                            icon={<Person />}
                            label="Direct Registration"
                            size="small"
                            color="info"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {patient.registration_type === 'walk_in' && (
                          <Chip
                            icon={<Home />}
                            label="Walk-in Patient"
                            size="small"
                            color="warning"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePatientSelect(patient);
                    }}
                  >
                    {patient.screening_status === 'completed' ? 'Medical Screening' : 'Start Screening'}
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      )}

      {/* Action Buttons - Only show for Citizen Card tab */}
      {selectedTab === 2 && (
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CreditCard />}
          onClick={handleCitizenCardRead}
        >
          Read Citizen Card
        </Button>
      </Box>
      )}
    </Box>
  );

  const renderPatientProfile = () => {
    if (!selectedPatient) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">No Patient Selected</Typography>
          <Typography variant="body2">
            Patient information will be added in the Student Registration step.
          </Typography>
        </Alert>
      );
    }

    const calculateAge = (birthDate: string) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} />
              Patient Profile
            </Typography>
            <Chip 
              label="Mobile Unit Patient" 
              color="primary" 
              size="small" 
              variant="filled"
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}
                  src={selectedPatient.photos && selectedPatient.photos.length > 0 ? selectedPatient.photos[0] : undefined}
                >
                  <Typography variant="h6">
                    {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID: {selectedPatient._id}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {calculateAge(selectedPatient.date_of_birth)} years
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Student ID</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.student_id || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">School</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.school || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Grade Level</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.grade || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Citizen ID</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.citizen_id || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.registration_status || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderWorkflowStep = () => {
    switch (activeStep) {
      case 0:
        return renderPatientSelection();
      
      case 1: // Parent Consent
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Parent Consent
            </Typography>
            
            {/* Patient Information - Editable */}
            {selectedPatient && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Patient Information
                    </Typography>
                    {!isEditingPatient ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditedPatient({...selectedPatient});
                          setIsEditingPatient(true);
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleCancelPatientEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleSavePatientEdit}
                        >
                          Save
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  {(!selectedPatient.date_of_birth || !selectedPatient.school || !selectedPatient.grade) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Missing Patient Information:</strong> Please edit and add the missing data before proceeding.
                        {!selectedPatient.date_of_birth && ' • Date of Birth'}
                        {!selectedPatient.school && ' • School'}
                        {!selectedPatient.grade && ' • Grade'}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={isEditingPatient ? (editedPatient?.first_name || '') : (selectedPatient.first_name || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, first_name: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.first_name}
                        helperText={!selectedPatient.first_name && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={isEditingPatient ? (editedPatient?.last_name || '') : (selectedPatient.last_name || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, last_name: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.last_name}
                        helperText={!selectedPatient.last_name && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={isEditingPatient ? (editedPatient?.date_of_birth || '') : (selectedPatient.date_of_birth || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, date_of_birth: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        InputLabelProps={{ shrink: true }}
                        error={!selectedPatient.date_of_birth}
                        helperText={!selectedPatient.date_of_birth && !isEditingPatient ? 'Missing date of birth - please add' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Citizen ID (CID)"
                        value={isEditingPatient ? (editedPatient?.cid || '') : (selectedPatient.cid || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, cid: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        inputProps={{ maxLength: 13 }}
                        placeholder="0000000000000"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {isEditingPatient ? (
                        <Autocomplete
                          fullWidth
                          options={schools}
                          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                          value={schools.find(s => s.name === editedPatient?.school) || editedPatient?.school || null}
                          onChange={(event, newValue) => {
                            setEditedPatient({
                              ...editedPatient!,
                              school: typeof newValue === 'string' ? newValue : (newValue?.name || '')
                            });
                          }}
                          freeSolo
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="School"
                              error={!selectedPatient.school}
                              helperText={!selectedPatient.school ? 'Please select or enter school' : ''}
                            />
                          )}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label="School"
                          value={selectedPatient.school || ''}
                          disabled
                          variant="filled"
                          error={!selectedPatient.school}
                          helperText={!selectedPatient.school ? 'Missing data' : ''}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Grade"
                        value={isEditingPatient ? (editedPatient?.grade || '') : (selectedPatient.grade || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, grade: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.grade}
                        helperText={!selectedPatient.grade && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            {/* Consent Section */}
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                    />
                  }
                  label="Parent consent has been obtained"
                />
                {parentConsent && (
                  <TextField
                    fullWidth
                    label="Consent Date"
                    type="date"
                    value={consentDate}
                    onChange={(e) => setConsentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>
        );
      
      case 2: // Student Registration
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Student Registration
            </Typography>
            
            {/* Patient Information - Editable */}
            {selectedPatient ? (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Patient Information
                    </Typography>
                    {!isEditingPatient ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditedPatient({...selectedPatient});
                          setIsEditingPatient(true);
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleCancelPatientEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleSavePatientEdit}
                        >
                          Save
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  {(!selectedPatient.date_of_birth || !selectedPatient.school || !selectedPatient.grade) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Missing Patient Information:</strong> Please edit and add the missing data before proceeding.
                        {!selectedPatient.date_of_birth && ' • Date of Birth'}
                        {!selectedPatient.school && ' • School'}
                        {!selectedPatient.grade && ' • Grade'}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={isEditingPatient ? (editedPatient?.first_name || '') : (selectedPatient.first_name || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, first_name: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.first_name}
                        helperText={!selectedPatient.first_name && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={isEditingPatient ? (editedPatient?.last_name || '') : (selectedPatient.last_name || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, last_name: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.last_name}
                        helperText={!selectedPatient.last_name && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={isEditingPatient ? (editedPatient?.date_of_birth || '') : (selectedPatient.date_of_birth || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, date_of_birth: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        InputLabelProps={{ shrink: true }}
                        error={!selectedPatient.date_of_birth}
                        helperText={!selectedPatient.date_of_birth && !isEditingPatient ? 'Missing date of birth - please add' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Citizen ID (CID)"
                        value={isEditingPatient ? (editedPatient?.cid || '') : (selectedPatient.cid || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, cid: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        inputProps={{ maxLength: 13 }}
                        placeholder="0000000000000"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {isEditingPatient ? (
                        <Autocomplete
                          fullWidth
                          options={schools}
                          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                          value={schools.find(s => s.name === editedPatient?.school) || editedPatient?.school || null}
                          onChange={(event, newValue) => {
                            setEditedPatient({
                              ...editedPatient!,
                              school: typeof newValue === 'string' ? newValue : (newValue?.name || '')
                            });
                          }}
                          freeSolo
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="School"
                              error={!selectedPatient.school}
                              helperText={!selectedPatient.school ? 'Please select or enter school' : ''}
                            />
                          )}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label="School"
                          value={selectedPatient.school || ''}
                          disabled
                          variant="filled"
                          error={!selectedPatient.school}
                          helperText={!selectedPatient.school ? 'Missing data' : ''}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Grade"
                        value={isEditingPatient ? (editedPatient?.grade || '') : (selectedPatient.grade || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, grade: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                        error={!selectedPatient.grade}
                        helperText={!selectedPatient.grade && !isEditingPatient ? 'Missing data' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Student ID"
                        value={isEditingPatient ? (editedPatient?.student_id || '') : (selectedPatient.student_id || '')}
                        onChange={(e) => setEditedPatient({...editedPatient!, student_id: e.target.value})}
                        disabled={!isEditingPatient}
                        variant={isEditingPatient ? 'outlined' : 'filled'}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    {selectedPatient.registration_status ? (
                      <Alert severity="success">
                        <Typography variant="body2">
                          Registration status: <strong>{selectedPatient.registration_status || 'Registered'}</strong>
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>Ready to register:</strong> Click "Register & Next" to continue with screening, or "Register & Close" to save for later.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No patient selected. Please add patient information to continue.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={newPatient.first_name}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          first_name: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={newPatient.last_name}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          last_name: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={newPatient.date_of_birth}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          date_of_birth: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="School"
                        value={newPatient.school}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          school: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Grade"
                        value={newPatient.grade}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          grade: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Parent Name"
                        value={newPatient.parent_name}
                        onChange={(e) => setNewPatient({
                          ...newPatient,
                          parent_name: e.target.value
                        })}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    startIcon={<HowToReg />}
                    sx={{ mt: 2 }}
                    onClick={() => {
                      // Create a temporary patient object
                      const tempPatient: Patient = {
                        _id: `temp_${Date.now()}`,
                        first_name: newPatient.first_name,
                        last_name: newPatient.last_name,
                        date_of_birth: newPatient.date_of_birth,
                        school: newPatient.school,
                        grade: newPatient.grade,
                        registration_status: 'registered'
                      };
                      setSelectedPatient(tempPatient);
                    }}
                  >
                    Register Patient
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      
      case 3: // VA Screening
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Visual Acuity Screening
            </Typography>
            {renderPatientProfile()}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Distance Vision
                    </Typography>
                    <TextField
                      fullWidth
                      label="Left Eye"
                      value={screeningResults.left_eye_distance}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        left_eye_distance: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Right Eye"
                      value={screeningResults.right_eye_distance}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        right_eye_distance: e.target.value
                      })}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Near Vision
                    </Typography>
                    <TextField
                      fullWidth
                      label="Left Eye"
                      value={screeningResults.left_eye_near}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        left_eye_near: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Right Eye"
                      value={screeningResults.right_eye_near}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        right_eye_near: e.target.value
                      })}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 4: // Doctor Diagnosis
        return (
          <DoctorDiagnosisForm
            patient={selectedPatient}
            onComplete={(diagnosis) => {
              console.log('Doctor Diagnosis completed:', diagnosis);
              
              // Store diagnosis data
              setScreeningResults({
                ...screeningResults,
                doctor_diagnosis: diagnosis
              });
              
              // Save to local storage as backup
              try {
                const backupData = {
                  patient_id: selectedPatient?._id,
                  session_id: currentSessionId,
                  diagnosis: diagnosis,
                  timestamp: new Date().toISOString()
                };
                localStorage.setItem('evep_diagnosis_backup', JSON.stringify(backupData));
                console.log('Diagnosis data backed up locally');
              } catch (err) {
                console.warn('Failed to backup diagnosis locally:', err);
              }
              
              handleNext();
            }}
            onBack={() => setActiveStep(activeStep - 1)}
          />
        );
      
      case 5: // Glasses Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Glasses Selection
            </Typography>
            {renderPatientProfile()}
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={screeningResults.glasses_needed}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        glasses_needed: e.target.checked
                      })}
                    />
                  }
                  label="Glasses needed"
                />
                {screeningResults.glasses_needed && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Prescription Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Left Eye Sphere"
                          value={screeningResults.glasses_prescription?.left_eye_sphere || ''}
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            glasses_prescription: {
                              ...screeningResults.glasses_prescription,
                              left_eye_sphere: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Right Eye Sphere"
                          value={screeningResults.glasses_prescription?.right_eye_sphere || ''}
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            glasses_prescription: {
                              ...screeningResults.glasses_prescription,
                              right_eye_sphere: e.target.value
                            }
                          })}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      
      case 6: // Inventory Check
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Inventory Check
            </Typography>
            {renderPatientProfile()}
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={inventoryChecked}
                      onChange={(e) => setInventoryChecked(e.target.checked)}
                    />
                  }
                  label="Inventory has been checked"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={glassesSelected}
                      onChange={(e) => setGlassesSelected(e.target.checked)}
                    />
                  }
                  label="Glasses have been selected from inventory"
                />
              </CardContent>
            </Card>
          </Box>
        );
      
      case 7: // School Delivery
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              School Delivery
            </Typography>
            {renderPatientProfile()}
            <Card>
              <CardContent>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Delivery Method</FormLabel>
                  <RadioGroup
                    value={screeningResults.delivery_method || ''}
                    onChange={(e) => setScreeningResults({
                      ...screeningResults,
                      delivery_method: e.target.value as any
                    })}
                  >
                    <FormControlLabel value="immediate" control={<Radio />} label="Immediate delivery" />
                    <FormControlLabel value="school_delivery" control={<Radio />} label="School delivery" />
                    <FormControlLabel value="home_delivery" control={<Radio />} label="Home delivery" />
                  </RadioGroup>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={deliveryScheduled}
                      onChange={(e) => setDeliveryScheduled(e.target.checked)}
                    />
                  }
                  label="Delivery has been scheduled"
                />
              </CardContent>
            </Card>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Hospital Mobile Unit Workflow
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete mobile vision screening workflow with glasses prescription and fitting
          </Typography>
        </Box>
        {onCancel && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
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

      {/* Workflow Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Real-time Collaboration Status */}
      {selectedPatient && activeStep >= 3 && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'success.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge 
                  color="success" 
                  variant="dot" 
                  sx={{ '& .MuiBadge-dot': { animation: 'pulse 2s infinite' } }}
                >
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👥 Live Collaboration
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary">
                  Patient: {selectedPatient.first_name} {selectedPatient.last_name}
                </Typography>
              </Box>
              
              {/* Active Staff Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Staff:
                </Typography>
                <Badge badgeContent={activeUsers.length} color="primary">
                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 12 } }}>
                    {activeUsers.map((user) => (
                      <Avatar
                        key={user.user_id}
                        sx={{
                          bgcolor: user.status === 'active' ? 'success.main' : 'warning.main',
                          border: currentUserPresence?.user_id === user.user_id ? '2px solid' : 'none',
                          borderColor: 'primary.main'
                        }}
                        title={`${user.name} - Step ${user.step} (${user.role})`}
                      >
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                </Badge>
              </Box>
            </Box>

            {/* Staff Activity Details */}
            {activeUsers.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Current Activity:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activeUsers.map((user) => (
                    <Chip
                      key={user.user_id}
                      size="small"
                      variant={currentUserPresence?.user_id === user.user_id ? "filled" : "outlined"}
                      color={user.status === 'active' ? 'success' : 'warning'}
                      label={`${user.name} • Step ${user.step} • ${user.role}`}
                      sx={{ 
                        fontSize: '0.75rem',
                        '& .MuiChip-label': { 
                          fontWeight: currentUserPresence?.user_id === user.user_id ? 'bold' : 'normal'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Queue Status */}
            {patientQueue.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Patient Queue Status:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">
                    Position: {patientQueue.find(p => p.patient_id === selectedPatient._id)?.queue_position || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Total Queue: {patientQueue.length} patients
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'warning.main' }}>
                    Priority: {patientQueue.find(p => p.patient_id === selectedPatient._id)?.priority || 'Normal'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Connection Status */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge 
                color={socket?.connected ? "success" : "error"} 
                variant="dot"
              >
                <Typography variant="caption" color="text.secondary">
                  {socket?.connected ? 'Connected to collaboration server' : 'Connecting...'}
                </Typography>
              </Badge>
              {collaborationSession && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Session: {collaborationSession}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderWorkflowStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedPatient && activeStep > 0 && (
            <Button
              variant="outlined"
              onClick={handleSaveProgress}
              disabled={loading}
              startIcon={<Save />}
              color="secondary"
            >
              {loading ? 'Saving...' : 'Save Progress'}
            </Button>
          )}
          {/* Show Complete button from step 5 onwards (Glasses Selection, Inventory, Delivery) */}
          {activeStep >= 5 && selectedPatient && (
            <Button
              variant="contained"
              onClick={handleScreeningComplete}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
              color="success"
            >
              Complete Screening
            </Button>
          )}
          
          {/* Step 2 (Student Registration) - Show special buttons */}
          {activeStep === 2 && selectedPatient && !selectedPatient.registration_status && (
            <>
              <Button
                variant="outlined"
                onClick={handleRegisterAndClose}
                disabled={loading}
                startIcon={<HowToReg />}
              >
                Register & Close
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                startIcon={<HowToReg />}
              >
                Register & Next
              </Button>
            </>
          )}
          
          {/* Show Next button for all steps except the last one (but not step 2 with unregistered student) */}
          {activeStep < steps.length - 1 && !(activeStep === 2 && selectedPatient && !selectedPatient.registration_status) && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedPatient && activeStep === 0}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Citizen Card Dialog */}
      <Dialog open={citizenCardDialogOpen} onClose={() => setCitizenCardDialogOpen(false)}>
        <DialogTitle>Citizen Card Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Citizen ID: {citizenCardData.citizen_id}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Name: {citizenCardData.first_name} {citizenCardData.last_name}
          </Typography>
          <Typography variant="body2">
            Date of Birth: {citizenCardData.date_of_birth}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitizenCardDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            // Add patient from citizen card data
            setCitizenCardDialogOpen(false);
          }}>
            Add Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Patient Dialog */}
      <Dialog open={manualPatientDialogOpen} onClose={() => setManualPatientDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newPatient.first_name}
                onChange={(e) => setNewPatient({...newPatient, first_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newPatient.last_name}
                onChange={(e) => setNewPatient({...newPatient, last_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={newPatient.date_of_birth}
                onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="School"
                value={newPatient.school}
                onChange={(e) => setNewPatient({...newPatient, school: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Grade"
                value={newPatient.grade}
                onChange={(e) => setNewPatient({...newPatient, grade: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Parent Name"
                value={newPatient.parent_name}
                onChange={(e) => setNewPatient({...newPatient, parent_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={newPatient.parent_phone}
                onChange={(e) => setNewPatient({...newPatient, parent_phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={newPatient.parent_email}
                onChange={(e) => setNewPatient({...newPatient, parent_email: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualPatientDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            // Add new patient
            setManualPatientDialogOpen(false);
          }}>
            Add Patient
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Student to Patient Registration Confirmation Dialog */}
      <Dialog
        open={showRegistrationConfirmation}
        onClose={() => setShowRegistrationConfirmation(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalHospital color="primary" />
            <Typography variant="h6">
              Register Student as Patient
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> You are about to register this student into the patient screening system.
            </Typography>
          </Alert>
          
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Student Information:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>CID:</strong> {selectedPatient.citizen_id || selectedPatient.cid}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>School:</strong> {selectedPatient.school}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Grade:</strong> {selectedPatient.grade}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            This action will create a patient record and allow medical screening procedures to begin.
            Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowRegistrationConfirmation(false)}
            disabled={pendingRegistration}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRegistration}
            variant="contained" 
            color="primary"
            disabled={pendingRegistration}
            startIcon={pendingRegistration ? <CircularProgress size={16} /> : <Person />}
          >
            {pendingRegistration ? 'Registering...' : 'Register as Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileVisionScreeningForm;
