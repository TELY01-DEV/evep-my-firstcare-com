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
  Divider
} from '@mui/material';
import {
  Person,
  School,
  MedicalServices,
  Assignment,
  CheckCircle,
  Warning
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

          <Grid container spacing={3}>
            {/* Student Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Select Student"
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.first_name} {student.last_name} ({student.student_code}) - {student.school_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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
