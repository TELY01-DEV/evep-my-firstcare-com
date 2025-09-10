import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const Register: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('auth.register')}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          {t('auth.register_subtitle')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
