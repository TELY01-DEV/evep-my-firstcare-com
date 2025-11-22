import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  InputAdornment,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TablePagination,
  Pagination,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Refresh,
  Person,
  School,
  FamilyRestroom,
  CalendarToday,
  Phone,
  Email,
  Home,
  People,
  CreditCard,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Patient {
  _id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  cid: string;  // Citizen ID as primary key
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  emergency_contact: string;  // Backend uses emergency_contact instead of parent_name
  parent_phone: string;
  parent_email: string;
  emergency_phone: string;
  address: string;
  school: string;
  grade: string;
  medical_history: any;
  family_vision_history: any;
  insurance_info: any;
  consent_forms: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  audit_hash: string;
  screening_history: any[];
  documents: any[];
  profile_photo: string | null;
  extra_photos: string[];
  photo_metadata: any;
  // Additional screening fields for screened patients
  last_screening_date?: string;
  last_screening_type?: string;
  last_screening_status?: string;
  screening_results?: any;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  cid: string;  // Citizen ID as primary key
  date_of_birth: string;
  gender: string;
  emergency_contact: string;  // Backend uses emergency_contact instead of parent_name
  parent_phone: string;
  parent_email: string;
  emergency_phone: string;
  address: string;
  school: string;
  grade: string;
  medical_history: any;
  family_vision_history: any;
  insurance_info: any;
  consent_forms: any;
}

interface PatientsProps {
  autoOpenAddDialog?: boolean;
}

