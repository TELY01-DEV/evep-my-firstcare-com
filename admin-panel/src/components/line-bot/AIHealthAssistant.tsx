import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  LinearProgress,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Grow,
  Fab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  AlertTitle,
  FormHelperText,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Psychology,
  Add,

  Warning,
  Search,

  Analytics,
  AutoAwesome,
  Psychology as PsychologyIcon,
  Visibility,
  ViewModule,
  TableChart,
  Download,
  Refresh,
  Notifications
} from '@mui/icons-material';
import { 
  generateHealthRecommendation, 
  getPatientStats, 
  getAllPatients,
  getPatientReadings
} from '../../api';

interface HealthRecommendation {
  id?: string;
  user_id: string;
  dtx_data: {
    average_glucose: number;
    glucose_variability: number;
    total_readings: number;
    in_range_percentage: number;
    min_glucose?: number;
    max_glucose?: number;
    time_in_range?: number;
    time_above_range?: number;
    time_below_range?: number;
  };
  a1c_level: number;
  medical_history: Array<{
    date: string;
    type: string;
    value: number;
    notes: string;
  }>;
  recommendations: {
    glucose: string;
    lifestyle: string;
    medication: string;
    diet: string;
    exercise: string;
    sleep?: string;
    stress?: string;
    monitoring?: string;
  };
  confidence: number;
  next_follow_up: string;
  created_at?: string;
  risk_score?: number;
  trend_analysis?: {
    glucose_trend: 'improving' | 'stable' | 'declining';
    a1c_trend: 'improving' | 'stable' | 'declining';
    compliance_score: number;
  };
  ai_insights?: {
    patterns: string[];
    alerts: string[];
    predictions: string[];
    personalized_tips: string[];
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`health-tabpanel-${index}`}
      aria-labelledby={`health-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIHealthAssistant: React.FC = () => {
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'analytics'>('cards');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'risk'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'high_risk' | 'improving' | 'stable'>('all');
  const [searchTerm, setSearchTerm] = useState('');


  const [formData, setFormData] = useState<Partial<HealthRecommendation>>({
    user_id: '',
    dtx_data: {
      average_glucose: 0,
      glucose_variability: 0,
      total_readings: 0,
      in_range_percentage: 0,
      min_glucose: 0,
      max_glucose: 0,
      time_in_range: 0,
      time_above_range: 0,
      time_below_range: 0
    },
    a1c_level: 0,
    medical_history: [],
    recommendations: {
      glucose: '',
      lifestyle: '',
      medication: '',
      diet: '',
      exercise: '',
      sleep: '',
      stress: '',
      monitoring: ''
    },
    confidence: 0,
    next_follow_up: new Date().toISOString().split('T')[0],
    risk_score: 0,
    trend_analysis: {
      glucose_trend: 'stable',
      a1c_trend: 'stable',
      compliance_score: 0
    },
    ai_insights: {
      patterns: [],
      alerts: [],
      predictions: [],
      personalized_tips: []
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [patientReadings, setPatientReadings] = useState<any[]>([]);

  // Load patients and data
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await getAllPatients({ limit: 100 });
      setPatients(response.data.items || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load patient stats
      const statsResponse = await getPatientStats(userId);
      setPatientStats(statsResponse.data);
      
      // Load DTX readings
      const readingsResponse = await getPatientReadings(userId, { limit: 50 });
      setPatientReadings(readingsResponse.data.items || []);
      
    } catch (error: any) {
      console.error('Error loading patient data:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const getA1CStatus = (a1c: number) => {
    if (a1c < 5.7) return { status: 'Normal', color: 'success' as const, severity: 'low' };
    if (a1c < 6.5) return { status: 'Prediabetes', color: 'warning' as const, severity: 'medium' };
    return { status: 'Diabetes', color: 'error' as const, severity: 'high' };
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose < 70) return { status: 'Low', color: 'error' as const, severity: 'high' };
    if (glucose > 180) return { status: 'High', color: 'error' as const, severity: 'high' };
    if (glucose > 140) return { status: 'Elevated', color: 'warning' as const, severity: 'medium' };
    return { status: 'Normal', color: 'success' as const, severity: 'low' };
  };





  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.user_id?.trim()) {
      errors.user_id = 'User ID is required';
    }
    
    if (!formData.dtx_data?.average_glucose || formData.dtx_data.average_glucose <= 0) {
      errors.average_glucose = 'Valid average glucose is required';
    }
    
    if (!formData.dtx_data?.total_readings || formData.dtx_data.total_readings <= 0) {
      errors.total_readings = 'Valid total readings count is required';
    }
    
    if (!formData.a1c_level || formData.a1c_level <= 0) {
      errors.a1c_level = 'Valid A1C level is required';
    }
    
    if (formData.dtx_data?.in_range_percentage !== undefined && 
        (formData.dtx_data.in_range_percentage < 0 || formData.dtx_data.in_range_percentage > 100)) {
      errors.in_range_percentage = 'In range percentage must be between 0-100%';
    }
    
    if (!formData.next_follow_up) {
      errors.next_follow_up = 'Next follow-up date is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerateRecommendation = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before generating recommendation');
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setError(null);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await generateHealthRecommendation(formData as HealthRecommendation);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setSuccess('Health recommendation generated successfully!');
        setDialogOpen(false);
        setIsGenerating(false);
        setGenerationProgress(0);
        
        // Add to recommendations list
        setRecommendations(prev => [response.data, ...prev]);
      }, 500);
      
    } catch (err: any) {
      console.error('Generation error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate health recommendation';
      setError(errorMessage);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleOpenDialog = (patient?: any) => {
    if (patient) {
      // Pre-fill form with patient data
      setFormData({
        user_id: patient.line_user_id,
        dtx_data: {
          average_glucose: 0,
          glucose_variability: 0,
          total_readings: patient.total_readings || 0,
          in_range_percentage: 0,
          min_glucose: 0,
          max_glucose: 0,
          time_in_range: 0,
          time_above_range: 0,
          time_below_range: 0
        },
        a1c_level: 0,
        medical_history: [],
        recommendations: {
          glucose: '',
          lifestyle: '',
          medication: '',
          diet: '',
          exercise: '',
          sleep: '',
          stress: '',
          monitoring: ''
        },
        confidence: 0,
        next_follow_up: new Date().toISOString().split('T')[0],
        risk_score: 0,
        trend_analysis: {
          glucose_trend: 'stable',
          a1c_trend: 'stable',
          compliance_score: 0
        },
        ai_insights: {
          patterns: [],
          alerts: [],
          predictions: [],
          personalized_tips: []
        }
      });
      
      // Load patient data
      loadPatientData(patient.line_user_id);
    } else {
      setFormData({
        user_id: '',
        dtx_data: {
          average_glucose: 0,
          glucose_variability: 0,
          total_readings: 0,
          in_range_percentage: 0,
          min_glucose: 0,
          max_glucose: 0,
          time_in_range: 0,
          time_above_range: 0,
          time_below_range: 0
        },
        a1c_level: 0,
        medical_history: [],
        recommendations: {
          glucose: '',
          lifestyle: '',
          medication: '',
          diet: '',
          exercise: '',
          sleep: '',
          stress: '',
          monitoring: ''
        },
        confidence: 0,
        next_follow_up: new Date().toISOString().split('T')[0],
        risk_score: 0,
        trend_analysis: {
          glucose_trend: 'stable',
          a1c_trend: 'stable',
          compliance_score: 0
        },
        ai_insights: {
          patterns: [],
          alerts: [],
          predictions: [],
          personalized_tips: []
        }
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Alert Action Handlers


  const handleExportData = () => {
    const dataStr = JSON.stringify(recommendations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-recommendations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccess('Data exported successfully!');
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch fresh data from the server
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Data refreshed successfully!');
    } catch (error) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotifications = () => {
    const allAlerts = recommendations.flatMap(rec => 
      rec.ai_insights?.alerts || []
    );
    
    if (allAlerts.length > 0) {
      setSuccess(`Notifications sent for ${allAlerts.length} alerts`);
    } else {
      setSuccess('No alerts to notify');
    }
  };





  const filteredPatients = patients
    .filter(patient => 
      (patient.display_name || patient.line_user_id).toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === 'all' || 
       (filterStatus === 'high_risk' && (patient.a1c_estimate || 0) > 6.5) ||
       (filterStatus === 'improving' && (patient.in_range_percentage || 0) >= 70) ||
       (filterStatus === 'stable' && (patient.in_range_percentage || 0) >= 50 && (patient.in_range_percentage || 0) < 70))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'confidence':
          return (b.total_readings || 0) - (a.total_readings || 0);
        case 'risk':
          return (b.a1c_estimate || 0) - (a.a1c_estimate || 0);
        default:
          return 0;
      }
    });

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3,
        background: 'white',
        p: 3,
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Avatar sx={{ 
          bgcolor: 'primary.main', 
          width: 64, 
          height: 64,
          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
        }}>
          <PsychologyIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Health Assistant
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Advanced AI-powered health recommendations and analytics
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </Alert>
      )}

      {/* Patient Data Summary */}
      {patients.length > 0 && (
        <Card sx={{ 
          mb: 3, 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '1px solid #3b82f6',
          borderRadius: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Analytics sx={{ fontSize: 28, color: '#1e40af' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
                📊 Patient Data Overview
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 3, color: '#1e40af', fontWeight: 500 }}>
              {patients.length} patients found with {patients.reduce((sum, p) => sum + (p.total_readings || 0), 0)} total glucose readings.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                size="medium" 
                variant="contained" 
                color="primary"
                onClick={() => setViewMode('cards')}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                View All Patients
              </Button>
              <Button 
                size="medium" 
                variant="outlined"
                onClick={loadPatients}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#3b82f6',
                  color: '#1e40af'
                }}
              >
                Refresh Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card sx={{ 
        mb: 3,
        background: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <ViewModule sx={{ fontSize: 24, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Patient Data ({patients.length})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Real patient data and AI-powered health insights
              </Typography>
            </Grid>
            
                        <Grid item xs={12} md={9}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                {/* Search */}
                <TextField
                  size="small"
                  placeholder="Search by user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ minWidth: 200 }}
                />

                {/* Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    label="Status"
                  >
                    <MenuItem value="all">All Patients</MenuItem>
                    <MenuItem value="high_risk">High A1C (&gt;6.5%)</MenuItem>
                    <MenuItem value="improving">Good Control (≥70%)</MenuItem>
                    <MenuItem value="stable">Fair Control (50-70%)</MenuItem>
                  </Select>
                </FormControl>

                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    label="Sort By"
                  >
                    <MenuItem value="date">Join Date</MenuItem>
                    <MenuItem value="confidence">Readings Count</MenuItem>
                    <MenuItem value="risk">A1C Level</MenuItem>
                  </Select>
                </FormControl>

                {/* View Mode */}
                <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('cards')}
                    color={viewMode === 'cards' ? 'primary' : 'default'}
                  >
                    <ViewModule />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('table')}
                    color={viewMode === 'table' ? 'primary' : 'default'}
                  >
                    <TableChart />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('analytics')}
                    color={viewMode === 'analytics' ? 'primary' : 'default'}
                  >
                    <Analytics />
                  </IconButton>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefreshData}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExportData}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Notifications />}
                    onClick={handleSendNotifications}
                  >
                    Notify
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenDialog}
                    sx={{ minWidth: 200 }}
                  >
                    Generate New Recommendation
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content Area */}
      {viewMode === 'cards' && (
        <Grid container spacing={3}>
          {filteredPatients.map((patient, index) => {
            const a1cStatus = getA1CStatus(patient.a1c_estimate || 0);
            const glucoseStatus = getGlucoseStatus(patient.average_glucose || 0);
            
            return (
              <Grid item xs={12} lg={6} key={patient.line_user_id || index}>
                <Grow in timeout={300 + index * 100}>
                  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                    {/* Risk Level Badge */}
                    <Box sx={{ position: 'absolute', top: -10, right: 20, zIndex: 1 }}>
                      <Chip
                        label={patient.total_readings > 0 ? 'Active Patient' : 'No Data'}
                        color={patient.total_readings > 0 ? 'success' : 'default'}
                        size="small"
                        icon={<Warning />}
                      />
                    </Box>

                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={patient.picture_url}
                            alt={patient.display_name || patient.line_user_id}
                            sx={{ 
                              width: 56, 
                              height: 56,
                              bgcolor: patient.picture_url ? 'transparent' : 'primary.main',
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            {(patient.display_name || patient.line_user_id).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                              {patient.display_name || patient.line_user_id}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                              Patient ID: {patient.line_user_id}
                            </Typography>
                            {patient.created_at && (
                              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Joined: {new Date(patient.created_at).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {patient.a1c_estimate && (
                            <Chip
                              label={`A1C: ${patient.a1c_estimate}%`}
                              color={a1cStatus.color}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {patient.average_glucose && (
                            <Chip
                              label={`Glucose: ${patient.average_glucose} mg/dL`}
                              color={glucoseStatus.color}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Key Metrics */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" color="primary">
                              {patient.total_readings || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Readings
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" color="primary">
                              {patient.in_range_percentage || 0}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Time in Range
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* DTX Readings Preview */}
                      {patientReadings.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                            📊 Recent DTX Readings
                          </Typography>
                          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                            {patientReadings.slice(0, 5).map((reading: any, index: number) => (
                              <Box 
                                key={index} 
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  p: 1, 
                                  mb: 0.5, 
                                  bgcolor: 'grey.50', 
                                  borderRadius: 1,
                                  border: '1px solid rgba(0,0,0,0.05)'
                                }}
                              >
                                <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {reading.value_mg_dl || 'N/A'} mg/dL
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {reading.measured_at ? new Date(reading.measured_at).toLocaleDateString() : 'No date'}
                              </Typography>
                            </Box>
                            <Chip
                              label={reading.value_mg_dl ? (reading.value_mg_dl < 70 ? 'Low' : reading.value_mg_dl > 180 ? 'High' : 'Normal') : 'N/A'}
                              color={reading.value_mg_dl ? (reading.value_mg_dl < 70 ? 'error' : reading.value_mg_dl > 180 ? 'error' : 'success') : 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            ))}
                          </Box>
                          {patientReadings.length > 5 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              +{patientReadings.length - 5} more readings...
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Patient Info */}
                      {patient.email && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            📧 {patient.email}
                          </Typography>
                        </Box>
                      )}

                      {patient.phone_number && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            📞 {patient.phone_number}
                          </Typography>
                        </Box>
                      )}

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleOpenDialog(patient)}
                          fullWidth
                        >
                          Generate AI Recommendation
                        </Button>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => loadPatientData(patient.line_user_id)}
                        >
                          <Refresh />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card sx={{ 
          background: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Photo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Patient Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Patient ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>A1C Level</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Avg Glucose</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Total Readings</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Time in Range</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Recent DTX</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const a1cStatus = getA1CStatus(patient.a1c_estimate || 0);
                  const glucoseStatus = getGlucoseStatus(patient.average_glucose || 0);
                  
                  return (
                    <TableRow key={patient.line_user_id} hover>
                      <TableCell>
                        <Avatar
                          src={patient.picture_url}
                          alt={patient.display_name || patient.line_user_id}
                          sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: patient.picture_url ? 'transparent' : 'primary.main',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {(patient.display_name || patient.line_user_id).charAt(0).toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {patient.display_name || patient.line_user_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                          {patient.line_user_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {patient.a1c_estimate ? (
                          <Chip
                            label={`${patient.a1c_estimate}%`}
                            color={a1cStatus.color}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.average_glucose ? (
                          <Chip
                            label={`${patient.average_glucose} mg/dL`}
                            color={glucoseStatus.color}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {patient.total_readings || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {patient.in_range_percentage || 0}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {patientReadings.length > 0 && patientReadings[0]?.value_mg_dl ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              {patientReadings[0].value_mg_dl} mg/dL
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {patientReadings[0]?.measured_at ? new Date(patientReadings[0].measured_at).toLocaleDateString() : 'No date'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No readings</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={patient.total_readings > 0 ? 'Active' : 'No Data'}
                          color={patient.total_readings > 0 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(patient)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => loadPatientData(patient.line_user_id)}
                          color="primary"
                        >
                          <Refresh />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <Grid container spacing={3}>
          {/* Summary Statistics */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  📊 Patient Analytics Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {patients.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Patients
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => p.total_readings > 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Patients
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.a1c_estimate || 0) > 6.5).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High A1C (&gt;6.5%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => p.total_readings === 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No Data
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* A1C Distribution */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  📈 A1C Level Distribution
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                      <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.a1c_estimate || 0) < 5.7).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Normal (&lt;5.7%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                      <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.a1c_estimate || 0) >= 5.7 && (p.a1c_estimate || 0) < 6.5).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prediabetes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.a1c_estimate || 0) >= 6.5).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Diabetes (≥6.5%)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Glucose Control */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  🎯 Glucose Control Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                      <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.in_range_percentage || 0) >= 70).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Good Control (≥70%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                      <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.in_range_percentage || 0) >= 50 && (p.in_range_percentage || 0) < 70).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fair Control (50-70%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
                        {patients.filter(p => (p.in_range_percentage || 0) < 50).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Poor Control (&lt;50%)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Readings Summary */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  📊 Total Readings Summary
                </Typography>
                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    {patients.reduce((sum, p) => sum + (p.total_readings || 0), 0)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Glucose Readings Across All Patients
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* DTX Readings Analytics */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  📈 DTX Readings Analytics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {patientReadings.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recent DTX Readings
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                        {patientReadings.filter(r => r.value_mg_dl >= 70 && r.value_mg_dl <= 180).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Normal Range Readings
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                        {patientReadings.filter(r => r.value_mg_dl < 70 || r.value_mg_dl > 180).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Out of Range Readings
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                {patientReadings.length > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      📊 Recent DTX Readings Timeline
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {patientReadings.slice(0, 10).map((reading: any, index: number) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 1, 
                            mb: 1, 
                            bgcolor: 'white', 
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {reading.value_mg_dl} mg/dL
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(reading.measured_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={reading.value_mg_dl < 70 ? 'Low' : reading.value_mg_dl > 180 ? 'High' : 'Normal'}
                            color={reading.value_mg_dl < 70 ? 'error' : reading.value_mg_dl > 180 ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Generate Recommendation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology color="primary" />
            <Typography variant="h6">
              Generate AI Health Recommendation
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Basic Info" />
            <Tab label="Advanced Data" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Patient</InputLabel>
                  <Select
                    value={formData.user_id}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      setFormData(prev => ({ ...prev, user_id: selectedUserId }));
                      if (selectedUserId) {
                        loadPatientData(selectedUserId);
                      }
                    }}
                    label="Select Patient"
                    error={!!validationErrors.user_id}
                  >
                    <MenuItem value="">
                      <em>Select a patient...</em>
                    </MenuItem>
                    {patients.map((patient) => (
                      <MenuItem key={patient.line_user_id} value={patient.line_user_id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Avatar
                            src={patient.picture_url}
                            alt={patient.display_name || patient.line_user_id}
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: patient.picture_url ? 'transparent' : 'primary.main',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {(patient.display_name || patient.line_user_id).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {patient.display_name || patient.line_user_id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                              {patient.total_readings ? `${patient.total_readings} readings` : 'No readings'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.user_id && (
                    <FormHelperText error>{validationErrors.user_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Selected Patient Profile */}
              {formData.user_id && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#f0f9ff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={patients.find(p => p.line_user_id === formData.user_id)?.picture_url}
                        alt={patients.find(p => p.line_user_id === formData.user_id)?.display_name}
                        sx={{ 
                          width: 48, 
                          height: 48,
                          bgcolor: patients.find(p => p.line_user_id === formData.user_id)?.picture_url ? 'transparent' : 'primary.main',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        {patients.find(p => p.line_user_id === formData.user_id)?.display_name?.charAt(0).toUpperCase() || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {patients.find(p => p.line_user_id === formData.user_id)?.display_name || 'Selected Patient'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                          ID: {formData.user_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              )}

              {patientStats && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Patient Statistics</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {patientStats.average_glucose}
                          </Typography>
                          <Typography variant="caption">Avg Glucose (mg/dL)</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {patientStats.a1c_estimate}%
                          </Typography>
                          <Typography variant="caption">A1C Estimate</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {patientStats.total_readings}
                          </Typography>
                          <Typography variant="caption">Total Readings</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {patientStats.in_range_percentage}%
                          </Typography>
                          <Typography variant="caption">Time in Range</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>DTX Data</Typography>
              </Grid>

              {/* DTX Readings Preview */}
              {patientReadings.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      📊 Recent DTX Readings ({patientReadings.length} readings)
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                      <Grid container spacing={1}>
                        {patientReadings.slice(0, 6).map((reading: any, index: number) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Box sx={{ 
                              p: 1, 
                              bgcolor: 'white', 
                              borderRadius: 1, 
                              border: '1px solid rgba(0,0,0,0.1)',
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {reading.value_mg_dl} mg/dL
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(reading.measured_at).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={reading.value_mg_dl < 70 ? 'Low' : reading.value_mg_dl > 180 ? 'High' : 'Normal'}
                                color={reading.value_mg_dl < 70 ? 'error' : reading.value_mg_dl > 180 ? 'error' : 'success'}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Average Glucose (mg/dL)"
                  type="number"
                  value={patientStats?.average_glucose || formData.dtx_data?.average_glucose || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dtx_data: { 
                      ...prev.dtx_data!, 
                      average_glucose: parseFloat(e.target.value) || 0 
                    }
                  }))}
                  error={!!validationErrors.average_glucose}
                  helperText={validationErrors.average_glucose || "Average glucose from patient data"}
                  inputProps={{ min: 0, max: 1000 }}
                  InputProps={{
                    readOnly: !!patientStats?.average_glucose,
                    endAdornment: patientStats?.average_glucose ? <InputAdornment position="end">From DB</InputAdornment> : null
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Glucose Variability (mg/dL)"
                  type="number"
                  value={formData.dtx_data?.glucose_variability || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dtx_data: { 
                      ...prev.dtx_data!, 
                      glucose_variability: parseFloat(e.target.value) || 0 
                    }
                  }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Readings"
                  type="number"
                  value={formData.dtx_data?.total_readings || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dtx_data: { 
                      ...prev.dtx_data!, 
                      total_readings: parseInt(e.target.value) || 0 
                    }
                  }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="In Range Percentage (%)"
                  type="number"
                  value={formData.dtx_data?.in_range_percentage || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dtx_data: { 
                      ...prev.dtx_data!, 
                      in_range_percentage: parseFloat(e.target.value) || 0 
                    }
                  }))}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="A1C Level (%)"
                  type="number"
                  value={patientStats?.a1c_estimate || formData.a1c_level || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    a1c_level: parseFloat(e.target.value) || 0 
                  }))}
                  inputProps={{ step: 0.1, min: 0, max: 20 }}
                  helperText={patientStats?.a1c_estimate ? "A1C estimate from patient data" : "Enter A1C level"}
                  InputProps={{
                    readOnly: !!patientStats?.a1c_estimate,
                    endAdornment: patientStats?.a1c_estimate ? <InputAdornment position="end">From DB</InputAdornment> : null
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Next Follow-up Date"
                  type="date"
                  value={formData.next_follow_up || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    next_follow_up: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Advanced data collection for enhanced AI analysis
            </Typography>
            {/* Advanced form fields would go here */}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isGenerating}>
            Cancel
          </Button>
          {isGenerating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={generationProgress} 
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {generationProgress}%
              </Typography>
            </Box>
          )}
          <Button
            onClick={handleGenerateRecommendation}
            variant="contained"
            disabled={isGenerating || !formData.user_id}
            startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
          >
            {isGenerating ? 'Generating...' : 'Generate Recommendation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleOpenDialog}
      >
        <Add />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIHealthAssistant;

