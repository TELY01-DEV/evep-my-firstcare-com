import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    enableAuditLogging: boolean;
    ipWhitelist: string[];
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    enableCompression: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
  notifications: {
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
    enablePushNotifications: boolean;
    alertLevels: string[];
  };
}

const AdminSettings: React.FC = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings || getDefaultSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SystemSettings => ({
    general: {
      siteName: 'EVEP Platform',
      siteDescription: 'EYE Vision Evaluation Platform',
      timezone: 'Asia/Bangkok',
      language: 'en',
      maintenanceMode: false,
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: 'noreply@evep.com',
      fromName: 'EVEP System',
      enableEmailNotifications: true,
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      enableAuditLogging: true,
      ipWhitelist: [],
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      enableCompression: true,
      backupFrequency: 'daily',
      retentionDays: 30,
    },
    notifications: {
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      enablePushNotifications: true,
      alertLevels: ['critical', 'warning', 'info'],
    },
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const response = await fetch('http://localhost:8013/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load settings
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure system parameters and administrative settings
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Settings Accordion */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Accordion expanded={expanded === 'general'} onChange={handleAccordionChange('general')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h6">General Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Site Name"
                        value={settings.general.siteName}
                        onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Site Description"
                        value={settings.general.siteDescription}
                        onChange={(e) => handleChange('general', 'siteDescription', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Timezone</InputLabel>
                        <Select
                          value={settings.general.timezone}
                          label="Timezone"
                          onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                        >
                          <MenuItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</MenuItem>
                          <MenuItem value="UTC">UTC</MenuItem>
                          <MenuItem value="America/New_York">America/New_York</MenuItem>
                          <MenuItem value="Europe/London">Europe/London</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={settings.general.language}
                          label="Language"
                          onChange={(e) => handleChange('general', 'language', e.target.value)}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="th">Thai</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.general.maintenanceMode}
                            onChange={(e) => handleChange('general', 'maintenanceMode', e.target.checked)}
                          />
                        }
                        label="Maintenance Mode"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'email'} onChange={handleAccordionChange('email')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <EmailIcon color="primary" />
                    <Typography variant="h6">Email Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="SMTP Host"
                        value={settings.email.smtpHost}
                        onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="SMTP Port"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleChange('email', 'smtpPort', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="SMTP Username"
                        value={settings.email.smtpUsername}
                        onChange={(e) => handleChange('email', 'smtpUsername', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="SMTP Password"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="From Email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="From Name"
                        value={settings.email.fromName}
                        onChange={(e) => handleChange('email', 'fromName', e.target.value)}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.email.enableEmailNotifications}
                            onChange={(e) => handleChange('email', 'enableEmailNotifications', e.target.checked)}
                          />
                        }
                        label="Enable Email Notifications"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'security'} onChange={handleAccordionChange('security')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">Security Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Session Timeout (minutes)"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Max Login Attempts"
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Password Min Length"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleChange('security', 'passwordMinLength', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security.requireTwoFactor}
                            onChange={(e) => handleChange('security', 'requireTwoFactor', e.target.checked)}
                          />
                        }
                        label="Require Two-Factor Authentication"
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security.enableAuditLogging}
                            onChange={(e) => handleChange('security', 'enableAuditLogging', e.target.checked)}
                          />
                        }
                        label="Enable Audit Logging"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'storage'} onChange={handleAccordionChange('storage')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6">Storage Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Max File Size (MB)"
                        type="number"
                        value={settings.storage.maxFileSize}
                        onChange={(e) => handleChange('storage', 'maxFileSize', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Backup Frequency</InputLabel>
                        <Select
                          value={settings.storage.backupFrequency}
                          label="Backup Frequency"
                          onChange={(e) => handleChange('storage', 'backupFrequency', e.target.value)}
                        >
                          <MenuItem value="hourly">Hourly</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Retention Days"
                        type="number"
                        value={settings.storage.retentionDays}
                        onChange={(e) => handleChange('storage', 'retentionDays', parseInt(e.target.value))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.storage.enableCompression}
                            onChange={(e) => handleChange('storage', 'enableCompression', e.target.checked)}
                          />
                        }
                        label="Enable Compression"
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'notifications'} onChange={handleAccordionChange('notifications')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <NotificationsIcon color="primary" />
                    <Typography variant="h6">Notification Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.enableEmailAlerts}
                            onChange={(e) => handleChange('notifications', 'enableEmailAlerts', e.target.checked)}
                          />
                        }
                        label="Enable Email Alerts"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.enableSMSAlerts}
                            onChange={(e) => handleChange('notifications', 'enableSMSAlerts', e.target.checked)}
                          />
                        }
                        label="Enable SMS Alerts"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.enablePushNotifications}
                            onChange={(e) => handleChange('notifications', 'enablePushNotifications', e.target.checked)}
                          />
                        }
                        label="Enable Push Notifications"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Info Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Settings Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Configure system parameters to customize the EVEP platform behavior.
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Status
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Chip
                    label={settings.general.maintenanceMode ? 'Maintenance Mode' : 'Active'}
                    color={settings.general.maintenanceMode ? 'warning' : 'success'}
                    size="small"
                  />
                  <Chip
                    label={`Timezone: ${settings.general.timezone}`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Language: ${settings.general.language.toUpperCase()}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => setExpanded('general')}
                  >
                    General Settings
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EmailIcon />}
                    onClick={() => setExpanded('email')}
                  >
                    Email Configuration
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SecurityIcon />}
                    onClick={() => setExpanded('security')}
                  >
                    Security Settings
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSettings;
