import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Patients: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patients
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Patient management functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Patients;
