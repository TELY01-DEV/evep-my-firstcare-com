import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
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
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';

interface SchoolScreening {
  id?: string;
  _id?: string;
  patient_id: string;
  patient_name: string;
  examiner_id: string;
  examiner_name: string;
  screening_type: string;
  screening_category: string;
  equipment_used: string;
  notes: string;
  status: string;
  results: any[];
  conclusion: string;
  recommendations: string;
  follow_up_date: string;
  created_at: string;
  completed_at: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  school_name: string;
  grade_level: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  position: string;
}

const EvepSchoolScreenings: React.FC = () => {
  const { token } = useAuth();
  const [screenings, setScreenings] = useState<SchoolScreening[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScreening, setEditingScreening] = useState<SchoolScreening | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [formData, setFormData] = useState({
    patient_id: '',
    examiner_id: '',
    screening_type: '',
    equipment_used: '',
    notes: '',
  });

  useEffect(() => {
    fetchSchoolScreenings();
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchSchoolScreenings = async () => {
    try {
      const response = await fetch('http://localhost:8013/api/v1/screenings/?screening_category=school_screening', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setScreenings(data || []);
    } catch (error) {
      console.error('Error fetching school screenings:', error);
      setScreenings([]);
      setSnackbar({
        open: true,
        message: 'Failed to fetch school screenings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:8013/api/v1/evep/students/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:8013/api/v1/evep/teachers/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  const handleCreateScreening = () => {
    setEditingScreening(null);
    setFormData({
      patient_id: '',
      examiner_id: '',
      screening_type: '',
      equipment_used: '',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleEditScreening = (screening: SchoolScreening) => {
    setEditingScreening(screening);
    setFormData({
      patient_id: screening.patient_id,
      examiner_id: screening.examiner_id,
      screening_type: screening.screening_type,
      equipment_used: screening.equipment_used || '',
      notes: screening.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSaveScreening = async () => {
    try {
      const screeningData = {
        ...formData,
        screening_category: 'school_screening',
      };

      if (editingScreening) {
        const screeningId = editingScreening.id || editingScreening._id;
        if (!screeningId) {
          setSnackbar({
            open: true,
            message: 'Invalid screening ID for update',
            severity: 'error'
          });
          return;
        }
        await fetch(`http://localhost:8013/api/v1/screenings/${screeningId}`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(screeningData)
        });
        setSnackbar({
          open: true,
          message: 'School screening updated successfully!',
          severity: 'success'
        });
      } else {
        await fetch('http://localhost:8013/api/v1/screenings/', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(screeningData)
        });
        setSnackbar({
          open: true,
          message: 'School screening created successfully!',
          severity: 'success'
        });
      }

      setOpenDialog(false);
      fetchSchoolScreenings();
    } catch (error) {
      console.error('Error saving school screening:', error);
      setSnackbar({
        open: true,
        message: 'Error saving school screening',
        severity: 'error'
      });
    }
  };

  const handleDeleteScreening = async (screeningId: string) => {
    if (!screeningId) {
      setSnackbar({
        open: true,
        message: 'Invalid screening ID',
        severity: 'error'
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this school screening?')) {
      try {
        await fetch(`http://localhost:8013/api/v1/screenings/${screeningId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({
          open: true,
          message: 'School screening deleted successfully!',
          severity: 'success'
        });
        fetchSchoolScreenings();
      } catch (error) {
        console.error('Error deleting school screening:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting school screening',
          severity: 'error'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading school screenings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            School-based Screening Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateScreening}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          Create School Screening
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total School Screenings
              </Typography>
              <Typography variant="h4">
                {screenings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {screenings.filter(s => s.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="warning.main">
                {screenings.filter(s => s.status === 'in_progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                This Month
              </Typography>
              <Typography variant="h4" color="info.main">
                {screenings.filter(s => {
                  const createdDate = new Date(s.created_at);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && 
                         createdDate.getFullYear() === now.getFullYear();
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenings Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            School Screening Sessions
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Examiner</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {screenings.map((screening) => (
                  <TableRow key={screening.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body2">
                          {screening.patient_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{screening.examiner_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={screening.screening_type} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{screening.equipment_used || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={screening.status} 
                        size="small" 
                        color={getStatusColor(screening.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(screening.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Screening">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditScreening(screening)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Screening">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteScreening(screening.id || screening._id || '')}
                          >
                            <DeleteIcon />
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingScreening ? 'Edit School Screening' : 'Create New School Screening'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  value={formData.patient_id}
                  label="Student"
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - {student.student_code} ({student.school_name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Teacher/Examiner</InputLabel>
                <Select
                  value={formData.examiner_id}
                  label="Teacher/Examiner"
                  onChange={(e) => setFormData({ ...formData, examiner_id: e.target.value })}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} - {teacher.position} ({teacher.school})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Screening Type</InputLabel>
                <Select
                  value={formData.screening_type}
                  label="Screening Type"
                  onChange={(e) => setFormData({ ...formData, screening_type: e.target.value })}
                >
                  <MenuItem value="distance">Distance Vision</MenuItem>
                  <MenuItem value="near">Near Vision</MenuItem>
                  <MenuItem value="color">Color Vision</MenuItem>
                  <MenuItem value="comprehensive">Comprehensive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Equipment Used"
                value={formData.equipment_used}
                onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                placeholder="e.g., Snellen Chart, Color Vision Test"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the screening session..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveScreening} variant="contained">
            {editingScreening ? 'Update' : 'Create'}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvepSchoolScreenings;
