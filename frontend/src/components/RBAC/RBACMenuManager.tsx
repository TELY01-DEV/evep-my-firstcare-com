import React from 'react';
import {
  Box,
  Typography,
  Alert,
  List,
  Divider,
  Chip
} from '@mui/material';
import {
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  RBAC_MENU_CONFIG, 
  hasMenuAccess, 
  getMenuAccessSummary,
  hasHierarchicalAccess,
  ROLE_HIERARCHY 
} from '../../utils/rbacMenuConfig';
import RBACMenuItem from './RBACMenuItem';

interface RBACMenuManagerProps {
  menuItems: any[];
  expandedMenus: Set<string>;
  onToggleExpand: (menuText: string) => void;
  onNavigate: (path: string, external?: boolean) => void;
  currentPath: string;
  showAccessSummary?: boolean;
}

const RBACMenuManager: React.FC<RBACMenuManagerProps> = ({
  menuItems,
  expandedMenus,
  onToggleExpand,
  onNavigate,
  currentPath,
  showAccessSummary = false
}) => {
  const { user } = useAuth();
  const userRole = user?.role || '';

  // Filter menu items based on RBAC
  const accessibleMenuItems = menuItems.filter(item => {
    const hasMainAccess = hasMenuAccess(userRole, item.path);
    
    
    if (!hasMainAccess) {
      return false;
    }
    
    // Filter children
    if (item.children) {
      item.children = item.children.filter((child: any) => 
        hasMenuAccess(userRole, child.path)
      );
      
      // If no children are accessible, hide the parent menu
      if (item.children.length === 0) {
        return false;
      }
    }
    
    return true;
  });

  // Get access summary
  const accessSummary = getMenuAccessSummary(userRole);

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'primary';
      case 'system_admin': return 'warning';
      case 'medical_admin': return 'info';
      case 'doctor': return 'success';
      case 'nurse': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* RBAC Status Header */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <SecurityIcon color="primary" fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            RBAC Status
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            icon={<VerifiedUserIcon />}
            label={userRole}
            color={getRoleChipColor(userRole) as any}
            size="small"
            variant="filled"
          />
          <Typography variant="caption" color="text.secondary">
            {accessSummary.accessible.length} accessible menus
          </Typography>
        </Box>
      </Box>

      {/* Access Summary (if enabled) */}
      {showAccessSummary && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="info" 
            icon={<SecurityIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>Role:</strong> {userRole}<br />
              <strong>Access Level:</strong> {accessSummary.accessible.length} of {Object.keys(RBAC_MENU_CONFIG).length} menus
            </Typography>
          </Alert>
          
          {accessSummary.restricted.length > 0 && (
            <Alert severity="warning" icon={<BlockIcon />}>
              <Typography variant="caption">
                {accessSummary.restricted.length} restricted menu(s) hidden
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {/* RBAC-Filtered Menu Items */}
      <List sx={{ pt: 0 }}>
        {accessibleMenuItems.map((item) => (
          <RBACMenuItem
            key={item.text}
            item={item}
            isExpanded={expandedMenus.has(item.text)}
            onToggleExpand={onToggleExpand}
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
        ))}
      </List>

      {/* No Access Message */}
      {accessibleMenuItems.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <BlockIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No accessible menu items for role: {userRole}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Contact administrator for access
          </Typography>
        </Box>
      )}

      {/* Role Hierarchy Info (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Debug:</strong> Role hierarchy includes:{' '}
            {ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY]?.join(', ') || 'None'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RBACMenuManager;

