import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  School,
  FamilyRestroom,
  MedicalServices,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Edit,
  Visibility,
  Assessment,
  History,
  DocumentScanner,
  // Insurance,
  Warning,
  CheckCircle,
  Info,
} from '@mui/icons-material';

interface PatientProfileViewProps {
  patient: any;
  onEdit?: () => void;
  onViewScreenings?: () => void;
  onViewDocuments?: () => void;
  loading?: boolean;
}

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
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  onEdit,
  onViewScreenings,
  onViewDocuments,
  loading = false,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '👦';
      case 'female':
        return '👧';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                }}
              >
                {getGenderIcon(patient.gender)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {patient.first_name} {patient.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {calculateAge(patient.date_of_birth)} years old • {patient.gender}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Chip
                  label={patient.status}
                  color={getStatusColor(patient.status) as any}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Patient ID: {patient._id}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box display="flex" gap={1}>
                {onEdit && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )}
                {onViewScreenings && (
                  <Button
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={onViewScreenings}
                  >
                    View Screenings
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="patient tabs">
          <Tab label="Overview" />
          <Tab label="Medical History" />
          <Tab label="School Information" />
          <Tab label="Insurance" />
          <Tab label="Documents" />
          <Tab label="Screening History" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={`${patient.first_name} ${patient.last_name}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday />
                      </ListItemIcon>
                      <ListItemText
                        primary="Date of Birth"
                        secondary={new Date(patient.date_of_birth).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText
                        primary="Gender"
                        secondary={patient.gender}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <FamilyRestroom />
                      </ListItemIcon>
                      <ListItemText
                        primary="Parent/Guardian"
                        secondary={patient.parent_name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText
                        primary="Parent Phone"
                        secondary={patient.parent_phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText
                        primary="Parent Email"
                        secondary={patient.parent_email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText
                        primary="Emergency Contact"
                        secondary={`${patient.emergency_contact} - ${patient.emergency_phone}`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Address
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn color="action" />
                    <Typography>
                      {patient.address}, {patient.city} {patient.postal_code}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Medical History
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {patient.medical_history || 'No medical history recorded'}
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Family Vision History
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {patient.family_vision_history || 'No family vision history recorded'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Allergies
                  </Typography>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {patient.allergies.map((allergy: string) => (
                        <Chip
                          key={allergy}
                          label={allergy}
                          color="warning"
                          variant="outlined"
                          icon={<Warning />}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No allergies recorded
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Medications
                  </Typography>
                  {patient.medications && patient.medications.length > 0 ? (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {patient.medications.map((medication: string) => (
                        <Chip
                          key={medication}
                          label={medication}
                          color="info"
                          variant="outlined"
                          icon={<MedicalServices />}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No medications recorded
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* School Information Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                School Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="subtitle1">
                        {patient.school || 'School not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.grade || 'Grade not specified'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">
                    Student ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {patient.student_id || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Insurance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insurance Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">
                    Insurance Provider
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {patient.insurance_provider || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">
                    Insurance Number
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {patient.insurance_number || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">
                    Insurance Group
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {patient.insurance_group || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Documents
                </Typography>
                {onViewDocuments && (
                  <Button
                    variant="outlined"
                    startIcon={<DocumentScanner />}
                    onClick={onViewDocuments}
                  >
                    View All Documents
                  </Button>
                )}
              </Box>
              
              {patient.documents && patient.documents.length > 0 ? (
                <List>
                  {patient.documents.map((doc: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <DocumentScanner />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={`Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No documents uploaded
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Screening History Tab */}
        <TabPanel value={tabValue} index={5}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Screening History
                </Typography>
                {onViewScreenings && (
                  <Button
                    variant="outlined"
                    startIcon={<History />}
                    onClick={onViewScreenings}
                  >
                    View All Screenings
                  </Button>
                )}
              </Box>
              
              {patient.screening_history && patient.screening_history.length > 0 ? (
                <List>
                  {patient.screening_history.slice(0, 5).map((screening: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Assessment />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Screening on ${new Date(screening.date).toLocaleDateString()}`}
                        secondary={`Type: ${screening.type} • Status: ${screening.status}`}
                      />
                      <Chip
                        label={screening.status}
                        color={screening.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No screening history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PatientProfileView;
