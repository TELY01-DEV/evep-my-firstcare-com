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
  Fab,
  Breadcrumbs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
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

interface Teacher {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  cid: string;
  birth_date: string;
  gender: string;
  phone: string;
  email: string;
  school: string;
  position?: string;
  school_year?: string;
  work_address?: Address;
  created_at: string;
  updated_at: string;
}

const EvepTeachers: React.FC = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    cid: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    school: '',
    position: '',
    school_year: '',
    work_address: {
      house_no: '',
      village_no: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      postal_code: ''
    }
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8014/api/v1/evep/teachers', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      } else {
        throw new Error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setSnackbar({ open: true, message: 'Error fetching teachers', severity: 'error' });
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        title: teacher.title || '',
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        cid: teacher.cid,
        birth_date: teacher.birth_date,
        gender: teacher.gender,
        phone: teacher.phone,
        email: teacher.email,
        school: teacher.school,
        position: teacher.position || '',
        school_year: teacher.school_year || '',
        work_address: {
          house_no: teacher.work_address?.house_no || '',
          village_no: teacher.work_address?.village_no || '',
          soi: teacher.work_address?.soi || '',
          road: teacher.work_address?.road || '',
          subdistrict: teacher.work_address?.subdistrict || '',
          district: teacher.work_address?.district || '',
          province: teacher.work_address?.province || '',
          postal_code: teacher.work_address?.postal_code || ''
        }
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        title: '',
        first_name: '',
        last_name: '',
        cid: '',
        birth_date: '',
        gender: '',
        phone: '',
        email: '',
        school: '',
        position: '',
        school_year: '',
        work_address: {
          house_no: '',
          village_no: '',
          soi: '',
          road: '',
          subdistrict: '',
          district: '',
          province: '',
          postal_code: ''
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
    setViewingTeacher(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTeacher) {
        const response = await fetch(`http://localhost:8014/api/v1/evep/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Teacher updated successfully', severity: 'success' });
        } else {
          throw new Error('Failed to update teacher');
        }
      } else {
        const response = await fetch('http://localhost:8014/api/v1/evep/teachers', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Teacher created successfully', severity: 'success' });
        } else {
          throw new Error('Failed to create teacher');
        }
      }
      handleCloseDialog();
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      setSnackbar({ open: true, message: 'Error saving teacher', severity: 'error' });
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await fetch(`http://localhost:8014/api/v1/evep/teachers/${teacherId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Teacher deleted successfully', severity: 'success' });
          fetchTeachers();
        } else {
          throw new Error('Failed to delete teacher');
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        setSnackbar({ open: true, message: 'Error deleting teacher', severity: 'error' });
      }
    }
  };

  const handleView = (teacher: Teacher) => {
    setViewingTeacher(teacher);
    setOpenDialog(true);
  };

  const formatAddress = (address?: Address) => {
    if (!address) {
      return 'Address not available';
    }
    const parts = [
      address.house_no,
      address.village_no,
      address.soi,
      address.road,
      address.subdistrict,
      address.district,
      address.province
    ].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  };

  // Filter logic
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.first_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      teacher.last_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      teacher.cid.toLowerCase().includes(filterSearch.toLowerCase()) ||
      teacher.phone?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(filterSearch.toLowerCase());
    
    const matchesSchool = filterSchool === 'all' || teacher.school === filterSchool;
    const matchesGender = filterGender === 'all' || teacher.gender === filterGender;
    
    return matchesSearch && matchesSchool && matchesGender;
  });

  const resetFilters = () => {
    setFilterSearch('');
    setFilterSchool('all');
    setFilterGender('all');
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
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon fontSize="small" />}>
          <Typography
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="text.primary"
            onClick={() => window.location.href = '/dashboard'}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Typography>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            School Management
          </Typography>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.secondary"
          >
            <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Teachers
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Teachers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage teacher information and records
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Teacher
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {teachers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Teachers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {teachers.filter(t => t.gender === 'M').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Male Teachers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {teachers.filter(t => t.gender === 'F').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Female Teachers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {new Set(teachers.map(t => t.school)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schools
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Teachers Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Teachers List
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>

          {/* Filter Section */}
          {showFilters && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Name, CID, Phone, Email..."
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>School</InputLabel>
                    <Select
                      value={filterSchool}
                      onChange={(e) => setFilterSchool(e.target.value)}
                      label="School"
                    >
                      <MenuItem value="all">All Schools</MenuItem>
                      {Array.from(new Set(teachers.map(t => t.school))).map(school => (
                        <MenuItem key={school} value={school}>{school}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="1">Male</MenuItem>
                      <MenuItem value="2">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={resetFilters}
                    size="small"
                    fullWidth
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          <TableContainer>
            <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Work Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {teacher.first_name} {teacher.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.gender === 'M' ? 'Male' : 'Female'} • {new Date(teacher.birth_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      {teacher.school}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={teacher.position || 'Teacher'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{teacher.phone}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{teacher.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {formatAddress(teacher.work_address)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(teacher)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(teacher)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(teacher.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </CardContent>
      </Card>

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
          {viewingTeacher ? 'View Teacher Details' : editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        </DialogTitle>
        <DialogContent>
          {viewingTeacher ? (
            <Box>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography><strong>Name:</strong> {viewingTeacher.first_name} {viewingTeacher.last_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>CID:</strong> {viewingTeacher.cid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Birth Date:</strong> {new Date(viewingTeacher.birth_date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Gender:</strong> {viewingTeacher.gender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Phone:</strong> {viewingTeacher.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Email:</strong> {viewingTeacher.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>School:</strong> {viewingTeacher.school}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Position:</strong> {viewingTeacher.position || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>School Year:</strong> {viewingTeacher.school_year || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Work Address</Typography>
              <Typography gutterBottom>{formatAddress(viewingTeacher.work_address)}</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Title</InputLabel>
                  <Select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    label="Title"
                  >
                    <MenuItem value="นาย">นาย (Mr.)</MenuItem>
                    <MenuItem value="นาง">นาง (Mrs.)</MenuItem>
                    <MenuItem value="นางสาว">นางสาว (Miss)</MenuItem>
                    <MenuItem value="ดร.">ดร. (Dr.)</MenuItem>
                    <MenuItem value="ผศ.">ผศ. (Asst. Prof.)</MenuItem>
                    <MenuItem value="รศ.">รศ. (Assoc. Prof.)</MenuItem>
                    <MenuItem value="ศ.">ศ. (Prof.)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CID"
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Birth Date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    label="Gender"
                  >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
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
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="School"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="School Year"
                  value={formData.school_year}
                  onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                  margin="normal"
                />
              </Grid>

              {/* Work Address Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Work Address</Typography>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="House No."
                  value={formData.work_address.house_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, house_no: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Village No."
                  value={formData.work_address.village_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, village_no: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Soi"
                  value={formData.work_address.soi}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, soi: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Road"
                  value={formData.work_address.road}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, road: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Subdistrict"
                  value={formData.work_address.subdistrict}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, subdistrict: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="District"
                  value={formData.work_address.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, district: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Province"
                  value={formData.work_address.province}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, province: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.work_address.postal_code}
                  onChange={(e) => setFormData({
                    ...formData,
                    work_address: { ...formData.work_address, postal_code: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewingTeacher ? 'Close' : 'Cancel'}
          </Button>
          {!viewingTeacher && (
            <Button onClick={handleSubmit} variant="contained">
              {editingTeacher ? 'Update' : 'Create'}
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

export default EvepTeachers;
