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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Api as ApiIcon,
  Save as SaveIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SystemSetting {
  key: string;
  value: any;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingFormData {
  key: string;
  value: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_editable: boolean;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    category: 'general',
    type: 'string',
    description: '',
    is_editable: true
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const categories = [
    { key: 'general', label: 'General', icon: <SettingsIcon /> },
    { key: 'security', label: 'Security', icon: <SecurityIcon /> },
    { key: 'email', label: 'Email', icon: <EmailIcon /> },
    { key: 'database', label: 'Database', icon: <StorageIcon /> },
    { key: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
    { key: 'api', label: 'API', icon: <ApiIcon /> }
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
              const response = await axios.get('/api/v1/admin/settings/list');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch system settings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenDialog = (setting?: SystemSetting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        key: setting.key,
        value: typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value),
        category: setting.category,
        type: setting.type,
        description: setting.description,
        is_editable: setting.is_editable
      });
    } else {
      setEditingSetting(null);
      setFormData({
        key: '',
        value: '',
        category: 'general',
        type: 'string',
        description: '',
        is_editable: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSetting(null);
  };

  const handleSubmit = async () => {
    try {
      let processedValue: any = formData.value;
      
      // Process value based on type
      switch (formData.type) {
        case 'number':
          processedValue = Number(formData.value);
          break;
        case 'boolean':
          processedValue = formData.value === 'true';
          break;
        case 'json':
          try {
            processedValue = JSON.parse(formData.value);
          } catch {
            throw new Error('Invalid JSON format');
          }
          break;
        default:
          processedValue = formData.value;
      }

      if (editingSetting) {
        // Update existing setting
        await axios.put(`/api/v1/admin/settings/${formData.key}`, {
          value: processedValue,
          category: formData.category,
          type: formData.type,
          description: formData.description,
          is_editable: formData.is_editable
        });
        setSnackbar({
          open: true,
          message: 'Setting updated successfully',
          severity: 'success'
        });
      } else {
        // Create new setting
        await axios.post('/api/v1/admin/settings', {
          key: formData.key,
          value: processedValue,
          category: formData.category,
          type: formData.type,
          description: formData.description,
          is_editable: formData.is_editable
        });
        setSnackbar({
          open: true,
          message: 'Setting created successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving setting:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || error.message || 'Failed to save setting',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (settingKey: string) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      try {
        await axios.delete(`/api/v1/admin/settings/${settingKey}`);
        setSnackbar({
          open: true,
          message: 'Setting deleted successfully',
          severity: 'success'
        });
        fetchSettings();
      } catch (error: any) {
        console.error('Error deleting setting:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.detail || 'Failed to delete setting',
          severity: 'error'
        });
      }
    }
  };

  const handleInitializeSettings = async () => {
    try {
      await axios.post('/api/v1/admin/settings/initialize');
      setSnackbar({
        open: true,
        message: 'System settings initialized successfully',
        severity: 'success'
      });
      fetchSettings();
    } catch (error: any) {
      console.error('Error initializing settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to initialize settings',
        severity: 'error'
      });
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const formatValue = (value: any, type: string) => {
    switch (type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'json':
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.icon : <CategoryIcon />;
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.label : category;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system settings and configuration
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleInitializeSettings}
            color="secondary"
          >
            Initialize Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Setting
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Card>
          <CardContent>
            <Typography align="center">Loading system settings...</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {categories.map((category) => {
            const categorySettings = getSettingsByCategory(category.key);
            if (categorySettings.length === 0) return null;

            return (
              <Accordion key={category.key} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    <Typography variant="h6">
                      {category.label} ({categorySettings.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Key</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Editable</TableCell>
                          <TableCell>Updated</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categorySettings.map((setting) => (
                          <TableRow key={setting.key}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {setting.key}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                                  {formatValue(setting.value, setting.type)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={setting.type.toUpperCase()}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {setting.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={setting.is_editable ? 'Yes' : 'No'}
                                size="small"
                                color={setting.is_editable ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {formatDate(setting.updated_at)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="Edit Setting">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(setting)}
                                    color="primary"
                                    disabled={!setting.is_editable}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Setting">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(setting.key)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSetting ? 'Edit System Setting' : 'Add New System Setting'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Setting Key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                fullWidth
                required
                disabled={!!editingSetting}
                helperText="Unique identifier for the setting"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  label="Type"
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_editable}
                    onChange={(e) => setFormData({ ...formData, is_editable: e.target.checked })}
                    color="primary"
                  />
                }
                label="Editable"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                fullWidth
                multiline
                rows={formData.type === 'json' ? 4 : 2}
                required
                helperText={
                  formData.type === 'json' 
                    ? 'Enter valid JSON format' 
                    : formData.type === 'boolean'
                    ? 'Enter "true" or "false"'
                    : formData.type === 'number'
                    ? 'Enter a number'
                    : 'Enter the setting value'
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSetting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default SystemSettings;
