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
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  School
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onLoginSuccess?: (token: string, user: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
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
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
      const response = await fetch('http://localhost:8013/api/v1/auth/login', {
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

      // Store token in localStorage
      localStorage.setItem('evep_token', data.access_token);
      localStorage.setItem('evep_user', JSON.stringify(data.user));

      toast.success('Login successful! Welcome to EVEP');
      
      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, data.user);
      }

      // Redirect to dashboard
      navigate('/');

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    
    const demoCredentials = {
      doctor: { email: 'doctor@evep.com', password: 'demo123' },
      teacher: { email: 'teacher@evep.com', password: 'demo123' },
      parent: { email: 'parent@evep.com', password: 'demo123' },
      admin: { email: 'admin@evep.com', password: 'demo123' }
    };

    try {
      const response = await fetch('http://localhost:8013/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoCredentials[role as keyof typeof demoCredentials]),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Demo login failed');
      }

      localStorage.setItem('evep_token', data.access_token);
      localStorage.setItem('evep_user', JSON.stringify(data.user));

      toast.success(`Demo login successful! Welcome ${data.user.first_name}`);
      
      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, data.user);
      }

      navigate('/');

    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error('Demo login failed. Please try the regular login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #9B7DCF 0%, #E8BEE8 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <School sx={{ fontSize: 48, color: '#9B7DCF', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#9B7DCF', fontWeight: 600 }}>
            EVEP Platform
          </Typography>
          <Typography variant="body1" color="text.secondary">
            EYE Vision Evaluation Platform
          </Typography>
        </Box>

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#9B7DCF' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#9B7DCF',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9B7DCF',
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#9B7DCF' }} />
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
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#9B7DCF',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9B7DCF',
                },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #9B7DCF 30%, #7B5DBF 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B5DBF 30%, #5B3D9F 90%)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>

        {/* Demo Login Section */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Demo Accounts
          </Typography>
        </Divider>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDemoLogin('doctor')}
            disabled={loading}
            sx={{
              borderColor: '#9B7DCF',
              color: '#9B7DCF',
              '&:hover': {
                borderColor: '#7B5DBF',
                backgroundColor: '#F8EBF8',
              },
            }}
          >
            Doctor
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDemoLogin('teacher')}
            disabled={loading}
            sx={{
              borderColor: '#9B7DCF',
              color: '#9B7DCF',
              '&:hover': {
                borderColor: '#7B5DBF',
                backgroundColor: '#F8EBF8',
              },
            }}
          >
            Teacher
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDemoLogin('parent')}
            disabled={loading}
            sx={{
              borderColor: '#9B7DCF',
              color: '#9B7DCF',
              '&:hover': {
                borderColor: '#7B5DBF',
                backgroundColor: '#F8EBF8',
              },
            }}
          >
            Parent
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDemoLogin('admin')}
            disabled={loading}
            sx={{
              borderColor: '#9B7DCF',
              color: '#9B7DCF',
              '&:hover': {
                borderColor: '#7B5DBF',
                backgroundColor: '#F8EBF8',
              },
            }}
          >
            Admin
          </Button>
        </Box>

        {/* Links */}
        <Box sx={{ textAlign: 'center' }}>
          <Link
            href="#"
            variant="body2"
            sx={{
              color: '#9B7DCF',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Forgot password?
          </Link>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                sx={{
                  color: '#9B7DCF',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
