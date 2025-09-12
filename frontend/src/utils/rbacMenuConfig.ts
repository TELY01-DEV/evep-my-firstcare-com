/**
 * RBAC Menu Configuration
 * Defines which roles can access which menu items and child menus
 */

export interface MenuPermission {
  roles: string[];
  requiredPermissions?: string[];
  description?: string;
}

export interface RBACMenuConfig {
  [menuPath: string]: MenuPermission;
}

/**
 * RBAC Configuration for all menu items and child menus
 * Each menu item specifies which roles have access
 */
export const RBAC_MENU_CONFIG: RBACMenuConfig = {
  // Dashboard - Available to all authenticated users
  '/dashboard': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'teacher', 'medical_staff', 'executive', 'parent'],
    description: 'Main dashboard access'
  },

  // Health Analytics - Medical staff and above
  '/dashboard/analytics': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'executive'],
    description: 'Health analytics and insights'
  },

  // School Management - Admin and educational staff
  '/dashboard/evep': {
    roles: ['super_admin', 'admin', 'system_admin', 'teacher', 'executive'],
    description: 'School management overview'
  },

  // School Management Child Menus
  '/dashboard/evep/students': {
    roles: ['super_admin', 'admin', 'system_admin', 'teacher', 'medical_admin', 'doctor', 'nurse'],
    description: 'Student records management'
  },

  '/dashboard/evep/parents': {
    roles: ['super_admin', 'admin', 'system_admin', 'teacher', 'executive'],
    description: 'Parent information management'
  },

  '/dashboard/evep/teachers': {
    roles: ['super_admin', 'admin', 'system_admin', 'executive'],
    description: 'Teacher management'
  },

  '/dashboard/evep/schools': {
    roles: ['super_admin', 'admin', 'system_admin', 'executive'],
    description: 'School information management'
  },

  '/dashboard/evep/school-screenings': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'teacher'],
    description: 'School-based screening sessions'
  },

  '/dashboard/evep/appointments': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'teacher'],
    description: 'Appointment scheduling'
  },

  // Medical Screening - Medical staff
  '/dashboard/medical-screening': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Medical screening overview'
  },

  // Medical Screening Child Menus
  '/dashboard/reports': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'executive'],
    description: 'Medical reports generation'
  },

  '/dashboard/patients': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Patient management'
  },


  '/dashboard/medical-screening/patient-registration': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Patient registration'
  },

  '/dashboard/medical-screening/va-screening': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Visual acuity screening'
  },

  '/dashboard/medical-screening/diagnosis': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor'],
    description: 'Medical diagnosis tools'
  },

  // User Management - Admin roles only
  '/dashboard/user-management': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'User management overview'
  },

  '/dashboard/user-management/management': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'User CRUD operations'
  },

  // Medical Staff Management - Admin and medical admin
  '/dashboard/medical-staff': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin'],
    description: 'Medical staff overview'
  },

  '/dashboard/medical-staff/management': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin'],
    description: 'Medical staff management'
  },

  // Inventory Management - Admin and medical staff
  '/dashboard/inventory': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Inventory overview'
  },

  '/dashboard/glasses-management/inventory': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Glasses inventory management'
  },

  '/dashboard/glasses-management/delivery': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin'],
    description: 'Glasses delivery tracking'
  },

  // Master Data Management - Medical staff and above
  '/dashboard/master-data': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Master data management overview'
  },

  '/dashboard/master-data/geolocations': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Geographic data management'
  },

  '/dashboard/master-data/hospitals': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Hospital data management'
  },

  // Panel Settings - Admin roles only
  '/dashboard/panel-settings': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'Panel settings overview'
  },

  '/dashboard/panel-settings/general': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'General panel configuration'
  },

  '/dashboard/panel-settings/rbac': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'RBAC management'
  },

  // LINE Notifications - Admin and communication staff
  '/dashboard/line-notifications': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin', 'executive'],
    description: 'LINE notification management'
  },

  // AI Insights - Medical staff and above
  '/dashboard/ai-insights': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'executive'],
    description: 'AI-powered insights'
  },

  // Security Audit - Admin roles only
  '/dashboard/security': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'Security audit and monitoring'
  },

  // Admin Panel - System admin only
  '/admin': {
    roles: ['super_admin', 'system_admin'],
    description: 'System administration panel'
  },

  // ========== SCREENING FORMS RBAC CONFIGURATION ==========
  
  // Main Screening Interface - Medical staff and teachers
  '/dashboard/screenings': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Main vision screening interface'
  },

  // Mobile Vision Screening Form - Medical staff and teachers
  '/screening/mobile-vision': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Mobile vision screening form for field use'
  },

  // Standard Vision Screening Form - Medical staff only
  '/screening/standard-vision': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Standard vision screening protocol'
  },

  // Enhanced Screening Interface - Medical professionals only
  '/screening/enhanced-interface': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Advanced screening interface with comprehensive tools'
  },

  // VA Screening Interface - Medical professionals and trained staff
  '/screening/va-interface': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Visual acuity screening interface'
  },

  // School Screening Form - Teachers and medical staff
  '/screening/school-screening': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'School-based screening form for teachers'
  },

  // Screening Outcome Form - Medical professionals only
  '/screening/outcome-form': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Screening outcome documentation and recommendations'
  },

  // Screening Results Display - Medical staff and teachers
  '/screening/results-display': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'View and display screening results'
  },

  // Doctor Diagnosis Form - Doctors only
  '/screening/doctor-diagnosis': {
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor'],
    description: 'Medical diagnosis and treatment recommendations'
  },

  // Screening Management - Admin and medical admin
  '/screening/management': {
    roles: ['super_admin', 'admin', 'system_admin', 'medical_admin'],
    description: 'Screening session management and oversight'
  },

  // Screening Analytics - Medical admin and above
  '/screening/analytics': {
    roles: ['super_admin', 'admin', 'medical_admin', 'executive'],
    description: 'Screening statistics and analytics'
  },

  // Screening Configuration - Admin only
  '/screening/configuration': {
    roles: ['super_admin', 'admin', 'system_admin'],
    description: 'Screening system configuration and settings'
  }
};

