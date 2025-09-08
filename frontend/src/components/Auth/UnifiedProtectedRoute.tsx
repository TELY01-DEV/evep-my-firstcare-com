/**
 * Unified Protected Route Component with Blockchain Authentication
 * Replaces both ProtectedRoute components
 * Provides consistent route protection across Medical Portal and Admin Panel
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

interface UnifiedProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  adminOnly?: boolean;
  redirectTo?: string;
}

const UnifiedProtectedRoute: React.FC<UnifiedProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  adminOnly = false,
  redirectTo = '/login'
}) => {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    hasRole, 
    hasPermission, 
    isAdmin,
    refreshToken 
  } = useUnifiedAuth();
  
  const [isChecking, setIsChecking] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const theme = useTheme();
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();
  }, [isAuthenticated, user]);

  const checkAuthentication = async () => {
    console.log('🔐 Checking authentication for protected route:', location.pathname);
    
    try {
      if (loading) {
        console.log('⏳ Auth still loading...');
        return;
      }

      if (!isAuthenticated) {
        console.log('❌ User not authenticated');
        setAuthCheckComplete(true);
        return;
      }

      if (!user) {
        console.log('❌ No user data available');
        setAuthCheckComplete(true);
        return;
      }

      // Check role requirements
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasRequiredRole = roles.some(role => hasRole(role));
        
        if (!hasRequiredRole) {
          console.log('❌ User does not have required role:', requiredRole);
          console.log('   User role:', user.role);
          setAuthCheckComplete(true);
          return;
        }
      }

      // Check admin requirements
      if (adminOnly && !isAdmin()) {
        console.log('❌ Admin access required but user is not admin');
        console.log('   User role:', user.role);
        setAuthCheckComplete(true);
        return;
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission)) {
        console.log('❌ User does not have required permission:', requiredPermission);
        setAuthCheckComplete(true);
        return;
      }

      console.log('✅ Authentication check passed for user:', user.email);
      console.log('   Role:', user.role);
      console.log('   Route:', location.pathname);
      
    } catch (error) {
      console.error('❌ Authentication check error:', error);
    } finally {
      setIsChecking(false);
      setAuthCheckComplete(true);
    }
  };

  // Show loading spinner while checking authentication
  if (loading || isChecking || !authCheckComplete) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
          color: 'white',
        }}
      >
        <CircularProgress 
          size={60} 
          sx={{ 
            color: 'white',
            mb: 2 
          }} 
        />
        <Typography variant="h6" sx={{ mb: 1 }}>
          🔐 Verifying Authentication
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Validating blockchain security...
        </Typography>
      </Box>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('🔄 Redirecting to login - not authenticated');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      console.log('🚫 Access denied - insufficient role');
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            color: 'white',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            🚫 Access Denied
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Insufficient Permissions
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Your role: {user.role}
          </Typography>
        </Box>
      );
    }
  }

  // Check admin requirements
  if (adminOnly && !isAdmin()) {
    console.log('🚫 Access denied - admin required');
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          🚫 Admin Access Required
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          This area is restricted to administrators
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Your role: {user.role}
        </Typography>
      </Box>
    );
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log('🚫 Access denied - insufficient permissions');
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          🚫 Access Denied
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Missing Required Permission
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Required permission: {requiredPermission}
        </Typography>
      </Box>
    );
  }

  // All checks passed, render the protected content
  console.log('✅ Rendering protected content for:', user.email);
  return <>{children}</>;
};

export default UnifiedProtectedRoute;



