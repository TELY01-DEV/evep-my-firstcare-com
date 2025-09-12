import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Avatar,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  MedicalServices,
  HealthAndSafety,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface MedicalLoginFormProps {
  onLoginSuccess?: (token: string, user: any) => void;
}

const MedicalLoginForm: React.FC<MedicalLoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = t('validation.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.password_min_length');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('evep_token', data.access_token);
      localStorage.setItem('evep_user', JSON.stringify(data.user));

      toast.success(t('auth.welcome_message'));
      
      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, data.user);
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    
    const demoCredentials = {
      doctor: { email: 'doctor@evep.com', password: 'demo123' },
      nurse: { email: 'nurse@evep.com', password: 'demo123' },
      admin: { email: 'admin@evep.com', password: 'demo123' },
    };

    const credentials = demoCredentials[role as keyof typeof demoCredentials];
    
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Demo login failed');
      }

      localStorage.setItem('evep_token', data.access_token);
      localStorage.setItem('evep_user', JSON.stringify(data.user));

      toast.success(t('auth.demo_welcome', { role: role.charAt(0).toUpperCase() + role.slice(1) }));
      
      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, data.user);
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.secondary.light} 100%)`,
        padding: theme.spacing(2),
        position: 'relative',
      }}
    >
      {/* Main Login Card */}
      <Card
        elevation={8}
        sx={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(155, 125, 207, 0.15)',
          marginBottom: theme.spacing(4), // Space for footer
        }}
      >
        {/* Medical Professional Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            padding: theme.spacing(4, 3),
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              marginBottom: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: 1,
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            EVEP
          </Typography>
          <Typography variant="h6" fontWeight={500} sx={{ opacity: 0.9 }}>
            Medical Professional Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, marginTop: 1 }}>
            EYE Vision Evaluation Platform
          </Typography>
        </Box>

        <CardContent sx={{ padding: theme.spacing(4) }}>
          <Typography variant="h5" fontWeight={600} gutterBottom textAlign="center" sx={{ color: theme.palette.primary.main }}>
            {t('auth.sign_in')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            {t('auth.access_dashboard')}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('auth.email')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 6px 16px ${theme.palette.primary.main}60`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('auth.sign_in')
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Demo Login Buttons */}
          <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center" sx={{ color: theme.palette.primary.main }}>
            {t('auth.demo_access')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            {t('auth.demo_description')}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleDemoLogin('doctor')}
                disabled={loading}
                startIcon={<Person />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: `${theme.palette.primary.main}20`,
                  },
                }}
              >
                Doctor
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleDemoLogin('nurse')}
                disabled={loading}
                startIcon={<MedicalServices />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: `${theme.palette.primary.main}20`,
                  },
                }}
              >
                Nurse
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                startIcon={<HealthAndSafety />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: `${theme.palette.primary.main}20`,
                  },
                }}
              >
                Admin
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Contact your administrator
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Copyright Footer - Outside the login card */}
      <Box
        sx={{
          position: 'absolute',
          bottom: theme.spacing(2),
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: theme.spacing(1),
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 1,
          margin: theme.spacing(0, 2),
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block',
            fontSize: '0.75rem',
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
            fontSize: '0.75rem',
            lineHeight: 1.4,
            fontFamily: '"Noto Sans Thai", sans-serif',
          }}
        >
          สงวนลิขสิทธิ์ © 2025 บริษัท อะเมดิคอล ฟอร์ ยู จำกัด กรุงเทพฯ ประเทศไทย
        </Typography>
      </Box>
    </Box>
  );
};

export default MedicalLoginForm;
