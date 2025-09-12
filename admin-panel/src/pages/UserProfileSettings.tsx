import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profile_visible: boolean;
      activity_visible: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UserProfileSettings: React.FC = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en',
    timezone: 'Asia/Bangkok',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    profile_visible: true,
    activity_visible: false
  });

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/auth/profile');
      const userData = response.data;
      
      setProfile(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        theme: userData.preferences?.theme || 'light',
        language: userData.preferences?.language || 'en',
        timezone: userData.preferences?.timezone || 'Asia/Bangkok',
        email_notifications: userData.preferences?.notifications?.email ?? true,
        push_notifications: userData.preferences?.notifications?.push ?? true,
        sms_notifications: userData.preferences?.notifications?.sms ?? false,
        profile_visible: userData.preferences?.privacy?.profile_visible ?? true,
        activity_visible: userData.preferences?.privacy?.activity_visible ?? false
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to fetch user profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        preferences: {
          theme: formData.theme,
          language: formData.language,
          timezone: formData.timezone,
          notifications: {
            email: formData.email_notifications,
            push: formData.push_notifications,
            sms: formData.sms_notifications
          },
          privacy: {
            profile_visible: formData.profile_visible,
            activity_visible: formData.activity_visible
          }
        }
      };

      const response = await axios.put('/api/v1/auth/profile', updateData);
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      
      // Refresh profile data
      await fetchUserProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error'
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await axios.put('/api/v1/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
      
      setPasswordDialogOpen(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to change password',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Profile Settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem'
                    }}
                  >
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(formData.first_name, formData.last_name)
                    )}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      border: 2,
                      borderColor: 'divider'
                    }}
                    size="small"
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </Box>
                <Typography variant="h6">
                  {formData.first_name} {formData.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile?.email}
                </Typography>
                <Chip
                  label={profile?.role?.toUpperCase()}
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">Personal Information</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profile?.email || ''}
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Appearance & Language */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PaletteIcon color="primary" />
                    <Typography variant="h6">Appearance & Language</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Theme</InputLabel>
                        <Select
                          value={formData.theme}
                          label="Theme"
                          onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                        >
                          <MenuItem value="light">Light</MenuItem>
                          <MenuItem value="dark">Dark</MenuItem>
                          <MenuItem value="auto">Auto (System)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={formData.language}
                          label="Language"
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="th">ไทย</MenuItem>
                          <MenuItem value="zh">中文</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Timezone</InputLabel>
                        <Select
                          value={formData.timezone}
                          label="Timezone"
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        >
                          <MenuItem value="Asia/Bangkok">Asia/Bangkok</MenuItem>
                          <MenuItem value="UTC">UTC</MenuItem>
                          <MenuItem value="America/New_York">America/New_York</MenuItem>
                          <MenuItem value="Europe/London">Europe/London</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Notifications */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <NotificationsIcon color="primary" />
                    <Typography variant="h6">Notifications</Typography>
                  </Box>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive notifications via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={formData.email_notifications}
                          onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Push Notifications"
                        secondary="Receive push notifications in browser"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={formData.push_notifications}
                          onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="SMS Notifications"
                        secondary="Receive notifications via SMS"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={formData.sms_notifications}
                          onChange={(e) => setFormData({ ...formData, sms_notifications: e.target.checked })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Privacy */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">Privacy</Typography>
                  </Box>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Profile Visibility"
                        secondary="Allow others to see your profile information"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={formData.profile_visible}
                          onChange={(e) => setFormData({ ...formData, profile_visible: e.target.checked })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Activity Visibility"
                        secondary="Allow others to see your activity"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={formData.activity_visible}
                          onChange={(e) => setFormData({ ...formData, activity_visible: e.target.checked })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SecurityIcon />}
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchUserProfile}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default UserProfileSettings;

