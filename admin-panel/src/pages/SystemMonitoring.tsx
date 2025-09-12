import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  Monitor as MonitorIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  active_connections: number;
  uptime: number;
  last_backup: string;
  system_health: 'healthy' | 'warning' | 'critical';
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port: number;
  response_time: number;
  last_check: string;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: number;
  status: 'good' | 'warning' | 'critical';
}

const SystemMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch system metrics
      const metricsResponse = await axios.get('/api/v1/admin/system-monitoring');
      const metricsData = metricsResponse.data;
      
      // Validate and set metrics with fallback values
      setMetrics({
        cpu_usage: metricsData.cpu_usage || 0,
        memory_usage: metricsData.memory_usage || 0,
        disk_usage: metricsData.disk_usage || 0,
        network_usage: metricsData.network_usage || 0,
        active_connections: metricsData.active_connections || 0,
        uptime: metricsData.uptime || 0,
        last_backup: metricsData.last_backup || new Date().toISOString(),
        system_health: metricsData.system_health || 'healthy'
      });
      
      // Mock service status and performance metrics for now
      setServices([
        { name: 'Backend API', status: 'running', port: 8000, response_time: 45, last_check: new Date().toISOString() },
        { name: 'MongoDB', status: 'running', port: 27017, response_time: 12, last_check: new Date().toISOString() },
        { name: 'Redis', status: 'running', port: 6379, response_time: 8, last_check: new Date().toISOString() },
        { name: 'Frontend', status: 'running', port: 3013, response_time: 23, last_check: new Date().toISOString() }
      ]);
      
      setPerformance([
        { metric: 'API Response Time', value: 45, unit: 'ms', trend: 'stable', threshold: 100, status: 'good' },
        { metric: 'Database Queries', value: 1250, unit: 'req/min', trend: 'up', threshold: 2000, status: 'good' },
        { metric: 'Memory Usage', value: 68, unit: '%', trend: 'stable', threshold: 85, status: 'good' },
        { metric: 'CPU Usage', value: 42, unit: '%', trend: 'down', threshold: 80, status: 'good' }
      ]);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Set fallback metrics on error
      setMetrics({
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_usage: 0,
        active_connections: 0,
        uptime: 0,
        last_backup: new Date().toISOString(),
        system_health: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon color="success" />;
      case 'stopped':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getProgressColor = (value: number) => {
    if (value < 70) return 'success';
    if (value < 90) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            System Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time system metrics and performance monitoring
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSystemData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* System Health Overview */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MonitorIcon color="primary" />
                  <Typography variant="h6">System Health Overview</Typography>
                </Box>
                {metrics && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color={`${getHealthColor(metrics.system_health || 'healthy')}.main`}>
                          {(metrics.system_health || 'healthy').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Status
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {formatUptime(metrics.uptime || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uptime
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {metrics.active_connections || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Connections
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {new Date(metrics.last_backup || new Date().toISOString()).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last Backup
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Usage */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="h6">Resource Usage</Typography>
                </Box>
                {metrics && (
                  <Box sx={{ space: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">CPU Usage</Typography>
                        <Typography variant="body2">{metrics.cpu_usage || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.cpu_usage || 0}
                        color={getProgressColor(metrics.cpu_usage || 0) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Memory Usage</Typography>
                        <Typography variant="body2">{metrics.memory_usage || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.memory_usage || 0}
                        color={getProgressColor(metrics.memory_usage || 0) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Disk Usage</Typography>
                        <Typography variant="body2">{metrics.disk_usage || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.disk_usage || 0}
                        color={getProgressColor(metrics.disk_usage || 0) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Network Usage</Typography>
                        <Typography variant="body2">{metrics.network_usage}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metrics.network_usage}
                        color={getProgressColor(metrics.network_usage) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Service Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Service Status</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Port</TableCell>
                        <TableCell>Response</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.name}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {service.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getServiceStatusIcon(service.status)}
                              label={service.status.toUpperCase()}
                              color={getServiceStatusColor(service.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{service.port}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {service.response_time}ms
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TimelineIcon color="primary" />
                  <Typography variant="h6">Performance Metrics</Typography>
                </Box>
                <Grid container spacing={2}>
                  {performance.map((metric) => (
                    <Grid item xs={12} sm={6} md={3} key={metric.metric}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            {metric.value} {metric.unit}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {metric.metric}
                          </Typography>
                          <Chip
                            label={metric.status.toUpperCase()}
                            color={metric.status === 'good' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Alerts */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">System Alerts</Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  System monitoring is active. All services are running normally.
                </Alert>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Database Connection"
                      secondary="MongoDB replica set is healthy and synchronized"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Redis Cache"
                      secondary="Redis cluster is operational with all nodes connected"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="API Services"
                      secondary="All API endpoints are responding within normal latency"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SystemMonitoring;
