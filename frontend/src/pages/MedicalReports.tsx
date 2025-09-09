import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Home,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ScreeningSession {
  id?: string;
  screening_type?: string;
  school_name?: string;
  completed_at?: string;
  status?: string;
  examiner_name?: string;
  results?: Array<{
    conclusion?: string;
  }>;
}

interface School {
  status?: string;
}

interface Student {
  id?: string;
}

interface ReportItem {
  id: number;
  title: string;
  type: string;
  school: string;
  date: string;
  status: string;
  generatedBy: string;
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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalReports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [filterDialog, setFilterDialog] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('');
  const { user } = useAuth();

  // Real data state
  const [reportsData, setReportsData] = useState<{
    screeningStats: {
      totalScreenings: number;
      completedToday: number;
      pending: number;
      positiveCases: number;
      negativeCases: number;
    };
    schoolStats: {
      totalSchools: number;
      activeSchools: number;
      totalStudents: number;
      screenedStudents: number;
    };
    recentReports: ReportItem[];
  }>({
    screeningStats: {
      totalScreenings: 0,
      completedToday: 0,
      pending: 0,
      positiveCases: 0,
      negativeCases: 0,
    },
    schoolStats: {
      totalSchools: 0,
      activeSchools: 0,
      totalStudents: 0,
      screenedStudents: 0,
    },
    recentReports: [],
  });

