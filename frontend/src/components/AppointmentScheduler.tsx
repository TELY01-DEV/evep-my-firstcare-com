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
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface AppointmentSchedulerProps {
  onAppointmentCreated?: (appointment: any) => void;
  onCancel?: () => void;
}

interface School {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  conflicting_appointments?: string[];
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  onAppointmentCreated,
  onCancel
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedSchool, setSelectedSchool] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [screeningType, setScreeningType] = useState('');
  const [expectedStudents, setExpectedStudents] = useState('');
  const [notes, setNotes] = useState('');
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [staffRequirements, setStaffRequirements] = useState<string[]>([]);

  // Data state
  const [schools, setSchools] = useState<School[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Temporary input states
  const [newEquipment, setNewEquipment] = useState('');
  const [newStaffRequirement, setNewStaffRequirement] = useState('');

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
  }, []);

  // Load available slots when school and date change
  useEffect(() => {
    if (selectedSchool && appointmentDate) {
      loadAvailableSlots();
    }
  }, [selectedSchool, appointmentDate]);

  const loadSchools = async () => {
    try {
      const response = await axios.get('/api/v1/evep/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchools(response.data.schools || []);
    } catch (err: any) {
      setError('Failed to load schools');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedSchool || !appointmentDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = appointmentDate.toISOString().split('T')[0];
      const response = await axios.get(
        `/api/v1/appointments/available-slots?school_id=${selectedSchool}&date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAvailableSlots(response.data.time_slots || []);
    } catch (err: any) {
      setError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setEquipmentNeeded(prev => [...prev, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentNeeded(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddStaffRequirement = () => {
    if (newStaffRequirement.trim()) {
      setStaffRequirements(prev => [...prev, newStaffRequirement.trim()]);
      setNewStaffRequirement('');
    }
  };

  const handleRemoveStaffRequirement = (index: number) => {
    setStaffRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedSchool || !appointmentDate || !startTime || !endTime || !screeningType || !expectedStudents) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appointmentData = {
        school_id: selectedSchool,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: startTime.toTimeString().slice(0, 5),
        end_time: endTime.toTimeString().slice(0, 5),
        screening_type: screeningType,
        expected_students: parseInt(expectedStudents),
        notes: notes || undefined,
        equipment_needed: equipmentNeeded.length > 0 ? equipmentNeeded : undefined,
        staff_requirements: staffRequirements.length > 0 ? staffRequirements : undefined
      };

      const response = await axios.post(
        '/api/v1/appointments',
        appointmentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Appointment scheduled successfully!');
      if (onAppointmentCreated) {
        onAppointmentCreated(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const isSlotSelected = (slot: TimeSlot) => {
    if (!startTime || !endTime) return false;
    const selectedStart = startTime.toTimeString().slice(0, 5);
    const selectedEnd = endTime.toTimeString().slice(0, 5);
    return slot.start_time === selectedStart && slot.end_time === selectedEnd;
  };

  return (
    <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Schedule Hospital Screening Appointment
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
            {/* School Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select School</InputLabel>
                <Select
                  value={selectedSchool}
                  label="Select School"
                  onChange={(e) => setSelectedSchool(e.target.value)}
                >
                  {schools.map((school) => (
                    <MenuItem key={school._id} value={school._id}>
                      {school.name}
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

            {/* Time Selection */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={startTime ? startTime.toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  if (e.target.value && appointmentDate) {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newStartTime = new Date(appointmentDate);
                    newStartTime.setHours(hours, minutes);
                    setStartTime(newStartTime);
                  }
                }}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={endTime ? endTime.toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  if (e.target.value && appointmentDate) {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newEndTime = new Date(appointmentDate);
                    newEndTime.setHours(hours, minutes);
                    setEndTime(newEndTime);
                  }
                }}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Screening Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Screening Type</InputLabel>
                <Select
                  value={screeningType}
                  label="Screening Type"
                  onChange={(e) => setScreeningType(e.target.value)}
                >
                  <MenuItem value="comprehensive">Comprehensive Eye Screening</MenuItem>
                  <MenuItem value="distance_vision">Distance Vision Screening</MenuItem>
                  <MenuItem value="near_vision">Near Vision Screening</MenuItem>
                  <MenuItem value="color_vision">Color Vision Screening</MenuItem>
                  <MenuItem value="depth_perception">Depth Perception Screening</MenuItem>
                  <MenuItem value="follow_up">Follow-up Screening</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Expected Students */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Number of Students"
                type="number"
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(e.target.value)}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Equipment Needed */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Equipment Needed
              </Typography>
              <Box sx={{ mb: 2 }}>
                {equipmentNeeded.map((equipment, index) => (
                  <Chip
                    key={index}
                    label={equipment}
                    onDelete={() => handleRemoveEquipment(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add equipment needed..."
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                />
                <Button variant="outlined" onClick={handleAddEquipment}>
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Staff Requirements */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Staff Requirements
              </Typography>
              <Box sx={{ mb: 2 }}>
                {staffRequirements.map((requirement, index) => (
                  <Chip
                    key={index}
                    label={requirement}
                    onDelete={() => handleRemoveStaffRequirement(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add staff requirement..."
                  value={newStaffRequirement}
                  onChange={(e) => setNewStaffRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStaffRequirement()}
                />
                <Button variant="outlined" onClick={handleAddStaffRequirement}>
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or special requirements..."
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button variant="outlined" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !selectedSchool || !appointmentDate || !startTime || !endTime || !screeningType || !expectedStudents}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
  );
};

export default AppointmentScheduler;
