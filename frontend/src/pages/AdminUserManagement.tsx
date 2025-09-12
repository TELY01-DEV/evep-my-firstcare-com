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
  Alert,
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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  School as TeacherIcon,
  FamilyRestroom as ParentIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'teacher' | 'parent';
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
  department?: string;
  specialization?: string;
  license_number?: string;
  school_district?: string;
  grade_level?: string;
  children_count?: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  medicalUsers: number;
  teacherUsers: number;
  parentUsers: number;
  verifiedUsers: number;
  newUsersThisMonth: number;
}

const AdminUserManagement: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'create'>('view');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      // Fetch users
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const usersResponse = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch user stats
      const statsResponse = await fetch(`${baseUrl}/api/v1/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || getMockUsers());
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || getMockStats());
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setUsers(getMockUsers());
      setStats(getMockStats());
    } finally {
      setLoading(false);
    }
  };

  const getMockUsers = (): User[] => [
    {
      user_id: '1',
      email: 'admin@evep.com',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      organization: 'EVEP Platform',
      phone: '+66-2-123-4567',
      location: 'Bangkok, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T10:30:00Z',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-08-28T10:30:00Z',
      permissions: ['all'],
    },
    {
      user_id: '2',
      email: 'dr.smith@hospital.com',
      first_name: 'Dr. John',
      last_name: 'Smith',
      role: 'doctor',
      organization: 'Bangkok General Hospital',
      phone: '+66-2-234-5678',
      location: 'Bangkok, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T09:15:00Z',
      created_at: '2025-02-15T00:00:00Z',
      updated_at: '2025-08-28T09:15:00Z',
      permissions: ['patient_management', 'screening', 'reports'],
      department: 'Ophthalmology',
      specialization: 'Pediatric Ophthalmology',
      license_number: 'MD-12345',
    },
    {
      user_id: '3',
      email: 'nurse.jane@clinic.com',
      first_name: 'Jane',
      last_name: 'Johnson',
      role: 'nurse',
      organization: 'Community Health Clinic',
      phone: '+66-2-345-6789',
      location: 'Chiang Mai, Thailand',
      is_active: true,
      is_verified: true,
      last_login: '2025-08-28T08:45:00Z',
      created_at: '2025-03-10T00:00:00Z',
      updated_at: '2025-08-28T08:45:00Z',
      permissions: ['patient_management', 'screening'],
      department: 'Pediatrics',
    },
  ];

  const getMockStats = (): UserStats => ({
    totalUsers: 156,
    activeUsers: 142,
    adminUsers: 3,
    medicalUsers: 45,
    teacherUsers: 78,
    parentUsers: 30,
    verifiedUsers: 134,
    newUsersThisMonth: 12,
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon color="error" />;
      case 'doctor':
      case 'nurse':
        return <MedicalIcon color="primary" />;
      case 'teacher':
        return <TeacherIcon color="secondary" />;
      case 'parent':
        return <ParentIcon color="success" />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'doctor':
      case 'nurse':
        return 'primary';
      case 'teacher':
        return 'secondary';
      case 'parent':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
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
      const response = await fetch(`${baseUrl}/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUserData(); // Refresh data
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      toast.error('Error updating user status');
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

  const getUsersByRole = (role: string) => {
    return filteredUsers.filter(user => user.role === role);
  };

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
            Medical Portal User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all users of the medical portal (doctors, nurses, teachers, parents)
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUserData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* User Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 2 }}>
                    <PersonIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
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
                      {stats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
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
                    <AdminIcon color="error" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.adminUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admin Users
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
                    <MedicalIcon color="primary" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.medicalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Medical Users
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
                placeholder="Search users..."
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
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
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

      {/* User Management Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
              <Tab label="All Users" />
              <Tab label="Admin Users" />
              <Tab label="Medical Users" />
              <Tab label="Teachers" />
              <Tab label="Parents" />
            </Tabs>
          </Box>

          {/* User Table */}
          <Box sx={{ mt: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
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
                              label={user.role}
                              color={getRoleColor(user.role)}
                              size="small"
                            />
                          </Box>
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
                            <Tooltip title="Edit User">
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
          </Box>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create New User' : 
           dialogType === 'edit' ? 'Edit User' : 'User Details'}
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
              <Typography variant="body2">
                Role: {selectedUser.role} | Organization: {selectedUser.organization}
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
              Create User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;
