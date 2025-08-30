import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Add,
  Edit,
  Delete,
  Visibility,
  LocalHospital,
  School,
  Assessment,
  AdminPanelSettings,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface MedicalStaff {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'doctor' | 'nurse' | 'technician' | 'coordinator';
  specialization?: string;
  license_number?: string;
  phone: string;
  status: 'active' | 'inactive' | 'on_leave';
  assigned_schools: string[];
  total_screenings: number;
  last_active: string;
  created_at: string;
}

const MedicalStaff: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<MedicalStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<MedicalStaff | null>(null);

  useEffect(() => {
    fetchMedicalStaff();
  }, []);

  const fetchMedicalStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
              const response = await fetch('http://localhost:8013/api/v1/medical_staff/staff/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        console.error('API returned status:', response.status);
        setStaff([]);
      }
    } catch (err) {
      console.error('Failed to fetch medical staff:', err);
      setError('Failed to fetch medical staff data');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <LocalHospital />;
      case 'nurse':
        return <Person />;
      case 'technician':
        return <Assessment />;
      case 'coordinator':
        return <AdminPanelSettings />;
      default:
        return <Person />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on_leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'inactive':
        return <Warning />;
      case 'on_leave':
        return <Info />;
      default:
        return <Info />;
    }
  };

  const handleEditStaff = (staffMember: MedicalStaff) => {
    setEditingStaff(staffMember);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStaff(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Medical Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage medical staff, roles, and assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Staff
              </Typography>
              <Typography variant="h4">
                {staff.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Staff
              </Typography>
              <Typography variant="h4">
                {staff.filter(s => s.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Screenings
              </Typography>
              <Typography variant="h4">
                {staff.reduce((sum, s) => sum + s.total_screenings, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                On Leave
              </Typography>
              <Typography variant="h4">
                {staff.filter(s => s.status === 'on_leave').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Staff Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Medical Staff Directory
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Schools</TableCell>
                  <TableCell>Screenings</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((staffMember) => (
                  <TableRow key={staffMember._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getRoleIcon(staffMember.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {staffMember.first_name} {staffMember.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {staffMember.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(staffMember.role)}
                        label={staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {staffMember.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(staffMember.status)}
                        label={staffMember.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(staffMember.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {staffMember.assigned_schools.map((school, index) => (
                          <Chip
                            key={index}
                            label={school}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {staffMember.total_screenings}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(staffMember.last_active).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Staff">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditStaff(staffMember)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Staff">
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                defaultValue={editingStaff?.first_name || ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                defaultValue={editingStaff?.last_name || ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                defaultValue={editingStaff?.email || ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                defaultValue={editingStaff?.phone || ''}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  defaultValue={editingStaff?.role || 'nurse'}
                  label="Role"
                >
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="coordinator">Coordinator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  defaultValue={editingStaff?.status || 'active'}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {editingStaff?.role === 'doctor' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Specialization"
                  defaultValue={editingStaff?.specialization || ''}
                />
              </Grid>
            )}
            {editingStaff?.role === 'doctor' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="License Number"
                  defaultValue={editingStaff?.license_number || ''}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained">
            {editingStaff ? 'Update' : 'Add'} Staff Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalStaff;
