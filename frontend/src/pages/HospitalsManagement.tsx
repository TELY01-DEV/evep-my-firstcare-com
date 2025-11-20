import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete,
  Breadcrumbs,
  Link,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as HospitalIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Home,
  Dashboard,
  Search,
  FilterList,
  Clear
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import unifiedApi from '../services/unifiedApi';

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
      id={`hospital-tabpanel-${index}`}
      aria-labelledby={`hospital-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface HospitalType {
  _id: string;
  name: string;
  note?: string;
  pictures?: string[];
  createdAt: string;
  modifiedAt: string;
}

interface Hospital {
  _id: string;
  name: Array<{code: string; name: string}>;
  en_name: string;
  address?: string;
  phone?: string;
  email?: string;
  hospitalType?: string;
  provinceId?: string;
  districtId?: string;
  subDistrictId?: string;
  location?: any;
  pictures?: string[];
  visible: boolean;
  remark?: string;
  createdAt: string;
  modifiedAt: string;
  is_active?: boolean;
  is_deleted?: boolean;
  province_code?: number;
  district_code?: number;
  sub_district_code?: number;
  organizecode?: number;
  hospital_area_code?: string;
}

interface Province {
  _id: string;
  name: string | { en: string; th: string } | Array<{code: string; name: string}>;
  code?: number;
  en_name?: string;
}

interface District {
  _id: string;
  name: string | { en: string; th: string } | Array<{code: string; name: string}>;
  provinceId: string;
  code?: number;
  en_name?: string;
}

interface Subdistrict {
  _id: string;
  name: string | { en: string; th: string } | Array<{code: string; name: string}>;
  districtId: string;
  provinceId: string;
  code?: number;
  en_name?: string;
}

const HospitalsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [hospitalTypes, setHospitalTypes] = useState<HospitalType[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [hospitalTypeFilter, setHospitalTypeFilter] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    hospitalType: '',
    provinceId: '',
    districtId: '',
    subDistrictId: '',
    visible: true,
    remark: ''
  });

  const tabLabels = ['Hospital Types', 'Hospitals'];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Reload data when filters or pagination change (for hospitals)
  useEffect(() => {
    if (activeTab === 1) { // Hospitals
      loadHospitalsPage();
    }
  }, [currentPage, searchTerm, statusFilter, provinceFilter, districtFilter, hospitalTypeFilter, activeTab]);

  useEffect(() => {
    // Load reference data when needed
    if (activeTab === 1) {
      loadReferenceData();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 0: // Hospital Types - Load all (small dataset)
          const typesResponse = await unifiedApi.get('/api/v1/master-data/hospital-types');
          setHospitalTypes(typesResponse.data.hospital_types || []);
          setTotalItems(typesResponse.data.total_count || 0);
          break;
        case 1: // Hospitals - Use server-side pagination
          await loadHospitalsPage();
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadHospitalsPage = async () => {
    const skip = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    
    // Build query parameters
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    if (statusFilter !== 'all') {
      params.append('visible', statusFilter === 'visible' ? 'true' : 'false');
    }
    if (provinceFilter) {
      params.append('province_id', provinceFilter);
    }
    if (districtFilter) {
      params.append('district_id', districtFilter);
    }
    if (hospitalTypeFilter) {
      params.append('hospital_type_id', hospitalTypeFilter);
    }
    
    const response = await unifiedApi.get(`/api/v1/master-data/hospitals?${params.toString()}`);
    setHospitals(response.data.hospitals || []);
    setTotalItems(response.data.total_count || 0);
  };

  const loadReferenceData = async () => {
    try {
      const [provincesRes, districtsRes, subdistrictsRes] = await Promise.all([
        unifiedApi.get('/api/v1/master-data/provinces'),
        unifiedApi.get('/api/v1/master-data/districts'),
        unifiedApi.get('/api/v1/master-data/subdistricts')
      ]);

      setProvinces(provincesRes.data.provinces || []);
      setDistricts(districtsRes.data.districts || []);
      setSubdistricts(subdistrictsRes.data.subdistricts || []);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setCurrentPage(1); // Reset to first page when switching tabs
    setSearchTerm(''); // Clear search when switching tabs
    setStatusFilter('all'); // Reset status filter
    setProvinceFilter(''); // Reset province filter
    setDistrictFilter(''); // Reset district filter
    setHospitalTypeFilter(''); // Reset hospital type filter
  };

  // For hospital types (small dataset), use client-side filtering
  const getFilteredHospitalTypes = () => {
    let data = hospitalTypes;
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter((item: any) => {
        const name = typeof item.name === 'object' ? item.name.en : item.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return data;
  };

  const getPaginatedHospitalTypes = () => {
    const filteredData = getFilteredHospitalTypes();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProvinceFilter('');
    setDistrictFilter('');
    setHospitalTypeFilter('');
    setCurrentPage(1);
    // Data will be reloaded automatically by useEffect
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedItem(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      hospitalType: '',
      provinceId: '',
      districtId: '',
      subDistrictId: '',
      visible: true,
      remark: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setDialogMode('edit');
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      hospitalType: item.hospitalType || '',
      provinceId: item.provinceId || '',
      districtId: item.districtId || '',
      subDistrictId: item.subDistrictId || '',
      visible: item.visible !== undefined ? item.visible : true,
      remark: item.remark || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 0 ? '/api/v1/master-data/hospital-types' : '/api/v1/master-data/hospitals';
      await unifiedApi.delete(`${endpoint}/${id}`);
      setSuccess('Item deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 0 ? '/api/v1/master-data/hospital-types' : '/api/v1/master-data/hospitals';
      const data = getFormData();
      
      if (dialogMode === 'create') {
        await unifiedApi.post(endpoint, data);
        setSuccess('Item created successfully');
      } else {
        await unifiedApi.put(`${endpoint}/${selectedItem._id}`, data);
        setSuccess('Item updated successfully');
      }
      
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const getFormData = () => {
    if (activeTab === 0) {
      // Hospital Type
      return {
        name: formData.name,
        note: formData.remark || undefined
      };
    } else {
      // Hospital
      return {
        name: formData.name,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        hospitalType: formData.hospitalType || undefined,
        provinceId: formData.provinceId || undefined,
        districtId: formData.districtId || undefined,
        subDistrictId: formData.subDistrictId || undefined,
        visible: formData.visible,
        remark: formData.remark || undefined
      };
    }
  };

  const renderHospitalTypesTable = () => {
    const data = getPaginatedHospitalTypes();
    const filteredCount = getFilteredHospitalTypes().length;

    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((type) => (
                <TableRow key={type._id}>
                  <TableCell>{typeof type.name === 'object' ? (type.name as any).en : type.name}</TableCell>
                  <TableCell>{type.note || '-'}</TableCell>
                  <TableCell>{new Date(type.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(type)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(type._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {filteredCount > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredCount / itemsPerPage)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </>
    );
  };

  const renderHospitalsTable = () => {
    // For hospitals, use server-side pagination data
    const data = hospitals;
    const filteredCount = totalItems;

    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hospital Name</TableCell>
                <TableCell>Area/Org Code</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((hospital) => (
                <TableRow key={hospital._id}>
                  <TableCell>
                    {hospital.en_name || (hospital.name && hospital.name.length > 0 ? hospital.name[0].name : 'No Name')}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Hospitals don't have hospitalType field in the current API response
                      // Show hospital area code or organization code instead
                      if (hospital.hospital_area_code) {
                        return `Area: ${hospital.hospital_area_code}`;
                      }
                      if (hospital.organizecode) {
                        return `Org: ${hospital.organizecode}`;
                      }
                      return '-';
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Try to get location from province_code, district_code, sub_district_code
                      const locationParts = [];
                      
                      if (hospital.sub_district_code) {
                        const subdistrict = subdistricts.find(s => s.code === hospital.sub_district_code);
                        if (subdistrict) {
                          // Use en_name if available, otherwise get from name array
                          let subdistrictName = subdistrict.en_name;
                          if (!subdistrictName && Array.isArray(subdistrict.name) && subdistrict.name.length > 0) {
                            subdistrictName = subdistrict.name[0].name;
                          } else if (!subdistrictName && typeof subdistrict.name === 'object' && 'en' in subdistrict.name) {
                            subdistrictName = subdistrict.name.en;
                          } else if (!subdistrictName && typeof subdistrict.name === 'string') {
                            subdistrictName = subdistrict.name;
                          }
                          locationParts.push(subdistrictName || 'Unknown');
                        }
                      }
                      
                      if (hospital.district_code) {
                        const district = districts.find(d => d.code === hospital.district_code);
                        if (district) {
                          // Use en_name if available, otherwise get from name array
                          let districtName = district.en_name;
                          if (!districtName && Array.isArray(district.name) && district.name.length > 0) {
                            districtName = district.name[0].name;
                          } else if (!districtName && typeof district.name === 'object' && 'en' in district.name) {
                            districtName = district.name.en;
                          } else if (!districtName && typeof district.name === 'string') {
                            districtName = district.name;
                          }
                          locationParts.push(districtName || 'Unknown');
                        }
                      }
                      
                      if (hospital.province_code) {
                        const province = provinces.find(p => p.code === hospital.province_code);
                        if (province) {
                          // Use en_name if available, otherwise get from name array
                          let provinceName = province.en_name;
                          if (!provinceName && Array.isArray(province.name) && province.name.length > 0) {
                            provinceName = province.name[0].name;
                          } else if (!provinceName && typeof province.name === 'object' && 'en' in province.name) {
                            provinceName = province.name.en;
                          } else if (!provinceName && typeof province.name === 'string') {
                            provinceName = province.name;
                          }
                          locationParts.push(provinceName || 'Unknown');
                        }
                      }
                      
                      return locationParts.length > 0 ? locationParts.join(', ') : 
                        (hospital.hospital_area_code ? `Area: ${hospital.hospital_area_code}` : '-');
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const contactInfo = [];
                      if (hospital.phone) contactInfo.push(`Phone: ${hospital.phone}`);
                      if (hospital.email) contactInfo.push(`Email: ${hospital.email}`);
                      if (hospital.organizecode) contactInfo.push(`Org Code: ${hospital.organizecode}`);
                      if (hospital.hospital_area_code) contactInfo.push(`Area Code: ${hospital.hospital_area_code}`);
                      return contactInfo.length > 0 ? contactInfo.join(', ') : '-';
                    })()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={hospital.is_active ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={hospital.is_active ? 'Active' : 'Inactive'}
                      color={hospital.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(hospital)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(hospital._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {filteredCount > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredCount / itemsPerPage)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </>
    );
  };

  const renderForm = () => {
    if (activeTab === 0) {
      // Hospital Type Form
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Note"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      );
    } else {
      // Hospital Form
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hospital Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Hospital Type</InputLabel>
              <Select
                value={formData.hospitalType}
                onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
              >
                {hospitalTypes.map((type) => (
                  <MenuItem key={type._id} value={type._id}>
                    {typeof type.name === 'object' ? (type.name as any).en : type.name}
                  </MenuItem>
                ))}
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Province</InputLabel>
              <Select
                value={formData.provinceId}
                onChange={(e) => setFormData({ ...formData, provinceId: e.target.value, districtId: '', subDistrictId: '' })}
              >
                {provinces.map((province) => (
                  <MenuItem key={province._id} value={province._id}>
                    {province.en_name || 
                      (Array.isArray(province.name) && province.name.length > 0 ? province.name[0].name : 
                       typeof province.name === 'object' && 'en' in province.name ? province.name.en :
                       typeof province.name === 'string' ? province.name : 'Unknown')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>District</InputLabel>
              <Select
                value={formData.districtId}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value, subDistrictId: '' })}
                disabled={!formData.provinceId}
              >
                {districts
                  .filter(d => d.provinceId === formData.provinceId)
                  .map((district) => {
                    const displayName = typeof district.name === 'string' 
                      ? district.name 
                      : (district.name && typeof district.name === 'object' && !Array.isArray(district.name) && 'en' in district.name)
                        ? district.name.en
                        : String(district.name || '');
                    return (
                      <MenuItem key={district._id} value={district._id}>
                        {displayName}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Subdistrict</InputLabel>
              <Select
                value={formData.subDistrictId}
                onChange={(e) => setFormData({ ...formData, subDistrictId: e.target.value })}
                disabled={!formData.districtId}
              >
                {subdistricts
                  .filter(s => s.districtId === formData.districtId)
                  .map((subdistrict) => (
                    <MenuItem key={subdistrict._id} value={subdistrict._id}>
                      {subdistrict.en_name || 
                        (Array.isArray(subdistrict.name) && subdistrict.name.length > 0 ? subdistrict.name[0].name : 
                         typeof subdistrict.name === 'object' && 'en' in subdistrict.name ? subdistrict.name.en :
                         typeof subdistrict.name === 'string' ? subdistrict.name : 'Unknown')}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Remark"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                />
              }
              label="Visible"
            />
          </Grid>
        </Grid>
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          color="inherit"
          href="/dashboard/master-data"
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard/master-data');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Dashboard sx={{ mr: 0.5 }} fontSize="inherit" />
          Master Data
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <HospitalIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('hospitals.title')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('hospitals.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('hospitals.subtitle')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {tabLabels.map((label, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {/* Filters Section */}
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {activeTab === 1 && ( // Only show filters for Hospitals tab
                    <>
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="visible">Visible</MenuItem>
                            <MenuItem value="hidden">Hidden</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Province</InputLabel>
                          <Select
                            value={provinceFilter}
                            label="Province"
                            onChange={(e) => {
                              setProvinceFilter(e.target.value);
                              setDistrictFilter(''); // Reset district when province changes
                            }}
                          >
                            <MenuItem value="">All Provinces</MenuItem>
                            {provinces.map((province) => {
                              const displayName = typeof province.name === 'string' 
                                ? province.name 
                                : (province.name && typeof province.name === 'object' && !Array.isArray(province.name) && 'en' in province.name)
                                  ? province.name.en
                                  : String(province.name || '');
                              return (
                                <MenuItem key={province._id} value={province._id}>
                                  {displayName}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>District</InputLabel>
                          <Select
                            value={districtFilter}
                            label="District"
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            disabled={!provinceFilter}
                          >
                            <MenuItem value="">All Districts</MenuItem>
                            {districts
                              .filter(district => !provinceFilter || district.provinceId === provinceFilter)
                              .map((district) => (
                                <MenuItem key={district._id} value={district._id}>
                                  {district.en_name || 
                                    (Array.isArray(district.name) && district.name.length > 0 ? district.name[0].name : 
                                     typeof district.name === 'object' && 'en' in district.name ? district.name.en :
                                     typeof district.name === 'string' ? district.name : 'Unknown')}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Hospital Type</InputLabel>
                          <Select
                            value={hospitalTypeFilter}
                            label="Hospital Type"
                            onChange={(e) => setHospitalTypeFilter(e.target.value)}
                          >
                            <MenuItem value="">All Types</MenuItem>
                            {hospitalTypes.map((type) => (
                              <MenuItem key={type._id} value={type._id}>
                                {typeof type.name === 'object' ? (type.name as any).en : type.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12} sm={6} md={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Clear />}
                      onClick={clearFilters}
                      size="small"
                      fullWidth
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {label} ({activeTab === 0 ? getFilteredHospitalTypes().length : totalItems} of {activeTab === 0 ? hospitalTypes.length : totalItems})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                disabled={loading}
              >
                Add {label.slice(0, -1)}
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              activeTab === 0 ? renderHospitalTypesTable() : renderHospitalsTable()
            )}
          </TabPanel>
        ))}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create' : 'Edit'} {tabLabels[activeTab].slice(0, -1)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {renderForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HospitalsManagement;
