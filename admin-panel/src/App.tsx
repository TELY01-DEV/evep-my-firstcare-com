import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AdminAuthProvider } from './contexts/AdminAuthContext.tsx';

// Components
import AdminLayout from './components/Layout/AdminLayout.tsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';

// Pages
import Dashboard from './pages/Dashboard.tsx';
// import UserManagement from './pages/UserManagement';
import AdminUserManagement from './pages/AdminUserManagement.tsx';
import MedicalUserManagement from './pages/MedicalUserManagement.tsx';
import SystemSettings from './pages/SystemSettings.tsx';
import UserProfileSettings from './pages/UserProfileSettings.tsx';
import ParentsManagement from './pages/ParentsManagement.tsx';
import StudentsManagement from './pages/StudentsManagement.tsx';
import TeachersManagement from './pages/TeachersManagement.tsx';
import SchoolsManagement from './pages/SchoolsManagement.tsx';
import SchoolScreeningsManagement from './pages/SchoolScreeningsManagement.tsx';
import SecurityAudit from './pages/SecurityAudit.tsx';
import DatabaseManagement from './pages/DatabaseManagement.tsx';
import SystemMonitoring from './pages/SystemMonitoring.tsx';

// import BackupRecovery from './pages/BackupRecovery';
// import LineBotManager from './components/LineBotManager';

// Theme
import adminTheme from './theme/adminTheme.ts';

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
    <AdminAuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={adminTheme}>
          <CssBaseline />
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected admin routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  {/* <Route path="users" element={<UserManagement />} /> */}
                  <Route path="admin-users" element={<AdminUserManagement />} />
                  <Route path="medical-users" element={<MedicalUserManagement />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="profile" element={<UserProfileSettings />} />
                  <Route path="parents" element={<ParentsManagement />} />
                          <Route path="evep/students" element={<StudentsManagement />} />
        <Route path="evep/parents" element={<ParentsManagement />} />
        <Route path="evep/teachers" element={<TeachersManagement />} />
        <Route path="evep/schools" element={<SchoolsManagement />} />
        <Route path="evep/school-screenings" element={<SchoolScreeningsManagement />} />
        <Route path="evep/relationships" element={<div>Teacher-Student Relationships</div>} />
        

        
        <Route path="security" element={<SecurityAudit />} />
        <Route path="database" element={<DatabaseManagement />} />
        <Route path="monitoring" element={<SystemMonitoring />} />
                  {/* <Route path="backup" element={<BackupRecovery />} /> */}
                  {/* <Route path="line-bot" element={<LineBotManager />} /> */}
                </Route>

                {/* Redirect root to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
    </AdminAuthProvider>
  );
}

export default App;



