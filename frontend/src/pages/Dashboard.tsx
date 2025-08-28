import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        EVEP Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#9B7DCF' }}>
                Total Patients
              </Typography>
              <Typography variant="h4">
                1,234
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#9B7DCF' }}>
                Screenings Today
              </Typography>
              <Typography variant="h4">
                45
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#9B7DCF' }}>
                Pending Results
              </Typography>
              <Typography variant="h4">
                12
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#9B7DCF' }}>
                System Status
              </Typography>
              <Typography variant="h4" color="success.main">
                Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Welcome to EVEP
        </Typography>
        <Typography variant="body1">
          Early Vision Evaluation Platform is designed to provide comprehensive vision screening 
          for children aged 6-12 years with AI-powered analysis and seamless communication 
          between healthcare providers, parents, and educational institutions.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
