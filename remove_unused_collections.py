#!/usr/bin/env python3
from pymongo import MongoClient
import sys

def remove_unused_collections():
    """Remove unused database collections"""
    
    # Collections to remove
    collections_to_remove = [
        'screening_sessions',
        'glasses_delivery', 
        'students',  # Duplicate of evep.students
        'medical_staff',
        'schools',   # Duplicate of evep.schools
        'teachers',  # Duplicate of evep.teachers
        'glasses_inventory',
        'parents',   # Duplicate of evep.parents
        'prompt_templates'
    ]
    
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://mongo-primary:27017')
        db = client.evep
        
        print("=== REMOVING UNUSED COLLECTIONS ===")
        
        for collection_name in collections_to_remove:
            if collection_name in db.list_collection_names():
                # Get document count before removal
                count = db[collection_name].count_documents({})
                print(f"Removing {collection_name} ({count} documents)...")
                
                # Drop the collection
                db[collection_name].drop()
                print(f"✓ Successfully removed {collection_name}")
            else:
                print(f"⚠ {collection_name} not found, skipping...")
        
        print("\n=== VERIFICATION ===")
        remaining_collections = db.list_collection_names()
        print(f"Remaining collections: {len(remaining_collections)}")
        for coll in remaining_collections:
            count = db[coll].count_documents({})
            print(f"- {coll}: {count} documents")
        
        client.close()
        print("\n✓ Cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ask for confirmation
    print("⚠️  WARNING: This will permanently delete unused database collections!")
    print("Collections to be removed:")
    print("- screening_sessions")
    print("- glasses_delivery") 
    print("- students (duplicate)")
    print("- medical_staff")
    print("- schools (duplicate)")
    print("- teachers (duplicate)")
    print("- glasses_inventory")
    print("- parents (duplicate)")
    print("- prompt_templates")
    
    response = input("\nDo you want to continue? (yes/no): ")
    if response.lower() == 'yes':
        remove_unused_collections()
    else:
        print("Operation cancelled.")
