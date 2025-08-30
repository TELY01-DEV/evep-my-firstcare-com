import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Save, Refresh, Settings, Webhook, Login, Person, CheckCircle, Error as ErrorIcon, Visibility, VisibilityOff, GetApp } from '@mui/icons-material';
import { api, getMessageQuota } from '../../api';
import { useDateFormat } from '../hooks/useDateFormat';

interface BotSettings {
  // LINE Bot Channel Settings
  channel_id: string;
  channel_access_token: string;
  channel_secret: string;
  webhook_url: string;
  display_name: string;
  profile_picture?: string;
  status_message?: string;
  
  // LINE Login Channel Settings
  line_login_channel_id: string;
  line_login_channel_secret: string;
  line_login_callback_url: string;
  
  // LIFF Settings
  liff_endpoint_url: string;
  liff_input_id?: string;
  liff_dashboard_id?: string;
  liff_qr_generator_id?: string;
  liff_caregiver_id?: string;
  liff_qr_scanner_id?: string;
  liff_qr_generator_enabled?: boolean;
  
  // Bot Configuration
  is_production: boolean;
  rate_limit_per_second: number;
  monthly_message_limit: number;
  
  // Telegram Settings
  telegram_bot_token: string;
  telegram_admin_chat_id: string;
}

const BotSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<BotSettings>({
    channel_id: '',
    channel_access_token: '',
    channel_secret: '',
    webhook_url: '',
    display_name: '',
    profile_picture: '',
    status_message: '',
    line_login_channel_id: '',
    line_login_channel_secret: '',
    line_login_callback_url: '',
    liff_endpoint_url: '',
    is_production: false,
    rate_limit_per_second: 20,
    monthly_message_limit: 5000,
    telegram_bot_token: '',
    telegram_admin_chat_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [expectedLiffApps, setExpectedLiffApps] = useState<any[]>([]);
  const [loadingLiffApps, setLoadingLiffApps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showChannelToken, setShowChannelToken] = useState(false);
  const [showChannelSecret, setShowChannelSecret] = useState(false);
  const [showLoginChannelSecret, setShowLoginChannelSecret] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [fetchingQuota, setFetchingQuota] = useState(false);
  const { formatDate } = useDateFormat();

  useEffect(() => {
    loadBotSettings();
    loadLiffApps();
  }, []);

  // Separate useEffect for fetching bot profile to avoid dependency issues
  useEffect(() => {
    if (settings.channel_access_token) {
      fetchBotProfile();
    }
  }, [settings.channel_access_token]);

  const loadLiffApps = async () => {
    try {
      setLoadingLiffApps(true);
      const response = await api.get('/bot/liff-apps');
      setExpectedLiffApps(response.data.expected_apps || []);
    } catch (err: any) {
      console.log('Failed to load LIFF apps:', err.response?.data?.detail || err.message);
      setExpectedLiffApps([]);
    } finally {
      setLoadingLiffApps(false);
    }
  };



  const loadBotSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/bot/settings');
      setSettings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load bot settings');
    } finally {
      setLoading(false);
    }
  };

  const saveBotSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await api.post('/bot/settings', settings);
      setSuccess('Bot settings saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save bot settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BotSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const configureWebhook = async () => {
    try {
      setConfiguring('webhook');
      setError(null);
      setSuccess(null);
      
      await api.post('/bot/configure-webhook');
      setSuccess('Webhook URL configured successfully with LINE!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to configure webhook');
    } finally {
      setConfiguring(null);
    }
  };

  const configureLoginCallback = async () => {
    try {
      setConfiguring('login');
      setError(null);
      setSuccess(null);
      
      await api.post('/bot/configure-login-callback');
      setSuccess('LINE Login callback URL configured successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to configure login callback');
    } finally {
      setConfiguring(null);
    }
  };



  const [profileData, setProfileData] = useState<any>(null);

  const fetchBotProfile = async () => {
    try {
      setFetchingProfile(true);
      setError(null);
      setSuccess(null);
      
      const response = await api.get('/bot/bot-profile');
      
      if (response.data.success) {
        setProfileData(response.data);
        setSuccess('Bot profile and API status retrieved successfully!');
        await loadBotSettings(); // Reload settings to get updated profile data
      } else {
        setError(response.data.error || 'Failed to fetch bot profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch bot profile');
    } finally {
      setFetchingProfile(false);
    }
  };

  const fetchMessageQuota = async () => {
    try {
      setFetchingQuota(true);
      setError(null);
      setSuccess(null);
      
      const response = await getMessageQuota();
      
      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          monthly_message_limit: response.data.monthly_message_limit
        }));
        setSuccess(`Monthly message limit updated to ${response.data.monthly_message_limit} from LINE API`);
      } else {
        setError(response.data.error || 'Failed to fetch message quota');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch message quota');
    } finally {
      setFetchingQuota(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3,
        background: 'white',
        p: 3,
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flex: 1
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            width: 56, 
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
          }}>
            <Settings sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Bot Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Configure LINE Bot and LIFF application settings
            </Typography>
          </Box>
        </Box>
      </Box>

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
        {/* Bot Profile & API Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bot Profile & API Status
              </Typography>
              
              {/* Real LINE API Status Display */}
              {loading ? (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="subtitle2">Loading settings...</Typography>
                  </Box>
                </Box>
              ) : fetchingProfile ? (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="subtitle2">Testing LINE API Connection...</Typography>
                  </Box>
                </Box>
              ) : profileData ? (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'success.dark' }}>
                    ✅ Real LINE API Status
                  </Typography>
                  <Chip 
                    label={profileData.apiStatus === 'connected' ? 'Connected' : 'Error'} 
                    color={profileData.apiStatus === 'connected' ? 'success' : 'error'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {profileData.channelInfo && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        Channel ID: {profileData.channelInfo.channelId}
                      </Typography>
                      <br />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        Environment: {profileData.channelInfo.isProduction ? 'Production' : 'Development'}
                      </Typography>
                      {profileData.channelInfo.webhookUrl && (
                        <>
                          <br />
                          <Typography variant="caption" sx={{ color: 'white' }}>
                            Webhook: {profileData.channelInfo.active ? 'Active' : 'Inactive'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      <strong>Real Data:</strong> This information comes directly from LINE API and shows your actual bot configuration.
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {settings.channel_access_token ? 
                      'Click "Get Bot Profile & API Status" to test LINE API connection' : 
                      'Configure Channel Access Token first to test API connection'
                    }
                  </Typography>
                </Box>
              )}
              
              {/* Real Bot Info from LINE API */}
              {profileData && profileData.botInfo && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'info.dark' }}>
                    🤖 Bot Profile (LINE API)
                  </Typography>
                  <Box>
                    {profileData.botInfo.displayName && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Display Name:</strong> {profileData.botInfo.displayName}
                      </Typography>
                    )}
                    {profileData.botInfo.pictureUrl && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Profile Picture:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <img 
                            src={profileData.botInfo.pictureUrl} 
                            alt="Bot Profile" 
                            style={{ 
                              width: 80, 
                              height: 80, 
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '3px solid #1976d2',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="error" 
                            className="hidden"
                            sx={{ display: 'none' }}
                          >
                            Failed to load image
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {profileData.botInfo.statusMessage && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Status Message:</strong> {profileData.botInfo.statusMessage}
                      </Typography>
                    )}
                    {profileData.botInfo.userId && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Bot User ID:</strong> {profileData.botInfo.userId}
                      </Typography>
                    )}
                    {profileData.botInfo.lastUpdated && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Last Updated:</strong> {formatDate(profileData.botInfo.lastUpdated, { includeTime: true })}
                      </Typography>
                    )}
                  </Box>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      <strong>Live Data:</strong> This is the actual bot profile from LINE API. 
                      Changes to bot profile must be made in LINE Developers Console.
                    </Typography>
                  </Alert>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={fetchBotProfile}
                  disabled={fetchingProfile}
                  fullWidth
                >
                  {fetchingProfile ? 'Fetching...' : 'Fetch Bot Profile from LINE'}
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Bot Profile:</strong> This button fetches the current bot profile from LINE API and stores it in the database. 
                For actual bot profile changes (display name, picture, status), please use the LINE Developers Console.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Channel Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Channel Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Channel ID"
                value={settings.channel_id}
                onChange={(e) => handleInputChange('channel_id', e.target.value)}
                margin="normal"
                helperText="Your LINE Channel ID"
              />
              
              <TextField
                fullWidth
                label="Channel Access Token"
                value={settings.channel_access_token}
                onChange={(e) => handleInputChange('channel_access_token', e.target.value)}
                margin="normal"
                type={showChannelToken ? 'text' : 'password'}
                helperText="Your LINE Channel access token"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        onClick={() => setShowChannelToken(!showChannelToken)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showChannelToken ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </Box>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Channel Secret"
                value={settings.channel_secret}
                onChange={(e) => handleInputChange('channel_secret', e.target.value)}
                margin="normal"
                type={showChannelSecret ? 'text' : 'password'}
                helperText="Your LINE Channel secret"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        onClick={() => setShowChannelSecret(!showChannelSecret)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showChannelSecret ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </Box>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Webhook URL"
                value={settings.webhook_url}
                onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                margin="normal"
                helperText="Your webhook endpoint URL"
              />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Webhook />}
                  onClick={configureWebhook}
                  disabled={configuring === 'webhook' || !settings.webhook_url}
                  fullWidth
                >
                  {configuring === 'webhook' ? 'Configuring...' : 'Configure with LINE'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* LINE Login Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                LINE Login Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="LINE Login Channel ID"
                value={settings.line_login_channel_id}
                onChange={(e) => handleInputChange('line_login_channel_id', e.target.value)}
                margin="normal"
                helperText="Your LINE Login Channel ID"
              />
              
              <TextField
                fullWidth
                label="LINE Login Channel Secret"
                value={settings.line_login_channel_secret}
                onChange={(e) => handleInputChange('line_login_channel_secret', e.target.value)}
                margin="normal"
                type={showLoginChannelSecret ? 'text' : 'password'}
                helperText="Your LINE Login Channel secret"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        onClick={() => setShowLoginChannelSecret(!showLoginChannelSecret)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showLoginChannelSecret ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </Box>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="LINE Login Callback URL"
                value={settings.line_login_callback_url}
                onChange={(e) => handleInputChange('line_login_callback_url', e.target.value)}
                margin="normal"
                helperText="URL where LINE redirects after login (e.g., https://yourdomain.com/auth/callback)"
              />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Login />}
                  onClick={configureLoginCallback}
                  disabled={configuring === 'login' || !settings.line_login_callback_url}
                  fullWidth
                >
                  {configuring === 'login' ? 'Configuring...' : 'Validate & Configure'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>





        {/* LIFF Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                LIFF Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="LIFF Endpoint URL"
                value={settings.liff_endpoint_url}
                onChange={(e) => handleInputChange('liff_endpoint_url', e.target.value)}
                margin="normal"
                helperText="Your LIFF app endpoint URL (e.g., https://yourdomain.com)"
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                LIFF IDs (Manually configured)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient DTX Input LIFF ID"
                    value={settings.liff_input_id || ''}
                    onChange={(e) => handleInputChange('liff_input_id', e.target.value)}
                    margin="normal"
                    size="small"
                    helperText="Enter LIFF ID from LINE Developers Console"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient Dashboard LIFF ID"
                    value={settings.liff_dashboard_id || ''}
                    onChange={(e) => handleInputChange('liff_dashboard_id', e.target.value)}
                    margin="normal"
                    size="small"
                    helperText="Enter LIFF ID from LINE Developers Console"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient QR Generator LIFF ID"
                    value={settings.liff_qr_generator_id || ''}
                    onChange={(e) => handleInputChange('liff_qr_generator_id', e.target.value)}
                    margin="normal"
                    size="small"
                    helperText="Enter LIFF ID from LINE Developers Console"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Caregiver Dashboard LIFF ID"
                    value={settings.liff_caregiver_id || ''}
                    onChange={(e) => handleInputChange('liff_caregiver_id', e.target.value)}
                    margin="normal"
                    size="small"
                    helperText="Enter LIFF ID from LINE Developers Console"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Caregiver QR Scanner LIFF ID"
                    value={settings.liff_qr_scanner_id || ''}
                    onChange={(e) => handleInputChange('liff_qr_scanner_id', e.target.value)}
                    margin="normal"
                    size="small"
                    helperText="Enter LIFF ID from LINE Developers Console"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Required LIFF Apps for DiaCare Buddy
                </Typography>
                
                {loadingLiffApps ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading LIFF apps...</Typography>
                  </Box>
                ) : (
                  <Box>
                    {expectedLiffApps.map((expectedApp, index) => {
                      // Check if we have a stored LIFF ID for this app
                      let hasStoredLiffId = false;
                      let storedLiffId = '';
                      
                      switch (expectedApp.name) {
                        case 'Patient DTX Input':
                          hasStoredLiffId = !!settings.liff_input_id;
                          storedLiffId = settings.liff_input_id || '';
                          break;
                        case 'Patient Dashboard':
                          hasStoredLiffId = !!settings.liff_dashboard_id;
                          storedLiffId = settings.liff_dashboard_id || '';
                          break;
                        case 'Patient QR Generator':
                          hasStoredLiffId = !!settings.liff_qr_generator_id;
                          storedLiffId = settings.liff_qr_generator_id || '';
                          break;
                        case 'Caregiver Dashboard':
                          hasStoredLiffId = !!settings.liff_caregiver_id;
                          storedLiffId = settings.liff_caregiver_id || '';
                          break;
                        case 'Caregiver QR Scanner':
                          hasStoredLiffId = !!settings.liff_qr_scanner_id;
                          storedLiffId = settings.liff_qr_scanner_id || '';
                          break;
                      }
                      
                      // Note: existingApp is kept for future use when LINE API detection is working
                      // const existingApp = liffApps.find(app => 
                      //   app.view?.url === expectedApp.url || 
                      //   app.description === expectedApp.description
                      // );
                      
                      return (
                        <Card key={index} sx={{ mb: 1, p: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {expectedApp.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {expectedApp.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                View Type: {expectedApp.view_type} | URL: {expectedApp.url}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Purpose: {expectedApp.purpose}
                              </Typography>
                              {hasStoredLiffId && (
                                <Typography variant="caption" color="success.main" display="block">
                                  LIFF ID: {storedLiffId}
                                </Typography>
                              )}
                              {expectedApp.depends_on && (
                                <Typography variant="caption" color="warning.main" display="block">
                                  Depends on: {expectedApp.depends_on}
                                </Typography>
                              )}
                              {expectedApp.name === 'Patient QR Generator' && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={settings.liff_qr_generator_enabled ?? true}
                                        onChange={(e) => handleInputChange('liff_qr_generator_enabled', e.target.checked)}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="caption" color="text.secondary">
                                        Enable QR Generator
                                      </Typography>
                                    }
                                  />
                                </Box>
                              )}
                              {(expectedApp.name === 'Caregiver Dashboard' || expectedApp.name === 'Caregiver QR Scanner') && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="warning.main" display="block">
                                    {!settings.liff_qr_generator_enabled ? 
                                      '⚠️ Disabled: Patient QR Generator is turned off' : 
                                      '✅ Enabled: Patient QR Generator is active'
                                    }
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ ml: 1 }}>
                              {expectedApp.name === 'Patient QR Generator' ? (
                                // Special handling for QR Generator with toggle
                                hasStoredLiffId && settings.liff_qr_generator_enabled ? (
                                  <Chip 
                                    label="Active" 
                                    color="success" 
                                    size="small"
                                    icon={<CheckCircle />}
                                  />
                                ) : hasStoredLiffId && !settings.liff_qr_generator_enabled ? (
                                  <Chip 
                                    label="Disabled" 
                                    color="warning" 
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                ) : (
                                  <Chip 
                                    label="Missing" 
                                    color="error" 
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                )
                              ) : (expectedApp.name === 'Caregiver Dashboard' || expectedApp.name === 'Caregiver QR Scanner') ? (
                                // Special handling for Caregiver apps with QR Generator dependency
                                hasStoredLiffId && settings.liff_qr_generator_enabled ? (
                                  <Chip 
                                    label="Active" 
                                    color="success" 
                                    size="small"
                                    icon={<CheckCircle />}
                                  />
                                ) : hasStoredLiffId && !settings.liff_qr_generator_enabled ? (
                                  <Chip 
                                    label="Disabled" 
                                    color="warning" 
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                ) : (
                                  <Chip 
                                    label="Missing" 
                                    color="error" 
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                )
                              ) : (
                                // Regular handling for other apps (Patient DTX Input, Patient Dashboard)
                                hasStoredLiffId ? (
                                  <Chip 
                                    label="Active" 
                                    color="success" 
                                    size="small"
                                    icon={<CheckCircle />}
                                  />
                                ) : (
                                  <Chip 
                                    label="Missing" 
                                    color="error" 
                                    size="small"
                                    icon={<ErrorIcon />}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                )}
                

                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>LIFF Apps Overview:</strong>
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                    • <strong>Patient DTX Input:</strong> Compact view for data entry with A1C interpretation
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>Patient Dashboard:</strong> Full view for DTX history and insights
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>Patient QR Generator:</strong> Tall view to generate QR codes for caregivers
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>Caregiver Dashboard:</strong> Full view to see patient DTX data
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>Caregiver QR Scanner:</strong> Tall view to scan QR codes and access patient data
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Telegram Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Telegram Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Telegram Bot Token"
                value={settings.telegram_bot_token}
                onChange={(e) => handleInputChange('telegram_bot_token', e.target.value)}
                margin="normal"
                type={showTelegramToken ? "text" : "password"}
                helperText="Your Telegram Bot token for admin notifications"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        onClick={() => setShowTelegramToken(!showTelegramToken)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showTelegramToken ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </Box>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Telegram Admin Chat ID"
                value={settings.telegram_admin_chat_id}
                onChange={(e) => handleInputChange('telegram_admin_chat_id', e.target.value)}
                margin="normal"
                helperText="Telegram chat ID for admin notifications"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Environment & Limits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Environment & Rate Limits
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.is_production}
                        onChange={(e) => handleInputChange('is_production', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Production Mode
                        <Chip 
                          label={settings.is_production ? 'Production' : 'Development'} 
                          color={settings.is_production ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    }
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rate Limit (messages/second)"
                    type="number"
                    value={settings.rate_limit_per_second}
                    onChange={(e) => handleInputChange('rate_limit_per_second', parseInt(e.target.value) || 0)}
                    helperText="Maximum messages per second"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Monthly Message Limit"
                      type="number"
                      value={settings.monthly_message_limit}
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Auto-fetched from LINE Message Quota API"
                    />
                    <Button
                      variant="outlined"
                      startIcon={fetchingQuota ? <CircularProgress size={16} /> : <GetApp />}
                      onClick={fetchMessageQuota}
                      disabled={fetchingQuota}
                      sx={{ minWidth: 'auto', p: 1.5 }}
                    >
                      {fetchingQuota ? 'Fetching...' : 'Fetch'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadBotSettings}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={saveBotSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotSettingsPanel;
