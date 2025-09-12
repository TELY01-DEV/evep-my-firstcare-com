import { createTheme } from '@mui/material/styles';

// EVEP Admin Panel Theme - Using EVEP Purple Colors with Dark Variation
const adminTheme = createTheme({
  palette: {
    primary: {
      main: '#7B5DBF', // EVEP Dark Purple - Authority, Professional
      light: '#9B7DCF', // EVEP Primary Purple
      dark: '#5B21B6', // Very Dark Purple
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D8A8D8', // EVEP Dark Pink - Administrative
      light: '#E8BEE8', // EVEP Secondary Pink
      dark: '#A070D0', // EVEP Iris Purple
      contrastText: '#7B5DBF',
    },
    error: {
      main: '#DC2626', // Red for admin alerts
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B', // Amber for warnings
      light: '#FBBF24',
      dark: '#D97706',
    },
    success: {
      main: '#059669', // Green for success
      light: '#10B981',
      dark: '#047857',
    },
    info: {
      main: '#9B7DCF', // EVEP Purple for info
      light: '#A070D0', // EVEP Light Purple
      dark: '#7B5DBF', // EVEP Dark Purple
    },
    background: {
      default: '#1E1B2E', // Dark Purple Background
      paper: '#2D2B3A',
      admin: '#7B5DBF', // Admin-specific background
      card: '#2D2B3A',
      sidebar: '#1E1B2E',
    },
    text: {
      primary: '#F8FAFC', // Light text on dark background
      secondary: '#CBD5E1',
      disabled: '#64748B',
    },
    divider: '#3D3A4A',
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
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Thai", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#F8FAFC',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#F8FAFC',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      color: '#F8FAFC',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#F8FAFC',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#F8FAFC',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
      color: '#F8FAFC',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#F8FAFC',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#CBD5E1',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#94A3B8',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: '#94A3B8',
    },
  },
  shape: {
    borderRadius: 8, // More angular, professional
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(123, 93, 191, 0.3)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(123, 93, 191, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#2D2B3A',
          boxShadow: '0px 1px 3px rgba(123, 93, 191, 0.4), 0px 1px 2px rgba(123, 93, 191, 0.3)',
          border: '1px solid #3D3A4A',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#7B5DBF',
          color: '#F8FAFC',
          boxShadow: '0px 1px 3px rgba(123, 93, 191, 0.4)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E1B2E',
          borderRight: '1px solid #3D3A4A',
          boxShadow: '2px 0px 8px rgba(123, 93, 191, 0.4)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          backgroundColor: '#3D3A4A',
          color: '#F8FAFC',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2D2B3A',
            '& fieldset': {
              borderColor: '#3D3A4A',
            },
            '&:hover fieldset': {
              borderColor: '#475569',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9B7DCF',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#94A3B8',
          },
          '& .MuiInputBase-input': {
            color: '#F8FAFC',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#2D2B3A',
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#3D3A4A',
          '& .MuiTableCell-root': {
            color: '#F8FAFC',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            color: '#F8FAFC',
            borderBottom: '1px solid #3D3A4A',
          },
        },
      },
    },
  },
});

export default adminTheme;
