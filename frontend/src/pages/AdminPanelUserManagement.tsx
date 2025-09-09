import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';

interface AdminUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin';
  organization: string;
  phone: string;
  location: string;
  is_active: boolean;
  is_verified: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
  profile_image?: string;
  admin_level?: 'system' | 'organization' | 'department';
  access_level?: 'full' | 'limited' | 'read_only';
}

interface AdminUserStats {
  totalAdminUsers: number;
  activeAdminUsers: number;
  superAdmins: number;
  systemAdmins: number;
  organizationAdmins: number;
  verifiedAdmins: number;
  newAdminsThisMonth: number;
}

const AdminPanelUserManagement: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'create'>('view');

  useEffect(() => {
    fetchAdminUserData();
  }, []);

  const fetchAdminUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Fetch admin users
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const usersResponse = await fetch(`${baseUrl}/api/v1/admin/panel-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch admin user stats
      const statsResponse = await fetch(`${baseUrl}/api/v1/admin/panel-users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || getMockAdminUsers());
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || getMockAdminStats());
      }
    } catch (err) {
      console.error('Failed to fetch admin user data:', err);
      setUsers(getMockAdminUsers());
      setStats(getMockAdminStats());
    } finally {
      setLoading(false);
    }
  };

  const getMockAdminUsers = (): AdminUser[] => [
    {
      user_id: '1',
      email: 'admin@evep.com',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'super_admin',
      organization: 'EVEP Platform',
      phone: '+66-2-123-4567',
      location: 'Bangkok, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T10:30:00Z',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-08-28T10:30:00Z',
      permissions: ['all'],
      admin_level: 'system',
      access_level: 'full',
    },
    {
      user_id: '2',
      email: 'admin2@evep.com',
      first_name: 'John',
      last_name: 'Smith',
      role: 'admin',
      organization: 'EVEP Platform',
      phone: '+66-2-234-5678',
      location: 'Bangkok, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T09:15:00Z',
      created_at: '2025-02-15T00:00:00Z',
      updated_at: '2025-08-28T09:15:00Z',
      permissions: ['user_management', 'system_settings', 'security_audit'],
      admin_level: 'organization',
      access_level: 'limited',
    },
    {
      user_id: '3',
      email: 'admin3@evep.com',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'admin',
      organization: 'EVEP Platform',
      phone: '+66-2-345-6789',
      location: 'Chiang Mai, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T08:45:00Z',
      created_at: '2025-03-10T00:00:00Z',
      updated_at: '2025-08-28T08:45:00Z',
      permissions: ['user_management', 'reports'],
      admin_level: 'department',
      access_level: 'read_only',
    },
  ];

  const getMockAdminStats = (): AdminUserStats => ({
    totalAdminUsers: 8,
    activeAdminUsers: 7,
    superAdmins: 2,
    systemAdmins: 3,
    organizationAdmins: 2,
    verifiedAdmins: 7,
    newAdminsThisMonth: 1,
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <SecurityIcon color="error" />;
      case 'admin':
        return <AdminIcon color="primary" />;
      default:
        return <AdminIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'success';
      case 'limited':
        return 'warning';
      case 'read_only':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogType('edit');
    setDialogOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setDialogType('create');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('evep_token');
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/admin/panel-users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        toast.success(`Admin user ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchAdminUserData(); // Refresh data
      } else {
        toast.error('Failed to update admin user status');
      }
    } catch (err) {
      toast.error('Error updating admin user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Panel User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users who have access to the admin panel
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAdminUserData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add Admin User
          </Button>
        </Box>
      </Box>

      {/* Admin User Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2 }}>
                    <AdminIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalAdminUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Admin Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2 }}>
                    <ActiveIcon color="success" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.activeAdminUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Admin Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2 }}>
                    <SecurityIcon color="error" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.superAdmins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Super Admins
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2 }}>
                    <AdminIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.systemAdmins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Admins
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search admin users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setFilterRole('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Admin Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Admin User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Access Level</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.user_id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={user.profile_image}>
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getRoleIcon(user.role)}
                          <Chip
                            label={user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.access_level || 'N/A'}
                          color={getAccessLevelColor(user.access_level || 'default')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.organization}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          {user.is_verified && (
                            <Chip
                              label="Verified"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.last_login).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUser(user)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Admin User">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleUserStatus(user.user_id, !user.is_active)}
                              color={user.is_active ? 'warning' : 'success'}
                            >
                              {user.is_active ? <BlockIcon /> : <ActiveIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </CardContent>
      </Card>

      {/* Admin User Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create New Admin User' : 
           dialogType === 'edit' ? 'Edit Admin User' : 'Admin User Details'}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedUser.first_name} {selectedUser.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedUser.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Role: {selectedUser.role === 'super_admin' ? 'Super Admin' : 'Admin'} | 
                Access Level: {selectedUser.access_level || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Organization: {selectedUser.organization}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'edit' && (
            <Button variant="contained" onClick={handleCloseDialog}>
              Save Changes
            </Button>
          )}
          {dialogType === 'create' && (
            <Button variant="contained" onClick={handleCloseDialog}>
              Create Admin User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanelUserManagement;

