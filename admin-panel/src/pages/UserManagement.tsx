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
  Avatar,
  Tabs,
  Tab,
  Box as MuiBox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  LocalHospital as DoctorIcon,
  MedicalServices as NurseIcon,
  School as TeacherIcon,
  FamilyRestroom as ParentIcon,
  Business as HospitalIcon,
  People as PeopleIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  user_type: 'admin' | 'medical';
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  organization: string;
  phone: string;
  is_active: boolean;
  user_type: 'admin' | 'medical';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <MuiBox sx={{ p: 3 }}>{children}</MuiBox>}
    </div>
  );
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'admin',
    organization: '',
    phone: '',
    is_active: true,
    user_type: 'admin'
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const adminRoles = [
    { value: 'admin', label: 'Admin', icon: <AdminIcon /> },
    { value: 'super_admin', label: 'Super Admin', icon: <AdminIcon /> }
  ];

  const medicalRoles = [
    { value: 'doctor', label: 'Doctor', icon: <DoctorIcon /> },
    { value: 'nurse', label: 'Nurse', icon: <NurseIcon /> },
    { value: 'teacher', label: 'Teacher', icon: <TeacherIcon /> },
    { value: 'parent', label: 'Parent', icon: <ParentIcon /> },
    { value: 'medical_staff', label: 'Medical Staff', icon: <DoctorIcon /> },
    { value: 'exclusive_hospital', label: 'Exclusive Hospital', icon: <HospitalIcon /> }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch both admin and medical users
      const [adminResponse, medicalResponse] = await Promise.all([
        axios.get('/api/v1/auth/admin-users'),
        axios.get('/api/v1/auth/medical-staff-users')
      ]);

      const adminUsers = adminResponse.data.map((user: any) => ({
        ...user,
        user_type: 'admin' as const,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
      }));

      const medicalUsers = medicalResponse.data.map((user: any) => ({
        ...user,
        user_type: 'medical' as const,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
      }));

      setUsers([...adminUsers, ...medicalUsers]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('/api/v1/admin/users/pending');
      setPendingUsers(response.data.pending_users || []);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch pending users',
        severity: 'error'
      });
    }
  };

  const handleApproveUser = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await axios.post(`/api/v1/admin/users/${userId}/approve`, {
        action,
        reason
      });
      
      setSnackbar({
        open: true,
        message: `User ${action}d successfully`,
        severity: 'success'
      });
      
      // Refresh both pending users and regular users
      fetchPendingUsers();
      fetchUsers();
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      setSnackbar({
        open: true,
        message: `Failed to ${action} user`,
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        role: user.role,
        organization: user.organization || '',
        phone: user.phone || '',
        is_active: user.is_active,
        user_type: user.user_type
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: tabValue === 0 ? 'admin' : 'doctor',
        organization: '',
        phone: '',
        is_active: true,
        user_type: tabValue === 0 ? 'admin' : 'medical'
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
      const endpoint = formData.user_type === 'admin' 
        ? '/api/v1/auth/admin-users' 
        : '/api/v1/auth/medical-staff-users';

      if (editingUser) {
        // Update existing user
        await axios.put(`${endpoint}/${editingUser.id}`, {
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
          message: 'User updated successfully',
          severity: 'success'
        });
      } else {
        // Create new user
        await axios.post(endpoint, formData);
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save user',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name || user.email}?`)) {
      try {
        const endpoint = user.user_type === 'admin' 
          ? '/api/v1/auth/admin-users' 
          : '/api/v1/auth/medical-staff-users';
        
        await axios.delete(`${endpoint}/${user.id}`);
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.detail || 'Failed to delete user',
          severity: 'error'
        });
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const endpoint = user.user_type === 'admin' 
        ? '/api/v1/auth/admin-users' 
        : '/api/v1/auth/medical-staff-users';
      
      await axios.put(`${endpoint}/${user.id}`, {
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
      case 'admin':
      case 'super_admin':
        return <AdminIcon color="primary" />;
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
        return <PeopleIcon color="primary" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'primary';
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

  const filteredUsers = users.filter(user => 
    tabValue === 0 ? user.user_type === 'admin' : user.user_type === 'medical'
  );

  const currentRoles = tabValue === 0 ? adminRoles : medicalRoles;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Unified User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive management of all users across Admin Panel and Medical Portal
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            💡 This page combines Admin Panel Users and Medical Portal Users for unified administration
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
            Add User
          </Button>
        </Box>
      </Box>

      {/* User Type Comparison */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Type Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AdminIcon color="primary" />
                    <Typography variant="h6" color="primary">Admin Panel Users</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Users who can access the admin panel and manage system settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label="Admin" size="small" color="primary" variant="outlined" />
                    <Chip label="Super Admin" size="small" color="primary" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DoctorIcon color="secondary" />
                    <Typography variant="h6" color="secondary">Medical Portal Users</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Healthcare professionals who use the medical portal for patient care
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label="Doctor" size="small" color="secondary" variant="outlined" />
                    <Chip label="Nurse" size="small" color="secondary" variant="outlined" />
                    <Chip label="Teacher" size="small" color="secondary" variant="outlined" />
                    <Chip label="Parent" size="small" color="secondary" variant="outlined" />
                    <Chip label="Medical Staff" size="small" color="secondary" variant="outlined" />
                    <Chip label="Exclusive Hospital" size="small" color="secondary" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminIcon color="primary" />
                  Admin Panel Users
                  <Chip label={users.filter(u => u.user_type === 'admin').length} size="small" color="primary" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DoctorIcon color="secondary" />
                  Medical Portal Users
                  <Chip label={users.filter(u => u.user_type === 'medical').length} size="small" color="secondary" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="warning" />
                  Pending Approvals
                  <Chip label={pendingUsers.length} size="small" color="warning" />
                </Box>
              } 
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                              {getInitials(user.first_name || '', user.last_name || '')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {user.name || user.email}
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
                                onClick={() => handleDelete(user)}
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
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
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
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                              {getInitials(user.first_name || '', user.last_name || '')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {user.name || user.email}
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
                                onClick={() => handleDelete(user)}
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
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Loading pending users...
                      </TableCell>
                    </TableRow>
                  ) : pendingUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No pending users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                              {getInitials(user.first_name || '', user.last_name || '')}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {user.first_name} {user.last_name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role.replace('_', ' ').toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{user.organization || '-'}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Approve User">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveUser(user.id, 'approve')}
                                color="success"
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject User">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveUser(user.id, 'reject')}
                                color="error"
                              >
                                <CloseIcon />
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
          </TabPanel>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  {currentRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
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

export default UserManagement;
