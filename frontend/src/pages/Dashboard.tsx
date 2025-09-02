import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Person,
  Visibility,
  Assessment,
  TrendingUp,
  Notifications,
  Add,
  Refresh,
  School,
  LocalHospital,
  FamilyRestroom,
  AdminPanelSettings,
  CalendarToday,
  CheckCircle,
  Warning,
  Info,
  Home,
  Dashboard as DashboardIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../utils/api';

interface DashboardStats {
  totalPatients: number;
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  totalStudents: number;
  totalTeachers: number;
  totalSchools: number;
  schoolBasedScreenings: number;
  visionScreenings: number;
  standardVisionScreenings: number;
  hospitalMobileUnit: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'info';
  }>;
  chartData: {
    studentGenderBreakdown: Array<{ name: string; value: number }>;
    gradeLevelBreakdown: Array<{ name: string; value: number }>;
    patientGenderBreakdown: Array<{ name: string; value: number }>;
    patientAgeBreakdown: Array<{ name: string; value: number }>;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log user data
  useEffect(() => {
    console.log('Dashboard - User data:', user);
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8014/api/v1/auth/me');

      if (response.ok) {
        const profileData = await response.json();
        console.log('User profile data:', profileData);
        // Update localStorage with complete user data
        const currentUser = JSON.parse(localStorage.getItem('evep_user') || '{}');
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('evep_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from dashboard endpoint
      const dashboardResponse = await authenticatedFetch('http://localhost:8014/api/v1/dashboard/stats');

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard data received:', dashboardData);
        
        // Use the dashboard data directly
        setStats({
          totalPatients: dashboardData.totalPatients || 0,
          totalScreenings: dashboardData.totalScreenings || 0,
          pendingScreenings: dashboardData.pendingScreenings || 0,
          completedScreenings: dashboardData.completedScreenings || 0,
          totalStudents: dashboardData.totalStudents || 0,
          totalTeachers: dashboardData.totalTeachers || 0,
          totalSchools: dashboardData.totalSchools || 0,
          schoolBasedScreenings: dashboardData.totalSchoolScreenings || 0,
          visionScreenings: dashboardData.totalVisionScreenings || 0,
          standardVisionScreenings: dashboardData.totalStandardVisionScreenings || 0,
          hospitalMobileUnit: dashboardData.totalHospitalMobileUnit || 0,
          chartData: {
            studentGenderBreakdown: [],
            gradeLevelBreakdown: [],
            patientGenderBreakdown: [],
            patientAgeBreakdown: [],
          },
          recentActivity: dashboardData.recentActivity || [],
        });
        return;
      }
      
      // Fallback: Fetch data from individual endpoints if dashboard fails
      console.log('Dashboard endpoint failed, falling back to individual endpoints');
      const [patientsResponse, screeningsResponse, schoolsResponse, teachersResponse] = await Promise.all([
        authenticatedFetch('http://localhost:8014/api/v1/evep/students'),
        authenticatedFetch('http://localhost:8014/api/v1/screenings/sessions'),
        authenticatedFetch('http://localhost:8014/api/v1/evep/schools'),
        authenticatedFetch('http://localhost:8014/api/v1/evep/teachers')
      ]);

      // Parse responses
      const patientsData = await patientsResponse.json();
      const screeningsData = await screeningsResponse.json();
      const schoolsData = await schoolsResponse.json();
      const teachersData = await teachersResponse.json();

      // Calculate statistics
      const totalPatients = patientsData.students?.length || patientsData.total_count || 0;
      const totalScreenings = screeningsData.length || 0; // screeningsData is already an array
      const completedScreenings = screeningsData.filter((s: any) => s.status === 'completed').length || 0;
      const pendingScreenings = screeningsData.filter((s: any) => s.status === 'pending').length || 0;
      const totalSchools = schoolsData.schools?.length || 0;
      const totalTeachers = teachersData.teachers?.length || 0;

      // Get today's date for recent activity
      const today = new Date().toISOString().split('T')[0];
      const screeningsToday = screeningsData.filter((s: any) => 
        s.created_at?.startsWith(today)
      ).length || 0;

      // Calculate chart data
      const students = patientsData.students || [];
      
      // Student Gender Breakdown
      const studentGenderCount = students.reduce((acc: any, student: any) => {
        const gender = student.gender || 'Unknown';
        const genderLabel = gender === '1' ? 'Male' : gender === '2' ? 'Female' : gender;
        acc[genderLabel] = (acc[genderLabel] || 0) + 1;
        return acc;
      }, {});
      
      const studentGenderBreakdown = Object.entries(studentGenderCount).map(([name, value]) => ({
        name,
        value: value as number
      }));

      // Grade Level Breakdown
      const gradeLevelCount = students.reduce((acc: any, student: any) => {
        const grade = student.grade_level || student.grade_number || 'Unknown';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {});
      
      const gradeLevelBreakdown = Object.entries(gradeLevelCount).map(([name, value]) => ({
        name,
        value: value as number
      }));

      // Patient Gender Breakdown (same as students for now)
      const patientGenderBreakdown = [...studentGenderBreakdown];

      // Patient Age Breakdown (calculate from birth_date)
      const patientAgeCount = students.reduce((acc: any, student: any) => {
        if (student.birth_date) {
          const birthYear = new Date(student.birth_date).getFullYear();
          const currentYear = new Date().getFullYear();
          const calculatedAge = currentYear - birthYear;
          const ageKey = `${calculatedAge} years`;
          acc[ageKey] = (acc[ageKey] || 0) + 1;
        } else {
          acc['Unknown'] = (acc['Unknown'] || 0) + 1;
        }
        return acc;
      }, {});
      
      const patientAgeBreakdown = Object.entries(patientAgeCount)
        .sort(([a], [b]) => {
          if (a === 'Unknown') return 1;
          if (b === 'Unknown') return -1;
          const ageA = parseInt(a.split(' ')[0]);
          const ageB = parseInt(b.split(' ')[0]);
          return ageA - ageB;
        })
        .map(([name, value]) => ({
          name,
          value: value as number
        }));

      setStats({
        totalPatients,
        totalScreenings,
        pendingScreenings,
        completedScreenings,
        totalStudents: totalPatients, // Students are the same as patients in this context
        totalTeachers,
        totalSchools,
        schoolBasedScreenings: totalScreenings, // Using total screenings as school-based for now
        visionScreenings: totalScreenings, // Using total screenings as vision screenings for now
        standardVisionScreenings: completedScreenings, // Using completed screenings as standard vision screenings
        hospitalMobileUnit: 0, // Placeholder - will be updated when API is available
        chartData: {
          studentGenderBreakdown,
          gradeLevelBreakdown,
          patientGenderBreakdown,
          patientAgeBreakdown,
        },
        recentActivity: [
          {
            id: '1',
            type: 'screening',
            description: `${screeningsToday} new screenings today`,
            timestamp: new Date().toISOString(),
            status: 'success' as const,
          },
          {
            id: '2',
            type: 'school',
            description: `${totalSchools} schools in the system`,
            timestamp: new Date().toISOString(),
            status: 'info' as const,
          },
          {
            id: '3',
            type: 'teacher',
            description: `${totalTeachers} teachers/medical staff`,
            timestamp: new Date().toISOString(),
            status: 'warning' as const,
          },
        ],
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
      setStats({
        totalPatients: 0,
        totalScreenings: 0,
        pendingScreenings: 0,
        completedScreenings: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalSchools: 0,
        schoolBasedScreenings: 0,
        visionScreenings: 0,
        standardVisionScreenings: 0,
        hospitalMobileUnit: 0,
        chartData: {
          studentGenderBreakdown: [],
          gradeLevelBreakdown: [],
          patientGenderBreakdown: [],
          patientAgeBreakdown: [],
        },
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'doctor':
        return <LocalHospital />;
      case 'teacher':
        return <School />;
      case 'parent':
        return <FamilyRestroom />;
      case 'admin':
        return <AdminPanelSettings />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'doctor':
        return 'primary';
      case 'teacher':
        return 'secondary';
      case 'parent':
        return 'success';
      case 'admin':
        return 'error';
      default:
        return 'default';
    }
  };

  const getQuickActions = () => {
    const baseActions = [
      { label: 'New Patient', icon: <Add />, path: '/dashboard/patients/new' },
      { label: 'New Screening', icon: <Assessment />, path: '/dashboard/screenings/new' },
      { label: 'View Reports', icon: <TrendingUp />, path: '/dashboard/reports' },
    ];

    switch (user?.role) {
      case 'doctor':
        return [
          ...baseActions,
          { label: 'Patient List', icon: <Person />, path: '/dashboard/patients' },
          { label: 'Screening History', icon: <Visibility />, path: '/dashboard/screenings' },
        ];
      case 'teacher':
        return [
          { label: 'Class Screening', icon: <School />, path: '/dashboard/screenings/class' },
          { label: 'Student List', icon: <Person />, path: '/dashboard/patients' },
          { label: 'Progress Reports', icon: <TrendingUp />, path: '/dashboard/reports' },
        ];
      case 'parent':
        return [
          { label: 'My Children', icon: <FamilyRestroom />, path: '/dashboard/patients' },
          { label: 'Screening Results', icon: <Assessment />, path: '/dashboard/screenings' },
          { label: 'Schedule Appointment', icon: <CalendarToday />, path: '/dashboard/appointments' },
        ];
      case 'admin':
        return [
          { label: 'User Management', icon: <AdminPanelSettings />, path: '/admin/users' },
          { label: 'System Statistics', icon: <TrendingUp />, path: '/admin/stats' },
          { label: 'Settings', icon: <AdminPanelSettings />, path: '/admin/settings' },
        ];
      default:
        return baseActions;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.first_name || 'Admin'} {user?.last_name || ''}!
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Chip
              icon={getRoleIcon()}
              label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              color={getRoleColor() as any}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {user?.organization || 'EVEP Platform'}
            </Typography>
          </Box>
          {user?.last_login && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: '1rem' }} />
              Last login: {new Date(user.last_login).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Notifications />}
            sx={{ borderRadius: 2 }}
          >
            Notifications
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Patients
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.totalPatients}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Screenings
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.totalScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending Screenings
                    </Typography>
                    <Typography variant="h4" component="div" color="warning.main">
                      {stats.pendingScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Warning />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main">
                      {stats.completedScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Statistics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Students
                    </Typography>
                    <Typography variant="h4" component="div" color="info.main">
                      {stats.totalStudents}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <School />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Teachers
                    </Typography>
                    <Typography variant="h4" component="div" color="secondary.main">
                      {stats.totalTeachers}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Person />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Schools
                    </Typography>
                    <Typography variant="h4" component="div" color="primary.main">
                      {stats.totalSchools}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <School />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      School Based Screenings
                    </Typography>
                    <Typography variant="h4" component="div" color="warning.main">
                      {stats.schoolBasedScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Vision Screenings
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main">
                      {stats.visionScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Visibility />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Standard Vision Screening
                    </Typography>
                    <Typography variant="h4" component="div" color="info.main">
                      {stats.standardVisionScreenings}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Hospital Mobile Unit
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main">
                      {stats.hospitalMobileUnit}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <LocalHospital />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          {/* Student Gender Breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Gender Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.chartData.studentGenderBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Grade Level Breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Grade Level Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.chartData.gradeLevelBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Patient Gender Breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Gender Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.chartData.patientGenderBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Patient Age Breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Age Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.chartData.patientAgeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={action.icon}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <List>
                  {stats.recentActivity.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.100' }}>
                            {getStatusIcon(activity.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={new Date(activity.timestamp).toLocaleString()}
                        />
                      </ListItem>
                      {index < stats.recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
