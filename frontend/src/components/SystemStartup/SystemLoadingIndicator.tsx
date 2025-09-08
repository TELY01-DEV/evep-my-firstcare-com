import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CloudDone as CloudIcon,
  Storage as DatabaseIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SystemService {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  description: string;
  icon: React.ReactNode;
}

interface SystemLoadingIndicatorProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

const SystemLoadingIndicator: React.FC<SystemLoadingIndicatorProps> = ({
  onComplete,
  onError,
  autoStart = true
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [services, setServices] = useState<SystemService[]>([
    {
      name: 'Database Connection',
      status: 'pending',
      description: 'Connecting to MongoDB cluster...',
      icon: <DatabaseIcon />
    },
    {
      name: 'Authentication Service',
      status: 'pending', 
      description: 'Initializing security modules...',
      icon: <SecurityIcon />
    },
    {
      name: 'API Services',
      status: 'pending',
      description: 'Starting backend services...',
      icon: <ApiIcon />
    },
    {
      name: 'RBAC System',
      status: 'pending',
      description: 'Loading permissions and roles...',
      icon: <SecurityIcon />
    },
    {
      name: 'Frontend Ready',
      status: 'pending',
      description: 'Finalizing user interface...',
      icon: <CloudIcon />
    }
  ]);

  const checkSystemHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('evep_token');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Step 1: Check backend health
      updateServiceStatus(0, 'loading');
      setActiveStep(0);
      setProgress(20);

      const healthResponse = await fetch('https://stardust.evep.my-firstcare.com/health', {
        headers
      });

      if (!healthResponse.ok) {
        throw new Error('Backend health check failed');
      }

      updateServiceStatus(0, 'success');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Check authentication
      updateServiceStatus(1, 'loading');
      setActiveStep(1);
      setProgress(40);

      if (token) {
        const authResponse = await fetch('https://stardust.evep.my-firstcare.com/api/v1/auth/me', {
          headers
        });
        
        if (authResponse.ok) {
          updateServiceStatus(1, 'success');
        } else {
          updateServiceStatus(1, 'error');
        }
      } else {
        updateServiceStatus(1, 'success'); // Skip if no token
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Check API services (only if authenticated)
      updateServiceStatus(2, 'loading');
      setActiveStep(2);
      setProgress(60);

      if (token) {
        const apiResponse = await fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/roles/', {
          headers
        });

        if (apiResponse.ok) {
          updateServiceStatus(2, 'success');
        } else {
          updateServiceStatus(2, 'error');
        }
      } else {
        // Skip RBAC checks if not authenticated
        updateServiceStatus(2, 'success');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Check RBAC system (only if authenticated)
      updateServiceStatus(3, 'loading');
      setActiveStep(3);
      setProgress(80);

      if (token) {
        const rbacResponse = await fetch('https://stardust.evep.my-firstcare.com/api/v1/rbac/permissions/', {
          headers
        });

        if (rbacResponse.ok) {
          const rbacData = await rbacResponse.json();
          const permissionCount = rbacData.permissions?.length || 0;
          
          if (permissionCount > 20) { // Expect comprehensive permissions
            updateServiceStatus(3, 'success');
          } else {
            updateServiceStatus(3, 'error');
            throw new Error(`Insufficient permissions loaded: ${permissionCount}`);
          }
        } else {
          updateServiceStatus(3, 'error');
          throw new Error('RBAC permissions check failed');
        }
      } else {
        // Skip RBAC checks if not authenticated
        updateServiceStatus(3, 'success');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Finalize
      updateServiceStatus(4, 'loading');
      setActiveStep(4);
      setProgress(100);

      await new Promise(resolve => setTimeout(resolve, 1000));
      updateServiceStatus(4, 'success');

      // All services ready
      setLoading(false);
      if (onComplete) {
        onComplete();
      }

    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'System startup failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const updateServiceStatus = (index: number, status: SystemService['status']) => {
    setServices(prev => prev.map((service, i) => 
      i === index ? { ...service, status } : service
    ));
  };

  const getStatusColor = (status: SystemService['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'loading': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: SystemService['status']) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'loading': return <CircularProgress size={20} />;
      default: return null;
    }
  };

  useEffect(() => {
    if (autoStart) {
      checkSystemHealth();
    }
  }, [autoStart]);

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card sx={{ maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CloudIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              System Startup
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Preparing EVEP Medical Portal...
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 4 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {progress}% Complete
            </Typography>
          </Box>

          {/* Service Status Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {services.map((service, index) => (
              <Step key={service.name}>
                <StepLabel
                  icon={getStatusIcon(service.status) || service.icon}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {service.name}
                    </Typography>
                    <Chip
                      label={service.status}
                      color={getStatusColor(service.status) as any}
                      size="small"
                      variant={service.status === 'success' ? 'filled' : 'outlined'}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }} action={
              <RefreshIcon 
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  setError(null);
                  setActiveStep(0);
                  setProgress(0);
                  setServices(prev => prev.map(s => ({ ...s, status: 'pending' })));
                  checkSystemHealth();
                }}
              />
            }>
              <Typography variant="body2">
                <strong>System Startup Error:</strong> {error}
              </Typography>
              <Typography variant="caption">
                Click the refresh icon to retry
              </Typography>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Initializing system components...
              </Typography>
            </Box>
          )}

          {/* Success State */}
          {!loading && !error && progress === 100 && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>System Ready!</strong> All services are operational.
              </Typography>
              <Typography variant="caption">
                You can now use all EVEP Medical Portal features.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemLoadingIndicator;
