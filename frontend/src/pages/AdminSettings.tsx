import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';

interface SystemSettings {
  platformName: string;
  maxFileSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
  enableAuditLogs: boolean;
  enableBlockchain: boolean;
  maintenanceMode: boolean;
  apiRateLimit: number;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    platformName: 'EVEP Platform',
    maxFileSize: 10,
    sessionTimeout: 30,
    enableNotifications: true,
    enableAuditLogs: true,
    enableBlockchain: true,
    maintenanceMode: false,
    apiRateLimit: 100,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        // Use default settings if API is not available
        console.log('Using default settings');
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
      // Continue with default settings
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
      
      const response = await fetch('http://localhost:8013/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully!');
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings) => (
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
        System Settings
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
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Platform Name"
                value={settings.platformName}
                onChange={handleInputChange('platformName')}
                margin="normal"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max File Size (MB)"
                type="number"
                value={settings.maxFileSize}
                onChange={handleInputChange('maxFileSize')}
                margin="normal"
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
                label="API Rate Limit (requests/min)"
                type="number"
                value={settings.apiRateLimit}
                onChange={handleInputChange('apiRateLimit')}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Toggles */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature Toggles
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={handleInputChange('enableNotifications')}
                  />
                }
                label="Enable Notifications"
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
                    checked={settings.enableBlockchain}
                    onChange={handleInputChange('enableBlockchain')}
                  />
                }
                label="Enable Blockchain Audit"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange('maintenanceMode')}
                  />
                }
                label="Maintenance Mode"
                sx={{ mb: 2 }}
              />
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
                onClick={fetchSettings}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: 2 }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSettings;
