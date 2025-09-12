import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  SystemUpdate as SystemUpdateIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface Setting {
  key: string;
  value: any;
  category: string;
  description: string;
  updated_at?: string;
  updated_by?: string;
}

interface SettingFormData {
  key: string;
  value: any;
  category: string;
  description: string;
}

const categoryIcons: { [key: string]: React.ReactElement } = {
  system: <SystemUpdateIcon />,
  user: <CategoryIcon />,
  security: <SecurityIcon />,
  email: <EmailIcon />,
  notification: <NotificationsIcon />,
  storage: <StorageIcon />,
  analytics: <AnalyticsIcon />
};

const categoryColors: { [key: string]: string } = {
  system: '#1976d2',
  user: '#388e3c',
  security: '#d32f2f',
  email: '#7b1fa2',
  notification: '#f57c00',
  storage: '#00796b',
  analytics: '#303f9f'
};

export default function AdminSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<{ [key: string]: Setting }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    category: 'system',
    description: ''
  });

  const token = localStorage.getItem('evep_token');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings || {});
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(Object.values(data.settings || {}).map((s: any) => s.category)));
      setCategories(uniqueCategories);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  const handleAddSetting = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create setting');
      }

      setSuccess('Setting created successfully');
      setAddDialogOpen(false);
      setFormData({ key: '', value: '', category: 'system', description: '' });
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create setting');
    }
  };

  const handleUpdateSetting = async () => {
    if (!selectedSetting) return;

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings/${selectedSetting.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          value: formData.value,
          description: formData.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      setSuccess('Setting updated successfully');
      setEditDialogOpen(false);
      setSelectedSetting(null);
      setFormData({ key: '', value: '', category: 'system', description: '' });
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  const handleDeleteSetting = async () => {
    if (!selectedSetting) return;

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings/${selectedSetting.key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete setting');
      }

      setSuccess('Setting deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSetting(null);
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete setting');
    }
  };

  const handleInitializeSettings = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/settings/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      setSuccess('Default settings initialized successfully');
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize settings');
    }
  };

  const openEditDialog = (setting: Setting) => {
    setSelectedSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (setting: Setting) => {
    setSelectedSetting(setting);
    setDeleteDialogOpen(true);
  };

  const renderValue = (value: any) => {
    if (typeof value === 'boolean') {
      return <Chip label={value ? 'True' : 'False'} color={value ? 'success' : 'default'} size="small" />;
    }
    if (Array.isArray(value)) {
      return <Chip label={value.join(', ')} size="small" />;
    }
    if (typeof value === 'object') {
      return <Chip label={JSON.stringify(value)} size="small" />;
    }
    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const getSettingsByCategory = (category: string) => {
    return Object.entries(settings).filter(([_, setting]) => setting.category === category);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('settings.title')}
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
            variant="outlined"
            startIcon={<SystemUpdateIcon />}
            onClick={handleInitializeSettings}
          >
            Initialize Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Setting
          </Button>
        </Box>
      </Box>

      {/* Settings by Category */}
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} key={category}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ color: categoryColors[category] }}>
                    {categoryIcons[category] || <CategoryIcon />}
                  </Box>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {category} Settings
                  </Typography>
                  <Chip 
                    label={getSettingsByCategory(category).length} 
                    size="small" 
                    color="primary" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Setting Key</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Updated</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSettingsByCategory(category).map(([key, setting]) => (
                        <TableRow key={key}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {setting.key}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {renderValue(setting.value)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {setting.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {setting.updated_at ? new Date(setting.updated_at).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              <Tooltip title="Edit Setting">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openEditDialog(setting)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Setting">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDeleteDialog(setting)}
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
          </Grid>
        ))}
      </Grid>

      {/* Add Setting Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Setting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Setting Key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., system.maintenance_mode"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter value"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                placeholder="Describe what this setting controls"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleAddSetting} variant="contained" startIcon={<SaveIcon />}>
            Add Setting
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Setting Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Setting: {selectedSetting?.key}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter new value"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                placeholder="Describe what this setting controls"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleUpdateSetting} variant="contained" startIcon={<SaveIcon />}>
            Update Setting
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Setting</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the setting "{selectedSetting?.key}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSetting} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

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
}
