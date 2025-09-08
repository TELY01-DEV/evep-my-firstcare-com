/**
 * RBAC Configuration for Screening Types and Dropdowns
 * Defines which roles can access which screening types
 */

export interface ScreeningTypeConfig {
  value: string;
  label: string;
  roles: string[];
  description: string;
  category: 'basic' | 'advanced' | 'specialized' | 'diagnostic';
}

/**
 * Comprehensive screening type configurations with RBAC
 */
export const SCREENING_TYPES_RBAC: ScreeningTypeConfig[] = [
  // Basic Screening Types - Available to medical staff and teachers
  {
    value: 'visual_acuity',
    label: 'Visual Acuity Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Basic vision clarity testing',
    category: 'basic'
  },
  {
    value: 'mobile',
    label: 'Mobile Unit Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Field-based mobile screening',
    category: 'basic'
  },
  {
    value: 'distance',
    label: 'Distance Vision Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Distance visual acuity testing',
    category: 'basic'
  },
  {
    value: 'near',
    label: 'Near Vision Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Near vision testing',
    category: 'basic'
  },

  // Advanced Screening Types - Medical staff only
  {
    value: 'comprehensive',
    label: 'Comprehensive Eye Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Complete eye examination',
    category: 'advanced'
  },
  {
    value: 'comprehensive_ophthalmic',
    label: 'Comprehensive Ophthalmic Examination',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Full ophthalmic assessment',
    category: 'advanced'
  },
  {
    value: 'color',
    label: 'Color Vision Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Color blindness testing',
    category: 'advanced'
  },
  {
    value: 'color_vision_deficiency',
    label: 'Color Vision Deficiency Assessment',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Detailed color vision assessment',
    category: 'advanced'
  },
  {
    value: 'depth',
    label: 'Depth Perception Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Stereoscopic vision testing',
    category: 'advanced'
  },
  {
    value: 'stereoacuity',
    label: 'Stereoacuity (Depth Perception) Test',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Precise depth perception measurement',
    category: 'advanced'
  },

  // Specialized Screening Types - Medical professionals only
  {
    value: 'enhanced',
    label: 'Enhanced Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Advanced screening with comprehensive tools',
    category: 'specialized'
  },

  // Diagnostic Screening Types - Doctors only
  {
    value: 'diagnostic',
    label: 'Diagnostic Screening',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor'],
    description: 'Medical diagnostic screening',
    category: 'diagnostic'
  },

  // Legacy Types - Maintained for compatibility
  {
    value: 'legacy_comprehensive',
    label: 'Legacy Comprehensive',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse'],
    description: 'Legacy comprehensive screening protocol',
    category: 'advanced'
  },
  {
    value: 'legacy_basic',
    label: 'Legacy Basic',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff', 'teacher'],
    description: 'Legacy basic screening protocol',
    category: 'basic'
  },
  {
    value: 'legacy_color',
    label: 'Legacy Color',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Legacy color vision testing',
    category: 'advanced'
  },
  {
    value: 'legacy_depth',
    label: 'Legacy Depth',
    roles: ['super_admin', 'admin', 'medical_admin', 'doctor', 'nurse', 'medical_staff'],
    description: 'Legacy depth perception testing',
    category: 'advanced'
  }
];

/**
 * Filter screening types based on user role
 */
export const getAvailableScreeningTypes = (userRole: string): ScreeningTypeConfig[] => {
  return SCREENING_TYPES_RBAC.filter(screeningType => 
    screeningType.roles.includes(userRole)
  );
};

/**
 * Check if user can access a specific screening type
 */
export const canAccessScreeningType = (userRole: string, screeningValue: string): boolean => {
  const screeningConfig = SCREENING_TYPES_RBAC.find(st => st.value === screeningValue);
  return screeningConfig ? screeningConfig.roles.includes(userRole) : false;
};

/**
 * Get screening types by category for a role
 */
export const getScreeningTypesByCategory = (userRole: string, category?: string) => {
  let availableTypes = getAvailableScreeningTypes(userRole);
  
  if (category) {
    availableTypes = availableTypes.filter(st => st.category === category);
  }
  
  return availableTypes;
};

/**
 * Get screening type categories available to a role
 */
export const getAvailableCategories = (userRole: string): string[] => {
  const availableTypes = getAvailableScreeningTypes(userRole);
  const categories = Array.from(new Set(availableTypes.map(st => st.category)));
  return categories;
};

