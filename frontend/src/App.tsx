import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Patients from './pages/Patients';
import Screenings from './pages/Screenings';
import Reports from './pages/Reports';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Create theme based on EVEP logo colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#9B7DCF', // Main accent purple from logo
      light: '#A070D0', // Iris purple
      dark: '#7B5DBF', // Darker purple
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E8BEE8', // Secondary accent pink from logo
      light: '#F8EBF8', // Background pink
      dark: '#D8A8D8', // Darker pink
      contrastText: '#9B7DCF',
    },
    background: {
      default: '#F8EBF8', // Very light pink/lavender background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#9B7DCF', // Main purple for text
      secondary: '#7B5DBF', // Darker purple for secondary text
    },
    // Custom colors can be accessed via theme.palette.primary, secondary, etc.
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Thai", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
    h2: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
    h3: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
    h4: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
    h5: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
    h6: {
      color: '#9B7DCF',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          backgroundColor: '#9B7DCF',
          '&:hover': {
            backgroundColor: '#7B5DBF',
          },
        },
        outlined: {
          borderColor: '#9B7DCF',
          color: '#9B7DCF',
          '&:hover': {
            borderColor: '#7B5DBF',
            backgroundColor: '#F8EBF8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(155, 125, 207, 0.1)',
          border: '1px solid rgba(155, 125, 207, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#9B7DCF',
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="screenings" element={<Screenings />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
