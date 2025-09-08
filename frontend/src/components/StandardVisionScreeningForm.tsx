import React, { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  CreditCard,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import RBACScreeningDropdown from './RBAC/RBACScreeningDropdown';
import api from '../services/api';

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
  // Enhanced screening fields for medical-grade forms
  comprehensive_ophthalmic?: {
    va_right: string;
    va_left: string;
    va_binocular: string;
    cover_test_result: 'normal' | 'esotropia' | 'exotropia';
    ocular_motility: 'full' | 'restricted' | 'limited';
    near_point_of_convergence: number;
    pupil_response: 'normal' | 'sluggish' | 'non-reactive';
    red_reflex_result: 'normal' | 'abnormal';
    recommendation: string;
  };
  visual_acuity_screening?: {
    va_right: string;
    va_left: string;
    va_pass_fail: 'pass' | 'fail' | 'refer';
    screening_method: 'Snellen' | 'LEA' | 'Tumbling E';
    test_distance_m: number;
    glasses_used: boolean;
  };
  color_vision_deficiency?: {
    test_type: 'Ishihara' | 'HRR' | 'D-15' | 'Farnsworth';
    total_plates: number;
    correct_answers: number;
    color_deficiency: 'normal' | 'red-green' | 'blue-yellow' | 'total';
    test_result_notes: string;
  };
  stereoacuity_test?: {
    test_type: 'Stereo Fly' | 'Randot' | 'Titmus' | 'Lang';
    stereoacuity_arcsec: number;
    pass_fail: 'pass' | 'fail' | 'inconclusive';
    patient_response: string;
    test_distance_cm: number;
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
  const [screeningType, setScreeningType] = useState('comprehensive_ophthalmic');
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
    follow_up_date: '',
    // Enhanced screening fields
    comprehensive_ophthalmic: {
      va_right: '',
      va_left: '',
      va_binocular: '',
      cover_test_result: 'normal',
      ocular_motility: 'full',
      near_point_of_convergence: 0,
      pupil_response: 'normal',
      red_reflex_result: 'normal',
      recommendation: '',
    },
    visual_acuity_screening: {
      va_right: '',
      va_left: '',
      va_pass_fail: 'pass',
      screening_method: 'Snellen',
      test_distance_m: 6,
      glasses_used: false,
    },
    color_vision_deficiency: {
      test_type: 'Ishihara',
      total_plates: 0,
      correct_answers: 0,
      color_deficiency: 'normal',
      test_result_notes: '',
    },
    stereoacuity_test: {
      test_type: 'Stereo Fly',
      stereoacuity_arcsec: 0,
      pass_fail: 'pass',
      patient_response: '',
      test_distance_cm: 40,
    },
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
      const response = await api.get('/api/v1/evep/students');

      setPatients(response.data.students || []);
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

      const response = await api.post('/api/v1/screenings/', screeningData);

      setSnackbar({
        open: true,
        message: 'Screening completed successfully',
        severity: 'success'
      });
      onComplete?.(screeningData);
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

  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePhotoCapture = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      // Fallback to file input if camera access fails
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
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        if (newPatientData.photos.length < 3) {
          setNewPatientData({
            ...newPatientData,
            photos: [...newPatientData.photos, photoData]
          });
        }
      }
    }
    
    // Stop camera and close
    closeCamera();
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const removePhoto = (index: number) => {
    setNewPatientData({
      ...newPatientData,
      photos: newPatientData.photos.filter((_, i) => i !== index)
    });
  };

  const renderPhotoUploadSection = () => (
    <Card sx={{ 
      mb: 3,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      borderRadius: 2,
      border: '1px solid rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(10px)'
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          mb: 1
        }}>
          Patient Photos (Max 3)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload or capture photos to help identify the patient during screening
        </Typography>
        
        <Grid container spacing={2}>
          {/* Photo Display */}
          {newPatientData.photos.map((photo, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card sx={{ 
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
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
                      top: 8, 
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)'
                      }
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
                bgcolor: 'secondary.50',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  bgcolor: 'secondary.100',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <IconButton
                    color="secondary"
                    sx={{ 
                      mb: 1,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'secondary.dark'
                      }
                    }}
                    onClick={handlePhotoCapture}
                  >
                    <PhotoCamera />
                  </IconButton>
                  <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold' }}>
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
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
        border: '2px solid',
        borderColor: 'primary.main',
        boxShadow: '0 6px 25px rgba(25, 118, 210, 0.15)',
        borderRadius: 3,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
      // New Medical-Grade Screening Types
      case 'comprehensive_ophthalmic':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(25, 118, 210, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    🧾 Comprehensive Ophthalmic Examination
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Full visual function including acuity, binocular vision, eye movements, and red reflex
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Visual Acuity */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mb: 2
                  }}>
                    Visual Acuity
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.comprehensive_ophthalmic?.va_right || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          comprehensive_ophthalmic: {
                            ...screeningResults.comprehensive_ophthalmic!,
                            va_right: e.target.value
                          }
                        })}
                        placeholder="e.g., 6/6, 20/20"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.comprehensive_ophthalmic?.va_left || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          comprehensive_ophthalmic: {
                            ...screeningResults.comprehensive_ophthalmic!,
                            va_left: e.target.value
                          }
                        })}
                        placeholder="e.g., 6/6, 20/20"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Binocular"
                        value={screeningResults.comprehensive_ophthalmic?.va_binocular || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          comprehensive_ophthalmic: {
                            ...screeningResults.comprehensive_ophthalmic!,
                            va_binocular: e.target.value
                          }
                        })}
                        placeholder="e.g., 6/6, 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Cover Test & Ocular Motility */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mb: 2
                  }}>
                    Eye Alignment & Movement
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Cover Test Result</InputLabel>
                        <Select
                          value={screeningResults.comprehensive_ophthalmic?.cover_test_result || 'normal'}
                          label="Cover Test Result"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            comprehensive_ophthalmic: {
                              ...screeningResults.comprehensive_ophthalmic!,
                              cover_test_result: e.target.value as 'normal' | 'esotropia' | 'exotropia'
                            }
                          })}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="esotropia">Esotropia</MenuItem>
                          <MenuItem value="exotropia">Exotropia</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Ocular Motility</InputLabel>
                        <Select
                          value={screeningResults.comprehensive_ophthalmic?.ocular_motility || 'full'}
                          label="Ocular Motility"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            comprehensive_ophthalmic: {
                              ...screeningResults.comprehensive_ophthalmic!,
                              ocular_motility: e.target.value as 'full' | 'restricted' | 'limited'
                            }
                          })}
                        >
                          <MenuItem value="full">Full</MenuItem>
                          <MenuItem value="restricted">Restricted</MenuItem>
                          <MenuItem value="limited">Limited</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Near Point & Pupil Response */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Convergence & Pupil Response
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Near Point of Convergence (cm)"
                        value={screeningResults.comprehensive_ophthalmic?.near_point_of_convergence || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          comprehensive_ophthalmic: {
                            ...screeningResults.comprehensive_ophthalmic!,
                            near_point_of_convergence: parseFloat(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 0, max: 20, step: 0.5 }}
                        placeholder="e.g., 6.5"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Pupil Response</InputLabel>
                        <Select
                          value={screeningResults.comprehensive_ophthalmic?.pupil_response || 'normal'}
                          label="Pupil Response"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            comprehensive_ophthalmic: {
                              ...screeningResults.comprehensive_ophthalmic!,
                              pupil_response: e.target.value as 'normal' | 'sluggish' | 'non-reactive'
                            }
                          })}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="sluggish">Sluggish</MenuItem>
                          <MenuItem value="non-reactive">Non-Reactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Red Reflex */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Red Reflex Assessment
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Red Reflex Result</InputLabel>
                    <Select
                                                value={screeningResults.comprehensive_ophthalmic?.red_reflex_result || 'normal'}
                          label="Red Reflex Result"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            comprehensive_ophthalmic: {
                              ...screeningResults.comprehensive_ophthalmic!,
                              red_reflex_result: e.target.value as 'normal' | 'abnormal'
                            }
                          })}
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="abnormal">Abnormal</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'visual_acuity':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'success.main',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ 
                    color: 'success.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    🧾 Visual Acuity Screening
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Routine checks for schools or community health settings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Visual Acuity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Visual Acuity
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Right Eye"
                        value={screeningResults.visual_acuity_screening?.va_right || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          visual_acuity_screening: {
                            ...screeningResults.visual_acuity_screening!,
                            va_right: e.target.value
                          }
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Left Eye"
                        value={screeningResults.visual_acuity_screening?.va_left || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          visual_acuity_screening: {
                            ...screeningResults.visual_acuity_screening!,
                            va_left: e.target.value
                          }
                        })}
                        placeholder="e.g., 20/20"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Screening Method & Results */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Screening Method & Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Screening Method</InputLabel>
                        <Select
                          value={screeningResults.visual_acuity_screening?.screening_method || 'Snellen'}
                          label="Screening Method"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            visual_acuity_screening: {
                              ...screeningResults.visual_acuity_screening!,
                              screening_method: e.target.value as 'Snellen' | 'LEA' | 'Tumbling E'
                            }
                          })}
                        >
                          <MenuItem value="Snellen">Snellen</MenuItem>
                          <MenuItem value="LEA">LEA</MenuItem>
                          <MenuItem value="Tumbling E">Tumbling E</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Pass/Fail</InputLabel>
                        <Select
                          value={screeningResults.visual_acuity_screening?.va_pass_fail || 'pass'}
                          label="Pass/Fail"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            visual_acuity_screening: {
                              ...screeningResults.visual_acuity_screening!,
                              va_pass_fail: e.target.value as 'pass' | 'fail' | 'refer'
                            }
                          })}
                        >
                          <MenuItem value="pass">Pass</MenuItem>
                          <MenuItem value="fail">Fail</MenuItem>
                          <MenuItem value="refer">Refer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Test Distance (m)"
                        value={screeningResults.visual_acuity_screening?.test_distance_m || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          visual_acuity_screening: {
                            ...screeningResults.visual_acuity_screening!,
                            test_distance_m: parseFloat(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 1, max: 10, step: 0.5 }}
                        placeholder="e.g., 6"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={screeningResults.visual_acuity_screening?.glasses_used || false}
                            onChange={(e) => setScreeningResults({
                              ...screeningResults,
                              visual_acuity_screening: {
                                ...screeningResults.visual_acuity_screening!,
                                glasses_used: e.target.checked
                              }
                            })}
                          />
                        }
                        label="Glasses Used"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'color_vision_deficiency':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'warning.main',
                boxShadow: '0 4px 20px rgba(255, 152, 0, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ 
                    color: 'warning.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    🧾 Color Vision Deficiency Assessment
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Checks for red-green and blue-yellow color deficiencies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Test Configuration */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Test Type</InputLabel>
                        <Select
                          value={screeningResults.color_vision_deficiency?.test_type || 'Ishihara'}
                          label="Test Type"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            color_vision_deficiency: {
                              ...screeningResults.color_vision_deficiency!,
                              test_type: e.target.value as 'Ishihara' | 'HRR' | 'D-15' | 'Farnsworth'
                            }
                          })}
                        >
                          <MenuItem value="Ishihara">Ishihara</MenuItem>
                          <MenuItem value="HRR">HRR</MenuItem>
                          <MenuItem value="D-15">D-15</MenuItem>
                          <MenuItem value="Farnsworth">Farnsworth</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Total Plates"
                        value={screeningResults.color_vision_deficiency?.total_plates || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          color_vision_deficiency: {
                            ...screeningResults.color_vision_deficiency!,
                            total_plates: parseInt(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 0, max: 100 }}
                        placeholder="e.g., 14"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Test Results */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Correct Answers"
                        value={screeningResults.color_vision_deficiency?.correct_answers || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          color_vision_deficiency: {
                            ...screeningResults.color_vision_deficiency!,
                            correct_answers: parseInt(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 0, max: 100 }}
                        placeholder="e.g., 12"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Color Deficiency</InputLabel>
                        <Select
                          value={screeningResults.color_vision_deficiency?.color_deficiency || 'normal'}
                          label="Color Deficiency"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            color_vision_deficiency: {
                              ...screeningResults.color_vision_deficiency!,
                              color_deficiency: e.target.value as 'normal' | 'red-green' | 'blue-yellow' | 'total'
                            }
                          })}
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="red-green">Red-Green</MenuItem>
                          <MenuItem value="blue-yellow">Blue-Yellow</MenuItem>
                          <MenuItem value="total">Total</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Test Result Notes"
                        value={screeningResults.color_vision_deficiency?.test_result_notes || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          color_vision_deficiency: {
                            ...screeningResults.color_vision_deficiency!,
                            test_result_notes: e.target.value
                          }
                        })}
                        placeholder="Additional notes about the color vision test..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'stereoacuity':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)',
                border: '2px solid',
                borderColor: 'secondary.main',
                boxShadow: '0 4px 20px rgba(156, 39, 176, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ 
                    color: 'secondary.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    🧾 Stereoacuity (Depth Perception) Test
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Tests stereopsis (3D vision) via Stereo Fly, Randot, or Titmus
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Test Configuration */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Test Type</InputLabel>
                        <Select
                          value={screeningResults.stereoacuity_test?.test_type || 'Stereo Fly'}
                          label="Test Type"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            stereoacuity_test: {
                              ...screeningResults.stereoacuity_test!,
                              test_type: e.target.value as 'Stereo Fly' | 'Randot' | 'Titmus' | 'Lang'
                            }
                          })}
                        >
                          <MenuItem value="Stereo Fly">Stereo Fly</MenuItem>
                          <MenuItem value="Randot">Randot</MenuItem>
                          <MenuItem value="Titmus">Titmus</MenuItem>
                          <MenuItem value="Lang">Lang</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Test Distance (cm)"
                        value={screeningResults.stereoacuity_test?.test_distance_cm || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          stereoacuity_test: {
                            ...screeningResults.stereoacuity_test!,
                            test_distance_cm: parseFloat(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 20, max: 100, step: 1 }}
                        placeholder="e.g., 40"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Test Results */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Stereoacuity (arc sec)"
                        value={screeningResults.stereoacuity_test?.stereoacuity_arcsec || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          stereoacuity_test: {
                            ...screeningResults.stereoacuity_test!,
                            stereoacuity_arcsec: parseInt(e.target.value) || 0
                          }
                        })}
                        inputProps={{ min: 0, max: 3000 }}
                        placeholder="e.g., 40"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Pass/Fail</InputLabel>
                        <Select
                          value={screeningResults.stereoacuity_test?.pass_fail || 'pass'}
                          label="Pass/Fail"
                          onChange={(e) => setScreeningResults({
                            ...screeningResults,
                            stereoacuity_test: {
                              ...screeningResults.stereoacuity_test!,
                              pass_fail: e.target.value as 'pass' | 'fail' | 'inconclusive'
                            }
                          })}
                        >
                          <MenuItem value="pass">Pass</MenuItem>
                          <MenuItem value="fail">Fail</MenuItem>
                          <MenuItem value="inconclusive">Inconclusive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Patient Response"
                        value={screeningResults.stereoacuity_test?.patient_response || ''}
                        onChange={(e) => setScreeningResults({
                          ...screeningResults,
                          stereoacuity_test: {
                            ...screeningResults.stereoacuity_test!,
                            patient_response: e.target.value
                          }
                        })}
                        placeholder="Patient's responses during the test..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      // Legacy screening types (keeping for backward compatibility)
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
              <Tab label="School Screening Students" icon={<School />} />
              <Tab label="Manual Registration" icon={<Person />} />
              <Tab label="Citizen Card Reader" icon={<CreditCard />} />
            </Tabs>



            {patientTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  School Screening Students
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Students who have completed school screenings and are ready for standard vision assessment
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      placeholder="Search school screening students by name, ID, or school..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by School</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Filter by School"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All Schools</MenuItem>
                        <MenuItem value="active">Active Students</MenuItem>
                        <MenuItem value="completed">Completed Screenings</MenuItem>
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
                <Typography variant="h6" gutterBottom>
                  Manual Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manually register new patients for standard vision screening
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

            {patientTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Citizen Card Reader
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Patients registered via citizen card reader for standard vision screening
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      placeholder="Search card reader patients by name, ID, or citizen number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Type</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Filter by Type"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All Card Types</MenuItem>
                        <MenuItem value="citizen">Citizen ID</MenuItem>
                        <MenuItem value="student">Student ID</MenuItem>
                        <MenuItem value="other">Other Cards</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Card reader patients will appear here when registered via card scanning
                    </Typography>
                  </CardContent>
                </Card>
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
                <RBACScreeningDropdown
                  label="Screening Type"
                  value={screeningType}
                  onChange={setScreeningType}
                  required
                  showAccessInfo
                />
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Standard Vision Screening Workflow
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete standard vision screening with customizable test types
          </Typography>
        </Box>
        {onCancel && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </Box>

      {/* Workflow Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderWorkflowStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
        </Box>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleScreeningComplete}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              Complete Screening
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 3 && !selectedPatient)}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

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

      {/* Camera Dialog */}
      {showCamera && (
        <Dialog 
          open={showCamera} 
          onClose={closeCamera}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'black',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: 'black',
            color: 'white'
          }}>
            <Typography variant="h6">Take Photo</Typography>
            <IconButton onClick={closeCamera} sx={{ color: 'white' }}>
              <Cancel />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ 
            p: 0, 
            bgcolor: 'black',
            position: 'relative',
            minHeight: '400px'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '500px',
                objectFit: 'cover'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <Box sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 2
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={capturePhoto}
                sx={{
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  minWidth: 'unset',
                  bgcolor: 'white',
                  color: 'black',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                <PhotoCamera sx={{ fontSize: 32 }} />
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default StandardVisionScreeningForm;
