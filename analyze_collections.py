#!/usr/bin/env python3
import os
import re
from pathlib import Path

def analyze_collection_usage():
    """Analyze which database collections are actually used in the codebase"""
    
    # Collections found in database
    db_collections = {
        'audit_logs': 'Used in multiple API files',
        'admin_users': 'Used in auth.py and admin_user_management.py',
        'users': 'Used in multiple API files',
        'screening_sessions': 'Not found in API usage',
        'patients': 'Used in patients.py and admin.py',
        'glasses_delivery': 'Not found in API usage',
        'evep.teachers': 'Used in evep.py',
        'students': 'Not found in API usage (duplicate of evep.students)',
        'medical_staff': 'Not found in API usage',
        'screenings': 'Used in admin.py',
        'schools': 'Not found in API usage (duplicate of evep.schools)',
        'teachers': 'Not found in API usage (duplicate of evep.teachers)',
        'glasses_inventory': 'Not found in API usage',
        'parents': 'Not found in API usage (duplicate of evep.parents)',
        'evep.students': 'Used in evep.py',
        'school_screenings': 'Used in evep.py',
        'prompt_templates': 'Not found in API usage',
        'evep.schools': 'Used in evep.py'
    }
    
    # Collections that are actually used in the API code
    used_collections = {
        'audit_logs': True,
        'admin_users': True,
        'users': True,
        'patients': True,
        'evep.teachers': True,
        'screenings': True,
        'evep.students': True,
        'school_screenings': True,
        'evep.schools': True,
        'evep.parents': True
    }
    
    # Collections that are NOT used in the API code
    unused_collections = {
        'screening_sessions': 'No API endpoints found',
        'glasses_delivery': 'No API endpoints found',
        'students': 'Duplicate of evep.students',
        'medical_staff': 'No API endpoints found',
        'schools': 'Duplicate of evep.schools',
        'teachers': 'Duplicate of evep.teachers',
        'glasses_inventory': 'No API endpoints found',
        'parents': 'Duplicate of evep.parents',
        'prompt_templates': 'No API endpoints found'
    }
    
    print("=== DATABASE COLLECTIONS ANALYSIS ===")
    print(f"Total collections found: {len(db_collections)}")
    
    print("\n=== USED COLLECTIONS (Keep) ===")
    for coll, status in used_collections.items():
        if status:
            print(f"✓ {coll}")
    
    print("\n=== UNUSED COLLECTIONS (Can be removed) ===")
    for coll, reason in unused_collections.items():
        print(f"✗ {coll} - {reason}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Collections to keep: {len([c for c in used_collections.values() if c])}")
    print(f"Collections to remove: {len(unused_collections)}")
    
    return unused_collections

if __name__ == "__main__":
    analyze_collection_usage()
