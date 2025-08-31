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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Visibility as ScreeningIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Speed as PerformanceIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

interface SystemStats {
  totalUsers: number;
  totalPatients: number;
  totalScreenings: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  storageUsage: number;
  lastBackup: string;
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8014/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage system users and permissions',
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      path: '/admin/users',
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: <SettingsIcon />,
      color: theme.palette.secondary.main,
      path: '/admin/settings',
    },
    {
      title: 'Security Audit',
      description: 'View security logs and events',
      icon: <SecurityIcon />,
      color: theme.palette.error.main,
      path: '/admin/security',
    },
    {
      title: 'Data Management',
      description: 'Backup and restore data',
      icon: <StorageIcon />,
      color: theme.palette.info.main,
      path: '/admin/data',
    },
  ];

  const recentActivities = [
    {
      action: 'User Login',
      user: 'Dr. Sarah Johnson',
      time: '2 minutes ago',
      type: 'login',
    },
    {
      action: 'Patient Created',
      user: 'Nurse Maria Garcia',
      time: '15 minutes ago',
      type: 'create',
    },
    {
      action: 'Screening Completed',
      user: 'Dr. Michael Chen',
      time: '1 hour ago',
      type: 'screening',
    },
    {
      action: 'System Backup',
      user: 'System',
      time: '2 hours ago',
      type: 'backup',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System overview and management
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/admin/settings')}
          startIcon={<SettingsIcon />}
        >
          System Settings
        </Button>
      </Box>

      {/* System Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.totalPatients || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                  <ScreeningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.totalScreenings || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Screenings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                  <PerformanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.activeUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Health and Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip
                  label={stats?.systemHealth || 'unknown'}
                  color={getSystemHealthColor(stats?.systemHealth || 'unknown')}
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {stats?.systemHealth === 'healthy' ? 'All systems operational' : 'System issues detected'}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Storage Usage
                </Typography>
                <Typography variant="h6">
                  {stats?.storageUsage || 0}% used
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Backup
                </Typography>
                <Typography variant="body2">
                  {stats?.lastBackup || 'Never'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={12} sm={6} key={action.title}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        p: 2,
                        borderColor: action.color,
                        color: action.color,
                        '&:hover': {
                          borderColor: action.color,
                          backgroundColor: `${action.color}10`,
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ textTransform: 'none' }}>
                          {action.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'none' }}>
                          {action.description}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          <List>
            {recentActivities.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.grey[300] }}>
                      <NotificationIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.action}
                    secondary={`${activity.user} • ${activity.time}`}
                  />
                  <Chip
                    label={activity.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
                {index < recentActivities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
