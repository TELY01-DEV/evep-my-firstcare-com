import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Screenings: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Screenings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Vision screening functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Screenings;
