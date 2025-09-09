import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Collapse,
  List,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { hasMenuAccess, hasHierarchicalAccess, RBAC_MENU_CONFIG } from '../../utils/rbacMenuConfig';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | null;
  description?: string;
  priority?: string;
  children?: MenuItem[];
  external?: boolean;
}

interface RBACMenuItemProps {
  item: MenuItem;
  isExpanded: boolean;
  onToggleExpand: (menuText: string) => void;
  onNavigate: (path: string, external?: boolean) => void;
  currentPath: string;
  level?: number;
}

const RBACMenuItem: React.FC<RBACMenuItemProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onNavigate,
  currentPath,
  level = 0
}) => {
  const { user } = useAuth();
  const userRole = user?.role || '';

  // Check if user has access to this menu item
  const hasAccess = hasMenuAccess(userRole, item.path);
  
  // If no access, don't render the menu item
  if (!hasAccess) {
    return null;
  }

  // Filter accessible children
  const accessibleChildren = item.children?.filter(child => 
    hasMenuAccess(userRole, child.path)
  ) || [];

  // Check if current path matches this item
  const isActive = currentPath === item.path || 
    (item.children && item.children.some(child => currentPath === child.path));

  // Handle click
  const handleClick = () => {
    if (item.children && accessibleChildren.length > 0) {
      onToggleExpand(item.text);
    } else {
      onNavigate(item.path, item.external);
    }
  };

  // Get badge color based on role access level
  const getBadgeColor = (badge: string) => {
    switch (badge?.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'core':
        return 'primary';
      case 'new':
        return 'success';
      case 'system':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Check if user has elevated access (for badge display)
  const hasElevatedAccess = hasHierarchicalAccess(userRole, 'admin');

  return (
    <>
      <ListItem disablePadding sx={{ pl: level * 2 }}>
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2">{item.description}</Typography>
              <Typography variant="caption" color="inherit">
                Required role: {RBAC_MENU_CONFIG[item.path]?.roles.join(', ') || 'Any'}
              </Typography>
            </Box>
          }
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={handleClick}
            selected={isActive}
            sx={{
              minHeight: level === 0 ? 48 : 40,
              borderRadius: level === 0 ? 2 : 1.5,
              mx: level === 0 ? 1 : 0,
              mb: level === 0 ? 0.5 : 0.25,
              pl: level > 0 ? 3 : 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  color: 'primary.contrastText',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
                '& .MuiListItemText-secondary': {
                  color: 'primary.contrastText',
                  opacity: 0.9,
                  fontWeight: 500,
                },
              },
              '&:hover': {
                backgroundColor: level === 0 
                  ? 'rgba(160, 112, 208, 0.15)' // 15% opacity purple for main items
                  : 'rgba(155, 125, 207, 0.2)', // 20% opacity purple for child items
                '& .MuiListItemText-primary': {
                  color: 'primary.dark',
                  fontWeight: level > 0 ? 700 : 500,
                },
                '& .MuiListItemText-secondary': {
                  color: 'primary.dark',
                  opacity: level > 0 ? 1 : 0.9,
                },
                '& .MuiListItemIcon-root': {
                  color: level === 0 ? 'primary.dark' : 'primary.main', // Lighter color for child items
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: level === 0 ? 40 : 32,
                color: isActive 
                  ? 'primary.contrastText' 
                  : level === 0 
                    ? 'text.secondary' 
                    : 'text.primary',
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography 
                    variant="body2" 
                    fontWeight={isActive ? (level === 0 ? 600 : 700) : (level === 0 ? 500 : 600)}
                    fontSize={level === 0 ? "0.95rem" : "0.85rem"}
                    color={isActive ? 'primary.contrastText' : 'text.primary'}
                  >
                    {item.text}
                  </Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={getBadgeColor(item.badge) as any}
                      variant={hasElevatedAccess ? 'filled' : 'outlined'}
                      sx={{ height: level === 0 ? 20 : 16, fontSize: level === 0 ? '0.7rem' : '0.6rem' }}
                    />
                  )}
                </Box>
              }
              secondary={
                item.description && (
                  <Typography 
                    variant="caption" 
                    color={isActive ? 'primary.contrastText' : 'text.primary'}
                    fontSize="0.7rem"
                    lineHeight={1.2}
                    fontWeight={isActive ? 600 : 500}
                    sx={{
                      opacity: isActive ? 1 : 0.9,
                      textShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                    }}
                  >
                    {item.description}
                  </Typography>
                )
              }
            />
            
            {item.children && accessibleChildren.length > 0 && (
              <Box sx={{ ml: 1 }}>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* Render accessible children */}
      {item.children && accessibleChildren.length > 0 && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
            <List component="div" disablePadding>
              {accessibleChildren.map((child) => (
                <RBACMenuItem
                  key={child.text}
                  item={child}
                  isExpanded={false} // Children don't expand
                  onToggleExpand={onToggleExpand}
                  onNavigate={onNavigate}
                  currentPath={currentPath}
                  level={level + 1}
                />
              ))}
            </List>
          </Box>
        </Collapse>
      )}
    </>
  );
};

export default RBACMenuItem;

