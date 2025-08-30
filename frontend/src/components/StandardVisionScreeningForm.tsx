import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Warning,
  Info,
  LocalHospital,
  Person,
  School,
  Schedule,
  Assignment,
  HowToReg,
  CheckCircleOutline,
  Save,
  Send,
  ArrowBack,
  Add,
  Search,
  FilterList,
  Assessment,
  RemoveRedEye,
  ColorLens,
  ThreeDRotation,
  CheckCircle,
  Cancel,
  PhotoCamera,
  PhotoLibrary,
  Delete,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  school?: string;
  grade?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  photos?: string[]; // Array of photo URLs/base64 strings
}

interface VisionResults {
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
  glasses_prescription?: {
    left_eye_sphere?: string;
    right_eye_sphere?: string;
    left_eye_cylinder?: string;
    right_eye_cylinder?: string;
    left_eye_axis?: string;
    right_eye_axis?: string;
    pupillary_distance?: string;
  };
}

interface StandardVisionScreeningFormProps {
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

const StandardVisionScreeningForm: React.FC<StandardVisionScreeningFormProps> = ({
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [patientTab, setPatientTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // New patient registration states
  const [newPatientDialog, setNewPatientDialog] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    school: '',
    grade: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    photos: [] as string[]
  });

  // Screening states
  const [screeningType, setScreeningType] = useState('comprehensive');
  const [equipmentUsed, setEquipmentUsed] = useState('');
  const [screeningResults, setScreeningResults] = useState<VisionResults>({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal',
    depth_perception: 'normal',
    notes: '',
    recommendations: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  const steps = [
    'Patient Selection',
    'Screening Setup',
    'Vision Assessment',
    'Results & Recommendations',
    'Complete Screening'
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      const response = await fetch('http://localhost:8013/api/v1/patient_management/api/v1/patients/', {
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
    } catch (error) {
      console.error('Error fetching patients:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching patients',
        severity: 'error'
      });
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddNewPatient = () => {
    if (newPatientData.first_name && newPatientData.last_name) {
      const tempPatient: Patient = {
        _id: `temp_${Date.now()}`,
        first_name: newPatientData.first_name,
        last_name: newPatientData.last_name,
        date_of_birth: newPatientData.date_of_birth,
        gender: newPatientData.gender,
        school: newPatientData.school,
        grade: newPatientData.grade,
        parent_name: newPatientData.parent_name,
        parent_phone: newPatientData.parent_phone,
        address: newPatientData.address,
        photos: newPatientData.photos
      };
      setSelectedPatient(tempPatient);
      setNewPatientData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        school: '',
        grade: '',
        parent_name: '',
        parent_phone: '',
        address: '',
        photos: []
      });
    }
  };

  const handleScreeningComplete = async () => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Please add patient information before completing the screening',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('evep_token');
      const screeningData = {
        patient_id: selectedPatient._id,
        patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        examiner_id: user?.user_id,
        examiner_name: `${user?.first_name} ${user?.last_name}`,
        screening_type: screeningType,
        equipment_used: equipmentUsed,
        results: screeningResults,
        screening_date: new Date().toISOString(),
        status: 'completed'
      };

      const response = await fetch('http://localhost:8013/api/v1/screenings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screeningData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Screening completed successfully',
          severity: 'success'
        });
        onComplete?.(screeningData);
      } else {
        throw new Error('Failed to save screening results');
      }
    } catch (error) {
      console.error('Error completing screening:', error);
      setSnackbar({
        open: true,
        message: 'Error completing screening',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (newPatientData.photos.length < 3) {
          setNewPatientData({
            ...newPatientData,
            photos: [...newPatientData.photos, result]
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCapture = () => {
    // This would integrate with device camera
    // For now, we'll simulate with a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (newPatientData.photos.length < 3) {
            setNewPatientData({
              ...newPatientData,
              photos: [...newPatientData.photos, result]
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removePhoto = (index: number) => {
    setNewPatientData({
      ...newPatientData,
      photos: newPatientData.photos.filter((_, i) => i !== index)
    });
  };

  const renderPhotoUploadSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Patient Photos (Max 3)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload or capture photos to help identify the patient during screening
        </Typography>
        
        <Grid container spacing={2}>
          {/* Photo Display */}
          {newPatientData.photos.map((photo, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card sx={{ position: 'relative' }}>
                <CardContent sx={{ p: 1 }}>
                  <img 
                    src={photo} 
                    alt={`Patient photo ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ 
                      position: 'absolute', 
                      top: 4, 
                      right: 4,
                      bgcolor: 'rgba(255,255,255,0.8)'
                    }}
                    onClick={() => removePhoto(index)}
                  >
                    <Delete />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {/* Upload Buttons */}
          {newPatientData.photos.length < 3 && (
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                height: '150px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload">
                    <IconButton
                      component="span"
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      <PhotoLibrary />
                    </IconButton>
                  </label>
                  <Typography variant="body2" color="primary">
                    Upload Photo
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {newPatientData.photos.length < 3 && (
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                height: '150px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'secondary.main',
                bgcolor: 'secondary.50'
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <IconButton
                    color="secondary"
                    sx={{ mb: 1 }}
                    onClick={handlePhotoCapture}
                  >
                    <PhotoCamera />
                  </IconButton>
                  <Typography variant="body2" color="secondary">
                    Take Photo
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {newPatientData.photos.length >= 3 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Maximum 3 photos reached. Remove a photo to add more.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderPatientProfile = () => {
    if (!selectedPatient) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">No Patient Selected</Typography>
          <Typography variant="body2">
            Patient information will be added in the Results & Recommendations step.
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
      <Card sx={{ 
        mb: 3, 
        bgcolor: 'primary.50', 
        border: '2px solid', 
        borderColor: 'primary.main',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography 
              variant="h6" 
              color="primary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}
            >
              <Person sx={{ mr: 1.5, fontSize: '1.5rem' }} />
              Patient Profile
            </Typography>
            <Chip 
              label="Active Patient" 
              color="primary" 
              size="small" 
              variant="filled"
              sx={{ 
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
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
              
              {/* Patient Photos Display */}
              {selectedPatient.photos && selectedPatient.photos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Patient Photos ({selectedPatient.photos.length}/3)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {selectedPatient.photos.map((photo, index) => (
                      <Box
                        key={index}
                        sx={{
                          minWidth: 80,
                          height: 80,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Patient photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Chip
                          label={`${index + 1}`}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
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
                  <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.gender || 'Not specified'}
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
                  <Typography variant="subtitle2" color="text.secondary">Parent Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.parent_name || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Parent Phone</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPatient.parent_phone || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
              {selectedPatient.address && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPatient.address}
                    </Typography>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderScreeningForm = () => {
    switch (screeningType) {
      case 'comprehensive':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distance Vision
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.left_eye_distance}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          left_eye_distance: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.right_eye_distance}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          right_eye_distance: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Near Vision
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.left_eye_near}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          left_eye_near: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.right_eye_near}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          right_eye_near: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Color Vision
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={screeningResults.color_vision}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        color_vision: e.target.value as 'normal' | 'deficient' | 'failed'
                      })}
                    >
                      <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                      <FormControlLabel value="deficient" control={<Radio />} label="Deficient" />
                      <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Depth Perception
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={screeningResults.depth_perception}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        depth_perception: e.target.value as 'normal' | 'impaired' | 'failed'
                      })}
                    >
                      <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                      <FormControlLabel value="impaired" control={<Radio />} label="Impaired" />
                      <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'basic':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distance Vision
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.left_eye_distance}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          left_eye_distance: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.right_eye_distance}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          right_eye_distance: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Near Vision
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.left_eye_near}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          left_eye_near: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.right_eye_near}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          right_eye_near: e.target.value
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'color':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Color Vision Test (Ishihara)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Test patient's ability to identify numbers in colored circles
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">Test Results</FormLabel>
                        <RadioGroup
                          value={screeningResults.color_vision}
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            color_vision: e.target.value as 'normal' | 'deficient' | 'failed'
                          })}
                        >
                          <FormControlLabel value="normal" control={<Radio />} label="Normal (All plates correct)" />
                          <FormControlLabel value="deficient" control={<Radio />} label="Color Deficient (Some errors)" />
                          <FormControlLabel value="failed" control={<Radio />} label="Failed (Many errors)" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Test Notes"
                        value={screeningResults.notes}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          notes: e.target.value
                        })}
                        placeholder="Record specific plates that were missed or any observations..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'depth':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Depth Perception Test (Stereopsis)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Test patient's ability to perceive depth using stereoscopic images
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">Test Results</FormLabel>
                        <RadioGroup
                          value={screeningResults.depth_perception}
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            depth_perception: e.target.value as 'normal' | 'impaired' | 'failed'
                          })}
                        >
                          <FormControlLabel value="normal" control={<Radio />} label="Normal Depth Perception" />
                          <FormControlLabel value="impaired" control={<Radio />} label="Impaired Depth Perception" />
                          <FormControlLabel value="failed" control={<Radio />} label="Failed (No depth perception)" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Test Notes"
                        value={screeningResults.notes}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          notes: e.target.value
                        })}
                        placeholder="Record specific test results, distance tested, or observations..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return (
          <Alert severity="warning">
            Please select a screening type in the previous step.
          </Alert>
        );
    }
  };

  const renderWorkflowStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Patient for Standard Vision Screening
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a patient to conduct standard vision screening or start without a patient.
            </Typography>

            <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      Start Workflow Without Patient
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Begin the standard vision screening workflow and add patient information later
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Assessment />}
                    onClick={() => {
                      setSelectedPatient(null);
                      setActiveStep(1); // Move to Screening Setup step
                    }}
                  >
                    Start Workflow
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Tabs value={patientTab} onChange={(e, newValue) => setPatientTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Search Patients" />
              <Tab label="Add New Patient" />
            </Tabs>

            {patientTab === 0 && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      placeholder="Search patients by name, ID, or school..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Status</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Filter by Status"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All Patients</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <List>
                  {patients
                    .filter(patient => 
                      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.school?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((patient) => (
                      <ListItem
                        key={patient._id}
                        sx={{
                          border: selectedPatient?._id === patient._id ? '2px solid' : '1px solid',
                          borderColor: selectedPatient?._id === patient._id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${patient.first_name} ${patient.last_name}`}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
                              </Typography>
                              <Typography variant="body2">
                                School: {patient.school || 'N/A'} • Grade: {patient.grade || 'N/A'}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={selectedPatient?._id === patient._id ? 'Selected' : 'Select'}
                          color={selectedPatient?._id === patient._id ? 'primary' : 'default'}
                          variant={selectedPatient?._id === patient._id ? 'filled' : 'outlined'}
                        />
                      </ListItem>
                    ))}
                </List>
              </Box>
            )}

            {patientTab === 1 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Add New Patient Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={newPatientData.first_name}
                      onChange={(e) => setNewPatientData({...newPatientData, first_name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={newPatientData.last_name}
                      onChange={(e) => setNewPatientData({...newPatientData, last_name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={newPatientData.date_of_birth}
                      onChange={(e) => setNewPatientData({...newPatientData, date_of_birth: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Gender"
                      value={newPatientData.gender}
                      onChange={(e) => setNewPatientData({...newPatientData, gender: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="School"
                      value={newPatientData.school}
                      onChange={(e) => setNewPatientData({...newPatientData, school: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Grade"
                      value={newPatientData.grade}
                      onChange={(e) => setNewPatientData({...newPatientData, grade: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Parent Name"
                      value={newPatientData.parent_name}
                      onChange={(e) => setNewPatientData({...newPatientData, parent_name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Parent Phone"
                      value={newPatientData.parent_phone}
                      onChange={(e) => setNewPatientData({...newPatientData, parent_phone: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      value={newPatientData.address}
                      onChange={(e) => setNewPatientData({...newPatientData, address: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleAddNewPatient}
                      startIcon={<Add />}
                      fullWidth
                    >
                      Add New Patient
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {selectedPatient && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Selected Patient: {selectedPatient.first_name} {selectedPatient.last_name}
                </Typography>
                <Typography variant="body2">
                  Age: {new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} years • 
                  School: {selectedPatient.school || 'N/A'} • 
                  Grade: {selectedPatient.grade || 'N/A'}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Screening Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure the screening parameters and equipment for the standard vision assessment.
            </Typography>
            
            {renderPatientProfile()}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Screening Type</InputLabel>
                  <Select
                    value={screeningType}
                    label="Screening Type"
                    onChange={(e) => setScreeningType(e.target.value)}
                  >
                    <MenuItem value="comprehensive">Comprehensive Vision Screening</MenuItem>
                    <MenuItem value="basic">Basic Vision Screening</MenuItem>
                    <MenuItem value="color">Color Vision Test</MenuItem>
                    <MenuItem value="depth">Depth Perception Test</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Equipment Used"
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  placeholder="e.g., Snellen Chart, Ishihara Test, Stereoscope"
                />
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screening Instructions:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul>
                      <li>Ensure proper lighting conditions (500-1000 lux)</li>
                      <li>Position patient at appropriate distance from chart</li>
                      <li>Test each eye separately with proper occlusion</li>
                      <li>Record results accurately for both distance and near vision</li>
                      <li>Perform color vision and depth perception tests as needed</li>
                    </ul>
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Vision Assessment - {screeningType.charAt(0).toUpperCase() + screeningType.slice(1)} Screening
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Conduct the {screeningType} screening tests and record the results.
            </Typography>
            
            {renderPatientProfile()}

            {renderScreeningForm()}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Results & Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review the screening results and provide recommendations.
            </Typography>

            {renderPatientProfile()}

            {!selectedPatient && (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  No patient selected. Please add patient information to complete the screening.
                </Alert>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Patient Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={newPatientData.first_name}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            first_name: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={newPatientData.last_name}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            last_name: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          value={newPatientData.date_of_birth}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            date_of_birth: e.target.value
                          })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Gender"
                          value={newPatientData.gender}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            gender: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="School"
                          value={newPatientData.school}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            school: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Grade"
                          value={newPatientData.grade}
                          onChange={(e) => setNewPatientData({
                            ...newPatientData,
                            grade: e.target.value
                          })}
                        />
                      </Grid>
                    </Grid>
                    
                    {renderPhotoUploadSection()}
                    
                    <Button
                      variant="contained"
                      onClick={handleAddNewPatient}
                      startIcon={<Add />}
                      sx={{ mt: 2 }}
                    >
                      Register Patient
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Screening Results Summary
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Distance Vision (L/R)</strong></TableCell>
                            <TableCell>{screeningResults.left_eye_distance || 'N/A'} / {screeningResults.right_eye_distance || 'N/A'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Near Vision (L/R)</strong></TableCell>
                            <TableCell>{screeningResults.left_eye_near || 'N/A'} / {screeningResults.right_eye_near || 'N/A'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Color Vision</strong></TableCell>
                            <TableCell>{screeningResults.color_vision}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Depth Perception</strong></TableCell>
                            <TableCell>{screeningResults.depth_perception}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommendations & Follow-up
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Recommendations"
                      value={screeningResults.recommendations}
                      onChange={(e) => setScreeningResults({
                        ...screeningResults,
                        recommendations: e.target.value
                      })}
                      placeholder="Provide specific recommendations based on screening results..."
                    />
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={screeningResults.follow_up_required}
                            onChange={(e) => setScreeningResults({
                              ...screeningResults,
                              follow_up_required: e.target.checked
                            })}
                          />
                        }
                        label="Follow-up Required"
                      />
                    </Box>
                    {screeningResults.follow_up_required && (
                      <TextField
                        fullWidth
                        type="date"
                        label="Follow-up Date"
                        value={screeningResults.follow_up_date}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          follow_up_date: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  value={screeningResults.notes}
                  onChange={(e) => setScreeningResults({
                    ...screeningResults,
                    notes: e.target.value
                  })}
                  placeholder="Additional observations and notes..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Complete Screening
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review all information and complete the screening process.
            </Typography>

            {renderPatientProfile()}

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Screening Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Patient Information</Typography>
                    <Typography variant="body2">
                      {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'No patient selected'}
                    </Typography>
                    <Typography variant="body2">
                      Screening Type: {screeningType}
                    </Typography>
                    <Typography variant="body2">
                      Equipment: {equipmentUsed || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Results Overview</Typography>
                    <Typography variant="body2">
                      Distance Vision: {screeningResults.left_eye_distance || 'N/A'} / {screeningResults.right_eye_distance || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Near Vision: {screeningResults.left_eye_near || 'N/A'} / {screeningResults.right_eye_near || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Color Vision: {screeningResults.color_vision}
                    </Typography>
                    <Typography variant="body2">
                      Depth Perception: {screeningResults.depth_perception}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Click "Complete Screening" to save the results and finish the screening process.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      p: { xs: 2, md: 3 },
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}
          >
            Standard Vision Screening Workflow
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Complete standard vision screening with customizable test types
          </Typography>
        </Box>
        {onCancel && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onCancel}
            sx={{ 
              minWidth: { xs: '100%', md: 'auto' },
              mt: { xs: 2, md: 0 }
            }}
          >
            Cancel
          </Button>
        )}
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4, p: 2, bgcolor: 'primary.50' }}>
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 2,
            '& .MuiStepLabel-root .Mui-completed': {
              color: 'success.main',
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: 'primary.main',
            }
          }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    fontWeight: activeStep === index ? 'bold' : 'normal'
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <Typography variant="body2" color="text.secondary" align="center">
          Step {activeStep + 1} of {steps.length}
        </Typography>
      </Card>

      <Box sx={{ mb: 4 }}>
        {renderWorkflowStep()}
      </Box>

      {/* Navigation Buttons */}
      <Card sx={{ p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2
        }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ 
              minWidth: { xs: '100%', sm: '120px' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Back
          </Button>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            order: { xs: 1, sm: 2 }
          }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleScreeningComplete}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{ 
                  minWidth: { xs: '100%', sm: '200px' },
                  py: 1.5,
                  px: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Complete Screening'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={loading || (activeStep === 3 && !selectedPatient)}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
                sx={{ 
                  minWidth: { xs: '100%', sm: '150px' },
                  py: 1.5,
                  px: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StandardVisionScreeningForm;
