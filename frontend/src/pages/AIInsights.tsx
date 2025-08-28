import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  Lightbulb,
  History,
  Refresh,
  PlayArrow,
  Save,
  Warning,
  CheckCircle,
  Info,
  School,
  Person,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface AIInsight {
  insight_id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  recommendations: string[];
  risk_level?: string;
  data_points: any;
  generated_at: string;
  expires_at?: string;
}

interface InsightRequest {
  insight_type: string;
  patient_id?: string;
  date_range?: string;
  context?: any;
}

const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  
  // Analytics states
  const [analytics, setAnalytics] = useState<any>(null);

  const insightTypes = [
    { value: 'patient_analysis', label: 'Patient Analysis', icon: <Person /> },
    { value: 'screening_trends', label: 'Screening Trends', icon: <TrendingUp /> },
    { value: 'risk_assessment', label: 'Risk Assessment', icon: <Warning /> },
    { value: 'recommendations', label: 'Recommendations', icon: <Lightbulb /> },
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  useEffect(() => {
    fetchInsights();
    fetchAnalytics();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/insights/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        // Mock data for development
        setInsights([
          {
            insight_id: '1',
            insight_type: 'patient_analysis',
            title: 'Patient Analysis Analysis',
            description: 'Patient shows consistent vision improvement over the last 3 screenings',
            confidence_score: 0.85,
            recommendations: [
              'Continue current treatment plan',
              'Schedule follow-up in 6 months',
              'Monitor for any regression'
            ],
            risk_level: 'low',
            data_points: {},
            generated_at: '2024-01-15T10:30:00Z',
          },
          {
            insight_id: '2',
            insight_type: 'screening_trends',
            title: 'Screening Trends Analysis',
            description: 'Class 3A shows 15% improvement in average vision scores',
            confidence_score: 0.92,
            recommendations: [
              'Continue current screening program',
              'Consider expanding to other classes',
              'Share best practices with other schools'
            ],
            risk_level: 'none',
            data_points: {},
            generated_at: '2024-01-14T14:20:00Z',
          },
        ]);
      }
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/insights/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('evep_token');
      
      const request: InsightRequest = {
        insight_type: selectedInsightType,
        date_range: dateRange,
      };

      const response = await fetch('http://localhost:8013/api/v1/insights/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('AI insight generated successfully!');
        setDialogOpen(false);
        fetchInsights();
        fetchAnalytics();
      } else {
        setError('Failed to generate insight');
      }
    } catch (err) {
      console.error('Insight generation error:', err);
      setError('Failed to generate insight');
    } finally {
      setGenerating(false);
    }
  };

  const getInsightIcon = (insightType: string) => {
    const type = insightTypes.find(t => t.value === insightType);
    return type ? type.icon : <Psychology />;
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      case 'none':
        return 'default';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Insights & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Leverage AI to gain insights and make data-driven decisions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Psychology />}
          onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Generate New Insight
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Insights Analytics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {analytics.total_insights || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Insights Generated
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {analytics.insights_by_type?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Insight Types Used
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {user?.role || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Role
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Insights */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Recent AI Insights
            </Typography>
            <Tooltip title="Refresh Insights">
              <IconButton onClick={fetchInsights} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          {insights.length > 0 ? (
            <Grid container spacing={3}>
              {insights.map((insight) => (
                <Grid item xs={12} md={6} key={insight.insight_id}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInsightIcon(insight.insight_type)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(insight.generated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${(insight.confidence_score * 100).toFixed(0)}%`}
                        color={getConfidenceColor(insight.confidence_score) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {insight.description}
                    </Typography>
                    
                    {insight.risk_level && (
                      <Box mb={2}>
                        <Chip
                          label={`Risk: ${insight.risk_level}`}
                          color={getRiskLevelColor(insight.risk_level) as any}
                          size="small"
                        />
                      </Box>
                    )}
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations:
                    </Typography>
                    <List dense>
                      {insight.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckCircle fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Psychology sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No AI Insights Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate your first AI insight to get started
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Generate Insight Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Generate AI Insight
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Insight Type</InputLabel>
                <Select
                  value={selectedInsightType}
                  label="Insight Type"
                  onChange={(e) => setSelectedInsightType(e.target.value)}
                >
                  {insightTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                The AI will analyze your data and provide insights based on the selected type and date range.
                This may take a few moments to generate.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateInsight}
            disabled={!selectedInsightType || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {generating ? 'Generating...' : 'Generate Insight'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIInsights;