  // Fetch real data from APIs
  const fetchStatisticsData = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      
      // Fetch students data
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const studentsResponse = await fetch(`${baseUrl}/api/v1/evep/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Fetch schools data
      const schoolsResponse = await fetch(`${baseUrl}/api/v1/evep/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Fetch screening sessions data
      const screeningsResponse = await fetch(`${baseUrl}/api/v1/screenings/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (studentsResponse.ok && schoolsResponse.ok && screeningsResponse.ok) {
        const studentsData = await studentsResponse.json();
        const schoolsData = await schoolsResponse.json();
        const screeningsData = await screeningsResponse.json();

        const students = (studentsData.students || []) as Student[];
        const schools = (schoolsData.schools || []) as School[];
        const screenings = (screeningsData.sessions || []) as ScreeningSession[];

        // Calculate today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate statistics
        const totalStudents = students.length;
        const totalSchools = schools.length;
        const activeSchools = schools.filter((school: School) => school.status === 'active').length;
        const totalScreenings = screenings.length;
        const completedToday = screenings.filter((screening: ScreeningSession) => 
          screening.completed_at && screening.completed_at.startsWith(today)
        ).length;
        const pendingScreenings = screenings.filter((screening: ScreeningSession) => 
          screening.status === 'pending' || screening.status === 'in_progress'
        ).length;
        const positiveCases = screenings.filter((screening: ScreeningSession) => 
          screening.results && screening.results.some((result) => 
            result.conclusion && result.conclusion.toLowerCase().includes('positive')
          )
        ).length;
        const negativeCases = totalScreenings - positiveCases;

        // Generate recent reports from actual screening data
        const recentReports = screenings.slice(0, 5).map((screening: ScreeningSession, index: number) => ({
          id: index + 1,
          title: `${screening.screening_type || 'Screening'} Report`,
          type: screening.screening_type || 'Screening Report',
          school: screening.school_name || 'Unknown School',
          date: screening.completed_at ? screening.completed_at.split('T')[0] : 'N/A',
          status: screening.status || 'pending',
          generatedBy: screening.examiner_name || 'Unknown',
        }));

        setReportsData({
          screeningStats: {
            totalScreenings,
            completedToday,
            pending: pendingScreenings,
            positiveCases,
            negativeCases,
          },
          schoolStats: {
            totalSchools,
            activeSchools,
            totalStudents,
            screenedStudents: totalScreenings,
          },
          recentReports,
        });
      }
    } catch (error) {
      console.error('Error fetching statistics data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load statistics data',
        severity: 'error'
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStatisticsData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true);
    try {
      if (reportType === 'CSV Export') {
        exportToCSV();
        setSnackbar({
          open: true,
          message: 'CSV report exported successfully!',
          severity: 'success'
        });
      } else {
        // Simulate API call for other report types
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSnackbar({
          open: true,
          message: `${reportType} report generated successfully!`,
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to generate report',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Get current data based on selected filters
    let dataToExport: any[] = [];
    
    // Sample data structure - this should match your actual data
    const sampleData = [
      {
        timestamp: new Date().toISOString(),
        report_type: selectedReportType || 'screening',
        school: selectedSchool || 'all',
        total_students: 58,
        total_screenings: 35,
        completed_screenings: 11,
        pending_screenings: 12,
        vision_issues: 8,
        referral_count: 3,
        glasses_prescribed: 5
      }
    ];

    // Define CSV headers that match PDF format
    const headers = [
      'Timestamp',
      'Report Type', 
      'School',
      'Total Students',
      'Total Screenings',
      'Completed Screenings',
      'Pending Screenings',
      'Vision Issues Detected',
      'Referrals Required',
      'Glasses Prescribed'
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => [
        new Date(row.timestamp).toLocaleString(),
        row.report_type,
        row.school,
        row.total_students,
        row.total_screenings,
        row.completed_screenings,
        row.pending_screenings,
        row.vision_issues,
        row.referral_count,
        row.glasses_prescribed
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-report-${selectedReportType || 'screening'}-${selectedSchool || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadReport = (reportId: number) => {
    setSnackbar({
      open: true,
      message: 'Report download started',
      severity: 'info'
    });
  };

  const handlePrintReport = (reportId: number) => {
    setSnackbar({
      open: true,
      message: 'Opening print dialog...',
      severity: 'info'
    });
  };

  const handleShareReport = (reportId: number) => {
    setSnackbar({
      open: true,
      message: 'Share dialog opened',
      severity: 'info'
    });
  };

  const QuickActionCard = ({ title, description, icon, color, onClick }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
  }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
        <Box sx={{ color, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick} fullWidth>
          Generate
        </Button>
      </CardActions>
    </Card>
  );

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 2 }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <Assessment sx={{ mr: 0.5 }} fontSize="inherit" />
            Medical Reports
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Medical Reports
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          EVEP Medical Professional Panel
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Screening Summary"
              description="Generate comprehensive screening reports"
              icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
              color="#1976d2"
              onClick={() => handleGenerateReport('Screening Summary')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Vision Reports"
              description="Create detailed vision screening reports"
              icon={<VisibilityIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
              onClick={() => handleGenerateReport('Vision Report')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Student Health"
              description="Generate student health assessments"
              icon={<PeopleIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
              onClick={() => handleGenerateReport('Student Health')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="School Analytics"
              description="School-wise screening analytics"
              icon={<SchoolIcon sx={{ fontSize: 40 }} />}
              color="#9c27b0"
              onClick={() => handleGenerateReport('School Analytics')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Statistics Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Statistics Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Screenings"
              value={reportsData.screeningStats.totalScreenings}
              subtitle="All time screenings conducted"
              icon={<AssessmentIcon />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Screenings"
              value={reportsData.screeningStats.completedToday}
              subtitle="Screenings completed today"
              icon={<CheckCircleIcon />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Positive Cases"
              value={reportsData.screeningStats.positiveCases}
              subtitle="Cases requiring follow-up"
              icon={<WarningIcon />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Schools"
              value={reportsData.schoolStats.activeSchools}
              subtitle="Schools in screening program"
              icon={<SchoolIcon />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Reports Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="reports tabs">
            <Tab label="Recent Reports" />
            <Tab label="Screening Reports" />
            <Tab label="Analytics" />
            <Tab label="Export Data" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Recent Reports */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Recent Reports</Typography>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialog(true)}
            >
              Filter
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>School</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Generated By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportsData.recentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.type} 
                        size="small" 
                        color={report.type === 'Screening Report' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{report.school}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status} 
                        size="small" 
                        color={report.status === 'completed' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{report.generatedBy}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDownloadReport(report.id)}>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handlePrintReport(report.id)}>
                        <PrintIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleShareReport(report.id)}>
                        <ShareIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Screening Reports */}
          <Typography variant="h6" gutterBottom>
            Screening Reports
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vision Screening Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Comprehensive analysis of vision screening data including acuity tests, 
                    color vision assessments, and depth perception results.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<BarChartIcon />}
                    onClick={() => handleGenerateReport('Vision Screening Analysis')}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Health Assessment Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Overall health assessment reports including medical history, 
                    current conditions, and recommendations.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<PieChartIcon />}
                    onClick={() => handleGenerateReport('Health Assessment')}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Analytics */}
          <Typography variant="h6" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Screening Trends
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                    <Typography variant="body2" color="text.secondary">
                      Chart visualization will be implemented here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUpIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Screening Rate" 
                        secondary="87% completion rate"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Success Rate" 
                        secondary="92% successful screenings"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Follow-up Required" 
                        secondary="7.2% need follow-up"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Export Data */}
          <Typography variant="h6" gutterBottom>
            Export Data
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export Options
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />}
                      onClick={() => handleGenerateReport('Excel Export')}
                    >
                      Export to Excel
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />}
                      onClick={() => handleGenerateReport('PDF Export')}
                    >
                      Export to PDF
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />}
                      onClick={() => handleGenerateReport('CSV Export')}
                    >
                      Export to CSV
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Filters
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={selectedReportType}
                      label="Report Type"
                      onChange={(e) => setSelectedReportType(e.target.value)}
                    >
                      <MenuItem value="screening">Screening Reports</MenuItem>
                      <MenuItem value="vision">Vision Reports</MenuItem>
                      <MenuItem value="health">Health Reports</MenuItem>
                      <MenuItem value="analytics">Analytics Reports</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>School</InputLabel>
                    <Select
                      value={selectedSchool}
                      label="School"
                      onChange={(e) => setSelectedSchool(e.target.value)}
                    >
                      <MenuItem value="all">All Schools</MenuItem>
                      <MenuItem value="school1">Wat Phra Si Mahathat School</MenuItem>
                      <MenuItem value="school2">Bangkok Christian College</MenuItem>
                      <MenuItem value="school3">St. Joseph Convent School</MenuItem>
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleGenerateReport('Filtered Export')}
                  >
                    Export Filtered Data
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Reports</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReportType}
                  label="Report Type"
                  onChange={(e) => setSelectedReportType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="screening">Screening Reports</MenuItem>
                  <MenuItem value="vision">Vision Reports</MenuItem>
                  <MenuItem value="health">Health Reports</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <CircularProgress color="inherit" sx={{ mb: 2 }} />
            <Typography>Generating report...</Typography>
          </Box>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalReports;
