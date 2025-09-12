import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const Reports: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('reports.title')}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          {t('reports.subtitle')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Reports;
