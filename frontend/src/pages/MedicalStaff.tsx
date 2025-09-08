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
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  LocalHospital as MedicalIcon,
  School as SchoolIcon,
  Home
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AvatarUpload from '../components/AvatarUpload';

interface MedicalStaff {
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

interface StaffStatistics {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  medical_staff: number;
  school_staff: number;
}

const MedicalStaff: React.FC = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const API_BASE = 'https://stardust.evep.my-firstcare.com/api/v1/medical-staff-management';

  // State management
  const [staff, setStaff] = useState<MedicalStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [statistics, setStatistics] = useState<StaffStatistics>({
    total_staff: 0,
    active_staff: 0,
    inactive_staff: 0,
    medical_staff: 0,
    school_staff: 0
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<MedicalStaff | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '',
    department: '',
    specialization: '',
    phone: '',
    license_number: '',
    qualifications: [] as string[],
    avatar: '',
    is_active: true
  });
  
  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Medical and school staff roles
  const MEDICAL_SCHOOL_ROLES = [
    { value: 'doctor', label: 'Doctor', category: 'medical' },
    { value: 'nurse', label: 'Nurse', category: 'medical' },
    { value: 'medical_staff', label: 'Medical Staff', category: 'medical' },
    { value: 'exclusive_hospital', label: 'Hospital Staff', category: 'medical' },
    { value: 'teacher', label: 'Teacher', category: 'school' },
    { value: 'school_admin', label: 'School Admin', category: 'school' },
    { value: 'school_staff', label: 'School Staff', category: 'school' }
  ];

  // Fetch staff data
  const fetchStaff = async () => {
    console.log('fetchStaff called - token:', token ? 'present' : 'missing');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (statusFilter !== '') params.append('is_active', statusFilter.toString());

      console.log('Fetching staff from:', `${API_BASE}/?${params}`);

      const response = await fetch(`${API_BASE}/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch staff response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('Staff data received:', data);

      setStaff(data.staff || []);
      setTotalPages(Math.ceil(data.total / 10));
      
      // Calculate statistics
      const stats = {
        total_staff: data.total,
        active_staff: data.staff?.filter((s: MedicalStaff) => s.is_active).length || 0,
        inactive_staff: data.staff?.filter((s: MedicalStaff) => !s.is_active).length || 0,
        medical_staff: data.staff?.filter((s: MedicalStaff) => ['doctor', 'nurse', 'medical_staff', 'exclusive_hospital'].includes(s.role)).length || 0,
        school_staff: data.staff?.filter((s: MedicalStaff) => ['teacher', 'school_admin', 'school_staff'].includes(s.role)).length || 0
      };
      setStatistics(stats);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Token refresh helper
  const ensureValidToken = async () => {
    // This would be implemented based on your auth context
    // For now, we'll assume the token is valid
    return token;
  };

  // Create staff
  const createStaff = async () => {
    try {
      console.log('Creating staff with data:', formData);
      console.log('Using token:', token ? 'present' : 'missing');
      
      // Validate required fields
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.role) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Create staff response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create staff: ${errorData}`);
      }

      const newStaff = await response.json();
      console.log('New staff created:', newStaff);

      setStaff(prevStaff => [newStaff, ...prevStaff]);
      setCreateDialogOpen(false);
      resetForm();
      
      setSnackbar({
        open: true,
        message: 'Staff member created successfully!',
        severity: 'success'
      });

