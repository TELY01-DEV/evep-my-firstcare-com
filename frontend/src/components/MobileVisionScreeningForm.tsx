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

import { useAuth } from '../contexts/AuthContext';
import DoctorDiagnosisForm from './DoctorDiagnosisForm';
import { API_ENDPOINTS } from '../config/api';


interface MobileVisionScreeningFormProps {
  onScreeningCompleted?: (screening: any) => void;
  onCancel?: () => void;
}

interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  school?: string;
  grade?: string;
  student_id?: string;
  citizen_id?: string;
  parent_consent?: boolean;
  registration_status?: 'pending' | 'registered' | 'screened';
  photos?: string[]; // Array of photo URLs/base64 strings
  screening_status?: 'pending' | 'completed' | 'follow_up_needed';
  follow_up_needed?: boolean;
  registration_date?: string;
  parent_phone?: string;
  parent_email?: string;
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
  onScreeningCompleted,
  onCancel,
}) => {
  const { user } = useAuth();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Patient selection
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'appointment' | 'manual'>('all');
  
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
  }, []);

  // Refetch patients when tab changes
  useEffect(() => {
    fetchPatients();
  }, [selectedTab]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // For School Screening Students tab, fetch students who completed school screening and need medical screening
      if (selectedTab === 0) {
        const response = await fetch(API_ENDPOINTS.EVEP_STUDENTS_READY_FOR_PATIENT_REGISTRATION, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data.students || []);
        } else {
          console.error('Failed to fetch students ready for medical screening from API');
          setPatients([]);
        }
      } else {
        // For other tabs, fetch regular students
        const response = await fetch(API_ENDPOINTS.EVEP_STUDENTS, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        } else {
          console.error('Failed to fetch patients from API');
          setPatients([]);
        }
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

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveStep(1); // Move to Parent Consent step
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleScreeningComplete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const screeningData = {
        patient_id: selectedPatient?._id,
        examiner_id: user?.user_id,
        screening_type: 'mobile_vision_screening',
        results: screeningResults,
        workflow_completed: true,
        delivery_scheduled: deliveryScheduled,
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
        const data = await response.json();
        setSuccess('Mobile vision screening completed successfully!');
        onScreeningCompleted?.(data);
      } else {
        setError('Failed to complete screening');
      }
      
    } catch (err) {
      console.error('Failed to complete screening:', err);
      setError('Failed to complete screening');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = `${patient.first_name} ${patient.last_name} ${patient.student_id || ''} ${patient.citizen_id || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'school' && patient.school) ||
      (filterType === 'appointment' && appointments.some(apt => apt.patient_id === patient._id)) ||
      (filterType === 'manual' && !patient.school);
    
    return matchesSearch && matchesFilter;
  });

  const renderPatientSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Patient for Mobile Vision Screening
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {selectedTab === 0 
          ? "Choose a student who completed school screening and needs medical team screening & diagnosis with glasses prescription and fitting, or start the workflow without a patient."
          : "Choose a patient to conduct mobile vision screening with glasses prescription and fitting, or start the workflow without a patient."
        }
      </Typography>

      {/* Quick Start Option */}
      <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" color="primary">
                Start Workflow Without Patient
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Begin the mobile vision screening workflow and add patient information later
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
              Start Workflow
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Patient Selection Tabs */}
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="School Screening Students" icon={<School />} />
        <Tab label="Manual Registration" icon={<Person />} />
        <Tab label="Citizen Card Reader" icon={<CreditCard />} />
      </Tabs>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search patients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by type</InputLabel>
              <Select
                value={filterType}
                label="Filter by type"
                onChange={(e) => setFilterType(e.target.value as any)}
                startAdornment={<FilterList sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">All Patients</MenuItem>
                <MenuItem value="school">School Screening Students</MenuItem>
                <MenuItem value="appointment">Appointment Patients</MenuItem>
                <MenuItem value="manual">Manual Registration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Patient List */}
      <Card>
        <CardContent>
          <List>
            {filteredPatients.map((patient) => (
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
                    Start Screening
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleManualPatientAdd}
        >
          Add New Patient
        </Button>
        <Button
          variant="outlined"
          startIcon={<CreditCard />}
          onClick={handleCitizenCardRead}
        >
          Read Citizen Card
        </Button>
      </Box>
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
            {renderPatientProfile()}
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
            <Card>
              <CardContent>
                {selectedPatient ? (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Patient: {selectedPatient.first_name} {selectedPatient.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Registration status: {selectedPatient.registration_status || 'pending'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<HowToReg />}
                      sx={{ mt: 2 }}
                    >
                      Complete Registration
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
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
              // Store diagnosis data
              setScreeningResults({
                ...screeningResults,
                doctor_diagnosis: diagnosis
              });
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
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleScreeningComplete}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              Complete Screening
            </Button>
          ) : (
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
    </Box>
  );
};

export default MobileVisionScreeningForm;
