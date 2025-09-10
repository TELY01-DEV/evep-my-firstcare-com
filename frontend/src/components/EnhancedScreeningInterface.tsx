import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  TextField,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Info,
  PlayArrow,
  Stop,
  Save,
  Refresh,
  Assessment,
  LocalHospital,
  School,
  Person,
  Timer,
  TrendingUp,
  TrendingDown,
  RemoveRedEye,
  VisibilityOutlined,
  Add,
  Search,
  FilterList,
  CreditCard,
} from '@mui/icons-material';

interface EnhancedScreeningInterfaceProps {
  patientId?: string;
  patientName?: string;
  onScreeningCompleted?: (results: any) => void;
  onCancel?: () => void;
  allowPatientSelection?: boolean;
}

interface EyeChartData {
  type: 'snellen' | 'tumbling_e' | 'lea_symbols';
  size: number;
  distance: number;
  letters: string[];
  currentRow: number;
  currentLetter: number;
}

interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  school?: string;
  grade?: string;
  student_id?: string;
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
  patient_id?: string;
  screening_date?: string;
  examiner_id?: string;
}

const EnhancedScreeningInterface: React.FC<EnhancedScreeningInterfaceProps> = ({
  patientId,
  patientName,
  onScreeningCompleted,
  onCancel,
  allowPatientSelection = true,
}) => {
  // Patient selection state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patientId && patientName ? { _id: patientId, first_name: patientName.split(' ')[0], last_name: patientName.split(' ')[1] || '' } : null
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSelectionStep, setPatientSelectionStep] = useState(allowPatientSelection && !patientId);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // Patient selection tabs and filters
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'manual'>('all');
  
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
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    school: '',
    grade: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });
  
  const [activeStep, setActiveStep] = useState(0);
  const [currentTest, setCurrentTest] = useState<'distance' | 'near' | 'color' | 'depth'>('distance');
  const [currentEye, setCurrentEye] = useState<'left' | 'right'>('left');
  const [testInProgress, setTestInProgress] = useState(false);
  const [timer, setTimer] = useState(0);
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
    patient_id: patientId,
    screening_date: new Date().toISOString().split('T')[0],
  });

  // Fetch patients on component mount
  useEffect(() => {
    if (allowPatientSelection) {
      fetchPatients();
    }
  }, [allowPatientSelection]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const token = localStorage.getItem('evep_token');
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/evep/students`, {
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
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients based on search term and filter type
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.school?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'school' && patient.school) ||
      (filterType === 'manual' && !patient.school);
    
    return matchesSearch && matchesFilter;
  });

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveStep(1); // Move to next step
  };

  const handleManualPatientAdd = () => {
    setManualPatientDialogOpen(true);
  };

  const handleCitizenCardRead = () => {
    setCitizenCardDialogOpen(true);
  };

  const [eyeChart, setEyeChart] = useState<EyeChartData>({
    type: 'snellen',
    size: 20,
    distance: 20,
    letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'],
    currentRow: 0,
    currentLetter: 0,
  });

  const steps = allowPatientSelection && !patientId ? [
    'Patient Selection',
    'Setup & Calibration',
    'Distance Vision Test',
    'Near Vision Test',
    'Color Vision Test',
    'Depth Perception Test',
    'Results & Recommendations'
  ] : [
    'Setup & Calibration',
    'Distance Vision Test',
    'Near Vision Test',
    'Color Vision Test',
    'Depth Perception Test',
    'Results & Recommendations'
  ];

  const snellenChart = [
    { size: 200, letters: ['E'] },
    { size: 100, letters: ['E', 'F', 'P'] },
    { size: 70, letters: ['E', 'F', 'P', 'T', 'O', 'Z'] },
    { size: 50, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'] },
    { size: 40, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D'] },
    { size: 30, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D', 'E', 'F', 'P', 'T', 'O'] },
    { size: 20, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D', 'E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'] },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testInProgress) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testInProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestInProgress(true);
    setTimer(0);
  };

  const handleStopTest = () => {
    setTestInProgress(false);
  };

  const handleLetterResponse = (correct: boolean) => {
    if (correct) {
      // Move to next letter
      if (eyeChart.currentLetter < eyeChart.letters.length - 1) {
        setEyeChart(prev => ({ ...prev, currentLetter: prev.currentLetter + 1 }));
      } else {
        // Move to next row
        if (eyeChart.currentRow < snellenChart.length - 1) {
          setEyeChart(prev => ({ 
            ...prev, 
            currentRow: prev.currentRow + 1, 
            currentLetter: 0,
            size: snellenChart[prev.currentRow + 1].size,
            letters: snellenChart[prev.currentRow + 1].letters
          }));
        } else {
          // Test complete
          handleTestComplete();
        }
      }
    } else {
      // Test complete - record results
      handleTestComplete();
    }
  };

  const handleTestComplete = () => {
    setTestInProgress(false);
    const visualAcuity = `${eyeChart.distance}/${snellenChart[eyeChart.currentRow].size}`;
    
    setResults(prev => ({
      ...prev,
      [`${currentEye}_eye_${currentTest}`]: visualAcuity
    }));

    // Move to next test
    if (currentEye === 'left') {
      setCurrentEye('right');
    } else {
      if (currentTest === 'distance') {
        setCurrentTest('near');
        setCurrentEye('left');
      } else if (currentTest === 'near') {
        setCurrentTest('color');
      } else if (currentTest === 'color') {
        setCurrentTest('depth');
      } else {
        setActiveStep(5); // Results step
      }
    }
  };

  const renderEyeChart = () => {
    const currentRowData = snellenChart[eyeChart.currentRow];
    const currentLetter = currentRowData.letters[eyeChart.currentLetter];

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentLetter}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Row {eyeChart.currentRow + 1} of {snellenChart.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Letter {eyeChart.currentLetter + 1} of {currentRowData.letters.length}
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleLetterResponse(true)}
            disabled={!testInProgress}
          >
            I can see it
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleLetterResponse(false)}
            disabled={!testInProgress}
          >
            I cannot see it
          </Button>
        </Box>
      </Box>
    );
  };

  const renderColorVisionTest = () => {
    const colorTests = [
      { number: 8, expected: '8' },
      { number: 29, expected: '29' },
      { number: 5, expected: '5' },
      { number: 3, expected: '3' },
      { number: 15, expected: '15' },
    ];

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Color Vision Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          What number do you see in the circle?
        </Typography>
        
        <Box sx={{ 
          width: 200, 
          height: 200, 
          borderRadius: '50%', 
          bgcolor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3
        }}>
          <Typography variant="h3" color="primary">
            {colorTests[0].number}
          </Typography>
        </Box>
        
        <TextField
          label="Enter the number you see"
          variant="outlined"
          sx={{ width: 200 }}
        />
      </Box>
    );
  };

  const renderDepthPerceptionTest = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Depth Perception Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Which circle appears closest to you?
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', mb: 3 }}>
          {[1, 2, 3].map((num) => (
            <Box
              key={num}
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <Typography variant="h5" color="white">
                {num}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderProgressTracking = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Test Progress</Typography>
          <Chip 
            icon={<Timer />} 
            label={formatTime(timer)} 
            color={testInProgress ? 'primary' : 'default'}
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100} 
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Current Test: {currentTest.replace('_', ' ').toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Current Eye: {currentEye.toUpperCase()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderResultsVisualization = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Screening Results
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Distance Vision
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Left Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.left_eye_distance || 'Not tested'}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Right Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.right_eye_distance || 'Not tested'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Near Vision
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Left Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.left_eye_near || 'Not tested'}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Right Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.right_eye_near || 'Not tested'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Color Vision
            </Typography>
            <Chip 
              label={results.color_vision} 
              color={results.color_vision === 'normal' ? 'success' : 'warning'}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Depth Perception
            </Typography>
            <Chip 
              label={results.depth_perception} 
              color={results.depth_perception === 'normal' ? 'success' : 'warning'}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPatientSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Patient for Enhanced Vision Screening
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a patient to conduct enhanced vision screening with comprehensive tests, or start without a patient.
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
                Begin the enhanced vision screening workflow and add patient information later
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Assessment />}
              onClick={() => {
                setSelectedPatient(null);
                setActiveStep(1); // Move to next step
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
                        DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                        {patient.school && ` • School: ${patient.school}`}
                        {patient.grade && ` • Grade: ${patient.grade}`}
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

  const handleScreeningComplete = async () => {
    try {
      // Save to database
      const token = localStorage.getItem('evep_token');
      const screeningData = {
        ...results,
        patient_id: selectedPatient?._id || patientId,
        screening_date: new Date().toISOString(),
        examiner_id: localStorage.getItem('user_id'),
        screening_type: 'enhanced_vision_screening',
        status: 'completed'
      };

              const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
              const response = await fetch(`${baseUrl}/api/v1/screenings/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screeningData),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Screening results saved to database:', savedData);
        
        if (onScreeningCompleted) {
          onScreeningCompleted({ ...results, id: savedData.id });
        }
      } else {
        console.error('Failed to save screening results to database');
        // Still call onScreeningCompleted even if database save fails
        if (onScreeningCompleted) {
          onScreeningCompleted(results);
        }
      }
    } catch (error) {
      console.error('Error saving screening results:', error);
      // Still call onScreeningCompleted even if database save fails
      if (onScreeningCompleted) {
        onScreeningCompleted(results);
      }
    }
  };

  const renderPatientProfile = () => {
    if (!selectedPatient) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">No Patient Selected</Typography>
          <Typography variant="body2">
            Please select a patient to begin the enhanced vision screening.
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
              label="Enhanced Screening Patient" 
              color="primary" 
              size="small" 
              variant="filled"
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
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
                    {selectedPatient.date_of_birth ? calculateAge(selectedPatient.date_of_birth) : 'N/A'} years
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
                    {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'Not specified'}
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
                  <Typography variant="subtitle2" color="text.secondary">Screening Type</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Enhanced Vision Screening
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    In Progress
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        if (allowPatientSelection && !patientId) {
          return renderPatientSelection();
        }
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Setup & Calibration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ensure proper lighting and patient positioning for accurate screening.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Patient positioned at 20 feet from chart"
                  secondary="Standard distance for Snellen chart"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Proper lighting conditions"
                  secondary="Well-lit room with no glare"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Chart at eye level"
                  secondary="Chart positioned at patient's eye level"
                />
              </ListItem>
            </List>
          </Box>
        );

      case 1:
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {currentTest === 'distance' ? 'Distance Vision Test' : 'Near Vision Test'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Testing {currentEye} eye - {currentTest} vision
            </Typography>
            
            {renderPatientProfile()}
            {renderEyeChart()}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Color Vision Test
            </Typography>
            {renderPatientProfile()}
            {renderColorVisionTest()}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Depth Perception Test
            </Typography>
            {renderPatientProfile()}
            {renderDepthPerceptionTest()}
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Results & Recommendations
            </Typography>
            {renderPatientProfile()}
            {renderResultsVisualization()}
            
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={results.notes}
              onChange={(e) => setResults(prev => ({ ...prev, notes: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Recommendations"
              multiline
              rows={2}
              value={results.recommendations}
              onChange={(e) => setResults(prev => ({ ...prev, recommendations: e.target.value }))}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Enhanced Vision Screening
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Patient: {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : patientName || 'Not Selected'}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {testInProgress ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStopTest}
            >
              Stop Test
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartTest}
            >
              Start Test
            </Button>
          )}
        </Box>
      </Box>

      {/* Progress Tracking */}
      {renderProgressTracking()}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between">
        <Button
          onClick={onCancel}
          variant="outlined"
        >
          Cancel
        </Button>
        
        <Box display="flex" gap={2}>
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep(prev => prev - 1)}
              variant="outlined"
            >
              Previous
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
              disabled={activeStep === 0 && allowPatientSelection && !patientId && !selectedPatient}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleScreeningComplete}
            >
              Complete Screening
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedScreeningInterface;
