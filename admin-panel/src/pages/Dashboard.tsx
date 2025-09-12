import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Monitor as MonitorIcon,
  Storage as DatabaseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAdminAuth } from '../contexts/AdminAuthContext.tsx';
import axios from 'axios';

interface SystemStats {
  totalUsers: number;
  adminUsers: number;
  medicalUsers: number;
  activeSessions: number;
  systemHealth: string;
  lastBackup: string;
  pendingUpdates: number;
  databaseStatus: string;
  securityStatus: string;
  totalPatients?: number;
  totalScreenings?: number;
  recentSecurityEvents?: number;
  systemUptime?: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

interface SystemHealth {
  status: string;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  databaseConnections: number;
  activeConnections: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        adminUsersResponse,
        medicalUsersResponse,
        systemStatsResponse,
        securityEventsResponse,
        systemHealthResponse
      ] = await Promise.all([
        axios.get('/api/v1/auth/admin-users'),
        axios.get('/api/v1/auth/medical-staff-users'),
        axios.get('/api/v1/admin/system-stats'),
        axios.get('/api/v1/admin/security/events?limit=10'),
        axios.get('/api/v1/admin/system/health')
      ]);

      // Calculate stats
      const adminUsers = adminUsersResponse.data || [];
      const medicalUsers = medicalUsersResponse.data || [];
      const systemStats = systemStatsResponse.data || {};
      const securityEvents = securityEventsResponse.data?.events || [];
      const health = systemHealthResponse.data || {};

      // Format recent activities from security events (limit to 10)
      const activities: RecentActivity[] = securityEvents
        .slice(0, 10) // Ensure only 10 records
        .map((event: any, index: number) => ({
          id: event.id || `event-${index}`,
          action: event.action || event.event_type || 'System Event',
          user: event.user_email || event.user_id || 'System',
          time: new Date(event.timestamp).toLocaleString(),
          type: event.status === 'success' ? 'success' : 
                event.status === 'failed' ? 'error' : 
                event.severity === 'high' ? 'warning' : 'info',
          details: event.details
        }));

      // Create comprehensive stats
      const dashboardStats: SystemStats = {
        totalUsers: adminUsers.length + medicalUsers.length,
        adminUsers: adminUsers.length,
        medicalUsers: medicalUsers.length,
        activeSessions: health.activeConnections || 0,
        systemHealth: health.status || 'Healthy',
        lastBackup: systemStats.lastBackup || 'Unknown',
        pendingUpdates: systemStats.pendingUpdates || 0,
        databaseStatus: health.databaseStatus || 'Online',
        securityStatus: 'Secure',
        totalPatients: systemStats.totalPatients || 0,
        totalScreenings: systemStats.totalScreenings || 0,
        recentSecurityEvents: securityEvents.length,
        systemUptime: health.uptime || 'Unknown'
      };

      setStats(dashboardStats);
      setRecentActivities(activities);
      setSystemHealth(health);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      
      // Set fallback data
      setStats({
        totalUsers: 0,
        adminUsers: 0,
        medicalUsers: 0,
        activeSessions: 0,
        systemHealth: 'Unknown',
        lastBackup: 'Unknown',
        pendingUpdates: 0,
        databaseStatus: 'Unknown',
        securityStatus: 'Unknown'
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'secure':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'offline':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Welcome back, {user?.name || user?.email}!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={user?.role?.toUpperCase()} 
                color="primary" 
                size="small"
                icon={<AdminIcon />}
              />
              <Typography variant="body1" color="text.secondary">
                EVEP Platform - System Administration
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="secondary">
                    {stats?.adminUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Admin Users
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <AdminIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats?.activeSessions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Sessions
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {stats?.pendingUpdates || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Updates
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <SettingsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats Cards */}
      {stats?.totalPatients !== undefined && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {stats.totalPatients}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Patients
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {stats.totalScreenings || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Screenings
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <MonitorIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {stats.recentSecurityEvents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Security Events
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                    <SecurityIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      {stats.systemUptime || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Uptime
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.grey[500] }}>
                    <DatabaseIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* System Status and Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                System Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">System Health</Typography>
                  <Chip 
                    label={stats?.systemHealth || 'Unknown'} 
                    color={getHealthColor(stats?.systemHealth || '') as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Database Status</Typography>
                  <Chip 
                    label={stats?.databaseStatus || 'Unknown'} 
                    color={getHealthColor(stats?.databaseStatus || '') as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Security Status</Typography>
                  <Chip 
                    label={stats?.securityStatus || 'Unknown'} 
                    color={getHealthColor(stats?.securityStatus || '') as any}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Last Backup</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.lastBackup || 'Unknown'}
                  </Typography>
                </Box>
                {systemHealth && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Memory Usage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {systemHealth.memoryUsage?.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {systemHealth.cpuUsage?.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Disk Usage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {systemHealth.diskUsage?.toFixed(1)}%
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity (Last 10)
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={fetchDashboardData}
                >
                  Refresh
                </Button>
              </Box>
              {recentActivities.length > 0 ? (
                <List sx={{ mt: 1 }}>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.action}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {activity.user} • {activity.time}
                              </Typography>
                              {activity.details && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {activity.details}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
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



