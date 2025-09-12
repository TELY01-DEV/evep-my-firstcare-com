import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
  Container
} from '@mui/material';
import {
  Block as BlockIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasMenuAccess, RBAC_MENU_CONFIG } from '../../utils/rbacMenuConfig';

interface RBACRouteProps {
  children: React.ReactNode;
  requiredPath: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

/**
 * RBAC Route Guard Component
 * Protects routes based on user role and RBAC configuration
 */
const RBACRoute: React.FC<RBACRouteProps> = ({
  children,
  requiredPath,
  fallbackPath = '/dashboard',
  showAccessDenied = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || '';

  // Check if user has access to this route
  const hasAccess = hasMenuAccess(userRole, requiredPath);

  // Get required roles for this path
  const menuConfig = RBAC_MENU_CONFIG[requiredPath];
  const requiredRoles = menuConfig?.roles || ['super_admin'];

  if (!hasAccess) {
    if (!showAccessDenied) {
      // Silently redirect
      navigate(fallbackPath);
      return null;
    }

    // Show access denied page
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <BlockIcon 
              color="error" 
              sx={{ fontSize: 80, mb: 2 }} 
            />
            
            <Typography variant="h4" gutterBottom color="error">
              Access Denied
            </Typography>
            
            <Typography variant="h6" gutterBottom color="text.secondary">
              Insufficient Permissions
            </Typography>
            
            <Alert severity="warning" sx={{ my: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Your Role:</strong> {userRole}<br />
                <strong>Required Roles:</strong> {requiredRoles.join(', ')}<br />
                <strong>Requested Path:</strong> {requiredPath}
              </Typography>
            </Alert>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You don't have the necessary permissions to access this page. 
              Please contact your administrator if you believe this is an error.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(fallbackPath)}
              >
                Go to Dashboard
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => navigate('/dashboard/panel-settings/rbac')}
                disabled={!hasMenuAccess(userRole, '/dashboard/panel-settings/rbac')}
              >
                RBAC Management
              </Button>
            </Box>
            
            {/* Role Information */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <SecurityIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                For access to additional features, please contact your system administrator 
                to review your role permissions.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // User has access, render the protected content
  return <>{children}</>;
};

export default RBACRoute;

