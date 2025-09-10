// Centralized API Configuration Constants
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://portal.evep.my-firstcare.com';
export const CDN_URL = process.env.REACT_APP_CDN_URL || 'https://cdn.evep.my-firstcare.com';
export const ADMIN_PANEL_URL = process.env.REACT_APP_ADMIN_PANEL_URL || 'https://admin.evep.my-firstcare.com';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://socketio.evep.my-firstcare.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  PROFILE: `${API_BASE_URL}/api/v1/auth/me`,
  PROFILE_AVATAR: `${API_BASE_URL}/api/v1/auth/profile/avatar`,
  
  // User Management
  USER_MANAGEMENT: `${API_BASE_URL}/api/v1/user-management`,
  USER_STATS: `${API_BASE_URL}/api/v1/user-management/statistics/overview`,
  
  // Medical Staff
  MEDICAL_STAFF: `${API_BASE_URL}/api/v1/medical-staff-management`,
  
  // Screenings
  SCREENINGS_SESSIONS: `${API_BASE_URL}/api/v1/screenings/sessions`,
  
  // Patients
  PATIENTS: `${API_BASE_URL}/api/v1/patients`,
  PATIENTS_SEARCH: `${API_BASE_URL}/api/v1/patients/search`,
  
  // EVEP Data
  EVEP_STUDENTS: `${API_BASE_URL}/api/v1/evep/students`,
  EVEP_SCHOOLS: `${API_BASE_URL}/api/v1/evep/schools`,
  EVEP_TEACHERS: `${API_BASE_URL}/api/v1/evep/teachers`,
  EVEP_PARENTS: `${API_BASE_URL}/api/v1/evep/parents`,
  EVEP_SCHOOL_SCREENINGS: `${API_BASE_URL}/school-screenings-data`,
  
  // Appointments
  APPOINTMENTS: `${API_BASE_URL}/api/v1/appointments`,
  
  // Inventory
  INVENTORY_GLASSES: `${API_BASE_URL}/api/v1/inventory/glasses`,
  
  // Panel Settings
  PANEL_SETTINGS: `${API_BASE_URL}/api/v1/panel-settings`,
  
  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/api/v1/dashboard/stats`,
  
  // Admin
  ADMIN_STATS: `${API_BASE_URL}/api/v1/admin/stats`,
  ADMIN_USERS: `${API_BASE_URL}/api/v1/admin/users`,
  ADMIN_SETTINGS: `${API_BASE_URL}/api/v1/admin/settings`,
  ADMIN_PANEL_USERS: `${API_BASE_URL}/api/v1/admin/panel-users`,
  ADMIN_SECURITY: `${API_BASE_URL}/api/v1/admin/security`,
  
  // AI Insights
  AI_INSIGHTS: `${API_BASE_URL}/api/v1/ai-insights`,
  
  // RBAC
  RBAC_ROLES: `${API_BASE_URL}/api/v1/rbac/roles`,
  RBAC_PERMISSIONS: `${API_BASE_URL}/api/v1/rbac/permissions`,
  RBAC_USER_ROLES: `${API_BASE_URL}/api/v1/rbac/user-roles`,
  
  // Logs
  LOGS: `${API_BASE_URL}/api/v1/logs`,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get API endpoint with base URL
export const getApiEndpoint = (path: string): string => {
  return `${API_BASE_URL}/api/v1${path}`;
};
