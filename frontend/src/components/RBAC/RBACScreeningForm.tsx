import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';
import {
  Security as SecurityIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  LocalHospital as MedicalIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasMenuAccess, RBAC_MENU_CONFIG } from '../../utils/rbacMenuConfig';

interface RBACScreeningFormProps {
  children: React.ReactNode;
  screeningType: string;
  requiredPath: string;
  fallbackPath?: string;
  showAccessInfo?: boolean;
}

/**
 * RBAC Wrapper for Screening Forms
 * Provides role-based access control for different screening interfaces
 */
const RBACScreeningForm: React.FC<RBACScreeningFormProps> = ({
  children,
  screeningType,
  requiredPath,
  fallbackPath = '/dashboard',
  showAccessInfo = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || '';

  // Check if user has access to this screening form
  const hasAccess = hasMenuAccess(userRole, requiredPath);

  // Get required roles for this screening type
  const menuConfig = RBAC_MENU_CONFIG[requiredPath];
  const requiredRoles = menuConfig?.roles || ['super_admin'];

  // Get screening type icon
  const getScreeningIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
      case 'mobile-vision':
        return <VisibilityIcon color="primary" sx={{ fontSize: 60 }} />;
      case 'standard':
      case 'standard-vision':
        return <AssessmentIcon color="primary" sx={{ fontSize: 60 }} />;
      case 'enhanced':
      case 'enhanced-interface':
        return <MedicalIcon color="primary" sx={{ fontSize: 60 }} />;
      case 'school':
      case 'school-screening':
        return <SchoolIcon color="primary" sx={{ fontSize: 60 }} />;
      case 'va':
      case 'va-interface':
        return <VisibilityIcon color="primary" sx={{ fontSize: 60 }} />;
      default:
        return <AssessmentIcon color="primary" sx={{ fontSize: 60 }} />;
    }
  };

  // Get role color for chips
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'primary';
      case 'medical_admin': return 'info';
      case 'doctor': return 'success';
      case 'nurse': return 'secondary';
      case 'teacher': return 'warning';
      default: return 'default';
    }
  };

  if (!hasAccess) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Box sx={{ mb: 3 }}>
              {getScreeningIcon(screeningType)}
            </Box>
            
            <Typography variant="h4" gutterBottom color="error">
              Screening Access Restricted
            </Typography>
            
            <Typography variant="h6" gutterBottom color="text.secondary">
              {screeningType} Screening Form
            </Typography>
            
            <Alert severity="warning" sx={{ my: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Your Role:</strong> {userRole}<br />
                <strong>Screening Type:</strong> {screeningType}<br />
                <strong>Required Access Level:</strong> Medical staff or authorized personnel
              </Typography>
            </Alert>

            <Box sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Roles with access to this screening form:</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {requiredRoles.map(role => (
                  <Chip
                    key={role}
                    label={role.replace('_', ' ').toUpperCase()}
                    color={getRoleColor(role) as any}
                    size="small"
                    variant={userRole === role ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This screening form requires medical training or authorized access. 
              Please contact your administrator if you need access to screening functions.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(fallbackPath)}
              >
                Go to Dashboard
              </Button>
              
              {hasMenuAccess(userRole, '/dashboard/panel-settings/rbac') && (
                <Button
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate('/dashboard/panel-settings/rbac')}
                >
                  RBAC Management
                </Button>
              )}
            </Box>

            {/* Screening Access Guidelines */}
            <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Screening Access Guidelines
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <MedicalIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Medical Professionals"
                    secondary="Doctors and nurses have full access to all screening forms"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Teachers"
                    secondary="Access to school-based and mobile screening forms"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Administrators"
                    secondary="Full access to all screening forms and management"
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // User has access, render the screening form with access info
  return (
    <Box>
      {/* Access Status Header (if enabled) */}
      {showAccessInfo && (
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity="success" 
            icon={<SecurityIcon />}
            sx={{ borderRadius: 2 }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                <strong>Screening Access Granted:</strong> {screeningType} Screening Form
              </Typography>
              <Chip
                label={userRole}
                color={getRoleColor(userRole) as any}
                size="small"
                variant="filled"
              />
            </Box>
          </Alert>
        </Box>
      )}

      {/* Render the protected screening form */}
      {children}
    </Box>
  );
};

export default RBACScreeningForm;

