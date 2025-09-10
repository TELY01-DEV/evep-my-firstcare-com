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
  name: string;
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
}

interface Province {
  _id: string;
  name: string | { en: string; th: string };
}

interface District {
  _id: string;
  name: string | { en: string; th: string };
  provinceId: string;
}

interface Subdistrict {
  _id: string;
  name: string | { en: string; th: string };
  districtId: string;
  provinceId: string;
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
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((hospital) => (
                <TableRow key={hospital._id}>
                  <TableCell>{typeof hospital.name === 'object' ? (hospital.name as any).en : hospital.name}</TableCell>
                  <TableCell>
                    {(() => {
                      const type = hospitalTypes.find(t => t._id === hospital.hospitalType);
                      return type ? (typeof type.name === 'object' ? (type.name as any).en : type.name) : '-';
                    })()}
                  </TableCell>
                  <TableCell>
                    {[
                      (() => {
                        const subdistrict = subdistricts.find(s => s._id === hospital.subDistrictId);
                        return subdistrict ? (typeof subdistrict.name === 'object' ? subdistrict.name.en : subdistrict.name) : null;
                      })(),
                      (() => {
                        const district = districts.find(d => d._id === hospital.districtId);
                        return district ? (typeof district.name === 'object' ? district.name.en : district.name) : null;
                      })(),
                      (() => {
                        const province = provinces.find(p => p._id === hospital.provinceId);
                        return province ? (typeof province.name === 'object' ? province.name.en : province.name) : null;
                      })()
                    ].filter(Boolean).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {hospital.phone && <div>{hospital.phone}</div>}
                    {hospital.email && <div>{hospital.email}</div>}
                    {!hospital.phone && !hospital.email && '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={hospital.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={hospital.visible ? 'Visible' : 'Hidden'}
                      color={hospital.visible ? 'success' : 'default'}
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
                    {typeof province.name === 'object' ? province.name.en : province.name}
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
                  .map((district) => (
                    <MenuItem key={district._id} value={district._id}>
                      {typeof district.name === 'object' ? district.name.en : district.name}
                    </MenuItem>
                  ))}
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
                      {typeof subdistrict.name === 'object' ? subdistrict.name.en : subdistrict.name}
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
                            {provinces.map((province) => (
                              <MenuItem key={province._id} value={province._id}>
                                {typeof province.name === 'object' ? province.name.en : province.name}
                              </MenuItem>
                            ))}
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
                                  {typeof district.name === 'object' ? district.name.en : district.name}
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
