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
              minHeight: 48,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? 'inherit' : 'action.active',
              }}
            >
              {item.icon}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight={isActive ? 'bold' : 'normal'}>
                    {item.text}
                  </Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={getBadgeColor(item.badge) as any}
                      variant={hasElevatedAccess ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              }
              secondary={
                level === 0 && item.description && (
                  <Typography variant="caption" color="text.secondary">
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
        </Collapse>
      )}
    </>
  );
};

export default RBACMenuItem;

