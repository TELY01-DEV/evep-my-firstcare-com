import { createTheme, ThemeOptions } from '@mui/material/styles';

// EVEP Medical Portal Theme - Using Original EVEP Purple Colors
const evepColors = {
  // Primary EVEP Purple - Main brand color
  primary: {
    main: '#9B7DCF', // EVEP Primary Purple
    light: '#A070D0', // EVEP Iris Purple
    dark: '#7B5DBF', // EVEP Dark Purple
    contrastText: '#FFFFFF',
  },
  
  // Secondary EVEP Pink - Accent color
  secondary: {
    main: '#E8BEE8', // EVEP Secondary Pink
    light: '#F8EBF8', // EVEP Light Pink
    dark: '#D8A8D8', // EVEP Dark Pink
    contrastText: '#7B5DBF',
  },
  
  // Success Green - Health, Recovery, Positive Results
  success: {
    main: '#059669', // Medical Green
    light: '#10B981', // Light Green
    dark: '#047857', // Dark Green
    contrastText: '#FFFFFF',
  },
  
  // Warning Orange - Caution, Attention Required
  warning: {
    main: '#D97706', // Medical Orange
    light: '#F59E0B', // Light Orange
    dark: '#B45309', // Dark Orange
    contrastText: '#FFFFFF',
  },
  
  // Error Red - Critical Issues, Medical Alerts
  error: {
    main: '#DC2626', // Medical Red
    light: '#EF4444', // Light Red
    dark: '#B91C1C', // Dark Red
    contrastText: '#FFFFFF',
  },
  
  // Info Purple - EVEP Information
  info: {
    main: '#9B7DCF', // EVEP Purple for info
    light: '#A070D0', // EVEP Light Purple
    dark: '#7B5DBF', // EVEP Dark Purple
    contrastText: '#FFFFFF',
  },
  
  // Neutral Grays - Clean, Professional
  grey: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  
  // Background Colors - Soft, EVEP-Friendly
  background: {
    default: '#F8EBF8', // EVEP Light Pink Background
    paper: '#FFFFFF',
    secondary: '#F1F5F9', // Light Gray
    medical: '#EFF6FF', // Medical Light Blue
    card: '#FFFFFF',
    sidebar: '#F8EBF8', // EVEP Light Pink
  },
  
  // Text Colors - EVEP Professional
  text: {
    primary: '#1E293B', // Dark Blue-Gray
    secondary: '#64748B', // Medium Gray
    disabled: '#94A3B8', // Light Gray
    medical: '#9B7DCF', // EVEP Purple
    success: '#059669', // Medical Green
    warning: '#D97706', // Medical Orange
    error: '#DC2626', // Medical Red
  },
  
  // Divider Colors
  divider: '#E2E8F0',
};

// EVEP Professional Typography
const evepTypography = {
  fontFamily: '"Inter", "Noto Sans Thai", "Roboto", "Helvetica", "Arial", sans-serif',
  
  // EVEP Professional Headings
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: evepColors.text.primary,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    color: evepColors.text.primary,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: evepColors.text.primary,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: evepColors.text.primary,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: evepColors.text.primary,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: evepColors.text.primary,
    lineHeight: 1.5,
  },
  
  // EVEP Professional Body Text
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    color: evepColors.text.primary,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    color: evepColors.text.secondary,
    lineHeight: 1.6,
  },
  
  // EVEP Professional Buttons
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.025em',
  },
  
  // EVEP Professional Captions
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    color: evepColors.text.secondary,
    lineHeight: 1.5,
  },
  
  // EVEP Professional Overline
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: evepColors.text.secondary,
  },
};

// Create the EVEP Medical Portal theme
const evepTheme = createTheme({
  palette: evepColors,
  typography: evepTypography,
  shape: {
    borderRadius: 12, // Softer, more EVEP-friendly
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(155, 125, 207, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(155, 125, 207, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 1px 3px rgba(155, 125, 207, 0.1), 0px 1px 2px rgba(155, 125, 207, 0.06)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: evepColors.text.primary,
          boxShadow: '0px 1px 3px rgba(155, 125, 207, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: evepColors.background.sidebar,
          borderRight: '1px solid #E2E8F0',
          boxShadow: '2px 0px 8px rgba(155, 125, 207, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default evepTheme;
