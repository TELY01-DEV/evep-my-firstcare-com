import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Search,
  FilterList,
  CreditCard,
  ArrowBack,
  ArrowForward,
  Save,
  Close,
  Clear,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';

interface SchoolScreening {
  screening_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  school_id: string;
  school_name: string;
  grade_level: string;
  screening_type: string;
  screening_date: string;
  status: string;
  results: any[];
  conclusion: string;
  recommendations: string;
  referral_needed: boolean;
  referral_notes: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  school_name: string;
  grade_level: string;
  teacher_id?: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  position: string;
}

const EvepSchoolScreenings: React.FC = () => {
  const { token, user } = useAuth();
  const [screenings, setScreenings] = useState<SchoolScreening[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingScreening, setEditingScreening] = useState<SchoolScreening | null>(null);
  const [viewingScreening, setViewingScreening] = useState<SchoolScreening | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Filter states for Recent School Screenings
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScreeningType, setFilterScreeningType] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('');
  const [filterExaminer, setFilterExaminer] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Step-by-step form states
  const [activeStep, setActiveStep] = useState(0);
  const [screeningInProgress, setScreeningInProgress] = useState(false);

  // Patient selection states
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

  const [formData, setFormData] = useState({
    patient_id: '',
    examiner_id: '',
    screening_type: '',
    equipment_used: '',
    notes: '',
    // Enhanced screening fields
    basic_vision_screening: {
      visual_acuity_left: '',
      visual_acuity_right: '',
      eye_preference: 'both' as 'left' | 'right' | 'both',
    },
    intraocular_pressure: {
      pressure_left: 0,
      pressure_right: 0,
    },
    retinal_imaging: {
      retinal_photo_taken: false,
      image_reference: '',
    },
    corneal_curvature: {
      curvature_left: 0,
      curvature_right: 0,
    },
  });

  // Screening results state
  const [screeningResults, setScreeningResults] = useState({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal' as 'normal' | 'deficient' | 'failed',
    depth_perception: 'normal' as 'normal' | 'impaired' | 'failed',
    notes: '',
    recommendations: '',
    follow_up_required: false,
    follow_up_date: '',
  });

  useEffect(() => {
    fetchSchoolScreenings();
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchSchoolScreenings = async () => {
    try {
      const response = await fetch('http://localhost:8014/api/v1/evep/school-screenings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setScreenings(data || []);
    } catch (error) {
      console.error('Error fetching school screenings:', error);
      setScreenings([]);
      setSnackbar({
        open: true,
        message: 'Failed to fetch school screenings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:8014/api/v1/evep/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Filter students based on user role
      let filteredStudents = data.students || [];
      
      if (user?.role === 'teacher') {
        // For teachers, only show their assigned students
        filteredStudents = filteredStudents.filter((student: Student) => 
          student.teacher_id === user.user_id
        );
      } else if (user?.role === 'medical_staff') {
        // For medical staff, show all students
        filteredStudents = data.students || [];
      }
      
      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:8014/api/v1/evep/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  // Filter students based on search term and filter type
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'school' && student.school_name) ||
      (filterType === 'manual' && !student.school_name);
    
    return matchesSearch && matchesFilter;
  });

  const handleStudentSelect = (student: Student) => {
    setFormData(prev => ({
      ...prev,
      patient_id: student.id,
    }));
    // Don't close dialog - move to next step
    setActiveStep(1);
  };

  const handleManualPatientAdd = () => {
    setManualPatientDialogOpen(true);
  };

  const handleCitizenCardRead = () => {
    setCitizenCardDialogOpen(true);
  };

  const handleCreateScreening = () => {
    setEditingScreening(null);
    setActiveStep(0);
    resetFormData();
    setOpenDialog(true);
  };

  const handleEditScreening = (screening: SchoolScreening) => {
    setEditingScreening(screening);
    setActiveStep(1); // Start at Screening Setup step instead of Student Selection
    setFormData({
      patient_id: screening.student_id,
      examiner_id: screening.teacher_id,
      screening_type: screening.screening_type || '',
      equipment_used: '', // Equipment used is not stored in the current screening model
      notes: screening.notes || '',
      basic_vision_screening: {
        visual_acuity_left: '',
        visual_acuity_right: '',
        eye_preference: 'both' as 'left' | 'right' | 'both',
      },
      intraocular_pressure: {
        pressure_left: 0,
        pressure_right: 0,
      },
      retinal_imaging: {
        retinal_photo_taken: false,
        image_reference: '',
      },
      corneal_curvature: {
        curvature_left: 0,
        curvature_right: 0,
      },
    });
    setOpenDialog(true);
  };

  const handleNextStep = () => {
    if (activeStep === 0 && !formData.patient_id) {
      setSnackbar({
        open: true,
        message: 'Please select a student',
        severity: 'warning'
      });
      return;
    }
    if (activeStep === 1) {
      // Validate screening_type for both new and editing modes
      if (!formData.screening_type) {
        setSnackbar({
          open: true,
          message: 'Please select a Screening Type',
          severity: 'warning'
        });
        return;
      }
      
      // Only validate equipment_used for new screenings
      if (!editingScreening && !formData.equipment_used) {
        setSnackbar({
          open: true,
          message: 'Please select Equipment Used for new screenings',
          severity: 'warning'
        });
        return;
      }
    }
    if (activeStep === 2) {
      // Validate that we have at least some basic screening results
      if (!screeningResults.left_eye_distance && !screeningResults.right_eye_distance) {
        setSnackbar({
          open: true,
          message: 'Please enter at least one distance acuity measurement (left or right eye)',
          severity: 'warning'
        });
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const resetFormData = () => {
    setFormData({
      patient_id: '',
      examiner_id: user?.role === 'teacher' ? user.user_id : '',
      screening_type: '',
      equipment_used: '',
      notes: '',
      basic_vision_screening: {
        visual_acuity_left: '',
        visual_acuity_right: '',
        eye_preference: 'both' as 'left' | 'right' | 'both',
      },
      intraocular_pressure: {
        pressure_left: 0,
        pressure_right: 0,
      },
      retinal_imaging: {
        retinal_photo_taken: false,
        image_reference: '',
      },
      corneal_curvature: {
        curvature_left: 0,
        curvature_right: 0,
      },
    });
    
    setScreeningResults({
      left_eye_distance: '',
      right_eye_distance: '',
      left_eye_near: '',
      right_eye_near: '',
      color_vision: 'normal',
      depth_perception: 'normal',
      notes: '',
      recommendations: '',
      follow_up_required: false,
      follow_up_date: '',
    });
  };

  const handleSaveScreening = async () => {
    try {
      // Transform screeningResults into the format expected by the backend
      const transformedResults = [
        {
          eye: 'left',
          distance_acuity: screeningResults.left_eye_distance,
          near_acuity: screeningResults.left_eye_near,
          color_vision: screeningResults.color_vision,
          depth_perception: screeningResults.depth_perception,
          additional_tests: null
        },
        {
          eye: 'right',
          distance_acuity: screeningResults.right_eye_distance,
          near_acuity: screeningResults.right_eye_near,
          color_vision: screeningResults.color_vision,
          depth_perception: screeningResults.depth_perception,
          additional_tests: null
        }
      ];

      const screeningData = {
        results: transformedResults,
        status: 'completed',
        notes: screeningResults.notes || formData.notes,
        recommendations: screeningResults.recommendations,
        conclusion: screeningResults.notes, // Use notes as conclusion
        referral_needed: screeningResults.follow_up_required,
        referral_notes: screeningResults.follow_up_date ? `Follow-up date: ${screeningResults.follow_up_date}` : null
      };

      console.log('Saving screening data:', screeningData);

      if (editingScreening) {
        const screeningId = editingScreening.screening_id;
        if (!screeningId) {
          setSnackbar({
            open: true,
            message: 'Invalid screening ID for update',
            severity: 'error'
          });
          return;
        }
        
        console.log('Updating screening with ID:', screeningId);
        const response = await fetch(`http://localhost:8014/api/v1/evep/school-screenings/${screeningId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(screeningData)
        });
        
        console.log('Update response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Update error:', errorData);
          throw new Error(`Update failed: ${errorData.detail || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log('Update result:', result);
        
        setSnackbar({
          open: true,
          message: 'School screening updated successfully!',
          severity: 'success'
        });
      } else {
        const response = await fetch('http://localhost:8014/api/v1/evep/school-screenings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(screeningData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Creation failed: ${errorData.detail || 'Unknown error'}`);
        }
        
        setSnackbar({
          open: true,
          message: 'School screening created successfully!',
          severity: 'success'
        });
      }

      // Reset form data and close dialog
      resetFormData();
      setOpenDialog(false);
      setActiveStep(0);
      setEditingScreening(null);
      await fetchSchoolScreenings();
    } catch (error) {
      console.error('Error saving school screening:', error);
      setSnackbar({
        open: true,
        message: `Error saving school screening: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteScreening = async (screeningId: string) => {
    if (!screeningId) {
      setSnackbar({
        open: true,
        message: 'Invalid screening ID',
        severity: 'error'
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this school screening?')) {
      try {
        await fetch(`http://localhost:8014/api/v1/evep/school-screenings/${screeningId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({
          open: true,
          message: 'School screening deleted successfully!',
          severity: 'success'
        });
        fetchSchoolScreenings();
      } catch (error) {
        console.error('Error deleting school screening:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting school screening',
          severity: 'error'
        });
      }
    }
  };

  const handleViewScreening = (screening: SchoolScreening) => {
    setViewingScreening(screening);
    setViewDialog(true);
  };

  const getSelectedStudent = () => {
    return students.find(student => student.id === formData.patient_id);
  };

  const getSelectedTeacher = () => {
    return teachers.find(teacher => teacher.id === formData.examiner_id);
  };

  // Filter function for screenings
  const filteredScreenings = screenings.filter(screening => {
    // Filter by status
    if (filterStatus !== 'all' && screening.status !== filterStatus) {
      return false;
    }
    
    // Filter by screening type
    if (filterScreeningType !== 'all' && screening.screening_type !== filterScreeningType) {
      return false;
    }
    
    // Filter by student name
    if (filterStudent && !screening.student_name?.toLowerCase().includes(filterStudent.toLowerCase())) {
      return false;
    }
    
    // Filter by examiner name
    if (filterExaminer && !screening.teacher_name?.toLowerCase().includes(filterExaminer.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (filterDateFrom || filterDateTo) {
      const screeningDate = new Date(screening.screening_date);
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
      const toDate = filterDateTo ? new Date(filterDateTo) : null;
      
      if (fromDate && screeningDate < fromDate) {
        return false;
      }
      if (toDate && screeningDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  // Reset filters function
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterScreeningType('all');
    setFilterStudent('');
    setFilterExaminer('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const steps = [
    'Select Student',
    'Screening Setup',
    'Vision Assessment',
    'Results & Recommendations'
  ];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Show student selection only for new screenings, not for editing
        if (editingScreening) {
          return (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
                Student Information
              </Typography>
              
              {/* Show current student info when editing */}
              {formData.patient_id && getSelectedStudent() && (
                <Box sx={{ p: 3, bgcolor: '#f3f4f6', border: '2px solid #3b82f6', borderRadius: 2, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#1e40af', fontWeight: 'bold' }}>
                    📋 Current Screening Student
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#1f2937', fontWeight: '600' }}>
                    {getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>Student Code:</strong> {getSelectedStudent()?.student_code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>School:</strong> {getSelectedStudent()?.school_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>Grade Level:</strong> {getSelectedStudent()?.grade_level}
                      </Typography>
                    </Grid>

                  </Grid>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #d1d5db' }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
                      This screening is for the student above. You can proceed to the next step to update the screening details.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        }
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Student Selection
            </Typography>
            
            {/* Quick Start Option */}
            <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      Start Screening Without Student
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Begin the school screening workflow and add student information later
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, patient_id: '' }));
                      setActiveStep(1);
                    }}
                  >
                    Start Screening
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Student Selection Tabs */}
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="School Students" icon={<SchoolIcon />} />
              <Tab label="Manual Registration" icon={<PersonIcon />} />
              <Tab label="Citizen Card Reader" icon={<CreditCard />} />
            </Tabs>

            {/* Search and Filter */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search students"
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
                      <MenuItem value="all">All Students</MenuItem>
                      <MenuItem value="school">School Students</MenuItem>
                      <MenuItem value="manual">Manual Registration</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Student List */}
            <Card>
              <CardContent>
                <List>
                  {filteredStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      button
                      onClick={() => handleStudentSelect(student)}
                      sx={{
                        border: '1px solid',
                        borderColor: formData.patient_id === student.id ? 'primary.main' : 'divider',
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
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${student.first_name} ${student.last_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Student Code: {student.student_code}
                              {student.school_name && ` • School: ${student.school_name}`}
                              {student.grade_level && ` • Grade: ${student.grade_level}`}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={<SchoolIcon />}
                                label="School Student"
                                size="small"
                                color="primary"
                                sx={{ mr: 1 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <Box>
                        <Button
                          variant="contained"
                          startIcon={<AssessmentIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentSelect(student);
                          }}
                        >
                          Select Student
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
                startIcon={<AddIcon />}
                onClick={handleManualPatientAdd}
              >
                Add New Student
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

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Screening Setup
            </Typography>
            
            {/* Show student info prominently when editing */}
            {editingScreening && formData.patient_id && getSelectedStudent() && (
              <Box sx={{ mb: 3, p: 3, bgcolor: '#f3f4f6', border: '2px solid #3b82f6', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 'bold' }}>
                  📋 Screening for Student
                </Typography>
                <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: '600', mb: 1 }}>
                  <strong style={{ color: '#1e40af' }}>Name:</strong> {getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                  <strong style={{ color: '#1e40af' }}>Student Code:</strong> {getSelectedStudent()?.student_code} | 
                  <strong style={{ color: '#1e40af' }}> School:</strong> {getSelectedStudent()?.school_name} | 
                  <strong style={{ color: '#1e40af' }}> Grade:</strong> {getSelectedStudent()?.grade_level}
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher/Examiner</InputLabel>
                  <Select
                    value={formData.examiner_id}
                    label="Teacher/Examiner"
                    onChange={(e) => setFormData({ ...formData, examiner_id: e.target.value })}
                    disabled={user?.role === 'teacher'} // Disable for teachers
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} - {teacher.position} ({teacher.school})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    Screening Type *
                  </InputLabel>
                  <Select
                    value={formData.screening_type}
                    label="Screening Type *"
                    onChange={(e) => setFormData({ ...formData, screening_type: e.target.value })}
                  >
                    <MenuItem value="basic_school">Basic School</MenuItem>
                    <MenuItem value="vision_test">Vision Test</MenuItem>
                    <MenuItem value="comprehensive_vision">Comprehensive Vision</MenuItem>
                    <MenuItem value="color_blindness">Color Blindness</MenuItem>
                    <MenuItem value="depth_perception">Depth Perception</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    Equipment Used {!editingScreening && '*'}
                  </InputLabel>
                  <Select
                    value={formData.equipment_used}
                    label={`Equipment Used ${!editingScreening ? '*' : ''}`}
                    onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                  >
                    <MenuItem value="snellen_chart">Snellen Chart</MenuItem>
                    <MenuItem value="tumbling_e">Tumbling E Chart</MenuItem>
                    <MenuItem value="lea_symbols">Lea Symbols</MenuItem>
                    <MenuItem value="digital_screener">Digital Vision Screener</MenuItem>
                    <MenuItem value="manual_test">Manual Testing</MenuItem>
                  </Select>
                  {editingScreening && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Equipment is optional for editing existing screenings
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes about the screening setup..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Vision Assessment
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Distance Vision</Typography>
                <TextField
                  fullWidth
                  label="Left Eye"
                  value={screeningResults.left_eye_distance}
                  onChange={(e) => setScreeningResults({ ...screeningResults, left_eye_distance: e.target.value })}
                  placeholder="e.g., 20/20"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Right Eye"
                  value={screeningResults.right_eye_distance}
                  onChange={(e) => setScreeningResults({ ...screeningResults, right_eye_distance: e.target.value })}
                  placeholder="e.g., 20/20"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Near Vision</Typography>
                <TextField
                  fullWidth
                  label="Left Eye"
                  value={screeningResults.left_eye_near}
                  onChange={(e) => setScreeningResults({ ...screeningResults, left_eye_near: e.target.value })}
                  placeholder="e.g., 20/20"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Right Eye"
                  value={screeningResults.right_eye_near}
                  onChange={(e) => setScreeningResults({ ...screeningResults, right_eye_near: e.target.value })}
                  placeholder="e.g., 20/20"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Color Vision</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={screeningResults.color_vision}
                    onChange={(e) => setScreeningResults({ ...screeningResults, color_vision: e.target.value as any })}
                  >
                    <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                    <FormControlLabel value="deficient" control={<Radio />} label="Deficient" />
                    <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Depth Perception</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={screeningResults.depth_perception}
                    onChange={(e) => setScreeningResults({ ...screeningResults, depth_perception: e.target.value as any })}
                  >
                    <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                    <FormControlLabel value="impaired" control={<Radio />} label="Impaired" />
                    <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Results & Recommendations
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Assessment Notes"
                  value={screeningResults.notes}
                  onChange={(e) => setScreeningResults({ ...screeningResults, notes: e.target.value })}
                  placeholder="Enter detailed assessment notes..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Recommendations"
                  value={screeningResults.recommendations}
                  onChange={(e) => setScreeningResults({ ...screeningResults, recommendations: e.target.value })}
                  placeholder="Enter recommendations for follow-up care..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={screeningResults.follow_up_required}
                      onChange={(e) => setScreeningResults({ ...screeningResults, follow_up_required: e.target.checked })}
                    />
                  }
                  label="Follow-up Required"
                />
              </Grid>
              {screeningResults.follow_up_required && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Follow-up Date"
                    value={screeningResults.follow_up_date}
                    onChange={(e) => setScreeningResults({ ...screeningResults, follow_up_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            School Screenings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage school-based vision screening sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateScreening}
        >
          Create New School Screening
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {screenings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Screenings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {screenings.filter(s => s.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {screenings.filter(s => s.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {students.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent School Screenings
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>

          {/* Filter Section */}
          {showFilters && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Screening Type</InputLabel>
                    <Select
                      value={filterScreeningType}
                      label="Screening Type"
                      onChange={(e) => setFilterScreeningType(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="basic_school">Basic School</MenuItem>
                      <MenuItem value="vision_test">Vision Test</MenuItem>
                      <MenuItem value="comprehensive_vision">Comprehensive Vision</MenuItem>
                      <MenuItem value="color_blindness">Color Blindness</MenuItem>
                      <MenuItem value="depth_perception">Depth Perception</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Student Name"
                    value={filterStudent}
                    onChange={(e) => setFilterStudent(e.target.value)}
                    placeholder="Search student..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Examiner Name"
                    value={filterExaminer}
                    onChange={(e) => setFilterExaminer(e.target.value)}
                    placeholder="Search examiner..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={resetFilters}
                    startIcon={<Clear />}
                  >
                    Clear Filters
                  </Button>
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                    {filteredScreenings.length} of {screenings.length} screenings
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Examiner</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredScreenings.map((screening) => (
                  <TableRow key={screening.screening_id}>
                    <TableCell>{screening.student_name}</TableCell>
                    <TableCell>{screening.teacher_name}</TableCell>
                    <TableCell>{screening.screening_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={screening.status}
                        color={screening.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(screening.screening_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewScreening(screening)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditScreening(screening)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteScreening(screening.screening_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
              <Dialog open={openDialog} onClose={() => {
          setOpenDialog(false);
          setEditingScreening(null);
          resetFormData();
        }} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingScreening ? 'Edit School Screening' : 'Create New School Screening'}
        </DialogTitle>
        <DialogContent>
          {/* Stepper */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <Stepper activeStep={editingScreening ? activeStep - 1 : activeStep} alternativeLabel>
              {editingScreening ? (
                // Custom steps for editing mode
                [
                  <Step key="student-info">
                    <StepLabel>Student Info</StepLabel>
                  </Step>,
                  <Step key="screening-setup">
                    <StepLabel>Screening Setup</StepLabel>
                  </Step>,
                  <Step key="vision-assessment">
                    <StepLabel>Vision Assessment</StepLabel>
                  </Step>,
                  <Step key="results">
                    <StepLabel>Results & Recommendations</StepLabel>
                  </Step>
                ]
              ) : (
                // Original steps for create mode
                steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))
              )}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ mt: 3 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Selected Student Info */}
          {formData.patient_id && getSelectedStudent() && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {editingScreening ? 'Screening Student:' : 'Selected Student:'}
              </Typography>
              <Typography variant="body2">
                {getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name} 
                ({getSelectedStudent()?.student_code}) - {getSelectedStudent()?.school_name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
                          <Button onClick={() => {
                  setOpenDialog(false);
                  setEditingScreening(null);
                  resetFormData();
                }}>
                  Cancel
                </Button>
          {activeStep > (editingScreening ? 1 : 0) && (
            <Button onClick={handlePreviousStep} startIcon={<ArrowBack />}>
              Previous
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNextStep} variant="contained" endIcon={<ArrowForward />}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSaveScreening} variant="contained" startIcon={<Save />}>
              {editingScreening ? 'Update Screening' : 'Save Screening'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Screening Details
        </DialogTitle>
        <DialogContent>
          {viewingScreening && (
            <Box>
              <Typography variant="h6" gutterBottom>Student Information</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {viewingScreening.student_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Examiner:</strong> {viewingScreening.teacher_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Screening Type:</strong> {viewingScreening.screening_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography><strong>Status:</strong></Typography>
                    <Chip
                      label={viewingScreening.status}
                      color={viewingScreening.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Date:</strong> {new Date(viewingScreening.screening_date || viewingScreening.created_at).toLocaleDateString()} 
                  </Typography>
                </Grid>
                {viewingScreening.school_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>School:</strong> {viewingScreening.school_name}</Typography>
                  </Grid>
                )}
                {viewingScreening.grade_level && (
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Grade Level:</strong> {viewingScreening.grade_level}</Typography>
                  </Grid>
                )}
              </Grid>
              {viewingScreening.results && viewingScreening.results.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Results</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Eye</strong></TableCell>
                          <TableCell><strong>Distance Acuity</strong></TableCell>
                          <TableCell><strong>Near Acuity</strong></TableCell>
                          <TableCell><strong>Color Vision</strong></TableCell>
                          <TableCell><strong>Depth Perception</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingScreening.results.map((res: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{res.eye || '-'}</TableCell>
                            <TableCell>{res.distance_acuity || '-'}</TableCell>
                            <TableCell>{res.near_acuity || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={res.color_vision || '-'}
                                color={res.color_vision === 'normal' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={res.depth_perception || '-'}
                                color={res.depth_perception === 'normal' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {viewingScreening.results.some((r: any) => r && r.additional_tests) && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>Additional Tests</Typography>
                      <Grid container spacing={2}>
                        {viewingScreening.results.map((res: any, idx: number) => (
                          res?.additional_tests ? (
                            <Grid item xs={12} md={6} key={`addl-${idx}`}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2" gutterBottom>Eye: {res.eye || '-'}</Typography>
                                  <List dense>
                                    {Object.entries(res.additional_tests).map(([k, v]) => (
                                      <ListItem key={k} disableGutters>
                                        <ListItemText primaryTypographyProps={{ variant: 'body2' }}
                                          primary={`${k.replace(/_/g, ' ')}: ${String(v)}`} />
                                      </ListItem>
                                    ))}
                                  </List>
                                </CardContent>
                              </Card>
                            </Grid>
                          ) : null
                        ))}
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvepSchoolScreenings;
