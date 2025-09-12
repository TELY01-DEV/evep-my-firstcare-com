import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person,
  School,
  FamilyRestroom,
  MedicalServices,
  Save,
  Clear,
  Add,
  Remove,
} from '@mui/icons-material';

interface PatientRegistrationFormProps {
  onSubmit: (patientData: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: any;
}

interface PatientFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  
  // Parent/Guardian Information
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  emergency_contact: string;
  emergency_phone: string;
  
  // School Information
  school: string;
  grade: string;
  student_id: string;
  
  // Medical Information
  medical_history: string;
  allergies: string[];
  medications: string[];
  family_vision_history: string;
  
  // Insurance Information
  insurance_provider: string;
  insurance_number: string;
  insurance_group: string;
  
  // Address Information
  address: string;
  city: string;
  postal_code: string;
  
  // Consent
  consent_forms: {
    medical_treatment: boolean;
    data_sharing: boolean;
    photo_consent: boolean;
    emergency_contact: boolean;
  };
}

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    emergency_contact: '',
    emergency_phone: '',
    school: '',
    grade: '',
    student_id: '',
    medical_history: '',
    allergies: [],
    medications: [],
    family_vision_history: '',
    insurance_provider: '',
    insurance_number: '',
    insurance_group: '',
    address: '',
    city: '',
    postal_code: '',
    consent_forms: {
      medical_treatment: false,
      data_sharing: false,
      photo_consent: false,
      emergency_contact: false,
    },
    ...initialData,
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const steps = [
    'Personal Information',
    'Parent/Guardian Information',
    'School Information',
    'Medical History',
    'Insurance Information',
    'Address Information',
    'Consent Forms',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConsentChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      consent_forms: {
        ...prev.consent_forms,
        [field]: value,
      },
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy),
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !formData.medications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()],
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m !== medication),
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const renderPersonalInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={formData.first_name}
          onChange={(e) => handleInputChange('first_name', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.gender}
            label="Gender"
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderParentInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Parent/Guardian Name"
          value={formData.parent_name}
          onChange={(e) => handleInputChange('parent_name', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FamilyRestroom />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Parent Phone"
          value={formData.parent_phone}
          onChange={(e) => handleInputChange('parent_phone', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Parent Email"
          type="email"
          value={formData.parent_email}
          onChange={(e) => handleInputChange('parent_email', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Emergency Contact Name"
          value={formData.emergency_contact}
          onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Emergency Contact Phone"
          value={formData.emergency_phone}
          onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
          required
        />
      </Grid>
    </Grid>
  );

  const renderSchoolInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="School Name"
          value={formData.school}
          onChange={(e) => handleInputChange('school', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <School />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Grade"
          value={formData.grade}
          onChange={(e) => handleInputChange('grade', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Student ID"
          value={formData.student_id}
          onChange={(e) => handleInputChange('student_id', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderMedicalHistory = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Medical History"
          multiline
          rows={4}
          value={formData.medical_history}
          onChange={(e) => handleInputChange('medical_history', e.target.value)}
          placeholder="Please describe any relevant medical history..."
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Family Vision History"
          multiline
          rows={3}
          value={formData.family_vision_history}
          onChange={(e) => handleInputChange('family_vision_history', e.target.value)}
          placeholder="Any family history of vision problems..."
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Allergies
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            label="Add Allergy"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
          />
          <Button
            variant="outlined"
            onClick={addAllergy}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {formData.allergies.map((allergy) => (
            <Chip
              key={allergy}
              label={allergy}
              onDelete={() => removeAllergy(allergy)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Current Medications
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            label="Add Medication"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMedication()}
          />
          <Button
            variant="outlined"
            onClick={addMedication}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {formData.medications.map((medication) => (
            <Chip
              key={medication}
              label={medication}
              onDelete={() => removeMedication(medication)}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Box>
      </Grid>
    </Grid>
  );

  const renderInsuranceInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Insurance Provider"
          value={formData.insurance_provider}
          onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Insurance Number"
          value={formData.insurance_number}
          onChange={(e) => handleInputChange('insurance_number', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Insurance Group"
          value={formData.insurance_group}
          onChange={(e) => handleInputChange('insurance_group', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderAddressInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Postal Code"
          value={formData.postal_code}
          onChange={(e) => handleInputChange('postal_code', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderConsentForms = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Consent Forms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please review and consent to the following forms:
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.consent_forms.medical_treatment}
                onChange={(e) => handleConsentChange('medical_treatment', e.target.checked)}
              />
            }
            label="I consent to medical treatment and vision screening"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.consent_forms.data_sharing}
                onChange={(e) => handleConsentChange('data_sharing', e.target.checked)}
              />
            }
            label="I consent to data sharing with authorized healthcare providers"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.consent_forms.photo_consent}
                onChange={(e) => handleConsentChange('photo_consent', e.target.checked)}
              />
            }
            label="I consent to photographs for medical documentation"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.consent_forms.emergency_contact}
                onChange={(e) => handleConsentChange('emergency_contact', e.target.checked)}
              />
            }
            label="I consent to emergency contact procedures"
          />
        </FormGroup>
      </Grid>
    </Grid>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderPersonalInformation();
      case 1:
        return renderParentInformation();
      case 2:
        return renderSchoolInformation();
      case 3:
        return renderMedicalHistory();
      case 4:
        return renderInsuranceInformation();
      case 5:
        return renderAddressInformation();
      case 6:
        return renderConsentForms();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Patient Registration
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent()}
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Button
            onClick={onCancel}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Box display="flex" gap={2}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outlined"
                disabled={loading}
              >
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Saving...' : 'Register Patient'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatientRegistrationForm;
