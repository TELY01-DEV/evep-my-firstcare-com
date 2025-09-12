import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  LocalHospital as MedicalIcon,
  Science as DiagnosticIcon,
  School as BasicIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import RBACScreeningDropdown from './RBACScreeningDropdown';
import {
  SCREENING_TYPES_RBAC,
  getAvailableScreeningTypes,
  getAvailableCategories,
  canAccessScreeningType,
} from '../../utils/screeningRBAC';

const RBACScreeningDemo: React.FC = () => {
  const { user } = useAuth();
  const [selectedScreeningType, setSelectedScreeningType] = useState('');
  const [simulatedRole, setSimulatedRole] = useState(user?.role || 'teacher');

  // Get data based on current or simulated role
  const currentRole = simulatedRole || user?.role || 'teacher';
  const availableScreeningTypes = getAvailableScreeningTypes(currentRole);
  const availableCategories = getAvailableCategories(currentRole);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic':
        return <BasicIcon fontSize="small" />;
      case 'advanced':
        return <VisibilityIcon fontSize="small" />;
      case 'specialized':
        return <MedicalIcon fontSize="small" />;
      case 'diagnostic':
        return <DiagnosticIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return 'success';
      case 'advanced':
        return 'primary';
      case 'specialized':
        return 'secondary';
      case 'diagnostic':
        return 'error';
      default:
        return 'default';
    }
  };

  const roleOptions = [
    'super_admin',
    'admin', 
    'medical_admin',
    'doctor',
    'nurse',
    'medical_staff',
    'teacher',
    'guest'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h5" component="h1">
              RBAC Screening Demo
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            This demo shows how screening types are filtered based on user roles. 
            Different roles have access to different screening types and categories.
          </Alert>

          <Grid container spacing={3}>
            {/* Current User Info */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">Current User</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Role:</strong> {user?.role || 'Not authenticated'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Name:</strong> {user?.first_name || 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Role Simulator */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Role Simulator
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Simulate Role</InputLabel>
                    <Select
                      value={simulatedRole}
                      label="Simulate Role"
                      onChange={(e) => {
                        setSimulatedRole(e.target.value);
                        setSelectedScreeningType(''); // Reset selection
                      }}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Access Summary */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Access Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Available Types:</strong> {availableScreeningTypes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Categories:</strong> {availableCategories.length}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {availableCategories.map(category => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        color={getCategoryColor(category) as any}
                        variant="outlined"
                        icon={getCategoryIcon(category)}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* RBAC Screening Dropdown Demo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            RBAC Screening Dropdown
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This dropdown automatically filters screening types based on the selected role.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <RBACScreeningDropdown
                label="Available Screening Types"
                value={selectedScreeningType}
                onChange={setSelectedScreeningType}
                showAccessInfo
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedScreeningType && (
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Selected:</strong> {selectedScreeningType}
                  </Typography>
                  <Typography variant="caption">
                    Access granted for role: {currentRole}
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Screening Types Matrix */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Screening Types Access Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Shows which screening types are available to the current role ({currentRole}).
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Screening Type</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Access</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SCREENING_TYPES_RBAC.map((screeningType) => {
                  const hasAccess = canAccessScreeningType(currentRole, screeningType.value);
                  
                  return (
                    <TableRow 
                      key={screeningType.value}
                      sx={{ 
                        opacity: hasAccess ? 1 : 0.5,
                        backgroundColor: hasAccess ? 'inherit' : 'action.hover'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getCategoryIcon(screeningType.category)}
                          {screeningType.label}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={screeningType.category}
                          size="small"
                          color={getCategoryColor(screeningType.category) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {screeningType.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hasAccess ? 'Granted' : 'Denied'}
                          size="small"
                          color={hasAccess ? 'success' : 'error'}
                          variant={hasAccess ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <SecurityIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Role-based access control ensures users only see screening types appropriate for their level of training and authorization.
              This improves security, reduces confusion, and ensures compliance with medical protocols.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RBACScreeningDemo;
