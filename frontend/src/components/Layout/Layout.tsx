import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Logo from '../Logo/Logo';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Logo size="medium" />
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit">Dashboard</Button>
          <Button color="inherit">Patients</Button>
          <Button color="inherit">Screenings</Button>
          <Button color="inherit">Reports</Button>
          <Button color="inherit">Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
