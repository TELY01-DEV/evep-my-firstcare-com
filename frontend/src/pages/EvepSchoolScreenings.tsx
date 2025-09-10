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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Breadcrumbs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Search,
  FilterList,
  CreditCard,
  ArrowBack,
  ArrowForward,
  Save,
  Close,
  Clear,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface SchoolScreening {
  screening_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  school_id: string;
  school_name: string;
  grade_level: string;
  screening_type: string;
  screening_date: string;
  status: string;
  results: any[];
  conclusion: string;
  recommendations: string;
  referral_needed: boolean;
  referral_notes: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  school_name: string;
  grade_level: string;
  teacher_id?: string;
  photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  parent_phone?: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  position: string;
}

const EvepSchoolScreenings: React.FC = () => {
  const { token, user } = useAuth();
  const [screenings, setScreenings] = useState<SchoolScreening[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [editingScreening, setEditingScreening] = useState<SchoolScreening | null>(null);
  const [viewingScreening, setViewingScreening] = useState<SchoolScreening | null>(null);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Filter states for Recent School Screenings
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScreeningType, setFilterScreeningType] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('');
  const [filterExaminer, setFilterExaminer] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Step-by-step form states
  const [activeStep, setActiveStep] = useState(0);
  const [screeningInProgress, setScreeningInProgress] = useState(false);

  // Patient selection states
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'manual'>('all');
  
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
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    school: '',
    grade: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });

  const [formData, setFormData] = useState({
    patient_id: '',
    examiner_id: '',
    screening_type: '',
    equipment_used: '',
    notes: '',
    // Enhanced screening fields
    basic_vision_screening: {
      visual_acuity_left: '',
      visual_acuity_right: '',
      eye_preference: 'both' as 'left' | 'right' | 'both',
    },
    intraocular_pressure: {
      pressure_left: 0,
      pressure_right: 0,
    },
    retinal_imaging: {
      retinal_photo_taken: false,
      image_reference: '',
    },
    corneal_curvature: {
      curvature_left: 0,
      curvature_right: 0,
    },
  });

  // Screening results state
  const [screeningResults, setScreeningResults] = useState({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal' as 'normal' | 'deficient' | 'failed',
    depth_perception: 'normal' as 'normal' | 'impaired' | 'failed',
    notes: '',
    recommendations: '',
    follow_up_required: false,
    follow_up_date: '',
  });

  useEffect(() => {
    fetchSchoolScreenings();
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchSchoolScreenings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        // Handle non-200 responses (like 403, 401, etc.)
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Ensure data is always an array
      setScreenings(Array.isArray(data) ? data : (data.screenings || []));
    } catch (error) {
      console.error('Error fetching school screenings:', error);
      setScreenings([]);
      setSnackbar({
        open: true,
        message: `Failed to fetch school screenings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EVEP_STUDENTS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter students based on user role
      let filteredStudents = Array.isArray(data) ? data : (data.students || []);
      
      if (user?.role === 'teacher') {
        // For teachers, only show their assigned students
        filteredStudents = filteredStudents.filter((student: Student) => 
          student.teacher_id === user.user_id
        );
      } else if (user?.role === 'medical_staff') {
        // For medical staff, show all students
        filteredStudents = Array.isArray(data) ? data : (data.students || []);
      }
      
      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EVEP_TEACHERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTeachers(Array.isArray(data) ? data : (data.teachers || []));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  // Filter students based on search term and filter type
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'school' && student.school_name) ||
      (filterType === 'manual' && !student.school_name);
    
    return matchesSearch && matchesFilter;
  });

  const handleStudentSelect = (student: Student) => {
    setFormData(prev => ({
      ...prev,
      patient_id: student.id,
    }));
    // Don't close dialog - move to next step
    setActiveStep(1);
    
    // Show success message
    setSnackbar({
      open: true,
      message: `Student ${student.first_name} ${student.last_name} selected. Moving to next step...`,
      severity: 'success'
    });
  };

  const handleManualPatientAdd = () => {
    setManualPatientDialogOpen(true);
  };

  const handleCitizenCardRead = () => {
    setCitizenCardDialogOpen(true);
  };

  const handleCreateScreening = () => {
    setEditingScreening(null);
    setActiveStep(0);
    resetFormData();
    setOpenDialog(true);
  };

  const handleEditScreening = (screening: SchoolScreening) => {
    setEditingScreening(screening);
    setActiveStep(1); // Start at Screening Setup step instead of Student Selection
    setFormData({
      patient_id: screening.student_id,
      examiner_id: screening.teacher_id,
      screening_type: screening.screening_type || '',
      equipment_used: '', // Equipment used is not stored in the current screening model
      notes: screening.notes || '',
      basic_vision_screening: {
        visual_acuity_left: '',
        visual_acuity_right: '',
        eye_preference: 'both' as 'left' | 'right' | 'both',
      },
      intraocular_pressure: {
        pressure_left: 0,
        pressure_right: 0,
      },
      retinal_imaging: {
        retinal_photo_taken: false,
        image_reference: '',
      },
      corneal_curvature: {
        curvature_left: 0,
        curvature_right: 0,
      },
    });
    setOpenDialog(true);
  };

  const handleNextStep = () => {
    if (activeStep === 0 && !formData.patient_id) {
      setSnackbar({
        open: true,
        message: 'Please select a student or use "Start Screening Without Student" option',
        severity: 'warning'
      });
      return;
    }
    if (activeStep === 1) {
      // Validate teacher/examiner for new screenings
      if (!editingScreening && !formData.examiner_id) {
        setSnackbar({
          open: true,
          message: 'Please select a Teacher/Examiner',
          severity: 'warning'
        });
        return;
      }
      
      // Validate screening_type for both new and editing modes
      if (!formData.screening_type) {
        setSnackbar({
          open: true,
          message: 'Please select a Screening Type',
          severity: 'warning'
        });
        return;
      }
      
      // Only validate equipment_used for new screenings
      if (!editingScreening && !formData.equipment_used) {
        setSnackbar({
          open: true,
          message: 'Please select Equipment Used for new screenings',
          severity: 'warning'
        });
        return;
      }
    }
    if (activeStep === 2) {
      // Validate that we have at least some basic screening results
      if (!screeningResults.left_eye_distance && !screeningResults.right_eye_distance) {
        setSnackbar({
          open: true,
          message: 'Please enter at least one distance acuity measurement (left or right eye)',
          severity: 'warning'
        });
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const resetFormData = () => {
    setFormData({
      patient_id: '',
      examiner_id: user?.role === 'teacher' ? user.user_id : '',
      screening_type: '',
      equipment_used: '',
      notes: '',
      basic_vision_screening: {
        visual_acuity_left: '',
        visual_acuity_right: '',
        eye_preference: 'both' as 'left' | 'right' | 'both',
      },
      intraocular_pressure: {
        pressure_left: 0,
        pressure_right: 0,
      },
      retinal_imaging: {
        retinal_photo_taken: false,
        image_reference: '',
      },
      corneal_curvature: {
        curvature_left: 0,
        curvature_right: 0,
      },
    });
    
    setScreeningResults({
      left_eye_distance: '',
      right_eye_distance: '',
      left_eye_near: '',
      right_eye_near: '',
      color_vision: 'normal',
      depth_perception: 'normal',
      notes: '',
      recommendations: '',
      follow_up_required: false,
      follow_up_date: '',
    });
  };

  const handleSaveScreening = async () => {
    try {
      // Transform screeningResults into the format expected by the backend
      const transformedResults = [
        {
          eye: 'left',
          distance_acuity: screeningResults.left_eye_distance,
          near_acuity: screeningResults.left_eye_near,
          color_vision: screeningResults.color_vision,
          depth_perception: screeningResults.depth_perception,
          additional_tests: null
        },
        {
          eye: 'right',
          distance_acuity: screeningResults.right_eye_distance,
          near_acuity: screeningResults.right_eye_near,
          color_vision: screeningResults.color_vision,
          depth_perception: screeningResults.depth_perception,
          additional_tests: null
        }
      ];

      if (editingScreening) {
        // Update existing screening
        const screeningId = editingScreening.screening_id;
        if (!screeningId) {
          setSnackbar({
            open: true,
            message: 'Invalid screening ID for update',
            severity: 'error'
          });
          return;
        }
        
        const updateData = {
          results: transformedResults,
          status: 'completed',
          notes: screeningResults.notes || formData.notes,
          recommendations: screeningResults.recommendations,
          conclusion: screeningResults.notes, // Use notes as conclusion
          referral_needed: screeningResults.follow_up_required,
          referral_notes: screeningResults.follow_up_date ? `Follow-up date: ${screeningResults.follow_up_date}` : null
        };

        console.log('Updating screening with ID:', screeningId, 'Data:', updateData);
        
        const response = await fetch(`${API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS}/${screeningId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        console.log('Update response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Update error:', errorData);
          throw new Error(`Update failed: ${errorData.detail || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log('Update result:', result);
        
        setSnackbar({
          open: true,
          message: 'School screening updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new screening - need to get student and teacher info first
        if (!formData.patient_id) {
          setSnackbar({
            open: true,
            message: 'Please select a student',
            severity: 'error'
          });
          return;
        }

        if (!formData.examiner_id) {
          setSnackbar({
            open: true,
            message: 'Please select a teacher/examiner',
            severity: 'error'
          });
          return;
        }

        if (!formData.screening_type) {
          setSnackbar({
            open: true,
            message: 'Please select a screening type',
            severity: 'error'
          });
          return;
        }

        // Get student info to find school_name
        const selectedStudent = students.find(s => s.id === formData.patient_id);
        if (!selectedStudent) {
          setSnackbar({
            open: true,
            message: 'Selected student not found',
            severity: 'error'
          });
          return;
        }

        // Get teacher info
        const selectedTeacher = teachers.find(t => t.id === formData.examiner_id);
        if (!selectedTeacher) {
          setSnackbar({
            open: true,
            message: 'Selected teacher not found',
            severity: 'error'
          });
          return;
        }

        // Create the basic screening first - use school_name from student or teacher
        const createData = {
          student_id: formData.patient_id,
          teacher_id: formData.examiner_id,
          school_name: selectedStudent.school_name || selectedTeacher.school, // Use school_name instead of school_id
          screening_type: formData.screening_type,
          screening_date: new Date().toISOString(),
          notes: formData.notes || ''
        };

        console.log('Creating screening with data:', createData);

        const createResponse = await fetch(API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createData)
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Create error:', errorData);
          
          // Check if it's a duplicate screening error
          if (createResponse.status === 409 && errorData.detail && errorData.detail.includes('already has a screening')) {
            setSnackbar({
              open: true,
              message: `Duplicate screening prevented: ${errorData.detail}. Use the re-screen action instead.`,
              severity: 'warning'
            });
            return;
          }
          
          throw new Error(`Creation failed: ${errorData.detail || 'Unknown error'}`);
        }
        
        const createResult = await createResponse.json();
        console.log('Create result:', createResult);
        
        // Now update the screening with results
        const screeningId = createResult.screening_id;
        const updateData = {
          results: transformedResults,
          status: 'completed',
          notes: screeningResults.notes || formData.notes,
          recommendations: screeningResults.recommendations,
          conclusion: screeningResults.notes,
          referral_needed: screeningResults.follow_up_required,
          referral_notes: screeningResults.follow_up_date ? `Follow-up date: ${screeningResults.follow_up_date}` : null
        };

        console.log('Updating new screening with results:', updateData);

        const updateResponse = await fetch(`${API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS}/${screeningId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Update results error:', errorData);
          throw new Error(`Failed to save screening results: ${errorData.detail || 'Unknown error'}`);
        }
        
        setSnackbar({
          open: true,
          message: 'School screening created and completed successfully!',
          severity: 'success'
        });
      }

      // Reset form data and close dialog
      resetFormData();
      setOpenDialog(false);
      setActiveStep(0);
      setEditingScreening(null);
      await fetchSchoolScreenings();
    } catch (error) {
      console.error('Error saving school screening:', error);
      setSnackbar({
        open: true,
        message: `Error saving school screening: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        await fetch(`${API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS}/${screeningId}`, {
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

  const handleViewScreening = (screening: SchoolScreening) => {
    setViewingScreening(screening);
    setViewDialog(true);
  };

  const handleViewStudentHistory = async (screening: SchoolScreening) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS}/student/${screening.student_id}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch student history: ${errorData.detail || 'Unknown error'}`);
      }

      const historyData = await response.json();
      setStudentHistory(historyData);
      setHistoryDialog(true);

    } catch (error) {
      console.error('Error fetching student history:', error);
      setSnackbar({
        open: true,
        message: `Error fetching student history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handlePrintScreening = (screening: SchoolScreening | null) => {
    if (!screening) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setSnackbar({
        open: true,
        message: 'Please allow popups to print the screening record',
        severity: 'warning'
      });
      return;
    }

    // Format the date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Screening Record - ${screening.student_name}</title>
        <style>
          body {
            font-family: 'Sarabun', Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            color: #1976d2;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .results-table th,
          .results-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .results-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #1976d2;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-completed {
            background-color: #e8f5e8;
            color: #2e7d32;
          }
          .status-pending {
            background-color: #fff3e0;
            color: #f57c00;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานการตรวจสายตา</h1>
          <h2>Vision Screening Report</h2>
        </div>

        <div class="section">
          <h3>ข้อมูลนักเรียน / Student Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ชื่อ-นามสกุล:</span>
              <span class="info-value">${screening.student_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ระดับชั้น:</span>
              <span class="info-value">${screening.grade_level}</span>
            </div>
            <div class="info-item">
              <span class="info-label">โรงเรียน:</span>
              <span class="info-value">${screening.school_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">วันที่ตรวจ:</span>
              <span class="info-value">${formatDate(screening.screening_date)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ประเภทการตรวจ:</span>
              <span class="info-value">${screening.screening_type}</span>
            </div>
            <div class="info-item">
              <span class="info-label">สถานะ:</span>
              <span class="info-value">
                <span class="status-badge status-${screening.status}">${screening.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>ข้อมูลผู้ตรวจ / Examiner Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ผู้ตรวจ:</span>
              <span class="info-value">${screening.teacher_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">วันที่สร้างรายงาน:</span>
              <span class="info-value">${formatDate(screening.created_at)}</span>
            </div>
          </div>
        </div>

        ${screening.results && screening.results.length > 0 ? `
        <div class="section">
          <h3>ผลการตรวจ / Screening Results</h3>
          <table class="results-table">
            <thead>
              <tr>
                <th>ตา / Eye</th>
                <th>การมองเห็นระยะไกล / Distance Vision</th>
                <th>การมองเห็นระยะใกล้ / Near Vision</th>
                <th>การมองเห็นสี / Color Vision</th>
                <th>การรับรู้ความลึก / Depth Perception</th>
              </tr>
            </thead>
            <tbody>
              ${screening.results.map((result: any) => `
                <tr>
                  <td>${result.eye === 'left' ? 'ซ้าย / Left' : 'ขวา / Right'}</td>
                  <td>${result.distance_acuity || '-'}</td>
                  <td>${result.near_acuity || '-'}</td>
                  <td>${result.color_vision || '-'}</td>
                  <td>${result.depth_perception || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${screening.conclusion || screening.recommendations || screening.notes ? `
        <div class="section">
          <h3>สรุปและข้อแนะนำ / Conclusion & Recommendations</h3>
          ${screening.conclusion ? `
            <div class="info-item">
              <span class="info-label">สรุปผลการตรวจ:</span>
              <span class="info-value">${screening.conclusion}</span>
            </div>
          ` : ''}
          ${screening.recommendations ? `
            <div class="info-item">
              <span class="info-label">ข้อแนะนำ:</span>
              <span class="info-value">${screening.recommendations}</span>
            </div>
          ` : ''}
          ${screening.notes ? `
            <div class="info-item">
              <span class="info-label">หมายเหตุ:</span>
              <span class="info-value">${screening.notes}</span>
            </div>
          ` : ''}
          ${screening.referral_needed ? `
            <div class="info-item">
              <span class="info-label">ต้องส่งต่อ:</span>
              <span class="info-value">ใช่ / Yes</span>
            </div>
          ` : ''}
          ${screening.referral_notes ? `
            <div class="info-item">
              <span class="info-label">หมายเหตุการส่งต่อ:</span>
              <span class="info-value">${screening.referral_notes}</span>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>รายงานนี้สร้างโดยระบบ EVEP (Eye Vision Examination Platform)</p>
          <p>This report was generated by EVEP System</p>
          <p>พิมพ์เมื่อ: ${formatDate(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    setSnackbar({
      open: true,
      message: 'Print dialog opened successfully',
      severity: 'success'
    });
  };

  const handleRescreenStudent = async (screening: SchoolScreening) => {
    try {
      // Get the current user's token
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication token not found',
          severity: 'error'
        });
        return;
      }

      // Get the first available teacher for the re-screen
      const availableTeacher = teachers[0];
      if (!availableTeacher) {
        setSnackbar({
          open: true,
          message: 'No teachers available for re-screen',
          severity: 'error'
        });
        return;
      }

      // Prepare re-screen data
      const rescreenData = {
        teacher_id: availableTeacher.id,
        screening_type: screening.screening_type,
        screening_date: new Date().toISOString(),
        notes: `Re-screen of ${screening.student_name}`
      };

      console.log('Creating re-screen with data:', rescreenData);

      const response = await fetch(`${API_ENDPOINTS.EVEP_SCHOOL_SCREENINGS}/${screening.screening_id}/rescreen`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rescreenData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Re-screen error:', errorData);
        throw new Error(`Re-screen failed: ${errorData.detail || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Re-screen result:', result);

      setSnackbar({
        open: true,
        message: `Re-screen created successfully for ${screening.student_name}`,
        severity: 'success'
      });

      // Refresh the screenings list
      fetchSchoolScreenings();

    } catch (error) {
      console.error('Error creating re-screen:', error);
      setSnackbar({
        open: true,
        message: `Error creating re-screen: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const getSelectedStudent = () => {
    return students.find(student => student.id === formData.patient_id);
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to format gender
  const formatGender = (gender: string): string => {
    if (!gender) return 'Not specified';
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
      case '1':
        return 'ชาย';
      case 'female':
      case 'f':
      case '2':
        return 'หญิง';
      default:
        return gender;
    }
  };

  const getSelectedTeacher = () => {
    return teachers.find(teacher => teacher.id === formData.examiner_id);
  };

  // Helper function to get total screenings count for a student
  const getStudentTotalScreenings = (studentId: string) => {
    const group = groupedScreenings[studentId];
    return group ? group.totalScreenings : 1;
  };

  // Group screenings by student and get the most recent screening for each student
  const groupedScreenings = (Array.isArray(screenings) ? screenings : []).reduce((acc, screening) => {
    const studentId = screening.student_id;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        student: screening,
        totalScreenings: 1,
        allScreenings: [screening]
      };
    } else {
      acc[studentId].totalScreenings += 1;
      acc[studentId].allScreenings.push(screening);
      
      // Keep the most recent screening as the main record
      const currentDate = new Date(screening.screening_date);
      const existingDate = new Date(acc[studentId].student.screening_date);
      
      if (currentDate > existingDate) {
        acc[studentId].student = screening;
      }
    }
    
    return acc;
  }, {} as Record<string, { student: SchoolScreening; totalScreenings: number; allScreenings: SchoolScreening[] }>);

  // Convert grouped screenings to array and apply filters
  const filteredScreenings = Object.values(groupedScreenings).map(group => group.student).filter(screening => {
    // Filter by status
    if (filterStatus !== 'all' && screening.status !== filterStatus) {
      return false;
    }
    
    // Filter by screening type
    if (filterScreeningType !== 'all' && screening.screening_type !== filterScreeningType) {
      return false;
    }
    
    // Filter by student name
    if (filterStudent && !screening.student_name?.toLowerCase().includes(filterStudent.toLowerCase())) {
      return false;
    }
    
    // Filter by examiner name
    if (filterExaminer && !screening.teacher_name?.toLowerCase().includes(filterExaminer.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (filterDateFrom || filterDateTo) {
      const screeningDate = new Date(screening.screening_date);
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
      const toDate = filterDateTo ? new Date(filterDateTo) : null;
      
      if (fromDate && screeningDate < fromDate) {
        return false;
      }
      if (toDate && screeningDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  // Reset filters function
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterScreeningType('all');
    setFilterStudent('');
    setFilterExaminer('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const steps = [
    'Select Student',
    'Screening Setup',
    'Vision Assessment',
    'Results & Recommendations'
  ];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Show student selection only for new screenings, not for editing
        if (editingScreening) {
          return (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
                Student Information
              </Typography>
              
              {/* Show current student info when editing */}
              {formData.patient_id && getSelectedStudent() && (
                <Box sx={{ p: 3, bgcolor: '#f3f4f6', border: '2px solid #3b82f6', borderRadius: 2, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#1e40af', fontWeight: 'bold' }}>
                    📋 Current Screening Student
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#1f2937', fontWeight: '600' }}>
                    {getSelectedStudent()?.first_name || 'ไม่ระบุ'} {getSelectedStudent()?.last_name || 'ไม่ระบุ'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>รหัสนักเรียน:</strong> {getSelectedStudent()?.student_code || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>โรงเรียน:</strong> {getSelectedStudent()?.school_name || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>ระดับชั้น:</strong> {getSelectedStudent()?.grade_level || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>อายุ:</strong> {getSelectedStudent()?.date_of_birth ? `${calculateAge(getSelectedStudent()?.date_of_birth || '')} ปี` : 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>เพศ:</strong> {formatGender(getSelectedStudent()?.gender || '')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: '#374151' }}>
                        <strong style={{ color: '#1e40af' }}>ผู้ปกครอง:</strong> {getSelectedStudent()?.parent_name || 'ไม่ระบุ'}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #d1d5db' }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
                      การตรวจคัดกรองนี้สำหรับนักเรียนข้างต้น คุณสามารถดำเนินการขั้นตอนต่อไปเพื่ออัปเดตรายละเอียดการตรวจคัดกรอง
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        }
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Student Selection
            </Typography>
            
            {/* Quick Start Option */}
            <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      Start Screening Without Student
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Begin the school screening workflow and add student information later
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, patient_id: '' }));
                      setActiveStep(1);
                    }}
                  >
                    Start Screening
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Student Selection Tabs */}
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="School Students" icon={<SchoolIcon />} />
              <Tab label="Manual Registration" icon={<PersonIcon />} />
              <Tab label="Citizen Card Reader" icon={<CreditCard />} />
            </Tabs>

            {/* Search and Filter */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search students"
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
                      <MenuItem value="all">All Students</MenuItem>
                      <MenuItem value="school">School Students</MenuItem>
                      <MenuItem value="manual">Manual Registration</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Student List */}
            <Card>
              <CardContent>
                <List>
                  {filteredStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      button
                      onClick={() => handleStudentSelect(student)}
                      sx={{
                        border: '1px solid',
                        borderColor: formData.patient_id === student.id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={student.photo_url}
                          sx={{ bgcolor: 'primary.main' }}
                        >
                          {student.photo_url ? null : <PersonIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${student.first_name} ${student.last_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Student Code: {student.student_code}
                              {student.school_name && ` • School: ${student.school_name}`}
                              {student.grade_level && ` • Grade: ${student.grade_level}`}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={<SchoolIcon />}
                                label="School Student"
                                size="small"
                                color="primary"
                                sx={{ mr: 1 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <Box>
                        <Button
                          variant="contained"
                          startIcon={<AssessmentIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentSelect(student);
                          }}
                        >
                          Select Student
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleManualPatientAdd}
              >
                Add New Student
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreditCard />}
                onClick={handleCitizenCardRead}
              >
                Read Citizen Card
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Screening Setup
            </Typography>
            
            {/* Student Profile Section - Always at the top */}
            {formData.patient_id && getSelectedStudent() && (
              <Card sx={{ mb: 3, border: '2px solid #3b82f6', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 'bold' }}>
                      👤 Student Profile
                    </Typography>
                    <Chip 
                      label="Active Student" 
                      color="primary" 
                      size="small" 
                      variant="filled"
                    />
                  </Box>
                  
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={3} md={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                          src={getSelectedStudent()?.photo_url}
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: 'primary.main',
                            fontSize: '2rem'
                          }}
                        >
                          {getSelectedStudent()?.photo_url ? null : (
                            <PersonIcon sx={{ fontSize: '2rem' }} />
                          )}
                        </Avatar>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={9} md={10}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" sx={{ color: '#1f2937', fontWeight: '600', mb: 1 }}>
                            {getSelectedStudent()?.first_name || 'ไม่ระบุ'} {getSelectedStudent()?.last_name || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>รหัสนักเรียน:</strong> {getSelectedStudent()?.student_code || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>โรงเรียน:</strong> {getSelectedStudent()?.school_name || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>ระดับชั้น:</strong> {getSelectedStudent()?.grade_level || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            <strong>อายุ:</strong> {getSelectedStudent()?.date_of_birth ? `${calculateAge(getSelectedStudent()?.date_of_birth || '')} ปี` : 'ไม่ระบุ'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>วันเกิด:</strong> {formatDate(getSelectedStudent()?.date_of_birth || '')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>เพศ:</strong> {formatGender(getSelectedStudent()?.gender || '')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                            <strong>ผู้ปกครอง:</strong> {getSelectedStudent()?.parent_name || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            <strong>เบอร์โทรผู้ปกครอง:</strong> {getSelectedStudent()?.parent_phone || 'ไม่ระบุ'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher/Examiner</InputLabel>
                  <Select
                    value={formData.examiner_id}
                    label="Teacher/Examiner"
                    onChange={(e) => setFormData({ ...formData, examiner_id: e.target.value })}
                    disabled={user?.role === 'teacher'} // Disable for teachers
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
                  <InputLabel>
                    Screening Type *
                  </InputLabel>
                  <Select
                    value={formData.screening_type}
                    label="Screening Type *"
                    onChange={(e) => setFormData({ ...formData, screening_type: e.target.value })}
                  >
                    <MenuItem value="basic_school">Basic School</MenuItem>
                    <MenuItem value="vision_test">Vision Test</MenuItem>
                    <MenuItem value="comprehensive_vision">Comprehensive Vision</MenuItem>
                    <MenuItem value="color_blindness">Color Blindness</MenuItem>
                    <MenuItem value="depth_perception">Depth Perception</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    Equipment Used {!editingScreening && '*'}
                  </InputLabel>
                  <Select
                    value={formData.equipment_used}
                    label={`Equipment Used ${!editingScreening ? '*' : ''}`}
                    onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                  >
                    <MenuItem value="snellen_chart">Snellen Chart</MenuItem>
                    <MenuItem value="tumbling_e">Tumbling E Chart</MenuItem>
                    <MenuItem value="lea_symbols">Lea Symbols</MenuItem>
                    <MenuItem value="digital_screener">Digital Vision Screener</MenuItem>
                    <MenuItem value="manual_test">Manual Testing</MenuItem>
                  </Select>
                  {editingScreening && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Equipment is optional for editing existing screenings
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes about the screening setup..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Vision Assessment
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Distance Vision</Typography>
                <TextField
                  fullWidth
                  label="Left Eye"
                  value={screeningResults.left_eye_distance}
                  onChange={(e) => setScreeningResults({ ...screeningResults, left_eye_distance: e.target.value })}
                  placeholder="e.g., 20/20"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Right Eye"
                  value={screeningResults.right_eye_distance}
                  onChange={(e) => setScreeningResults({ ...screeningResults, right_eye_distance: e.target.value })}
                  placeholder="e.g., 20/20"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Near Vision</Typography>
                <TextField
                  fullWidth
                  label="Left Eye"
                  value={screeningResults.left_eye_near}
                  onChange={(e) => setScreeningResults({ ...screeningResults, left_eye_near: e.target.value })}
                  placeholder="e.g., 20/20"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Right Eye"
                  value={screeningResults.right_eye_near}
                  onChange={(e) => setScreeningResults({ ...screeningResults, right_eye_near: e.target.value })}
                  placeholder="e.g., 20/20"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Color Vision</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={screeningResults.color_vision}
                    onChange={(e) => setScreeningResults({ ...screeningResults, color_vision: e.target.value as any })}
                  >
                    <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                    <FormControlLabel value="deficient" control={<Radio />} label="Deficient" />
                    <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Depth Perception</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={screeningResults.depth_perception}
                    onChange={(e) => setScreeningResults({ ...screeningResults, depth_perception: e.target.value as any })}
                  >
                    <FormControlLabel value="normal" control={<Radio />} label="Normal" />
                    <FormControlLabel value="impaired" control={<Radio />} label="Impaired" />
                    <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
              Results & Recommendations
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Assessment Notes"
                  value={screeningResults.notes}
                  onChange={(e) => setScreeningResults({ ...screeningResults, notes: e.target.value })}
                  placeholder="Enter detailed assessment notes..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Recommendations"
                  value={screeningResults.recommendations}
                  onChange={(e) => setScreeningResults({ ...screeningResults, recommendations: e.target.value })}
                  placeholder="Enter recommendations for follow-up care..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={screeningResults.follow_up_required}
                      onChange={(e) => setScreeningResults({ ...screeningResults, follow_up_required: e.target.checked })}
                    />
                  }
                  label="Follow-up Required"
                />
              </Grid>
              {screeningResults.follow_up_required && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Follow-up Date"
                    value={screeningResults.follow_up_date}
                    onChange={(e) => setScreeningResults({ ...screeningResults, follow_up_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading...</Typography>
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
            <AssessmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            School Screenings
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            School Screenings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage school-based vision screening sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateScreening}
        >
          Create New School Screening
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {screenings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Screenings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {screenings.filter(s => s.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {screenings.filter(s => s.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="secondary.main">
                {screenings.filter(s => s.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {students.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent School Screenings
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
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
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Screening Type</InputLabel>
                    <Select
                      value={filterScreeningType}
                      label="Screening Type"
                      onChange={(e) => setFilterScreeningType(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="basic_school">Basic School</MenuItem>
                      <MenuItem value="vision_test">Vision Test</MenuItem>
                      <MenuItem value="comprehensive_vision">Comprehensive Vision</MenuItem>
                      <MenuItem value="color_blindness">Color Blindness</MenuItem>
                      <MenuItem value="depth_perception">Depth Perception</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Student Name"
                    value={filterStudent}
                    onChange={(e) => setFilterStudent(e.target.value)}
                    placeholder="Search student..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Examiner Name"
                    value={filterExaminer}
                    onChange={(e) => setFilterExaminer(e.target.value)}
                    placeholder="Search examiner..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={resetFilters}
                    startIcon={<Clear />}
                  >
                    Clear Filters
                  </Button>
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                    {filteredScreenings.length} of {screenings.length} screenings
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Examiner</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredScreenings.map((screening) => (
                  <TableRow key={screening.screening_id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {screening.student_name}
                        </Typography>
                        {getStudentTotalScreenings(screening.student_id) > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            {getStudentTotalScreenings(screening.student_id)} screenings
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{screening.teacher_name}</TableCell>
                    <TableCell>{screening.screening_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={screening.status}
                        color={screening.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(screening.screening_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewScreening(screening)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Student History">
                        <IconButton onClick={() => handleViewStudentHistory(screening)}>
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Screening">
                        <IconButton onClick={() => handleEditScreening(screening)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Re-screen Student">
                        <IconButton onClick={() => handleRescreenStudent(screening)}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Screening">
                        <IconButton onClick={() => handleDeleteScreening(screening.screening_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          // Check if there are unsaved changes
          if (formData.patient_id || formData.screening_type || 
              screeningResults.left_eye_distance || screeningResults.right_eye_distance ||
              screeningResults.left_eye_near || screeningResults.right_eye_near ||
              screeningResults.notes || screeningResults.recommendations) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              setOpenDialog(false);
              setEditingScreening(null);
              resetFormData();
            }
          } else {
            setOpenDialog(false);
            setEditingScreening(null);
            resetFormData();
          }
        }} 
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown={true}
      >
        <DialogTitle>
          {editingScreening ? 'Edit School Screening' : 'Create New School Screening'} - {steps[activeStep]}
        </DialogTitle>
        <DialogContent>
          {/* Enhanced Stepper with Arrows */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <Stepper 
              activeStep={editingScreening ? activeStep - 1 : activeStep} 
              alternativeLabel
              sx={{
                '& .MuiStepLabel-root': {
                  '& .MuiStepLabel-label': {
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                    '&.Mui-completed': {
                      color: 'success.main',
                      fontWeight: 600,
                    }
                  },
                  '& .MuiStepLabel-iconContainer': {
                    '& .MuiStepIcon-root': {
                      fontSize: '1.5rem',
                      '&.Mui-active': {
                        color: 'primary.main',
                      },
                      '&.Mui-completed': {
                        color: 'success.main',
                      }
                    }
                  }
                },
                '& .MuiStepConnector-root': {
                  '& .MuiStepConnector-line': {
                    borderColor: 'primary.light',
                    borderWidth: 2,
                    borderRadius: 1,
                  },
                  '&.Mui-active .MuiStepConnector-line': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-completed .MuiStepConnector-line': {
                    borderColor: 'success.main',
                  }
                }
              }}
            >
              {editingScreening ? (
                // Custom steps for editing mode with arrows
                [
                  <Step key="student-info">
                    <StepLabel 
                      StepIconComponent={({ active, completed }) => (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {completed ? '✓' : '1'}
                          </Box>
                          {active && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: -20,
                                transform: 'translateY(-50%)',
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}
                            >
                              →
                            </Box>
                          )}
                        </Box>
                      )}
                    >
                      Student Info
                    </StepLabel>
                  </Step>,
                  <Step key="screening-setup">
                    <StepLabel 
                      StepIconComponent={({ active, completed }) => (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {completed ? '✓' : '2'}
                          </Box>
                          {active && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: -20,
                                transform: 'translateY(-50%)',
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}
                            >
                              →
                            </Box>
                          )}
                        </Box>
                      )}
                    >
                      Screening Setup
                    </StepLabel>
                  </Step>,
                  <Step key="vision-assessment">
                    <StepLabel 
                      StepIconComponent={({ active, completed }) => (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {completed ? '✓' : '3'}
                          </Box>
                          {active && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: -20,
                                transform: 'translateY(-50%)',
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}
                            >
                              →
                            </Box>
                          )}
                        </Box>
                      )}
                    >
                      Vision Assessment
                    </StepLabel>
                  </Step>,
                  <Step key="results">
                    <StepLabel 
                      StepIconComponent={({ active, completed }) => (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {completed ? '✓' : '4'}
                          </Box>
                        </Box>
                      )}
                    >
                      Results & Recommendations
                    </StepLabel>
                  </Step>
                ]
              ) : (
                // Original steps for create mode with arrows
                steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel 
                      StepIconComponent={({ active, completed }) => (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {completed ? '✓' : index + 1}
                          </Box>
                          {active && index < steps.length - 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                right: -20,
                                transform: 'translateY(-50%)',
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}
                            >
                              →
                            </Box>
                          )}
                        </Box>
                      )}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))
              )}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ mt: 3 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Selected Student Info */}
          {formData.patient_id && getSelectedStudent() && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {editingScreening ? 'Screening Student:' : 'Selected Student:'}
              </Typography>
              <Typography variant="body2">
                {getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name} 
                ({getSelectedStudent()?.student_code}) - {getSelectedStudent()?.school_name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
                          <Button onClick={() => {
                  setOpenDialog(false);
                  setEditingScreening(null);
                  resetFormData();
                }}>
                  Cancel
                </Button>
          {activeStep > (editingScreening ? 1 : 0) && (
            <Button onClick={handlePreviousStep} startIcon={<ArrowBack />}>
              Previous
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNextStep} variant="contained" endIcon={<ArrowForward />}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSaveScreening} variant="contained" startIcon={<Save />}>
              {editingScreening ? 'Update Screening' : 'Save Screening'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Screening Details
        </DialogTitle>
        <DialogContent>
          {viewingScreening && (
            <Box>
              <Typography variant="h6" gutterBottom>Student Information</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {viewingScreening.student_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Examiner:</strong> {viewingScreening.teacher_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Screening Type:</strong> {viewingScreening.screening_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography><strong>Status:</strong></Typography>
                    <Chip
                      label={viewingScreening.status}
                      color={viewingScreening.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Date:</strong> {new Date(viewingScreening.screening_date || viewingScreening.created_at).toLocaleDateString()} 
                  </Typography>
                </Grid>
                {viewingScreening.school_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>School:</strong> {viewingScreening.school_name}</Typography>
                  </Grid>
                )}
                {viewingScreening.grade_level && (
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Grade Level:</strong> {viewingScreening.grade_level}</Typography>
                  </Grid>
                )}
              </Grid>
              {viewingScreening.results && viewingScreening.results.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Results</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Eye</strong></TableCell>
                          <TableCell><strong>Distance Acuity</strong></TableCell>
                          <TableCell><strong>Near Acuity</strong></TableCell>
                          <TableCell><strong>Color Vision</strong></TableCell>
                          <TableCell><strong>Depth Perception</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingScreening.results.map((res: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{res.eye || '-'}</TableCell>
                            <TableCell>{res.distance_acuity || '-'}</TableCell>
                            <TableCell>{res.near_acuity || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={res.color_vision || '-'}
                                color={res.color_vision === 'normal' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={res.depth_perception || '-'}
                                color={res.depth_perception === 'normal' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {viewingScreening.results.some((r: any) => r && r.additional_tests) && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>Additional Tests</Typography>
                      <Grid container spacing={2}>
                        {viewingScreening.results.map((res: any, idx: number) => (
                          res?.additional_tests ? (
                            <Grid item xs={12} md={6} key={`addl-${idx}`}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2" gutterBottom>Eye: {res.eye || '-'}</Typography>
                                  <List dense>
                                    {Object.entries(res.additional_tests).map(([k, v]) => (
                                      <ListItem key={k} disableGutters>
                                        <ListItemText primaryTypographyProps={{ variant: 'body2' }}
                                          primary={`${k.replace(/_/g, ' ')}: ${String(v)}`} />
                                      </ListItem>
                                    ))}
                                  </List>
                                </CardContent>
                              </Card>
                            </Grid>
                          ) : null
                        ))}
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<PrintIcon />} 
            onClick={() => handlePrintScreening(viewingScreening)}
            variant="outlined"
            color="primary"
          >
            Print
          </Button>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Student History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Student Screening History
        </DialogTitle>
        <DialogContent>
          {studentHistory && (
            <Box>
              {/* Student Info */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Student Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {studentHistory.student_info.student_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Grade:</strong> {studentHistory.student_info.grade_level}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>School:</strong> {studentHistory.student_info.school_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Total Screenings:</strong> {studentHistory.total_screenings}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Screening History */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Screening History ({studentHistory.total_screenings} records)
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Examiner</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Re-screen</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentHistory.screening_history.map((screening: any, index: number) => (
                      <TableRow key={screening.screening_id}>
                        <TableCell>
                          {new Date(screening.screening_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={screening.screening_type} 
                            size="small" 
                            color="primary" 
                          />
                        </TableCell>
                        <TableCell>{screening.teacher_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={screening.status}
                            color={screening.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {screening.is_rescreen ? (
                            <Chip
                              label="Re-screen"
                              color="info"
                              size="small"
                              icon={<RefreshIcon />}
                            />
                          ) : (
                            <Chip
                              label="Original"
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setViewingScreening(screening);
                                setHistoryDialog(false);
                                setViewDialog(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
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
