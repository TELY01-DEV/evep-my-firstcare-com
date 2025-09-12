import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem('evep_token');
      const userStr = localStorage.getItem('evep_user');
      
      if (!token || !userStr) {
        setIsAdmin(false);
        return;
      }

      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          // Token is expired
          localStorage.removeItem('evep_token');
          localStorage.removeItem('evep_user');
          setIsAdmin(false);
          return;
        }

        // Check if user is admin
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        // Invalid token or user data
        localStorage.removeItem('evep_token');
        localStorage.removeItem('evep_user');
        setIsAdmin(false);
      }
    };

    checkAdminAuth();
  }, []);

  // Show loading while checking authentication
  if (isAdmin === null) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ 
          background: `linear-gradient(135deg, #E3F2FD 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" color={theme.palette.primary.main} fontWeight={600}>
          Loading EVEP Admin Panel...
        </Typography>
        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mt: 1 }}>
          Verifying administrator credentials
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
