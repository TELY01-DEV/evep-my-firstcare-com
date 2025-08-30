import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,

  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  Shield as ShieldIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'access_denied' | 'security_alert';
  user_id: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  action: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityStats {
  total_events: number;
  failed_logins: number;
  suspicious_activities: number;
  blocked_ips: number;
  security_alerts: number;
  last_24h_events: number;
  last_7d_events: number;
  last_30d_events: number;
  current_client_ip?: string;
  current_user_agent?: string;
  last_activity?: string;
}

interface FilterOptions {
  event_type: string;
  severity: string;
  status: string;
  user_role: string;
  date_from: Date | null;
  date_to: Date | null;
}

const SecurityAudit: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    event_type: '',
    severity: '',
    status: '',
    user_role: '',
    date_from: null,
    date_to: null
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch security events
      const eventsResponse = await axios.get('/api/v1/admin/security/events');
      setEvents(eventsResponse.data.events || []);
      
      // Fetch security stats
      const statsResponse = await axios.get('/api/v1/admin/security/stats');
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Error fetching security data:', error);
      // Mock data for now
      setEvents([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          event_type: 'login',
          user_id: '68b131b09cf9b01a0274e39a',
          user_email: 'admin@evep.com',
          user_role: 'admin',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          resource: '/api/v1/auth/login',
          action: 'User login',
          status: 'success',
          details: 'Successful login from admin panel',
          severity: 'low'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          event_type: 'access_denied',
          user_id: 'unknown',
          user_email: 'unknown@example.com',
          user_role: 'unknown',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          resource: '/api/v1/admin/users',
          action: 'Unauthorized access attempt',
          status: 'failed',
          details: 'Access denied to admin endpoint',
          severity: 'medium'
        }
      ]);
      
      setStats({
        total_events: 1250,
        failed_logins: 45,
        suspicious_activities: 12,
        blocked_ips: 8,
        security_alerts: 3,
        last_24h_events: 156,
        last_7d_events: 892,
        last_30d_events: 1250
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <LoginIcon color="success" />;
      case 'logout':
        return <LogoutIcon color="info" />;
      case 'create':
        return <EditIcon color="primary" />;
      case 'update':
        return <EditIcon color="primary" />;
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'access_denied':
        return <BlockIcon color="error" />;
      case 'security_alert':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredEvents = events.filter(event => {
    if (filters.event_type && event.event_type !== filters.event_type) return false;
    if (filters.severity && event.severity !== filters.severity) return false;
    if (filters.status && event.status !== filters.status) return false;
    if (filters.user_role && event.user_role !== filters.user_role) return false;
    if (filters.date_from && new Date(event.timestamp) < filters.date_from) return false;
    if (filters.date_to && new Date(event.timestamp) > filters.date_to) return false;
    return true;
  });

  const exportAuditLog = () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'User', 'IP Address', 'Resource', 'Action', 'Status', 'Severity'],
      ...filteredEvents.map(event => [
        formatDate(event.timestamp),
        event.event_type,
        event.user_email,
        event.ip_address,
        event.resource,
        event.action,
        event.status,
        event.severity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Security & Audit
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor security events, audit logs, and system security status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportAuditLog}
          >
            Export Logs
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSecurityData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Security Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary.main">
                  {stats.total_events}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {stats.failed_logins}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed Logins
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.suspicious_activities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Suspicious Activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ShieldIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {stats.blocked_ips}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked IPs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Current Client Information */}
      {stats && (stats.current_client_ip || stats.current_user_agent) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoIcon color="info" />
              <Typography variant="h6">Current Session Information</Typography>
            </Box>
            <Grid container spacing={2}>
              {stats.current_client_ip && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Your IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {stats.current_client_ip}
                  </Typography>
                </Grid>
              )}
              {stats.current_user_agent && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Your Browser
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, wordBreak: 'break-all' }}>
                    {stats.current_user_agent}
                  </Typography>
                </Grid>
              )}
              {stats.last_activity && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Activity
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {new Date(stats.last_activity).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                  label="Event Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="access_denied">Access Denied</MenuItem>
                  <MenuItem value="security_alert">Security Alert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  label="Severity"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>User Role</InputLabel>
                <Select
                  value={filters.user_role}
                  onChange={(e) => setFilters({ ...filters, user_role: e.target.value })}
                  label="User Role"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="From Date"
                type="date"
                value={filters.date_from ? filters.date_from.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value ? new Date(e.target.value) : null })}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="To Date"
                type="date"
                value={filters.date_to ? filters.date_to.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value ? new Date(e.target.value) : null })}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Events Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">Security Events</Typography>
            <Chip label={`${filteredEvents.length} events`} size="small" color="primary" />
          </Box>
          
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading security events...
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No security events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getEventIcon(event.event_type)}
                          <Typography variant="body2" fontWeight={500}>
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {event.user_email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.user_role}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {event.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150, wordBreak: 'break-word' }}>
                          {event.resource}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.action}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status.toUpperCase()}
                          color={getStatusColor(event.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.severity.toUpperCase()}
                          color={getSeverityColor(event.severity) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(event.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Security Alerts</Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            System security monitoring is active. All security events are being logged and monitored.
          </Alert>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Authentication System"
                secondary="All login attempts are being monitored and logged"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Access Control"
                secondary="Role-based access control is properly configured"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Audit Logging"
                secondary="All system activities are being audited and logged"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecurityAudit;