      // Refresh data
      fetchStaff();
    } catch (err) {
      console.error('Error creating staff:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to create staff member',
        severity: 'error'
      });
    }
  };

  // Update staff
  const updateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department,
        specialization: formData.specialization,
        phone: formData.phone,
        license_number: formData.license_number,
        qualifications: formData.qualifications,
        avatar: formData.avatar,
        is_active: formData.is_active
      };

      const response = await fetch(`${API_BASE}/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update staff: ${errorData}`);
      }

      const updatedStaff = await response.json();
      
      setStaff(prevStaff => 
        prevStaff.map(s => s.id === selectedStaff.id ? updatedStaff : s)
      );
      
      setEditDialogOpen(false);
      setSelectedStaff(null);
      resetForm();
      
      setSnackbar({
        open: true,
        message: 'Staff member updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating staff:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update staff member',
        severity: 'error'
      });
    }
  };

  // Toggle staff status
  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await ensureValidToken();
      const endpoint = currentStatus ? `${API_BASE}/${staffId}` : `${API_BASE}/${staffId}/activate`;
      const method = currentStatus ? 'DELETE' : 'POST';
      
      console.log(`${method} ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to toggle status: ${errorData}`);
      }

      // Update local state
      setStaff(prevStaff => 
        prevStaff.map(s => 
          s.id === staffId ? { ...s, is_active: !currentStatus } : s
        )
      );

      setSnackbar({
        open: true,
        message: `Staff member ${currentStatus ? 'deactivated' : 'activated'} successfully!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error toggling staff status:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to toggle staff status',
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
      specialization: '',
      phone: '',
      license_number: '',
      qualifications: [],
      avatar: '',
      is_active: true
    });
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      doctor: 'error',
      nurse: 'primary',
      medical_staff: 'secondary',
      exclusive_hospital: 'info',
      teacher: 'success',
      school_admin: 'warning',
      school_staff: 'default'
    };
    return colors[role] || 'default';
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleObj = MEDICAL_SCHOOL_ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    if (['doctor', 'nurse', 'medical_staff', 'exclusive_hospital'].includes(role)) {
      return <MedicalIcon fontSize="small" />;
    }
    return <SchoolIcon fontSize="small" />;
  };

  // Effects
  useEffect(() => {
    console.log('MedicalStaff component mounted, token:', token ? 'present' : 'missing');
    fetchStaff();
  }, [token, page, searchTerm, roleFilter, departmentFilter, statusFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchStaff();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
    setPage(1);
  };

  console.log('MedicalStaff render - staff:', staff.length, 'loading:', loading);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Medical Staff Management
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Medical Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ ml: 'auto' }}
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Staff
                  </Typography>
                  <Typography variant="h4" component="div">
                    {statistics.total_staff}
                  </Typography>
                </Box>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Staff
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {statistics.active_staff}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Inactive Staff
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {statistics.inactive_staff}
                  </Typography>
                </Box>
                <BlockIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Medical Staff
                  </Typography>
                  <Typography variant="h4" component="div" color="primary.main">
                    {statistics.medical_staff}
                  </Typography>
                </Box>
                <MedicalIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    School Staff
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {statistics.school_staff}
                  </Typography>
                </Box>
                <SchoolIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, department..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {MEDICAL_SCHOOL_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                placeholder="Filter by department"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter === '' ? '' : statusFilter.toString()}
                  label="Status"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setStatusFilter('');
                    } else {
                      setStatusFilter(value === 'true');
                    }
                  }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{ minWidth: 100 }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStaff}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff && staff.length > 0 ? staff.map((member) => (
                  <TableRow key={member.id || `staff-${Math.random()}`}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          src={member.avatar} 
                          sx={{ width: 40, height: 40 }}
                          alt={`${member.first_name} ${member.last_name}`}
                        >
                          {!member.avatar && `${member.first_name?.[0] || 'S'}${member.last_name?.[0] || 'S'}`}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {member.first_name} {member.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(member.role)}
                        label={getRoleDisplayName(member.role)}
                        color={getRoleColor(member.role) as any}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {member.department || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {member.specialization || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {member.phone || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={member.is_active ? 'Active' : 'Inactive'}
                        color={member.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
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
                              setSelectedStaff(member);
                              setViewDialogOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Staff">
                          <IconButton 
                            size="medium"
                            sx={{ 
                              border: '1px solid #ccc',
                              '&:hover': { backgroundColor: 'warning.light' }
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedStaff(member);
                              setFormData({
                                email: member.email,
                                password: '',
                                first_name: member.first_name,
                                last_name: member.last_name,
                                role: member.role,
                                department: member.department || '',
                                specialization: member.specialization || '',
                                phone: member.phone || '',
                                license_number: member.license_number || '',
                                qualifications: member.qualifications || [],
                                avatar: member.avatar || '',
                                is_active: member.is_active
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={member.is_active ? "Deactivate Staff" : "Activate Staff"}>
                          <IconButton 
                            size="medium"
                            sx={{ 
                              border: '1px solid #ccc',
                              '&:hover': { backgroundColor: member.is_active ? 'error.light' : 'success.light' }
                            }}
                            color={member.is_active ? "error" : "success"}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleStaffStatus(member.id, member.is_active);
                            }}
                          >
                            {member.is_active ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No staff members found
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

      {/* Create Staff Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Avatar Upload Section */}
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
              <AvatarUpload
                currentAvatar={formData.avatar}
                userId="new-staff"
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
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {MEDICAL_SCHOOL_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
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
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
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
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={createStaff} variant="contained">Create Staff</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onClose={() => {
        setEditDialogOpen(false);
        setSelectedStaff(null);
        resetForm();
      }} maxWidth="md" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Avatar Upload Section */}
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
              <AvatarUpload
                currentAvatar={formData.avatar}
                userId={selectedStaff?.id || "edit-staff"}
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
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {MEDICAL_SCHOOL_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
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
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
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
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedStaff(null);
            resetForm();
          }}>Cancel</Button>
          <Button onClick={updateStaff} variant="contained">Update Staff</Button>
        </DialogActions>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => {
        setViewDialogOpen(false);
        setSelectedStaff(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Staff Member Details</DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                <Avatar
                  src={selectedStaff.avatar}
                  sx={{ width: 120, height: 120 }}
                  alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                >
                  {!selectedStaff.avatar && `${selectedStaff.first_name?.[0] || 'S'}${selectedStaff.last_name?.[0] || 'S'}`}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedStaff.first_name} {selectedStaff.last_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedStaff.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Typography variant="body1">{getRoleDisplayName(selectedStaff.role)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedStaff.department || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                <Typography variant="body1">{selectedStaff.specialization || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedStaff.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
                <Typography variant="body1">{selectedStaff.license_number || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedStaff.is_active ? 'Active' : 'Inactive'}
                  color={selectedStaff.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                <Typography variant="body1">
                  {selectedStaff.last_login ? new Date(selectedStaff.last_login).toLocaleDateString() : 'Never'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">{new Date(selectedStaff.created_at).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                <Typography variant="body1">{new Date(selectedStaff.updated_at).toLocaleDateString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedStaff(null);
          }}>Close</Button>
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

export default MedicalStaff;