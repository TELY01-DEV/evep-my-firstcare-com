import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Tooltip,
  Typography,
  Badge
} from '@mui/material';
import {
  LocalHospital,
  Psychology,
  MedicalServices,
  AdminPanelSettings,
  Person,
  SupervisorAccount,
  Work,
  Assignment
} from '@mui/icons-material';

interface StaffBadgeProps {
  staffName?: string;
  role?: string;
  status?: 'active' | 'working' | 'completed' | 'available' | 'busy' | 'offline';
  stepName?: string;
  timestamp?: string;
  size?: 'small' | 'medium' | 'large';
  showRole?: boolean;
  showStatus?: boolean;
  showTimestamp?: boolean;
  variant?: 'badge' | 'card' | 'inline';
}

const StaffBadge: React.FC<StaffBadgeProps> = ({
  staffName,
  role,
  status,
  stepName,
  timestamp,
  size = 'medium',
  showRole = true,
  showStatus = true,
  showTimestamp = true,
  variant = 'badge'
}) => {
  
  // Role configuration
  const getRoleConfig = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return {
          icon: <LocalHospital />,
          color: 'success',
          label: 'Doctor',
          bgcolor: '#2e7d32',
          textColor: 'white'
        };
      case 'nurse':
        return {
          icon: <Psychology />,
          color: 'info',
          label: 'Nurse',
          bgcolor: '#1976d2',
          textColor: 'white'
        };
      case 'medical_staff':
        return {
          icon: <MedicalServices />,
          color: 'primary',
          label: 'Medical Staff',
          bgcolor: '#7c4dff',
          textColor: 'white'
        };
      case 'medical_admin':
        return {
          icon: <SupervisorAccount />,
          color: 'warning',
          label: 'Medical Admin',
          bgcolor: '#f57c00',
          textColor: 'white'
        };
      case 'admin':
      case 'super_admin':
        return {
          icon: <AdminPanelSettings />,
          color: 'error',
          label: 'Administrator',
          bgcolor: '#d32f2f',
          textColor: 'white'
        };
      default:
        return {
          icon: <Person />,
          color: 'default',
          label: 'Staff',
          bgcolor: '#757575',
          textColor: 'white'
        };
    }
  };

  // Status configuration
  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'working':
        return {
          color: '#4caf50',
          label: 'Working',
          icon: '🟢'
        };
      case 'completed':
        return {
          color: '#2196f3',
          label: 'Completed',
          icon: '✅'
        };
      case 'available':
        return {
          color: '#8bc34a',
          label: 'Available',
          icon: '🟡'
        };
      case 'busy':
        return {
          color: '#ff9800',
          label: 'Busy',
          icon: '🟠'
        };
      case 'offline':
        return {
          color: '#9e9e9e',
          label: 'Offline',
          icon: '⚫'
        };
      default:
        return {
          color: '#757575',
          label: 'Unknown',
          icon: '⚪'
        };
    }
  };

  const roleConfig = getRoleConfig(role);
  const statusConfig = getStatusConfig(status);
  
  // Size configuration
  const sizeConfig = {
    small: { avatar: 24, font: '0.75rem', chip: 'small' },
    medium: { avatar: 32, font: '0.875rem', chip: 'small' },
    large: { avatar: 40, font: '1rem', chip: 'medium' }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Badge variant - compact display
  if (variant === 'badge') {
    return (
      <Tooltip title={`${roleConfig.label}: ${staffName || 'Unknown'}${stepName ? ` - ${stepName}` : ''}${showTimestamp && timestamp ? ` (${formatTimestamp(timestamp)})` : ''}`}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            showStatus ? (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: statusConfig.color,
                  border: '2px solid white',
                  boxShadow: 1
                }}
              />
            ) : null
          }
        >
          <Avatar
            sx={{
              width: sizeConfig[size].avatar,
              height: sizeConfig[size].avatar,
              bgcolor: roleConfig.bgcolor,
              fontSize: sizeConfig[size].font,
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: 3
              }
            }}
          >
            {roleConfig.icon || (staffName?.charAt(0).toUpperCase() || '?')}
          </Avatar>
        </Badge>
      </Tooltip>
    );
  }

  // Card variant - detailed display
  if (variant === 'card') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          bgcolor: 'white',
          boxShadow: 1,
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-1px)'
          }
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            showStatus ? (
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: statusConfig.color,
                  border: '2px solid white',
                  boxShadow: 1
                }}
              />
            ) : null
          }
        >
          <Avatar
            sx={{
              width: sizeConfig[size].avatar,
              height: sizeConfig[size].avatar,
              bgcolor: roleConfig.bgcolor,
              color: roleConfig.textColor
            }}
          >
            {roleConfig.icon}
          </Avatar>
        </Badge>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {staffName || 'Unknown'}
          </Typography>
          
          {showRole && (
            <Chip
              label={roleConfig.label}
              size={sizeConfig[size].chip as any}
              sx={{
                bgcolor: roleConfig.bgcolor,
                color: roleConfig.textColor,
                fontSize: '0.75rem',
                height: 20,
                mb: 0.5
              }}
            />
          )}
          
          {stepName && (
            <Typography variant="caption" sx={{ 
              display: 'block', 
              color: 'text.secondary',
              mt: 0.5
            }}>
              <Assignment sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {stepName}
            </Typography>
          )}
          
          {showTimestamp && timestamp && (
            <Typography variant="caption" sx={{ 
              display: 'block', 
              color: 'text.secondary',
              fontStyle: 'italic'
            }}>
              {formatTimestamp(timestamp)}
            </Typography>
          )}
        </Box>

        {showStatus && status && (
          <Box sx={{ textAlign: 'right' }}>
            <Chip
              label={statusConfig.label}
              size="small"
              sx={{
                bgcolor: statusConfig.color,
                color: 'white',
                fontSize: '0.7rem',
                height: 18
              }}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Inline variant - minimal display
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 1,
          transform: 'scale(1.02)'
        }
      }}
    >
      <Avatar
        sx={{
          width: sizeConfig[size].avatar,
          height: sizeConfig[size].avatar,
          bgcolor: roleConfig.bgcolor,
          color: roleConfig.textColor,
          fontSize: sizeConfig[size].font
        }}
      >
        {roleConfig.icon || (staffName?.charAt(0).toUpperCase() || '?')}
      </Avatar>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {staffName || 'Unknown'}
        </Typography>
        
        {showRole && (
          <Typography variant="caption" sx={{ 
            color: roleConfig.bgcolor,
            fontWeight: 500
          }}>
            {roleConfig.label}
          </Typography>
        )}
      </Box>

      {showStatus && (
        <Tooltip title={statusConfig.label}>
          <span style={{ fontSize: '12px' }}>
            {statusConfig.icon}
          </span>
        </Tooltip>
      )}

      {showTimestamp && timestamp && (
        <Typography variant="caption" sx={{ 
          color: 'text.secondary',
          fontSize: '0.7rem'
        }}>
          {formatTimestamp(timestamp)}
        </Typography>
      )}
    </Box>
  );
};

export default StaffBadge;