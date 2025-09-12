import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAdminAuth } from '../../contexts/AdminAuthContext.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAdminAuth();
  const theme = useTheme();

  console.log('🛡️ PROTECTED ROUTE CHECK:');
  console.log('⏳ Loading:', loading);
  console.log('🔐 Is Authenticated:', isAuthenticated);
  console.log('👤 User:', user);
  console.log('👑 User Role:', user?.role);

  // Show loading while checking authentication
  if (loading) {
    console.log('⏳ Showing loading screen...');
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ 
          background: `linear-gradient(135deg, #F8FAFC 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" color={theme.palette.primary.main} fontWeight={600}>
          Loading EVEP Admin Panel...
        </Typography>
        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mt: 1 }}>
          System Administration & Control Center
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin privileges
  if (user && (user.role !== 'admin' && user.role !== 'super_admin')) {
    console.log('❌ User does not have admin privileges, showing access denied...');
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ 
          background: `linear-gradient(135deg, #F8FAFC 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <Typography variant="h4" color={theme.palette.error.main} fontWeight={600} gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color={theme.palette.text.secondary} textAlign="center" sx={{ maxWidth: 400 }}>
          You do not have permission to access the EVEP Admin Panel. 
          Admin privileges are required.
        </Typography>
        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mt: 2 }}>
          Current role: {user.role}
        </Typography>
      </Box>
    );
  }

  // Render children if authenticated and authorized
  console.log('✅ User authenticated and authorized, rendering protected content...');
  return <>{children}</>;
};

export default ProtectedRoute;



