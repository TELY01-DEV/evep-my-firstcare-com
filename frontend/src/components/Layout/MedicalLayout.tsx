import React, { useState, useEffect } from 'react';
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
  School as SchoolIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  PersonOutline as ChildIcon,
  Inventory as InventoryIcon,
  LocalShipping as DeliveryIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

interface MedicalLayoutProps {
  children?: React.ReactNode;
}

const MedicalLayout: React.FC<MedicalLayoutProps> = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSystemAdmin, isMedicalAdmin } = useAuth();

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      text: 'Health Analytics',
      icon: <HealthIcon />,
      path: '/dashboard/analytics',
      badge: null,
    },
    {
      text: 'Medical Screening',
      icon: <MedicalServicesIcon />,
      path: '/dashboard/medical-screening',
      badge: 'New',
      children: [
        {
          text: 'Medical Reports',
          icon: <AssessmentIcon />,
          path: '/dashboard/reports',
          badge: null,
        },
        {
          text: 'Patient Management',
          icon: <PeopleIcon />,
          path: '/dashboard/patients',
          badge: null,
        },
        {
          text: 'Vision Screening',
          icon: <VisibilityIcon />,
          path: '/dashboard/screenings',
          badge: 'New',
        },
        {
          text: 'Patient Registration',
          icon: <PersonIcon />,
          path: '/dashboard/medical-screening/patient-registration',
          badge: 'New',
        },
        {
          text: 'VA Screening Interface',
          icon: <VisibilityIcon />,
          path: '/dashboard/medical-screening/va-screening',
          badge: 'New',
        },
        {
          text: 'Diagnosis & Treatment',
          icon: <AssessmentIcon />,
          path: '/dashboard/medical-screening/diagnosis',
          badge: 'New',
        },
        {
          text: 'Schedule Hospital Screening Appointment',
          icon: <ScheduleIcon />,
          path: '/dashboard/evep/appointments',
          badge: 'New',
        },
      ],
    },
    {
      text: 'School Management',
      icon: <SchoolIcon />,
      path: '/dashboard/evep',
      badge: 'New',
      children: [
        {
          text: 'Students',
          icon: <ChildIcon />,
          path: '/dashboard/evep/students',
          badge: null,
        },
        {
          text: 'Parents',
          icon: <GroupIcon />,
          path: '/dashboard/evep/parents',
          badge: null,
        },
        {
          text: 'Teachers',
          icon: <PersonIcon />,
          path: '/dashboard/evep/teachers',
          badge: null,
        },
        {
          text: 'Schools',
          icon: <SchoolIcon />,
          path: '/dashboard/evep/schools',
          badge: null,
        },
        {
          text: 'School-based Screening',
          icon: <AssessmentIcon />,
          path: '/dashboard/evep/school-screenings',
          badge: 'New',
        },
        {
          text: 'Glasses Inventory',
          icon: <InventoryIcon />,
          path: '/dashboard/glasses-management/inventory',
          badge: 'New',
        },
        {
          text: 'Glasses Delivery',
          icon: <DeliveryIcon />,
          path: '/dashboard/glasses-management/delivery',
          badge: 'New',
        },
      ],
    },

    {
      text: 'Security Audit',
      icon: <SecurityIcon />,
      path: '/dashboard/security',
      badge: null,
    },

    {
      text: 'Medical Staff Management',
      icon: <PersonIcon />,
      path: '/dashboard/medical-staff',
      badge: 'New',
      children: [
        {
          text: 'Staff Directory',
          icon: <PersonIcon />,
          path: '/dashboard/medical-staff',
          badge: 'New',
        },
        {
          text: 'Staff Management',
          icon: <PersonIcon />,
          path: '/dashboard/medical-staff/management',
          badge: 'New',
        },
      ],
    },
    {
      text: 'Inventory',
      icon: <InventoryIcon />,
      path: '/dashboard/inventory',
      badge: 'New',
      children: [
        {
          text: 'Glasses Inventory Management',
          icon: <InventoryIcon />,
          path: '/dashboard/glasses-management/inventory',
          badge: 'New',
        },
        {
          text: 'Glasses Delivery Management',
          icon: <DeliveryIcon />,
          path: '/dashboard/glasses-management/delivery',
          badge: 'New',
        },
      ],
    },
    {
      text: 'Panel Settings',
      icon: <SettingsIcon />,
      path: '/dashboard/panel-settings',
      badge: 'New',
      children: [
        {
          text: 'General Panel Settings',
          icon: <SettingsIcon />,
          path: '/dashboard/panel-settings/general',
          badge: 'New',
        },
        {
          text: 'RBAC Management',
          icon: <SecurityIcon />,
          path: '/dashboard/panel-settings/rbac',
          badge: 'New',
        },
      ],
    },
    {
      text: 'LINE Notifications',
      icon: <ChatIcon />,
      path: '/dashboard/line-notifications',
      badge: 'New',
    },
    // Admin Panel Access (System Admin Only)
    ...(isSystemAdmin() ? [{
      text: 'Admin Panel',
      icon: <SettingsIcon />,
      path: 'http://localhost:3015',
      badge: 'System',
      external: true,
    }] : []),
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
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path))}
                onClick={() => {
                  if (item.external) {
                    // Open external link in new tab
                    window.open(item.path, '_blank');
                  } else if (item.children) {
                    // Handle nested menu - for now just navigate to first child
                    navigate(item.children[0].path);
                  } else {
                    navigate(item.path);
                  }
                }}
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
                    color: (location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path)))
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: (location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path))) ? 600 : 400,
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
            
            {/* Render nested menu items */}
            {item.children && item.children.map((child) => (
              <ListItem key={child.text} disablePadding sx={{ pl: 4 }}>
                <ListItemButton
                  selected={location.pathname === child.path}
                  onClick={() => navigate(child.path)}
                  sx={{
                    margin: theme.spacing(0, 2),
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main,
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
                      color: location.pathname === child.path 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.text.secondary,
                    }}
                  >
                    {child.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={child.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === child.path ? 600 : 400,
                    }}
                  />
                  {child.badge && (
                    <Chip
                      label={child.badge}
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
          </React.Fragment>
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
            {user && (
              <Typography variant="caption" display="block" color="text.secondary">
                {user.first_name} {user.last_name} ({user.role === 'medical_admin' ? 'Medical Admin' : 'System Admin'})
              </Typography>
            )}
          </Typography>

          {/* Live Clock */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mr: 3,
              minWidth: 120,
              backgroundColor: theme.palette.primary.light,
              borderRadius: 2,
              px: 2,
              py: 1,
              color: theme.palette.primary.contrastText,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                lineHeight: 1.2,
              }}
            >
              {currentTime.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                opacity: 0.9,
                textAlign: 'center',
              }}
            >
              {currentTime.toLocaleDateString('th-TH', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
          </Box>

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
