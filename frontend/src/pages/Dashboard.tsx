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
} from '@mui/material';
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalPatients: number;
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'info';
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/reporting/api/v1/reports/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const responseData = await response.json();
      
      // Map API response to component expected format
      if (responseData.status === 'success' && responseData.data) {
        const apiData = responseData.data;
        setStats({
          totalPatients: apiData.total_patients || 0,
          totalScreenings: apiData.total_screenings || 0,
          pendingScreenings: apiData.pending_assessments || 0,
          completedScreenings: apiData.total_assessments || 0,
          recentActivity: [
            {
              id: '1',
              type: 'screening',
              description: `${apiData.screenings_today} new screenings today`,
              timestamp: apiData.last_updated,
              status: 'success' as const,
            },
            {
              id: '2',
              type: 'patient',
              description: `${apiData.new_patients_today} new patients registered today`,
              timestamp: apiData.last_updated,
              status: 'info' as const,
            },
            {
              id: '3',
              type: 'alert',
              description: `${apiData.urgent_cases} urgent cases require attention`,
              timestamp: apiData.last_updated,
              status: 'warning' as const,
            },
          ],
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
      // Set mock data for development
      setStats({
        totalPatients: 156,
        totalScreenings: 89,
        pendingScreenings: 12,
        completedScreenings: 77,
        recentActivity: [
          {
            id: '1',
            type: 'screening',
            description: 'New screening completed for Patient #123',
            timestamp: '2024-01-15T10:30:00Z',
            status: 'success',
          },
          {
            id: '2',
            type: 'patient',
            description: 'New patient registered: John Doe',
            timestamp: '2024-01-15T09:15:00Z',
            status: 'info',
          },
          {
            id: '3',
            type: 'alert',
            description: 'Follow-up required for Patient #89',
            timestamp: '2024-01-15T08:45:00Z',
            status: 'warning',
          },
        ],
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.first_name}!
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
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
