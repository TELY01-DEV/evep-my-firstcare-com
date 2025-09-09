import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Psychology,
  Assessment,
  School,
  Person,
  Business,
  LocalHospital,
  Add,
  Save,
  Send,
  Refresh,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Info,
  AutoAwesome,
  TrendingUp,
  Insights,
  SmartToy,
} from '@mui/icons-material';
import unifiedApi from '../../services/unifiedApi';

interface AIInsightGeneratorProps {
  screeningData?: any;
  patientInfo?: any;
  onInsightGenerated?: (insight: any) => void;
}

interface InsightRequest {
  screening_data: any;
  patient_info?: any;
  role: string;
  insight_type: string;
  language: string;
}

const AIInsightGenerator: React.FC<AIInsightGeneratorProps> = ({
  screeningData,
  patientInfo,
  onInsightGenerated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);

  // Form state
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [selectedInsightType, setSelectedInsightType] = useState('screening_analysis');
  const [selectedLanguage, setSelectedLanguage] = useState('th');
  const [customPrompt, setCustomPrompt] = useState('');
  const [availableScreenings, setAvailableScreenings] = useState<any[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>('');
  const [selectedScreeningData, setSelectedScreeningData] = useState<any>(null);

  const steps = [
    'Select Role, Type & Language',
    'Select Screening Data',
    'Review Data',
    'Generate Insight',
    'View Results',
  ];

  // Load available screenings on component mount
  useEffect(() => {
    loadAvailableScreenings();
  }, []);

  const loadAvailableScreenings = async () => {
    try {
      // Try to load recent screenings from the correct endpoint
      const response = await unifiedApi.get('/api/v1/screenings/sessions?limit=20');
      if (response.data && Array.isArray(response.data)) {
        // Transform the data to match our expected format
        const transformedScreenings = response.data.map((screening: any) => ({
          screening_id: screening.screening_id || screening.session_id,
          patient_name: screening.patient_name || 'Unknown Patient',
          screening_type: screening.screening_type || 'vision_test',
          results: screening.results || {},
          created_at: screening.created_at || new Date().toISOString()
        }));
        setAvailableScreenings(transformedScreenings);
      }
    } catch (err) {
      console.warn('Could not load screenings:', err);
      // Set some sample data for demo purposes
      setAvailableScreenings([
        {
          screening_id: 'demo_1',
          patient_name: 'John Doe',
          screening_type: 'vision_test',
          results: {
            right_eye_distance: '20/20',
            left_eye_distance: '20/25',
            right_eye_near: '20/20',
            left_eye_near: '20/20',
            color_vision: 'Normal',
            depth_perception: 'Normal'
          },
          created_at: new Date().toISOString()
        },
        {
          screening_id: 'demo_2',
          patient_name: 'Jane Smith',
          screening_type: 'basic_school',
          results: {
            right_eye_distance: '20/30',
            left_eye_distance: '20/20',
            right_eye_near: '20/25',
            left_eye_near: '20/20',
            color_vision: 'Normal',
            depth_perception: 'Normal'
          },
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const roleOptions = [
    { value: 'doctor', label: 'Doctor', icon: <LocalHospital />, color: '#1976d2' },
    { value: 'teacher', label: 'Teacher', icon: <School />, color: '#388e3c' },
    { value: 'parent', label: 'Parent', icon: <Person />, color: '#f57c00' },
    { value: 'executive', label: 'Executive', icon: <Business />, color: '#7b1fa2' },
    { value: 'medical_staff', label: 'Medical Staff', icon: <LocalHospital />, color: '#d32f2f' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  ];

  const insightTypeOptions = {
    doctor: [
      { value: 'screening_analysis', label: 'Screening Analysis' },
      { value: 'diagnosis_support', label: 'Diagnosis Support' },
      { value: 'treatment_planning', label: 'Treatment Planning' },
    ],
    teacher: [
      { value: 'academic_impact', label: 'Academic Impact' },
      { value: 'classroom_accommodations', label: 'Classroom Accommodations' },
      { value: 'parent_communication', label: 'Parent Communication' },
    ],
    parent: [
      { value: 'parent_guidance', label: 'Parent Guidance' },
      { value: 'home_monitoring', label: 'Home Monitoring' },
      { value: 'healthcare_questions', label: 'Healthcare Questions' },
    ],
    executive: [
      { value: 'trend_analysis', label: 'Trend Analysis' },
      { value: 'strategic_planning', label: 'Strategic Planning' },
      { value: 'roi_assessment', label: 'ROI Assessment' },
    ],
    medical_staff: [
      { value: 'mobile_screening', label: 'Mobile Screening' },
      { value: 'glasses_management', label: 'Glasses Management' },
      { value: 'workflow_optimization', label: 'Workflow Optimization' },
    ],
  };

  const handleNext = () => {
    // Validate step 1 - screening data selection
    if (activeStep === 1 && !selectedScreeningData && !screeningData) {
      setError('Please select a screening or ensure screening data is provided.');
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setInsight(null);
    setError(null);
    setSuccess(null);
  };

  const generateInsight = async () => {
    setLoading(true);
    setLoadingStep('Initializing AI analysis...');
    setLoadingProgress(10);
    setError(null);
    setSuccess(null);

    try {
      // Use selected screening data or fallback to props
      const dataToUse = selectedScreeningData || screeningData || {};
      
      // Validate that we have some screening data
      if (!dataToUse || Object.keys(dataToUse).length === 0) {
        throw new Error('No screening data available. Please select a screening or ensure screening data is provided.');
      }

      setLoadingStep('Preparing screening data...');
      setLoadingProgress(25);

      const requestData: InsightRequest = {
        screening_data: dataToUse,
        patient_info: selectedScreeningData?.patient_info || patientInfo,
        role: selectedRole,
        insight_type: selectedInsightType,
        language: selectedLanguage,
      };

      console.log('🚀 Sending AI Insight Request:', requestData);

      setLoadingStep('Sending request to AI service...');
      setLoadingProgress(40);

      const response = await unifiedApi.post(
        '/api/v1/ai-insights/generate-screening-insight',
        requestData
      );

      console.log('✅ AI Insight Response:', response.data);

      setLoadingStep('Processing AI response...');
      setLoadingProgress(70);

      if (response.data.success) {
        setLoadingStep('Saving insight to database...');
        setLoadingProgress(85);
        
        setInsight(response.data.insight);
        setSuccess('AI insight generated successfully!');
        onInsightGenerated?.(response.data.insight);
        
        setLoadingStep('Complete!');
        setLoadingProgress(100);
        
        // Small delay to show completion
        setTimeout(() => {
          handleNext();
        }, 500);
      } else {
        setError('Failed to generate insight');
      }
    } catch (err: any) {
      console.error('AI Insight Generation Error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error generating insight';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingStep('');
      setLoadingProgress(0);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Role, Insight Type & Language
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    label="User Role"
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: role.color, width: 24, height: 24 }}>
                            {role.icon}
                          </Avatar>
                          {role.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Insight Type</InputLabel>
                  <Select
                    value={selectedInsightType}
                    onChange={(e) => setSelectedInsightType(e.target.value)}
                    label="Insight Type"
                  >
                    {insightTypeOptions[selectedRole as keyof typeof insightTypeOptions]?.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    label="Language"
                  >
                    {languageOptions.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                          {lang.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Screening Data
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Available Screenings</InputLabel>
                  <Select
                    value={selectedScreeningId}
                    onChange={(e) => {
                      const screeningId = e.target.value;
                      setSelectedScreeningId(screeningId);
                      const screening = availableScreenings.find(s => s.screening_id === screeningId);
                      setSelectedScreeningData(screening);
                    }}
                    label="Available Screenings"
                  >
                    {availableScreenings.map((screening) => (
                      <MenuItem key={screening.screening_id} value={screening.screening_id}>
                        <Box display="flex" flexDirection="column" alignItems="flex-start">
                          <Typography variant="body1">
                            {screening.patient_name || 'Unknown Patient'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {screening.screening_type} - {new Date(screening.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedScreeningData && (
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Screening Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient: {selectedScreeningData.patient_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedScreeningData.screening_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(selectedScreeningData.created_at).toLocaleString()}
                    </Typography>
                    {selectedScreeningData.results && (
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          Results: {Object.keys(selectedScreeningData.results).length} measurements
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screening Data
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(selectedScreeningData || screeningData || {}, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient Information
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(patientInfo || {}, null, 2)}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generate AI Insight
            </Typography>
            <Box textAlign="center" py={4}>
              {loading ? (
                <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, position: 'relative' }}>
                    <CircularProgress 
                      size={80} 
                      variant="determinate" 
                      value={loadingProgress}
                      sx={{ 
                        color: 'primary.main',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        }
                      }}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      boxShadow: 1
                    }}>
                      <SmartToy 
                        sx={{ 
                          fontSize: 32, 
                          color: 'primary.main',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }} 
                      />
                    </Box>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: -10, 
                      right: -10,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {loadingProgress}%
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
                    {loadingStep}
                  </Typography>
                  
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                    <Box 
                      sx={{ 
                        height: 8, 
                        bgcolor: 'primary.main', 
                        borderRadius: 1,
                        transition: 'width 0.3s ease-in-out',
                        width: `${loadingProgress}%`
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      {loadingProgress < 30 && "Analyzing screening data"}
                      {loadingProgress >= 30 && loadingProgress < 60 && "Connecting to AI service"}
                      {loadingProgress >= 60 && loadingProgress < 90 && "Generating personalized insights"}
                      {loadingProgress >= 90 && "Finalizing results"}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: `loadingDots 1.4s infinite ${i * 0.2}s`,
                            '@keyframes loadingDots': {
                              '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                              '40%': { transform: 'scale(1)', opacity: 1 }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <SmartToy sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Ready to generate insight for {roleOptions.find(r => r.value === selectedRole)?.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {insightTypeOptions[selectedRole as keyof typeof insightTypeOptions]?.find(t => t.value === selectedInsightType)?.label}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              AI Insight Results
            </Typography>
            {insight && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <AutoAwesome color="primary" />
                  <Typography variant="h6">
                    Generated Insight
                  </Typography>
                  <Chip
                    label={insight.role}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                  {insight.content}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Model Used
                    </Typography>
                    <Typography variant="body2">
                      {insight.model_used}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Template Used
                    </Typography>
                    <Typography variant="body2">
                      {insight.template_used}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Psychology color="primary" />
          <Typography variant="h5">
            AI Insight Generator
          </Typography>
        </Box>

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

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {getStepContent(activeStep)}
        </Box>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleReset}
                startIcon={<Refresh />}
              >
                Generate New Insight
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={activeStep === 3 ? generateInsight : handleNext}
                disabled={activeStep === 3 && loading}
                startIcon={activeStep === 3 ? <AutoAwesome /> : undefined}
              >
                {activeStep === 3 ? 'Generate Insight' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIInsightGenerator;
