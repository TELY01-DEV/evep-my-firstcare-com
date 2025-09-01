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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface StudentToPatientRegistrationProps {
  appointmentId?: string;
  onRegistrationComplete?: (registration: any) => void;
  onCancel?: () => void;
}

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  grade_level: string;
  school_name: string;
  parent_id: string;
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
      const response = await axios.get('/api/v1/evep/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (err: any) {
      setError('Failed to load students');
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await axios.get('/api/v1/evep/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data.teachers || []);
    } catch (err: any) {
      setError('Failed to load teachers');
    }
  };

  const loadRegistrations = async () => {
    try {
      const response = await axios.get('/api/v1/patients/registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data || []);
    } catch (err: any) {
      setError('Failed to load registrations');
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
      (filterType === 'recent' && student._id); // For recent students
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student._id);
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

      const response = await axios.post(
        '/api/v1/patients/register-from-student',
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Register Student as Patient
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
                      key={student._id}
                      button
                      onClick={() => handleStudentSelect(student)}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedStudent === student._id ? 'primary.main' : 'divider',
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
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={<School />}
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
                        <Chip
                          label={selectedStudent === student._id ? 'Selected' : 'Select'}
                          color={selectedStudent === student._id ? 'primary' : 'default'}
                          variant={selectedStudent === student._id ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                    />
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
                          {students.find(s => s._id === registration.student_id)?.first_name} {students.find(s => s._id === registration.student_id)?.last_name}
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
    </Box>
  );
};

export default StudentToPatientRegistration;
