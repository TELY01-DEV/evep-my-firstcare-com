/**
 * Comprehensive Permissions System
 * Includes all menus, child menus, and screening forms for RBAC role creation
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

/**
 * Complete permission set for all system features
 */
export const COMPREHENSIVE_PERMISSIONS: Permission[] = [
  // ========== DASHBOARD PERMISSIONS ==========
  {
    id: 'dashboard_view',
    name: 'View Dashboard',
    description: 'Access to main dashboard',
    category: 'dashboard',
    resource: 'dashboard',
    action: 'view'
  },
  {
    id: 'analytics_view',
    name: 'View Health Analytics',
    description: 'Access to health analytics and insights',
    category: 'dashboard',
    resource: 'analytics',
    action: 'view'
  },

  // ========== USER MANAGEMENT PERMISSIONS ==========
  {
    id: 'users_view',
    name: 'View Users',
    description: 'View user directory and information',
    category: 'user',
    resource: 'users',
    action: 'view'
  },
  {
    id: 'users_create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'user',
    resource: 'users',
    action: 'create'
  },
  {
    id: 'users_update',
    name: 'Update Users',
    description: 'Edit existing user accounts',
    category: 'user',
    resource: 'users',
    action: 'update'
  },
  {
    id: 'users_delete',
    name: 'Delete Users',
    description: 'Remove user accounts',
    category: 'user',
    resource: 'users',
    action: 'delete'
  },
  {
    id: 'users_manage',
    name: 'Manage Users',
    description: 'Full user management capabilities',
    category: 'user',
    resource: 'users',
    action: 'manage'
  },

  // ========== MEDICAL STAFF PERMISSIONS ==========
  {
    id: 'medical_staff_view',
    name: 'View Medical Staff',
    description: 'View medical staff directory',
    category: 'medical',
    resource: 'medical_staff',
    action: 'view'
  },
  {
    id: 'medical_staff_manage',
    name: 'Manage Medical Staff',
    description: 'Full medical staff management',
    category: 'medical',
    resource: 'medical_staff',
    action: 'manage'
  },

  // ========== PATIENT MANAGEMENT PERMISSIONS ==========
  {
    id: 'patients_view',
    name: 'View Patients',
    description: 'View patient records and information',
    category: 'patient',
    resource: 'patients',
    action: 'view'
  },
  {
    id: 'patients_create',
    name: 'Create Patients',
    description: 'Register new patients',
    category: 'patient',
    resource: 'patients',
    action: 'create'
  },
  {
    id: 'patients_update',
    name: 'Update Patients',
    description: 'Edit patient information',
    category: 'patient',
    resource: 'patients',
    action: 'update'
  },
  {
    id: 'patients_delete',
    name: 'Delete Patients',
    description: 'Remove patient records',
    category: 'patient',
    resource: 'patients',
    action: 'delete'
  },

  // ========== SCHOOL MANAGEMENT PERMISSIONS ==========
  {
    id: 'schools_view',
    name: 'View Schools',
    description: 'View school information',
    category: 'school',
    resource: 'schools',
    action: 'view'
  },
  {
    id: 'schools_manage',
    name: 'Manage Schools',
    description: 'Full school management',
    category: 'school',
    resource: 'schools',
    action: 'manage'
  },
  {
    id: 'students_view',
    name: 'View Students',
    description: 'View student records',
    category: 'school',
    resource: 'students',
    action: 'view'
  },
  {
    id: 'students_manage',
    name: 'Manage Students',
    description: 'Full student management',
    category: 'school',
    resource: 'students',
    action: 'manage'
  },
  {
    id: 'teachers_view',
    name: 'View Teachers',
    description: 'View teacher information',
    category: 'school',
    resource: 'teachers',
    action: 'view'
  },
  {
    id: 'teachers_manage',
    name: 'Manage Teachers',
    description: 'Full teacher management',
    category: 'school',
    resource: 'teachers',
    action: 'manage'
  },
  {
    id: 'parents_view',
    name: 'View Parents',
    description: 'View parent information',
    category: 'school',
    resource: 'parents',
    action: 'view'
  },
  {
    id: 'parents_manage',
    name: 'Manage Parents',
    description: 'Full parent management',
    category: 'school',
    resource: 'parents',
    action: 'manage'
  },

  // ========== SCREENING FORM PERMISSIONS ==========
  {
    id: 'screening_mobile_access',
    name: 'Mobile Vision Screening',
    description: 'Access to mobile vision screening form',
    category: 'screening',
    resource: 'screening_forms',
    action: 'mobile_vision'
  },
  {
    id: 'screening_standard_access',
    name: 'Standard Vision Screening',
    description: 'Access to standard vision screening form',
    category: 'screening',
    resource: 'screening_forms',
    action: 'standard_vision'
  },
  {
    id: 'screening_enhanced_access',
    name: 'Enhanced Screening Interface',
    description: 'Access to enhanced screening tools',
    category: 'screening',
    resource: 'screening_forms',
    action: 'enhanced_interface'
  },
  {
    id: 'screening_va_access',
    name: 'VA Screening Interface',
    description: 'Access to visual acuity screening interface',
    category: 'screening',
    resource: 'screening_forms',
    action: 'va_interface'
  },
  {
    id: 'screening_school_access',
    name: 'School Screening Form',
    description: 'Access to school-based screening form',
    category: 'screening',
    resource: 'screening_forms',
    action: 'school_screening'
  },
  {
    id: 'screening_outcome_access',
    name: 'Screening Outcome Form',
    description: 'Access to screening outcome documentation',
    category: 'screening',
    resource: 'screening_forms',
    action: 'outcome_form'
  },
  {
    id: 'screening_diagnosis_access',
    name: 'Doctor Diagnosis Form',
    description: 'Access to medical diagnosis form',
    category: 'screening',
    resource: 'screening_forms',
    action: 'doctor_diagnosis'
  },

  // ========== SCREENING TYPE PERMISSIONS ==========
  {
    id: 'screening_type_basic',
    name: 'Basic Screening Types',
    description: 'Access to basic screening types (visual acuity, distance, near)',
    category: 'screening',
    resource: 'screening_types',
    action: 'basic'
  },
  {
    id: 'screening_type_advanced',
    name: 'Advanced Screening Types',
    description: 'Access to advanced screening types (comprehensive, color, depth)',
    category: 'screening',
    resource: 'screening_types',
    action: 'advanced'
  },
  {
    id: 'screening_type_specialized',
    name: 'Specialized Screening Types',
    description: 'Access to specialized screening protocols',
    category: 'screening',
    resource: 'screening_types',
    action: 'specialized'
  },
  {
    id: 'screening_type_diagnostic',
    name: 'Diagnostic Screening Types',
    description: 'Access to diagnostic screening tools',
    category: 'screening',
    resource: 'screening_types',
    action: 'diagnostic'
  },

  // ========== SCREENING MANAGEMENT PERMISSIONS ==========
  {
    id: 'screenings_view',
    name: 'View Screenings',
    description: 'View screening sessions and results',
    category: 'screening',
    resource: 'screenings',
    action: 'view'
  },
  {
    id: 'screenings_create',
    name: 'Create Screenings',
    description: 'Start new screening sessions',
    category: 'screening',
    resource: 'screenings',
    action: 'create'
  },
  {
    id: 'screenings_update',
    name: 'Update Screenings',
    description: 'Edit screening sessions and results',
    category: 'screening',
    resource: 'screenings',
    action: 'update'
  },
  {
    id: 'screenings_delete',
    name: 'Delete Screenings',
    description: 'Remove screening sessions',
    category: 'screening',
    resource: 'screenings',
    action: 'delete'
  },
  {
    id: 'screenings_manage',
    name: 'Manage Screenings',
    description: 'Full screening management capabilities',
    category: 'screening',
    resource: 'screenings',
    action: 'manage'
  },

  // ========== MEDICAL REPORTS PERMISSIONS ==========
  {
    id: 'reports_view',
    name: 'View Medical Reports',
    description: 'View medical reports and analytics',
    category: 'medical',
    resource: 'reports',
    action: 'view'
  },
  {
    id: 'reports_create',
    name: 'Generate Medical Reports',
    description: 'Create and generate medical reports',
    category: 'medical',
    resource: 'reports',
    action: 'create'
  },
  {
    id: 'reports_export',
    name: 'Export Medical Reports',
    description: 'Export reports to various formats',
    category: 'medical',
    resource: 'reports',
    action: 'export'
  },

  // ========== INVENTORY MANAGEMENT PERMISSIONS ==========
  {
    id: 'inventory_view',
    name: 'View Inventory',
    description: 'View glasses and equipment inventory',
    category: 'inventory',
    resource: 'inventory',
    action: 'view'
  },
  {
    id: 'inventory_manage',
    name: 'Manage Inventory',
    description: 'Full inventory management',
    category: 'inventory',
    resource: 'inventory',
    action: 'manage'
  },
  {
    id: 'delivery_manage',
    name: 'Manage Deliveries',
    description: 'Track and manage glasses deliveries',
    category: 'inventory',
    resource: 'delivery',
    action: 'manage'
  },

  // ========== SYSTEM ADMINISTRATION PERMISSIONS ==========
  {
    id: 'panel_settings_view',
    name: 'View Panel Settings',
    description: 'View system panel settings',
    category: 'system',
    resource: 'panel_settings',
    action: 'view'
  },
  {
    id: 'panel_settings_manage',
    name: 'Manage Panel Settings',
    description: 'Configure system panel settings',
    category: 'system',
    resource: 'panel_settings',
    action: 'manage'
  },
  {
    id: 'rbac_view',
    name: 'View RBAC',
    description: 'View roles, permissions, and user assignments',
    category: 'system',
    resource: 'rbac',
    action: 'view'
  },
  {
    id: 'rbac_manage',
    name: 'Manage RBAC',
    description: 'Full RBAC management capabilities',
    category: 'system',
    resource: 'rbac',
    action: 'manage'
  },
  {
    id: 'security_audit',
    name: 'Security Audit',
    description: 'Access to security audit and monitoring',
    category: 'system',
    resource: 'security',
    action: 'audit'
  },

  // ========== AI INSIGHTS PERMISSIONS ==========
  {
    id: 'ai_insights_view',
    name: 'View AI Insights',
    description: 'Access to AI-powered insights and analytics',
    category: 'ai',
    resource: 'ai_insights',
    action: 'view'
  },
  {
    id: 'ai_insights_generate',
    name: 'Generate AI Insights',
    description: 'Generate AI-powered analysis and reports',
    category: 'ai',
    resource: 'ai_insights',
    action: 'generate'
  },

  // ========== COMMUNICATION PERMISSIONS ==========
  {
    id: 'line_notifications_view',
    name: 'View LINE Notifications',
    description: 'View LINE notification settings',
    category: 'communication',
    resource: 'line_notifications',
    action: 'view'
  },
  {
    id: 'line_notifications_manage',
    name: 'Manage LINE Notifications',
    description: 'Configure LINE notification system',
    category: 'communication',
    resource: 'line_notifications',
    action: 'manage'
  },

  // ========== APPOINTMENT PERMISSIONS ==========
  {
    id: 'appointments_view',
    name: 'View Appointments',
    description: 'View appointment schedules',
    category: 'scheduling',
    resource: 'appointments',
    action: 'view'
  },
  {
    id: 'appointments_create',
    name: 'Create Appointments',
    description: 'Schedule new appointments',
    category: 'scheduling',
    resource: 'appointments',
    action: 'create'
  },
  {
    id: 'appointments_manage',
    name: 'Manage Appointments',
    description: 'Full appointment management',
    category: 'scheduling',
    resource: 'appointments',
    action: 'manage'
  },

  // ========== MENU ACCESS PERMISSIONS ==========
  {
    id: 'menu_school_management',
    name: 'School Management Menu',
    description: 'Access to school management menu and features',
    category: 'menu',
    resource: 'school_menu',
    action: 'access'
  },
  {
    id: 'menu_medical_screening',
    name: 'Medical Screening Menu',
    description: 'Access to medical screening menu and features',
    category: 'menu',
    resource: 'medical_menu',
    action: 'access'
  },
  {
    id: 'menu_user_management',
    name: 'User Management Menu',
    description: 'Access to user management menu',
    category: 'menu',
    resource: 'user_menu',
    action: 'access'
  },
  {
    id: 'menu_medical_staff',
    name: 'Medical Staff Menu',
    description: 'Access to medical staff menu',
    category: 'menu',
    resource: 'staff_menu',
    action: 'access'
  },
  {
    id: 'menu_inventory',
    name: 'Inventory Menu',
    description: 'Access to inventory management menu',
    category: 'menu',
    resource: 'inventory_menu',
    action: 'access'
  },
  {
    id: 'menu_panel_settings',
    name: 'Panel Settings Menu',
    description: 'Access to panel settings menu',
    category: 'menu',
    resource: 'settings_menu',
    action: 'access'
  },

  // ========== CHILD MENU PERMISSIONS ==========
  {
    id: 'submenu_students',
    name: 'Students Submenu',
    description: 'Access to students management submenu',
    category: 'submenu',
    resource: 'students_submenu',
    action: 'access'
  },
  {
    id: 'submenu_parents',
    name: 'Parents Submenu',
    description: 'Access to parents management submenu',
    category: 'submenu',
    resource: 'parents_submenu',
    action: 'access'
  },
  {
    id: 'submenu_teachers',
    name: 'Teachers Submenu',
    description: 'Access to teachers management submenu',
    category: 'submenu',
    resource: 'teachers_submenu',
    action: 'access'
  },
  {
    id: 'submenu_school_screenings',
    name: 'School Screenings Submenu',
    description: 'Access to school-based screenings submenu',
    category: 'submenu',
    resource: 'school_screenings_submenu',
    action: 'access'
  },
  {
    id: 'submenu_patient_registration',
    name: 'Patient Registration Submenu',
    description: 'Access to patient registration submenu',
    category: 'submenu',
    resource: 'patient_reg_submenu',
    action: 'access'
  },
  {
    id: 'submenu_va_screening',
    name: 'VA Screening Submenu',
    description: 'Access to VA screening submenu',
    category: 'submenu',
    resource: 'va_screening_submenu',
    action: 'access'
  },
  {
    id: 'submenu_diagnosis',
    name: 'Diagnosis Submenu',
    description: 'Access to diagnosis and treatment submenu',
    category: 'submenu',
    resource: 'diagnosis_submenu',
    action: 'access'
  },
  {
    id: 'submenu_glasses_inventory',
    name: 'Glasses Inventory Submenu',
    description: 'Access to glasses inventory submenu',
    category: 'submenu',
    resource: 'glasses_inventory_submenu',
    action: 'access'
  },
  {
    id: 'submenu_glasses_delivery',
    name: 'Glasses Delivery Submenu',
    description: 'Access to glasses delivery submenu',
    category: 'submenu',
    resource: 'glasses_delivery_submenu',
    action: 'access'
  },
  {
    id: 'submenu_general_settings',
    name: 'General Settings Submenu',
    description: 'Access to general settings submenu',
    category: 'submenu',
    resource: 'general_settings_submenu',
    action: 'access'
  },
  {
    id: 'submenu_rbac_management',
    name: 'RBAC Management Submenu',
    description: 'Access to RBAC management submenu',
    category: 'submenu',
    resource: 'rbac_submenu',
    action: 'access'
  },

  // ========== SPECIAL PERMISSIONS ==========
  {
    id: 'admin_panel_access',
    name: 'Admin Panel Access',
    description: 'Access to system administration panel',
    category: 'system',
    resource: 'admin_panel',
    action: 'access'
  },
  {
    id: 'full_system_access',
    name: 'Full System Access',
    description: 'Complete access to all system features',
    category: 'system',
    resource: 'all',
    action: 'all'
  }
];

/**
 * Get permissions by category
 */
export const getPermissionsByCategory = (category?: string): Permission[] => {
  if (!category) return COMPREHENSIVE_PERMISSIONS;
  return COMPREHENSIVE_PERMISSIONS.filter(p => p.category === category);
};

/**
 * Get all available categories
 */
export const getPermissionCategories = (): string[] => {
  return Array.from(new Set(COMPREHENSIVE_PERMISSIONS.map(p => p.category)));
};

/**
 * Check if permission exists
 */
export const hasPermission = (permissionId: string): boolean => {
  return COMPREHENSIVE_PERMISSIONS.some(p => p.id === permissionId);
};