const Patients: React.FC<PatientsProps> = ({ autoOpenAddDialog = false }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  
  // Patient selection states
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'school' | 'appointment' | 'manual'>('all');
  
  // Pagination and view state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // CRUD dialog states for consistency with Recent Screening Sessions
  const [viewPatientDialogOpen, setViewPatientDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  
  // Citizen card reader
  const [citizenCardDialogOpen, setCitizenCardDialogOpen] = useState(false);
  const [citizenCardData, setCitizenCardData] = useState({
    citizen_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
  });
  
  // Manual patient registration
  const [manualPatientDialogOpen, setManualPatientDialogOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    cid: '',  // Citizen ID as primary key
    date_of_birth: '',
    gender: '',
    emergency_contact: '',
    parent_phone: '',
    parent_email: '',
    emergency_phone: '',
    address: '',
    school: '',
    grade: '',
    medical_history: {},
    family_vision_history: {},
    insurance_info: {},
    consent_forms: {},
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (autoOpenAddDialog) {
      handleOpenDialog();
    }
  }, [autoOpenAddDialog]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      console.log('🔍 Fetching screened patients from screening sessions...');
      
      // Fetch completed screening sessions to get patients who have been screened
      const response = await fetch(`${baseUrl}/api/v1/screenings/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Screening Sessions API Response Status:', response.status);

      if (response.ok) {
        const sessions = await response.json();
        console.log('📊 Screening Sessions Data:', sessions);
        console.log('📊 Session Count:', sessions.length);
        
        // Log all unique statuses to understand what we're working with
        const statusSet = new Set(sessions.map((s: any) => s.status));
        const allStatuses = Array.from(statusSet);
        console.log('📊 All Session Statuses:', allStatuses);
        
        // Extract unique patients from completed screening sessions
        const patientMap = new Map();
        const screenedPatients: Patient[] = [];
        
        sessions.forEach((session: any) => {
          // Include sessions that have been screened (not just pending or cancelled)
          // Status values that indicate screening has occurred or is in progress
          const validScreeningStatuses = [
            'completed',
            'in_progress', 
            'VA Screening',
            'Doctor Diagnosis',
            'Glasses Selection',
            'Inventory Check',
            'School Delivery',
            'Screening Complete'
          ];
          
          const hasValidStatus = validScreeningStatuses.includes(session.status);
          
          if (hasValidStatus && session.patient_id && session.patient_name) {
            const patientId = session.patient_id;
            
            if (!patientMap.has(patientId)) {
              const patient = {
                _id: session.patient_id,
                patient_id: session.patient_id,
                first_name: session.patient_name?.split(' ')[0] || '',
                last_name: session.patient_name?.split(' ').slice(1).join(' ') || '',
                cid: session.patient_cid || '',
                date_of_birth: session.patient_birth_date || '',
                gender: session.patient_gender || 'other',
                emergency_contact: session.patient_parent_name || '',
                parent_phone: session.patient_parent_phone || '',
                parent_email: session.patient_parent_email || '',
                emergency_phone: session.patient_parent_phone || '',
                address: session.patient_address || '',
                school: session.patient_school || '',
                grade: session.patient_grade || '',
                medical_history: {},
                family_vision_history: {},
                insurance_info: {},
                consent_forms: {},
                is_active: true,
                created_at: session.created_at || '',
                updated_at: session.updated_at || '',
                created_by: session.created_by || '',
                audit_hash: '',
                screening_history: [],
                documents: [],
                profile_photo: session.patient_photo || null,
                extra_photos: [],
                photo_metadata: {},
                // Additional screening info
                last_screening_date: session.created_at,
                last_screening_type: session.screening_type,
                last_screening_status: session.status,
                screening_results: session.results
              };
              
              patientMap.set(patientId, patient);
              screenedPatients.push(patient);
            }
          }
        });
        
        console.log(`📊 Found ${screenedPatients.length} patients who have been screened by staff`);
        setPatients(screenedPatients);
        
        // Update the message if no screened patients found
        if (screenedPatients.length === 0) {
          if (sessions.length === 0) {
            setError('No screening sessions found. Patients will appear here after completing screening sessions.');
          } else {
            console.log('📊 Sessions found but no valid screened patients. Statuses found:', allStatuses);
            setError(`Found ${sessions.length} screening sessions but none match the screened patient criteria. Session statuses: ${allStatuses.join(', ')}`);
          }
        }
        
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch screening sessions:', response.status, errorText);
        setError(`Failed to load screened patients: ${response.status} - ${errorText}`);
        setPatients([]);
      }
    } catch (err) {
      console.error('❌ Screened patients fetch error:', err);
      setError('Failed to load screened patients');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableStudents = async () => {
    // This function is no longer needed since we're showing screened patients only
    // Patients will appear here after they complete screening sessions
    console.log('ℹ️ This page shows patients who have been screened by staff');
  };

  const handleOpenDialog = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        cid: patient.cid,  // Citizen ID as primary key
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        emergency_contact: patient.emergency_contact,
        parent_phone: patient.parent_phone,
        parent_email: patient.parent_email,
        emergency_phone: patient.emergency_phone,
        address: patient.address,
        school: patient.school,
        grade: patient.grade,
        medical_history: patient.medical_history,
        family_vision_history: patient.family_vision_history,
        insurance_info: patient.insurance_info,
        consent_forms: patient.consent_forms,
      });
    } else {
      setEditingPatient(null);
      setFormData({
        first_name: '',
        last_name: '',
        cid: '',  // Citizen ID as primary key
        date_of_birth: '',
        gender: '',
        emergency_contact: '',
        parent_phone: '',
        parent_email: '',
        emergency_phone: '',
        address: '',
        school: '',
        grade: '',
        medical_history: {},
        family_vision_history: {},
        insurance_info: {},
        consent_forms: {},
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPatient(null);
    setFormData({
      first_name: '',
      last_name: '',
      cid: '',  // Citizen ID as primary key
      date_of_birth: '',
      gender: '',
      emergency_contact: '',
      parent_phone: '',
      parent_email: '',
      emergency_phone: '',
      address: '',
      school: '',
      grade: '',
      medical_history: {},
      family_vision_history: {},
      insurance_info: {},
      consent_forms: {},
    });
  };



  const handlePatientSelect = (patient: Patient) => {
    handleOpenDialog(patient);
  };

  const handleManualPatientAdd = () => {
    setManualPatientDialogOpen(true);
  };

  const handleCitizenCardRead = () => {
    setCitizenCardDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('evep_token');
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const url = editingPatient 
        ? `${baseUrl}/api/v1/patients/${editingPatient._id}`
        : `${baseUrl}/api/v1/patients`;
      
      const response = await fetch(url, {
        method: editingPatient ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editingPatient ? 'Patient updated successfully!' : 'Patient created successfully!');
        handleCloseDialog();
        fetchPatients();
      } else {
        setError('Failed to save patient');
      }
    } catch (err) {
      console.error('Patient save error:', err);
      setError('Failed to save patient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      const token = localStorage.getItem('evep_token');
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Patient deleted successfully!');
        fetchPatients();
      } else {
        setError('Failed to delete patient');
      }
    } catch (err) {
      console.error('Patient delete error:', err);
      setError('Failed to delete patient');
    }
  };

  const handleInputChange = (field: keyof PatientFormData) => (
    event: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // CRUD action handlers for consistency with Recent Screening Sessions
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewPatientDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    handleOpenDialog(patient);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setForceDelete(false);
    setDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPatient) {
      setError('Cannot delete patient: Patient is missing');
      setDeleteConfirmDialogOpen(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('evep_token');
      const queryParams = new URLSearchParams();
      
      if (forceDelete) {
        queryParams.append('force_delete', 'true');
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const deleteUrl = `${baseUrl}/api/v1/evep/patients/${selectedPatient._id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const message = forceDelete 
          ? 'Patient permanently deleted' 
          : 'Patient soft deleted successfully';
        
        setSuccess(message);
        setDeleteConfirmDialogOpen(false);
        setSelectedPatient(null);
        setForceDelete(false);
        fetchPatients(); // Refresh the data
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete patient');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete patient');
    } finally {
      setSaving(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Memoized filtered patients for performance with large datasets
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = 
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cid?.toLowerCase().includes(searchTerm.toLowerCase()) ||  // Search by CID
        patient.emergency_contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.school?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || patient.is_active === (statusFilter === 'active');
      const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
      const matchesFilter = filterType === 'all' || 
        (filterType === 'school' && patient.school) ||
        (filterType === 'appointment' && patient.is_active) ||
        (filterType === 'manual' && !patient.school);
      
      return matchesSearch && matchesStatus && matchesGender && matchesFilter;
    });
  }, [patients, searchTerm, statusFilter, genderFilter, filterType]);

  // Paginated patients for current page
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  // Update total count when filtered patients change
  useEffect(() => {
    setTotalCount(filteredPatients.length);
    // Reset to first page if current page is out of bounds
    const maxPage = Math.ceil(filteredPatients.length / itemsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(1);
    }
  }, [filteredPatients.length, itemsPerPage, currentPage]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <People sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('patients.title')}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Screened Patients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Patients registered and screened by staff during screening sessions
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<CreditCard />}
            onClick={handleCitizenCardRead}
            sx={{ borderRadius: 2 }}
          >
            Read Citizen Card
          </Button>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={handleManualPatientAdd}
            sx={{ borderRadius: 2 }}
          >
            Add New Patient
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Quick Add
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search patients..."
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={genderFilter}
                  label="Gender"
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <MenuItem value="all">All Genders</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchPatients}
              >
                {t('common.refresh')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Patient Selection Tabs */}
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="School Screening Students" icon={<School />} />
        <Tab label="Manual Registration" icon={<Person />} />
        <Tab label="Citizen Card Reader" icon={<CreditCard />} />
      </Tabs>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search patients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by type</InputLabel>
              <Select
                value={filterType}
                label="Filter by type"
                onChange={(e) => setFilterType(e.target.value as any)}
                startAdornment={<FilterList sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">{t('patients.all_status')}</MenuItem>
                <MenuItem value="school">{t('school_screenings.title')}</MenuItem>
                <MenuItem value="appointment">{t('patients.appointment')}</MenuItem>
                <MenuItem value="manual">{t('patients.manual_registration')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* View Mode Toggle */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Patient Management ({filteredPatients.length} patients)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('cards')}
          >
            Card View
          </Button>
        </Box>
      </Box>

      {/* Patient Table/Cards */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {viewMode === 'table' ? (
            <>
              {/* Table View */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>CID</TableCell>
                      <TableCell>School & Grade</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Last Screening</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPatients.map((patient) => {
                      const patientKey = patient._id || `patient-${patient.cid}`;
                      
                      return (
                        <TableRow key={patientKey} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {patient.profile_photo ? (
                                <Avatar src={patient.profile_photo} sx={{ width: 40, height: 40 }} />
                              ) : (
                                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                                  <Person />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="subtitle2">
                                  {patient.first_name} {patient.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Born: {patient.date_of_birth}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {patient.cid || 'No CID'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {patient.school || 'No School'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Grade: {patient.grade || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {patient.parent_phone || 'No Phone'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {patient.parent_email || 'No Email'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {patient.last_screening_date ? (
                              <Box>
                                <Typography variant="body2">
                                  {new Date(patient.last_screening_date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {patient.last_screening_type || 'Unknown Type'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No screening history
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={patient.last_screening_status || 'Not Screened'}
                              size="small"
                              color={patient.last_screening_status === 'completed' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewPatient(patient)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Patient">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEditPatient(patient)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeletePatient(patient)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <>
              {/* Card View */}
              <Grid container spacing={2}>
                {paginatedPatients.map((patient) => {
                  const patientKey = patient._id || `patient-${patient.cid}`;
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={patientKey}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { 
                            bgcolor: 'grey.50',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          },
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {patient.profile_photo ? (
                              <Avatar src={patient.profile_photo} sx={{ width: 50, height: 50 }} />
                            ) : (
                              <Avatar sx={{ width: 50, height: 50, bgcolor: 'primary.main' }}>
                                <Person />
                              </Avatar>
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                {patient.first_name} {patient.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                CID: {patient.cid || 'No CID'}
                              </Typography>
                            </Box>
                            <Chip
                              label={patient.last_screening_status || 'Not Screened'}
                              size="small"
                              color={patient.last_screening_status === 'completed' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <School sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              {patient.school || 'No School'} - Grade {patient.grade || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              {patient.parent_phone || 'No Phone'}
                            </Typography>
                            {patient.last_screening_date && (
                              <Typography variant="body2" color="text.secondary">
                                <Assessment sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                                Last: {new Date(patient.last_screening_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between">
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewPatient(patient)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Patient">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEditPatient(patient)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeletePatient(patient)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
          
          {/* No Data Message */}
          {filteredPatients.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No patients found matching your criteria
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredPatients.length > itemsPerPage && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TablePagination
                component="div"
                count={filteredPatients.length}
                page={currentPage - 1} // MUI uses 0-based indexing
                onPageChange={(_, newPage) => setCurrentPage(newPage + 1)}
                rowsPerPage={itemsPerPage}
                onRowsPerPageChange={handleItemsPerPageChange}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Patients per page:"
                showFirstButton
                showLastButton
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Legacy List View - Hidden but preserved for migration */}
      <Box sx={{ display: 'none' }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <List>
              {filteredPatients.map((patient) => (
                <ListItem
                  key={patient._id}
                  button
                  onClick={() => handlePatientSelect(patient)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${patient.first_name} ${patient.last_name}`}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        CID: {patient.cid} • DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                        {patient.school && ` • School: ${patient.school}`}
                        {patient.grade && ` • Grade: ${patient.grade}`}
                      </Typography>
                      {/* Screening Information */}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Last Screened: {patient.last_screening_date ? new Date(patient.last_screening_date).toLocaleDateString() : 'N/A'}
                        {patient.last_screening_type && ` • Type: ${patient.last_screening_type}`}
                        {patient.last_screening_status && ` • Status: ${patient.last_screening_status}`}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {patient.school && (
                          <Chip
                            icon={<School />}
                            label="School Student"
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {patient.last_screening_type && (
                          <Chip
                            icon={<Assessment />}
                            label={`${patient.last_screening_type} Screening`}
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Chip
                          label={patient.is_active ? 'active' : 'inactive'}
                          color={patient.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    </Box>
                  }
                />
                <Box display="flex" gap={1}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPatient(patient);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Patient">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(patient);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Patient">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(patient._id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
          
          {filteredPatients.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No patients found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleManualPatientAdd}
        >
          Add New Patient
        </Button>
        <Button
          variant="outlined"
          startIcon={<CreditCard />}
          onClick={handleCitizenCardRead}
        >
          Read Citizen Card
        </Button>
      </Box>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPatient ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Citizen ID (CID)"
                value={formData.cid}
                onChange={handleInputChange('cid')}
                margin="normal"
                required
                placeholder="Enter 13-digit citizen ID"
                helperText="Citizen ID is used as primary key"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange('date_of_birth')}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergency_contact}
                onChange={handleInputChange('emergency_contact')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parent_phone}
                onChange={handleInputChange('parent_phone')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={handleInputChange('parent_email')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School"
                value={formData.school}
                onChange={handleInputChange('school')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grade"
                value={formData.grade}
                onChange={handleInputChange('grade')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleInputChange('address')}
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={formData.emergency_phone}
                onChange={handleInputChange('emergency_phone')}
                margin="normal"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : (editingPatient ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={!!viewingPatient} onClose={() => setViewingPatient(null)} maxWidth="md" fullWidth>
        {viewingPatient && (
          <>
            <DialogTitle>
              Patient Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.first_name} {viewingPatient.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Citizen ID (CID)
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.cid}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Age
                  </Typography>
                  <Typography variant="body1">
                    {getAge(viewingPatient.date_of_birth)} years
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.gender.charAt(0).toUpperCase() + viewingPatient.gender.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={viewingPatient.is_active ? 'active' : 'inactive'}
                    color={viewingPatient.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Emergency Contact Information
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.emergency_contact}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewingPatient.emergency_phone} | {viewingPatient.parent_email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    School
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.school}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Grade
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.grade}
                  </Typography>
                </Grid>

                                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medical History
                  </Typography>
                  <Typography variant="body1">
                    {viewingPatient.medical_history ? (
                      typeof viewingPatient.medical_history === 'object' ? 
                        JSON.stringify(viewingPatient.medical_history, null, 2) : 
                        String(viewingPatient.medical_history)
                    ) : 'No medical history recorded'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewingPatient(null)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setViewingPatient(null);
                  handleOpenDialog(viewingPatient);
                }}
              >
                Edit Patient
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Citizen Card Reader Dialog */}
      <Dialog 
        open={citizenCardDialogOpen} 
        onClose={() => setCitizenCardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CreditCard />
            Read Citizen Card
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please scan or manually enter the Thai citizen ID card information.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Citizen ID Number"
                value={citizenCardData.citizen_id}
                onChange={(e) => setCitizenCardData({
                  ...citizenCardData,
                  citizen_id: e.target.value
                })}
                placeholder="Enter 13-digit citizen ID"
                inputProps={{ maxLength: 13 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={citizenCardData.first_name}
                onChange={(e) => setCitizenCardData({
                  ...citizenCardData,
                  first_name: e.target.value
                })}
                placeholder="ชื่อ"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={citizenCardData.last_name}
                onChange={(e) => setCitizenCardData({
                  ...citizenCardData,
                  last_name: e.target.value
                })}
                placeholder="นามสกุล"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={citizenCardData.date_of_birth}
                onChange={(e) => setCitizenCardData({
                  ...citizenCardData,
                  date_of_birth: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitizenCardDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Auto-fill the patient form with citizen card data
              setFormData({
                ...formData,
                first_name: citizenCardData.first_name,
                last_name: citizenCardData.last_name,
                date_of_birth: citizenCardData.date_of_birth,
              });
              setCitizenCardDialogOpen(false);
              setDialogOpen(true);
            }}
          >
            Use This Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Patient Registration Dialog */}
      <Dialog 
        open={manualPatientDialogOpen} 
        onClose={() => setManualPatientDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Person />
            Manual Patient Registration
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please fill in all the required patient information manually.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({
                  ...formData,
                  first_name: e.target.value
                })}
                required
                placeholder="ชื่อ"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({
                  ...formData,
                  last_name: e.target.value
                })}
                required
                placeholder="นามสกุล"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({
                  ...formData,
                  date_of_birth: e.target.value
                })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => setFormData({
                    ...formData,
                    gender: e.target.value
                  })}
                >
                  <MenuItem value="male">ชาย (Male)</MenuItem>
                  <MenuItem value="female">หญิง (Female)</MenuItem>
                  <MenuItem value="other">อื่นๆ (Other)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({
                  ...formData,
                  emergency_contact: e.target.value
                })}
                required
                placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData({
                  ...formData,
                  parent_phone: e.target.value
                })}
                required
                placeholder="เบอร์โทรผู้ปกครอง"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => setFormData({
                  ...formData,
                  parent_email: e.target.value
                })}
                required
                placeholder="อีเมลผู้ปกครอง"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School"
                value={formData.school}
                onChange={(e) => setFormData({
                  ...formData,
                  school: e.target.value
                })}
                placeholder="โรงเรียน"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grade"
                value={formData.grade}
                onChange={(e) => setFormData({
                  ...formData,
                  grade: e.target.value
                })}
                placeholder="ระดับชั้น"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical History"
                multiline
                rows={3}
                value={formData.medical_history}
                onChange={(e) => setFormData({
                  ...formData,
                  medical_history: e.target.value
                })}
                placeholder="ประวัติทางการแพทย์ (ถ้ามี)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({
                  ...formData,
                  address: e.target.value
                })}
                placeholder="ที่อยู่"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualPatientDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setManualPatientDialogOpen(false);
              setDialogOpen(true);
            }}
          >
            Continue to Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Patient Details Dialog */}
      <Dialog open={viewPatientDialogOpen} onClose={() => setViewPatientDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Patient Details
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Citizen ID (CID)
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.cid || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.date_of_birth}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.gender}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  School & Grade
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.school || 'No school'} - Grade {selectedPatient.grade || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Emergency Contact
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.emergency_contact || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Parent Phone
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.parent_phone || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Parent Email
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.parent_email || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {selectedPatient.address || 'Not provided'}
                </Typography>
              </Grid>
              {selectedPatient.last_screening_date && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Screening
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedPatient.last_screening_date).toLocaleDateString()} - {selectedPatient.last_screening_type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedPatient.last_screening_status}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPatientDialogOpen(false)}>
            Close
          </Button>
          {selectedPatient && (
            <Button 
              variant="contained" 
              onClick={() => {
                setViewPatientDialogOpen(false);
                handleEditPatient(selectedPatient);
              }}
            >
              Edit Patient
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmDialogOpen} 
        onClose={() => {
          setDeleteConfirmDialogOpen(false);
          setForceDelete(false);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this patient?
          </Typography>
          {selectedPatient && (
            <Typography variant="body2" color="text.secondary">
              <strong>Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name}<br/>
              <strong>CID:</strong> {selectedPatient.cid || 'No CID'}<br/>
              <strong>School:</strong> {selectedPatient.school || 'No School'}
            </Typography>
          )}
          
          {user?.role && ['super_admin', 'admin', 'medical_admin'].includes(user.role) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" color="error">
                    <strong>Force Delete (Permanent):</strong> Permanently remove all data from database
                  </Typography>
                }
              />
            </Box>
          )}
          
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            <strong>Warning:</strong> {forceDelete 
              ? 'This will permanently delete all patient data and cannot be undone!'
              : 'This will soft delete the patient but preserve data for audit purposes.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmDialogOpen(false);
              setForceDelete(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
            disabled={saving}
          >
            {saving 
              ? 'Processing...' 
              : forceDelete 
                ? 'Permanently Delete' 
                : 'Soft Delete'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;
