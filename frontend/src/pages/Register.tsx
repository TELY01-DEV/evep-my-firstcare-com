import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Register: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Register
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Registration functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
