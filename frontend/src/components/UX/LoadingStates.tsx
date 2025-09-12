import React from 'react';
import {
  Box,
  Skeleton,
  CircularProgress,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Skeleton Components
interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showAvatar = false,
  showActions = false,
}) => (
  <Card sx={{ mb: 2 }} data-testid="skeleton-card">
    <CardContent>
      <Stack spacing={2}>
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
        )}
        
        <Box>
          <Skeleton variant="text" width="80%" height={28} />
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              width={index === lines - 1 ? '60%' : '100%'}
              height={20}
              sx={{ mt: 1 }}
            />
          ))}
        </Box>
        
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={80} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} lines={2} showAvatar showActions />
    ))}
  </Box>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <Box>
    {/* Header */}
    <Box sx={{ display: 'flex', mb: 2 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={100}
          height={32}
          sx={{ mr: 2 }}
        />
      ))}
    </Box>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', mb: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            width={100}
            height={24}
            sx={{ mr: 2 }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Progress Components
interface ProgressIndicatorProps {
  value: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  total,
  label,
  showPercentage = true,
  variant = 'linear',
  size = 'medium',
}) => {
  const percentage = Math.round((value / total) * 100);
  
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 80;
      default: return 40;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {variant === 'circular' ? (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={getSize()}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" color="text.secondary">
              {showPercentage ? `${percentage}%` : `${value}/${total}`}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            {label && (
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            )}
            {showPercentage && (
              <Typography variant="body2" color="text.secondary">
                {percentage}%
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{ height: size === 'large' ? 8 : 4 }}
          />
          {!showPercentage && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {value} of {total} completed
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// Multi-step Progress
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
}) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isClickable = onStepClick && (isCompleted || index < currentStep);
        
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              cursor: isClickable ? 'pointer' : 'default',
            }}
            onClick={() => isClickable && onStepClick(index)}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isCompleted
                  ? 'success.main'
                  : isCurrent
                    ? 'primary.main'
                    : 'grey.300',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                mb: 1,
                transition: 'all 0.3s ease',
                '&:hover': isClickable ? {
                  transform: 'scale(1.1)',
                  boxShadow: 2,
                } : {},
              }}
            >
              {isCompleted ? '✓' : index + 1}
            </Box>
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                color: isCurrent ? 'primary.main' : 'text.secondary',
                fontWeight: isCurrent ? 'bold' : 'normal',
              }}
            >
              {step}
            </Typography>
          </Box>
        );
      })}
    </Box>
    
    {/* Progress bar */}
    <LinearProgress
      variant="determinate"
      value={(completedSteps.length / (steps.length - 1)) * 100}
      sx={{ mt: 2 }}
    />
  </Box>
);

// Loading States
interface LoadingStateProps {
  type: 'skeleton' | 'spinner' | 'progress' | 'pulse';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: theme.zIndex.modal,
}));

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 80;
      default: return 40;
    }
  };

  const content = (
    <Box sx={{ textAlign: 'center' }}>
      {type === 'spinner' && (
        <CircularProgress size={getSpinnerSize()} sx={{ mb: 2 }} />
      )}
      {type === 'pulse' && (
        <Box
          sx={{
            width: getSpinnerSize(),
            height: getSpinnerSize(),
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            margin: '0 auto 16px',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        />
      )}
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  if (fullScreen) {
    return <LoadingOverlay>{content}</LoadingOverlay>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      {content}
    </Box>
  );
};

// Status Indicators
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  message: string;
  showIcon?: boolean;
  variant?: 'chip' | 'alert' | 'inline';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  showIcon = true,
  variant = 'chip',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  if (variant === 'chip') {
    return (
      <Chip
        label={message}
        color={getStatusColor() as any}
        icon={showIcon ? <span>{getStatusIcon()}</span> : undefined}
        size="small"
      />
    );
  }

  if (variant === 'alert') {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          backgroundColor: `${getStatusColor()}.light`,
          color: `${getStatusColor()}.dark`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {showIcon && <span>{getStatusIcon()}</span>}
        <Typography variant="body2">{message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && <span>{getStatusIcon()}</span>}
      <Typography variant="body2" color={`${getStatusColor()}.main`}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState;
