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
  Breadcrumbs,
  Link,
  Pagination,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
      id={`geolocation-tabpanel-${index}`}
      aria-labelledby={`geolocation-tab-${index}`}
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

interface Province {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
  note?: string;
  countryId?: string;
  createdAt: string;
  modifiedAt: string;
}

interface District {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
  note?: string;
  provinceId: string;
  countryId?: string;
  createdAt: string;
  modifiedAt: string;
}

interface Subdistrict {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
  note?: string;
  provinceId: string;
  districtId: string;
  countryId?: string;
  createdAt: string;
  modifiedAt: string;
}

const GeolocationsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    note: '',
    provinceId: '',
    districtId: '',
    countryId: ''
  });

  const tabLabels = ['Provinces', 'Districts', 'Subdistricts'];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Reload data when filters or pagination change (for districts and subdistricts)
  useEffect(() => {
    if (activeTab === 1) { // Districts
      loadDistrictsPage();
    } else if (activeTab === 2) { // Subdistricts
      loadSubdistrictsPage();
    }
  }, [currentPage, searchTerm, statusFilter, provinceFilter, districtFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 0: // Provinces - Load all (small dataset ~77 records)
          const provincesData = await loadAllProvinces();
          setProvinces(provincesData);
          setTotalItems(provincesData.length);
          break;
        case 1: // Districts - Use server-side pagination
          await loadDistrictsPage();
          break;
        case 2: // Subdistricts - Use server-side pagination
          await loadSubdistrictsPage();
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProvinces = async () => {
    let allProvinces: any[] = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await unifiedApi.get(`/api/v1/master-data/provinces?skip=${skip}&limit=${limit}`);
      const provinces = response.data.provinces || [];
      allProvinces = [...allProvinces, ...provinces];
      
      hasMore = response.data.has_more || false;
      skip += limit;
    }

    return allProvinces;
  };

  const loadDistrictsPage = async () => {
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
      params.append('status', statusFilter);
    }
    if (provinceFilter) {
      params.append('province_id', provinceFilter);
    }
    
    const response = await unifiedApi.get(`/api/v1/master-data/districts?${params.toString()}`);
    setDistricts(response.data.districts || []);
    setTotalItems(response.data.total_count || 0);
  };

  const loadSubdistrictsPage = async () => {
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
      params.append('status', statusFilter);
    }
    if (provinceFilter) {
      params.append('province_id', provinceFilter);
    }
    if (districtFilter) {
      params.append('district_id', districtFilter);
    }
    
    const response = await unifiedApi.get(`/api/v1/master-data/subdistricts?${params.toString()}`);
    setSubdistricts(response.data.subdistricts || []);
    setTotalItems(response.data.total_count || 0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setCurrentPage(1); // Reset to first page when switching tabs
    setSearchTerm(''); // Clear search when switching tabs
    setStatusFilter('all'); // Reset status filter
    setProvinceFilter(''); // Reset province filter
    setDistrictFilter(''); // Reset district filter
  };

  // For provinces (small dataset), use client-side filtering
  const getFilteredProvinces = () => {
    let data = provinces;
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter((item: any) => {
        const name = typeof item.name === 'object' ? item.name.en : item.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      data = data.filter((item: any) => {
        if (statusFilter === 'active') return item.active === true;
        if (statusFilter === 'inactive') return item.active === false;
        return true;
      });
    }
    
    return data;
  };

  const getPaginatedProvinces = () => {
    const filteredData = getFilteredProvinces();
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
    setCurrentPage(1);
    // Data will be reloaded automatically by useEffect
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedItem(null);
    setFormData({
      name: '',
      active: true,
      note: '',
      provinceId: '',
      districtId: '',
      countryId: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setDialogMode('edit');
    setSelectedItem(item);
    setFormData({
      name: typeof item.name === 'object' ? item.name.en || '' : item.name || '',
      active: item.active !== undefined ? item.active : true,
      note: item.note || '',
      provinceId: item.provinceId || '',
      districtId: item.districtId || '',
      countryId: item.countryId || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = getDeleteEndpoint();
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
      const endpoint = getSaveEndpoint();
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

  const getDeleteEndpoint = () => {
    switch (activeTab) {
      case 0: return '/api/v1/master-data/provinces';
      case 1: return '/api/v1/master-data/districts';
      case 2: return '/api/v1/master-data/subdistricts';
      default: return '';
    }
  };

  const getSaveEndpoint = () => {
    switch (activeTab) {
      case 0: return '/api/v1/master-data/provinces';
      case 1: return '/api/v1/master-data/districts';
      case 2: return '/api/v1/master-data/subdistricts';
      default: return '';
    }
  };

  const getFormData = () => {
    const baseData = {
      name: formData.name,
      active: formData.active,
      note: formData.note || undefined,
      countryId: formData.countryId || undefined
    };

    switch (activeTab) {
      case 1: // Districts
        return { ...baseData, provinceId: formData.provinceId };
      case 2: // Subdistricts
        return { 
          ...baseData, 
          provinceId: formData.provinceId,
          districtId: formData.districtId
        };
      default: // Provinces
        return baseData;
    }
  };

  const renderTable = () => {
    // Use different data sources based on tab
    let data: any[];
    let filteredCount: number;
    
    if (activeTab === 0) {
      // Provinces - use client-side pagination
      data = getPaginatedProvinces();
      filteredCount = getFilteredProvinces().length;
    } else {
      // Districts and Subdistricts - use server-side pagination
      data = activeTab === 1 ? districts : subdistricts;
      filteredCount = totalItems;
    }
    
    const headers = getTableHeaders();

    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableCell key={header}>{header}</TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item: any) => (
              <TableRow key={item._id}>
                <TableCell>{typeof item.name === 'object' ? item.name.en : item.name}</TableCell>
                <TableCell>
                  <Chip
                    label={item.active ? 'Active' : 'Inactive'}
                    color={item.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                {activeTab > 0 && (
                  <TableCell>
                    {activeTab === 1 ? 
                      (() => {
                        const province = provinces.find(p => p._id === item.provinceId);
                        return province ? (typeof province.name === 'object' ? province.name.en : province.name) : 'Unknown';
                      })() :
                      (() => {
                        const district = districts.find(d => d._id === item.districtId);
                        return district ? (typeof district.name === 'object' ? district.name.en : district.name) : 'Unknown';
                      })()
                    }
                  </TableCell>
                )}
                {activeTab === 2 && (
                  <TableCell>
                    {(() => {
                      const province = provinces.find(p => p._id === item.provinceId);
                      return province ? (typeof province.name === 'object' ? province.name.en : province.name) : 'Unknown';
                    })()}
                  </TableCell>
                )}
                <TableCell>{item.note || '-'}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(item)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(item._id)}>
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

  const getTableHeaders = () => {
    const baseHeaders = ['Name', 'Status'];
    switch (activeTab) {
      case 1: // Districts
        return [...baseHeaders, 'Province', 'Note'];
      case 2: // Subdistricts
        return [...baseHeaders, 'District', 'Province', 'Note'];
      default: // Provinces
        return [...baseHeaders, 'Note'];
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          color="inherit"
          href="/master-data"
          onClick={(e) => {
            e.preventDefault();
            navigate('/master-data');
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Master Data
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Geolocations Management
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/master-data')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            Geolocations Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage provinces, districts, and subdistricts
          </Typography>
        </Box>
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
            <Card sx={{ mb: 3, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
              </Box>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Search by name..."
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
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      label="Status"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {activeTab > 0 && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Province</InputLabel>
                      <Select
                        value={provinceFilter}
                        onChange={(e) => {
                          setProvinceFilter(e.target.value);
                          if (activeTab === 2) setDistrictFilter(''); // Clear district filter when province changes
                        }}
                        label="Province"
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
                )}
                {activeTab === 2 && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>District</InputLabel>
                      <Select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        label="District"
                        disabled={!provinceFilter}
                      >
                        <MenuItem value="">All Districts</MenuItem>
                        {districts
                          .filter(d => d.provinceId === provinceFilter)
                          .map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                              {typeof district.name === 'object' ? district.name.en : district.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={1}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    fullWidth
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {label} ({activeTab === 0 ? getFilteredProvinces().length : totalItems} of {activeTab === 0 ? provinces.length : totalItems})
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
              renderTable()
            )}
          </TabPanel>
        ))}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create' : 'Edit'} {tabLabels[activeTab].slice(0, -1)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
              
              {activeTab > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Province</InputLabel>
                    <Select
                      value={formData.provinceId}
                      onChange={(e) => setFormData({ ...formData, provinceId: e.target.value })}
                    >
                      {provinces.map((province) => (
                        <MenuItem key={province._id} value={province._id}>
                          {typeof province.name === 'object' ? province.name.en : province.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {activeTab === 2 && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={formData.districtId}
                      onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
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
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
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

export default GeolocationsManagement;
