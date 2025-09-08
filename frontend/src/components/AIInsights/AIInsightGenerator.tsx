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
}

const AIInsightGenerator: React.FC<AIInsightGeneratorProps> = ({
  screeningData,
  patientInfo,
  onInsightGenerated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);

  // Form state
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [selectedInsightType, setSelectedInsightType] = useState('screening_analysis');
  const [customPrompt, setCustomPrompt] = useState('');

  const steps = [
    'Select Role & Type',
    'Review Data',
    'Generate Insight',
    'View Results',
  ];

  const roleOptions = [
    { value: 'doctor', label: 'Doctor', icon: <LocalHospital />, color: '#1976d2' },
    { value: 'teacher', label: 'Teacher', icon: <School />, color: '#388e3c' },
    { value: 'parent', label: 'Parent', icon: <Person />, color: '#f57c00' },
    { value: 'executive', label: 'Executive', icon: <Business />, color: '#7b1fa2' },
    { value: 'medical_staff', label: 'Medical Staff', icon: <LocalHospital />, color: '#d32f2f' },
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
    setError(null);
    setSuccess(null);

    try {
      const requestData: InsightRequest = {
        screening_data: screeningData || {},
        patient_info: patientInfo,
        role: selectedRole,
        insight_type: selectedInsightType,
      };

      const response = await unifiedApi.post(
        '/api/v1/ai-insights/generate-screening-insight',
        requestData
      );

      if (response.data.success) {
        setInsight(response.data.insight);
        setSuccess('AI insight generated successfully!');
        onInsightGenerated?.(response.data.insight);
        handleNext();
      } else {
        setError('Failed to generate insight');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error generating insight');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Role and Insight Type
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
            </Grid>
          </Box>
        );

      case 1:
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
                    {JSON.stringify(screeningData || {}, null, 2)}
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

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generate AI Insight
            </Typography>
            <Box textAlign="center" py={4}>
              {loading ? (
                <Box>
                  <CircularProgress size={60} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Generating AI insight...
                  </Typography>
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

      case 3:
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
                onClick={activeStep === 2 ? generateInsight : handleNext}
                disabled={activeStep === 2 && loading}
                startIcon={activeStep === 2 ? <AutoAwesome /> : undefined}
              >
                {activeStep === 2 ? 'Generate Insight' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIInsightGenerator;
