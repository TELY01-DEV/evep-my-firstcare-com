// React Error #31 prevention utilities removed - using safer rendering approaches

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import SystemLoadingIndicator from './components/SystemStartup/SystemLoadingIndicator';
import ReactErrorBoundary from './components/ErrorBoundary/ReactErrorBoundary';

// Global Object Renderer removed - using safer rendering approaches

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
import MedicalStaffDirectory from './pages/MedicalStaffDirectory';
import GeneralPanelSettings from './pages/GeneralPanelSettings';
import RBACManagement from './pages/RBACManagement';
import UserManagement from './pages/UserManagement';
import UserDirectory from './pages/UserDirectory';

// RBAC Components
import RBACRoute from './components/RBAC/RBACRoute';

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

// Master Data Pages
import MasterDataManagement from './pages/MasterDataManagement';
import GeolocationsManagement from './pages/GeolocationsManagement';
import HospitalsManagement from './pages/HospitalsManagement';
import VAScreeningInterface from './components/VAScreeningInterface';
import AppointmentScheduler from './components/AppointmentScheduler';
import LineNotificationManager from './components/LineNotificationManager';
// import MedicalStaff from './pages/MedicalStaff';
import GlassesInventoryManagerEnhanced from './components/GlassesInventoryManagerEnhanced';

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
  const [systemReady, setSystemReady] = React.useState(false);
  const [systemError, setSystemError] = React.useState<string | null>(null);
  const [showSystemLoader, setShowSystemLoader] = React.useState(true);

  return (
    <ReactErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={evepTheme}>
              <CssBaseline />
            
            {/* System Loading Indicator */}
            {showSystemLoader && (
              <SystemLoadingIndicator
                onComplete={() => {
                  setSystemReady(true);
                  setShowSystemLoader(false);
                }}
                onError={(error) => {
                  setSystemError(error);
                  setShowSystemLoader(false);
                }}
              />
            )}
            
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
                      
                      {/* School Management Routes - RBAC Protected */}
                      <Route path="evep/parents" element={
                        <RBACRoute requiredPath="/dashboard/evep/parents">
                          <EvepParents />
                        </RBACRoute>
                      } />
                      <Route path="evep/students" element={
                        <RBACRoute requiredPath="/dashboard/evep/students">
                          <EvepStudents />
                        </RBACRoute>
                      } />
                      <Route path="evep/teachers" element={
                        <RBACRoute requiredPath="/dashboard/evep/teachers">
                          <EvepTeachers />
                        </RBACRoute>
                      } />
                      <Route path="evep/schools" element={
                        <RBACRoute requiredPath="/dashboard/evep/schools">
                          <EvepSchools />
                        </RBACRoute>
                      } />
                      <Route path="evep/school-screenings" element={
                        <RBACRoute requiredPath="/dashboard/evep/school-screenings">
                          <EvepSchoolScreenings />
                        </RBACRoute>
                      } />
                      <Route path="evep/appointments" element={
                        <RBACRoute requiredPath="/dashboard/evep/appointments">
                          <AppointmentScheduler />
                        </RBACRoute>
                      } />
                      
                      {/* Medical Screening Routes - RBAC Protected */}
                      <Route path="medical-screening/patient-registration" element={
                        <RBACRoute requiredPath="/dashboard/medical-screening/patient-registration">
                          <StudentToPatientRegistration />
                        </RBACRoute>
                      } />
                      <Route path="medical-screening/va-screening" element={
                        <RBACRoute requiredPath="/dashboard/medical-screening/va-screening">
                          <VAScreeningInterface />
                        </RBACRoute>
                      } />
                      <Route path="medical-screening/diagnosis" element={
                        <RBACRoute requiredPath="/dashboard/medical-screening/diagnosis">
                          <div>Diagnosis & Treatment</div>
                        </RBACRoute>
                      } />
                      
                      {/* Glasses Management Routes - RBAC Protected */}
                      <Route path="glasses-management/inventory" element={
                        <RBACRoute requiredPath="/dashboard/glasses-management/inventory">
                          <GlassesInventoryManagerEnhanced mode="inventory" />
                        </RBACRoute>
                      } />
                      <Route path="glasses-management/delivery" element={
                        <RBACRoute requiredPath="/dashboard/glasses-management/delivery">
                          <GlassesInventoryManagerEnhanced mode="delivery" />
                        </RBACRoute>
                      } />

                      {/* Medical Staff Management Routes - RBAC Protected */}
                      <Route path="medical-staff" element={
                        <RBACRoute requiredPath="/dashboard/medical-staff">
                          <MedicalStaffDirectory />
                        </RBACRoute>
                      } />
                      <Route path="medical-staff/management" element={
                        <RBACRoute requiredPath="/dashboard/medical-staff/management">
                          <MedicalStaff />
                        </RBACRoute>
                      } />
                      
                      {/* LINE Bot Management Routes - RBAC Protected */}
                      <Route path="line-notifications" element={
                        <RBACRoute requiredPath="/dashboard/line-notifications">
                          <LineNotificationManager />
                        </RBACRoute>
                      } />
                      
                      {/* Master Data Routes - RBAC Protected */}
                      <Route path="master-data" element={
                        <RBACRoute requiredPath="/dashboard/master-data">
                          <MasterDataManagement />
                        </RBACRoute>
                      } />
                      <Route path="master-data/geolocations" element={
                        <RBACRoute requiredPath="/dashboard/master-data/geolocations">
                          <GeolocationsManagement />
                        </RBACRoute>
                      } />
                      <Route path="master-data/hospitals" element={
                        <RBACRoute requiredPath="/dashboard/master-data/hospitals">
                          <HospitalsManagement />
                        </RBACRoute>
                      } />
                      
                      {/* Panel Settings Routes - RBAC Protected */}
                      <Route path="panel-settings/general" element={
                        <RBACRoute requiredPath="/dashboard/panel-settings/general">
                          <GeneralPanelSettings />
                        </RBACRoute>
                      } />
                      <Route path="panel-settings/rbac" element={
                        <RBACRoute requiredPath="/dashboard/panel-settings/rbac">
                          <RBACManagement />
                        </RBACRoute>
                      } />
                      
                      {/* User Management Routes - RBAC Protected */}
                      <Route path="user-management" element={
                        <RBACRoute requiredPath="/dashboard/user-management">
                          <UserDirectory />
                        </RBACRoute>
                      } />
                      <Route path="user-management/management" element={
                        <RBACRoute requiredPath="/dashboard/user-management/management">
                          <UserManagement />
                        </RBACRoute>
                      } />
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
      </LanguageProvider>
    </ReactErrorBoundary>
  );
}

export default App;
