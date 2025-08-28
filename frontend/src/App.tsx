import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Patients from './pages/Patients';
import Screenings from './pages/Screenings';
import Reports from './pages/Reports';

// Admin Pages
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminSettings from './pages/AdminSettings';
import AdminSecurity from './pages/AdminSecurity';

// Components
import MedicalLayout from './components/Layout/MedicalLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import LoginRedirect from './components/Auth/LoginRedirect';

// EVEP Theme
import evepTheme from './theme/medicalTheme';
import { getPortalConfig, isAdminPortal, getPortalNavigation } from './utils/portalConfig';

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
  const portalConfig = getPortalConfig();
  const isAdmin = isAdminPortal();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={evepTheme}>
          <CssBaseline />
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Root path - redirect to login or dashboard */}
                <Route path="/" element={<LoginRedirect />} />
                
                {isAdmin ? (
                  // Admin Portal Routes - Only show admin interface
                  <>
                    {/* Admin routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="security" element={<AdminSecurity />} />
                    </Route>
                    
                    {/* Redirect root to admin dashboard for admin portal */}
                    <Route path="/dashboard" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                    </Route>
                  </>
                ) : (
                  // Medical Portal Routes - Show medical interface with admin access
                  <>
                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <MedicalLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Dashboard />} />
                      <Route path="patients" element={<Patients />} />
                      <Route path="screenings" element={<Screenings />} />
                      <Route path="reports" element={<Reports />} />
                    </Route>

                    {/* Admin routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="security" element={<AdminSecurity />} />
                    </Route>
                  </>
                )}
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
    </AuthProvider>
  );
}

export default App;
