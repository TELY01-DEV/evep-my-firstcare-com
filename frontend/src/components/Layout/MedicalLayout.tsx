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
import ChatBotButton from '../ChatBot/ChatBotButton';
import LanguageToggle from '../LanguageToggle';
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
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ADMIN_PANEL_URL } from '../../config/constants';
import RBACMenuManager from '../RBAC/RBACMenuManager';
import { filterMenuByRole } from '../../utils/rbacMenuConfig';

const drawerWidth = 280;

interface MedicalLayoutProps {
  children?: React.ReactNode;
}

const MedicalLayout: React.FC<MedicalLayoutProps> = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isDrawerHovered, setIsDrawerHovered] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSystemAdmin, isMedicalAdmin } = useAuth();
  const { t } = useLanguage();

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

  // Handle menu expansion/collapse
  const handleMenuToggle = (menuText: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuText)) {
        newSet.delete(menuText);
      } else {
        newSet.add(menuText);
      }
      return newSet;
    });
  };

  // Handle drawer hover
  const handleDrawerMouseEnter = () => {
    setIsDrawerHovered(true);
  };

  const handleDrawerMouseLeave = () => {
    setIsDrawerHovered(false);
  };

  // Check if menu is expanded
  const isMenuExpanded = (menuText: string) => {
    return expandedMenus.has(menuText);
  };

  const menuItems = [
    {
      text: t('nav.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
      badge: null,
      description: t('nav.dashboard_description'),
      priority: 'high',
    },
    {
      text: t('nav.health_analytics'),
      icon: <HealthIcon />,
      path: '/dashboard/analytics',
      badge: null,
      description: t('nav.health_analytics_description'),
      priority: 'medium',
    },
    {
      text: t('nav.school_management'),
      icon: <SchoolIcon />,
      path: '/dashboard/evep',
      badge: t('nav.admin'),
      description: t('nav.school_management_description'),
      priority: 'medium',
      children: [
        {
          text: t('nav.students'),
          icon: <ChildIcon />,
          path: '/dashboard/evep/students',
          badge: null,
          description: t('nav.students_description'),
        },
        {
          text: t('nav.parents'),
          icon: <GroupIcon />,
          path: '/dashboard/evep/parents',
          badge: null,
          description: t('nav.parents_description'),
        },
        {
          text: t('nav.teachers'),
          icon: <PersonIcon />,
          path: '/dashboard/evep/teachers',
          badge: null,
          description: t('nav.teachers_description'),
        },
        {
          text: t('nav.schools'),
          icon: <SchoolIcon />,
          path: '/dashboard/evep/schools',
          badge: null,
          description: t('nav.schools_description'),
        },
        {
          text: t('nav.school_screenings'),
          icon: <AssessmentIcon />,
          path: '/dashboard/evep/school-screenings',
          badge: null,
          description: t('nav.school_screenings_description'),
        },
      ],
    },
    {
      text: t('nav.medical_screening'),
      icon: <MedicalServicesIcon />,
      path: '/dashboard/medical-screening',
      badge: t('nav.core'),
      description: t('nav.medical_screening_description'),
      priority: 'high',
      children: [
        {
          text: t('nav.medical_reports'),
          icon: <AssessmentIcon />,
          path: '/dashboard/reports',
          badge: null,
          description: t('nav.medical_reports_description'),
        },
        {
          text: t('nav.patient_management'),
          icon: <PeopleIcon />,
          path: '/dashboard/patients',
          badge: null,
          description: t('nav.patient_management_description'),
        },
        {
          text: t('nav.vision_screening'),
          icon: <VisibilityIcon />,
          path: '/dashboard/screenings',
          badge: null,
          description: t('nav.vision_screening_description'),
        },
        {
          text: t('nav.patient_registration'),
          icon: <PersonIcon />,
          path: '/dashboard/medical-screening/patient-registration',
          badge: null,
          description: t('nav.patient_registration_description'),
        },
        {
          text: t('nav.va_screening'),
          icon: <VisibilityIcon />,
          path: '/dashboard/medical-screening/va-screening',
          badge: null,
          description: t('nav.va_screening_description'),
        },
        {
          text: t('nav.appointment_scheduling'),
          icon: <ScheduleIcon />,
          path: '/dashboard/evep/appointments',
          badge: null,
          description: t('nav.appointment_scheduling_description'),
        },
      ],
    },
    {
      text: t('nav.user_management'),
      icon: <PersonIcon />,
      path: '/dashboard/user-management',
      badge: t('nav.admin'),
      description: t('nav.user_management_description'),
      priority: 'high',
      children: [
        {
          text: t('nav.user_directory'),
          icon: <PersonIcon />,
          path: '/dashboard/user-management',
          badge: null,
          description: t('nav.user_directory_description'),
        },
        {
          text: t('nav.user_management'),
          icon: <AddIcon />,
          path: '/dashboard/user-management/management',
          badge: null,
          description: t('nav.user_management_crud_description'),
        },
      ],
    },
    {
      text: t('nav.medical_staff_management'),
      icon: <PersonIcon />,
      path: '/dashboard/medical-staff',
      badge: t('nav.admin'),
      description: t('nav.medical_staff_management_description'),
      priority: 'medium',
      children: [
        {
          text: t('nav.staff_directory'),
          icon: <PersonIcon />,
          path: '/dashboard/medical-staff',
          badge: null,
          description: t('nav.staff_directory_description'),
        },
        {
          text: t('nav.staff_management'),
          icon: <PersonIcon />,
          path: '/dashboard/medical-staff/management',
          badge: null,
          description: t('nav.staff_management_description'),
        },
      ],
    },
    {
      text: t('nav.inventory_management'),
      icon: <InventoryIcon />,
      path: '/dashboard/inventory',
      badge: null,
      description: t('nav.inventory_management_description'),
      priority: 'medium',
      children: [
        {
          text: t('nav.glasses_inventory'),
          icon: <InventoryIcon />,
          path: '/dashboard/glasses-management/inventory',
          badge: null,
          description: t('nav.glasses_inventory_description'),
        },
        {
          text: t('nav.glasses_delivery'),
          icon: <DeliveryIcon />,
          path: '/dashboard/glasses-management/delivery',
          badge: null,
          description: t('nav.glasses_delivery_description'),
        },
      ],
    },
    {
      text: t('nav.master_data'),
      icon: <SettingsIcon />,
      path: '/dashboard/master-data',
      badge: t('nav.admin'),
      description: t('nav.master_data_description'),
      priority: 'medium',
      children: [
        {
          text: t('nav.geolocations'),
          icon: <LocationIcon />,
          path: '/dashboard/master-data/geolocations',
          badge: null,
          description: t('nav.geolocations_description'),
        },
        {
          text: t('nav.hospitals'),
          icon: <HospitalIcon />,
          path: '/dashboard/master-data/hospitals',
          badge: null,
          description: t('nav.hospitals_description'),
        },
      ],
    },
    {
      text: t('nav.panel_settings'),
      icon: <SettingsIcon />,
      path: '/dashboard/panel-settings',
      badge: t('nav.admin'),
      description: t('nav.panel_settings_description'),
      priority: 'low',
      children: [
        {
          text: t('nav.general_settings'),
          icon: <SettingsIcon />,
          path: '/dashboard/panel-settings/general',
          badge: null,
          description: t('nav.general_settings_description'),
        },
        {
          text: t('nav.rbac_management'),
          icon: <SecurityIcon />,
          path: '/dashboard/panel-settings/rbac',
          badge: null,
          description: t('nav.rbac_management_description'),
        },
      ],
    },
    {
      text: t('nav.line_notifications'),
      icon: <ChatIcon />,
      path: '/dashboard/line-notifications',
      badge: t('nav.new'),
      description: t('nav.line_notifications_description'),
      priority: 'low',
    },
    // Admin Panel Access (System Admin Only)
    ...(isSystemAdmin() ? [{
      text: t('nav.admin_panel'),
      icon: <SettingsIcon />,
      path: ADMIN_PANEL_URL,
      badge: t('nav.system'),
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

      {/* RBAC-Aware Navigation Menu */}
      <RBACMenuManager
        menuItems={menuItems}
        expandedMenus={expandedMenus}
        onToggleExpand={handleMenuToggle}
        onNavigate={(path, external) => {
          if (external) {
            window.open(path, '_blank');
          } else {
            navigate(path);
          }
        }}
        currentPath={location.pathname}
        showAccessSummary={false}
      />

      {/* Original Menu (Hidden) - Keeping for reference */}
      <List sx={{ padding: theme.spacing(2, 0), display: 'none' }}>
        {menuItems.map((item) => {
          return (
            <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path))}
                onClick={() => {
                  if (item.external) {
                    // Open external link in new tab
                    window.open(item.path, '_blank');
                  } else if (item.children) {
                    // Toggle menu expansion
                    handleMenuToggle(item.text);
                  } else {
                    navigate(item.path);
                  }
                }}
                sx={{
                  margin: theme.spacing(0, 2, 1, 2),
                  borderRadius: 2,
                  minHeight: 56,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.contrastText,
                    },
                    '& .MuiListItemText-secondary': {
                      color: theme.palette.primary.contrastText,
                      opacity: 0.9,
                      fontWeight: 500,
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(160, 112, 208, 0.15)', // 15% opacity
                    '& .MuiListItemText-primary': {
                      color: theme.palette.primary.dark,
                    },
                    '& .MuiListItemText-secondary': {
                      color: theme.palette.primary.dark,
                      opacity: 0.9,
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.dark,
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
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.text}
                      {item.children && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.7rem',
                            opacity: 0.7,
                          }}
                        >
                          ({item.children.length})
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: (location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path))) ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                  }}
                  sx={{
                    '& .MuiListItemText-secondary': {
                      opacity: 0.8,
                    },
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color={
                      item.badge === 'Core' ? 'primary' :
                      item.badge === 'Active' ? 'success' :
                      item.badge === 'Admin' ? 'warning' :
                      item.badge === 'New' ? 'info' :
                      item.badge === 'System' ? 'error' : 'default'
                    }
                    sx={{
                      fontSize: '0.65rem',
                      height: 18,
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                )}
                {item.children && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.7rem',
                        opacity: 0.7,
                      }}
                    >
                      {isMenuExpanded(item.text) ? '▼' : '▶'}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(item.text);
                      }}
                      sx={{
                        color: (location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path)))
                          ? theme.palette.primary.contrastText 
                          : theme.palette.text.secondary,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.2rem',
                        },
                      }}
                    >
                      {isMenuExpanded(item.text) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Render nested menu items */}
            {item.children && isMenuExpanded(item.text) && (
              <Box sx={{ 
                pl: 2, 
                pr: 2, 
                backgroundColor: 'rgba(160, 112, 208, 0.2)', // 20% opacity of primary light
                borderRadius: 2,
                mx: 1,
                mb: 1,
                pt: 1,
                pb: 1,
                border: '2px solid rgba(160, 112, 208, 0.4)', // 40% opacity border
                boxShadow: '0 2px 8px rgba(155, 125, 207, 0.15)', // Subtle shadow
              }}>
                {item.children.map((child) => (
                  <ListItem key={child.text} disablePadding>
                    <ListItemButton
                      selected={location.pathname === child.path}
                      onClick={() => navigate(child.path)}
                      sx={{
                        margin: theme.spacing(0, 0, 0.5, 0),
                        borderRadius: 1.5,
                        minHeight: 48,
                        pl: 3,
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            color: theme.palette.primary.contrastText,
                          },
                          '& .MuiListItemIcon-root': {
                            color: theme.palette.primary.contrastText,
                          },
                          '& .MuiListItemText-secondary': {
                            color: theme.palette.primary.contrastText,
                            opacity: 0.9,
                            fontWeight: 500,
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(155, 125, 207, 0.2)', // 20% opacity
                          '& .MuiListItemText-primary': {
                            color: theme.palette.primary.dark,
                            fontWeight: 700,
                          },
                          '& .MuiListItemText-secondary': {
                            color: theme.palette.primary.dark,
                            opacity: 1,
                          },
                          '& .MuiListItemIcon-root': {
                            color: theme.palette.primary.dark,
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: location.pathname === child.path 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={child.text}
                        secondary={child.description}
                        primaryTypographyProps={{
                          fontWeight: location.pathname === child.path ? 700 : 600,
                          fontSize: '0.85rem',
                          color: location.pathname === child.path 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.7rem',
                          lineHeight: 1.2,
                          color: location.pathname === child.path 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                          fontWeight: location.pathname === child.path ? 600 : 500,
                        }}
                        sx={{
                          '& .MuiListItemText-secondary': {
                            opacity: location.pathname === child.path ? 1 : 0.9,
                            textShadow: location.pathname === child.path ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                          },
                        }}
                      />
                      {child.badge && (
                        <Chip
                          label={child.badge}
                          size="small"
                          color={
                            child.badge === 'Active' ? 'success' :
                            child.badge === 'New' ? 'info' :
                            'default'
                          }
                          sx={{
                            fontSize: '0.6rem',
                            height: 16,
                            fontWeight: 600,
                            '& .MuiChip-label': {
                              px: 0.5,
                            },
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            )}
          </React.Fragment>
        );
        })}
      </List>

      <Divider sx={{ margin: theme.spacing(2, 0) }} />

      {/* Quick Actions */}
      <Box sx={{ padding: theme.spacing(2) }}>
        <Typography 
          variant="overline" 
          color="text.secondary" 
          fontWeight={600}
          sx={{ 
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
            mb: 1,
            display: 'block',
          }}
        >
          Quick Actions
        </Typography>
        <List sx={{ padding: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/dashboard/patients/new')}
              sx={{ 
                borderRadius: 2, 
                marginBottom: 1,
                backgroundColor: theme.palette.success.light,
                color: theme.palette.success.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.success.main,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <MedicalServicesIcon />
              </ListItemIcon>
              <ListItemText 
                primary="New Patient" 
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/dashboard/screenings')}
              sx={{ 
                borderRadius: 2,
                marginBottom: 1,
                backgroundColor: theme.palette.info.light,
                color: theme.palette.info.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.info.main,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <VisibilityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Start Screening" 
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/dashboard/evep/appointments')}
              sx={{ 
                borderRadius: 2,
                backgroundColor: theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.warning.main,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <ScheduleIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Scheduled Appointments" 
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
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
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={() => setIsDrawerHovered(!isDrawerHovered)}
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
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
              color: '#1e3a8a',
            }}
          >
            {/* Time Display */}
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"JetBrains Mono", "Fira Code", "Roboto Mono", monospace',
                fontWeight: 900,
                fontSize: '1.4rem',
                lineHeight: 1.1,
                color: '#1e3a8a',
                letterSpacing: '0.1em',
                textAlign: 'center',
                mb: 0.5,
              }}
            >
              {currentTime.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </Typography>
            
            {/* Date Display */}
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8rem',
                color: '#1e3a8a',
                textAlign: 'center',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {currentTime.toLocaleDateString('th-TH', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            
            {/* Live Indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                background: 'linear-gradient(45deg, #ef4444, #f97316)',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                animation: 'blink 1.5s ease-in-out infinite',
                '@keyframes blink': {
                  '0%, 50%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                  '25%, 75%': {
                    opacity: 0.7,
                    transform: 'scale(0.9)',
                  },
                },
              }}
            />
          </Box>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Language Toggle */}
          <LanguageToggle />

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
          <Box
            onMouseEnter={handleDrawerMouseEnter}
            onMouseLeave={handleDrawerMouseLeave}
            sx={{ height: '100%' }}
          >
            {drawer}
          </Box>
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isDrawerHovered ? drawerWidth + 50 : drawerWidth,
              transition: 'width 0.3s ease-in-out',
            },
          }}
          open
        >
          <Box
            onMouseEnter={handleDrawerMouseEnter}
            onMouseLeave={handleDrawerMouseLeave}
            sx={{ height: '100%' }}
          >
            {drawer}
          </Box>
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
      
      {/* Chat Bot Button */}
      <ChatBotButton />
      
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
