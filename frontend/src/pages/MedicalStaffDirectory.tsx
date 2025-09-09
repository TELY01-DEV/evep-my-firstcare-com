import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocalHospital as MedicalIcon,
  School as SchoolIcon,
  Home,
  Group as GroupIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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

const MedicalStaffDirectory: React.FC = () => {
  const { token } = useAuth();
  const API_BASE = `${process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com'}/api/v1/medical-staff-management`;

  // State management
  const [staff, setStaff] = useState<MedicalStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

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
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50', // Get more for directory view
        is_active: 'true' // Only show active staff in directory
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`${API_BASE}/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      setStaff(data.staff || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleObj = MEDICAL_SCHOOL_ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
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

  // Get role icon
  const getRoleIcon = (role: string) => {
    if (['doctor', 'nurse', 'medical_staff', 'exclusive_hospital'].includes(role)) {
      return <MedicalIcon fontSize="small" />;
    }
    return <SchoolIcon fontSize="small" />;
  };

  // Effects
  useEffect(() => {
    fetchStaff();
  }, [token, searchTerm, roleFilter, departmentFilter]);

  // Handle search
  const handleSearch = () => {
    fetchStaff();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setDepartmentFilter('');
  };

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
          Staff Directory
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Medical Staff Directory
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Browse and search our medical and school staff members
          </Typography>
        </Box>
        <Button
          variant="outlined"
          href="/dashboard/medical-staff/management"
          sx={{ ml: 'auto' }}
        >
          Manage Staff
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Staff"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, department..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
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
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                placeholder="Filter by department"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
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
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Directory */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {staff && staff.length > 0 ? staff.map((member) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Avatar and Name */}
                  <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    <Avatar 
                      src={member.avatar} 
                      sx={{ width: 80, height: 80, mb: 1 }}
                      alt={`${member.first_name} ${member.last_name}`}
                    >
                      {!member.avatar && `${member.first_name?.[0] || 'S'}${member.last_name?.[0] || 'S'}`}
                    </Avatar>
                    <Typography variant="h6" component="h2" textAlign="center" fontWeight="bold">
                      {member.first_name} {member.last_name}
                    </Typography>
                    <Chip
                      icon={getRoleIcon(member.role)}
                      label={getRoleDisplayName(member.role)}
                      color={getRoleColor(member.role) as any}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Contact Information */}
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {member.email}
                      </Typography>
                    </Box>
                    
                    {member.phone && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {member.phone}
                        </Typography>
                      </Box>
                    )}

                    {member.department && (
                      <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Department:</strong> {member.department}
                        </Typography>
                      </Box>
                    )}

                    {member.specialization && (
                      <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Specialization:</strong> {member.specialization}
                        </Typography>
                      </Box>
                    )}

                    {member.license_number && (
                      <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>License:</strong> {member.license_number}
                        </Typography>
                      </Box>
                    )}

                    {member.qualifications && member.qualifications.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>Qualifications:</strong>
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {member.qualifications.slice(0, 2).map((qual, index) => (
                            <Chip
                              key={index}
                              label={qual}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {member.qualifications.length > 2 && (
                            <Chip
                              label={`+${member.qualifications.length - 2} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No staff members found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search criteria or filters
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Summary */}
      {staff && staff.length > 0 && (
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Showing {staff.length} active staff members
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MedicalStaffDirectory;

