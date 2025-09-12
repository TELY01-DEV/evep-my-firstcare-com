import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('evep_token');
      
      if (!token) {
        setIsAuthenticated(false);
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
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('evep_token');
        localStorage.removeItem('evep_user');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ 
          background: `linear-gradient(135deg, #F0F9FF 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" color={theme.palette.primary.main} fontWeight={600}>
          Loading EVEP Medical Panel...
        </Typography>
        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mt: 1 }}>
          Verifying medical professional credentials
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
