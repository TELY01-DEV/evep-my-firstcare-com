import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Download,
  ExpandMore,
  Info,
  Person,
  Computer,
  AccessTime
} from '@mui/icons-material';
import axios from 'axios';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  action: string;
  patient_id?: string;
  screening_id?: string;
  status: string;
  details: string;
  severity: string;
}

interface SecurityStats {
  total_events: number;
  patient_access_events: number;
  screening_events: number;
  record_updates: number;
  failed_access: number;
  last_24h_events: number;
  last_7d_events: number;
  last_30d_events: number;
  current_client_ip?: string;
  current_user_agent?: string;
  last_activity?: string;
}

const SecurityAudit: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch security events and stats
      const [eventsResponse, statsResponse] = await Promise.all([
        axios.get('/api/v1/medical/security/events'),
        axios.get('/api/v1/medical/security/stats')
      ]);

      setEvents(eventsResponse.data.events || []);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'patient_access': return <Person />;
      case 'screening_access': return <Visibility />;
      case 'record_update': return <Computer />;
      case 'access': return <Security />;
      default: return <Info />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportToCSV = () => {
    if (events.length === 0) return;

    const headers = ['Timestamp', 'Event Type', 'User', 'IP Address', 'Action', 'Status', 'Details'];
    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        formatTimestamp(event.timestamp),
        event.event_type,
        event.user_email,
        event.ip_address,
        event.action,
        event.status,
        event.details
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-security-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Security color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Medical Portal Security Audit
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and track all medical portal activities and security events
          </Typography>
        </Box>
      </Box>

      {/* Security Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security color="primary" />
                  <Typography variant="h6">Total Events</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {stats.total_events}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All security events
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  <Typography variant="h6">Patient Access</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {stats.patient_access_events}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Patient data access events
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility color="primary" />
                  <Typography variant="h6">Screening Events</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {stats.screening_events}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vision screening activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="error" />
                  <Typography variant="h6">Failed Access</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {stats.failed_access}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Failed access attempts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Current Session Information */}
      {stats && (stats.current_client_ip || stats.current_user_agent) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="info" />
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

      {/* Security Events Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Security Events</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchData}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToCSV}
                size="small"
                disabled={events.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </Box>

          {events.length === 0 ? (
            <Alert severity="info">
              No security events found. Events will appear here as you use the medical portal.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime fontSize="small" color="action" />
                          {formatTimestamp(event.timestamp)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getEventTypeIcon(event.event_type)}
                          <Chip
                            label={event.event_type}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{event.user_email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.user_role}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {event.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.action}</Typography>
                        {event.details && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {event.details}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.patient_id ? (
                          <Chip label={event.patient_id} size="small" color="primary" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={event.status === 'success' ? <CheckCircle /> : <Error />}
                          label={event.status}
                          color={event.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.severity}
                          color={getSeverityColor(event.severity) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecurityAudit;
