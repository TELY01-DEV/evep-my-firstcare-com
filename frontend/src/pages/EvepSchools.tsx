import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import unifiedApi from '../services/unifiedApi';
import GeographicSelector from '../components/GeographicSelector';
import provincesService from '../services/provincesService';
import districtsService from '../services/districtsService';
import subdistrictsService from '../services/subdistrictsService';
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
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

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
  const { t } = useLanguage();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');

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
    // Geographic IDs for cascading dropdowns
    provinceId: '',
    districtId: '',
    subdistrictId: '',
    phone: '',
    email: ''
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await unifiedApi.get('/api/v1/evep/schools');
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
      setSnackbar({ open: true, message: 'Failed to fetch schools', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenDialog = async (school?: School) => {
    if (school) {
      setEditingSchool(school);
      
      // Initialize geographic IDs based on address names
      let provinceId = '';
      let districtId = '';
      let subdistrictId = '';
      
      // Find province ID by name
      if (school.address.province) {
        try {
          const provincesResponse = await provincesService.getProvinces();
          const province = provincesResponse.provinces.find(p => p.name === school.address.province);
          if (province) {
            provinceId = province.id;
            
            // Find district ID by name and province
            if (school.address.district) {
              const districtsResponse = await districtsService.getDistrictsByProvince(provinceId);
              // Try exact match first, then try with "เขต" prefix
              let district = districtsResponse.districts.find(d => d.name === school.address.district);
              if (!district) {
                district = districtsResponse.districts.find(d => d.name === `เขต${school.address.district}`);
              }
              if (!district) {
                // Try removing "เขต" prefix from district names
                district = districtsResponse.districts.find(d => d.name.replace('เขต', '') === school.address.district);
              }
              
              if (district) {
                districtId = district.id;
                
                // Find subdistrict ID by name and district
                if (school.address.subdistrict) {
                  const subdistrictsResponse = await subdistrictsService.getSubdistrictsByDistrict(districtId);
                  // Try exact match first, then try with "แขวง" prefix
                  let subdistrict = subdistrictsResponse.subdistricts.find(s => s.name === school.address.subdistrict);
                  if (!subdistrict) {
                    subdistrict = subdistrictsResponse.subdistricts.find(s => s.name === `แขวง${school.address.subdistrict}`);
                  }
                  if (!subdistrict) {
                    // Try removing "แขวง" prefix from subdistrict names
                    subdistrict = subdistrictsResponse.subdistricts.find(s => s.name.replace('แขวง', '') === school.address.subdistrict);
                  }
                  
                  if (subdistrict) {
                    subdistrictId = subdistrict.id;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading geographic data:', error);
        }
      }
      
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
        provinceId,
        districtId,
        subdistrictId,
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
        provinceId: '',
        districtId: '',
        subdistrictId: '',
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
      // Filter out geographic IDs that are not part of the School model
      const schoolData = {
        school_code: formData.school_code,
        name: formData.name,
        type: formData.type,
        address: formData.address,
        phone: formData.phone,
        email: formData.email
      };

      if (editingSchool) {
        await unifiedApi.put(`/api/v1/evep/schools/${editingSchool.id}`, schoolData);
        setSnackbar({ open: true, message: 'School updated successfully', severity: 'success' });
      } else {
        await unifiedApi.post('/api/v1/evep/schools', schoolData);
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
        await unifiedApi.delete(`/api/v1/evep/schools/${schoolId}`);
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

  // Filter logic
  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      school.school_code?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      school.phone?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      school.email?.toLowerCase().includes(filterSearch.toLowerCase());
    
    const matchesType = filterType === 'all' || school.type === filterType;
    const matchesProvince = filterProvince === 'all' || school.address?.province === filterProvince;
    
    return matchesSearch && matchesType && matchesProvince;
  });

  const resetFilters = () => {
    setFilterSearch('');
    setFilterType('all');
    setFilterProvince('all');
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
            {t('evep_schools.subtitle')}
          </Typography>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.secondary"
          >
            <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('evep_schools.title')}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ mr: 1 }} />
          {t('evep_schools.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main', color: 'white' }}
        >
          Add School
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        {showFilters && (
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Search"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search schools..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="vocational">Vocational</MenuItem>
                    <MenuItem value="university">University</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Province</InputLabel>
                  <Select
                    value={filterProvince}
                    onChange={(e) => setFilterProvince(e.target.value)}
                    label="Province"
                  >
                    <MenuItem value="all">All Provinces</MenuItem>
                    {Array.from(new Set(schools.map(s => s.address.province).filter(Boolean))).map(province => (
                      <MenuItem key={province} value={province}>{province}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={resetFilters}
                  variant="outlined"
                  fullWidth
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Schools Grid */}
      <Grid container spacing={3}>
        {filteredSchools.map((school) => (
          <Grid item xs={12} sm={6} md={4} key={school.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {school.name}
                  </Typography>
                  <Chip 
                    label={school.type} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Code:</strong> {school.school_code}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {formatAddress(school.address)}
                  </Typography>
                </Box>
                
                {school.phone && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {school.phone}
                  </Typography>
                )}
                
                {school.email && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {school.email}
                  </Typography>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleView(school)}
                    color="primary"
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(school)}
                    color="secondary"
                    title="Edit School"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(school.id)}
                    color="error"
                    title="Delete School"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredSchools.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No schools found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filterSearch || filterType !== 'all' || filterProvince !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by adding your first school'
            }
          </Typography>
          {!filterSearch && filterType === 'all' && filterProvince === 'all' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add First School
            </Button>
          )}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchool ? 'Edit School' : 'Add New School'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Code"
                  value={formData.school_code}
                  onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Type"
                    required
                  >
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="vocational">Vocational</MenuItem>
                    <MenuItem value="university">University</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              
              {/* Address Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Address</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="House No."
                  value={formData.address.house_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, house_no: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Village No."
                  value={formData.address.village_no}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, village_no: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Soi"
                  value={formData.address.soi}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, soi: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Road"
                  value={formData.address.road}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, road: e.target.value }
                  })}
                />
              </Grid>
              {/* Geographic Selector */}
              <GeographicSelector
                provinceId={formData.provinceId}
                districtId={formData.districtId}
                subdistrictId={formData.subdistrictId}
                onProvinceChange={async (provinceId) => {
                  setFormData({ ...formData, provinceId });
                  // Update address province name
                  try {
                    const provincesResponse = await provincesService.getProvinces();
                    const province = provincesResponse.provinces.find(p => p.id === provinceId);
                    if (province) {
                      setFormData(prev => ({
                        ...prev,
                        provinceId,
                        address: { ...prev.address, province: province.name }
                      }));
                    }
                  } catch (error) {
                    console.error('Error updating province:', error);
                  }
                }}
                onDistrictChange={async (districtId) => {
                  setFormData({ ...formData, districtId });
                  // Update address district name
                  try {
                    const districtsResponse = await districtsService.getDistrictsByProvince(formData.provinceId);
                    const district = districtsResponse.districts.find(d => d.id === districtId);
                    if (district) {
                      // Remove "เขต" prefix for storage
                      const districtName = district.name.replace('เขต', '');
                      setFormData(prev => ({
                        ...prev,
                        districtId,
                        address: { ...prev.address, district: districtName }
                      }));
                    }
                  } catch (error) {
                    console.error('Error updating district:', error);
                  }
                }}
                onSubdistrictChange={async (subdistrictId) => {
                  setFormData({ ...formData, subdistrictId });
                  // Update address subdistrict name
                  try {
                    const subdistrictsResponse = await subdistrictsService.getSubdistrictsByDistrict(formData.districtId);
                    const subdistrict = subdistrictsResponse.subdistricts.find(s => s.id === subdistrictId);
                    if (subdistrict) {
                      // Remove "แขวง" prefix for storage
                      const subdistrictName = subdistrict.name.replace('แขวง', '');
                      setFormData(prev => ({
                        ...prev,
                        subdistrictId,
                        address: { ...prev.address, subdistrict: subdistrictName }
                      }));
                    }
                  } catch (error) {
                    console.error('Error updating subdistrict:', error);
                  }
                }}
                onZipcodeChange={(zipcode) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, postal_code: zipcode }
                })}
                required
                gridSize={{ province: 4, district: 4, subdistrict: 4 }}
              />
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.address.postal_code}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, postal_code: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSchool ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openDialog && !!viewingSchool} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1 }} />
            School Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingSchool && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">School Code</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingSchool.school_code}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip label={viewingSchool.type} size="small" color="primary" sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingSchool.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{formatAddress(viewingSchool.address)}</Typography>
                </Grid>
                {viewingSchool.phone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{viewingSchool.phone}</Typography>
                  </Grid>
                )}
                {viewingSchool.email && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{viewingSchool.email}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button 
            onClick={() => {
              setViewingSchool(null);
              handleOpenDialog(viewingSchool || undefined);
            }} 
            variant="contained"
          >
            Edit
          </Button>
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default EvepSchools;
