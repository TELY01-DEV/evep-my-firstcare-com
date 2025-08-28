// Portal Configuration Utility
// This utility helps determine which portal type is being used
// and provides configuration for different portal environments

export interface PortalConfig {
  type: 'admin' | 'medical';
  title: string;
  description: string;
  features: string[];
  allowedRoles: string[];
}

const ADMIN_PORTAL_CONFIG: PortalConfig = {
  type: 'admin',
  title: 'EVEP Admin Portal',
  description: 'Administrative interface for EVEP platform management',
  features: [
    'User Management',
    'System Statistics',
    'Audit Logs',
    'Security Settings',
    'Platform Configuration'
  ],
  allowedRoles: ['admin']
};

const MEDICAL_PORTAL_CONFIG: PortalConfig = {
  type: 'medical',
  title: 'EVEP Medical Portal',
  description: 'Medical interface for vision screening and patient management',
  features: [
    'Patient Management',
    'Vision Screening',
    'Reports & Analytics',
    'Communication Tools',
    'Medical Records'
  ],
  allowedRoles: ['doctor', 'teacher', 'parent', 'admin']
};

// Check if current environment is admin portal
export const isAdminPortal = (): boolean => {
  // Check environment variable
  if (process.env.REACT_APP_PORTAL_TYPE === 'admin') {
    return true;
  }
  
  // Check URL for admin subdomain
  if (typeof window !== 'undefined' && window.location.hostname.includes('admin.')) {
    return true;
  }
  
  // Check URL path
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return true;
  }
  
  // Default to medical portal
  return false;
};

// Determine portal type based on environment or configuration
export const getPortalConfig = (): PortalConfig => {
  // Check if we're in admin portal mode
  // This could be determined by:
  // 1. Environment variable
  // 2. URL subdomain
  // 3. Configuration file
  // 4. User preference
  
  const isAdmin = isAdminPortal();
  
  return isAdmin ? ADMIN_PORTAL_CONFIG : MEDICAL_PORTAL_CONFIG;
};

// Get portal-specific navigation items
export const getPortalNavigation = () => {
  const config = getPortalConfig();
  
  if (config.type === 'admin') {
    return [
      { label: 'Dashboard', path: '/admin', icon: 'Dashboard' },
      { label: 'Users', path: '/admin/users', icon: 'People' },
      { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
      { label: 'Security', path: '/admin/security', icon: 'Security' },
      { label: 'Audit Logs', path: '/admin/audit', icon: 'History' },
    ];
  } else {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
      { label: 'Patients', path: '/dashboard/patients', icon: 'People' },
      { label: 'Screenings', path: '/dashboard/screenings', icon: 'Assessment' },
      { label: 'Reports', path: '/dashboard/reports', icon: 'Analytics' },
      { label: 'Admin', path: '/admin', icon: 'AdminPanelSettings' },
    ];
  }
};

// Get portal-specific theme configuration
export const getPortalTheme = () => {
  const config = getPortalConfig();
  
  if (config.type === 'admin') {
    return {
      primaryColor: '#1E3A8A', // EVEP Blue
      secondaryColor: '#0F766E', // EVEP Teal
      accentColor: '#DC2626', // Red for admin
      backgroundColor: '#F8FAFC',
    };
  } else {
    return {
      primaryColor: '#1E3A8A', // EVEP Blue
      secondaryColor: '#0F766E', // EVEP Teal
      accentColor: '#059669', // Green for medical
      backgroundColor: '#F0F9FF',
    };
  }
};

// Check if user has access to current portal
export const hasPortalAccess = (userRole: string): boolean => {
  const config = getPortalConfig();
  return config.allowedRoles.includes(userRole);
};

// Get portal-specific page title
export const getPortalTitle = (): string => {
  const config = getPortalConfig();
  return config.title;
};

// Get portal-specific description
export const getPortalDescription = (): string => {
  const config = getPortalConfig();
  return config.description;
};
