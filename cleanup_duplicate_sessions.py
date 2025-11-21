#!/usr/bin/env python3
"""
Clean Up Duplicate Screening Sessions
Script to identify and clean up duplicate screening sessions via API
"""

import requests
import json
import sys
from datetime import datetime
from collections import defaultdict

# API Configuration
API_BASE_URL = "https://stardust.evep.my-firstcare.com"
API_ENDPOINTS = {
    "auth": f"{API_BASE_URL}/api/v1/auth/login",
    "screenings": f"{API_BASE_URL}/api/v1/screenings/sessions"
}

def get_auth_token():
    """Get authentication token for API access"""
    
    credentials = {"email": "admin@evep.com", "password": "admin123"}
    
    try:
        print(f"🔍 Authenticating with {API_ENDPOINTS['auth']}")
        response = requests.post(API_ENDPOINTS["auth"], json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token") or data.get("jwt")
            if token:
                print(f"✅ Authentication successful")
                return token
        
        print(f"❌ Authentication failed: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Error authenticating: {e}")
        return None

def get_screening_sessions(token):
    """Get all screening sessions"""
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(API_ENDPOINTS["screenings"], headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            sessions = data if isinstance(data, list) else data.get("sessions", [])
            print(f"✅ Retrieved {len(sessions)} screening sessions")
            return sessions
        else:
            print(f"❌ Failed to get sessions: {response.status_code}")
            print(response.text)
            return []
            
    except Exception as e:
        print(f"❌ Error getting sessions: {e}")
        return []

def delete_screening_session(session_id, token):
    """Delete a specific screening session"""
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        delete_url = f"{API_ENDPOINTS['screenings']}/{session_id}"
        response = requests.delete(delete_url, headers=headers)
        
        if response.status_code in [200, 204]:
            print(f"✅ Deleted session {session_id}")
            return True
        else:
            print(f"❌ Failed to delete session {session_id}: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error deleting session {session_id}: {e}")
        return False

def identify_duplicates(sessions):
    """Identify duplicate screening sessions"""
    
    print(f"\n🔍 Analyzing {len(sessions)} sessions for duplicates...")
    
    # Group by patient_id
    patient_sessions = defaultdict(list)
    
    for session in sessions:
        patient_id = session.get('patient_id', 'unknown')
        patient_sessions[patient_id].append(session)
    
    duplicates = []
    
    for patient_id, session_list in patient_sessions.items():
        if len(session_list) > 1:
            # Sort by created_at to identify which to keep
            session_list.sort(key=lambda x: x.get('created_at', ''))
            
            # Keep the most recent completed session, or the first one if none completed
            completed_sessions = [s for s in session_list if s.get('status') == 'completed' or s.get('status') == 'Screening Complete']
            
            if completed_sessions:
                # Keep the most recent completed session
                keep_session = completed_sessions[-1]
                to_delete = [s for s in session_list if s != keep_session]
            else:
                # Keep the most recent session
                keep_session = session_list[-1]
                to_delete = session_list[:-1]
            
            if to_delete:
                duplicates.append({
                    'patient_id': patient_id,
                    'patient_name': session_list[0].get('patient_name', 'Unknown'),
                    'keep': keep_session,
                    'delete': to_delete
                })
    
    return duplicates

def cleanup_duplicates(duplicates, token, dry_run=True):
    """Clean up duplicate sessions"""
    
    print(f"\n🧹 Cleaning up duplicates (Dry Run: {dry_run})...")
    
    total_to_delete = sum(len(d['delete']) for d in duplicates)
    
    if dry_run:
        print(f"\n📋 DRY RUN - Would delete {total_to_delete} duplicate sessions:")
        
        for duplicate in duplicates:
            patient_name = duplicate['patient_name']
            keep_session = duplicate['keep']
            delete_sessions = duplicate['delete']
            
            print(f"\n👤 Patient: {patient_name}")
            print(f"   ✅ KEEP: {keep_session['session_id']} - {keep_session.get('status')} ({keep_session.get('created_at')})")
            print(f"   ❌ DELETE ({len(delete_sessions)} sessions):")
            for session in delete_sessions:
                print(f"      - {session['session_id']} - {session.get('status')} ({session.get('created_at')})")
    
    else:
        print(f"\n🔥 EXECUTING CLEANUP - Deleting {total_to_delete} duplicate sessions...")
        
        deleted_count = 0
        failed_count = 0
        
        for duplicate in duplicates:
            patient_name = duplicate['patient_name']
            delete_sessions = duplicate['delete']
            
            print(f"\n👤 Cleaning {patient_name} - {len(delete_sessions)} duplicates...")
            
            for session in delete_sessions:
                session_id = session.get('session_id', session.get('_id'))
                if delete_screening_session(session_id, token):
                    deleted_count += 1
                else:
                    failed_count += 1
        
        print(f"\n📊 CLEANUP SUMMARY:")
        print(f"   Successfully deleted: {deleted_count}")
        print(f"   Failed to delete: {failed_count}")
        print(f"   Total processed: {deleted_count + failed_count}")

def main():
    """Main function"""
    
    print("🧹 Duplicate Screening Sessions Cleanup Tool")
    print("=" * 50)
    print(f"API Base: {API_BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Check for dry run flag
    dry_run = "--dry-run" in sys.argv or "-d" in sys.argv
    execute = "--execute" in sys.argv or "-e" in sys.argv
    
    if not dry_run and not execute:
        print("\n⚠️  Usage:")
        print("  --dry-run  or -d : Show what would be deleted (safe)")
        print("  --execute  or -e : Actually delete duplicate sessions (dangerous)")
        print("\nRun with --dry-run first to see what would be affected!")
        return
    
    # Get authentication token
    print(f"\n🔐 Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    # Get all screening sessions
    print(f"\n📊 Retrieving screening sessions...")
    sessions = get_screening_sessions(token)
    
    if not sessions:
        print("❌ No sessions found or failed to retrieve sessions")
        return
    
    # Identify duplicates
    duplicates = identify_duplicates(sessions)
    
    if not duplicates:
        print("\n✅ No duplicate sessions found!")
        return
    
    print(f"\n⚠️  Found {len(duplicates)} patients with duplicate sessions:")
    for duplicate in duplicates:
        patient_name = duplicate['patient_name']
        delete_count = len(duplicate['delete'])
        print(f"   - {patient_name}: {delete_count} duplicates to remove")
    
    # Clean up duplicates
    cleanup_duplicates(duplicates, token, dry_run=dry_run)
    
    if dry_run:
        print(f"\n💡 To actually delete the duplicates, run with --execute flag")
    else:
        print(f"\n✅ Cleanup completed!")

if __name__ == "__main__":
    main()