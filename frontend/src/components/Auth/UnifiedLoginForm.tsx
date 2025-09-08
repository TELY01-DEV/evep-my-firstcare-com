/**
 * Unified Login Form with Blockchain Authentication
 * Works for both Medical Portal and Admin Panel
 * Provides consistent login experience with enhanced security
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Security,
  VpnKey,
} from '@mui/icons-material';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

interface UnifiedLoginFormProps {
  title?: string;
  subtitle?: string;
  redirectPath?: string;
  adminMode?: boolean;
}

const UnifiedLoginForm: React.FC<UnifiedLoginFormProps> = ({
  title = "EVEP Platform",
  subtitle = "Secure Login with Blockchain Authentication",
  redirectPath = "/dashboard",
  adminMode = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useUnifiedAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔐 Attempting unified login...');
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        console.log('🎉 Login successful, redirecting...');
        
        // Get the intended destination or use default
        const from = location.state?.from?.pathname || redirectPath;
        
        // Small delay to show success message
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: adminMode 
          ? 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'
          : 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
        padding: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Security 
            sx={{ 
              fontSize: 48, 
              color: adminMode ? '#7C3AED' : '#1E3A8A',
              mb: 1 
            }} 
          />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              color: '#1F2937',
              mb: 1
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              mb: 2
            }}
          >
            {subtitle}
          </Typography>
          
          {/* Security indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={<VpnKey />}
              label="Blockchain Secured"
              size="small"
              sx={{
                backgroundColor: '#10B981',
                color: 'white',
                fontSize: '0.75rem'
              }}
            />
            {adminMode && (
              <Chip
                icon={<Security />}
                label="Admin Portal"
                size="small"
                sx={{
                  backgroundColor: '#7C3AED',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            margin="normal"
            required
            disabled={isLoading || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#6B7280' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            margin="normal"
            required
            disabled={isLoading || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#6B7280' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    disabled={isLoading || loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Error/Success Messages */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {success}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              background: adminMode 
                ? 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'
                : 'linear-gradient(135deg, #1E3A8A 0%, #0F766E 100%)',
              '&:hover': {
                background: adminMode 
                  ? 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)'
                  : 'linear-gradient(135deg, #1E40AF 0%, #047857 100%)',
              },
              '&:disabled': {
                background: '#9CA3AF',
              },
            }}
          >
            {isLoading || loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <Typography>Authenticating...</Typography>
              </Box>
            ) : (
              'Sign In Securely'
            )}
          </Button>
        </form>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            🔐 Protected by blockchain authentication
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default UnifiedLoginForm;



