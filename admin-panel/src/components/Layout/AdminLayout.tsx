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
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Backup as BackupIcon,
  Storage as DatabaseIcon,
  Monitor as MonitorIcon,
  Chat as ChatIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon,
  LocalShipping as DeliveryIcon,
  Visibility as VisionIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAdminAuth } from '../../contexts/AdminAuthContext.tsx';

const drawerWidth = 280;

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();

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
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'System Overview',
      icon: <DashboardIcon />,
      path: '/',
      badge: null,
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/users',
      badge: null,
    },
    {
      text: 'Admin Panel Users',
      icon: <AdminIcon />,
      path: '/admin-users',
      badge: null,
    },
    {
      text: 'Medical Portal Users',
      icon: <PeopleIcon />,
      path: '/medical-users',
      badge: null,
    },
    {
      text: 'School Management',
      icon: <SchoolIcon />,
      path: '/evep',
      badge: 'New',
      children: [
        {
          text: 'Students',
          icon: <PersonIcon />,
          path: '/evep/students',
          badge: null,
        },
        {
          text: 'Parents',
          icon: <GroupIcon />,
          path: '/evep/parents',
          badge: null,
        },
        {
          text: 'Teachers',
          icon: <PeopleIcon />,
          path: '/evep/teachers',
          badge: null,
        },
        {
          text: 'Schools',
          icon: <SchoolIcon />,
          path: '/evep/schools',
          badge: null,
        },
        {
          text: 'School-based Screening',
          icon: <AssessmentIcon />,
          path: '/evep/school-screenings',
          badge: 'New',
        },
        {
          text: 'Teacher-Student Relationships',
          icon: <AssignmentIcon />,
          path: '/evep/relationships',
          badge: 'New',
        },
      ],
    },

    {
      text: 'System Configuration',
      icon: <SettingsIcon />,
      path: '/settings',
      badge: null,
    },
    {
      text: 'Security & Audit',
      icon: <SecurityIcon />,
      path: '/security',
      badge: 'New',
    },
    {
      text: 'Database Management',
      icon: <DatabaseIcon />,
      path: '/database',
      badge: null,
    },
    {
      text: 'System Monitoring',
      icon: <MonitorIcon />,
      path: '/monitoring',
      badge: null,
    },
    {
      text: 'Backup & Recovery',
      icon: <BackupIcon />,
      path: '/backup',
      badge: null,
    },
    {
      text: 'LINE Bot Manager',
      icon: <ChatIcon />,
      path: '/line-bot',
      badge: 'New',
    },
  ];

  const drawer = (
    <Box>
      {/* Admin Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing(3, 2),
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
          color: 'white',
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
            <Typography variant="h6" fontWeight={600} color="white">
              EVEP Admin Panel
            </Typography>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.8)">
              System Administration & Control Center
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
                  if (item.children) {
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

      {/* Quick Admin Actions */}
      <Box sx={{ padding: theme.spacing(2) }}>
        <Typography variant="overline" color="text.secondary" fontWeight={600}>
          System Actions
        </Typography>
        <List sx={{ padding: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/users')}
              sx={{ borderRadius: 2, marginTop: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Add New User" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/settings')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="System Settings" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/backup')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BackupIcon />
              </ListItemIcon>
              <ListItemText primary="Create Backup" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/security')}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Security Audit" />
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AdminIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" noWrap component="div" fontWeight={600}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'EVEP Admin Panel'}
            </Typography>
            <Chip 
              label="ADMIN" 
              size="small" 
              color="primary" 
              sx={{ ml: 2, fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {user?.name || user?.email}
            </Typography>
            <Chip 
              label={user?.role?.toUpperCase()} 
              size="small" 
              color="secondary"
              sx={{ fontSize: '0.7rem' }}
            />
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
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile Settings
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          System Settings
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

export default AdminLayout;



