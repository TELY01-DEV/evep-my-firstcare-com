#!/usr/bin/env python3
"""
EVEP Medical Portal - Fix Hardcoded RBAC
Replace all hardcoded role checks with database-based RBAC
"""

import os
import re
from pathlib import Path

def fix_hardcoded_rbac():
    """Fix hardcoded role checks in API files"""
    
    # Files to fix
    api_files = [
        "backend/app/api/dashboard.py",
        "backend/app/api/screenings.py", 
        "backend/app/api/evep.py",
        "backend/app/api/appointments.py",
        "backend/app/api/patients.py"
    ]
    
    fixes_applied = []
    
    for file_path in api_files:
        if not os.path.exists(file_path):
            print(f"⚠️ File not found: {file_path}")
            continue
            
        print(f"🔧 Fixing hardcoded RBAC in: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix 1: Replace user_role == "super_admin" with database check
        content = re.sub(
            r'user_role\s*==\s*["\']super_admin["\']',
            'user_role == "super_admin" or await has_permission_db(user_id, "full_access")',
            content
        )
        
        # Fix 2: Replace user_role != "super_admin" with database check
        content = re.sub(
            r'user_role\s*!=\s*["\']super_admin["\']',
            'user_role != "super_admin" and not await has_permission_db(user_id, "full_access")',
            content
        )
        
        # Fix 3: Replace current_user["role"] == "role_name" with database check
        role_checks = [
            ("teacher", "manage_school_data"),
            ("doctor", "manage_screenings"),
            ("parent", "view_patients"),
            ("admin", "manage_users"),
            ("medical_admin", "manage_medical_data"),
            ("system_admin", "manage_system_settings")
        ]
        
        for role, permission in role_checks:
            # Replace == checks
            pattern = rf'current_user\["role"\]\s*==\s*["\']?{role}["\']?'
            replacement = f'await has_role_db(user_id, "{role}") or await has_permission_db(user_id, "{permission}")'
            content = re.sub(pattern, replacement, content)
            
            # Replace != checks  
            pattern = rf'current_user\["role"\]\s*!=\s*["\']?{role}["\']?'
            replacement = f'not (await has_role_db(user_id, "{role}") or await has_permission_db(user_id, "{permission}"))'
            content = re.sub(pattern, replacement, content)
        
        # Fix 4: Replace "role_name" in user_role_names with database check
        content = re.sub(
            r'["\']teacher["\']\s+in\s+user_role_names',
            'await has_role_db(user_id, "teacher")',
            content
        )
        content = re.sub(
            r'["\']doctor["\']\s+in\s+user_role_names', 
            'await has_role_db(user_id, "doctor")',
            content
        )
        
        # Fix 5: Replace user_role == "role_name" with database check
        for role, permission in role_checks:
            pattern = rf'user_role\s*==\s*["\']?{role}["\']?'
            replacement = f'await has_role_db(user_id, "{role}") or await has_permission_db(user_id, "{permission}")'
            content = re.sub(pattern, replacement, content)
        
        # Fix 6: Replace user_role != "role_name" with database check
        for role, permission in role_checks:
            pattern = rf'user_role\s*!=\s*["\']?{role}["\']?'
            replacement = f'not (await has_role_db(user_id, "{role}") or await has_permission_db(user_id, "{permission}"))'
            content = re.sub(pattern, replacement, content)
        
        # Check if any changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixes_applied.append(file_path)
            print(f"✅ Applied fixes to: {file_path}")
        else:
            print(f"ℹ️ No hardcoded RBAC found in: {file_path}")
    
    return fixes_applied

def add_rbac_imports():
    """Add necessary RBAC imports to files that need them"""
    
    files_to_update = [
        "backend/app/api/dashboard.py",
        "backend/app/api/screenings.py",
        "backend/app/api/evep.py", 
        "backend/app/api/appointments.py",
        "backend/app/api/patients.py"
    ]
    
    import_statement = "from app.core.db_rbac import has_permission_db, has_role_db, get_user_roles_from_db\n"
    
    for file_path in files_to_update:
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if import already exists
        if "from app.core.db_rbac import" in content:
            print(f"ℹ️ RBAC imports already exist in: {file_path}")
            continue
        
        # Add import after other imports
        lines = content.split('\n')
        import_index = -1
        
        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                import_index = i
        
        if import_index >= 0:
            lines.insert(import_index + 1, import_statement.strip())
            content = '\n'.join(lines)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Added RBAC imports to: {file_path}")

def main():
    print("🔧 EVEP Medical Portal - Fix Hardcoded RBAC")
    print("=" * 50)
    
    # Fix hardcoded role checks
    fixes_applied = fix_hardcoded_rbac()
    
    # Add necessary imports
    add_rbac_imports()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    if fixes_applied:
        print(f"✅ Fixed hardcoded RBAC in {len(fixes_applied)} files:")
        for file_path in fixes_applied:
            print(f"   - {file_path}")
    else:
        print("ℹ️ No hardcoded RBAC found to fix")
    
    print("\n🎯 NEXT STEPS:")
    print("1. Copy fixed files to server")
    print("2. Restart backend service")
    print("3. Test database-based RBAC functionality")
    print("4. Verify all role checks use database instead of hardcoded values")

if __name__ == "__main__":
    main()
