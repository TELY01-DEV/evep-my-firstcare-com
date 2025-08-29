import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  MedicalServices as MedicalServicesIcon,
  HealthAndSafety as HealthIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 280;

interface MedicalLayoutProps {
  children?: React.ReactNode;
}

const MedicalLayout: React.FC<MedicalLayoutProps> = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('evep_token');
    localStorage.removeItem('evep_user');
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      badge: null,
    },
    {
      text: 'Patient Management',
      icon: <PeopleIcon />,
      path: '/dashboard/patients',
      badge: null,
    },
    {
      text: 'Vision Screenings',
      icon: <VisibilityIcon />,
      path: '/dashboard/screenings',
      badge: 'New',
    },
    {
      text: 'Medical Reports',
      icon: <AssessmentIcon />,
      path: '/dashboard/reports',
      badge: null,
    },
    {
      text: 'Health Analytics',
      icon: <HealthIcon />,
      path: '/dashboard/analytics',
      badge: null,
    },
    {
      text: 'Security Audit',
      icon: <SecurityIcon />,
      path: '/dashboard/security',
      badge: null,
    },
  ];

  const drawer = (
    <Box>
      {/* Medical Professional Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing(3, 2),
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          backgroundColor: '#E3F2FD',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: 48,
              height: 48,
              padding: 0.5,
            }}
          >
            <img 
              src="/evep-logo.png" 
              alt="EVEP Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600} color="primary">
              EVEP
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Medical Professional Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ padding: theme.spacing(2, 0) }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                margin: theme.spacing(0, 2),
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="primary"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ margin: theme.spacing(2, 0) }} />

      {/* Quick Actions */}
      <Box sx={{ padding: theme.spacing(2) }}>
        <Typography variant="overline" color="text.secondary" fontWeight={600}>
          Quick Actions
        </Typography>
        <List sx={{ padding: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/dashboard/patients/new')}
              sx={{ borderRadius: 2, marginTop: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MedicalServicesIcon />
              </ListItemIcon>
              <ListItemText primary="New Patient" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/dashboard/screenings/new')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <VisibilityIcon />
              </ListItemIcon>
              <ListItemText primary="New Screening" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'EVEP Medical Panel'}
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          paddingBottom: '80px', // Space for footer
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      
      {/* Copyright Footer */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: { xs: 0, sm: drawerWidth },
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${theme.palette.grey[200]}`,
          padding: theme.spacing(1),
          zIndex: 1000,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              fontSize: '0.7rem',
              lineHeight: 1.4,
            }}
          >
            Copyright © 2023-2025 A Medical For You Co., Ltd. Bangkok Thailand
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              fontSize: '0.7rem',
              lineHeight: 1.4,
              fontFamily: '"Noto Sans Thai", sans-serif',
            }}
          >
            สงวนลิขสิทธิ์ © 2025 บริษัท อะเมดิคอล ฟอร์ ยู จำกัด กรุงเทพฯ ประเทศไทย
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MedicalLayout;
