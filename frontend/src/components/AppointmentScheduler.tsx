import React, { useState, useEffect } from 'react';
import unifiedApi from '../services/unifiedApi';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface Teacher {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school_id: string;
}

interface School {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

interface Appointment {
  _id: string;
  patient_id: string;
  patient_name: string;
  school_id: string;
  school_name: string;
  grade: string;
  teacher_id: string;
  teacher_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  created_at: string;
}

const AppointmentScheduler: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
    loadAppointments();
  }, []);

  // Load teachers when school is selected
  useEffect(() => {
    if (selectedSchool) {
      loadTeachers();
      setSelectedGrade('');
      setSelectedTeacher('');
    } else {
      setTeachers([]);
      setSelectedGrade('');
      setSelectedTeacher('');
    }
  }, [selectedSchool]);

  const loadSchools = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/evep/schools');
      setSchools(response.data?.schools || []);
    } catch (err) {
      console.error('Error loading schools:', err);
      setError('Failed to load schools');
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await unifiedApi.get(`/api/v1/evep/teachers?school_id=${selectedSchool}`);
      setTeachers(response.data || []);
    } catch (err) {
      console.error('Error loading teachers:', err);
      setError('Failed to load teachers');
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/appointments');
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSchool('');
    setSelectedGrade('');
    setSelectedTeacher('');
    setAppointmentDate(null);
    setStartTime(null);
    setEndTime(null);
    setNotes('');
    setAvailableSlots([]);
  };

  const isSlotSelected = (slot: TimeSlot) => {
    if (!startTime || !endTime) return false;
    const [startHour, startMin] = slot.start_time.split(':').map(Number);
    const [endHour, endMin] = slot.end_time.split(':').map(Number);
    const slotStart = new Date();
    slotStart.setHours(startHour, startMin);
    const slotEnd = new Date();
    slotEnd.setHours(endHour, endMin);
    
    return startTime.getTime() === slotStart.getTime() && endTime.getTime() === slotEnd.getTime();
  };

  const handleSubmit = async () => {
    if (!selectedSchool || !selectedGrade || !selectedTeacher || !appointmentDate || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        school_id: selectedSchool,
        grade: selectedGrade,
        teacher_id: selectedTeacher,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: startTime.toTimeString().split(' ')[0],
        end_time: endTime.toTimeString().split(' ')[0],
        notes: notes,
        status: 'scheduled'
      };

      await unifiedApi.post('/api/v1/appointments', appointmentData);
      setSuccess('Appointment scheduled successfully!');
      handleClose();
      loadAppointments();
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setError('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Schedule Hospital Screening Appointment
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Schedule New Appointment
        </Button>
      </Box>

      {/* Appointments List */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Scheduled Appointments
        </Typography>
        {appointments.length === 0 ? (
          <Typography color="textSecondary">No appointments scheduled</Typography>
        ) : (
          <Grid container spacing={2}>
            {appointments.map((appointment) => (
              <Grid item xs={12} md={6} lg={4} key={appointment._id}>
                <Paper sx={{ p: 2, border: 1, borderColor: 'grey.300' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {appointment.patient_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    School: {appointment.school_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Grade: {appointment.grade}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Date: {formatDate(appointment.appointment_date)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Time: {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </Typography>
                  <Chip
                    label={appointment.status}
                    color={getStatusColor(appointment.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Schedule Appointment Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* School Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select School</InputLabel>
                <Select
                  value={selectedSchool}
                  label="Select School"
                  onChange={(e) => setSelectedSchool(e.target.value)}
                >
                  <MenuItem value="">Select a School</MenuItem>
                  {schools.map((school) => (
                    <MenuItem key={school._id} value={school._id}>
                      {school.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Grade Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Grade</InputLabel>
                <Select
                  value={selectedGrade}
                  label="Select Grade"
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <MenuItem value="">Select a Grade</MenuItem>
                  <MenuItem value="Grade 1">Grade 1</MenuItem>
                  <MenuItem value="Grade 2">Grade 2</MenuItem>
                  <MenuItem value="Grade 3">Grade 3</MenuItem>
                  <MenuItem value="Grade 4">Grade 4</MenuItem>
                  <MenuItem value="Grade 5">Grade 5</MenuItem>
                  <MenuItem value="Grade 6">Grade 6</MenuItem>
                  <MenuItem value="Grade 7">Grade 7</MenuItem>
                  <MenuItem value="Grade 8">Grade 8</MenuItem>
                  <MenuItem value="Grade 9">Grade 9</MenuItem>
                  <MenuItem value="Grade 10">Grade 10</MenuItem>
                  <MenuItem value="Grade 11">Grade 11</MenuItem>
                  <MenuItem value="Grade 12">Grade 12</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Teacher Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Teacher</InputLabel>
                <Select
                  value={selectedTeacher}
                  label="Select Teacher"
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  disabled={!selectedSchool}
                >
                  <MenuItem value="">Select a Teacher</MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.first_name} {teacher.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Appointment Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Appointment Date"
                type="date"
                value={appointmentDate ? appointmentDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setAppointmentDate(date);
                }}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Available Time Slots */}
            {selectedSchool && appointmentDate && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Time Slots
                  </Typography>
                  {loadingSlots ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {availableSlots.map((slot, index) => (
                        <Chip
                          key={index}
                          label={`${slot.start_time} - ${slot.end_time}`}
                          color={slot.available ? 'primary' : 'default'}
                          variant={isSlotSelected(slot) ? 'filled' : 'outlined'}
                          onClick={() => {
                            if (slot.available) {
                              const [startHour, startMin] = slot.start_time.split(':').map(Number);
                              const [endHour, endMin] = slot.end_time.split(':').map(Number);
                              const startDate = new Date(appointmentDate);
                              startDate.setHours(startHour, startMin);
                              const endDate = new Date(appointmentDate);
                              endDate.setHours(endHour, endMin);
                              setStartTime(startDate);
                              setEndTime(endDate);
                            }
                          }}
                          disabled={!slot.available}
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the appointment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !selectedSchool || !selectedGrade || !selectedTeacher || !appointmentDate || !startTime || !endTime}
          >
            {loading ? <CircularProgress size={20} /> : 'Schedule Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentScheduler;
