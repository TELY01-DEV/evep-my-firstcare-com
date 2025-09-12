import React, { useState, useEffect } from 'react';
import GeographicSelector from '../components/GeographicSelector';
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuthenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

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

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface Parent {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  cid: string;
  birth_date: string;
  gender: string;
  phone: string;
  email?: string;
  relation: string;
  occupation?: string;
  profile_photo?: string;
  address: Address;
  emergency_contact: EmergencyContact;
  created_at: string;
  updated_at: string;
}

const EvepParents: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const authenticatedFetch = useAuthenticatedFetch();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [viewingParent, setViewingParent] = useState<Parent | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRelation, setFilterRelation] = useState('all');
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
    relation: '',
    occupation: '',
    profile_photo: '',
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
    emergency_contact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(API_ENDPOINTS.EVEP_PARENTS);
      if (response.ok) {
        const data = await response.json();
        setParents(data.parents || []);
      } else {
        throw new Error('Failed to fetch parents');
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
      setSnackbar({ open: true, message: 'Error fetching parents', severity: 'error' });
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleOpenDialog = (parent?: Parent) => {
    if (parent) {
      setEditingParent(parent);
      setFormData({
        title: parent.title || '',
        first_name: parent.first_name,
        last_name: parent.last_name,
        cid: parent.cid,
        birth_date: parent.birth_date,
        gender: parent.gender,
        phone: parent.phone,
        email: parent.email || '',
        relation: parent.relation,
        occupation: parent.occupation || '',
        profile_photo: parent.profile_photo || '',
        address: {
          house_no: parent.address?.house_no || '',
          village_no: parent.address?.village_no || '',
          soi: parent.address?.soi || '',
          road: parent.address?.road || '',
          subdistrict: parent.address?.subdistrict || '',
          district: parent.address?.district || '',
          province: parent.address?.province || '',
          postal_code: parent.address?.postal_code || ''
        },
        emergency_contact: {
          name: parent.emergency_contact?.name || '',
          phone: parent.emergency_contact?.phone || '',
          relation: parent.emergency_contact?.relation || ''
        },
        provinceId: '',
        districtId: '',
        subdistrictId: ''
      });
    } else {
      setEditingParent(null);
      setFormData({
        title: '',
        first_name: '',
        last_name: '',
        cid: '',
        birth_date: '',
        gender: '',
        phone: '',
        email: '',
        relation: '',
        occupation: '',
        profile_photo: '',
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
        emergency_contact: {
          name: '',
          phone: '',
          relation: ''
        },
        provinceId: '',
        districtId: '',
        subdistrictId: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingParent(null);
    setViewingParent(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingParent) {
        const response = await fetch(`${API_ENDPOINTS.EVEP_PARENTS}/${editingParent.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Parent updated successfully', severity: 'success' });
        } else {
          throw new Error('Failed to update parent');
        }
      } else {
        const response = await fetch(API_ENDPOINTS.EVEP_PARENTS, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Parent created successfully', severity: 'success' });
        } else {
          throw new Error('Failed to create parent');
        }
      }
      handleCloseDialog();
      fetchParents();
    } catch (error) {
      console.error('Error saving parent:', error);
      setSnackbar({ open: true, message: 'Error saving parent', severity: 'error' });
    }
  };

  const handleDelete = async (parentId: string) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.EVEP_PARENTS}/${parentId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setSnackbar({ open: true, message: 'Parent deleted successfully', severity: 'success' });
          fetchParents();
        } else {
          throw new Error('Failed to delete parent');
        }
      } catch (error) {
        console.error('Error deleting parent:', error);
        setSnackbar({ open: true, message: 'Error deleting parent', severity: 'error' });
      }
    }
  };

  const handleView = (parent: Parent) => {
    setViewingParent(parent);
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
  const filteredParents = parents.filter(parent => {
    const matchesSearch = 
      parent.first_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      parent.last_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      parent.cid.toLowerCase().includes(filterSearch.toLowerCase()) ||
      parent.phone.toLowerCase().includes(filterSearch.toLowerCase());
    
    const matchesRelation = filterRelation === 'all' || parent.relation === filterRelation;
    const matchesGender = filterGender === 'all' || parent.gender === filterGender;
    
    return matchesSearch && matchesRelation && matchesGender;
  });

  const resetFilters = () => {
    setFilterSearch('');
    setFilterRelation('all');
    setFilterGender('all');
  };

  const getIncomeLevelColor = (level?: string) => {
    switch (level) {
      case 'low': return 'error';
      case 'middle': return 'warning';
      case 'high': return 'success';
      default: return 'default';
    }
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
            <GroupIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('evep_parents.title')}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('evep_parents.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('evep_parents.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Parent
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {parents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('evep_parents.total_parents')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {parents.filter(p => p.relation === 'มารดา').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mothers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {parents.filter(p => p.relation === 'บิดา').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fathers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {parents.filter(p => p.relation !== 'มารดา' && p.relation !== 'บิดา').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Other Guardians
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Parents Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {t('evep_parents.parents_list')}
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
                    placeholder="Name, CID, Phone..."
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Relation</InputLabel>
                    <Select
                      value={filterRelation}
                      onChange={(e) => setFilterRelation(e.target.value)}
                      label="Relation"
                    >
                      <MenuItem value="all">All Relations</MenuItem>
                      {Array.from(new Set(parents.map(p => p.relation))).map(relation => (
                        <MenuItem key={relation} value={relation}>{relation}</MenuItem>
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
                <TableCell>Photo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>CID</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Relation</TableCell>
                <TableCell>Occupation</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParents.map((parent) => (
                <TableRow key={parent.id} hover>
                  <TableCell>
                    {parent.profile_photo ? (
                      <img 
                        src={parent.profile_photo} 
                        alt="Profile" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          border: '1px solid #ddd'
                        }} 
                      />
                    ) : (
                      <PersonIcon sx={{ color: 'primary.main' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {parent.first_name} {parent.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {parent.gender === '1' ? 'Male' : parent.gender === '2' ? 'Female' : parent.gender}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{parent.cid}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      {parent.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={parent.relation}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{parent.occupation || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {formatAddress(parent.address)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(parent)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(parent)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(parent.id)}>
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
          {viewingParent ? 'View Parent Details' : editingParent ? 'Edit Parent' : 'Add New Parent'}
        </DialogTitle>
        <DialogContent>
          {viewingParent ? (
            <Box>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography><strong>Name:</strong> {viewingParent.first_name} {viewingParent.last_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>CID:</strong> {viewingParent.cid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Birth Date:</strong> {new Date(viewingParent.birth_date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Gender:</strong> {viewingParent.gender === '1' ? 'Male' : viewingParent.gender === '2' ? 'Female' : viewingParent.gender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Phone:</strong> {viewingParent.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Email:</strong> {viewingParent.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Relation:</strong> {viewingParent.relation}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Occupation:</strong> {viewingParent.occupation || 'N/A'}</Typography>
                </Grid>
              </Grid>

              {/* Profile Photo Display */}
              {viewingParent.profile_photo && (
                <Box display="flex" justifyContent="center" mb={3}>
                  <img 
                    src={viewingParent.profile_photo} 
                    alt="Profile" 
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      borderRadius: '50%',
                      border: '3px solid #ddd'
                    }} 
                  />
                </Box>
              )}

              <Typography variant="h6" gutterBottom>Address</Typography>
              <Typography gutterBottom>{formatAddress(viewingParent.address)}</Typography>

              <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
              <Typography gutterBottom>
                {viewingParent.emergency_contact ? 
                  `${viewingParent.emergency_contact.name} - ${viewingParent.emergency_contact.phone} (${viewingParent.emergency_contact.relation})` : 
                  'Emergency contact not available'
                }
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* Profile Photo Section - Moved to Top */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Profile Photo</Typography>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} alignItems="flex-end">
                  <TextField
                    fullWidth
                    label="Profile Photo URL"
                    value={formData.profile_photo}
                    onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
                    margin="normal"
                    placeholder="https://api.dicebear.com/7.x/personas/svg?seed=..."
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 10000);
                      const newUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=4f46e5,7c3aed,059669,dc2626,f59e0b`;
                      setFormData({ ...formData, profile_photo: newUrl });
                    }}
                    sx={{ mb: 1 }}
                  >
                    Generate
                  </Button>
                </Box>
              </Grid>
              {formData.profile_photo && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" mt={2}>
                    <img 
                      src={formData.profile_photo} 
                      alt="Profile" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%',
                        border: '2px solid #ddd'
                      }} 
                    />
                  </Box>
                </Grid>
              )}

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
                    <MenuItem value="1">Male</MenuItem>
                    <MenuItem value="2">Female</MenuItem>
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
                <FormControl fullWidth margin="normal">
                  <InputLabel>Relation</InputLabel>
                  <Select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    label="Relation"
                  >
                    <MenuItem value="มารดา">มารดา (Mother)</MenuItem>
                    <MenuItem value="บิดา">บิดา (Father)</MenuItem>
                    <MenuItem value="ผู้ปกครอง">ผู้ปกครอง (Guardian)</MenuItem>
                    <MenuItem value="ญาติ">ญาติ (Relative)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
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
              {/* Geographic Selector */}
              <GeographicSelector
                provinceId={formData.provinceId}
                districtId={formData.districtId}
                subdistrictId={formData.subdistrictId}
                onProvinceChange={(provinceId) => setFormData({ ...formData, provinceId })}
                onDistrictChange={(districtId) => setFormData({ ...formData, districtId })}
                onSubdistrictChange={(subdistrictId) => setFormData({ ...formData, subdistrictId })}
                onZipcodeChange={(zipcode) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, postal_code: zipcode }
                })}
                required
                gridSize={{ province: 4, district: 4, subdistrict: 4 }}
              />
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

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.emergency_contact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, name: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.emergency_contact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, phone: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Relation"
                  value={formData.emergency_contact.relation}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergency_contact: { ...formData.emergency_contact, relation: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewingParent ? 'Close' : 'Cancel'}
          </Button>
          {!viewingParent && (
            <Button onClick={handleSubmit} variant="contained">
              {editingParent ? 'Update' : 'Create'}
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

export default EvepParents;
