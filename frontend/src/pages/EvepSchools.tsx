import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Address {
  house_no?: string;
  village_no?: string;
  soi?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postal_code?: string;
}

interface School {
  id: string;
  school_code: string;
  name: string;
  type: string;
  address: Address;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

const EvepSchools: React.FC = () => {
  const { token } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    school_code: '',
    name: '',
    type: '',
    address: {
      house_no: '',
      village_no: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      postal_code: ''
    },
    phone: '',
    email: ''
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/evep/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSnackbar({ open: true, message: 'Error fetching schools', severity: 'error' });
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenDialog = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_code: school.school_code,
        name: school.name,
        type: school.type,
        address: {
          house_no: school.address.house_no || '',
          village_no: school.address.village_no || '',
          soi: school.address.soi || '',
          road: school.address.road || '',
          subdistrict: school.address.subdistrict || '',
          district: school.address.district || '',
          province: school.address.province || '',
          postal_code: school.address.postal_code || ''
        },
        phone: school.phone || '',
        email: school.email || ''
      });
    } else {
      setEditingSchool(null);
      setFormData({
        school_code: '',
        name: '',
        type: '',
        address: {
          house_no: '',
          village_no: '',
          soi: '',
          road: '',
          subdistrict: '',
          district: '',
          province: '',
          postal_code: ''
        },
        phone: '',
        email: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSchool(null);
    setViewingSchool(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingSchool) {
        await axios.put(`/api/v1/evep/schools/${editingSchool.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'School updated successfully', severity: 'success' });
      } else {
        await axios.post('/api/v1/evep/schools', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'School created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
      setSnackbar({ open: true, message: 'Error saving school', severity: 'error' });
    }
  };

  const handleDelete = async (schoolId: string) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await axios.delete(`/api/v1/evep/schools/${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'School deleted successfully', severity: 'success' });
        fetchSchools();
      } catch (error) {
        console.error('Error deleting school:', error);
        setSnackbar({ open: true, message: 'Error deleting school', severity: 'error' });
      }
    }
  };

  const handleView = (school: School) => {
    setViewingSchool(school);
    setOpenDialog(true);
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.house_no,
      address.village_no,
      address.soi,
      address.road,
      address.subdistrict,
      address.district,
      address.province
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Schools Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage school information and records
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{schools.length}</Typography>
              <Typography variant="body2">Total Schools</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {schools.filter(s => s.type === 'ประถมศึกษา').length}
              </Typography>
              <Typography variant="body2">Primary Schools</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {schools.filter(s => s.type === 'มัธยมศึกษา').length}
              </Typography>
              <Typography variant="body2">Secondary Schools</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {schools.filter(s => s.type !== 'ประถมศึกษา' && s.type !== 'มัธยมศึกษา').length}
              </Typography>
              <Typography variant="body2">Other Schools</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schools Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>School</TableCell>
                <TableCell>School Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {school.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {school.school_code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{school.school_code}</TableCell>
                  <TableCell>
                    <Chip
                      label={school.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {school.phone && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{school.phone}</Typography>
                        </Box>
                      )}
                      {school.email && (
                        <Box display="flex" alignItems="center">
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{school.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {formatAddress(school.address)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(school)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(school)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(school.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewingSchool ? 'View School Details' : editingSchool ? 'Edit School' : 'Add New School'}
        </DialogTitle>
        <DialogContent>
          {viewingSchool ? (
            <Box>
              <Typography variant="h6" gutterBottom>School Information</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography><strong>Name:</strong> {viewingSchool.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>School Code:</strong> {viewingSchool.school_code}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Type:</strong> {viewingSchool.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Phone:</strong> {viewingSchool.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Email:</strong> {viewingSchool.email || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Address</Typography>
              <Typography gutterBottom>{formatAddress(viewingSchool.address)}</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="School Code"
                  value={formData.school_code}
                  onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="School Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>School Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="School Type"
                  >
                    <MenuItem value="ประถมศึกษา">ประถมศึกษา (Primary)</MenuItem>
                    <MenuItem value="มัธยมศึกษา">มัธยมศึกษา (Secondary)</MenuItem>
                    <MenuItem value="อนุบาล">อนุบาล (Kindergarten)</MenuItem>
                    <MenuItem value="โรงเรียนเอกชน">โรงเรียนเอกชน (Private School)</MenuItem>
                    <MenuItem value="โรงเรียนนานาชาติ">โรงเรียนนานาชาติ (International School)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  margin="normal"
                />
              </Grid>

              {/* Address Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Address</Typography>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="House No."
                  value={formData.address.house_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, house_no: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Village No."
                  value={formData.address.village_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, village_no: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Soi"
                  value={formData.address.soi}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, soi: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Road"
                  value={formData.address.road}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, road: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Subdistrict"
                  value={formData.address.subdistrict}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, subdistrict: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="District"
                  value={formData.address.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, district: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Province"
                  value={formData.address.province}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, province: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.address.postal_code}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, postal_code: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewingSchool ? 'Close' : 'Cancel'}
          </Button>
          {!viewingSchool && (
            <Button onClick={handleSubmit} variant="contained">
              {editingSchool ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvepSchools;
