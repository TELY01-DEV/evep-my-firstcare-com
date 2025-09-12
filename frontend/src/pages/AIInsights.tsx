import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Home,
  Psychology,
  CheckCircle,
} from '@mui/icons-material';
import AIInsightDashboard from '../components/AIInsights/AIInsightDashboard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has permission to access AI insights
    const allowedRoles = ['admin', 'doctor', 'medical_staff', 'teacher', 'super_admin'];
    if (user && !allowedRoles.includes(user.role)) {
      setError(t('ai_insights.no_permission'));
    }
  }, [user]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Breadcrumbs */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <Psychology sx={{ mr: 0.5 }} fontSize="inherit" />
            {t('ai_insights.title')}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('ai_insights.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('ai_insights.subtitle')}
        </Typography>
      </Box>

      {/* AI Insights Dashboard */}
      <AIInsightDashboard userRole={user?.role} />
    </Container>
  );
};

export default AIInsights;
