import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  Security as SecurityIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableScreeningTypes, ScreeningTypeConfig } from '../../utils/screeningRBAC';

interface RBACScreeningDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  required?: boolean;
  showAccessInfo?: boolean;
}

/**
 * RBAC-Aware Screening Type Dropdown
 * Only shows screening types accessible to current user role
 */
const RBACScreeningDropdown: React.FC<RBACScreeningDropdownProps> = ({
  label,
  value,
  onChange,
  fullWidth = true,
  required = false,
  showAccessInfo = false
}) => {
  const { user } = useAuth();
  const userRole = user?.role || '';

  // Get available screening types for current user role
  const availableScreeningTypes = getAvailableScreeningTypes(userRole);

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'success';
      case 'advanced': return 'primary';
      case 'specialized': return 'warning';
      case 'diagnostic': return 'error';
      default: return 'default';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diagnostic': return '🩺';
      case 'specialized': return '⚕️';
      case 'advanced': return '🔬';
      case 'basic': return '👁️';
      default: return '📋';
    }
  };

  return (
    <Box>
      <FormControl fullWidth={fullWidth} required={required}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => onChange(e.target.value)}
        >
          {availableScreeningTypes.length === 0 ? (
            <MenuItem disabled>
              <Box display="flex" alignItems="center" gap={1}>
                <BlockIcon color="error" fontSize="small" />
                <Typography variant="body2">
                  No screening types available for role: {userRole}
                </Typography>
              </Box>
            </MenuItem>
          ) : (
            availableScreeningTypes.map((screeningType: ScreeningTypeConfig) => (
              <MenuItem key={screeningType.value} value={screeningType.value}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{getCategoryIcon(screeningType.category)}</span>
                    <Box>
                      <Typography variant="body2">{screeningType.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {screeningType.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={screeningType.category}
                    color={getCategoryColor(screeningType.category) as any}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Access Information */}
      {showAccessInfo && (
        <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <SecurityIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Showing {availableScreeningTypes.length} screening types available for role: {userRole}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RBACScreeningDropdown;

