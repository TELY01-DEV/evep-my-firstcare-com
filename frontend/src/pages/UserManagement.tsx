import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  Pagination,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AvatarUpload from '../components/AvatarUpload';
import unifiedApi from '../services/unifiedApi';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  specialization?: string;
  phone?: string;
  license_number?: string;
  qualifications?: string[];
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  recent_users: number;
  role_distribution: Record<string, number>;
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const { token, refreshToken, isTokenExpired } = useAuth();
  const { t } = useLanguage();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    phone: '',
    avatar: '',
    is_active: true
  });
  
  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Using unified API service

  // Helper function to ensure valid token
  const ensureValidToken = async () => {
    if (isTokenExpired()) {
      console.log('Token expired, attempting refresh...');
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error('Session expired. Please login again.');
      }
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      console.log('fetchUsers called - token:', token ? 'present' : 'missing');
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter === 'active' ? 'true' : 'false' })
      });

      console.log('Fetching users from:', `https://stardust.evep.my-firstcare.com/api/v1/user-management/?${params}`);
      const response = await unifiedApi.get(`/api/v1/user-management/?${params}`);
      const data: UserListResponse = response.data;
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/user-management/statistics/overview');
      const data = response.data;
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Create user
  const createUser = async () => {
    try {
      console.log('Creating user with data:', formData);
      console.log('Using token:', token ? 'present' : 'missing');
      
      // Validate required fields
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.role) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/user-management/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Create user response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to create user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('User created successfully:', result);

      setSnackbar({
        open: true,
        message: 'User created successfully',
        severity: 'success'
      });
      
      setCreateDialogOpen(false);
      resetForm();
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      console.error('Create user error:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to create user',
        severity: 'error'
      });
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        avatar: formData.avatar,
        is_active: formData.is_active
      };

      const response = await fetch(`https://stardust.evep.my-firstcare.com/api/v1/user-management/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }

      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      
      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update user',
        severity: 'error'
      });
    }
  };

  // Toggle user status (activate/deactivate)
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling user status - ID: ${userId}, Current: ${currentStatus}`);
      console.log('Token available:', token ? 'yes' : 'no');
      
      // Ensure we have a valid token
      await ensureValidToken();
      
      const endpoint = currentStatus 
        ? `https://stardust.evep.my-firstcare.com/api/v1/user-management/${userId}` 
        : `https://stardust.evep.my-firstcare.com/api/v1/user-management/${userId}/activate`;
      
      const method = currentStatus ? 'DELETE' : 'POST';

      console.log(`Making ${method} request to: ${endpoint}`);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Toggle status response:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Failed to ${currentStatus ? 'deactivate' : 'activate'} user`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Toggle status result:', result);

      setSnackbar({
        open: true,
        message: `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });
      
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      console.error('Toggle status error:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update user status',
        severity: 'error'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: '',
      department: '',
      phone: '',
      avatar: '',
      is_active: true
    });
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'error',
      system_admin: 'error',
      medical_admin: 'error',
      doctor: 'primary',
      nurse: 'secondary',
      optometrist: 'info',
      technician: 'warning',
      coordinator: 'success',
      assistant: 'default'
    };
    return colors[role] || 'default';
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const names: Record<string, string> = {
      super_admin: 'Super Admin',
      system_admin: 'System Admin',
      medical_admin: 'Medical Admin',
      doctor: 'Doctor',
      nurse: 'Nurse',
      optometrist: 'Optometrist',
      technician: 'Technician',
      coordinator: 'Coordinator',
      assistant: 'Assistant'
    };
    return names[role] || role;
  };

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [page, limit, search, roleFilter, statusFilter]);

  console.log('UserManagement render - users:', users.length, 'loading:', loading);

  // Add error boundary for DOM issues
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('UserManagement DOM error:', event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          {t('user_management.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('user_management.subtitle')}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total_users}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {t('user_management.total_users')}
                    </Typography>
                  </Box>
                  <GroupIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.active_users}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {t('user_management.active_users')}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.recent_users}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      New This Month
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.inactive_users}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {t('user_management.inactive_users')}
                    </Typography>
                  </Box>
                  <BlockIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('user_management.search_users')}
                value={search}
                onChange={(e) => {
                  try {
                    setSearch(e.target.value);
                  } catch (error) {
                    console.error('Search input error:', error);
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                id="user-search-input"
                data-testid="user-search-input"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                  <MenuItem value="medical_admin">Medical Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="optometrist">Optometrist</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="coordinator">Coordinator</MenuItem>
                  <MenuItem value="assistant">Assistant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ ml: 'auto' }}
                >
                  {t('user_management.add_user')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users && users.length > 0 ? users.map((user) => (
                  <TableRow key={user.id || `user-${Math.random()}`}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          src={user.avatar} 
                          sx={{ width: 40, height: 40 }}
                          alt={`${user.first_name} ${user.last_name}`}
                        >
                          {!user.avatar && `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || 'U'}`}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={getRoleDisplayName(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {user.phone || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={1} alignItems="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="medium"
                            sx={{ 
                              border: '1px solid #ccc',
                              '&:hover': { backgroundColor: 'primary.light' }
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('View button clicked for user:', user);
                              setSelectedUser(user);
                              setViewDialogOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="medium"
                            sx={{ 
                              border: '1px solid #ccc',
                              '&:hover': { backgroundColor: 'warning.light' }
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Edit button clicked for user:', user);
                              setSelectedUser(user);
                              setFormData({
                                email: user.email,
                                password: '',
                                first_name: user.first_name,
                                last_name: user.last_name,
                                role: user.role,
                                department: user.department || '',
                                phone: user.phone || '',
                                avatar: user.avatar || '',
                                is_active: user.is_active
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.is_active ? "Deactivate User" : "Activate User"}>
                          <IconButton 
                            size="medium"
                            sx={{ 
                              border: '1px solid #ccc',
                              '&:hover': { backgroundColor: user.is_active ? 'error.light' : 'success.light' }
                            }}
                            color={user.is_active ? "error" : "success"}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Toggle status button clicked for user:', user);
                              toggleUserStatus(user.id, user.is_active);
                            }}
                          >
                            {user.is_active ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => {
        setEditDialogOpen(false);
        setSelectedUser(null);
        resetForm();
      }} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Avatar Upload Section */}
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
              <AvatarUpload
                currentAvatar={formData.avatar}
                userId={selectedUser?.id || "edit-user"}
                size="large"
                editable={true}
                onAvatarUpdate={(avatarUrl) => {
                  setFormData({ ...formData, avatar: avatarUrl });
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="Leave blank to keep current password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                  <MenuItem value="medical_admin">Medical Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="optometrist">Optometrist</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="coordinator">Coordinator</MenuItem>
                  <MenuItem value="assistant">Assistant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedUser(null);
            resetForm();
          }}>Cancel</Button>
          <Button onClick={updateUser} variant="contained">Update User</Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => {
        setViewDialogOpen(false);
        setSelectedUser(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                <Avatar
                  src={selectedUser.avatar}
                  sx={{ width: 120, height: 120 }}
                  alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                >
                  {!selectedUser.avatar && `${selectedUser.first_name?.[0] || 'U'}${selectedUser.last_name?.[0] || 'U'}`}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedUser.first_name} {selectedUser.last_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Chip
                  label={getRoleDisplayName(selectedUser.role)}
                  color={getRoleColor(selectedUser.role) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedUser.department || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                <Typography variant="body1">{selectedUser.specialization || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedUser.phone || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
                <Typography variant="body1">{selectedUser.license_number || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedUser.is_active ? 'Active' : 'Inactive'}
                  color={selectedUser.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Qualifications</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  {selectedUser.qualifications && selectedUser.qualifications.length > 0 ? (
                    selectedUser.qualifications.map((qual, index) => (
                      <Chip key={index} label={qual} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No qualifications specified</Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">{new Date(selectedUser.created_at).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                <Typography variant="body1">
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedUser(null);
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Avatar Upload Section */}
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
              <AvatarUpload
                currentAvatar={formData.avatar}
                userId="new-user"
                size="large"
                editable={true}
                onAvatarUpdate={(avatarUrl) => {
                  setFormData({ ...formData, avatar: avatarUrl });
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                  <MenuItem value="medical_admin">Medical Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="optometrist">Optometrist</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="coordinator">Coordinator</MenuItem>
                  <MenuItem value="assistant">Assistant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={createUser} variant="contained">Create User</Button>
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

export default UserManagement;
