import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import MedicalReports from './pages/MedicalReports';
import AIInsights from './pages/AIInsights';
import SecurityAudit from './components/SecurityAudit';
import MedicalStaff from './pages/MedicalStaff';
import GeneralPanelSettings from './pages/GeneralPanelSettings';
import RBACManagement from './pages/RBACManagement';
import UserManagement from './pages/UserManagement';

// Admin Pages
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminPanelUserManagement from './pages/AdminPanelUserManagement';
import AdminSettings from './pages/AdminSettings';
import AdminSecurity from './pages/AdminSecurity';

// School Management Pages
import EvepParents from './pages/EvepParents';
import EvepStudents from './pages/EvepStudents';
import EvepTeachers from './pages/EvepTeachers';
import EvepSchools from './pages/EvepSchools';
import EvepSchoolScreenings from './pages/EvepSchoolScreenings';
import StudentToPatientRegistration from './components/StudentToPatientRegistration';
import VAScreeningInterface from './components/VAScreeningInterface';
import AppointmentScheduler from './components/AppointmentScheduler';
import LineNotificationManager from './components/LineNotificationManager';
// import MedicalStaff from './pages/MedicalStaff';
import GlassesInventoryManager from './components/GlassesInventoryManager';

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
                <Route path="/login" element={<Auth />} />
                
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
                      <Route path="user-management" element={<AdminUserManagement />} />
                      <Route path="admin-users" element={<AdminPanelUserManagement />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="security" element={<AdminSecurity />} />
                    </Route>
                    
                    {/* Dashboard route for admin portal - redirect to admin dashboard */}
                    <Route path="/dashboard" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="patients" element={<Navigate to="/admin" replace />} />
                      <Route path="screenings" element={<Navigate to="/admin" replace />} />
                      <Route path="reports" element={<Navigate to="/admin" replace />} />
                      <Route path="ai-insights" element={<Navigate to="/admin" replace />} />
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
                      <Route path="patients/new" element={<Patients autoOpenAddDialog={true} />} />
                      <Route path="screenings" element={<Screenings />} />
                      <Route path="reports" element={<MedicalReports />} />
                      <Route path="ai-insights" element={<AIInsights />} />
                      <Route path="analytics" element={<AIInsights />} />
                      <Route path="security" element={<SecurityAudit />} />
                      
                      {/* School Management Routes */}
                      <Route path="evep/parents" element={<EvepParents />} />
                      <Route path="evep/students" element={<EvepStudents />} />
                      <Route path="evep/teachers" element={<EvepTeachers />} />
                      <Route path="evep/schools" element={<EvepSchools />} />
                      <Route path="evep/school-screenings" element={<EvepSchoolScreenings />} />
                      <Route path="evep/appointments" element={<AppointmentScheduler />} />
                      
                      {/* Medical Screening Routes */}
                      <Route path="medical-screening/patient-registration" element={<StudentToPatientRegistration />} />
                      <Route path="medical-screening/va-screening" element={<VAScreeningInterface />} />
                      <Route path="medical-screening/diagnosis" element={<div>Diagnosis & Treatment</div>} />
                      
                      {/* Glasses Management Routes */}
                              <Route path="glasses-management/inventory" element={<GlassesInventoryManager mode="inventory" />} />
        <Route path="glasses-management/delivery" element={<GlassesInventoryManager mode="delivery" />} />
                      
                      {/* Medical Staff Management Routes */}
                      <Route path="medical-staff" element={<MedicalStaff />} />
                      <Route path="medical-staff/management" element={<MedicalStaff />} />
                      
                      {/* LINE Bot Management Routes */}
                      <Route path="line-notifications" element={<LineNotificationManager />} />
                      
                      {/* Panel Settings Routes */}
                      <Route path="panel-settings/general" element={<GeneralPanelSettings />} />
                      <Route path="panel-settings/rbac" element={<RBACManagement />} />
                      
                      {/* User Management Routes */}
                      <Route path="user-management" element={<UserManagement />} />
                    </Route>

                    {/* Admin routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="user-management" element={<AdminUserManagement />} />
                      <Route path="admin-users" element={<AdminPanelUserManagement />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="security" element={<AdminSecurity />} />
                      
                      {/* School Management Routes */}
                      <Route path="evep/parents" element={<EvepParents />} />
                      <Route path="evep/students" element={<EvepStudents />} />
                      <Route path="evep/teachers" element={<EvepTeachers />} />
                      <Route path="evep/schools" element={<EvepSchools />} />
                      <Route path="evep/school-screenings" element={<EvepSchoolScreenings />} />
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
