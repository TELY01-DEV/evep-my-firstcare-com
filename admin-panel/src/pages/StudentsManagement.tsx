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
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon
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

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  relation: string;
}

interface Student {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  cid: string;
  birth_date: string;
  gender: string;
  student_code?: string;
  school_name: string;
  grade_level: string;
  grade_number?: string;
  address: Address;
  disease?: string;
  parent_id: string;
  parent_info?: Parent;
  consent_document: boolean;
  created_at: string;
  updated_at: string;
}

const StudentsManagement: React.FC = () => {
  const { user } = useAdminAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    cid: '',
    birth_date: '',
    gender: '',
    student_code: '',
    school_name: '',
    grade_level: '',
    grade_number: '',
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
    disease: '',
    parent_id: '',
    consent_document: false
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/evep/students');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setSnackbar({ open: true, message: 'Error fetching students', severity: 'error' });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await axios.get('/api/v1/evep/parents');
      setParents(response.data.parents || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchParents();
  }, []);

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        title: student.title,
        first_name: student.first_name,
        last_name: student.last_name,
        cid: student.cid,
        birth_date: student.birth_date,
        gender: student.gender,
        student_code: student.student_code || '',
        school_name: student.school_name,
        grade_level: student.grade_level,
        grade_number: student.grade_number || '',
        address: {
          house_no: student.address.house_no || '',
          village_no: student.address.village_no || '',
          soi: student.address.soi || '',
          road: student.address.road || '',
          subdistrict: student.address.subdistrict || '',
          district: student.address.district || '',
          province: student.address.province || '',
          postal_code: student.address.postal_code || ''
        },
        disease: student.disease || '',
        parent_id: student.parent_id,
        consent_document: student.consent_document
      });
    } else {
      setEditingStudent(null);
      setFormData({
        title: '',
        first_name: '',
        last_name: '',
        cid: '',
        birth_date: '',
        gender: '',
        student_code: '',
        school_name: '',
        grade_level: '',
        grade_number: '',
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
        disease: '',
        parent_id: '',
        consent_document: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
    setViewingStudent(null);
  };

  const handleSubmit = async () => {
    try {
      // Format the date to yyyy-MM-dd format
      const formattedData = {
        ...formData,
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString().split('T')[0] : ''
      };

      if (editingStudent) {
        await axios.put(`/api/v1/evep/students/${editingStudent.id}`, formattedData);
        setSnackbar({ open: true, message: 'Student updated successfully', severity: 'success' });
      } else {
        await axios.post('/api/v1/evep/students', formattedData);
        setSnackbar({ open: true, message: 'Student created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      setSnackbar({ open: true, message: 'Error saving student', severity: 'error' });
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`/api/v1/evep/students/${studentId}`);
        setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        setSnackbar({ open: true, message: 'Error deleting student', severity: 'error' });
      }
    }
  };

  const handleRegisterAsPatient = async (student: Student) => {
    if (window.confirm(`Are you sure you want to register ${student.first_name} ${student.last_name} as a patient?`)) {
      try {
        // Get parent data for emergency contact
        const parent = parents.find(p => p.id === student.parent_id);
        
        const patientData = {
          emergency_contact: parent ? `${parent.first_name} ${parent.last_name}` : 'Emergency Contact',
          emergency_phone: parent ? parent.phone : '',
          medical_history: {},
          family_vision_history: {},
          insurance_info: {},
          consent_forms: {}
        };

        await axios.post(`/api/v1/patients/from-student/${student.id}`, patientData);
        setSnackbar({ 
          open: true, 
          message: `${student.first_name} ${student.last_name} registered as patient successfully!`, 
          severity: 'success' 
        });
      } catch (error) {
        console.error('Error registering student as patient:', error);
        setSnackbar({ 
          open: true, 
          message: 'Error registering student as patient', 
          severity: 'error' 
        });
      }
    }
  };

  const handleView = (student: Student) => {
    setViewingStudent(student);
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

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown';
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
          Students Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Student
        </Button>
      </Box>

      <Grid container spacing={3}>
        {students.map((student) => (
          <Grid item xs={12} md={6} lg={4} key={student.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {student.title} {student.first_name} {student.last_name}
                  </Typography>
                  <Chip
                    label={student.grade_level}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Student Code:</strong> {student.student_code || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>CID:</strong> {student.cid}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Birth Date:</strong> {new Date(student.birth_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Gender:</strong> {student.gender}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{student.school_name}</Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">Parent: {getParentName(student.parent_id)}</Typography>
                </Box>

                <Box display="flex" alignItems="flex-start" mb={2}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {formatAddress(student.address)}
                  </Typography>
                </Box>

                {student.disease && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Disease:</strong> {student.disease}
                  </Typography>
                )}

                <Chip
                  label={student.consent_document ? 'Consent Given' : 'No Consent'}
                  size="small"
                  color={student.consent_document ? 'success' : 'warning'}
                  sx={{ mb: 1 }}
                />
              </CardContent>

              <CardActions>
                <IconButton size="small" onClick={() => handleView(student)}>
                  <ViewIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleOpenDialog(student)}>
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleRegisterAsPatient(student)}
                  title="Register as Patient"
                  sx={{ color: 'success.main' }}
                >
                  <HospitalIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(student.id)}>
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
          {viewingStudent ? 'View Student Details' : editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          {viewingStudent ? (
            <Box>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography><strong>Name:</strong> {viewingStudent.title} {viewingStudent.first_name} {viewingStudent.last_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Student Code:</strong> {viewingStudent.student_code || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>CID:</strong> {viewingStudent.cid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Birth Date:</strong> {new Date(viewingStudent.birth_date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Gender:</strong> {viewingStudent.gender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>School:</strong> {viewingStudent.school_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Grade Level:</strong> {viewingStudent.grade_level}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Grade Number:</strong> {viewingStudent.grade_number || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Parent:</strong> {getParentName(viewingStudent.parent_id)}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Address</Typography>
              <Typography gutterBottom>{formatAddress(viewingStudent.address)}</Typography>

              {viewingStudent.disease && (
                <>
                  <Typography variant="h6" gutterBottom>Medical Information</Typography>
                  <Typography gutterBottom><strong>Disease:</strong> {viewingStudent.disease}</Typography>
                </>
              )}

              <Typography variant="h6" gutterBottom>Consent</Typography>
              <Typography gutterBottom>
                {viewingStudent.consent_document ? 'Consent document has been provided' : 'No consent document provided'}
              </Typography>
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
                    <MenuItem value="ด.ช.">ด.ช. (Boy)</MenuItem>
                    <MenuItem value="ด.ญ.">ด.ญ. (Girl)</MenuItem>
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
                  label="Student Code"
                  value={formData.student_code}
                  onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
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
                  label="School Name"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Grade Level</InputLabel>
                  <Select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    label="Grade Level"
                  >
                    <MenuItem value="ป.1">ป.1</MenuItem>
                    <MenuItem value="ป.2">ป.2</MenuItem>
                    <MenuItem value="ป.3">ป.3</MenuItem>
                    <MenuItem value="ป.4">ป.4</MenuItem>
                    <MenuItem value="ป.5">ป.5</MenuItem>
                    <MenuItem value="ป.6">ป.6</MenuItem>
                    <MenuItem value="ม.1">ม.1</MenuItem>
                    <MenuItem value="ม.2">ม.2</MenuItem>
                    <MenuItem value="ม.3">ม.3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Grade Number"
                  value={formData.grade_number}
                  onChange={(e) => setFormData({ ...formData, grade_number: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Parent</InputLabel>
                  <Select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    label="Parent"
                  >
                    {parents.map((parent) => (
                      <MenuItem key={parent.id} value={parent.id}>
                        {parent.first_name} {parent.last_name} ({parent.relation})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Disease (Optional)"
                  value={formData.disease}
                  onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
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
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Consent Document</InputLabel>
                  <Select
                    value={formData.consent_document.toString()}
                    onChange={(e) => setFormData({ ...formData, consent_document: e.target.value === 'true' })}
                    label="Consent Document"
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewingStudent ? 'Close' : 'Cancel'}
          </Button>
          {!viewingStudent && (
            <Button onClick={handleSubmit} variant="contained">
              {editingStudent ? 'Update' : 'Create'}
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

export default StudentsManagement;
