import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Patient {
  patient_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_email: string;
  parent_phone?: string;
  school_name?: string;
  grade?: string;
  medical_history?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  insurance_info?: string;
  notes?: string;
}

interface PatientFormProps {
  patient?: Patient | null;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSave,
  onCancel,
  mode
}) => {
  const [formData, setFormData] = useState<Patient>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    parent_email: '',
    parent_phone: '',
    school_name: '',
    grade: '',
    medical_history: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    insurance_info: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Patient>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load patient data when editing
  useEffect(() => {
    if (patient && mode === 'edit') {
      setFormData(patient);
    }
  }, [patient, mode]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<Patient> = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.parent_email.trim()) {
      newErrors.parent_email = 'Parent email is required';
    } else if (!isValidEmail(formData.parent_email)) {
      newErrors.parent_email = 'Please enter a valid email address';
    }

    // Optional field validations
    if (formData.parent_phone && !isValidPhone(formData.parent_phone)) {
      newErrors.parent_phone = 'Please enter a valid phone number';
    }
    if (formData.emergency_phone && !isValidPhone(formData.emergency_phone)) {
      newErrors.emergency_phone = 'Please enter a valid phone number';
    }

    // Date validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 25) {
        newErrors.date_of_birth = 'Patient age should be between 0 and 25 years';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Handle form field changes
  const handleChange = (field: keyof Patient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('evep_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const url = mode === 'add' 
        ? `${baseUrl}/api/v1/patients/`
        : `${baseUrl}/api/v1/patients/${patient?.patient_id}`;

      const method = mode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const savedPatient = await response.json();
      toast.success(`Patient ${mode === 'add' ? 'added' : 'updated'} successfully`);
      onSave(savedPatient);
    } catch (err) {
      console.error('Error saving patient:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(formData.date_of_birth);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ mr: 2, bgcolor: '#9B7DCF' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2">
              {mode === 'add' ? 'Add New Patient' : 'Edit Patient'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'add' ? 'Enter patient information below' : 'Update patient information'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Basic Information */}
        <Typography variant="h6" gutterBottom sx={{ color: '#9B7DCF', mb: 2 }}>
          Basic Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              error={!!errors.date_of_birth}
              helperText={errors.date_of_birth || (age !== null ? `${age} years old` : '')}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.gender} required>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                label="Gender"
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>

        {/* Parent/Guardian Information */}
        <Typography variant="h6" gutterBottom sx={{ color: '#9B7DCF', mb: 2 }}>
          Parent/Guardian Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Email"
              type="email"
              value={formData.parent_email}
              onChange={(e) => handleChange('parent_email', e.target.value)}
              error={!!errors.parent_email}
              helperText={errors.parent_email}
              required
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Phone"
              value={formData.parent_phone || ''}
              onChange={(e) => handleChange('parent_phone', e.target.value)}
              error={!!errors.parent_phone}
              helperText={errors.parent_phone || 'Optional'}
              placeholder="+1234567890"
            />
          </Grid>
        </Grid>

        {/* School Information */}
        <Typography variant="h6" gutterBottom sx={{ color: '#9B7DCF', mb: 2 }}>
          School Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="School Name"
              value={formData.school_name || ''}
              onChange={(e) => handleChange('school_name', e.target.value)}
              placeholder="Enter school name"
              InputProps={{
                startAdornment: <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Grade"
              value={formData.grade || ''}
              onChange={(e) => handleChange('grade', e.target.value)}
              placeholder="e.g., 3rd Grade"
            />
          </Grid>
        </Grid>

        {/* Emergency Contact */}
        <Typography variant="h6" gutterBottom sx={{ color: '#9B7DCF', mb: 2 }}>
          Emergency Contact
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              value={formData.emergency_contact || ''}
              onChange={(e) => handleChange('emergency_contact', e.target.value)}
              placeholder="Name of emergency contact"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              value={formData.emergency_phone || ''}
              onChange={(e) => handleChange('emergency_phone', e.target.value)}
              error={!!errors.emergency_phone}
              helperText={errors.emergency_phone || 'Optional'}
              placeholder="+1234567890"
            />
          </Grid>
        </Grid>

        {/* Additional Information */}
        <Typography variant="h6" gutterBottom sx={{ color: '#9B7DCF', mb: 2 }}>
          Additional Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              multiline
              rows={2}
              placeholder="Patient's address"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medical History"
              value={formData.medical_history || ''}
              onChange={(e) => handleChange('medical_history', e.target.value)}
              multiline
              rows={3}
              placeholder="Any relevant medical history, allergies, or conditions"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Insurance Information"
              value={formData.insurance_info || ''}
              onChange={(e) => handleChange('insurance_info', e.target.value)}
              placeholder="Insurance provider and policy number"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              multiline
              rows={2}
              placeholder="Additional notes or comments"
            />
          </Grid>
        </Grid>

        {/* Form Actions */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={submitting}
            sx={{ backgroundColor: '#9B7DCF', '&:hover': { backgroundColor: '#8A6BCF' } }}
          >
            {submitting ? 'Saving...' : mode === 'add' ? 'Add Patient' : 'Update Patient'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientForm;
