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
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAdminAuth } from '../contexts/AdminAuthContext.tsx';
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

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  cid: string;
  birth_date: string;
  gender: string;
  phone: string;
  email?: string;
  relation: string;
  occupation?: string;
  income_level?: 'low' | 'middle' | 'high';
  address: Address;
  emergency_contact: EmergencyContact;
  created_at: string;
  updated_at: string;
}

const ParentsManagement: React.FC = () => {
  const { user } = useAdminAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [viewingParent, setViewingParent] = useState<Parent | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    cid: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    relation: '',
    occupation: '',
    income_level: '',
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
    }
  });

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/evep/parents');
      setParents(response.data);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setSnackbar({ open: true, message: 'Error fetching parents', severity: 'error' });
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
        first_name: parent.first_name,
        last_name: parent.last_name,
        cid: parent.cid,
        birth_date: parent.birth_date,
        gender: parent.gender,
        phone: parent.phone,
        email: parent.email || '',
        relation: parent.relation,
        occupation: parent.occupation || '',
        income_level: parent.income_level || '',
        address: {
          house_no: parent.address.house_no || '',
          village_no: parent.address.village_no || '',
          soi: parent.address.soi || '',
          road: parent.address.road || '',
          subdistrict: parent.address.subdistrict || '',
          district: parent.address.district || '',
          province: parent.address.province || '',
          postal_code: parent.address.postal_code || ''
        },
        emergency_contact: parent.emergency_contact
      });
    } else {
      setEditingParent(null);
      setFormData({
        first_name: '',
        last_name: '',
        cid: '',
        birth_date: '',
        gender: '',
        phone: '',
        email: '',
        relation: '',
        occupation: '',
        income_level: '',
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
        }
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
        await axios.put(`/api/v1/evep/parents/${editingParent.id}`, formData);
        setSnackbar({ open: true, message: 'Parent updated successfully', severity: 'success' });
      } else {
        await axios.post('/api/v1/evep/parents', formData);
        setSnackbar({ open: true, message: 'Parent created successfully', severity: 'success' });
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
        await axios.delete(`/api/v1/evep/parents/${parentId}`);
        setSnackbar({ open: true, message: 'Parent deleted successfully', severity: 'success' });
        fetchParents();
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Parents Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Parent
        </Button>
      </Box>

      <Grid container spacing={3}>
        {parents.map((parent) => (
          <Grid item xs={12} md={6} lg={4} key={parent.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {parent.first_name} {parent.last_name}
                  </Typography>
                  <Chip
                    label={parent.relation}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>CID:</strong> {parent.cid}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Birth Date:</strong> {new Date(parent.birth_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Gender:</strong> {parent.gender}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{parent.phone}</Typography>
                </Box>

                {parent.email && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{parent.email}</Typography>
                  </Box>
                )}

                <Box display="flex" alignItems="flex-start" mb={2}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {formatAddress(parent.address)}
                  </Typography>
                </Box>

                {parent.occupation && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Occupation:</strong> {parent.occupation}
                  </Typography>
                )}

                {parent.income_level && (
                  <Chip
                    label={`Income: ${parent.income_level}`}
                    size="small"
                    color={getIncomeLevelColor(parent.income_level) as any}
                    sx={{ mb: 1 }}
                  />
                )}

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Emergency Contact:</strong> {parent.emergency_contact.name} ({parent.emergency_contact.relation})
                </Typography>
              </CardContent>

              <CardActions>
                <IconButton size="small" onClick={() => handleView(parent)}>
                  <ViewIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleOpenDialog(parent)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(parent.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
                  <Typography><strong>Gender:</strong> {viewingParent.gender}</Typography>
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

              <Typography variant="h6" gutterBottom>Address</Typography>
              <Typography gutterBottom>{formatAddress(viewingParent.address)}</Typography>

              <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
              <Typography gutterBottom>
                {viewingParent.emergency_contact.name} - {viewingParent.emergency_contact.phone} ({viewingParent.emergency_contact.relation})
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
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
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Income Level</InputLabel>
                  <Select
                    value={formData.income_level}
                    onChange={(e) => setFormData({ ...formData, income_level: e.target.value })}
                    label="Income Level"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="middle">Middle</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
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

export default ParentsManagement;
