import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Breadcrumbs,
  Link,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  DisplaySettings as DisplayIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Home,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface PanelSettings {
  // General Settings
  panelName: string;
  panelDescription: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  showLiveClock: boolean;
  clockFormat: '12h' | '24h';
  
  // Display Settings
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAnimations: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  screeningAlerts: boolean;
  appointmentReminders: boolean;
  systemUpdates: boolean;
  
  // Security Settings
  sessionTimeout: number;
  requirePasswordChange: boolean;
  twoFactorAuth: boolean;
  auditLogging: boolean;
  
  // Medical Settings
  defaultScreeningType: string;
  autoSaveScreeningData: boolean;
  patientDataRetention: number;
  medicalAlerts: boolean;
}

const GeneralPanelSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PanelSettings>({
    // General Settings
    panelName: 'EVEP Medical Professional Panel',
    panelDescription: 'Comprehensive vision screening and patient management system',
    timezone: 'Asia/Bangkok',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm:ss',
    language: 'th',
    showLiveClock: true,
    clockFormat: '24h',
    
    // Display Settings
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 30,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    screeningAlerts: true,
    appointmentReminders: true,
    systemUpdates: false,
    
    // Security Settings
    sessionTimeout: 30,
    requirePasswordChange: false,
    twoFactorAuth: false,
    auditLogging: true,
    
    // Medical Settings
    defaultScreeningType: 'standard',
    autoSaveScreeningData: true,
    patientDataRetention: 7,
    medicalAlerts: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadSettings();
  }, []);

  // Live clock update
  useEffect(() => {
    if (settings.showLiveClock) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [settings.showLiveClock]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/panel-settings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      } else {
        console.log('Using default settings');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load panel settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('evep_token');
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/panel-settings/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSuccess('Panel settings saved successfully!');
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save panel settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PanelSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      panelName: 'EVEP Medical Professional Panel',
      panelDescription: 'Comprehensive vision screening and patient management system',
      timezone: 'Asia/Bangkok',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm:ss',
      language: 'th',
      showLiveClock: true,
      clockFormat: '24h',
      theme: 'light',
      compactMode: false,
      showAnimations: true,
      autoRefresh: true,
      refreshInterval: 30,
      emailNotifications: true,
      pushNotifications: true,
      screeningAlerts: true,
      appointmentReminders: true,
      systemUpdates: false,
      sessionTimeout: 30,
      requirePasswordChange: false,
      twoFactorAuth: false,
      auditLogging: true,
      defaultScreeningType: 'standard',
      autoSaveScreeningData: true,
      patientDataRetention: 7,
      medicalAlerts: true,
    });
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
            <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            General Panel Settings
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            General Panel Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure panel preferences, notifications, and system behavior
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
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
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<SettingsIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                General Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Panel Name"
                    value={settings.panelName}
                    onChange={(e) => handleSettingChange('panelName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Panel Description"
                    multiline
                    rows={2}
                    value={settings.panelDescription}
                    onChange={(e) => handleSettingChange('panelDescription', e.target.value)}
                  />
                </Grid>
                
                {/* Live Clock Display */}
                {settings.showLiveClock && (
                  <Grid item xs={12}>
                    <Card 
                      sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        color: '#ffffff',
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          borderRadius: 3,
                          pointerEvents: 'none',
                        },
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          position: 'relative',
                          zIndex: 1,
                          fontWeight: 600,
                        }}
                      >
                        Live Clock ({settings.timezone})
                      </Typography>
                      <Typography 
                        variant="h4" 
                        fontFamily="monospace"
                        sx={{
                          color: '#ffffff',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                          position: 'relative',
                          zIndex: 1,
                          fontWeight: 'bold',
                          mb: 1,
                        }}
                      >
                        {currentTime.toLocaleTimeString(settings.language === 'th' ? 'th-TH' : 'en-US', {
                          timeZone: settings.timezone,
                          hour12: settings.clockFormat === '12h',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          position: 'relative',
                          zIndex: 1,
                          opacity: 0.95,
                          fontWeight: 500,
                        }}
                      >
                        {currentTime.toLocaleDateString(settings.language === 'th' ? 'th-TH' : 'en-US', {
                          timeZone: settings.timezone,
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {/* Timezone Settings */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Timezone & Date/Time Settings
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.timezone}
                      label="Timezone"
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    >
                      <MenuItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</MenuItem>
                      <MenuItem value="Asia/Singapore">Asia/Singapore (GMT+8)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</MenuItem>
                      <MenuItem value="Asia/Seoul">Asia/Seoul (GMT+9)</MenuItem>
                      <MenuItem value="Asia/Shanghai">Asia/Shanghai (GMT+8)</MenuItem>
                      <MenuItem value="UTC">UTC (GMT+0)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (GMT-5)</MenuItem>
                      <MenuItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT+0)</MenuItem>
                      <MenuItem value="Europe/Paris">Europe/Paris (GMT+1)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.dateFormat}
                      label="Date Format"
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</MenuItem>
                      <MenuItem value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={settings.timeFormat}
                      label="Time Format"
                      onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                    >
                      <MenuItem value="HH:mm:ss">24-hour (14:30:25)</MenuItem>
                      <MenuItem value="hh:mm:ss A">12-hour (02:30:25 PM)</MenuItem>
                      <MenuItem value="HH:mm">24-hour short (14:30)</MenuItem>
                      <MenuItem value="hh:mm A">12-hour short (02:30 PM)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Clock Display</InputLabel>
                    <Select
                      value={settings.clockFormat}
                      label="Clock Display"
                      onChange={(e) => handleSettingChange('clockFormat', e.target.value)}
                    >
                      <MenuItem value="24h">24-hour format</MenuItem>
                      <MenuItem value="12h">12-hour format</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showLiveClock}
                        onChange={(e) => handleSettingChange('showLiveClock', e.target.checked)}
                      />
                    }
                    label="Show Live Clock"
                  />
                </Grid>

                {/* Language Settings */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Language & Localization
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.language}
                      label="Language"
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="th">ไทย (Thai)</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="zh">中文 (Chinese)</MenuItem>
                      <MenuItem value="ja">日本語 (Japanese)</MenuItem>
                      <MenuItem value="ko">한국어 (Korean)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Number Format</InputLabel>
                    <Select
                      value={settings.language}
                      label="Number Format"
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="th">Thai (1,234.56)</MenuItem>
                      <MenuItem value="en">English (1,234.56)</MenuItem>
                      <MenuItem value="de">German (1.234,56)</MenuItem>
                      <MenuItem value="fr">French (1 234,56)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<DisplayIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <DisplayIcon sx={{ mr: 1 }} />
                Display Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.compactMode}
                        onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                      />
                    }
                    label="Compact Mode"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showAnimations}
                        onChange={(e) => handleSettingChange('showAnimations', e.target.checked)}
                      />
                    }
                    label="Show Animations"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoRefresh}
                        onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                      />
                    }
                    label="Auto Refresh Data"
                  />
                </Grid>
                {settings.autoRefresh && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Refresh Interval (seconds)"
                      value={settings.refreshInterval}
                      onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                      inputProps={{ min: 10, max: 300 }}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<NotificationsIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Notification Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.screeningAlerts}
                        onChange={(e) => handleSettingChange('screeningAlerts', e.target.checked)}
                      />
                    }
                    label="Screening Alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appointmentReminders}
                        onChange={(e) => handleSettingChange('appointmentReminders', e.target.checked)}
                      />
                    }
                    label="Appointment Reminders"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.medicalAlerts}
                        onChange={(e) => handleSettingChange('medicalAlerts', e.target.checked)}
                      />
                    }
                    label="Medical Alerts"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<SecurityIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Security Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    inputProps={{ min: 5, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requirePasswordChange}
                        onChange={(e) => handleSettingChange('requirePasswordChange', e.target.checked)}
                      />
                    }
                    label="Require Password Change"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.auditLogging}
                        onChange={(e) => handleSettingChange('auditLogging', e.target.checked)}
                      />
                    }
                    label="Audit Logging"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Medical Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<SettingsIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Medical Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Screening Type</InputLabel>
                    <Select
                      value={settings.defaultScreeningType}
                      label="Default Screening Type"
                      onChange={(e) => handleSettingChange('defaultScreeningType', e.target.value)}
                    >
                      <MenuItem value="standard">Standard Vision Screening</MenuItem>
                      <MenuItem value="mobile">Mobile Unit Screening</MenuItem>
                      <MenuItem value="enhanced">Enhanced Screening</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Patient Data Retention (days)"
                    value={settings.patientDataRetention}
                    onChange={(e) => handleSettingChange('patientDataRetention', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoSaveScreeningData}
                        onChange={(e) => handleSettingChange('autoSaveScreeningData', e.target.checked)}
                      />
                    }
                    label="Auto-save Screening Data"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GeneralPanelSettings;
