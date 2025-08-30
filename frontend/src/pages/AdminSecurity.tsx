import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security,
  Refresh,
  Lock,
  Visibility,
  Block,
  CheckCircle,
  Warning,
  Info,
  History,
  Settings,
} from '@mui/icons-material';

interface SecuritySettings {
  enableTwoFactor: boolean;
  requireStrongPasswords: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableIpWhitelist: boolean;
  ipWhitelist: string[];
  enableAuditLogs: boolean;
  enableBlockchainAudit: boolean;
}

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  ipAddress: string;
}

const AdminSecurity: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    enableTwoFactor: false,
    requireStrongPasswords: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableIpWhitelist: false,
    ipWhitelist: [],
    enableAuditLogs: true,
    enableBlockchainAudit: true,
  });
  
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Fetch security settings
      const settingsResponse = await fetch('http://localhost:8013/api/v1/admin/security/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }

      // Fetch security events
      const eventsResponse = await fetch('http://localhost:8013/api/v1/admin/security/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setSecurityEvents(eventsData);
      } else {
        console.error('Failed to fetch security events from API');
        setSecurityEvents([]);
      }
    } catch (err) {
      console.error('Security data fetch error:', err);
      // Continue with default data
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/admin/security/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Security settings saved successfully!');
      } else {
        setError('Failed to save security settings');
      }
    } catch (err) {
      console.error('Security settings save error:', err);
      setError('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SecuritySettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.type === 'number' 
        ? Number(event.target.value) 
        : event.target.value;
    
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Block color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      case 'low':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
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
      <Typography variant="h4" component="h1" gutterBottom>
        Security Management
      </Typography>
      
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

      <Grid container spacing={3}>
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableTwoFactor}
                    onChange={handleInputChange('enableTwoFactor')}
                  />
                }
                label="Enable Two-Factor Authentication"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireStrongPasswords}
                    onChange={handleInputChange('requireStrongPasswords')}
                  />
                }
                label="Require Strong Passwords"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={handleInputChange('sessionTimeout')}
                margin="normal"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={handleInputChange('maxLoginAttempts')}
                margin="normal"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableIpWhitelist}
                    onChange={handleInputChange('enableIpWhitelist')}
                  />
                }
                label="Enable IP Whitelist"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableAuditLogs}
                    onChange={handleInputChange('enableAuditLogs')}
                  />
                }
                label="Enable Audit Logs"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableBlockchainAudit}
                    onChange={handleInputChange('enableBlockchainAudit')}
                  />
                }
                label="Enable Blockchain Audit"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Events */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Security Events
                </Typography>
                <Tooltip title="Refresh Events">
                  <IconButton onClick={fetchSecurityData} size="small">
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {securityEvents.length > 0 ? (
                <List>
                  {securityEvents.map((event, index) => (
                    <React.Fragment key={event.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.100' }}>
                            {getSeverityIcon(event.severity)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {event.description}
                              <Chip
                                label={event.severity}
                                color={getSeverityColor(event.severity) as any}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(event.timestamp).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                User: {event.user} | IP: {event.ipAddress}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < securityEvents.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">
                    No security events found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Overview */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Overview
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="h6" color="success.main">
                      Secure
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Status
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                      <History />
                    </Avatar>
                    <Typography variant="h6" color="info.main">
                      {securityEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recent Events
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                      <Lock />
                    </Avatar>
                    <Typography variant="h6" color="warning.main">
                      {settings.enableTwoFactor ? 'Enabled' : 'Disabled'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      2FA Status
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                      <Security />
                    </Avatar>
                    <Typography variant="h6" color="primary.main">
                      Active
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Audit Logging
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchSecurityData}
                disabled={saving}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <Settings />}
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: 2 }}
              >
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSecurity;
