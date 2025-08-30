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
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalHospital as DoctorIcon,
  MedicalServices as NurseIcon,
  School as TeacherIcon,
  FamilyRestroom as ParentIcon,
  Business as HospitalIcon
} from '@mui/icons-material';
import axios from 'axios';

interface MedicalUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'teacher' | 'parent' | 'medical_staff' | 'exclusive_hospital';
  organization?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface MedicalUserFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'doctor' | 'nurse' | 'teacher' | 'parent' | 'medical_staff' | 'exclusive_hospital';
  organization: string;
  phone: string;
  is_active: boolean;
}

const MedicalUserManagement: React.FC = () => {
  const [users, setUsers] = useState<MedicalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<MedicalUser | null>(null);
  const [formData, setFormData] = useState<MedicalUserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'doctor',
    organization: '',
    phone: '',
    is_active: true
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/auth/medical-staff-users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching medical users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch medical users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: MedicalUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '',
        role: user.role,
        organization: user.organization || '',
        phone: user.phone || '',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'doctor',
        organization: '',
        phone: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Update existing user
        await axios.put(`/api/v1/auth/medical-staff-users/${editingUser.id}`, {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          organization: formData.organization,
          phone: formData.phone,
          is_active: formData.is_active,
          ...(formData.password && { password: formData.password })
        });
        setSnackbar({
          open: true,
          message: 'Medical user updated successfully',
          severity: 'success'
        });
      } else {
        // Create new user
        await axios.post('/api/v1/auth/medical-staff-users', formData);
        setSnackbar({
          open: true,
          message: 'Medical user created successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving medical user:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save medical user',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this medical user?')) {
      try {
        await axios.delete(`/api/v1/auth/medical-staff-users/${userId}`);
        setSnackbar({
          open: true,
          message: 'Medical user deleted successfully',
          severity: 'success'
        });
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting medical user:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.detail || 'Failed to delete medical user',
          severity: 'error'
        });
      }
    }
  };

  const handleToggleStatus = async (user: MedicalUser) => {
    try {
      await axios.put(`/api/v1/auth/medical-staff-users/${user.id}`, {
        ...user,
        is_active: !user.is_active
      });
      setSnackbar({
        open: true,
        message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user status',
        severity: 'error'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <DoctorIcon color="primary" />;
      case 'nurse':
        return <NurseIcon color="secondary" />;
      case 'teacher':
        return <TeacherIcon color="success" />;
      case 'parent':
        return <ParentIcon color="warning" />;
      case 'exclusive_hospital':
        return <HospitalIcon color="info" />;
      default:
        return <DoctorIcon color="primary" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'primary';
      case 'nurse':
        return 'secondary';
      case 'teacher':
        return 'success';
      case 'parent':
        return 'warning';
      case 'exclusive_hospital':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Medical Portal Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage healthcare professionals and medical portal access
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            🏥 Focused on medical portal access control and healthcare professional management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Medical Portal User
          </Button>
        </Box>
      </Box>

      {/* Usage Hint */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>When to use this page:</strong> Use this page when you need to specifically manage medical portal access, 
          set up healthcare professionals, or control who can access the medical portal for patient care.
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading medical users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No medical users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                            {getInitials(user.first_name, user.last_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.role.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role.replace('_', ' ').toUpperCase()}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.organization || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.is_active}
                              onChange={() => handleToggleStatus(user)}
                              color="primary"
                            />
                          }
                          label={user.is_active ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(user)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(user.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit Medical User' : 'Add New Medical User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required={!editingUser}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  label="Role"
                >
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                  <MenuItem value="medical_staff">Medical Staff</MenuItem>
                  <MenuItem value="exclusive_hospital">Exclusive Hospital</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
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

export default MedicalUserManagement;
