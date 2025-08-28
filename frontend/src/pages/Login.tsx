import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Login: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Login functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