/**
 * Check if user has access to a specific menu item
 */
export const hasMenuAccess = (userRole: string, menuPath: string): boolean => {
  const menuConfig = RBAC_MENU_CONFIG[menuPath];
  
  if (!menuConfig) {
    // If no RBAC config exists, default to admin access only
    return ['super_admin', 'admin', 'system_admin'].includes(userRole);
  }
  
  return menuConfig.roles.includes(userRole);
};

/**
 * Filter menu items based on user role
 */
export const filterMenuByRole = (menuItems: any[], userRole: string): any[] => {
  return menuItems.filter(item => {
    // Check main menu access
    const hasMainAccess = hasMenuAccess(userRole, item.path);
    
    if (!hasMainAccess) {
      return false;
    }
    
    // Filter child menus if they exist
    if (item.children) {
      item.children = item.children.filter((child: any) => 
        hasMenuAccess(userRole, child.path)
      );
      
      // If no children are accessible, hide the parent menu
      if (item.children.length === 0) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Get menu access summary for a role
 */
export const getMenuAccessSummary = (userRole: string): { accessible: string[], restricted: string[] } => {
  const accessible: string[] = [];
  const restricted: string[] = [];
  
  Object.entries(RBAC_MENU_CONFIG).forEach(([path, config]) => {
    if (config.roles.includes(userRole)) {
      accessible.push(path);
    } else {
      restricted.push(path);
    }
  });
  
  return { accessible, restricted };
};

/**
 * Role hierarchy for inheritance (higher roles inherit lower role permissions)
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  'super_admin': ['admin', 'system_admin', 'medical_admin', 'doctor', 'nurse', 'teacher', 'medical_staff', 'executive', 'parent'],
  'admin': ['medical_admin', 'doctor', 'nurse', 'teacher', 'medical_staff', 'executive'],
  'system_admin': ['medical_admin', 'doctor', 'nurse', 'teacher', 'medical_staff'],
  'medical_admin': ['doctor', 'nurse', 'medical_staff'],
  'doctor': ['nurse', 'medical_staff'],
  'nurse': ['medical_staff'],
  'executive': ['teacher'],
  'teacher': [],
  'medical_staff': [],
  'parent': []
};

/**
 * Check if user role has hierarchical access
 */
export const hasHierarchicalAccess = (userRole: string, requiredRole: string): boolean => {
  if (userRole === requiredRole) {
    return true;
  }
  
  const hierarchy = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  return hierarchy ? hierarchy.includes(requiredRole) : false;
};
