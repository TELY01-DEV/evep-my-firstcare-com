import { createTheme, ThemeOptions } from '@mui/material/styles';

// EVEP Brand Color Palette (extracted from logo)
const evepColors = {
  // Primary EVEP Blue - Main brand color
  primary: {
    main: '#1E3A8A', // EVEP Primary Blue
    light: '#3B82F6', // Light Blue
    dark: '#1E40AF', // Dark Blue
    contrastText: '#FFFFFF',
  },
  
  // Secondary EVEP Teal - Accent color
  secondary: {
    main: '#0F766E', // EVEP Teal
    light: '#14B8A6', // Light Teal
    dark: '#0D5A52', // Dark Teal
    contrastText: '#FFFFFF',
  },
  
  // Success Green - Health, Recovery, Positive Results
  success: {
    main: '#2E7D32', // Medical Green
    light: '#4CAF50', // Light Green
    dark: '#1B5E20', // Dark Green
    contrastText: '#FFFFFF',
  },
  
  // Warning Orange - Caution, Attention Required
  warning: {
    main: '#F57C00', // Medical Orange
    light: '#FF9800', // Light Orange
    dark: '#E65100', // Dark Orange
    contrastText: '#FFFFFF',
  },
  
  // Error Red - Critical Issues, Alerts
  error: {
    main: '#D32F2F', // Medical Red
    light: '#F44336', // Light Red
    dark: '#C62828', // Dark Red
    contrastText: '#FFFFFF',
  },
  
  // Neutral Grays - Professional, Clean
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background Colors
  background: {
    default: '#F5F5F5', // Light Gray
    paper: '#FFFFFF',
    secondary: '#EEEEEE', // Lighter Gray
    medical: '#E3F2FD', // Medical Light Blue
  },
  
  // Text Colors
  text: {
    primary: '#212121', // Dark Gray
    secondary: '#757575', // Medium Gray
    disabled: '#BDBDBD', // Light Gray
    medical: '#1565C0', // Medical Blue
  },
};

// Medical Professional Typography
const medicalTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  
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

// Create the EVEP theme
const evepTheme = createTheme({
  palette: evepColors,
  typography: medicalTypography,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

export default evepTheme;
