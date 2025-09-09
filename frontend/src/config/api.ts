// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8014',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'http://localhost:3014',
    adminPanelUrl: process.env.REACT_APP_ADMIN_PANEL_URL || 'http://localhost:3015',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:9014'
  },
  production: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'https://portal.evep.my-firstcare.com',
    cdnUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.evep.my-firstcare.com',
    adminPanelUrl: process.env.REACT_APP_ADMIN_PANEL_URL || 'https://admin.evep.my-firstcare.com',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'https://socketio.evep.my-firstcare.com'
  }
};

// Detect environment - Force production mode for deployed application
const isProduction = true; // Always use production config for deployed application
const currentConfig = API_CONFIG.production;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${currentConfig.baseUrl}/api/v1/auth/login`,
  REGISTER: `${currentConfig.baseUrl}/api/v1/auth/register`,
  PROFILE: `${currentConfig.baseUrl}/api/v1/auth/me`,
  PROFILE_AVATAR: `${currentConfig.baseUrl}/api/v1/auth/profile/avatar`,
  
  // User Management
  USER_MANAGEMENT: `${currentConfig.baseUrl}/api/v1/user-management`,
  USER_STATS: `${currentConfig.baseUrl}/api/v1/user-management/statistics/overview`,
  
  // Medical Staff
  MEDICAL_STAFF: `${currentConfig.baseUrl}/api/v1/medical-staff-management`,
  
  // Screenings
  SCREENINGS_SESSIONS: `${currentConfig.baseUrl}/api/v1/screenings/sessions`,
  
  // Patients
  PATIENTS: `${currentConfig.baseUrl}/api/v1/patients`,
  PATIENTS_SEARCH: `${currentConfig.baseUrl}/api/v1/patients/search`,
  
  // EVEP Data
  EVEP_STUDENTS: `${currentConfig.baseUrl}/api/v1/evep/students`,
  EVEP_SCHOOLS: `${currentConfig.baseUrl}/api/v1/evep/schools`,
  EVEP_TEACHERS: `${currentConfig.baseUrl}/api/v1/evep/teachers`,
  EVEP_PARENTS: `${currentConfig.baseUrl}/api/v1/evep/parents`,
  EVEP_SCHOOL_SCREENINGS: `${currentConfig.baseUrl}/api/v1/evep/school-screenings`,
  
  // Appointments
  APPOINTMENTS: `${currentConfig.baseUrl}/api/v1/appointments`,
  
  // Inventory
  INVENTORY_GLASSES: `${currentConfig.baseUrl}/api/v1/inventory/glasses`,
  
  // Panel Settings
  PANEL_SETTINGS: `${currentConfig.baseUrl}/api/v1/panel-settings`,
  
  // Dashboard
  DASHBOARD_STATS: `${currentConfig.baseUrl}/api/v1/dashboard/stats`,
  
  // Admin
  ADMIN_STATS: `${currentConfig.baseUrl}/api/v1/admin/stats`,
  ADMIN_USERS: `${currentConfig.baseUrl}/api/v1/admin/users`,
  ADMIN_SETTINGS: `${currentConfig.baseUrl}/api/v1/admin/settings`,
  ADMIN_PANEL_USERS: `${currentConfig.baseUrl}/api/v1/admin/panel-users`,
  ADMIN_SECURITY: `${currentConfig.baseUrl}/api/v1/admin/security`,
  
  // AI Insights
  AI_INSIGHTS: `${currentConfig.baseUrl}/api/v1/ai-insights`,
  
  // RBAC
  RBAC_ROLES: `${currentConfig.baseUrl}/api/v1/rbac/roles`,
  RBAC_PERMISSIONS: `${currentConfig.baseUrl}/api/v1/rbac/permissions`,
  RBAC_USER_ROLES: `${currentConfig.baseUrl}/api/v1/rbac/user-roles`,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${currentConfig.baseUrl}${endpoint}`;
};

// Export current config for use in components
export const API_CONFIG_CURRENT = currentConfig;

export default API_ENDPOINTS;
