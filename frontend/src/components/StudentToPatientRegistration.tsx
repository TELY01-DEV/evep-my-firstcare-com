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
  Tabs,
  Tab,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  Pagination,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Person,
  School,
  MedicalServices,
  Assignment,
  CheckCircle,
  Warning,
  Search,
  FilterList,
  Add,
  CreditCard,
  Home,
  Dashboard,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface StudentToPatientRegistrationProps {
  appointmentId?: string;
  onRegistrationComplete?: (registration: any) => void;
  onCancel?: () => void;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  grade_level: string;
  school_name: string;
  parent_id: string;
  screening_completed_at?: string;
  screening_results?: any;
}

interface Teacher {
  _id: string;
  first_name: string;
  last_name: string;
  position: string;
  school: string;
}

const StudentToPatientRegistration: React.FC<StudentToPatientRegistrationProps> = ({
  appointmentId,
  onRegistrationComplete,
  onCancel
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [registrationReason, setRegistrationReason] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [referringTeacher, setReferringTeacher] = useState('');
  const [schoolScreeningOutcome, setSchoolScreeningOutcome] = useState('');

  // Advanced student selection states
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'grade' | 'recent'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  
  // Citizen card reader
  const [citizenCardDialogOpen, setCitizenCardDialogOpen] = useState(false);
  const [citizenCardData, setCitizenCardData] = useState({
    citizen_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
  });
  
  // Manual student registration
  const [manualStudentDialogOpen, setManualStudentDialogOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    school_name: '',
    grade_level: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadStudents();
    loadTeachers();
    loadRegistrations();
  }, []);

  const loadStudents = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await axios.get(`${baseUrl}/api/v1/evep/students/ready-for-patient-registration`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (err: any) {
      console.error('Error loading students ready for patient registration:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to load students ready for patient registration');
      }
    }
  };

  const loadTeachers = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await axios.get(`${baseUrl}/api/v1/evep/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data.teachers || []);
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to load teachers');
      }
    }
  };

  const loadRegistrations = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await axios.get(`${baseUrl}/api/v1/patients/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data || []);
    } catch (err: any) {
      console.error('Error loading registrations:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to load registrations');
      }
    }
  };

  // Filter students based on search term and filter type
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'school' && student.school_name) ||
      (filterType === 'grade' && student.grade_level) ||
      (filterType === 'recent' && student.id); // For recent students
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student.id);
  };

  const handleManualStudentAdd = () => {
    setManualStudentDialogOpen(true);
  };

  const handleCitizenCardRead = () => {
    setCitizenCardDialogOpen(true);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !registrationReason || !urgencyLevel) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const registrationData = {
        student_id: selectedStudent,
        appointment_id: appointmentId || '',
        registration_reason: registrationReason,
        medical_notes: medicalNotes || undefined,
        urgency_level: urgencyLevel,
        referring_teacher_id: referringTeacher || undefined,
        school_screening_outcome: schoolScreeningOutcome || undefined
      };

      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await axios.post(
        `${baseUrl}/api/v1/patients/register-from-student`,
        registrationData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Student registered as patient successfully!');
      loadRegistrations();
      if (onRegistrationComplete) {
        onRegistrationComplete(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register student as patient');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine':
        return 'success';
      case 'urgent':
        return 'warning';
      case 'emergency':
        return 'error';
      default:
        return 'default';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'screening_referral':
        return 'primary';
      case 'follow_up':
        return 'secondary';
      case 'emergency':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.875rem' }}>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Home fontSize="small" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard/medical-screening"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Dashboard fontSize="small" />
            Medical Screening
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person fontSize="small" />
            Patient Registration
          </Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Register Student as Patient
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a student who has completed school screening to register them as a patient for medical services.
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

          {/* Student Selection Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Student Selection
            </Typography>
            
            {/* Student Selection Tabs */}
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="School Students" icon={<School />} />
              <Tab label="Manual Registration" icon={<Person />} />
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
                      <MenuItem value="school">By School</MenuItem>
                      <MenuItem value="grade">By Grade</MenuItem>
                      <MenuItem value="recent">Recently Added</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Student List */}
            <Card>
              <CardContent>
                <List>
                  {currentStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      button
                      onClick={() => handleStudentSelect(student)}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedStudent === student.id ? 'primary.main' : 'divider',
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
                        primary={`${student.first_name} ${student.last_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Student Code: {student.student_code}
                              {student.school_name && ` • School: ${student.school_name}`}
                              {student.grade_level && ` • Grade: ${student.grade_level}`}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                icon={<School />}
                                label="School Student"
                                size="small"
                                color="primary"
                              />
                              <Chip
                                icon={<CheckCircle />}
                                label="Screening Completed"
                                size="small"
                                color="success"
                              />
                              <Chip
                                icon={<MedicalServices />}
                                label="Ready for Registration"
                                size="small"
                                color="secondary"
                              />
                            </Box>
                            {student.screening_completed_at && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Screening completed: {new Date(student.screening_completed_at).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box>
                        <Chip
                          label={selectedStudent === student.id ? 'Selected' : 'Select'}
                          color={selectedStudent === student.id ? 'primary' : 'default'}
                          variant={selectedStudent === student.id ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ mt: 3 }}>
                    {/* Pagination Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Page {currentPage} of {totalPages}
                      </Typography>
                    </Box>
                    
                    {/* Pagination Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        siblingCount={1}
                        boundaryCount={1}
                      />
                    </Box>
                  </Box>
                )}
                
                {currentStudents.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      No students found
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleManualStudentAdd}
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

          <Grid container spacing={3}>

            {/* Registration Reason */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Registration Reason</InputLabel>
                <Select
                  value={registrationReason}
                  label="Registration Reason"
                  onChange={(e) => setRegistrationReason(e.target.value)}
                >
                  <MenuItem value="screening_referral">Screening Referral</MenuItem>
                  <MenuItem value="follow_up">Follow-up Visit</MenuItem>
                  <MenuItem value="emergency">Emergency Visit</MenuItem>
                  <MenuItem value="routine_checkup">Routine Checkup</MenuItem>
                  <MenuItem value="treatment">Treatment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Urgency Level */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  value={urgencyLevel}
                  label="Urgency Level"
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Referring Teacher */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Referring Teacher</InputLabel>
                <Select
                  value={referringTeacher}
                  label="Referring Teacher"
                  onChange={(e) => setReferringTeacher(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.first_name} {teacher.last_name} - {teacher.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* School Screening Outcome */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School Screening Outcome"
                multiline
                rows={2}
                value={schoolScreeningOutcome}
                onChange={(e) => setSchoolScreeningOutcome(e.target.value)}
                placeholder="Describe the outcome of the school-based screening..."
              />
            </Grid>

            {/* Medical Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Notes"
                multiline
                rows={4}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Additional medical notes or observations..."
              />
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
                  onClick={handleSubmit}
                  disabled={loading || !selectedStudent || !registrationReason || !urgencyLevel}
                  startIcon={loading ? <CircularProgress size={20} /> : <MedicalServices />}
                >
                  {loading ? 'Registering...' : 'Register as Patient'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Registration History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Patient Registrations
          </Typography>

          <List>
            {registrations.slice(0, 10).map((registration) => (
              <React.Fragment key={registration.registration_id}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {students.find(s => s.id === registration.student_id)?.first_name} {students.find(s => s.id === registration.student_id)?.last_name}
                        </Typography>
                        <Chip
                          label={registration.urgency_level.toUpperCase()}
                          color={getUrgencyColor(registration.urgency_level) as any}
                          size="small"
                        />
                        <Chip
                          label={registration.registration_reason.replace('_', ' ').toUpperCase()}
                          color={getReasonColor(registration.registration_reason) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Registration Date: {new Date(registration.registration_date).toLocaleString()}
                        </Typography>
                        {registration.medical_notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {registration.medical_notes}
                          </Typography>
                        )}
                        {registration.referring_teacher_id && (
                          <Typography variant="body2" color="text.secondary">
                            Referring Teacher: {teachers.find(t => t._id === registration.referring_teacher_id)?.first_name} {teachers.find(t => t._id === registration.referring_teacher_id)?.last_name}
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

      {/* Manual Student Registration Dialog */}
      <Dialog 
        open={manualStudentDialogOpen} 
        onClose={() => setManualStudentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manual Student Registration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Register a new student manually and then register them as a patient.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                required
                placeholder="Enter first name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                required
                placeholder="Enter last name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select label="Gender">
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                placeholder="Enter phone number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="Enter email address"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                placeholder="Enter full address"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>School</InputLabel>
                <Select label="School">
                  <MenuItem value="school1">School 1</MenuItem>
                  <MenuItem value="school2">School 2</MenuItem>
                  <MenuItem value="school3">School 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student ID"
                placeholder="Enter student ID"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualStudentDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<Person />}>
            Register Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Citizen Card Reader Dialog */}
      <Dialog 
        open={citizenCardDialogOpen} 
        onClose={() => setCitizenCardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Citizen Card Reader</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect and read information from a citizen card to automatically register a student.
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <CreditCard />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Card Reader Status
            </Typography>
            <Chip 
              label="Not Connected" 
              color="error" 
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Please connect a citizen card reader device to continue.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Supported Card Types:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              • Thai National ID Card<br/>
              • Student ID Card<br/>
              • Other compatible citizen cards
            </Typography>
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<CreditCard />}
              disabled
            >
              Connect Card Reader
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitizenCardDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" disabled>
            Read Card
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentToPatientRegistration;
