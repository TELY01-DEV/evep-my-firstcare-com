# Comprehensive permissions master data for RBAC system
COMPREHENSIVE_PERMISSIONS = [
    # System Administration
    {"id": "system_admin_full", "name": "Full System Administration", "description": "Complete system administration access", "category": "system", "resource": "system", "action": "admin"},
    {"id": "system_settings_manage", "name": "Manage System Settings", "description": "Configure system-wide settings", "category": "system", "resource": "settings", "action": "manage"},
    {"id": "system_logs_view", "name": "View System Logs", "description": "Access system logs and audit trails", "category": "system", "resource": "logs", "action": "view"},
    {"id": "system_backup_manage", "name": "Manage System Backups", "description": "Create and restore system backups", "category": "system", "resource": "backup", "action": "manage"},
    
    # User Management
    {"id": "user_create", "name": "Create Users", "description": "Create new user accounts", "category": "user", "resource": "users", "action": "create"},
    {"id": "user_read", "name": "View Users", "description": "View user account information", "category": "user", "resource": "users", "action": "read"},
    {"id": "user_update", "name": "Update Users", "description": "Modify user account details", "category": "user", "resource": "users", "action": "update"},
    {"id": "user_delete", "name": "Delete Users", "description": "Remove user accounts", "category": "user", "resource": "users", "action": "delete"},
    {"id": "user_roles_assign", "name": "Assign User Roles", "description": "Assign and modify user roles", "category": "user", "resource": "user_roles", "action": "assign"},
    
    # RBAC Management
    {"id": "rbac_roles_create", "name": "Create Roles", "description": "Create new roles in the system", "category": "rbac", "resource": "roles", "action": "create"},
    {"id": "rbac_roles_read", "name": "View Roles", "description": "View role definitions and permissions", "category": "rbac", "resource": "roles", "action": "read"},
    {"id": "rbac_roles_update", "name": "Update Roles", "description": "Modify role definitions and permissions", "category": "rbac", "resource": "roles", "action": "update"},
    {"id": "rbac_roles_delete", "name": "Delete Roles", "description": "Remove roles from the system", "category": "rbac", "resource": "roles", "action": "delete"},
    {"id": "rbac_permissions_manage", "name": "Manage Permissions", "description": "Create and modify system permissions", "category": "rbac", "resource": "permissions", "action": "manage"},
    
    # Medical Staff Management
    {"id": "medical_staff_create", "name": "Create Medical Staff", "description": "Add new medical staff members", "category": "medical", "resource": "staff", "action": "create"},
    {"id": "medical_staff_read", "name": "View Medical Staff", "description": "View medical staff information", "category": "medical", "resource": "staff", "action": "read"},
    {"id": "medical_staff_update", "name": "Update Medical Staff", "description": "Modify medical staff details", "category": "medical", "resource": "staff", "action": "update"},
    {"id": "medical_staff_delete", "name": "Delete Medical Staff", "description": "Remove medical staff members", "category": "medical", "resource": "staff", "action": "delete"},
    
    # Patient Management
    {"id": "patient_create", "name": "Create Patients", "description": "Register new patients", "category": "patient", "resource": "patients", "action": "create"},
    {"id": "patient_read", "name": "View Patients", "description": "Access patient information", "category": "patient", "resource": "patients", "action": "read"},
    {"id": "patient_update", "name": "Update Patients", "description": "Modify patient records", "category": "patient", "resource": "patients", "action": "update"},
    {"id": "patient_delete", "name": "Delete Patients", "description": "Remove patient records", "category": "patient", "resource": "patients", "action": "delete"},
    {"id": "patient_medical_history", "name": "Access Medical History", "description": "View patient medical history", "category": "patient", "resource": "medical_history", "action": "read"},
    
    # Screening Management
    {"id": "screening_create", "name": "Create Screenings", "description": "Create new screening sessions", "category": "screening", "resource": "screenings", "action": "create"},
    {"id": "screening_read", "name": "View Screenings", "description": "Access screening data and results", "category": "screening", "resource": "screenings", "action": "read"},
    {"id": "screening_update", "name": "Update Screenings", "description": "Modify screening information", "category": "screening", "resource": "screenings", "action": "update"},
    {"id": "screening_delete", "name": "Delete Screenings", "description": "Remove screening records", "category": "screening", "resource": "screenings", "action": "delete"},
    {"id": "screening_results_manage", "name": "Manage Screening Results", "description": "Input and modify screening results", "category": "screening", "resource": "screening_results", "action": "manage"},
    
    # Screening Types
    {"id": "screening_type_comprehensive", "name": "Comprehensive Screening", "description": "Access comprehensive eye screening", "category": "screening", "resource": "screening_types", "action": "comprehensive"},
    {"id": "screening_type_distance", "name": "Distance Vision Screening", "description": "Access distance vision screening", "category": "screening", "resource": "screening_types", "action": "distance"},
    {"id": "screening_type_near", "name": "Near Vision Screening", "description": "Access near vision screening", "category": "screening", "resource": "screening_types", "action": "near"},
    {"id": "screening_type_color", "name": "Color Vision Screening", "description": "Access color vision screening", "category": "screening", "resource": "screening_types", "action": "color"},
    {"id": "screening_type_depth", "name": "Depth Perception Screening", "description": "Access depth perception screening", "category": "screening", "resource": "screening_types", "action": "depth"},
    {"id": "screening_type_binocular", "name": "Binocular Vision Screening", "description": "Access binocular vision screening", "category": "screening", "resource": "screening_types", "action": "binocular"},
    {"id": "screening_type_diagnostic", "name": "Diagnostic Screening", "description": "Access diagnostic screening types", "category": "screening", "resource": "screening_types", "action": "diagnostic"},
    {"id": "screening_type_mobile", "name": "Mobile Unit Screening", "description": "Access mobile unit screening", "category": "screening", "resource": "screening_types", "action": "mobile"},
    {"id": "screening_type_standard", "name": "Standard Vision Screening", "description": "Access standard vision screening", "category": "screening", "resource": "screening_types", "action": "standard"},
    {"id": "screening_type_enhanced", "name": "Enhanced Screening", "description": "Access enhanced screening options", "category": "screening", "resource": "screening_types", "action": "enhanced"},
    
    # School Management
    {"id": "school_create", "name": "Create Schools", "description": "Register new schools", "category": "school", "resource": "schools", "action": "create"},
    {"id": "school_read", "name": "View Schools", "description": "Access school information", "category": "school", "resource": "schools", "action": "read"},
    {"id": "school_update", "name": "Update Schools", "description": "Modify school details", "category": "school", "resource": "schools", "action": "update"},
    {"id": "school_delete", "name": "Delete Schools", "description": "Remove school records", "category": "school", "resource": "schools", "action": "delete"},
    {"id": "school_students_manage", "name": "Manage School Students", "description": "Manage students within schools", "category": "school", "resource": "students", "action": "manage"},
    {"id": "school_teachers_manage", "name": "Manage School Teachers", "description": "Manage teachers within schools", "category": "school", "resource": "teachers", "action": "manage"},
    {"id": "school_screenings_manage", "name": "Manage School Screenings", "description": "Organize screenings for schools", "category": "school", "resource": "school_screenings", "action": "manage"},
    
    # Inventory Management
    {"id": "inventory_create", "name": "Create Inventory Items", "description": "Add new inventory items", "category": "inventory", "resource": "inventory", "action": "create"},
    {"id": "inventory_read", "name": "View Inventory", "description": "Access inventory information", "category": "inventory", "resource": "inventory", "action": "read"},
    {"id": "inventory_update", "name": "Update Inventory", "description": "Modify inventory items", "category": "inventory", "resource": "inventory", "action": "update"},
    {"id": "inventory_delete", "name": "Delete Inventory Items", "description": "Remove inventory items", "category": "inventory", "resource": "inventory", "action": "delete"},
    {"id": "inventory_glasses_manage", "name": "Manage Glasses Inventory", "description": "Manage glasses and frames inventory", "category": "inventory", "resource": "glasses", "action": "manage"},
    
    # Reporting
    {"id": "reports_create", "name": "Create Reports", "description": "Generate new reports", "category": "reporting", "resource": "reports", "action": "create"},
    {"id": "reports_read", "name": "View Reports", "description": "Access existing reports", "category": "reporting", "resource": "reports", "action": "read"},
    {"id": "reports_export", "name": "Export Reports", "description": "Export reports in various formats", "category": "reporting", "resource": "reports", "action": "export"},
    {"id": "reports_analytics", "name": "Access Analytics", "description": "View analytics and insights", "category": "reporting", "resource": "analytics", "action": "read"},
    {"id": "reports_ai_insights", "name": "AI Insights Access", "description": "Access AI-generated insights and recommendations", "category": "reporting", "resource": "ai_insights", "action": "read"},
    
    # Appointments
    {"id": "appointments_create", "name": "Create Appointments", "description": "Schedule new appointments", "category": "appointment", "resource": "appointments", "action": "create"},
    {"id": "appointments_read", "name": "View Appointments", "description": "Access appointment schedules", "category": "appointment", "resource": "appointments", "action": "read"},
    {"id": "appointments_update", "name": "Update Appointments", "description": "Modify appointment details", "category": "appointment", "resource": "appointments", "action": "update"},
    {"id": "appointments_delete", "name": "Cancel Appointments", "description": "Cancel or remove appointments", "category": "appointment", "resource": "appointments", "action": "delete"},
    
    # LINE Bot Management
    {"id": "linebot_settings_manage", "name": "Manage LINE Bot Settings", "description": "Configure LINE Bot settings and features", "category": "integration", "resource": "linebot", "action": "manage"},
    {"id": "linebot_messages_send", "name": "Send LINE Bot Messages", "description": "Send messages through LINE Bot", "category": "integration", "resource": "linebot_messages", "action": "send"},
    {"id": "linebot_users_manage", "name": "Manage LINE Bot Users", "description": "Manage LINE Bot user interactions", "category": "integration", "resource": "linebot_users", "action": "manage"},
    
    # Panel Settings
    {"id": "panel_settings_view", "name": "View Panel Settings", "description": "Access panel configuration settings", "category": "system", "resource": "panel_settings", "action": "read"},
    {"id": "panel_settings_update", "name": "Update Panel Settings", "description": "Modify panel configuration", "category": "system", "resource": "panel_settings", "action": "update"},
    
    # File Management
    {"id": "files_upload", "name": "Upload Files", "description": "Upload files to the system", "category": "system", "resource": "files", "action": "upload"},
    {"id": "files_download", "name": "Download Files", "description": "Download files from the system", "category": "system", "resource": "files", "action": "download"},
    {"id": "files_delete", "name": "Delete Files", "description": "Remove files from the system", "category": "system", "resource": "files", "action": "delete"},
]
