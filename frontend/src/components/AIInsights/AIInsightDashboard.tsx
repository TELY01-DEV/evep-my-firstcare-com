import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Tabs,
  Tab,
  Button,
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
  LinearProgress,
} from '@mui/material';
import {
  Psychology,
  Assessment,
  School,
  Person,
  Business,
  LocalHospital,
  TrendingUp,
  Insights,
  AutoAwesome,
  SmartToy,
  Add,
  Refresh,
  Visibility,
  ContentCopy,
  Analytics,
  Timeline,
  BarChart,
  PieChart,
  Settings,
  Help,
  Search,
  CheckCircle,
} from '@mui/icons-material';
import unifiedApi from '../../services/unifiedApi';
import AIInsightGenerator from './AIInsightGenerator';
import AIInsightSearch from './AIInsightSearch';

interface AIInsightDashboardProps {
  userRole?: string;
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
      id={`ai-insight-tabpanel-${index}`}
      aria-labelledby={`ai-insight-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIInsightDashboard: React.FC<AIInsightDashboardProps> = ({
  userRole = 'doctor',
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [recentInsights, setRecentInsights] = useState<any[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);

  const roleOptions = [
    { value: 'doctor', label: 'Doctor', icon: <LocalHospital />, color: '#1976d2' },
    { value: 'teacher', label: 'Teacher', icon: <School />, color: '#388e3c' },
    { value: 'parent', label: 'Parent', icon: <Person />, color: '#f57c00' },
    { value: 'executive', label: 'Executive', icon: <Business />, color: '#7b1fa2' },
    { value: 'medical_staff', label: 'Medical Staff', icon: <LocalHospital />, color: '#d32f2f' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load statistics (with fallback for permission issues)
      try {
        const statsResponse = await unifiedApi.get('/api/v1/ai-insights/statistics');

        if (statsResponse.data.success) {
          setStatistics(statsResponse.data.statistics);
        }
      } catch (statsErr: any) {
        // If statistics fails due to permissions, use default statistics
        console.warn('Statistics endpoint failed, using defaults:', statsErr.response?.data?.detail);
        setStatistics({
          total_insights: 0,
          insights_today: 0,
          average_confidence: 0,
          top_insight_types: [],
          recent_activity: []
        });
      }

      // Load recent insights
      try {
        const insightsResponse = await unifiedApi.post(
          '/api/v1/ai-insights/search-insights',
          {
            query: '',
            n_results: 5,
          }
        );

        if (insightsResponse.data.success) {
          setRecentInsights(insightsResponse.data.results);
        }
      } catch (insightsErr: any) {
        // If insights search fails, use empty results
        console.warn('Insights search failed:', insightsErr.response?.data?.detail);
        setRecentInsights([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInsightSelected = (insight: any) => {
    setSelectedInsight(insight);
    setShowInsightDialog(true);
  };

  const handleInsightGenerated = (insight: any) => {
    // Refresh dashboard data after generating new insight
    loadDashboardData();
  };

  const copyInsightText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRoleIcon = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.icon : <Psychology />;
  };

  const getRoleColor = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.color : '#666';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Psychology color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4">
              AI Insights Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intelligent analysis and insights for vision screening
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowGeneratorDialog(true)}
          >
            Generate Insight
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Insights"
              value={statistics.vector_store_stats?.document_count || 0}
              icon={<Insights />}
              color="#1976d2"
              subtitle="Generated insights"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Templates"
              value={statistics.prompt_template_stats?.active_templates || 0}
              icon={<Assessment />}
              color="#388e3c"
              subtitle="Prompt templates"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Roles Supported"
              value={Object.keys(statistics.prompt_template_stats?.role_distribution || {}).length}
              icon={<Person />}
              color="#f57c00"
              subtitle="User roles"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="System Health"
              value="Healthy"
              icon={<CheckCircle />}
              color="#388e3c"
              subtitle="All systems operational"
            />
          </Grid>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI insights tabs">
            <Tab label="Overview" icon={<Analytics />} />
            <Tab label="Generate Insights" icon={<AutoAwesome />} />
            <Tab label="Search Insights" icon={<Search />} />
            <Tab label="Recent Insights" icon={<Timeline />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Overview Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Insights Overview
                  </Typography>
                  <Typography variant="body1" paragraph>
                    The AI Insights system provides intelligent analysis of vision screening data,
                    generating role-specific insights for doctors, teachers, parents, and executives.
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {roleOptions.map((role) => (
                      <Chip
                        key={role.value}
                        icon={role.icon}
                        label={role.label}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Key Features
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <AutoAwesome />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Role-based Insights"
                        secondary="Tailored analysis for different user roles"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          <Search />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Smart Search"
                        secondary="Find similar cases and insights"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <TrendingUp />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Trend Analysis"
                        secondary="Identify patterns and trends"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setShowGeneratorDialog(true)}
                      fullWidth
                    >
                      Generate New Insight
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Search />}
                      onClick={() => setTabValue(2)}
                      fullWidth
                    >
                      Search Insights
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Timeline />}
                      onClick={() => setTabValue(3)}
                      fullWidth
                    >
                      View Recent
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Generate Insights Tab */}
          <AIInsightGenerator onInsightGenerated={handleInsightGenerated} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Search Insights Tab */}
          <AIInsightSearch onInsightSelected={handleInsightSelected} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Recent Insights Tab */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Recent AI Insights
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : recentInsights.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                <SmartToy sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No recent insights
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Generate your first AI insight to get started.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowGeneratorDialog(true)}
                >
                  Generate Insight
                </Button>
              </Paper>
            ) : (
              <List>
                {recentInsights.map((insight, index) => (
                  <Paper key={index} elevation={1} sx={{ mb: 2 }}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleInsightSelected(insight)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getRoleColor(insight.metadata?.role || 'unknown') }}>
                          {getRoleIcon(insight.metadata?.role || 'unknown')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" component="span">
                              AI Insight
                            </Typography>
                            <Chip
                              label={insight.metadata?.role || 'unknown'}
                              size="small"
                              color="primary"
                            />
                            {insight.metadata?.insight_type && (
                              <Chip
                                label={insight.metadata.insight_type}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                              }}
                            >
                              {insight.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(insight.metadata?.created_at || '')}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box>
                        <Tooltip title="Copy insight text">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyInsightText(insight.text);
                            }}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View full insight">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightSelected(insight);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Insight Detail Dialog */}
      <Dialog
        open={showInsightDialog}
        onClose={() => setShowInsightDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AutoAwesome color="primary" />
            <Typography variant="h6">
              AI Insight Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  label={selectedInsight.metadata?.role || 'unknown'}
                  color="primary"
                />
                {selectedInsight.metadata?.insight_type && (
                  <Chip
                    label={selectedInsight.metadata.insight_type}
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                {selectedInsight.text}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Generated At
                  </Typography>
                  <Typography variant="body2">
                    {formatTimestamp(selectedInsight.metadata?.created_at || '')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Model Used
                  </Typography>
                  <Typography variant="body2">
                    {selectedInsight.metadata?.model_used || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Template Used
                  </Typography>
                  <Typography variant="body2">
                    {selectedInsight.metadata?.template_used || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Success Status
                  </Typography>
                  <Typography variant="body2">
                    {selectedInsight.metadata?.success ? 'Success' : 'Failed'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => copyInsightText(selectedInsight?.text || '')}
            startIcon={<ContentCopy />}
          >
            Copy Text
          </Button>
          <Button onClick={() => setShowInsightDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insight Generator Dialog */}
      <Dialog
        open={showGeneratorDialog}
        onClose={() => setShowGeneratorDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AutoAwesome color="primary" />
            <Typography variant="h6">
              Generate AI Insight
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <AIInsightGenerator onInsightGenerated={handleInsightGenerated} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGeneratorDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIInsightDashboard;
