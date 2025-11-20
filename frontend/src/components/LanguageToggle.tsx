import React from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: 'en' | 'th') => {
    setLanguage(newLanguage);
    handleClose();
  };

  const getLanguageLabel = (lang: 'en' | 'th') => {
    switch (lang) {
      case 'en':
        return t('language.english');
      case 'th':
        return t('language.thai');
      default:
        return lang;
    }
  };

  const getLanguageFlag = (lang: 'en' | 'th') => {
    switch (lang) {
      case 'en':
        return '🇺🇸';
      case 'th':
        return '🇹🇭';
      default:
        return '🌐';
    }
  };

  return (
    <>
      <Tooltip title={t('nav.language')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            ml: 1,
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 160,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
        >
          <ListItemIcon>
            <Box sx={{ fontSize: '1.2rem' }}>🇺🇸</Box>
          </ListItemIcon>
          <ListItemText 
            primary={t('language.english')}
            secondary={language === 'en' ? t('language.current') : undefined}
          />
          {language === 'en' && (
            <CheckIcon sx={{ ml: 1, color: 'primary.main' }} />
          )}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleLanguageChange('th')}
          selected={language === 'th'}
        >
          <ListItemIcon>
            <Box sx={{ fontSize: '1.2rem' }}>🇹🇭</Box>
          </ListItemIcon>
          <ListItemText 
            primary={t('language.thai')}
            secondary={language === 'th' ? t('language.current') : undefined}
          />
          {language === 'th' && (
            <CheckIcon sx={{ ml: 1, color: 'primary.main' }} />
          )}
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageToggle;
